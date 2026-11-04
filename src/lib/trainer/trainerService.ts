import type {
  TrainerProfile,
  TrainerClientRelationship,
  TrainerNote,
  ClientCheckIn,
  TrainerPrescriptionInput,
  ClientConsentScope,
} from '../../types/trainer'

export const LOCAL_STORAGE_TRAINER_PROFILE_KEY = 'yashfit_trainer_profile'
export const LOCAL_STORAGE_TRAINER_CLIENTS_KEY = 'yashfit_trainer_clients'
export const LOCAL_STORAGE_TRAINER_NOTES_KEY = 'yashfit_trainer_notes'
export const LOCAL_STORAGE_CLIENT_CHECKINS_KEY = 'yashfit_client_checkins'

export const DEFAULT_CONSENT_SCOPES: ClientConsentScope = {
  shareWorkouts: true,
  shareNutrition: true,
  shareRecovery: true,
  shareMeasurements: false, // Default private for privacy
  shareTransformationPhotos: false, // Default private
}

export const DEMO_TRAINER_PROFILE: TrainerProfile = {
  id: 'trainer-01',
  userId: 'trainer-user-yash',
  fullName: 'Coach Yashwanth (CSCS)',
  specialization: 'Compound Strength, Hypertrophy & Periodization',
  bio: 'Certified Strength & Conditioning Specialist with 6+ years coaching competitive powerlifters and transformation athletes.',
  inviteCode: 'COACH-YASH-77',
  activeClientsCount: 3,
  isAcceptingClients: true,
}

export const SEED_TRAINER_CLIENTS: TrainerClientRelationship[] = [
  {
    id: 'rel-client-01',
    trainerId: 'trainer-01',
    clientId: 'client-rohan',
    clientName: 'Rohan Sharma',
    clientEmail: 'rohan.sharma@example.com',
    status: 'active',
    consentScopes: {
      shareWorkouts: true,
      shareNutrition: true,
      shareRecovery: true,
      shareMeasurements: true,
      shareTransformationPhotos: false,
    },
    adherenceScorePct: 88,
    joinedAt: '2026-09-15',
    lastActiveDate: '2026-11-03',
    assignedRoutineId: 'routine-push-day',
    assignedRoutineName: 'Push Hypertrophy Focus (Chest & Delts)',
    targetCalories: 2400,
    targetProtein: 160,
    primaryGoal: 'Muscle Hypertrophy & Density',
  },
  {
    id: 'rel-client-02',
    trainerId: 'trainer-01',
    clientId: 'client-priya',
    clientName: 'Priya Nair',
    clientEmail: 'priya.nair@example.com',
    status: 'active',
    consentScopes: {
      shareWorkouts: true,
      shareNutrition: true,
      shareRecovery: true,
      shareMeasurements: false,
      shareTransformationPhotos: false,
    },
    adherenceScorePct: 94,
    joinedAt: '2026-10-01',
    lastActiveDate: '2026-11-04',
    assignedRoutineId: 'routine-pull-day',
    assignedRoutineName: 'Upper Pull & Postural Posterior Chain',
    targetCalories: 1850,
    targetProtein: 125,
    primaryGoal: 'Fat Loss & Athletic Conditioning',
  },
  {
    id: 'rel-client-03',
    trainerId: 'trainer-01',
    clientId: 'client-vikram',
    clientName: 'Vikram Das',
    clientEmail: 'vikram.das@example.com',
    status: 'pending',
    consentScopes: DEFAULT_CONSENT_SCOPES,
    adherenceScorePct: 65,
    joinedAt: '2026-10-25',
    lastActiveDate: '2026-10-31',
    primaryGoal: 'Compound 1RM Strength',
  },
]

export const SEED_CHECKINS: ClientCheckIn[] = [
  {
    id: 'checkin-01',
    clientId: 'client-rohan',
    clientName: 'Rohan Sharma',
    date: '2026-11-02',
    weightKg: 76.5,
    energyScore: 8,
    soreness: 'Moderate',
    comments: 'Bench press felt explosive. Did 90kg for 3 sets of 8 reps cleanly. Minor right tricep fatigue.',
    trainerFeedback: 'Great form maintenance on the top sets. Take 2.5 min rest before set 3 next week.',
    feedbackSentAt: '2026-11-02T16:30:00Z',
  },
  {
    id: 'checkin-02',
    clientId: 'client-priya',
    clientName: 'Priya Nair',
    date: '2026-11-03',
    weightKg: 61.2,
    energyScore: 9,
    soreness: 'Low',
    comments: 'Hit 130g protein daily without digestive bloat thanks to the hung curd and besan chilla recipes.',
    trainerFeedback: 'Macros are dialed in perfectly. Proceed with the scheduled volume wave.',
    feedbackSentAt: '2026-11-03T19:00:00Z',
  },
]

let inMemoryClients: TrainerClientRelationship[] = [...SEED_TRAINER_CLIENTS]
let inMemoryNotes: TrainerNote[] = []
let inMemoryCheckins: ClientCheckIn[] = [...SEED_CHECKINS]

