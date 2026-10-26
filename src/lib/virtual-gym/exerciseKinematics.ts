import type { Exercise3DConfig, JointAngles } from '@/types/virtualGym'
import type { MuscleGroup } from '@/types/workout'

/**
 * Calculates a smooth cyclic interpolation between 0 and 1.
 * Returns 0 at start/end of cycle, reaches 1.0 at midpoint (peak contraction).
 */
export function cyclicProgress(t: number): number {
  // Clamp progress to 0-1
  const norm = Math.max(0, Math.min(1, t))
  // Sine curve: starts at 0, reaches 1 at norm=0.5, returns to 0 at norm=1.0
  return Math.sin(norm * Math.PI)
}

// 1. SQUAT KINEMATICS
function getSquatKinematics(progress: number): JointAngles {
  const c = cyclicProgress(progress) // 0 to 1 at bottom
  return {
    torsoPitch: 10 + c * 25, // 10° upright to 35° forward torso hinge
    torsoYaw: 0,
    torsoHeight: -c * 0.45, // drops down 0.45 units

    // Hip & Knee flexion
    leftHipPitch: -c * 85,
    leftKneePitch: c * 95,
    leftAnklePitch: -c * 20,

    rightHipPitch: -c * 85,
    rightKneePitch: c * 95,
    rightAnklePitch: -c * 20,

    // Arms rack barbell or held forward
    leftShoulderPitch: -45,
    leftShoulderYaw: 15,
    leftShoulderRoll: 10,
    leftElbowPitch: 80,

    rightShoulderPitch: -45,
    rightShoulderYaw: -15,
    rightShoulderRoll: -10,
    rightElbowPitch: 80,

    showBarbell: true,
    showDumbbells: false,
    showBench: false,
    barbellPosition: [0, 1.45 - c * 0.45, -0.05],
  }
}

// 2. PUSH-UP KINEMATICS
function getPushUpKinematics(progress: number): JointAngles {
  const c = cyclicProgress(progress) // 0 at top, 1 at bottom of push-up
  return {
    torsoPitch: 85, // prone horizontal position
    torsoYaw: 0,
    torsoHeight: -0.65 + (1 - c) * 0.35, // lowering toward floor

    leftHipPitch: 0,
    leftKneePitch: 0,
    leftAnklePitch: 30,

    rightHipPitch: 0,
    rightKneePitch: 0,
    rightAnklePitch: 30,

    // Elbows bend from 15° to 90°
    leftShoulderPitch: -80,
    leftShoulderYaw: 30,
    leftShoulderRoll: 20,
    leftElbowPitch: 20 + c * 75,

    rightShoulderPitch: -80,
    rightShoulderYaw: -30,
    rightShoulderRoll: -20,
    rightElbowPitch: 20 + c * 75,

    showBarbell: false,
    showDumbbells: false,
    showBench: false,
  }
}

// 3. LUNGE KINEMATICS
function getLungeKinematics(progress: number): JointAngles {
  const c = cyclicProgress(progress) // 0 to 1 at bottom of lunge
  return {
    torsoPitch: 5,
    torsoYaw: 0,
    torsoHeight: -c * 0.35,

    // Front (Left) leg: hip flexes, knee bends to ~90°
    leftHipPitch: -c * 75,
    leftKneePitch: c * 85,
    leftAnklePitch: -c * 15,

    // Back (Right) leg: hip extends, knee bends towards floor
    rightHipPitch: c * 25,
    rightKneePitch: c * 80,
    rightAnklePitch: c * 35,

    // Dumbbells at sides
    leftShoulderPitch: 0,
    leftShoulderYaw: 0,
    leftShoulderRoll: 5,
    leftElbowPitch: 10,

    rightShoulderPitch: 0,
    rightShoulderYaw: 0,
    rightShoulderRoll: -5,
    rightElbowPitch: 10,

    showBarbell: false,
    showDumbbells: true,
    showBench: false,
  }
}

