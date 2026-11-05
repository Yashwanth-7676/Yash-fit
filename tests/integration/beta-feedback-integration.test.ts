import { describe, it, expect, beforeEach } from 'vitest'
import {
  submitFeedback,
  getUserFeedbackList,
  getAllFeedbackForAdmin,
  updateFeedbackStatus,
  markAsDuplicate,
} from '@/lib/feedback/feedbackService'
import {
  createAdminInvitation,
  getAdminInvitations,
  revokeAdminInvitation,
  validateInviteCode,
} from '@/lib/beta/betaService'

function setupMockStorage() {
  const store: Record<string, string> = {}
  global.window = {} as unknown as Window & typeof globalThis
  global.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => {
      store[key] = val
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k])
    },
    key: (i: number) => Object.keys(store)[i] || null,
    length: Object.keys(store).length,
  }
}

describe('Integration: Feedback Submission & Admin Resolution Workflow', () => {
  beforeEach(() => {
    setupMockStorage()
  })

  it('completes full ticket submission, triage, admin response, and user retrieval lifecycle', async () => {
    const userId = 'athlete-integ-1'

    // 1. Athlete submits feedback
    const ticket = await submitFeedback({
      userId,
      userName: 'Athlete Priya',
      userEmail: 'priya@integ.test',
      type: 'bug',
      title: 'Barbell bar path drift on incline press',
      description: 'The 3D trajectory drifts 4cm forward on the concentric portion of set 3.',
      category: 'workout_studio',
      severity: 'medium',
    })

    expect(ticket.id).toBeDefined()
    expect(ticket.status).toBe('submitted')

    // 2. Athlete views submission
    const userTickets = await getUserFeedbackList(userId)
    const found = userTickets.find((t) => t.id === ticket.id)
    expect(found).toBeDefined()
    expect(found?.title).toBe('Barbell bar path drift on incline press')
    expect(found?.adminResponse).toBeFalsy()

    // 3. Admin retrieves all tickets and locates submission
    const { items: adminTickets } = await getAllFeedbackForAdmin()
    const adminTicket = adminTickets.find((t) => t.id === ticket.id)
    expect(adminTicket).toBeDefined()

    // 4. Admin updates status and provides official public response
    const resolvedTicket = await updateFeedbackStatus(
      ticket.id,
      'resolved',
      'Smoothed 3D depth disparity vector with low-pass filter.',
      'Thank you Priya! This kinematic calibration has been resolved in v2.4.0.'
    )

    expect(resolvedTicket.status).toBe('resolved')
    expect(resolvedTicket.adminResponse).toContain('v2.4.0')
    expect(resolvedTicket.resolvedAt).toBeDefined()

    // 5. Athlete re-inspects their ticket and reads admin response
    const updatedUserTickets = await getUserFeedbackList(userId)
    const reloaded = updatedUserTickets.find((t) => t.id === ticket.id)
    expect(reloaded?.status).toBe('resolved')
    expect(reloaded?.adminResponse).toContain('v2.4.0')
  })

  it('supports marking tickets as duplicates with parent ticket references', async () => {
    const ticketA = await submitFeedback({
      userId: 'user-a',
      type: 'bug',
      title: 'Crash on clicking save workout',
      description: 'App crashes on clicking save when offline.',
      category: 'workout_studio',
    })

    const ticketB = await submitFeedback({
      userId: 'user-b',
      type: 'bug',
      title: 'Offline save workout fails',
      description: 'Cannot save offline workout session.',
      category: 'workout_studio',
    })

    const duplicateTicket = await markAsDuplicate(ticketB.id, ticketA.id)
    expect(duplicateTicket.status).toBe('duplicate')
    expect(duplicateTicket.adminNotes).toContain(ticketA.id)
    expect(duplicateTicket.adminResponse).toContain(ticketA.id.slice(-6))
  })

  it('manages beta invitations provisioning and revocation', async () => {
    // 1. Admin creates invitation
    const customCode = 'TEST-INTEG-2027'
    const invite = await createAdminInvitation({
      code: customCode,
      role: 'vip_tester',
      maxUses: 15,
    })

    expect(invite.code).toBe(customCode)
    expect(invite.role).toBe('vip_tester')

    // 2. Validate invite is redeemable
    const validationBefore = await validateInviteCode(customCode)
    expect(validationBefore.valid).toBe(true)

    // 3. Admin revokes invitation
    const revoked = await revokeAdminInvitation(invite.id)
    expect(revoked).toBe(true)

    // 4. Validate invite is now rejected
    const validationAfter = await validateInviteCode(customCode)
    expect(validationAfter.valid).toBe(false)
    expect(validationAfter.reason).toMatch(/no longer active/i)
  })
})
