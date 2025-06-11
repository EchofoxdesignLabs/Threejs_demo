// src/main.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AnaglyphEffect } from 'three/examples/jsm/effects/AnaglyphEffect.js';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass }   from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { BokehPass }    from 'three/examples/jsm/postprocessing/BokehPass.js';




//--- Helper Button for Camera Positioning ---
const logButton = document.createElement('button');
logButton.textContent = 'Log Camera Position';
Object.assign(logButton.style, {
    position: 'absolute',
    top: '15px',
    left: '15px',
    zIndex: '100',
    padding: '10px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
});
document.body.appendChild(logButton);


// 1) Scene, Camera, Renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff); // White background

// Updated camera settings from your Spline screenshot
const camera = new THREE.PerspectiveCamera(
  13.9, // FOV from Spline
  window.innerWidth / window.innerHeight,
  0.01, // Near plane from Spline
  100000 // Far plane from Spline
);

// Set camera position from Spline
camera.position.set(200, 61.4, 107.57);

// Set camera rotation from Spline (converted from degrees to radians)
// Euler order 'YXZ' is often a good default to avoid gimbal lock, matching many 3D tools.
camera.rotation.set(
    THREE.MathUtils.degToRad(-16.36), // X rotation
    THREE.MathUtils.degToRad(63.35),  // Y rotation
    THREE.MathUtils.degToRad(15.09),   // Z rotation
    'YXZ' // Setting the order of rotations
);


const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xffffff, 1);
renderer.useLegacyLights = false;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const composer = new EffectComposer(renderer);
const size = new THREE.Vector2(window.innerWidth, window.innerHeight);
composer.addPass(new RenderPass(scene, camera));

// 2) Anaglyph Effect Setup
const effect = new AnaglyphEffect(renderer);
effect.setSize(window.innerWidth, window.innerHeight);
let useEffect = false;

// 3) Lights
// const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
// dirLight.position.set(5, 10, 7.5);
// scene.add(dirLight);
// const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
// scene.add(ambientLight);
// Point Light 1
const pointLight1 = new THREE.PointLight(0x959595, 2, 240);
pointLight1.position.set(-38.7, 82.93, -45.9);
pointLight1.decay = 2; 
pointLight1.castShadow = true;
scene.add(pointLight1);
// const pointLight1Helper = new THREE.PointLightHelper(pointLight1, 20, 0xff0000); // Red
// scene.add(pointLight1Helper);

// Point Light 2
const pointLight2 = new THREE.PointLight(0xffffff, 2, 1179);
pointLight2.position.set(58.6, 10, -19.0);
pointLight2.decay = 2;
pointLight2.castShadow = true;
scene.add(pointLight2);
// const pointLight2Helper = new THREE.PointLightHelper(pointLight2, 20, 0x0000ff); // Blue
// scene.add(pointLight2Helper);

// // Directional Light (updated position and rotation from screenshot)
const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(100, 200, 200.1);

dirLight.castShadow = true; // Enable shadows for this light
dirLight.shadow.mapSize.width = 2048; // Increased resolution for crisper shadows
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.radius = 5000;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 500;
// CORRECTED: Increased shadow camera frustum size to ensure it covers the model and ground
dirLight.shadow.camera.left = -150;
dirLight.shadow.camera.right = 150;
dirLight.shadow.camera.top = 150;
dirLight.shadow.camera.bottom = -150;

scene.add(dirLight);
scene.add(dirLight.target);
dirLight.target.position.set(40, 18, 0);

// const dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 100, 0x00ff00); // Green
// scene.add(dirLightHelper);



// Optional: Slight ambient to fill shadows softly
const ambientLight = new THREE.AmbientLight(0xffffff, 2.3 );
scene.add(ambientLight);

// 4) OrbitControls - Re-enabled for positioning
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
// Set the controls target to the model's position for intuitive rotation
controls.target.set(0, 24.65, 0);


// -- TO LOCK THE CAMERA VIEW LATER --
// After you confirm the view, uncomment the three lines below.
controls.enableZoom = false;
controls.enableRotate = false;
controls.enablePan = false;


// 5) Load animated glTF model
let mixer = null;
let model = null;
let headBone = null;
let neckBones = [];
let baseQuaternions = [];
const clock = new THREE.Clock();
const loader = new GLTFLoader();
const whiteMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.7,
});

