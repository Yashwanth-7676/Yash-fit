import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  calculateEventPoints,
  getArenaCompetitions,
  getCompetitionById,
  getCompetitionLeaderboard,
  reportArenaParticipant,
  PRESET_ARENA_COMPETITIONS,
} from '../src/lib/arena/arenaService'
import {
  TRAINING_STATIONS_CATALOG,
  getAvatarConfig,
  saveAvatarConfig,
  createMultiplayerRoom,
} from '../src/lib/virtual-world/virtualWorldService'
import {
  generateFitnessReport,
  type ReportTelemetryInput,
} from '../src/lib/reports/reportGeneratorService'
import {
  buildDailyLifestyleSchedule,
  toggleLifestyleSlotCompletion,
  applyProposalDecision,
  DEFAULT_USER_CONSTRAINTS,
} from '../src/lib/lifestyle/lifestyleService'
import type { ArenaCompetition } from '../src/types/arena'
import type { CoachUserContext } from '../src/lib/ai/providers'
import type { AvatarAppearanceConfig } from '../src/types/virtualWorld'

describe('YashFit Mega Upgrade Pack #25–#28 Test Suite', () => {
  // ─── UPGRADE #25: Global Fitness Arena ──────────────────────────────────────
  describe('Upgrade #25: Global Fitness Arena', () => {
    it('calculates event points accurately from volume with daily cap enforcement', () => {
      const comp = PRESET_ARENA_COMPETITIONS[0] // Weekly Volume Masters, 0.1 pts/kg, cap: 800
      // 5,000 kg * 0.1 = 500 gross pts. 0 existing pts => 500 pts awarded.
      const points = calculateEventPoints(comp.scoringRule, 5000, 0)
      assert.strictEqual(points, 500)
    })

    it('enforces anti-exploit daily safety cap on excessive workout submissions', () => {
      const comp = PRESET_ARENA_COMPETITIONS[0] // daily cap: 800 pts
      // 5,000 kg * 0.1 = 500 gross pts. Already earned 600 pts today.
      // Available under cap = 800 - 600 = 200 pts.
      const points = calculateEventPoints(comp.scoringRule, 5000, 600)
      assert.strictEqual(points, 200)
    })

    it('returns zero points when user has reached daily maximum cap', () => {
      const comp = PRESET_ARENA_COMPETITIONS[0]
      const points = calculateEventPoints(comp.scoringRule, 5000, 800) // already at 800 cap
      assert.strictEqual(points, 0)
    })

    it('retrieves active arena competitions with registration status', () => {
      const all = getArenaCompetitions()
      assert.ok(all.length >= 4)
      const weekly = all.find((c: ArenaCompetition) => c.id === 'comp-volume-weekly')
      assert.ok(weekly)
      assert.strictEqual(weekly?.title, 'Weekly Volume Masters')
    })

    it('retrieves a competition by its ID', () => {
      const comp = getCompetitionById('comp-volume-weekly')
      assert.ok(comp)
      assert.strictEqual(comp?.id, 'comp-volume-weekly')
      assert.strictEqual(comp?.title, 'Weekly Volume Masters')
    })

    it('generates leaderboard standings in descending score order', () => {
      const leaderboard = getCompetitionLeaderboard('comp-volume-weekly')
      assert.ok(leaderboard.length > 0)
      for (let i = 0; i < leaderboard.length - 1; i++) {
        assert.ok(leaderboard[i].score >= leaderboard[i + 1].score)
        assert.strictEqual(leaderboard[i].rank, i + 1)
      }
    })

    it('records moderation reports against suspicious submissions', () => {
      const success = reportArenaParticipant(
        'u-suspicious-user',
        'Suspicious 100,000kg single-set bench press reported'
      )
      assert.strictEqual(success, true)
    })
  })

  // ─── UPGRADE #26: Immersive Virtual Fitness World ────────────────────────────
  describe('Upgrade #26: Immersive Virtual Fitness World', () => {
    it('returns all 5 interactive training stations with valid 3D coordinates', () => {
      const stations = TRAINING_STATIONS_CATALOG
      assert.strictEqual(stations.length, 5)

      const ids = stations.map((s) => s.id)
      assert.ok(ids.includes('station-squat'))
      assert.ok(ids.includes('station-bench'))
      assert.ok(ids.includes('station-pullup'))
      assert.ok(ids.includes('station-cardio'))
      assert.ok(ids.includes('station-mobility'))

      stations.forEach((st) => {
        assert.strictEqual(st.position.length, 3)
        assert.ok(st.associatedRoute.startsWith('/'))
      })
    })

    it('saves and retrieves customizable avatar appearance', () => {
      const customConfig: AvatarAppearanceConfig = {
        gender: 'feminine',
        skinTone: '#8d5524',
        outfitColor: '#18181b',
        accentColor: '#ec4899',
        hairStyle: 'spiky',
        unlockedCostumes: ['default_stealth', 'cyber_ronin'],
        activeCostume: 'cyber_ronin',
        animationPose: 'squat',
      }

      saveAvatarConfig(customConfig)
      const retrieved = getAvatarConfig()
      assert.strictEqual(retrieved.gender, 'feminine')
      assert.strictEqual(retrieved.skinTone, '#8d5524')
      assert.strictEqual(retrieved.accentColor, '#ec4899')
      assert.strictEqual(retrieved.animationPose, 'squat')
      assert.strictEqual(retrieved.activeCostume, 'cyber_ronin')
    })

    it('creates multiplayer fitness rooms with invite codes', () => {
      const room = createMultiplayerRoom('Cyber Strength Squad', 'cyber_dojo', true)
      assert.ok(room.id.startsWith('room-'))
      assert.strictEqual(room.name, 'Cyber Strength Squad')
      assert.strictEqual(room.environment, 'cyber_dojo')
      assert.strictEqual(room.isPrivate, true)
      assert.ok(room.inviteCode.startsWith('YASH-'))
      assert.strictEqual(room.participants.length, 1)
    })
  })

  // ─── UPGRADE #27: Fitness Intelligence Reports ──────────────────────────────
  describe('Upgrade #27: Fitness Intelligence Reports', () => {
    const mockTelemetry: ReportTelemetryInput = {
      profile: {
        user_id: 'u-audit',
        first_name: 'Yash',
        age: 25,
        height_cm: 178,
        weight_kg: 74,
        primary_goal: 'Build Muscle',
        experience_level: 'Intermediate',
        training_days_per_week: 4,
        training_environment: 'Commercial Gym',
        dietary_preference: 'Non-Vegetarian',
        available_equipment: ['Barbell', 'Dumbbells'],
        onboarding_completed: true,
        created_at: '2026-01-01',
      },
      workouts: [
        {
          routineName: 'Upper Hypertrophy',
          durationSeconds: 3600,
          totalVolume: 6500,
          totalCompletedSets: 16,
          date: '2026-10-25',
        },
        {
          routineName: 'Lower Quad Focus',
          durationSeconds: 3800,
          totalVolume: 7200,
          totalCompletedSets: 18,
          date: '2026-10-27',
        },
        {
          routineName: 'Pull & Arm Hypertrophy',
          durationSeconds: 3400,
          totalVolume: 5800,
          totalCompletedSets: 15,
          date: '2026-10-29',
        },
      ],
      recovery: [
        {
          date: '2026-10-28',
          sleepHours: 7.8,
          readinessScore: 82,
          soreness: 'Low',
        },
        {
          date: '2026-10-29',
          sleepHours: 8.0,
          readinessScore: 85,
          soreness: 'Low',
        },
      ],
      measurements: [
        {
          id: 'm-1',
          userId: 'u-audit',
          recordedDate: '2026-10-28',
          weightKg: 74.2,
          chestCm: 104,
          waistCm: 80,
          armCm: 38,
        },
      ],
      performanceLogs: [
        {
          id: 'log-1',
          userId: 'u-audit',
          testId: 'bench_press_1rm',
          testTitle: 'Barbell Bench Press 1RM',
          category: 'strength_progression',
          date: '2026-10-28',
          resultValue: 110,
          unit: 'kg',
          estimated1RM: 110,
          isBaseline: false,
          conditionsMet: true,
        },
      ],
      nutritionPlan: null,
      waterLoggedLiters: 3.2,
      activeStreak: 12,
    }

    it('generates a weekly verified report with accurate metric aggregations', () => {
      const report = generateFitnessReport(
        {
          type: 'weekly',
          startDate: '2026-10-24',
          endDate: '2026-10-30',
          includePrivateMetrics: true,
        },
        mockTelemetry
      )

      assert.strictEqual(report.type, 'weekly')
      assert.strictEqual(report.metrics.find((m) => m.key === 'total_workouts')?.value, '3')
      // 6500 + 7200 + 5800 = 19,500 kg
      assert.strictEqual(
        report.metrics.find((m) => m.key === 'total_volume')?.value,
        (19500).toLocaleString()
      )
      assert.strictEqual(report.metrics.find((m) => m.key === 'active_streak')?.value, '12')
      assert.strictEqual(report.metrics.find((m) => m.key === 'body_weight')?.value, '74.2')
      assert.strictEqual(report.personalRecords.length, 1)
      assert.strictEqual(report.personalRecords[0].exerciseName, 'Barbell Bench Press 1RM')
      assert.ok(report.sanitizedShareText.includes('YashFit Weekly Fitness Intelligence Report'))
      assert.ok(report.sanitizedShareText.includes('19,500 kg'))
    })

    it('identifies missing data intervals honestly without fabricating values', () => {
      const emptyTelemetry: ReportTelemetryInput = {
        profile: null,
        workouts: [],
        recovery: [],
        measurements: [],
        performanceLogs: [],
        nutritionPlan: null,
        waterLoggedLiters: 0,
        activeStreak: 0,
      }

      const report = generateFitnessReport(
        {
          type: 'weekly',
          startDate: '2026-10-20',
          endDate: '2026-10-27',
        },
        emptyTelemetry
      )

      assert.ok(report.missingDataNotices.length >= 2)
      assert.ok(report.missingDataNotices.some((n) => n.includes('No workout logs recorded')))
      assert.ok(report.missingDataNotices.some((n) => n.includes('No recovery check-ins logged')))
    })
  })

  // ─── UPGRADE #28: AI Lifestyle Optimization ──────────────────────────────────
  describe('Upgrade #28: AI Lifestyle Optimization', () => {
    const mockContext: CoachUserContext = {
      profile: {
        user_id: 'u-lifestyle',
        first_name: 'Yash',
        age: 25,
        height_cm: 178,
        weight_kg: 74,
        primary_goal: 'Build Muscle',
        experience_level: 'Intermediate',
        training_days_per_week: 4,
        training_environment: 'Commercial Gym',
        dietary_preference: 'Non-Vegetarian',
        available_equipment: ['Barbell', 'Dumbbells'],
        onboarding_completed: true,
        created_at: '2026-01-01',
      },
      workouts: [],
      recovery: [
        {
          date: '2026-10-30',
          readinessScore: 48, // Fatigue state < 60
          sleepHours: 5.2,
          soreness: 'High',
        },
      ],
      waterLoggedLiters: 1.0,
      waterTargetLiters: 3.5,
      activeStreak: 5,
      rpgLevel: 3,
      rpgRank: 'Fighter',
    }

    it('synthesizes a 24-hour lifestyle schedule aligned with user work constraints', () => {
      const schedule = buildDailyLifestyleSchedule('2026-10-30', mockContext, DEFAULT_USER_CONSTRAINTS)

      assert.strictEqual(schedule.date, '2026-10-30')
      assert.ok(schedule.timeSlots.length >= 6)

      const categories = schedule.timeSlots.map((s) => s.category)
      assert.ok(categories.includes('hydration'))
      assert.ok(categories.includes('workout'))
      assert.ok(categories.includes('nutrition'))
      assert.ok(categories.includes('sleep'))
    })

    it('proposes active recovery when morning readiness is fatigued (< 60)', () => {
      const schedule = buildDailyLifestyleSchedule('2026-10-30', mockContext)

      assert.ok(schedule.pendingProposals.length > 0)
      const fatigueProp = schedule.pendingProposals.find((p) => p.id === 'prop-recovery-adjust')
      assert.ok(fatigueProp)
      assert.strictEqual(fatigueProp?.requiresUserApproval, true)
      assert.strictEqual(fatigueProp?.userDecision, 'pending')
      assert.ok(fatigueProp?.rationale.includes('Morning recovery readiness is 48/100'))
    })

    it('allows toggling lifestyle slot completion and recalculates adherence', () => {
      const initial = buildDailyLifestyleSchedule('2026-10-30', mockContext)
      const initialScore = initial.adherenceScorePct

      // Toggle slot-2-training
      const updated = toggleLifestyleSlotCompletion(initial, 'slot-2-training')
      const targetSlot = updated.timeSlots.find((s) => s.id === 'slot-2-training')
      assert.strictEqual(targetSlot?.isCompleted, true)
      assert.ok(updated.adherenceScorePct > initialScore)
    })

    it('applies proposal approval changes to schedule slots and marks accepted', () => {
      const schedule = buildDailyLifestyleSchedule('2026-10-30', mockContext)
      const adapted = applyProposalDecision(schedule, 'prop-recovery-adjust', 'accepted')

      const prop = adapted.pendingProposals.find((p) => p.id === 'prop-recovery-adjust')
      assert.strictEqual(prop?.userDecision, 'accepted')

      const trainingSlot = adapted.timeSlots.find((s) => s.id === 'slot-2-training')
      assert.strictEqual(trainingSlot?.title, 'Switch Strength Session to 40-Min Active Recovery Walk')
      assert.strictEqual(trainingSlot?.durationMinutes, 40)
    })

    it('retains original schedule slots when proposal is dismissed', () => {
      const schedule = buildDailyLifestyleSchedule('2026-10-30', mockContext)
      const dismissed = applyProposalDecision(schedule, 'prop-recovery-adjust', 'dismissed')

      const prop = dismissed.pendingProposals.find((p) => p.id === 'prop-recovery-adjust')
      assert.strictEqual(prop?.userDecision, 'dismissed')

      const trainingSlot = dismissed.timeSlots.find((s) => s.id === 'slot-2-training')
      assert.ok(!trainingSlot?.title.includes('Switch Strength Session'))
    })
  })
})
