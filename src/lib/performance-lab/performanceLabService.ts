import type {
  PerformanceTestDefinition,
  PerformanceTestLog,
  PerformanceBenchmarkReport,
} from '../../types/performanceLab'

const LOCAL_STORAGE_KEY = 'yashfit_performance_lab_logs'

export const PERFORMANCE_TEST_CATALOG: PerformanceTestDefinition[] = [
  {
    id: 'test-1rm-squat',
    title: '1RM Barbell Squat (Submaximal Calculation)',
    subtitle: 'Standard 3–5 Rep Maximum Strength Test',
    category: 'strength_progression',
    unit: 'kg',
    isMaximal: false,
    targetMuscleGroups: ['Quadriceps', 'Glutes', 'Adductors', 'Core'],
    equipmentRequired: ['Barbell & Plates', 'Squat Rack', 'Safety Spotter Arms', 'Flat Lifting Shoes'],
    instructions: [
      'Warm up thoroughly with 2-3 progressive warm-up sets (40%, 60%, 80% working weight).',
      'Select a working weight you can lift for between 3 and 5 strict, parallel reps.',
      'Descend until the top of your thighs are parallel to the floor.',
      'Drive forcefully through mid-foot to complete lockout on every rep.',
      'Record weight and strict completed reps. The 1RM is calculated using the validated Brzycki formula.',
    ],
    standardConditions: [
      'Crease of the hip must clearly pass below patella apex (parallel depth).',
      'No bouncing off calves or leaning on rack pins.',
      'Must be performed with safety spotter arms set at parallel height.',
    ],
    safetyScreening: [
      'No acute lower back, knee, or hip sharp pain in the past 14 days.',
      'At least 3 months of consistent compound squat experience.',
      'Rest period of at least 3 minutes prior to the test set.',
    ],
    contraindications: [
      'Cardiovascular hypertension without medical clearance.',
      'Acute spinal disc herniation or knee ligament instability.',
      'General feeling of dizziness, fever, or extreme sleep deprivation (<5 hours).',
    ],
    calculationFormula: 'Brzycki Formula: 1RM = Weight / (1.0278 - (0.0278 × Reps))',
    scoringExplanation:
      'Calculates your estimated 1-Repetition Maximum without the injury risks of a true maximal lift.',
  },
  {
    id: 'test-1rm-bench',
    title: '1RM Barbell Bench Press (Submaximal Calculation)',
    subtitle: 'Upper Body Pushing Strength Benchmark',
    category: 'strength_progression',
    unit: 'kg',
    isMaximal: false,
    targetMuscleGroups: ['Chest', 'Anterior Deltoids', 'Triceps'],
    equipmentRequired: ['Barbell & Plates', 'Sturdy Flat Bench', 'Safety Catches or Spotter'],
    instructions: [
      'Warm up with light sets to lubricate rotator cuff and shoulder joints.',
      'Select a resistance you can safely complete for 3 to 5 strict reps.',
      'Lower the barbell with a controlled 2-second eccentric cadence until it gently touches mid-sternum.',
      'Press upward to full lockout without lifting hips off the bench.',
      'Log the weight and completed repetitions.',
    ],
    standardConditions: [
      'Glutes and upper back must maintain continuous contact with bench.',
      'Barbell must touch chest without violent bouncing.',
      'Full symmetrical elbow lockout at apex.',
    ],
    safetyScreening: [
      'A human spotter or verified safety pins must be present.',
      'No shoulder impingement or wrist sprain.',
    ],
    contraindications: [
      'Acute rotator cuff tear or acromioclavicular (AC) joint pathology.',
      'Uncontrolled high blood pressure.',
    ],
    calculationFormula: 'Brzycki Formula: 1RM = Weight / (1.0278 - (0.0278 × Reps))',
    scoringExplanation: 'Standardized upper-body horizontal pushing strength benchmark.',
  },
  {
    id: 'test-1rm-deadlift',
    title: '1RM Barbell Deadlift (Submaximal Calculation)',
    subtitle: 'Posterior Chain Maximum Power Benchmark',
    category: 'strength_progression',
    unit: 'kg',
    isMaximal: false,
    targetMuscleGroups: ['Hamstrings', 'Glutes', 'Erector Spinae', 'Latissimus Dorsi', 'Traps'],
    equipmentRequired: ['Olympic Barbell & Bumper Plates', 'Chalk / Straps (optional)', 'Level Platform'],
    instructions: [
      'Perform 3 progressive warm-up sets starting with empty bar up to 75% load.',
      'Choose a weight you can pull for 3 to 5 reps with immaculate spinal neutrality.',
      'Engage lats, wedge hips, and push the floor away.',
      'Stand fully upright, locking hips and knees together without hyperextending lower back.',
      'Return weight to floor under control before initiating next rep (dead-stop).',
    ],
    standardConditions: [
      'Hips and shoulders must rise at coordinated rates without lumbar flexion.',
      'No hitching bar on thighs.',
      'Full lockout with shoulders behind bar.',
    ],
    safetyScreening: [
      'Zero active lower back pain.',
      'Adequate hamstring flexibility to set up with flat back.',
    ],
    contraindications: [
      'Recent lumbar disc injury or sciatica flare-up.',
      'Abdominal hernia or recent surgery.',
    ],
    calculationFormula: 'Brzycki Formula: 1RM = Weight / (1.0278 - (0.0278 × Reps))',
    scoringExplanation: 'Measures total posterior chain pulling strength and spinal stability.',
  },
  {
    id: 'test-pushup-endurance',
    title: '2-Minute Push-Up Muscular Endurance Test',
    subtitle: 'Upper Body Muscular Endurance Standard',
    category: 'repetition_endurance',
    unit: 'reps',
    isMaximal: true,
    targetMuscleGroups: ['Pectorals', 'Triceps', 'Anterior Deltoids', 'Core'],
    equipmentRequired: ['Exercise Mat', 'Stopwatch / Timer'],
    instructions: [
      'Set timer for exactly 2 minutes (120 seconds).',
      'Assume standard push-up position with hands slightly wider than shoulder width.',
      'Lower body until elbows reach at least 90° angle.',
      'Push back up to complete arm lockout.',
      'You may rest ONLY in the top push-up position (no sagging or kneeling).',
      'Record total strict reps completed within 2 minutes.',
    ],
    standardConditions: [
      'Full 90° elbow flexion on every rep.',
      'Rigid torso plank throughout; sagging or pike disqualifies rep.',
      'Timer must not be paused during rest in top plank.',
    ],
    safetyScreening: [
      'No wrist arthritis or acute shoulder impingement.',
    ],
    contraindications: [
      'Chest pain or shortness of breath.',
    ],
    scoringExplanation: 'Evaluates relative upper-body endurance capacity and neuromuscular fatigue resistance.',
  },
  {
    id: 'test-pullup-max',
    title: 'Unbroken Pull-Up Maximum Repetition Test',
    subtitle: 'Relative Bodyweight Pulling Strength',
    category: 'repetition_endurance',
    unit: 'reps',
    isMaximal: true,
    targetMuscleGroups: ['Latissimus Dorsi', 'Biceps Brachii', 'Forearms', 'Core'],
    equipmentRequired: ['Sturdy Pull-Up Bar'],
    instructions: [
      'Hang from bar with overhand (pronated) grip, slightly wider than shoulder-width, arms fully extended (dead hang).',
      'Pull smoothly upward until chin clearly clears the top edge of the bar.',
      'Lower under control to complete arm extension before beginning next rep.',
      'No kipping, kicking legs, or resting feet on floor.',
      'Test ends once hands release the bar or feet touch the ground.',
    ],
    standardConditions: [
      'Chin must clearly rise above the bar plane.',
      'Full elbow extension at bottom of each rep.',
      'Zero kipping momentum.',
    ],
    safetyScreening: [
      'Ability to perform at least 1 strict bodyweight pull-up safely.',
      'No elbow tendonitis (golfer/tennis elbow) or shoulder instability.',
    ],
    contraindications: [
      'Active bicep tendonitis or acromioclavicular strain.',
    ],
    scoringExplanation: 'Benchmark of relative upper-body strength to body weight ratio.',
  },
  {
    id: 'test-plank-hold',
    title: 'Maximum Forearm Plank Isometric Hold',
    subtitle: 'Anterior Core Endurance & Spinal Stability',
    category: 'timed_endurance',
    unit: 'seconds',
    isMaximal: true,
    targetMuscleGroups: ['Rectus Abdominis', 'Transverse Abdominis', 'Obliques', 'Glutes'],
    equipmentRequired: ['Exercise Mat', 'Stopwatch / Timer'],
    instructions: [
      'Place forearms on mat with elbows directly under shoulders.',
      'Extend legs back, toes grounded, creating a straight line from crown of head to heels.',
      'Start timer the moment knees lift off the mat.',
      'Maintain continuous diaphragmatic breathing while squeezing glutes and abs.',
      'Stop the timer the moment hips sag toward floor or pike up >10 degrees.',
      'Log time held in seconds.',
    ],
    standardConditions: [
      'Elbows vertically below shoulders at 90° angle.',
      'No holding breath or arching lower back.',
      'Strict termination upon first form breakdown.',
    ],
    safetyScreening: [
      'No abdominal hernia or acute lumbar pain.',
    ],
    contraindications: [
      'Uncontrolled hypertension or recent abdominal surgery.',
    ],
    scoringExplanation: 'Standard physiological test of isometric core endurance and spinal stabilizing stamina.',
  },
  {
    id: 'test-wall-sit',
    title: 'Wall Sit Isometric Endurance Test',
    subtitle: 'Lower Body Quadriceps Fatigue Resistance',
    category: 'timed_endurance',
    unit: 'seconds',
    isMaximal: true,
    targetMuscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'],
    equipmentRequired: ['Flat Vertical Wall', 'Stopwatch / Timer'],
    instructions: [
      'Stand with back flat against a smooth wall, feet shoulder-width apart and ~2 feet forward.',
      'Slide back down wall until thighs are parallel to floor (90° knee angle).',
      'Keep head, shoulders, and lower back resting flat against wall.',
      'Hands rest at sides or across chest (never placed on thighs).',
      'Start timer once 90° angle is reached.',
      'Stop timer when hips drop, raise, or hands touch knees.',
    ],
    standardConditions: [
      'Thighs parallel to floor (90° knee angle).',
      'No resting hands on knees or thighs.',
    ],
    safetyScreening: [
      'No patellofemoral pain syndrome or meniscal tear flare-ups.',
    ],
    contraindications: [
      'Acute knee effusion or patellar tendonitis.',
    ],
    scoringExplanation: 'Direct test of static quadriceps strength endurance and lactate tolerance.',
  },
  {
    id: 'test-cooper-run',
    title: '12-Minute Cooper Aerobic Run/Walk Test',
    subtitle: 'Aerobic Capacity & VO2 Max Estimation',
    category: 'workload_capacity',
    unit: 'meters',
    isMaximal: true,
    targetMuscleGroups: ['Cardiorespiratory System', 'Calves', 'Quadriceps'],
    equipmentRequired: ['Running Track, GPS Watch, or Treadmill', 'Stopwatch / Timer'],
    instructions: [
      'Warm up with 5 minutes of light jogging and dynamic leg swings.',
      'Set timer for exactly 12 minutes (720 seconds).',
      'Cover as much distance as possible by running or walking at steady maximal sustainable pace.',
      'Maintain an even pacing strategy rather than sprinting and stopping.',
      'Record total meters covered in exactly 12:00 minutes.',
    ],
    standardConditions: [
      'Measured on level track or calibrated GPS/treadmill (0% incline).',
      'Timing stops exactly at 12 minutes.',
    ],
    safetyScreening: [
      'Par-Q cardiovascular health clearance.',
      'Hydrated and dressed in weather-appropriate running shoes.',
    ],
    contraindications: [
      'History of cardiovascular disease without physician consent.',
      'Chest tightness, asthma flare-up, or lightheadedness.',
    ],
    calculationFormula: 'VO2 Max Estimate = (Distance in meters - 504.9) / 44.73',
    scoringExplanation: 'Gold standard non-laboratory aerobic capacity test developed by Dr. Kenneth Cooper.',
  },
]