// 4. BICEP CURL KINEMATICS
function getBicepCurlKinematics(progress: number): JointAngles {
  const c = cyclicProgress(progress) // 0 at bottom, 1 at top squeeze
  return {
    torsoPitch: 0,
    torsoYaw: 0,
    torsoHeight: 0,

    leftHipPitch: 0,
    leftKneePitch: 5,
    leftAnklePitch: 0,

    rightHipPitch: 0,
    rightKneePitch: 5,
    rightAnklePitch: 0,

    // Elbows pinned, forearms curl upwards from 10° to 125°
    leftShoulderPitch: 5,
    leftShoulderYaw: 0,
    leftShoulderRoll: 5,
    leftElbowPitch: 10 + c * 115,

    rightShoulderPitch: 5,
    rightShoulderYaw: 0,
    rightShoulderRoll: -5,
    rightElbowPitch: 10 + c * 115,

    showBarbell: false,
    showDumbbells: true,
    showBench: false,
  }
}

// 5. OVERHEAD SHOULDER PRESS KINEMATICS
function getOverheadPressKinematics(progress: number): JointAngles {
  const c = cyclicProgress(progress) // 0 at shoulder level, 1 at full overhead lockout
  return {
    torsoPitch: 0,
    torsoYaw: 0,
    torsoHeight: 0,

    leftHipPitch: 0,
    leftKneePitch: 5,
    leftAnklePitch: 0,

    rightHipPitch: 0,
    rightKneePitch: 5,
    rightAnklePitch: 0,

    // Press upwards from shoulder height to full extension
    leftShoulderPitch: -40 - c * 110, // abducts/presses upward
    leftShoulderYaw: 20 - c * 10,
    leftShoulderRoll: 30 - c * 25,
    leftElbowPitch: 100 - c * 85, // extends from 100° to 15°

    rightShoulderPitch: -40 - c * 110,
    rightShoulderYaw: -20 + c * 10,
    rightShoulderRoll: -30 + c * 25,
    rightElbowPitch: 100 - c * 85,

    showBarbell: true,
    showDumbbells: false,
    showBench: false,
    barbellPosition: [0, 1.45 + c * 0.55, 0.05],
  }
}

// 6. BENT-OVER ROW KINEMATICS
function getBentOverRowKinematics(progress: number): JointAngles {
  const c = cyclicProgress(progress) // 0 at hanging arms, 1 at full squeeze
  return {
    torsoPitch: 50, // 50° hip hinge
    torsoYaw: 0,
    torsoHeight: -0.15,

    leftHipPitch: -45,
    leftKneePitch: 25,
    leftAnklePitch: 0,

    rightHipPitch: -45,
    rightKneePitch: 25,
    rightAnklePitch: 0,

    // Pull barbell to lower sternum
    leftShoulderPitch: 20 - c * 40,
    leftShoulderYaw: 10,
    leftShoulderRoll: 10,
    leftElbowPitch: 15 + c * 90,

    rightShoulderPitch: 20 - c * 40,
    rightShoulderYaw: -10,
    rightShoulderRoll: -10,
    rightElbowPitch: 15 + c * 90,

    showBarbell: true,
    showDumbbells: false,
    showBench: false,
    barbellPosition: [0, 0.65 + c * 0.3, 0.25 - c * 0.1],
  }
}

// 7. PLANK KINEMATICS
function getPlankKinematics(progress: number): JointAngles {
  // Isometric hold with subtle rhythmic breathing pulse
  const breath = Math.sin(progress * Math.PI * 4) * 0.02
  return {
    torsoPitch: 85, // horizontal prone bridge
    torsoYaw: 0,
    torsoHeight: -0.55 + breath,

    leftHipPitch: 0,
    leftKneePitch: 0,
    leftAnklePitch: 35,

    rightHipPitch: 0,
    rightKneePitch: 0,
    rightAnklePitch: 35,

    // Forearms resting flat on floor
    leftShoulderPitch: -75,
    leftShoulderYaw: 15,
    leftShoulderRoll: 10,
    leftElbowPitch: 90,

    rightShoulderPitch: -75,
    rightShoulderYaw: -15,
    rightShoulderRoll: -10,
    rightElbowPitch: 90,

    showBarbell: false,
    showDumbbells: false,
    showBench: false,
  }
}