loader.load(
  'Assets/models/fox16.glb',
  (gltf) => {
    model = gltf.scene;
    model.traverse((child) => {
      if (child.isMesh) {
        child.material = whiteMaterial;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Set model position and scale from your Spline screenshot
    model.position.set(40, 18, 0);
    model.scale.set(8.02, 8.02, 8.02);

    scene.add(model);
    if (gltf.animations && gltf.animations.length > 0) {
      console.log('Animations found:', gltf.animations);
      mixer = new THREE.AnimationMixer(model);
      gltf.animations.forEach((clip) => {
        const action = mixer.clipAction(clip);
        action.play();
        action.timeScale = 0.5;
      });
    }

    // grab the spine bones in order
    // neckBones = [
    //   model.getObjectByName('spine009_metarig'),
    //   model.getObjectByName('spine010_metarig'),
    //   model.getObjectByName('spine011_metarig'),
    // ].filter(b => b);
    headBone = model.getObjectByName('spine011_metarig');
    console.log('Neck bones:', headBone);
    // const helper = new THREE.SkeletonHelper(model);
    // scene.add(helper);

    // save their base quaternions
    // baseQuaternions = neckBones.map(b => b.quaternion.clone());
  },
  undefined,
  (error) => {
    console.error('Error loading glTF model:', error);
  }
);




// 6) Raycaster and Event Listeners
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isHovered = false;
const target = new THREE.Object3D();
target.position.x = 119; // Initial position for the target
target.position.y = 55; // Initial position for the target
target.position.z = 91; // Initial position for the target
const interSectionPoint = new THREE.Vector3();
const planeNormal = new THREE.Vector3(); 
const plane = new THREE.Plane(); // Plane for intersection
const outMin =  60;
const outMax = 250;
const inMin = 130;
const inMax = 150;
const inMinY = 35;
const inMaxY = 58;
const outMinY = 25;
const outMaxY = 75;

window.addEventListener('pointermove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  planeNormal.copy(camera.position).normalize(); // Use camera position as normal
  const someValue = new THREE.Vector3(100,100,100).add(scene.position);
  plane.setFromNormalAndCoplanarPoint(planeNormal, someValue); // Create a plane from the camera position
  // const planeHelper = new THREE.PlaneHelper(plane, 100, 0x00ffff); // 5 = size, cyan color
  // scene.add(planeHelper);
  raycaster.setFromCamera(mouse, camera);
  raycaster.ray.intersectPlane(plane, interSectionPoint); // Get intersection point with the plane
  const rawX = interSectionPoint.x;
  const rawY = interSectionPoint.y;
  const mappedY = THREE.MathUtils.mapLinear(rawY, inMinY, inMaxY, outMinY, outMaxY);
  const clampedY = THREE.MathUtils.clamp(mappedY, outMinY, outMaxY);
  const mappedX = THREE.MathUtils.mapLinear(rawX, inMin, inMax, outMin, outMax);
  const clampedX = THREE.MathUtils.clamp(mappedX, outMin, outMax);

  target.position.set(clampedX, clampedY, interSectionPoint.z);
  if (model) {
    //raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(model, true);
    const currentlyHovered = intersects.length > 0;
    if (currentlyHovered !== isHovered) {
      isHovered = currentlyHovered;
      if (mixer) {
        mixer.timeScale = isHovered ? 1.0 : 0.5;
      }
      useEffect = isHovered;
    }
  }
});

// --- Event listener for our new button ---
logButton.addEventListener('click', () => {
    const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
    console.clear();
    console.log("--- Current Camera State ---");
    console.log("Instructions: Copy these values back into your code.");
    console.log(`camera.position.set(${camera.position.x.toFixed(4)}, ${camera.position.y.toFixed(4)}, ${camera.position.z.toFixed(4)});`);
    console.log(`camera.rotation.set(THREE.MathUtils.degToRad(${THREE.MathUtils.radToDeg(euler.x).toFixed(4)}), THREE.MathUtils.degToRad(${THREE.MathUtils.radToDeg(euler.y).toFixed(4)}), THREE.MathUtils.degToRad(${THREE.MathUtils.radToDeg(euler.z).toFixed(4)}), 'YXZ');`);
    console.log("\n// --- For Reference (Alternative) ---");
    console.log(`// Or use lookAt: camera.lookAt(${controls.target.x.toFixed(4)}, ${controls.target.y.toFixed(4)}, ${controls.target.z.toFixed(4)})`);
    console.log("--------------------------");
    alert("Camera position and rotation logged to the developer console (F12).");
});


// 7) Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  effect.setSize(window.innerWidth, window.innerHeight);
});



// 8) Animation loop
function animate() {
  if(headBone)
  {
    const axesHelper = new THREE.AxesHelper(10); // Size = 0.2 units
    headBone.add(axesHelper);
     // Move the target position slightly for demonstration
    headBone.lookAt(target.position); // Look at the target position
    headBone.rotateX(Math.PI / 2);
    // console.log('Head Bone Position:', headBone.position); 
    console.log('Target Position:', target.position);
    const direction = new THREE.Vector3();
  headBone.getWorldDirection(direction);
  }
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);
  controls.update();
  if (useEffect) {
    effect.render(scene, camera);
  } else {
    renderer.render(scene, camera);
  }
}
animate();
