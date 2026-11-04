export interface ClientConsentScope {
  shareWorkouts: boolean
  shareNutrition: boolean
  shareRecovery: boolean
  shareMeasurements: boolean
  shareTransformationPhotos: boolean
}

export type ClientRelationshipStatus = 'active' | 'pending' | 'declined' | 'revoked'

export interface TrainerProfile {
  id: string
  userId: string
  fullName: string
  specialization: string
  bio: string
  inviteCode: string
  activeClientsCount: number
  isAcceptingClients: boolean
}

export interface TrainerClientRelationship {
  id: string
  trainerId: string
  clientId: string
  clientName: string
  clientEmail: string
  status: ClientRelationshipStatus
  consentScopes: ClientConsentScope
  adherenceScorePct: number
  joinedAt: string
  lastActiveDate: string
  assignedRoutineId?: string
  assignedRoutineName?: string
  targetCalories?: number
  targetProtein?: number
  primaryGoal?: string
}

export interface TrainerNote {
  id: string
  trainerId: string
  clientId: string
  noteText: string
  createdAt: string
  isPrivateToTrainer: boolean
}

export interface ClientCheckIn {
  id: string
  clientId: string
  clientName: string
  date: string
  weightKg?: number
  energyScore: number // 1 to 10
  soreness: 'Low' | 'Moderate' | 'High'
  comments: string
  trainerFeedback?: string
  feedbackSentAt?: string
}

export interface TrainerPrescriptionInput {
  clientId: string
  routineId: string
  routineName: string
  targetCalories: number
  targetProtein: number
  instructions?: string
}

