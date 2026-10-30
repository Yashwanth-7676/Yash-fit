export type IntelligenceNodeId =
  | 'volume'
  | 'strength'
  | 'consistency'
  | 'nutrition'
  | 'protein'
  | 'hydration'
  | 'sleep'
  | 'recovery'
  | 'body_composition'
  | 'performance_lab'

export interface IntelligenceNode {
  id: IntelligenceNodeId
  label: string
  category: 'training' | 'nutrition' | 'recovery' | 'physiology'
  currentValueFormatted: string
  status: 'optimal' | 'moderate' | 'needs_attention' | 'insufficient_data'
  dataPointsCount: number
  dataSources: string[]
}

export interface IntelligenceEdge {
  id: string
  source: IntelligenceNodeId
  target: IntelligenceNodeId
  correlationCoeff: number // -1.00 to +1.00
  relationshipStrength: 'strong' | 'moderate' | 'weak' | 'insufficient_data'
  concordanceRatePct: number // 0 to 100
  sampleSize: number
  description: string
  distinctionNote: string
}

export interface CausalDistinctionInsight {
  id: string
  title: string
  category: 'sleep_recovery' | 'protein_strength' | 'volume_fatigue' | 'consistency_progress' | 'hydration_performance' | 'calorie_composition'
  examinedRecordsDescription: string
  sampleSizeSummary: string
  observedPattern: string
  correlationMagnitude: string
  whatCannotBeConcluded: string
  evidenceStrength: 'strong' | 'moderate' | 'preliminary' | 'insufficient'
  actionableNextStep: string
  relatedHref: string
  missingDataNotice?: string
}

export interface IntelligenceSnapshot {
  calculatedAt: string
  nodes: IntelligenceNode[]
  edges: IntelligenceEdge[]
  insights: CausalDistinctionInsight[]
  totalRecordsExamined: number
  overallDataCompletenessPct: number
  missingDataSummaries: string[]
}