// 8. BENCH PRESS KINEMATICS
function getBenchPressKinematics(progress: number): JointAngles {
  const c = cyclicProgress(progress) // 0 at top lockout, 1 at chest touch
  return {
    torsoPitch: -90, // supine flat on bench
    torsoYaw: 0,
    torsoHeight: -0.4,

    leftHipPitch: 50,
    leftKneePitch: 90,
    leftAnklePitch: 10,

    rightHipPitch: 50,
    rightKneePitch: 90,
    rightAnklePitch: 10,

    // Press from chest up
    leftShoulderPitch: -10 - (1 - c) * 30,
    leftShoulderYaw: 30,
    leftShoulderRoll: 20,
    leftElbowPitch: 15 + c * 80,

    rightShoulderPitch: -10 - (1 - c) * 30,
    rightShoulderYaw: -30,
    rightShoulderRoll: -20,
    rightElbowPitch: 15 + c * 80,

    showBarbell: true,
    showDumbbells: false,
    showBench: true,
    barbellPosition: [0, 0.85 - c * 0.35, 0.1],
  }
}

// Universal fallback kinematic solver for any exercise
function getUniversalKinematics(progress: number): JointAngles {
  const c = cyclicProgress(progress)
  return {
    torsoPitch: c * 10,
    torsoYaw: 0,
    torsoHeight: -c * 0.1,
    leftHipPitch: -c * 20,
    leftKneePitch: c * 25,
    leftAnklePitch: 0,
    rightHipPitch: -c * 20,
    rightKneePitch: c * 25,
    rightAnklePitch: 0,
    leftShoulderPitch: -c * 45,
    leftShoulderYaw: 0,
    leftShoulderRoll: 0,
    leftElbowPitch: 20 + c * 60,
    rightShoulderPitch: -c * 45,
    rightShoulderYaw: 0,
    rightShoulderRoll: 0,
    rightElbowPitch: 20 + c * 60,
    showBarbell: false,
    showDumbbells: true,
    showBench: false,
  }
}