/**
 * Calculates estimated 1RM using the validated Brzycki formula.
 * Formula: 1RM = Weight / (1.0278 - (0.0278 × Reps))
 */
export function calculateBrzycki1RM(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0
  if (reps === 1) return weightKg
  const r = Math.min(reps, 12) // Brzycki formula accurate up to 10-12 reps
  const estimated = weightKg / (1.0278 - 0.0278 * r)
  return Math.round(estimated * 10) / 10
}

/**
 * Calculates estimated 1RM using the Epley formula.
 * Formula: 1RM = Weight × (1 + 0.0333 × Reps)
 */
export function calculateEpley1RM(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0
  if (reps === 1) return weightKg
  const estimated = weightKg * (1 + 0.0333 * reps)
  return Math.round(estimated * 10) / 10
}

/**
 * Storage helpers for Performance Lab test logs.
 */
export function getSavedPerformanceLogs(): PerformanceTestLog[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // fallback
  }
  return []
}

export function savePerformanceLog(log: PerformanceTestLog): void {
  if (typeof window === 'undefined') return
  try {
    const current = getSavedPerformanceLogs()
    const updated = [log, ...current.filter((l) => l.id !== log.id)]
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // ignore
  }
}

export function deletePerformanceLog(id: string): void {
  if (typeof window === 'undefined') return
  try {
    const current = getSavedPerformanceLogs()
    const updated = current.filter((l) => l.id !== id)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // ignore
  }
}

