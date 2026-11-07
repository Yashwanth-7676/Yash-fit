import { MuscleEngagementInfo, MuscleRole } from '@/types/motionverse'

export interface AnatomicalMuscleDefinition {
  id: string
  name: string
  group: 'chest' | 'back' | 'shoulders' | 'arms' | 'core' | 'legs'
  view: 'anterior' | 'posterior' | 'both'
  description: string
  // SVG polygon or path coordinates for interactive anatomical map (viewbox 0 0 200 400)
  anteriorPath?: string
  posteriorPath?: string
}

export const ANATOMICAL_MUSCLES: Record<string, AnatomicalMuscleDefinition> = {
  pectoralis_major: {
    id: 'pectoralis_major',
    name: 'Pectoralis Major (Chest)',
    group: 'chest',
    view: 'anterior',
    description: 'Adducts and flexes the humerus across the chest during horizontal pressing movements.',
    anteriorPath: 'M80,110 Q100,120 120,110 L125,140 Q100,150 75,140 Z',
  },
  anterior_deltoid: {
    id: 'anterior_deltoid',
    name: 'Anterior Deltoid (Front Shoulder)',
    group: 'shoulders',
    view: 'anterior',
    description: 'Assists in shoulder flexion and internal rotation; acts as primary mover in overhead presses and synergist in chest presses.',
    anteriorPath: 'M65,105 Q75,108 78,125 Q70,135 60,120 Z',
  },
  lateral_deltoid: {
    id: 'lateral_deltoid',
    name: 'Lateral Deltoid (Side Shoulder)',
    group: 'shoulders',
    view: 'both',
    description: 'Abducts the humerus; creates upper body width and stabilizes the glenohumeral joint.',
    anteriorPath: 'M58,112 Q65,115 65,130 Q55,135 52,120 Z',
    posteriorPath: 'M58,112 Q65,115 65,130 Q55,135 52,120 Z',
  },
  posterior_deltoid: {
    id: 'posterior_deltoid',
    name: 'Posterior Deltoid (Rear Shoulder)',
    group: 'shoulders',
    view: 'posterior',
    description: 'Horizontally abducts and extends the shoulder in pulling movements and rows.',
    posteriorPath: 'M62,108 Q72,112 75,128 Q66,136 58,122 Z',
  },
  latissimus_dorsi: {
    id: 'latissimus_dorsi',
    name: 'Latissimus Dorsi (Lats)',
    group: 'back',
    view: 'posterior',
    description: 'Adducts, extends, and internally rotates the shoulder; prime mover in pull-ups and rows.',
    posteriorPath: 'M70,135 Q100,150 130,135 L125,190 Q100,185 75,190 Z',
  },
  trapezius: {
    id: 'trapezius',
    name: 'Trapezius & Rhomboids',
    group: 'back',
    view: 'posterior',
    description: 'Elevates, retracts, and depresses the scapulae; supports heavy compound holds.',
    posteriorPath: 'M85,95 Q100,90 115,95 L125,130 Q100,140 75,130 Z',
  },
  biceps_brachii: {
    id: 'biceps_brachii',
    name: 'Biceps Brachii',
    group: 'arms',
    view: 'anterior',
    description: 'Flexes the elbow and supinates the radioulnar joint; synergist in vertical/horizontal pulls.',
    anteriorPath: 'M55,135 Q65,138 62,165 Q52,162 50,140 Z',
  },
  triceps_brachii: {
    id: 'triceps_brachii',
    name: 'Triceps Brachii',
    group: 'arms',
    view: 'posterior',
    description: 'Extends the elbow joint; prime mover in lockouts of bench press, overhead press, and dips.',
    posteriorPath: 'M52,130 Q63,132 60,165 Q48,162 48,135 Z',
  },
  rectus_abdominis: {
    id: 'rectus_abdominis',
    name: 'Core & Rectus Abdominis',
    group: 'core',
    view: 'anterior',
    description: 'Resists spinal hyperextension, stabilizes intra-abdominal pressure during heavy compounds.',
    anteriorPath: 'M85,150 L115,150 L112,205 L88,205 Z',
  },
  erector_spinae: {
    id: 'erector_spinae',
    name: 'Erector Spinae (Lower Back)',
    group: 'back',
    view: 'posterior',
    description: 'Maintains neutral spinal curvature against isometric shear loads in deadlifts and squats.',
    posteriorPath: 'M92,185 L108,185 L106,225 L94,225 Z',
  },
  gluteus_maximus: {
    id: 'gluteus_maximus',
    name: 'Gluteus Maximus & Medius',
    group: 'legs',
    view: 'posterior',
    description: 'Extends and externally rotates the hip; primary power generator in hip thrusts, deadlifts, and squats.',
    posteriorPath: 'M75,215 Q100,210 125,215 L128,255 Q100,265 72,255 Z',
  },
  quadriceps: {
    id: 'quadriceps',
    name: 'Quadriceps Femoris',
    group: 'legs',
    view: 'anterior',
    description: 'Extends the knee joint; primary driver in squats, leg presses, and lunges.',
    anteriorPath: 'M74,220 Q100,215 126,220 L120,305 Q100,312 80,305 Z',
  },
  hamstrings: {
    id: 'hamstrings',
    name: 'Hamstrings Complex',
    group: 'legs',
    view: 'posterior',
    description: 'Flexes the knee and extends the hip; essential decelerator and posterior chain stabilizer.',
    posteriorPath: 'M75,258 Q100,265 125,258 L122,315 Q100,318 78,315 Z',
  },
  calves: {
    id: 'calves',
    name: 'Gastrocnemius & Soleus (Calves)',
    group: 'legs',
    view: 'both',
    description: 'Plantarflexes the ankle and stabilizes ground force transfer.',
    anteriorPath: 'M80,325 Q100,320 120,325 L116,375 Q100,378 84,375 Z',
    posteriorPath: 'M80,325 Q100,320 120,325 L116,375 Q100,378 84,375 Z',
  },
}

export function getExerciseMuscleEngagement(
  primaryMuscles: string[],
  secondaryMuscles: string[],
  stabilizers: string[]
): MuscleEngagementInfo[] {
  const result: MuscleEngagementInfo[] = []

  const findDefinition = (term: string): AnatomicalMuscleDefinition | undefined => {
    const lower = term.toLowerCase()
    return Object.values(ANATOMICAL_MUSCLES).find(
      (m) =>
        m.name.toLowerCase().includes(lower) ||
        m.group.toLowerCase().includes(lower) ||
        m.id.toLowerCase().includes(lower)
    )
  }

  // Map primary
  for (const m of primaryMuscles) {
    const def = findDefinition(m)
    if (def) {
      result.push({
        muscleId: def.id,
        name: def.name,
        role: 'agonist',
        functionDescription: def.description,
        anatomicalLocation: def.view,
      })
    }
  }

  // Map secondary
  for (const m of secondaryMuscles) {
    const def = findDefinition(m)
    if (def && !result.some((r) => r.muscleId === def.id)) {
      result.push({
        muscleId: def.id,
        name: def.name,
        role: 'synergist',
        functionDescription: def.description,
        anatomicalLocation: def.view,
      })
    }
  }

  // Map stabilizers
  for (const m of stabilizers) {
    const def = findDefinition(m)
    if (def && !result.some((r) => r.muscleId === def.id)) {
      result.push({
        muscleId: def.id,
        name: def.name,
        role: 'stabilizer',
        functionDescription: def.description,
        anatomicalLocation: def.view,
      })
    }
  }

  return result
}
