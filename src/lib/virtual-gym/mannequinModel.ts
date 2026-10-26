import * as THREE from 'three'
import type { JointAngles } from '@/types/virtualGym'
import type { MuscleGroup } from '@/types/workout'

// Materials cache
export interface MannequinMaterials {
  base: THREE.MeshStandardMaterial
  joint: THREE.MeshStandardMaterial
  primaryHighlight: THREE.MeshStandardMaterial
  secondaryHighlight: THREE.MeshStandardMaterial
  selectedHighlight: THREE.MeshStandardMaterial
  metalChrome: THREE.MeshStandardMaterial
  rubberWeight: THREE.MeshStandardMaterial
  benchLeather: THREE.MeshStandardMaterial
}

export function createMannequinMaterials(): MannequinMaterials {
  return {
    base: new THREE.MeshStandardMaterial({
      color: 0x27272a, // dark titanium zinc-800
      roughness: 0.55,
      metalness: 0.35,
    }),
    joint: new THREE.MeshStandardMaterial({
      color: 0x18181b, // zinc-900 joint pivots
      roughness: 0.6,
      metalness: 0.5,
    }),
    primaryHighlight: new THREE.MeshStandardMaterial({
      color: 0x84cc16, // lime-500
      emissive: 0xa3e635, // bright lime-400
      emissiveIntensity: 0.75,
      roughness: 0.25,
      metalness: 0.2,
    }),
    secondaryHighlight: new THREE.MeshStandardMaterial({
      color: 0x0284c7, // sky-600
      emissive: 0x38bdf8, // sky-400
      emissiveIntensity: 0.55,
      roughness: 0.3,
      metalness: 0.2,
    }),
    selectedHighlight: new THREE.MeshStandardMaterial({
      color: 0xd97706, // amber-600
      emissive: 0xf59e0b, // amber-500
      emissiveIntensity: 0.8,
      roughness: 0.25,
      metalness: 0.2,
    }),
    metalChrome: new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      roughness: 0.2,
      metalness: 0.85,
    }),
    rubberWeight: new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.7,
      metalness: 0.1,
    }),
    benchLeather: new THREE.MeshStandardMaterial({
      color: 0x09090b,
      roughness: 0.8,
      metalness: 0.05,
    }),
  }
}

export interface MannequinRig {
  rootGroup: THREE.Group
  pelvis: THREE.Group
  spine: THREE.Group
  chestGroup: THREE.Group
  neck: THREE.Group
  head: THREE.Mesh

  // Left Arm
  leftClavicle: THREE.Group
  leftShoulder: THREE.Group
  leftUpperArm: THREE.Mesh
  leftElbow: THREE.Group
  leftForearm: THREE.Mesh
  leftHand: THREE.Mesh

  // Right Arm
  rightClavicle: THREE.Group
  rightShoulder: THREE.Group
  rightUpperArm: THREE.Mesh
  rightElbow: THREE.Group
  rightForearm: THREE.Mesh
  rightHand: THREE.Mesh

  // Left Leg
  leftHip: THREE.Group
  leftThigh: THREE.Mesh
  leftKnee: THREE.Group
  leftShin: THREE.Mesh
  leftFoot: THREE.Mesh

  // Right Leg
  rightHip: THREE.Group
  rightThigh: THREE.Mesh
  rightKnee: THREE.Group
  rightShin: THREE.Mesh
  rightFoot: THREE.Mesh

  // Muscle mesh lists for quick highlighting
  muscleMeshes: { mesh: THREE.Mesh; muscle: MuscleGroup }[]

  // Props
  barbellGroup: THREE.Group
  dumbbellLeft: THREE.Group
  dumbbellRight: THREE.Group
  benchGroup: THREE.Group

  materials: MannequinMaterials

  updatePose: (angles: JointAngles) => void
  highlightMuscles: (
    primary: MuscleGroup[],
    secondary: MuscleGroup[],
    selected?: MuscleGroup | null
  ) => void
}

const DEG2RAD = Math.PI / 180

