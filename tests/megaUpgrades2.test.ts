import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// Upgrade #17 Imports
import {
  compareScenarios,
  buildUnifiedTimeline,
  buildDigitalTwinExport,
  exportTimelineToCsv,
  DEFAULT_SCENARIOS,
} from '../src/lib/digitalTwin/digitalTwin2Service'

// Upgrade #18 Imports
import {
  createFitnessGroup,
  joinFitnessGroupByCode,
  leaveFitnessGroup,
  reportContent,
  blockUser,
  unblockUser,
  getBlockedUserIds,
  claimChallengeRewardIdempotent,
  getLeaderboard,
  saveUserPrivacySettings,
  getActivityFeed,
  publishActivity,
} from '../src/lib/social/socialService'

// Upgrade #19 Imports
import {
  SUPPORTED_PROVIDERS,
  parseHealthExportData,
  getWearableProviders,
  disconnectWearable,
} from '../src/lib/wearables/wearableService'

// Upgrade #20 Imports
import {
  buildDailyPlan,
  isInsideQuietHours,
  toggleTaskCompletion,
  getCompletedTaskIds,
} from '../src/lib/daily-plan/dailyPlanService'

describe('YashFit Mega Upgrade Pack #17–#20 Test Suite', () => {
  // =========================================================================
  // UPGRADE #17: FITNESS DIGITAL TWIN 2.0
  // =========================================================================
  describe('Upgrade #17: Fitness Digital Twin 2.0', () => {
    it('compares multi-scenario training matrices deterministically', () => {
      const matrix = compareScenarios(DEFAULT_SCENARIOS)
      assert.equal(matrix.scenarios.length, 3)
      assert.equal(matrix.metrics.length, 3)

      const fourDay = matrix.metrics.find((m) => m.weeklyFrequency === 4)
      assert.ok(fourDay)
      assert.ok(fourDay.weeklyVolumeSets > 0)
      assert.ok(fourDay.weeklyMinutes > 0)
      assert.equal(fourDay.restDays, 3)
      assert.ok(['optimal', 'moderate', 'high_fatigue', 'low'].includes(fourDay.projectedWeeklyStimulus))
      assert.ok(fourDay.limitations.length >= 2)
    })

    it('builds unified chronological timeline with measured-vs-estimated flags', () => {
      const timeline = buildUnifiedTimeline('test-user-id')
      assert.ok(Array.isArray(timeline))
      assert.ok(timeline.length > 0)

      timeline.forEach((event) => {
        assert.ok(event.id)
        assert.ok(event.date)
        assert.ok(event.title)
        assert.ok(typeof event.isMeasured === 'boolean')
        assert.ok(['workout', 'measurement', 'recovery', 'nutrition', 'milestone'].includes(event.category))
      })
    })

    it('exports complete Digital Twin bundle (JSON) and spreadsheet (CSV)', () => {
      const exportData = buildDigitalTwinExport('test-user-id')
      assert.equal(typeof exportData.exportedAt, 'string')
      assert.ok(exportData.disclaimer.includes('Digital Twin'))
      assert.ok(Array.isArray(exportData.savedScenarios))
      assert.ok(Array.isArray(exportData.timelineEvents))

      const csv = exportTimelineToCsv(exportData.timelineEvents)
      assert.ok(csv.startsWith('"Date","Category","Title"'))
      assert.ok(csv.includes('Measured (Actual)'))
    })
  })

  // =========================================================================
  // UPGRADE #18: SOCIAL FITNESS UNIVERSE
  // =========================================================================
  describe('Upgrade #18: Social Fitness Universe', () => {
    it('creates private groups and validates join invite codes', () => {
      const groupName = 'Bangalore Powerlifters'
      const group = createFitnessGroup(groupName, 'Elite compound lifting squad', true)
      assert.equal(group.name, groupName)
      assert.equal(group.isPrivate, true)
      assert.ok(group.inviteCode.length >= 6)
      assert.equal(group.role, 'admin')

      // Attempt join with wrong code
      const failJoin = joinFitnessGroupByCode('INVALID-CODE-XYZ')
      assert.equal(failJoin.success, false)

      // Attempt join with correct code
      const goodJoin = joinFitnessGroupByCode(group.inviteCode)
      assert.equal(goodJoin.success, true)
    })

    it('enforces idempotent challenge rewards without duplicate XP', () => {
      const testChallengeId = 'chal-30-day-titan'
      const testUserId = `user-${Date.now()}`

      // First claim should succeed
      const firstClaim = claimChallengeRewardIdempotent(testChallengeId, testUserId)
      assert.equal(firstClaim.success, true)
      assert.ok(firstClaim.xpAwarded > 0)

      // Second claim with identical ID and user must be safely rejected
      const secondClaim = claimChallengeRewardIdempotent(testChallengeId, testUserId)
      assert.equal(secondClaim.success, false)
      assert.equal(secondClaim.xpAwarded, 0)
      assert.ok(secondClaim.message.includes('already been claimed'))
    })

    it('supports moderation reporting, user blocking, and feed exclusion', () => {
      const badUserId = 'spammer-user-999'
      const report = reportContent('user', badUserId, 'Spam or promotional', 'Posting external supplement links')
      assert.ok(report.id)
      assert.equal(report.targetId, badUserId)
      assert.equal(report.reason, 'Spam or promotional')

      // Block user
      blockUser(badUserId)
      assert.ok(getBlockedUserIds().includes(badUserId))

      // Unblock user
      unblockUser(badUserId)
      assert.ok(!getBlockedUserIds().includes(badUserId))
    })

    it('masks identity in leaderboard when anonymousInLeaderboard is enabled', () => {
      saveUserPrivacySettings({
        profileVisibility: 'public',
        showOnLeaderboards: true,
        allowFriendRequests: true,
        shareWorkoutActivity: true,
        shareAchievements: true,
        hideSpecificMetrics: true,
        anonymousInLeaderboard: true,
      })

      const board = getLeaderboard('weekly_xp')
      const currentUser = board.find((entry) => entry.isCurrentUser)
      assert.ok(currentUser)
      assert.equal(currentUser.username, 'Anonymous Athlete #772')
    })
  })

  // =========================================================================
  // UPGRADE #19: WEARABLE INTELLIGENCE HUB
  // =========================================================================
  describe('Upgrade #19: Wearable Intelligence Hub', () => {
    it('defines supported providers directory with honest disconnected states', () => {
      const providers = getWearableProviders()
      assert.equal(providers.length, 7)

      const providerIds = providers.map((p) => p.id)
      assert.ok(providerIds.includes('apple_health'))
      assert.ok(providerIds.includes('google_health_connect'))
      assert.ok(providerIds.includes('fitbit'))
      assert.ok(providerIds.includes('garmin'))
      assert.ok(providerIds.includes('whoop'))
      assert.ok(providerIds.includes('oura'))
      assert.ok(providerIds.includes('strava'))

      // Garmin, Whoop, Fitbit without API keys must not claim connected
      const fitbit = providers.find((p) => p.id === 'fitbit')
      assert.ok(fitbit)
      assert.equal(fitbit.isConfiguredOnServer, false)
      assert.ok(fitbit.connectionInstructions.length >= 2)
    })

    it('parses valid biometric export data without fabricating fake numbers', () => {
      const rawJson = JSON.stringify([
        {
          date: '2026-10-25',
          steps: 11420,
          resting_hr: 58,
          sleep_hours: 8.2,
          calories: 520,
        },
        {
          date: '2026-10-26',
          steps: 9800,
          resting_hr: 61,
          sleep_hours: 7.4,
          calories: 460,
        },
      ])

      const result = parseHealthExportData(rawJson, 'apple_health')
      assert.equal(result.success, true)
      assert.equal(result.recordsCount, 2)
      assert.equal(result.importedDays, 2)
      assert.equal(result.provider, 'apple_health')
    })

    it('safely rejects corrupt or empty health export files', () => {
      const corruptData = 'This is not a JSON or CSV export file'
      const result = parseHealthExportData(corruptData, 'google_health_connect')
      assert.equal(result.success, false)
      assert.equal(result.recordsCount, 0)
    })
  })

  // =========================================================================
  // UPGRADE #20: FITNESS LIFE AUTOPILOT
  // =========================================================================
  describe('Upgrade #20: Fitness Life Autopilot', () => {
    it('synthesizes unified daily agenda across morning, midday, evening, and night', () => {
      const plan = buildDailyPlan(new Date('2026-10-28T10:00:00Z'))
      assert.ok(plan.date)
      assert.ok(plan.workoutTitle)
      assert.ok(plan.readinessScore !== undefined)
      assert.ok(plan.dailyCalorieTarget > 0)
      assert.ok(plan.dailyProteinTargetGrams > 0)
      assert.ok(plan.dailyWaterTargetLiters > 0)
      assert.ok(plan.tasks.length >= 6)

      const periods = new Set(plan.tasks.map((t) => t.period))
      assert.ok(periods.has('morning'))
      assert.ok(periods.has('midday'))
      assert.ok(periods.has('night'))

      const categories = new Set(plan.tasks.map((t) => t.category))
      assert.ok(categories.has('workout'))
      assert.ok(categories.has('nutrition'))
      assert.ok(categories.has('hydration'))
      assert.ok(categories.has('recovery'))
    })

    it('accurately evaluates quiet hours crossings spanning midnight', () => {
      // Quiet hours from 22:00 to 07:00
      assert.equal(isInsideQuietHours('23:30', '22:00', '07:00'), true)
      assert.equal(isInsideQuietHours('05:15', '22:00', '07:00'), true)
      assert.equal(isInsideQuietHours('12:00', '22:00', '07:00'), false)
      assert.equal(isInsideQuietHours('16:45', '22:00', '07:00'), false)
    })

    it('toggles task completion and updates daily adherence rate', () => {
      const dateStr = '2026-10-28'
      const taskId = `task-morning-prep-${dateStr}`

      const wasCompleted = toggleTaskCompletion(dateStr, taskId)
      assert.equal(wasCompleted, true)
      assert.ok(getCompletedTaskIds(dateStr).includes(taskId))

      // Toggle off
      const isNowCompleted = toggleTaskCompletion(dateStr, taskId)
      assert.equal(isNowCompleted, false)
      assert.ok(!getCompletedTaskIds(dateStr).includes(taskId))
    })
  })
})