export const EXERCISE_3D_CONFIGS: Record<string, Exercise3DConfig> = {
  'ex-barbell-back-squat': {
    id: 'ex-barbell-back-squat',
    name: 'Barbell Back Squat',
    motionKey: 'squat',
    primaryMuscles: ['Quads', 'Glutes'],
    secondaryMuscles: ['Hamstrings', 'Calves', 'Core'],
    equipment: 'Barbell',
    difficulty: 'Intermediate',
    tempo: '3-1-1-0',
    cycleDurationSeconds: 4.5,
    defaultCamera: 'isometric',
    startingPosition: 'Feet shoulder-width apart, bar securely resting across upper traps, chest upright.',
    endingPosition: 'Hips descend below parallel with neutral spine, then drive through midfoot to full extension.',
    phases: [
      { name: 'Eccentric Descent', startProgress: 0.0, endProgress: 0.45, cue: 'Hinge hips, bend knees, maintain chest upright' },
      { name: 'Parallel Depth Pause', startProgress: 0.45, endProgress: 0.55, cue: 'Brief turnaround at parallel without knee cave' },
      { name: 'Concentric Drive', startProgress: 0.55, endProgress: 0.95, cue: 'Drive feet into floor, exhale, extend hips & knees' },
      { name: 'Lockout & Reset', startProgress: 0.95, endProgress: 1.0, cue: 'Stand tall, squeeze glutes, inhale for next rep' },
    ],
    instructions: [
      'Position barbell across upper trapezius with a secure grip.',
      'Take a shoulder-width stance with toes angled slightly outward (15-30°).',
      'Inhale deeply, brace your core, and initiate movement by hinging hips back and bending knees.',
      'Descend under control until thighs are at least parallel to the floor.',
      'Drive powerfully through midfoot while keeping chest proud and knees tracking over toes.',
    ],
    commonMistakes: [
      'Knee valgus (knees caving inward) during ascent.',
      'Heels lifting off the floor due to ankle mobility limits.',
      'Rounding the lower spine (butt wink) at the bottom.',
      'Looking down instead of maintaining a neutral neck.',
    ],
    safetyTips: [
      'Always use safety spotter bars set just below your bottom depth.',
      'Maintain continuous intra-abdominal pressure throughout the eccentric phase.',
      'Do not bounce abruptly out of the bottom position.',
    ],
    kinematics: getSquatKinematics,
  },

  'ex-push-ups': {
    id: 'ex-push-ups',
    name: 'Standard Push-ups',
    motionKey: 'push_up',
    primaryMuscles: ['Chest', 'Triceps'],
    secondaryMuscles: ['Shoulders', 'Core'],
    equipment: 'No Equipment',
    difficulty: 'Beginner',
    tempo: '2-1-1-0',
    cycleDurationSeconds: 3.5,
    defaultCamera: 'side',
    startingPosition: 'High plank with hands stacked slightly wider than shoulders, rigid straight body line.',
    endingPosition: 'Chest hovers 1-2 inches above floor, elbows at 45°, full lockout at top.',
    phases: [
      { name: 'Controlled Descent', startProgress: 0.0, endProgress: 0.45, cue: 'Lower torso in one straight line, tuck elbows 45°' },
      { name: 'Bottom Stretch', startProgress: 0.45, endProgress: 0.55, cue: 'Pause 1 inch above floor with active chest tension' },
      { name: 'Press & Lockout', startProgress: 0.55, endProgress: 0.95, cue: 'Push floor away, drive through palms, full protraction' },
      { name: 'Plank Reset', startProgress: 0.95, endProgress: 1.0, cue: 'Reinforce glute and abdominal brace' },
    ],
    instructions: [
      'Place hands slightly wider than shoulder width on the floor.',
      'Form a straight rigid line from heels to head by squeezing glutes and engaging core.',
      'Lower your chest under control until it hovers 1-2 inches off the ground.',
      'Keep elbows tucked at a roughly 45° angle to protect the shoulders.',
      'Push firmly through the palms back to full lockout, spreading shoulder blades slightly at top.',
    ],
    commonMistakes: [
      'Sagging lower back or elevated hips breaking the plank line.',
      'Flaring elbows out to 90° (T-shape) causing anterior shoulder impingement.',
      'Craning the neck toward the floor instead of lowering the chest.',
    ],
    safetyTips: [
      'Regress to elevated push-ups (hands on bench) if back sags or form breaks down.',
      'Maintain tension in quads and glutes to preserve spine neutral alignment.',
    ],
    kinematics: getPushUpKinematics,
  },

  'ex-walking-lunges': {
    id: 'ex-walking-lunges',
    name: 'Walking Lunges',
    motionKey: 'lunge',
    primaryMuscles: ['Quads', 'Glutes'],
    secondaryMuscles: ['Hamstrings', 'Calves', 'Core'],
    equipment: 'Dumbbells',
    difficulty: 'Intermediate',
    tempo: '2-0-1-0',
    cycleDurationSeconds: 3.5,
    defaultCamera: 'side',
    startingPosition: 'Standing tall holding dumbbells at sides, core braced.',
    endingPosition: 'Front thigh parallel to floor, back knee hovering just off ground, push back to standing.',
    phases: [
      { name: 'Forward Step & Drop', startProgress: 0.0, endProgress: 0.45, cue: 'Step forward smoothly, descend straight down' },
      { name: '90° Knee Flexion', startProgress: 0.45, endProgress: 0.55, cue: 'Front knee stays aligned over midfoot' },
      { name: 'Drive Through Lead Heel', startProgress: 0.55, endProgress: 0.95, cue: 'Push through front heel to step up and through' },
      { name: 'Balance Reset', startProgress: 0.95, endProgress: 1.0, cue: 'Reset posture before initiating next stride' },
    ],
    instructions: [
      'Hold a dumbbell in each hand at arms length by your sides.',
      'Take a comfortable forward step, planting lead foot firmly.',
      'Lower your hips straight downward until both knees are bent at roughly 90 degrees.',
      'Ensure front knee remains stacked directly over midfoot/ankle.',
      'Drive powerfully through front heel to return to standing or transition to the next step.',
    ],
    commonMistakes: [
      'Taking too short a stride causing front heel to elevate.',
      'Torso collapsing forward onto the front thigh.',
      'Banging back knee hard into the floor.',
    ],
    safetyTips: [
      'Focus on a stable focal point at eye level to support balance.',
      'Keep rear knee 1-2 inches above floor without jarring impact.',
    ],
    kinematics: getLungeKinematics,
  },

  'ex-dumbbell-bicep-curl': {
    id: 'ex-dumbbell-bicep-curl',
    name: 'Dumbbell Bicep Curl',
    motionKey: 'bicep_curl',
    primaryMuscles: ['Biceps'],
    secondaryMuscles: ['Core'],
    equipment: 'Dumbbells',
    difficulty: 'Beginner',
    tempo: '3-0-1-1',
    cycleDurationSeconds: 4.0,
    defaultCamera: 'front',
    startingPosition: 'Standing with arms extended, palms facing thighs (semi-supinated).',
    endingPosition: 'Forearms fully flexed with wrists supinated toward shoulders, peak contraction.',
    phases: [
      { name: 'Initial Flexion', startProgress: 0.0, endProgress: 0.35, cue: 'Keep elbows stationary, begin curling upward' },
      { name: 'Supination & Peak Squeeze', startProgress: 0.35, endProgress: 0.55, cue: 'Rotate palms upward, squeeze biceps at top' },
      { name: 'Eccentric Lowering', startProgress: 0.55, endProgress: 0.95, cue: 'Resist gravity for a slow 3-second descent' },
      { name: 'Full Extension Stretch', startProgress: 0.95, endProgress: 1.0, cue: 'Brief pause with arms lengthened before next rep' },
    ],
    instructions: [
      'Stand upright with feet hip-width apart holding a dumbbell in each hand.',
      'Keep elbows pinned securely against the sides of your ribcage.',
      'Curl the weights upward while supinating your forearms (turning palms face-up).',
      'Squeeze biceps hard at the peak for one second without swinging torso.',
      'Lower dumbbells slowly over 3 seconds back to the starting hanging position.',
    ],
    commonMistakes: [
      'Swinging hips or using lower back momentum to launch the dumbbells.',
      'Allowing elbows to drift forward in front of the chest.',
      'Dropping the weights quickly on the eccentric phase.',
    ],
    safetyTips: [
      'Select a weight where form remains strict without backward torso hyperextension.',
      'Maintain soft knees and braced core throughout.',
    ],
    kinematics: getBicepCurlKinematics,
  },

  'ex-overhead-press': {
    id: 'ex-overhead-press',
    name: 'Standing Overhead Barbell Press',
    motionKey: 'overhead_press',
    primaryMuscles: ['Shoulders', 'Triceps'],
    secondaryMuscles: ['Core', 'Back'],
    equipment: 'Barbell',
    difficulty: 'Intermediate',
    tempo: '2-0-1-1',
    cycleDurationSeconds: 4.0,
    defaultCamera: 'front',
    startingPosition: 'Bar rested across clavicles/front delts, elbows slightly forward of bar, glutes squeezed.',
    endingPosition: 'Bar pressed vertically overhead in line with spine, arms fully extended.',
    phases: [
      { name: 'Initial Vertical Drive', startProgress: 0.0, endProgress: 0.40, cue: 'Tuck chin slightly, drive bar straight upward' },
      { name: 'Head Through Window', startProgress: 0.40, endProgress: 0.55, cue: 'Push head forward once bar clears forehead' },
      { name: 'Lockout Overhead', startProgress: 0.55, endProgress: 0.65, cue: 'Shrug traps slightly at top lockout' },
      { name: 'Controlled Descent', startProgress: 0.65, endProgress: 1.0, cue: 'Lower bar back to clavicles under control' },
    ],
    instructions: [
      'Grip the bar slightly wider than shoulder width with forearms perpendicular to ground.',
      'Rest bar at collarbone height, brace abdominals, and squeeze glutes tight.',
      'Tilt chin back slightly to allow bar to travel in a straight vertical path.',
      'Press upward explosively; once bar clears head, bring torso under the bar.',
      'Lock out arms directly above midfoot and shoulder joint, then lower with control.',
    ],
    commonMistakes: [
      'Arching lower back excessively to compensate for shoulder mobility.',
      'Pressing the bar forward around the head in a curved arc.',
      'Loose core and soft glutes dissipating pressing power.',
    ],
    safetyTips: [
      'Never bounce weight off your clavicles.',
      'Keep wrists stacked neutral above forearms to avoid wrist strain.',
    ],
    kinematics: getOverheadPressKinematics,
  },

  'ex-bent-over-row': {
    id: 'ex-bent-over-row',
    name: 'Barbell Bent-over Row',
    motionKey: 'bent_over_row',
    primaryMuscles: ['Back', 'Biceps'],
    secondaryMuscles: ['Shoulders', 'Core', 'Hamstrings'],
    equipment: 'Barbell',
    difficulty: 'Intermediate',
    tempo: '2-1-1-0',
    cycleDurationSeconds: 4.0,
    defaultCamera: 'side',
    startingPosition: 'Hips hinged at ~45-50°, spine neutral, arms hanging holding bar below knees.',
    endingPosition: 'Bar pulled to lower ribcage, elbows driven past torso, scapulae retracted.',
    phases: [
      { name: 'Elbow Drive', startProgress: 0.0, endProgress: 0.45, cue: 'Lead with elbows, pull bar toward navel' },
      { name: 'Scapular Squeeze', startProgress: 0.45, endProgress: 0.55, cue: 'Pinch shoulder blades together at top' },
      { name: 'Controlled Eccentric', startProgress: 0.55, endProgress: 0.95, cue: 'Lower bar slowly while keeping spine flat' },
      { name: 'Full Lat Stretch', startProgress: 0.95, endProgress: 1.0, cue: 'Feel lats stretch without losing spinal brace' },
    ],
    instructions: [
      'Hinge forward at the hips until torso is roughly 45 degrees relative to floor.',
      'Keep lower back flat, chest open, and knees soft with weight in midfoot/heels.',
      'Hold barbell with an overhand grip slightly wider than shoulder width.',
      'Pull the bar upward toward your belly button by driving elbows backward.',
      'Squeeze your shoulder blades together at the peak, then lower under control.',
    ],
    commonMistakes: [
      'Standing up excessively on each repetition using momentum.',
      'Rounding the lumbar spine, putting shear stress on discs.',
      'Jerking the neck upward instead of keeping it neutral.',
    ],
    safetyTips: [
      'If lower back fatigues, reduce weight or switch to chest-supported rows.',
      'Keep barbell close to shins and thighs during movement.',
    ],
    kinematics: getBentOverRowKinematics,
  },

  'ex-plank': {
    id: 'ex-plank',
    name: 'Isometric Forearm Plank',
    motionKey: 'plank',
    primaryMuscles: ['Core'],
    secondaryMuscles: ['Shoulders', 'Glutes', 'Quads'],
    equipment: 'No Equipment',
    difficulty: 'Beginner',
    tempo: 'Isometric Hold',
    cycleDurationSeconds: 5.0,
    defaultCamera: 'side',
    startingPosition: 'Prone position resting on elbows directly below shoulders, feet hip-width.',
    endingPosition: 'Rigid horizontal line maintained from head to heels with steady diaphragmatic breathing.',
    phases: [
      { name: 'Isometric Core Bracing', startProgress: 0.0, endProgress: 0.50, cue: 'Pull belly button to spine, squeeze glutes' },
      { name: 'Rhythmic Respiration', startProgress: 0.50, endProgress: 1.0, cue: 'Maintain deep breathing without losing abdominal pressure' },
    ],
    instructions: [
      'Place forearms on the floor with elbows stacked directly beneath shoulders.',
      'Extend legs back with toes tucked, rising onto forearms and toes.',
      'Actively tuck pelvis slightly into posterior pelvic tilt and squeeze glutes.',
      'Press forearms firmly into the floor to keep chest from collapsing between shoulder blades.',
      'Hold position while taking slow, deep diaphragmatic breaths.',
    ],
    commonMistakes: [
      'Letting the hips sag towards the floor, hyperextending lumbar spine.',
      'Piking hips into the air to relieve core tension.',
      'Holding breath instead of breathing rhythmically.',
    ],
    safetyTips: [
      'Discontinue or drop to knees as soon as form breaks or lower back pinches.',
      'Quality of tension is more effective than passive time.',
    ],
    kinematics: getPlankKinematics,
  },

  'ex-barbell-bench-press': {
    id: 'ex-barbell-bench-press',
    name: 'Barbell Flat Bench Press',
    motionKey: 'bench_press',
    primaryMuscles: ['Chest', 'Triceps'],
    secondaryMuscles: ['Shoulders'],
    equipment: 'Barbell',
    difficulty: 'Intermediate',
    tempo: '3-1-1-0',
    cycleDurationSeconds: 4.5,
    defaultCamera: 'isometric',
    startingPosition: 'Lying flat on bench with eyes under bar, shoulder blades retracted, feet flat.',
    endingPosition: 'Bar touches lower chest with elbows at ~45-70°, then pressed vertically to lockout.',
    phases: [
      { name: 'Controlled Descent', startProgress: 0.0, endProgress: 0.45, cue: 'Lower bar smoothly to mid-chest, elbows 45°' },
      { name: 'Chest Touch Turnaround', startProgress: 0.45, endProgress: 0.55, cue: 'Touch sternum lightly without bouncing' },
      { name: 'Explosive Press', startProgress: 0.55, endProgress: 0.95, cue: 'Press up and slightly back toward eye line' },
      { name: 'Lockout & Stability', startProgress: 0.95, endProgress: 1.0, cue: 'Arms extended, shoulder blades retracted' },
    ],
    instructions: [
      'Lie flat on the bench with eyes directly under the racked bar.',
      'Grip the bar slightly wider than shoulder width and firmly plant feet.',
      'Unrack the bar and stabilize it directly over your chest with arms extended.',
      'Lower the bar under control until it lightly touches your mid-chest.',
      'Drive your feet into the floor and press the bar up and slightly backward over your shoulders.',
    ],
    commonMistakes: [
      'Bouncing the bar hard off the rib cage.',
      'Flaring elbows out to 90 degrees putting rotator cuff at risk.',
      'Lifting glutes or feet off the bench/ground during the press.',
    ],
    safetyTips: [
      'Always use a spotter or safety catches when lifting heavy loads.',
      'Keep wrists straight rather than hyperextended backwards.',
    ],
    kinematics: getBenchPressKinematics,
  },
}

