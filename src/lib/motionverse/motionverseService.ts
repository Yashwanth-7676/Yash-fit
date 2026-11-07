import {
  MotionVerseExercise,
  KinematicJointPositions,
  CameraViewAngle,
  MovementDifficulty,
} from '@/types/motionverse'

export const MOTIONVERSE_EXERCISES: MotionVerseExercise[] = [
  {
    id: 'squat',
    name: 'Barbell Back Squat',
    category: 'compound',
    targetMuscles: {
      primary: ['Quadriceps', 'Gluteus Maximus'],
      secondary: ['Hamstrings', 'Adductors', 'Calves'],
      stabilizers: ['Core & Rectus Abdominis', 'Erector Spinae'],
    },
    equipment: 'Olympic Barbell & Squat Rack',
    defaultTempo: '3-1-1-0',
    cycleDurationSeconds: 3.5,
    availableAngles: ['side', 'front', 'rear'],
    phases: [
      {
        id: 'sq-setup',
        name: 'Stance Setup & Unrack',
        phaseStartNorm: 0.0,
        phaseEndNorm: 0.15,
        cue: 'Feet shoulder-width apart, 15-30° toe out, brace core with Valsalva maneuver.',
        breathing: 'brace',
        activeMuscles: ['Core & Rectus Abdominis', 'Erector Spinae'],
        keyCheckpoints: ['Bar pinned across mid-traps', 'Neutral cervical spine'],
      },
      {
        id: 'sq-eccentric',
        name: 'Eccentric Descent',
        phaseStartNorm: 0.15,
        phaseEndNorm: 0.5,
        cue: 'Break at hips and knees simultaneously. Sit between hips, driving knees out in line with toes.',
        breathing: 'hold',
        activeMuscles: ['Quadriceps', 'Gluteus Maximus', 'Hamstrings'],
        keyCheckpoints: ['Torso angle matches tibia angle', 'Heels remain glued to floor'],
      },
      {
        id: 'sq-bottom',
        name: 'Parallel Inflection (The Hole)',
        phaseStartNorm: 0.5,
        phaseEndNorm: 0.6,
        cue: 'Hit hip crease just below parallel. Maintain tight thoracic extension without butt-wink.',
        breathing: 'hold',
        activeMuscles: ['Quadriceps', 'Gluteus Maximus', 'Adductors'],
        keyCheckpoints: ['Femur parallel to floor or below', 'Zero knee valgus collapse'],
      },
      {
        id: 'sq-concentric',
        name: 'Concentric Ascent Drive',
        phaseStartNorm: 0.6,
        phaseEndNorm: 0.9,
        cue: 'Drive mid-foot through the floor. Push upper back into the bar, leading with the chest.',
        breathing: 'exhale',
        activeMuscles: ['Quadriceps', 'Gluteus Maximus'],
        keyCheckpoints: ['Hips and shoulders rise at same rate', 'Bar path stays vertical over midfoot'],
      },
      {
        id: 'sq-lockout',
        name: 'Top Lockout & Reset',
        phaseStartNorm: 0.9,
        phaseEndNorm: 1.0,
        cue: 'Squeeze glutes at top lockout without hyperextending lower back.',
        breathing: 'inhale',
        activeMuscles: ['Gluteus Maximus', 'Core & Rectus Abdominis'],
        keyCheckpoints: ['Full hip extension', 'Stable stack before next repetition'],
      },
    ],
    formCheckpoints: [
      {
        joint: 'Knees',
        targetAngleDescription: '90° to 105° at bottom inflection',
        optimalAngleDeg: 95,
        commonMistake: 'Knee valgus collapse (knees caving inward during ascent)',
        correctionCue: 'Screw feet into ground and actively drive knees outward tracking your pinky toe.',
        severity: 'critical',
      },
      {
        joint: 'Lumbar Spine',
        targetAngleDescription: 'Neutral spine with 30-45° forward torso lean',
        optimalAngleDeg: 35,
        commonMistake: 'Posterior pelvic tilt (butt-wink) rounding lower back at the bottom',
        correctionCue: 'Limit depth to where lumbar stays rigid; improve ankle dorsiflexion mobility.',
        severity: 'critical',
      },
      {
        joint: 'Bar Path',
        targetAngleDescription: 'Strict vertical trajectory over midfoot',
        optimalAngleDeg: 90,
        commonMistake: 'Forward bar drift causing heel lift and excessive shear stress on knees',
        correctionCue: 'Maintain balanced three-point foot contact: big toe, pinky toe, and heel.',
        severity: 'moderate',
      },
    ],
    animeConfig: {
      characterName: 'Aura Titan Yash',
      heroTitle: 'Titan Stance: Gravity Breaker',
      auraColor: '#a3e635',
      energyTier: 'Rank S+ Kinetic Force',
      specialTechnique: 'Sub-Zero Depth Kinetic Discharge',
      visualStyle: 'titan',
    },
    beginnerModifications: ['Box Squat to 90° bench', 'Goblet Squat with dumbbell holding chest tall'],
    advancedProgressions: ['Pause Squats (3s in the hole)', 'Banded Overload Squats'],
  },
  {
    id: 'bench_press',
    name: 'Flat Barbell Bench Press',
    category: 'compound',
    targetMuscles: {
      primary: ['Pectoralis Major (Chest)'],
      secondary: ['Anterior Deltoid (Front Shoulder)', 'Triceps Brachii'],
      stabilizers: ['Latissimus Dorsi (Lats)', 'Core & Rectus Abdominis'],
    },
    equipment: 'Olympic Barbell & Flat Bench',
    defaultTempo: '2-1-1-0',
    cycleDurationSeconds: 3.2,
    availableAngles: ['side', 'front', 'rear'],
    phases: [
      {
        id: 'bp-setup',
        name: 'Arch & Scapular Retraction',
        phaseStartNorm: 0.0,
        phaseEndNorm: 0.15,
        cue: 'Pinch shoulder blades into the bench, plant feet firmly into the floor for leg drive.',
        breathing: 'brace',
        activeMuscles: ['Trapezius & Rhomboids', 'Latissimus Dorsi (Lats)'],
        keyCheckpoints: ['Eyes directly under bar', 'Wrists stacked above elbows'],
      },
      {
        id: 'bp-eccentric',
        name: 'Controlled Lowering',
        phaseStartNorm: 0.15,
        phaseEndNorm: 0.5,
        cue: 'Pull bar toward lower sternum with elbows tucked at 45-60° to torso.',
        breathing: 'hold',
        activeMuscles: ['Pectoralis Major (Chest)', 'Anterior Deltoid (Front Shoulder)'],
        keyCheckpoints: ['Forearms stay strictly perpendicular to floor'],
      },
      {
        id: 'bp-touch',
        name: 'Chest Touch & Reversal',
        phaseStartNorm: 0.5,
        phaseEndNorm: 0.6,
        cue: 'Light contact at lower chest without bouncing off ribcage. Maintain lat engagement.',
        breathing: 'hold',
        activeMuscles: ['Pectoralis Major (Chest)', 'Triceps Brachii'],
        keyCheckpoints: ['Zero shoulder rotation forward off bench'],
      },
      {
        id: 'bp-concentric',
        name: 'Concentric Press',
        phaseStartNorm: 0.6,
        phaseEndNorm: 0.9,
        cue: 'Drive heels into floor and press bar up and slightly back toward your eye-line.',
        breathing: 'exhale',
        activeMuscles: ['Pectoralis Major (Chest)', 'Triceps Brachii'],
        keyCheckpoints: ['J-curve bar path back toward rack pins'],
      },
      {
        id: 'bp-lockout',
        name: 'Top Lockout',
        phaseStartNorm: 0.9,
        phaseEndNorm: 1.0,
        cue: 'Lock elbows with shoulder blades still glued into bench padding.',
        breathing: 'inhale',
        activeMuscles: ['Triceps Brachii'],
        keyCheckpoints: ['Stacked wrists over elbows and shoulders'],
      },
    ],
    formCheckpoints: [
      {
        joint: 'Elbows',
        targetAngleDescription: '45° to 60° angle relative to ribcage',
        optimalAngleDeg: 50,
        commonMistake: 'Flared elbows at 90° placing severe impingement stress on rotators',
        correctionCue: 'Think about bending the bar in half to externally rotate shoulders.',
        severity: 'critical',
      },
      {
        joint: 'Wrists',
        targetAngleDescription: 'Vertical stack directly beneath bar',
        optimalAngleDeg: 90,
        commonMistake: 'Hyperextended wrists letting the bar roll back into fingers',
        correctionCue: 'Place bar in lower palm heel; squeeze bar with crushing grip.',
        severity: 'moderate',
      },
    ],
    animeConfig: {
      characterName: 'Aura Titan Yash',
      heroTitle: 'Pectoral Titan: Iron Cleave',
      auraColor: '#38bdf8',
      energyTier: 'Tier 1 Shockwave',
      specialTechnique: 'Dual-Cylinder Hydro Press',
      visualStyle: 'titan',
    },
    beginnerModifications: ['Dumbbell Bench Press with neutral palms', 'Floor Press for lockout safety'],
    advancedProgressions: ['Spoto Press (pause 1-inch above chest)', 'Close-Grip Tricep Overload'],
  },
  {
    id: 'deadlift',
    name: 'Conventional Deadlift',
    category: 'compound',
    targetMuscles: {
      primary: ['Gluteus Maximus & Medius', 'Hamstrings Complex', 'Erector Spinae (Lower Back)'],
      secondary: ['Latissimus Dorsi (Lats)', 'Quadriceps Femoris', 'Trapezius & Rhomboids'],
      stabilizers: ['Core & Rectus Abdominis', 'Gastrocnemius & Soleus (Calves)'],
    },
    equipment: 'Olympic Barbell & Bumper Plates',
    defaultTempo: '2-1-1-0',
    cycleDurationSeconds: 3.6,
    availableAngles: ['side', 'front', 'rear'],
    phases: [
      {
        id: 'dl-setup',
        name: 'Hip Hinge Setup & Slack Pull',
        phaseStartNorm: 0.0,
        phaseEndNorm: 0.2,
        cue: 'Bar 1 inch from shins. Hinge hips back, grip bar outside legs, pull the click out of the bar.',
        breathing: 'brace',
        activeMuscles: ['Latissimus Dorsi (Lats)', 'Hamstrings Complex'],
        keyCheckpoints: ['Shoulder blades directly over bar', 'Lats wedged tight like protecting armpits'],
      },
      {
        id: 'dl-liftoff',
        name: 'Floor Break & Knee Clearance',
        phaseStartNorm: 0.2,
        phaseEndNorm: 0.5,
        cue: 'Leg press the floor away. Keep bar glued against shins as knees extend.',
        breathing: 'hold',
        activeMuscles: ['Quadriceps Femoris', 'Hamstrings Complex', 'Gluteus Maximus & Medius'],
        keyCheckpoints: ['Hips do not shoot up before chest', 'Constant spinal stiffness'],
      },
      {
        id: 'dl-lockout',
        name: 'Glute Thrust Lockout',
        phaseStartNorm: 0.5,
        phaseEndNorm: 0.7,
        cue: 'Once bar clears knees, push hips forward into the bar. Stand tall without leaning back.',
        breathing: 'exhale',
        activeMuscles: ['Gluteus Maximus & Medius', 'Erector Spinae (Lower Back)'],
        keyCheckpoints: ['Knees and hips lock together', 'Shoulders back, chest proud'],
      },
      {
        id: 'dl-descent',
        name: 'Hinge Return to Floor',
        phaseStartNorm: 0.7,
        phaseEndNorm: 1.0,
        cue: 'Hinge at hips first until bar passes knees, then bend knees to set plates down controlled.',
        breathing: 'inhale',
        activeMuscles: ['Hamstrings Complex', 'Erector Spinae (Lower Back)'],
        keyCheckpoints: ['Bar stays close to body on path down', 'Reset breath before next rep'],
      },
    ],
    formCheckpoints: [
      {
        joint: 'Thoracic & Lumbar Spine',
        targetAngleDescription: 'Neutral rigid spine from sacrum to skull',
        optimalAngleDeg: 180,
        commonMistake: 'Lumbar flexion (cat-back rounding) under heavy load',
        correctionCue: 'Engage lats hard, push chest forward before lifting from floor.',
        severity: 'critical',
      },
      {
        joint: 'Hips & Knees',
        targetAngleDescription: 'Hip hinge higher than knees, lower than shoulders',
        optimalAngleDeg: 45,
        commonMistake: 'Squatting the deadlift (hips too low bumping bar forward)',
        correctionCue: 'Feel heavy tension in hamstrings during setup; hinge don’t squat.',
        severity: 'moderate',
      },
    ],
    animeConfig: {
      characterName: 'Aura Titan Yash',
      heroTitle: 'Earth Anchor: Faultline Pull',
      auraColor: '#f59e0b',
      energyTier: 'Cataclysmic Output',
      specialTechnique: 'Tectonic Deadstop Impulse',
      visualStyle: 'titan',
    },
    beginnerModifications: ['Trap Bar Deadlift for upright posture', 'Romanian Deadlift from rack pins'],
    advancedProgressions: ['Deficit Deadlifts (2-inch platform)', 'Snatch-Grip Deadlifts'],
  },
  {
    id: 'overhead_press',
    name: 'Standing Overhead Shoulder Press',
    category: 'compound',
    targetMuscles: {
      primary: ['Anterior Deltoid (Front Shoulder)', 'Lateral Deltoid (Side Shoulder)'],
      secondary: ['Triceps Brachii', 'Trapezius & Rhomboids'],
      stabilizers: ['Core & Rectus Abdominis', 'Gluteus Maximus & Medius'],
    },
    equipment: 'Olympic Barbell',
    defaultTempo: '2-0-1-0',
    cycleDurationSeconds: 3.0,
    availableAngles: ['side', 'front', 'rear'],
    phases: [
      {
        id: 'ohp-rack',
        name: 'Front Rack Stance',
        phaseStartNorm: 0.0,
        phaseEndNorm: 0.15,
        cue: 'Grip just outside shoulders, elbows slightly forward of bar. Squeeze glutes and quads rigid.',
        breathing: 'brace',
        activeMuscles: ['Core & Rectus Abdominis', 'Gluteus Maximus & Medius'],
        keyCheckpoints: ['Vertical forearms', 'Bar resting on clavicles/front delts'],
      },
      {
        id: 'ohp-press',
        name: 'Vertical Press & Head Clearance',
        phaseStartNorm: 0.15,
        phaseEndNorm: 0.6,
        cue: 'Pull chin slightly back, press bar straight up in a tight vertical line close to nose.',
        breathing: 'exhale',
        activeMuscles: ['Anterior Deltoid (Front Shoulder)', 'Triceps Brachii'],
        keyCheckpoints: ['No knee dip (strict military discipline)'],
      },
      {
        id: 'ohp-window',
        name: 'Lockout & Head Through Window',
        phaseStartNorm: 0.6,
        phaseEndNorm: 0.8,
        cue: 'As bar clears forehead, push head forward through the window, shrugging traps up to ceiling.',
        breathing: 'hold',
        activeMuscles: ['Trapezius & Rhomboids', 'Triceps Brachii'],
        keyCheckpoints: ['Bar stacked directly over base of neck, hips, and heels'],
      },
      {
        id: 'ohp-lower',
        name: 'Controlled Rack Return',
        phaseStartNorm: 0.8,
        phaseEndNorm: 1.0,
        cue: 'Lower bar controlled back to clavicles while keeping torso locked solid.',
        breathing: 'inhale',
        activeMuscles: ['Lateral Deltoid (Side Shoulder)', 'Anterior Deltoid (Front Shoulder)'],
        keyCheckpoints: ['Elbows stay forward of bar during descent'],
      },
    ],
    formCheckpoints: [
      {
        joint: 'Lumbar Spine',
        targetAngleDescription: 'Neutral without backward spinal arching',
        optimalAngleDeg: 180,
        commonMistake: 'Hyperextending lower back to turn press into an incline bench',
        correctionCue: 'Squeeze glutes rock hard and pull ribs down toward belt.',
        severity: 'critical',
      },
    ],
    animeConfig: {
      characterName: 'Aura Titan Yash',
      heroTitle: 'Skyward Aegis: Solar Pillar',
      auraColor: '#e11d48',
      energyTier: 'Apex Kinetic',
      specialTechnique: 'Celestial Overhead Nova',
      visualStyle: 'titan',
    },
    beginnerModifications: ['Seated Dumbbell Overhead Press', 'Half-Kneeling Landmine Press'],
    advancedProgressions: ['Push Press with triple extension', 'Z-Press seated on floor'],
  },
  {
    id: 'push_up',
    name: 'Standard Military Push-Up',
    category: 'calisthenics',
    targetMuscles: {
      primary: ['Pectoralis Major (Chest)'],
      secondary: ['Anterior Deltoid (Front Shoulder)', 'Triceps Brachii'],
      stabilizers: ['Core & Rectus Abdominis', 'Gluteus Maximus & Medius'],
    },
    equipment: 'Bodyweight',
    defaultTempo: '2-1-1-0',
    cycleDurationSeconds: 2.8,
    availableAngles: ['side', 'front', 'rear'],
    phases: [
      {
        id: 'pu-plank',
        name: 'Plank Foundation',
        phaseStartNorm: 0.0,
        phaseEndNorm: 0.15,
        cue: 'Hands beneath shoulders, straight line from heels to ears, glutes tight.',
        breathing: 'brace',
        activeMuscles: ['Core & Rectus Abdominis'],
        keyCheckpoints: ['Neutral neck looking 1 foot ahead'],
      },
      {
        id: 'pu-lower',
        name: 'Controlled Descent',
        phaseStartNorm: 0.15,
        phaseEndNorm: 0.5,
        cue: 'Lower chest until 1 inch off floor with elbows at 45° arrow shape.',
        breathing: 'inhale',
        activeMuscles: ['Pectoralis Major (Chest)', 'Triceps Brachii'],
        keyCheckpoints: ['Body moves as single rigid plank'],
      },
      {
        id: 'pu-drive',
        name: 'Floor Push Drive',
        phaseStartNorm: 0.5,
        phaseEndNorm: 0.85,
        cue: 'Push floor away, spreading shoulder blades at the top for full serratus activation.',
        breathing: 'exhale',
        activeMuscles: ['Pectoralis Major (Chest)', 'Triceps Brachii'],
        keyCheckpoints: ['Zero hip sag or pike'],
      },
      {
        id: 'pu-reset',
        name: 'Top Plank Reset',
        phaseStartNorm: 0.85,
        phaseEndNorm: 1.0,
        cue: 'Brief pause in active hollow plank position.',
        breathing: 'brace',
        activeMuscles: ['Core & Rectus Abdominis'],
        keyCheckpoints: ['Full elbow lockout with protraction'],
      },
    ],
    formCheckpoints: [
      {
        joint: 'Pelvis / Spine',
        targetAngleDescription: 'Straight line 180°',
        optimalAngleDeg: 180,
        commonMistake: 'Sagging hips causing lumbar hyperextension',
        correctionCue: 'Tuck pelvis into slight posterior tilt and squeeze glutes.',
        severity: 'critical',
      },
    ],
    animeConfig: {
      characterName: 'Shinobi Yash',
      heroTitle: 'Shadow Calisthenics: Viper Strike',
      auraColor: '#10b981',
      energyTier: 'Chakra Flow',
      specialTechnique: 'Zero-Gravity Floor Rebound',
      visualStyle: 'shinobi',
    },
    beginnerModifications: ['Incline Push-ups hands on bench', 'Knee Push-ups'],
    advancedProgressions: ['Decline Push-ups with feet on bench', 'Ring Push-ups'],
  },
  {
    id: 'pull_up',
    name: 'Strict Overhand Pull-Up',
    category: 'calisthenics',
    targetMuscles: {
      primary: ['Latissimus Dorsi (Lats)'],
      secondary: ['Biceps Brachii', 'Trapezius & Rhomboids', 'Rear Deltoid'],
      stabilizers: ['Core & Rectus Abdominis'],
    },
    equipment: 'Pull-Up Bar',
    defaultTempo: '2-1-1-0',
    cycleDurationSeconds: 3.2,
    availableAngles: ['rear', 'front', 'side'],
    phases: [
      {
        id: 'pl-deadhang',
        name: 'Deadhang & Scapular Depression',
        phaseStartNorm: 0.0,
        phaseEndNorm: 0.2,
        cue: 'Grip bar slightly wider than shoulders. Pull shoulders down away from ears before bending elbows.',
        breathing: 'brace',
        activeMuscles: ['Latissimus Dorsi (Lats)', 'Trapezius & Rhomboids'],
        keyCheckpoints: ['Active hang with hollow core'],
      },
      {
        id: 'pl-pull',
        name: 'Vertical Drive',
        phaseStartNorm: 0.2,
        phaseEndNorm: 0.6,
        cue: 'Drive elbows down into your back pockets. Pull chest up toward the bar.',
        breathing: 'exhale',
        activeMuscles: ['Latissimus Dorsi (Lats)', 'Biceps Brachii'],
        keyCheckpoints: ['Zero leg kicking or kipping'],
      },
      {
        id: 'pl-peak',
        name: 'Chin-Over-Bar Peak',
        phaseStartNorm: 0.6,
        phaseEndNorm: 0.7,
        cue: 'Clear chin over bar with elbows fully contracted and chest proud.',
        breathing: 'hold',
        activeMuscles: ['Latissimus Dorsi (Lats)', 'Biceps Brachii'],
        keyCheckpoints: ['Chest touching or approaching bar'],
      },
      {
        id: 'pl-eccentric',
        name: 'Full Extension Descent',
        phaseStartNorm: 0.7,
        phaseEndNorm: 1.0,
        cue: 'Lower smoothly until arms are completely straight, preserving core tension.',
        breathing: 'inhale',
        activeMuscles: ['Latissimus Dorsi (Lats)'],
        keyCheckpoints: ['Return to full deadhang'],
      },
    ],
    formCheckpoints: [
      {
        joint: 'Scapulae',
        targetAngleDescription: 'Full depression before flexion',
        optimalAngleDeg: 45,
        commonMistake: 'Kipping or rounding shoulders forward at the top',
        correctionCue: 'Initiate by packing shoulder blades down and back.',
        severity: 'moderate',
      },
    ],
    animeConfig: {
      characterName: 'Shinobi Yash',
      heroTitle: 'Sky Reaper: Vertical Ascent',
      auraColor: '#06b6d4',
      energyTier: 'Acrobatic Apex',
      specialTechnique: 'Celestial Cloud Snatch',
      visualStyle: 'shinobi',
    },
    beginnerModifications: ['Resistance Band-Assisted Pull-ups', 'Inverted Body Rows'],
    advancedProgressions: ['Weighted Pull-ups (+10-20kg)', 'L-Sit Pull-ups'],
  },
  {
    id: 'lunge',
    name: 'Stationary / Walking Lunge',
    category: 'compound',
    targetMuscles: {
      primary: ['Quadriceps Femoris', 'Gluteus Maximus & Medius'],
      secondary: ['Hamstrings Complex', 'Calves'],
      stabilizers: ['Core & Rectus Abdominis'],
    },
    equipment: 'Dumbbells / Bodyweight',
    defaultTempo: '2-0-1-0',
    cycleDurationSeconds: 3.0,
    availableAngles: ['side', 'front', 'rear'],
    phases: [
      {
        id: 'lg-step',
        name: 'Step & Deceleration',
        phaseStartNorm: 0.0,
        phaseEndNorm: 0.3,
        cue: 'Step forward firmly, keeping feet hip-width apart as on train tracks.',
        breathing: 'inhale',
        activeMuscles: ['Quadriceps Femoris'],
        keyCheckpoints: ['Torso stays upright with slight forward hinge'],
      },
      {
        id: 'lg-bottom',
        name: 'Dual 90° Knee Depth',
        phaseStartNorm: 0.3,
        phaseEndNorm: 0.6,
        cue: 'Lower back knee toward floor until both front and rear knees reach approximately 90°.',
        breathing: 'hold',
        activeMuscles: ['Quadriceps Femoris', 'Gluteus Maximus & Medius'],
        keyCheckpoints: ['Front knee stays stacked over front ankle'],
      },
      {
        id: 'lg-drive',
        name: 'Front Heel Push',
        phaseStartNorm: 0.6,
        phaseEndNorm: 0.9,
        cue: 'Drive through front heel to return to standing tall.',
        breathing: 'exhale',
        activeMuscles: ['Gluteus Maximus & Medius', 'Quadriceps Femoris'],
        keyCheckpoints: ['No inward knee collapse'],
      },
      {
        id: 'lg-finish',
        name: 'Stance Reset',
        phaseStartNorm: 0.9,
        phaseEndNorm: 1.0,
        cue: 'Feet return together in balance ready for next side.',
        breathing: 'brace',
        activeMuscles: ['Core & Rectus Abdominis'],
        keyCheckpoints: ['Full balance retention'],
      },
    ],
    formCheckpoints: [
      {
        joint: 'Front Knee',
        targetAngleDescription: '90° vertical tibia',
        optimalAngleDeg: 90,
        commonMistake: 'Front knee shooting excessively past toes with heel rising',
        correctionCue: 'Take slightly longer stride and load front heel.',
        severity: 'moderate',
      },
    ],
    animeConfig: {
      characterName: 'Aura Titan Yash',
      heroTitle: 'Stride Titan: Earth Crusher',
      auraColor: '#8b5cf6',
      energyTier: 'Unilateral Surge',
      specialTechnique: 'Dual-Phase Kinetic Piston',
      visualStyle: 'titan',
    },
    beginnerModifications: ['Static Split Squat holding wall', 'Reverse Lunge for reduced knee shear'],
    advancedProgressions: ['Deficit Reverse Lunges', 'Walking Dumbbell Overload Lunges'],
  },
  {
    id: 'bicep_curl',
    name: 'Barbell / Dumbbell Bicep Curl',
    category: 'isolation',
    targetMuscles: {
      primary: ['Biceps Brachii'],
      secondary: ['Brachialis', 'Brachioradialis'],
      stabilizers: ['Core & Rectus Abdominis', 'Anterior Deltoid (Front Shoulder)'],
    },
    equipment: 'Barbell / EZ-Curl Bar / Dumbbells',
    defaultTempo: '2-1-1-0',
    cycleDurationSeconds: 2.8,
    availableAngles: ['side', 'front', 'rear'],
    phases: [
      {
        id: 'bc-bottom',
        name: 'Full Arm Extension',
        phaseStartNorm: 0.0,
        phaseEndNorm: 0.15,
        cue: 'Arms fully extended, elbows pinned gently to ribs, chest upright.',
        breathing: 'brace',
        activeMuscles: ['Biceps Brachii'],
        keyCheckpoints: ['Zero torso swing momentum'],
      },
      {
        id: 'bc-curl',
        name: 'Concentric Arc',
        phaseStartNorm: 0.15,
        phaseEndNorm: 0.6,
        cue: 'Curl bar up in smooth circular arc without swinging elbows forward.',
        breathing: 'exhale',
        activeMuscles: ['Biceps Brachii'],
        keyCheckpoints: ['Wrists stay rigid and neutral'],
      },
      {
        id: 'bc-peak',
        name: 'Peak Contraction Squeeze',
        phaseStartNorm: 0.6,
        phaseEndNorm: 0.75,
        cue: 'Squeeze biceps hard at top contraction for 1 second.',
        breathing: 'hold',
        activeMuscles: ['Biceps Brachii'],
        keyCheckpoints: ['Elbows stay stationary by side'],
      },
      {
        id: 'bc-lower',
        name: 'Eccentric Negative',
        phaseStartNorm: 0.75,
        phaseEndNorm: 1.0,
        cue: 'Fight gravity lowering the weight smoothly over 2 full seconds.',
        breathing: 'inhale',
        activeMuscles: ['Biceps Brachii'],
        keyCheckpoints: ['Complete range of motion to bottom'],
      },
    ],
    formCheckpoints: [
      {
        joint: 'Elbow Position',
        targetAngleDescription: 'Fixed pivot at ribcage',
        optimalAngleDeg: 0,
        commonMistake: 'Elbows drifting forward turning curl into a front raise',
        correctionCue: 'Keep elbows locked against ribs throughout the rep.',
        severity: 'moderate',
      },
    ],
    animeConfig: {
      characterName: 'Aura Titan Yash',
      heroTitle: 'Bicep Engine: Diamond Forge',
      auraColor: '#f97316',
      energyTier: 'Vascular Peak',
      specialTechnique: 'Twin Coil Hypertrophy Wave',
      visualStyle: 'titan',
    },
    beginnerModifications: ['Seated Incline Dumbbell Curls', 'Cable Bicep Curls'],
    advancedProgressions: ['Strict Wall Curls (heels and back on wall)', 'Spider Curls'],
  },
  {
    id: 'barbell_row',
    name: 'Bent-Over Barbell Row',
    category: 'compound',
    targetMuscles: {
      primary: ['Latissimus Dorsi (Lats)', 'Trapezius & Rhomboids'],
      secondary: ['Posterior Deltoid (Rear Shoulder)', 'Biceps Brachii'],
      stabilizers: ['Erector Spinae (Lower Back)', 'Hamstrings Complex', 'Core & Rectus Abdominis'],
    },
    equipment: 'Olympic Barbell',
    defaultTempo: '2-1-1-0',
    cycleDurationSeconds: 3.2,
    availableAngles: ['side', 'front', 'rear'],
    phases: [
      {
        id: 'br-hinge',
        name: 'Bent-Over Hinge Stance',
        phaseStartNorm: 0.0,
        phaseEndNorm: 0.2,
        cue: 'Hinge forward at 45° with flat back, bar hanging directly beneath shoulders.',
        breathing: 'brace',
        activeMuscles: ['Erector Spinae (Lower Back)', 'Hamstrings Complex'],
        keyCheckpoints: ['Soft knees, rigid lumbar spine'],
      },
      {
        id: 'br-pull',
        name: 'Elbow Pull Drive',
        phaseStartNorm: 0.2,
        phaseEndNorm: 0.6,
        cue: 'Pull elbows back past ribs, rowing bar into belly button.',
        breathing: 'exhale',
        activeMuscles: ['Latissimus Dorsi (Lats)', 'Trapezius & Rhomboids'],
        keyCheckpoints: ['Torso stays stationary, no jerking upright'],
      },
      {
        id: 'br-squeeze',
        name: 'Scapular Retraction Pinch',
        phaseStartNorm: 0.6,
        phaseEndNorm: 0.75,
        cue: 'Pinch shoulder blades hard at top contraction.',
        breathing: 'hold',
        activeMuscles: ['Trapezius & Rhomboids', 'Latissimus Dorsi (Lats)'],
        keyCheckpoints: ['Bar touches abdominal wall'],
      },
      {
        id: 'br-lower',
        name: 'Controlled Extension',
        phaseStartNorm: 0.75,
        phaseEndNorm: 1.0,
        cue: 'Lower bar smoothly under control feeling lat stretch.',
        breathing: 'inhale',
        activeMuscles: ['Latissimus Dorsi (Lats)'],
        keyCheckpoints: ['Spine remains braced at 45° angle'],
      },
    ],
    formCheckpoints: [
      {
        joint: 'Torso Angle',
        targetAngleDescription: 'Stable 45° angle to floor',
        optimalAngleDeg: 45,
        commonMistake: 'Standing too upright using shrug momentum',
        correctionCue: 'Keep chest pointed at the floor and pull strictly with back.',
        severity: 'critical',
      },
    ],
    animeConfig: {
      characterName: 'Aura Titan Yash',
      heroTitle: 'Dorsal Titan: Abyssal Pull',
      auraColor: '#6366f1',
      energyTier: 'Subterranean Force',
      specialTechnique: 'Dual Lat Shockwave Row',
      visualStyle: 'titan',
    },
    beginnerModifications: ['Chest-Supported Dumbbell Row', 'Single-Arm Dumbbell Row on bench'],
    advancedProgressions: ['Pendlay Row (deadstop from floor)', 'Meadows Row with landmine'],
  },
  {
    id: 'plank',
    name: 'Forearm Anti-Extension Plank',
    category: 'core',
    targetMuscles: {
      primary: ['Core & Rectus Abdominis'],
      secondary: ['Gluteus Maximus & Medius', 'Quadriceps Femoris'],
      stabilizers: ['Anterior Deltoid (Front Shoulder)', 'Serratus Anterior'],
    },
    equipment: 'Exercise Mat / Floor',
    defaultTempo: 'Isometric Hold',
    cycleDurationSeconds: 4.0,
    availableAngles: ['side', 'front', 'rear'],
    phases: [
      {
        id: 'pk-tension',
        name: 'Isometric Full Body Tension',
        phaseStartNorm: 0.0,
        phaseEndNorm: 1.0,
        cue: 'Elbows under shoulders, pull elbows toward toes while squeezing glutes into posterior pelvic tilt.',
        breathing: 'hold',
        activeMuscles: ['Core & Rectus Abdominis', 'Gluteus Maximus & Medius'],
        keyCheckpoints: ['Straight ear-shoulder-hip-ankle line', 'Active belly button vacuum pull'],
      },
    ],
    formCheckpoints: [
      {
        joint: 'Hips / Lumbar',
        targetAngleDescription: '180° horizontal level plane',
        optimalAngleDeg: 180,
        commonMistake: 'Piking hips into tent or sagging hips toward floor',
        correctionCue: 'Imagine holding a plate on your lower back without it falling.',
        severity: 'critical',
      },
    ],
    animeConfig: {
      characterName: 'Shinobi Yash',
      heroTitle: 'Iron Fortress: Adamantine Shield',
      auraColor: '#14b8a6',
      energyTier: 'Absolute Barrier',
      specialTechnique: 'Unbreakable Core Ward',
      visualStyle: 'shinobi',
    },
    beginnerModifications: ['Knee Plank Hold', 'Incline Plank on bench'],
    advancedProgressions: ['RKC Maximum Tension Plank (15s limit)', 'Plank with Alternating Arm Reach'],
  },
]