export function buildMannequinRig(): MannequinRig {
  const materials = createMannequinMaterials()
  const rootGroup = new THREE.Group()
  rootGroup.name = 'MannequinRoot'

  const muscleMeshes: { mesh: THREE.Mesh; muscle: MuscleGroup }[] = []

  function tagMuscle(mesh: THREE.Mesh, muscle: MuscleGroup) {
    mesh.userData = { isMuscle: true, muscleGroup: muscle }
    muscleMeshes.push({ mesh, muscle })
  }

  // 1. Pelvis / Hips (Root pivot at y = 1.05m off ground)
  const pelvis = new THREE.Group()
  pelvis.position.set(0, 1.05, 0)
  rootGroup.add(pelvis)

  // Pelvis hub geometry
  const pelvisGeom = new THREE.CylinderGeometry(0.18, 0.15, 0.16, 16)
  const pelvisMesh = new THREE.Mesh(pelvisGeom, materials.base)
  pelvisMesh.castShadow = true
  pelvis.add(pelvisMesh)

  // Glutes (attached to back/lower pelvis)
  const gluteGeom = new THREE.SphereGeometry(0.12, 16, 16)
  gluteGeom.scale(1.0, 0.9, 1.2)
  const leftGlute = new THREE.Mesh(gluteGeom, materials.base)
  leftGlute.position.set(-0.1, -0.04, -0.1)
  tagMuscle(leftGlute, 'Glutes')
  pelvis.add(leftGlute)

  const rightGlute = new THREE.Mesh(gluteGeom, materials.base)
  rightGlute.position.set(0.1, -0.04, -0.1)
  tagMuscle(rightGlute, 'Glutes')
  pelvis.add(rightGlute)

  // 2. Spine / Core
  const spine = new THREE.Group()
  spine.position.set(0, 0.08, 0)
  pelvis.add(spine)

  // Core / Abdominals cylinder
  const coreGeom = new THREE.CylinderGeometry(0.16, 0.17, 0.22, 16)
  coreGeom.scale(1.1, 1.0, 0.85)
  const coreMesh = new THREE.Mesh(coreGeom, materials.base)
  coreMesh.position.set(0, 0.11, 0)
  coreMesh.castShadow = true
  tagMuscle(coreMesh, 'Core')
  spine.add(coreMesh)

  // 3. Chest & Upper Torso
  const chestGroup = new THREE.Group()
  chestGroup.position.set(0, 0.22, 0)
  spine.add(chestGroup)

  // Thoracic torso block
  const chestGeom = new THREE.CylinderGeometry(0.24, 0.18, 0.24, 16)
  chestGeom.scale(1.25, 1.0, 0.85)
  const chestMain = new THREE.Mesh(chestGeom, materials.base)
  chestMain.position.set(0, 0.12, 0)
  tagMuscle(chestMain, 'Chest')
  chestGroup.add(chestMain)

  // Pectoral Plates (Front)
  const pecGeom = new THREE.BoxGeometry(0.16, 0.14, 0.06)
  const leftPec = new THREE.Mesh(pecGeom, materials.base)
  leftPec.position.set(-0.09, 0.14, 0.12)
  tagMuscle(leftPec, 'Chest')
  chestGroup.add(leftPec)

  const rightPec = new THREE.Mesh(pecGeom, materials.base)
  rightPec.position.set(0.09, 0.14, 0.12)
  tagMuscle(rightPec, 'Chest')
  chestGroup.add(rightPec)

  // Upper Back / Lats (Back)
  const latGeom = new THREE.BoxGeometry(0.38, 0.24, 0.08)
  const backMesh = new THREE.Mesh(latGeom, materials.base)
  backMesh.position.set(0, 0.12, -0.1)
  tagMuscle(backMesh, 'Back')
  chestGroup.add(backMesh)

  // 4. Neck & Head
  const neck = new THREE.Group()
  neck.position.set(0, 0.24, 0)
  chestGroup.add(neck)

  const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 12), materials.joint)
  neckMesh.position.set(0, 0.05, 0)
  neck.add(neckMesh)

  const headGeom = new THREE.SphereGeometry(0.12, 16, 16)
  headGeom.scale(0.85, 1.15, 0.95)
  const head = new THREE.Mesh(headGeom, materials.base)
  head.position.set(0, 0.18, 0)
  head.castShadow = true
  neck.add(head)

  // Head visor/band for stylized athletic look
  const visorGeom = new THREE.BoxGeometry(0.16, 0.04, 0.14)
  const visorMesh = new THREE.Mesh(visorGeom, materials.metalChrome)
  visorMesh.position.set(0, 0.19, 0.06)
  neck.add(visorMesh)

  // 5. Left Arm Assembly
  const leftClavicle = new THREE.Group()
  leftClavicle.position.set(-0.2, 0.2, 0)
  chestGroup.add(leftClavicle)

  const leftShoulder = new THREE.Group()
  leftClavicle.add(leftShoulder)

  // Left Deltoid Mesh
  const deltGeom = new THREE.SphereGeometry(0.09, 16, 16)
  deltGeom.scale(1.0, 1.2, 1.0)
  const leftDelt = new THREE.Mesh(deltGeom, materials.base)
  tagMuscle(leftDelt, 'Shoulders')
  leftShoulder.add(leftDelt)

  // Left Bicep & Tricep (Upper Arm)
  const armGeom = new THREE.CylinderGeometry(0.065, 0.055, 0.26, 12)
  const leftUpperArm = new THREE.Mesh(armGeom, materials.base)
  leftUpperArm.position.set(0, -0.14, 0)
  tagMuscle(leftUpperArm, 'Biceps')
  leftShoulder.add(leftUpperArm)

  // Left Tricep plate
  const triGeom = new THREE.BoxGeometry(0.06, 0.18, 0.05)
  const leftTri = new THREE.Mesh(triGeom, materials.base)
  leftTri.position.set(0, -0.14, -0.045)
  tagMuscle(leftTri, 'Triceps')
  leftShoulder.add(leftTri)

  // Left Elbow
  const leftElbow = new THREE.Group()
  leftElbow.position.set(0, -0.28, 0)
  leftShoulder.add(leftElbow)

  const leftElbowPivot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), materials.joint)
  leftElbow.add(leftElbowPivot)

  // Left Forearm
  const forearmGeom = new THREE.CylinderGeometry(0.05, 0.04, 0.24, 12)
  const leftForearm = new THREE.Mesh(forearmGeom, materials.base)
  leftForearm.position.set(0, -0.13, 0)
  leftElbow.add(leftForearm)

  // Left Hand
  const handGeom = new THREE.BoxGeometry(0.06, 0.08, 0.04)
  const leftHand = new THREE.Mesh(handGeom, materials.base)
  leftHand.position.set(0, -0.28, 0)
  leftElbow.add(leftHand)

  // 6. Right Arm Assembly
  const rightClavicle = new THREE.Group()
  rightClavicle.position.set(0.2, 0.2, 0)
  chestGroup.add(rightClavicle)

  const rightShoulder = new THREE.Group()
  rightClavicle.add(rightShoulder)

  const rightDelt = new THREE.Mesh(deltGeom, materials.base)
  tagMuscle(rightDelt, 'Shoulders')
  rightShoulder.add(rightDelt)

  const rightUpperArm = new THREE.Mesh(armGeom, materials.base)
  rightUpperArm.position.set(0, -0.14, 0)
  tagMuscle(rightUpperArm, 'Biceps')
  rightShoulder.add(rightUpperArm)

  const rightTri = new THREE.Mesh(triGeom, materials.base)
  rightTri.position.set(0, -0.14, -0.045)
  tagMuscle(rightTri, 'Triceps')
  rightShoulder.add(rightTri)

  const rightElbow = new THREE.Group()
  rightElbow.position.set(0, -0.28, 0)
  rightShoulder.add(rightElbow)

  const rightElbowPivot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), materials.joint)
  rightElbow.add(rightElbowPivot)

  const rightForearm = new THREE.Mesh(forearmGeom, materials.base)
  rightForearm.position.set(0, -0.13, 0)
  rightElbow.add(rightForearm)

  const rightHand = new THREE.Mesh(handGeom, materials.base)
  rightHand.position.set(0, -0.28, 0)
  rightElbow.add(rightHand)

  // 7. Left Leg Assembly
  const leftHip = new THREE.Group()
  leftHip.position.set(-0.13, -0.08, 0)
  pelvis.add(leftHip)

  const leftHipPivot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), materials.joint)
  leftHip.add(leftHipPivot)

  // Thigh: Quads (front) and Hamstrings (back)
  const thighGeom = new THREE.CylinderGeometry(0.09, 0.07, 0.44, 16)
  thighGeom.scale(1.1, 1.0, 1.1)
  const leftThigh = new THREE.Mesh(thighGeom, materials.base)
  leftThigh.position.set(0, -0.24, 0)
  tagMuscle(leftThigh, 'Quads')
  leftHip.add(leftThigh)

  // Hamstring bulge
  const hamGeom = new THREE.BoxGeometry(0.12, 0.32, 0.07)
  const leftHam = new THREE.Mesh(hamGeom, materials.base)
  leftHam.position.set(0, -0.24, -0.06)
  tagMuscle(leftHam, 'Hamstrings')
  leftHip.add(leftHam)

  // Left Knee
  const leftKnee = new THREE.Group()
  leftKnee.position.set(0, -0.48, 0)
  leftHip.add(leftKnee)

  const leftKneePivot = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 12), materials.joint)
  leftKnee.add(leftKneePivot)

  // Left Shin & Calf
  const shinGeom = new THREE.CylinderGeometry(0.065, 0.045, 0.42, 14)
  const leftShin = new THREE.Mesh(shinGeom, materials.base)
  leftShin.position.set(0, -0.23, 0)
  tagMuscle(leftShin, 'Calves')
  leftKnee.add(leftShin)

  // Calf bulge
  const calfGeom = new THREE.SphereGeometry(0.08, 14, 14)
  calfGeom.scale(0.9, 1.4, 1.1)
  const leftCalf = new THREE.Mesh(calfGeom, materials.base)
  leftCalf.position.set(0, -0.18, -0.04)
  tagMuscle(leftCalf, 'Calves')
  leftKnee.add(leftCalf)

  // Left Foot
  const footGeom = new THREE.BoxGeometry(0.09, 0.07, 0.22)
  const leftFoot = new THREE.Mesh(footGeom, materials.base)
  leftFoot.position.set(0, -0.47, 0.06)
  leftKnee.add(leftFoot)

  // 8. Right Leg Assembly
  const rightHip = new THREE.Group()
  rightHip.position.set(0.13, -0.08, 0)
  pelvis.add(rightHip)

  const rightHipPivot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), materials.joint)
  rightHip.add(rightHipPivot)

  const rightThigh = new THREE.Mesh(thighGeom, materials.base)
  rightThigh.position.set(0, -0.24, 0)
  tagMuscle(rightThigh, 'Quads')
  rightHip.add(rightThigh)

  const rightHam = new THREE.Mesh(hamGeom, materials.base)
  rightHam.position.set(0, -0.24, -0.06)
  tagMuscle(rightHam, 'Hamstrings')
  rightHip.add(rightHam)

  const rightKnee = new THREE.Group()
  rightKnee.position.set(0, -0.48, 0)
  rightHip.add(rightKnee)

  const rightKneePivot = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 12), materials.joint)
  rightKnee.add(rightKneePivot)

  const rightShin = new THREE.Mesh(shinGeom, materials.base)
  rightShin.position.set(0, -0.23, 0)
  tagMuscle(rightShin, 'Calves')
  rightKnee.add(rightShin)

  const rightCalf = new THREE.Mesh(calfGeom, materials.base)
  rightCalf.position.set(0, -0.18, -0.04)
  tagMuscle(rightCalf, 'Calves')
  rightKnee.add(rightCalf)

  const rightFoot = new THREE.Mesh(footGeom, materials.base)
  rightFoot.position.set(0, -0.47, 0.06)
  rightKnee.add(rightFoot)

  // 9. PROPS / EQUIPMENT
  // Barbell
  const barbellGroup = new THREE.Group()
  const barShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.8, 16), materials.metalChrome)
  barShaft.rotation.z = Math.PI / 2
  barbellGroup.add(barShaft)

  // Plates left and right
  const plateGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.05, 24)
  plateGeom.rotateZ(Math.PI / 2)
  const leftPlate = new THREE.Mesh(plateGeom, materials.rubberWeight)
  leftPlate.position.set(-0.75, 0, 0)
  barbellGroup.add(leftPlate)

  const rightPlate = new THREE.Mesh(plateGeom, materials.rubberWeight)
  rightPlate.position.set(0.75, 0, 0)
  barbellGroup.add(rightPlate)

  barbellGroup.visible = false
  rootGroup.add(barbellGroup)

  // Dumbbells (Left & Right)
  const dumbbellLeft = new THREE.Group()
  const dumbbellRight = new THREE.Group()

  function buildDumbbell(): THREE.Group {
    const grp = new THREE.Group()
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.22, 12), materials.metalChrome)
    handle.rotation.z = Math.PI / 2
    grp.add(handle)

    const hexGeom = new THREE.CylinderGeometry(0.07, 0.07, 0.06, 6)
    hexGeom.rotateZ(Math.PI / 2)
    const end1 = new THREE.Mesh(hexGeom, materials.rubberWeight)
    end1.position.set(-0.12, 0, 0)
    grp.add(end1)

    const end2 = new THREE.Mesh(hexGeom, materials.rubberWeight)
    end2.position.set(0.12, 0, 0)
    grp.add(end2)
    return grp
  }

  dumbbellLeft.add(buildDumbbell())
  leftHand.add(dumbbellLeft)
  dumbbellLeft.visible = false

  dumbbellRight.add(buildDumbbell())
  rightHand.add(dumbbellRight)
  dumbbellRight.visible = false

  // Flat Bench
  const benchGroup = new THREE.Group()
  const pad = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 1.15), materials.benchLeather)
  pad.position.set(0, 0.45, 0)
  benchGroup.add(pad)

  const legGeom = new THREE.BoxGeometry(0.05, 0.45, 0.05)
  const leg1 = new THREE.Mesh(legGeom, materials.metalChrome)
  leg1.position.set(0, 0.225, 0.45)
  benchGroup.add(leg1)

  const leg2 = new THREE.Mesh(legGeom, materials.metalChrome)
  leg2.position.set(0, 0.225, -0.45)
  benchGroup.add(leg2)

  benchGroup.visible = false
  rootGroup.add(benchGroup)

  // KINEMATICS UPDATE METHOD
  function updatePose(angles: JointAngles) {
    // Torso & Pelvis
    pelvis.position.y = 1.05 + (angles.torsoHeight || 0)
    spine.rotation.x = (angles.torsoPitch || 0) * DEG2RAD
    spine.rotation.y = (angles.torsoYaw || 0) * DEG2RAD

    // Legs
    leftHip.rotation.x = angles.leftHipPitch * DEG2RAD
    leftKnee.rotation.x = angles.leftKneePitch * DEG2RAD
    leftFoot.rotation.x = angles.leftAnklePitch * DEG2RAD

    rightHip.rotation.x = angles.rightHipPitch * DEG2RAD
    rightKnee.rotation.x = angles.rightKneePitch * DEG2RAD
    rightFoot.rotation.x = angles.rightAnklePitch * DEG2RAD

    // Arms
    leftShoulder.rotation.x = angles.leftShoulderPitch * DEG2RAD
    leftShoulder.rotation.y = angles.leftShoulderYaw * DEG2RAD
    leftShoulder.rotation.z = angles.leftShoulderRoll * DEG2RAD
    leftElbow.rotation.x = -angles.leftElbowPitch * DEG2RAD

    rightShoulder.rotation.x = angles.rightShoulderPitch * DEG2RAD
    rightShoulder.rotation.y = angles.rightShoulderYaw * DEG2RAD
    rightShoulder.rotation.z = angles.rightShoulderRoll * DEG2RAD
    rightElbow.rotation.x = -angles.rightElbowPitch * DEG2RAD

    // Props visibility and position
    barbellGroup.visible = Boolean(angles.showBarbell)
    if (angles.barbellPosition && angles.showBarbell) {
      barbellGroup.position.set(
        angles.barbellPosition[0],
        angles.barbellPosition[1],
        angles.barbellPosition[2]
      )
    }

    dumbbellLeft.visible = Boolean(angles.showDumbbells)
    dumbbellRight.visible = Boolean(angles.showDumbbells)
    benchGroup.visible = Boolean(angles.showBench)
  }

  // HIGHLIGHT METHOD
  function highlightMuscles(
    primary: MuscleGroup[],
    secondary: MuscleGroup[],
    selected?: MuscleGroup | null
  ) {
    muscleMeshes.forEach(({ mesh, muscle }) => {
      if (selected && muscle === selected) {
        mesh.material = materials.selectedHighlight
      } else if (primary.includes(muscle)) {
        mesh.material = materials.primaryHighlight
      } else if (secondary.includes(muscle)) {
        mesh.material = materials.secondaryHighlight
      } else {
        mesh.material = materials.base
      }
    })
  }

  return {
    rootGroup,
    pelvis,
    spine,
    chestGroup,
    neck,
    head,
    leftClavicle,
    leftShoulder,
    leftUpperArm,
    leftElbow,
    leftForearm,
    leftHand,
    rightClavicle,
    rightShoulder,
    rightUpperArm,
    rightElbow,
    rightForearm,
    rightHand,
    leftHip,
    leftThigh,
    leftKnee,
    leftShin,
    leftFoot,
    rightHip,
    rightThigh,
    rightKnee,
    rightShin,
    rightFoot,
    muscleMeshes,
    barbellGroup,
    dumbbellLeft,
    dumbbellRight,
    benchGroup,
    materials,
    updatePose,
    highlightMuscles,
  }
}