/**
 * Resolves or creates an Exercise3DConfig for any exercise in the database.
 */
export function getExercise3DConfig(exerciseId: string, fallbackName?: string, primaryMuscle?: MuscleGroup): Exercise3DConfig {
  if (EXERCISE_3D_CONFIGS[exerciseId]) {
    return EXERCISE_3D_CONFIGS[exerciseId]
  }

  // Fallback matching by motion keyword
  const lowerId = exerciseId.toLowerCase()
  if (lowerId.includes('squat')) return { ...EXERCISE_3D_CONFIGS['ex-barbell-back-squat'], id: exerciseId, name: fallbackName || 'Squat Variation' }
  if (lowerId.includes('push') && lowerId.includes('up')) return { ...EXERCISE_3D_CONFIGS['ex-push-ups'], id: exerciseId, name: fallbackName || 'Push-up Variation' }
  if (lowerId.includes('lunge')) return { ...EXERCISE_3D_CONFIGS['ex-walking-lunges'], id: exerciseId, name: fallbackName || 'Lunge Variation' }
  if (lowerId.includes('curl')) return { ...EXERCISE_3D_CONFIGS['ex-dumbbell-bicep-curl'], id: exerciseId, name: fallbackName || 'Arm Curl' }
  if (lowerId.includes('overhead') || lowerId.includes('shoulder-press') || lowerId.includes('military')) {
    return { ...EXERCISE_3D_CONFIGS['ex-overhead-press'], id: exerciseId, name: fallbackName || 'Overhead Press' }
  }
  if (lowerId.includes('row')) return { ...EXERCISE_3D_CONFIGS['ex-bent-over-row'], id: exerciseId, name: fallbackName || 'Row Variation' }
  if (lowerId.includes('plank')) return { ...EXERCISE_3D_CONFIGS['ex-plank'], id: exerciseId, name: fallbackName || 'Plank Core Hold' }
  if (lowerId.includes('bench')) return { ...EXERCISE_3D_CONFIGS['ex-barbell-bench-press'], id: exerciseId, name: fallbackName || 'Bench Press Variation' }

  // Generic dynamic configuration
  return {
    id: exerciseId,
    name: fallbackName || 'Exercise Demonstration',
    motionKey: 'squat',
    primaryMuscles: primaryMuscle ? [primaryMuscle] : ['Chest'],
    secondaryMuscles: ['Core'],
    equipment: 'Dumbbells',
    difficulty: 'Intermediate',
    tempo: '3-1-1-0',
    cycleDurationSeconds: 4.0,
    defaultCamera: 'isometric',
    startingPosition: 'Set up in neutral athletic posture with core engaged.',
    endingPosition: 'Execute complete range of motion with controlled turnaround.',
    phases: [
      { name: 'Eccentric Phase', startProgress: 0.0, endProgress: 0.45, cue: 'Lower under control resisting load' },
      { name: 'Turnaround', startProgress: 0.45, endProgress: 0.55, cue: 'Maintain active tension at transition' },
      { name: 'Concentric Phase', startProgress: 0.55, endProgress: 0.95, cue: 'Drive through target muscle group' },
      { name: 'Reset', startProgress: 0.95, endProgress: 1.0, cue: 'Breathe and reset for next repetition' },
    ],
    instructions: [
      'Assume a stable athletic stance with weight distributed across midfoot.',
      'Brace core musculature before initiating the movement.',
      'Perform repetition through comfortable active range of motion.',
      'Control eccentric phase for 2-3 seconds for optimal muscle stimulus.',
    ],
    commonMistakes: [
      'Using excessive momentum instead of muscular control.',
      'Losing neutral spinal alignment during peak effort.',
    ],
    safetyTips: [
      'Select load that allows smooth control without joint discomfort.',
      'Stop if acute sharp pain occurs.',
    ],
    kinematics: getUniversalKinematics,
  }
}