export function getTrainerProfile(): TrainerProfile {
  if (typeof window === 'undefined') return DEMO_TRAINER_PROFILE
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TRAINER_PROFILE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // fallback
  }
  return DEMO_TRAINER_PROFILE
}

export function getTrainerClients(): TrainerClientRelationship[] {
  if (typeof window === 'undefined') return inMemoryClients
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TRAINER_CLIENTS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    // fallback
  }
  return inMemoryClients
}

export function saveTrainerClients(clients: TrainerClientRelationship[]): void {
  inMemoryClients = clients
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_TRAINER_CLIENTS_KEY, JSON.stringify(clients))
    } catch {
      // ignore
    }
  }
}

export function assignPlanToClient(
  clientId: string,
  prescription: TrainerPrescriptionInput
): boolean {
  const clients = getTrainerClients()
  const updated = clients.map((c) => {
    if (c.clientId === clientId) {
      return {
        ...c,
        assignedRoutineId: prescription.routineId,
        assignedRoutineName: prescription.routineName,
        targetCalories: prescription.targetCalories,
        targetProtein: prescription.targetProtein,
      }
    }
    return c
  })

  saveTrainerClients(updated)
  return true
}

export function addTrainerNote(clientId: string, noteText: string): TrainerNote {
  const newNote: TrainerNote = {
    id: `note-${Date.now()}`,
    trainerId: 'trainer-01',
    clientId,
    noteText: noteText.trim(),
    createdAt: new Date().toISOString(),
    isPrivateToTrainer: true,
  }

  inMemoryNotes = [newNote, ...inMemoryNotes]

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_TRAINER_NOTES_KEY)
      const current = raw ? JSON.parse(raw) : []
      localStorage.setItem(
        LOCAL_STORAGE_TRAINER_NOTES_KEY,
        JSON.stringify([newNote, ...current])
      )
    } catch {
      // ignore
    }
  }

  return newNote
}

export function getTrainerNotes(clientId: string): TrainerNote[] {
  if (typeof window === 'undefined') {
    return inMemoryNotes.filter((n) => n.clientId === clientId)
  }
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TRAINER_NOTES_KEY)
    if (raw) {
      const all: TrainerNote[] = JSON.parse(raw)
      return all.filter((n) => n.clientId === clientId)
    }
  } catch {
    // fallback
  }
  return inMemoryNotes.filter((n) => n.clientId === clientId)
}

export function getClientCheckIns(clientId?: string): ClientCheckIn[] {
  let list = inMemoryCheckins
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_CLIENT_CHECKINS_KEY)
      if (raw) list = JSON.parse(raw)
    } catch {
      // fallback
    }
  }
  return clientId ? list.filter((c) => c.clientId === clientId) : list
}

export function sendTrainerFeedback(checkInId: string, feedbackText: string): boolean {
  let list = getClientCheckIns()
  list = list.map((c) => {
    if (c.id === checkInId) {
      return {
        ...c,
        trainerFeedback: feedbackText,
        feedbackSentAt: new Date().toISOString(),
      }
    }
    return c
  })

  inMemoryCheckins = list

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_CLIENT_CHECKINS_KEY, JSON.stringify(list))
      return true
    } catch {
      return false
    }
  }
  return true
}

export function submitClientCheckIn(checkIn: Omit<ClientCheckIn, 'id'>): ClientCheckIn {
  const newCheckIn: ClientCheckIn = {
    ...checkIn,
    id: `checkin-${Date.now()}`,
  }

  inMemoryCheckins = [newCheckIn, ...inMemoryCheckins]

  if (typeof window !== 'undefined') {
    try {
      const current = getClientCheckIns()
      localStorage.setItem(
        LOCAL_STORAGE_CLIENT_CHECKINS_KEY,
        JSON.stringify([newCheckIn, ...current])
      )
    } catch {
      // ignore
    }
  }

  return newCheckIn
}

export function updateClientConsent(
  clientId: string,
  scopes: Partial<ClientConsentScope>
): boolean {
  const clients = getTrainerClients()
  const updated = clients.map((c) => {
    if (c.clientId === clientId) {
      return {
        ...c,
        consentScopes: { ...c.consentScopes, ...scopes },
      }
    }
    return c
  })
  saveTrainerClients(updated)
  return true
}

export function revokeTrainerAccess(clientId: string): boolean {
  const clients = getTrainerClients()
  const updated = clients.map((c) => {
    if (c.clientId === clientId) {
      return {
        ...c,
        status: 'revoked' as const,
      }
    }
    return c
  })
  saveTrainerClients(updated)
  return true
}

export function acceptTrainerInvitation(clientId: string): boolean {
  const clients = getTrainerClients()
  const updated = clients.map((c) => {
    if (c.clientId === clientId) {
      return {
        ...c,
        status: 'active' as const,
      }
    }
    return c
  })
  saveTrainerClients(updated)
  return true
}

