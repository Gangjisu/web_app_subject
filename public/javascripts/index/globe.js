import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 3D 지구본 초기화 함수
export function init3DGlobe() {
    const globeContainer = document.getElementById('globe-container');
    if (!globeContainer) return;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(70, globeContainer.clientWidth / globeContainer.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 2.5); // 거리를 줄여서 더 가깝게 시작
    scene.add(camera);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // alpha: true for transparent background
    renderer.setSize(globeContainer.clientWidth, globeContainer.clientHeight);
    globeContainer.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.75);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
    camera.add(directionalLight);
    directionalLight.position.set(1, 1, 2);

    const clock = new THREE.Clock();
    let mixer;

    // GLTF Loader with a simple loading indicator
    const loader = new GLTFLoader();
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    globeContainer.appendChild(spinner);

    loader.load('/assets/earth-cartoon.glb', function (gltf) { // 경로를 /assets/ 로 수정
        spinner.remove(); // 로딩 완료 시 스피너 제거
        const model = gltf.scene;
        scene.add(model);

        mixer = new THREE.AnimationMixer(model);
        gltf.animations.forEach((clip) => {
            mixer.clipAction(clip).play();
        });

    }, undefined, function (error) {
        spinner.remove();
        console.error('An error happened while loading the model:', error);
        globeContainer.innerHTML = '<p>모델 로딩 실패</p>';
    });

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.enableRotate = false;
    controls.autoRotateSpeed = 0.5; // 회전 속도 조절

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        if (mixer) mixer.update(delta);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    // Handle Resize (using ResizeObserver for container)
    const resizeObserver = new ResizeObserver(entries => {
        const entry = entries[0];
        const { width, height } = entry.contentRect;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    });
    resizeObserver.observe(globeContainer);
}

// Start the 3D globe initialization
init3DGlobe();
