export type ReportType =
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'consistency'
  | 'strength'
  | 'nutrition'
  | 'recovery'
  | 'achievements'

export interface ReportMetricItem {
  key: string
  label: string
  value: string
  unit?: string
  changePct?: number
  trendDirection?: 'up' | 'down' | 'neutral'
  isEstimated?: boolean
}

export interface ReportChartPoint {
  label: string
  value: number
  secondaryValue?: number
}

export interface ReportPersonalRecord {
  exerciseName: string
  recordValue: string
  date: string
}

export interface FitnessReport {
  id: string
  type: ReportType
  title: string
  subtitle: string
  generatedAt: string
  dateRange: {
    startDate: string
    endDate: string
  }
  summary: string
  metrics: ReportMetricItem[]
  chartData: ReportChartPoint[]
  personalRecords: ReportPersonalRecord[]
  missingDataNotices: string[]
  recommendations: string[]
  sanitizedShareText: string
}

export interface ReportGenerationOptions {
  type: ReportType
  startDate?: string
  endDate?: string
  includePrivateMetrics?: boolean
}