export function clearPerformanceLogs(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY)
  } catch {
    // ignore
  }
}

/**
 * Builds benchmark analysis comparing against the user's OWN historical records.
 * NEVER compares against fake or invented population averages.
 */
export function buildTestBenchmarkReport(
  testId: string,
  allLogs: PerformanceTestLog[]
): PerformanceBenchmarkReport {
  const definition = PERFORMANCE_TEST_CATALOG.find((t) => t.id === testId)
  const testTitle = definition?.title || testId
  const category = definition?.category || 'repetition_endurance'
  const unit = definition?.unit || 'reps'

  const testLogs = allLogs
    .filter((l) => l.testId === testId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (testLogs.length === 0) {
    return {
      testId,
      testTitle,
      category,
      unit,
      baselineValue: null,
      personalBest: null,
      latestValue: null,
      historicalImprovementPct: null,
      testCount: 0,
      recentLogs: [],
      periodComparison: { lastWeekDiffPct: null, lastMonthDiffPct: null },
    }
  }

  // Baseline is oldest record or one marked isBaseline
  const baselineRecord = testLogs.find((l) => l.isBaseline) || testLogs[testLogs.length - 1]
  const baselineValue = baselineRecord ? baselineRecord.resultValue : null

  // Personal Best is highest result value
  const personalBest = Math.max(...testLogs.map((l) => l.resultValue))
  const latestValue = testLogs[0].resultValue

  // Improvement % compared to own baseline
  let historicalImprovementPct: number | null = null
  if (baselineValue !== null && baselineValue > 0) {
    historicalImprovementPct = Math.round(((latestValue - baselineValue) / baselineValue) * 100)
  }

  // Week and Month trend calculations
  const now = Date.now()
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000

  const prevWeekLog = testLogs.find((l) => {
    const t = new Date(l.date).getTime()
    return t <= weekAgo
  })
  const prevMonthLog = testLogs.find((l) => {
    const t = new Date(l.date).getTime()
    return t <= monthAgo
  })

  const lastWeekDiffPct =
    prevWeekLog && prevWeekLog.resultValue > 0
      ? Math.round(((latestValue - prevWeekLog.resultValue) / prevWeekLog.resultValue) * 100)
      : null

  const lastMonthDiffPct =
    prevMonthLog && prevMonthLog.resultValue > 0
      ? Math.round(((latestValue - prevMonthLog.resultValue) / prevMonthLog.resultValue) * 100)
      : null

  return {
    testId,
    testTitle,
    category,
    unit,
    baselineValue,
    personalBest,
    latestValue,
    historicalImprovementPct,
    testCount: testLogs.length,
    recentLogs: testLogs.slice(0, 10),
    periodComparison: {
      lastWeekDiffPct,
      lastMonthDiffPct,
    },
  }
}

export function exportPerformanceLogsToCsv(logs: PerformanceTestLog[]): string {
  const headers = [
    '"Log ID"',
    '"Date"',
    '"Test ID"',
    '"Test Title"',
    '"Category"',
    '"Result Value"',
    '"Unit"',
    '"Estimated 1RM (kg)"',
    '"Is Baseline"',
    '"Conditions Met"',
    '"Notes"',
  ]

  const rows = logs.map((l) => [
    `"${l.id}"`,
    `"${l.date}"`,
    `"${l.testId}"`,
    `"${l.testTitle}"`,
    `"${l.category}"`,
    l.resultValue,
    `"${l.unit}"`,
    l.estimated1RM ?? '',
    l.isBaseline ? 'true' : 'false',
    l.conditionsMet ? 'true' : 'false',
    `"${(l.notes || '').replace(/"/g, '""')}"`,
  ])

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
}