/**
 * Calculates accurate multi-view skeletal joint coordinates for 2D/3D visualizers.
 * Supports Front, Side, and Rear camera projections and difficulty adaptations.
 */
export function calculateKinematicJoints(
  exerciseId: string,
  progress: number,
  angle: CameraViewAngle = 'side',
  difficulty: MovementDifficulty = 'intermediate'
): KinematicJointPositions {
  // Sinusoidal motion cycle (0 -> 1 -> 0)
  const norm = Math.max(0, Math.min(1, progress))
  const sin = (Math.sin(norm * Math.PI * 2 - Math.PI / 2) + 1) / 2

  // Difficulty scalar: beginner has shallower depth / conservative range, advanced has deep ROM
  const depthScalar = difficulty === 'beginner' ? 0.8 : difficulty === 'advanced' ? 1.15 : 1.0

  // Fallback defaults for standing person
  const centerX = 150
  const floorY = 210

  // 1. SQUAT KINEMATICS
  if (exerciseId === 'squat') {
    const hipDrop = sin * 55 * depthScalar
    const hipBack = angle === 'side' ? sin * 22 * depthScalar : 0
    const kneeForward = angle === 'side' ? sin * 16 * depthScalar : 0
    const kneeSpread = angle === 'front' || angle === 'rear' ? sin * 18 * depthScalar : 0

    const hipX = centerX - hipBack
    const hipY = 110 + hipDrop
    const kneeX = centerX + kneeForward
    const kneeY = 155 + hipDrop * 0.25
    const ankleY = floorY
    const barY = 65 + hipDrop

    const kneeAngle = Math.round(175 - sin * 90 * depthScalar)
    const hipHinge = Math.round(10 + sin * 35 * depthScalar)

    if (angle === 'side') {
      return {
        head: { x: hipX + 15, y: barY - 18 },
        neck: { x: hipX + 12, y: barY - 6 },
        shoulderLeft: { x: hipX + 10, y: barY },
        shoulderRight: { x: hipX + 10, y: barY },
        elbowLeft: { x: hipX + 4, y: barY + 22 },
        elbowRight: { x: hipX + 4, y: barY + 22 },
        wristLeft: { x: hipX + 14, y: barY + 6 },
        wristRight: { x: hipX + 14, y: barY + 6 },
        spineMid: { x: hipX + 5, y: (barY + hipY) / 2 },
        hipLeft: { x: hipX, y: hipY },
        hipRight: { x: hipX, y: hipY },
        kneeLeft: { x: kneeX, y: kneeY },
        kneeRight: { x: kneeX, y: kneeY },
        ankleLeft: { x: centerX, y: ankleY },
        ankleRight: { x: centerX, y: ankleY },
        barbell: { x1: 50, y1: barY, x2: 250, y2: barY },
        jointAngles: {
          kneeAngleDeg: kneeAngle,
          hipHingeDeg: hipHinge,
          torsoAngleDeg: hipHinge,
        },
        barPathY: barY,
      }
    }

    // Front or Rear View
    const legOffset = 25 + kneeSpread
    return {
      head: { x: centerX, y: barY - 20 },
      neck: { x: centerX, y: barY - 8 },
      shoulderLeft: { x: centerX - 30, y: barY },
      shoulderRight: { x: centerX + 30, y: barY },
      elbowLeft: { x: centerX - 38, y: barY + 24 },
      elbowRight: { x: centerX + 38, y: barY + 24 },
      wristLeft: { x: centerX - 30, y: barY + 6 },
      wristRight: { x: centerX + 30, y: barY + 6 },
      spineMid: { x: centerX, y: (barY + hipY) / 2 },
      hipLeft: { x: centerX - 20, y: hipY },
      hipRight: { x: centerX + 20, y: hipY },
      kneeLeft: { x: centerX - legOffset, y: kneeY },
      kneeRight: { x: centerX + legOffset, y: kneeY },
      ankleLeft: { x: centerX - 26, y: ankleY },
      ankleRight: { x: centerX + 26, y: ankleY },
      barbell: { x1: 30, y1: barY, x2: 270, y2: barY },
      jointAngles: {
        kneeAngleDeg: kneeAngle,
        hipHingeDeg: hipHinge,
      },
      barPathY: barY,
    }
  }

  // 2. BENCH PRESS KINEMATICS
  if (exerciseId === 'bench_press') {
    const benchY = 170
    const barY = 90 + sin * 50 * depthScalar // lowest (closest to chest/bench) when sin=1
    const elbowSpread = angle === 'front' ? sin * 22 : sin * 16

    if (angle === 'side') {
      return {
        head: { x: 75, y: benchY - 12 },
        neck: { x: 90, y: benchY - 10 },
        shoulderLeft: { x: 105, y: benchY - 10 },
        shoulderRight: { x: 105, y: benchY - 10 },
        elbowLeft: { x: 95 + sin * 14, y: benchY - 10 + sin * 24 },
        elbowRight: { x: 95 + sin * 14, y: benchY - 10 + sin * 24 },
        wristLeft: { x: 110, y: barY },
        wristRight: { x: 110, y: barY },
        spineMid: { x: 135, y: benchY - 12 },
        hipLeft: { x: 175, y: benchY - 10 },
        hipRight: { x: 175, y: benchY - 10 },
        kneeLeft: { x: 205, y: benchY + 5 },
        kneeRight: { x: 205, y: benchY + 5 },
        ankleLeft: { x: 215, y: floorY },
        ankleRight: { x: 215, y: floorY },
        bench: { x: 55, y: benchY, width: 140, height: 12 },
        barbell: { x1: 50, y1: barY, x2: 170, y2: barY },
        jointAngles: {
          elbowFlexionDeg: Math.round(170 - sin * 85),
        },
        barPathY: barY,
      }
    }

    // Front / Rear View on Bench
    return {
      head: { x: centerX, y: 155 },
      neck: { x: centerX, y: 150 },
      shoulderLeft: { x: centerX - 30, y: 152 },
      shoulderRight: { x: centerX + 30, y: 152 },
      elbowLeft: { x: centerX - 30 - elbowSpread, y: 152 + sin * 18 },
      elbowRight: { x: centerX + 30 + elbowSpread, y: 152 + sin * 18 },
      wristLeft: { x: centerX - 34, y: barY },
      wristRight: { x: centerX + 34, y: barY },
      spineMid: { x: centerX, y: 165 },
      hipLeft: { x: centerX - 20, y: 180 },
      hipRight: { x: centerX + 20, y: 180 },
      kneeLeft: { x: centerX - 45, y: 195 },
      kneeRight: { x: centerX + 45, y: 195 },
      ankleLeft: { x: centerX - 45, y: floorY },
      ankleRight: { x: centerX + 45, y: floorY },
      bench: { x: centerX - 35, y: 145, width: 70, height: 45 },
      barbell: { x1: 30, y1: barY, x2: 270, y2: barY },
      jointAngles: {
        elbowFlexionDeg: Math.round(170 - sin * 85),
      },
      barPathY: barY,
    }
  }

  // 3. DEADLIFT KINEMATICS
  if (exerciseId === 'deadlift') {
    // Lift from floor (barY ~ 180) to lockout (barY ~ 125)
    const barY = 125 + (1 - sin) * 55 * depthScalar
    const hipHingeBack = (1 - sin) * 26 * depthScalar

    const hipX = centerX - hipHingeBack
    const hipY = 110 + (1 - sin) * 20 * depthScalar
    const kneeY = 150
    const shoulderX = hipX + 10 + (1 - sin) * 14
    const shoulderY = hipY - 45 + (1 - sin) * 18

    return {
      head: { x: shoulderX + 4, y: shoulderY - 16 },
      neck: { x: shoulderX + 2, y: shoulderY - 6 },
      shoulderLeft: { x: shoulderX, y: shoulderY },
      shoulderRight: { x: shoulderX, y: shoulderY },
      elbowLeft: { x: (shoulderX + centerX) / 2, y: (shoulderY + barY) / 2 },
      elbowRight: { x: (shoulderX + centerX) / 2, y: (shoulderY + barY) / 2 },
      wristLeft: { x: centerX, y: barY },
      wristRight: { x: centerX, y: barY },
      spineMid: { x: (shoulderX + hipX) / 2, y: (shoulderY + hipY) / 2 },
      hipLeft: { x: hipX, y: hipY },
      hipRight: { x: hipX, y: hipY },
      kneeLeft: { x: centerX - 6, y: kneeY },
      kneeRight: { x: centerX - 6, y: kneeY },
      ankleLeft: { x: centerX - 5, y: floorY },
      ankleRight: { x: centerX - 5, y: floorY },
      barbell: { x1: 40, y1: barY, x2: 260, y2: barY },
      jointAngles: {
        hipHingeDeg: Math.round(15 + (1 - sin) * 45),
        kneeAngleDeg: Math.round(175 - (1 - sin) * 60),
      },
      barPathY: barY,
    }
  }

  // 4. OVERHEAD PRESS KINEMATICS
  if (exerciseId === 'overhead_press') {
    const barY = 45 + (1 - sin) * 55 * depthScalar
    const elbowY = 95 + (1 - sin) * 18

    return {
      head: { x: centerX, y: 70 },
      neck: { x: centerX, y: 82 },
      shoulderLeft: { x: centerX - 25, y: 88 },
      shoulderRight: { x: centerX + 25, y: 88 },
      elbowLeft: { x: centerX - 32 - (1 - sin) * 8, y: elbowY },
      elbowRight: { x: centerX + 32 + (1 - sin) * 8, y: elbowY },
      wristLeft: { x: centerX - 28, y: barY },
      wristRight: { x: centerX + 28, y: barY },
      spineMid: { x: centerX, y: 115 },
      hipLeft: { x: centerX - 18, y: 135 },
      hipRight: { x: centerX + 18, y: 135 },
      kneeLeft: { x: centerX - 20, y: 175 },
      kneeRight: { x: centerX + 20, y: 175 },
      ankleLeft: { x: centerX - 22, y: floorY },
      ankleRight: { x: centerX + 22, y: floorY },
      barbell: { x1: 35, y1: barY, x2: 265, y2: barY },
      jointAngles: {
        elbowFlexionDeg: Math.round(175 - (1 - sin) * 85),
      },
      barPathY: barY,
    }
  }

  // 5. PUSH-UP KINEMATICS
  if (exerciseId === 'push_up') {
    const chestY = 175 - sin * 28 * depthScalar // lower toward floor
    const hipY = 165 - sin * 22 * depthScalar
    const headX = 85
    const feetX = 225

    return {
      head: { x: headX, y: chestY - 12 },
      neck: { x: headX + 10, y: chestY - 4 },
      shoulderLeft: { x: headX + 20, y: chestY },
      shoulderRight: { x: headX + 20, y: chestY },
      elbowLeft: { x: headX + 15, y: chestY - 15 - sin * 10 },
      elbowRight: { x: headX + 15, y: chestY - 15 - sin * 10 },
      wristLeft: { x: headX + 20, y: floorY - 5 },
      wristRight: { x: headX + 20, y: floorY - 5 },
      spineMid: { x: (headX + 20 + feetX) / 2, y: (chestY + hipY) / 2 },
      hipLeft: { x: 165, y: hipY },
      hipRight: { x: 165, y: hipY },
      kneeLeft: { x: 195, y: (hipY + floorY) / 2 },
      kneeRight: { x: 195, y: (hipY + floorY) / 2 },
      ankleLeft: { x: feetX, y: floorY - 5 },
      ankleRight: { x: feetX, y: floorY - 5 },
      jointAngles: {
        elbowFlexionDeg: Math.round(85 + (1 - sin) * 85),
      },
    }
  }

  // 6. PULL-UP KINEMATICS
  if (exerciseId === 'pull_up') {
    const barY = 45
    const chinY = 70 - sin * 42 * depthScalar // pulls up past bar

    return {
      head: { x: centerX, y: chinY - 16 },
      neck: { x: centerX, y: chinY - 6 },
      shoulderLeft: { x: centerX - 26, y: chinY },
      shoulderRight: { x: centerX + 26, y: chinY },
      elbowLeft: { x: centerX - 36 + sin * 10, y: chinY + 22 - sin * 12 },
      elbowRight: { x: centerX + 36 - sin * 10, y: chinY + 22 - sin * 12 },
      wristLeft: { x: centerX - 32, y: barY },
      wristRight: { x: centerX + 32, y: barY },
      spineMid: { x: centerX, y: chinY + 35 },
      hipLeft: { x: centerX - 16, y: chinY + 60 },
      hipRight: { x: centerX + 16, y: chinY + 60 },
      kneeLeft: { x: centerX - 18, y: chinY + 95 },
      kneeRight: { x: centerX + 18, y: chinY + 95 },
      ankleLeft: { x: centerX - 20, y: chinY + 130 },
      ankleRight: { x: centerX + 20, y: chinY + 130 },
      barbell: { x1: 50, y1: barY, x2: 250, y2: barY },
      jointAngles: {
        elbowFlexionDeg: Math.round(175 - sin * 105),
      },
    }
  }

  // 7. DEFAULT / LUNGE / CURL / ROW / PLANK GENERAL MOTION SOLVER
  const generalTravel = sin * 35 * depthScalar
  return {
    head: { x: centerX, y: 70 + generalTravel * 0.2 },
    neck: { x: centerX, y: 82 + generalTravel * 0.2 },
    shoulderLeft: { x: centerX - 25, y: 88 + generalTravel * 0.2 },
    shoulderRight: { x: centerX + 25, y: 88 + generalTravel * 0.2 },
    elbowLeft: { x: centerX - 32, y: 120 + generalTravel * 0.5 },
    elbowRight: { x: centerX + 32, y: 120 + generalTravel * 0.5 },
    wristLeft: { x: centerX - 32, y: 150 - generalTravel * 0.8 },
    wristRight: { x: centerX + 32, y: 150 - generalTravel * 0.8 },
    spineMid: { x: centerX, y: 115 + generalTravel * 0.2 },
    hipLeft: { x: centerX - 18, y: 135 + generalTravel * 0.3 },
    hipRight: { x: centerX + 18, y: 135 + generalTravel * 0.3 },
    kneeLeft: { x: centerX - 20, y: 175 + generalTravel * 0.1 },
    kneeRight: { x: centerX + 20, y: 175 + generalTravel * 0.1 },
    ankleLeft: { x: centerX - 22, y: floorY },
    ankleRight: { x: centerX + 22, y: floorY },
    jointAngles: {
      elbowFlexionDeg: Math.round(90 + sin * 60),
    },
  }
}

export function getMotionVerseExercise(id: string): MotionVerseExercise {
  const found = MOTIONVERSE_EXERCISES.find((ex) => ex.id === id)
  return found || MOTIONVERSE_EXERCISES[0]
}
