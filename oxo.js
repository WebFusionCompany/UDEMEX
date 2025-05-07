// Variables principales
let scene, camera, renderer, controls, mixer, clock;
let models = []; // Almacena múltiples modelos
let wireframeMode = false;

const modelUrl1 = 'OXXO_a_la_vuelta_de_tu_vida.glb';


// Tamaño del canvas
const container = document.getElementById('container');
const canvas = document.getElementById('canvas');

// Elementos de la interfaz
const loadingElement = document.getElementById('loading');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const wireframeBtn = document.getElementById('wireframe-btn');
const resetBtn = document.getElementById('reset-btn');
const fileInput = document.getElementById('file-input');
const errorElement = document.getElementById('error');
const errorMessage = document.getElementById('error-message');
const errorClose = document.getElementById('error-close');

// Inicialización
init();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 2, 20);

    setupLighting();

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 1.5;
    controls.minDistance = 2;
    controls.maxDistance = 100;

    clock = new THREE.Clock();

    // Cargar modelos iniciales
    loadModel(modelUrl1);


    window.addEventListener('resize', onWindowResize);
    wireframeBtn.addEventListener('click', toggleWireframe);
    resetBtn.addEventListener('click', resetView);
    fileInput.addEventListener('change', loadUserModel);
    errorClose.addEventListener('click', () => {
        errorElement.style.display = 'none';
    });

    animate();
}

function setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(10, 10, 10);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.camera.left = -10;
    mainLight.shadow.camera.right = 10;
    mainLight.shadow.camera.top = 10;
    mainLight.shadow.camera.bottom = -10;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    const accentLight = new THREE.DirectionalLight(0xffd500, 0.2);
    accentLight.position.set(0, -5, 0);
    scene.add(accentLight);
}

function loadModel(url) {
    loadingElement.style.display = 'block';
    progressBar.style.width = '0%';
    progressText.textContent = '0%';

    const dracoLoader = new THREE.DRACOLoader();
    dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/');

    const loader = new THREE.GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    loader.load(
        url,
        function (gltf) {
            const model = gltf.scene;
            centerModel(model);

            const spacing = 8;
            const index = models.length;
            model.position.x = index * spacing;

            model.traverse(function (node) {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                    node.material.wireframe = wireframeMode;
                }
            });

            scene.add(model);
            models.push(model);
            

            if (gltf.animations && gltf.animations.length) {
                mixer = new THREE.AnimationMixer(model);
                const action = mixer.clipAction(gltf.animations[0]);
                action.play();
            }

            loadingElement.style.display = 'none';
        },
        function (xhr) {
            const percentComplete = Math.round((xhr.loaded / xhr.total) * 100);
            progressBar.style.width = percentComplete + '%';
            progressText.textContent = percentComplete + '%';
        },
        function (error) {
            console.error('Error cargando modelo:', error);
            errorMessage.textContent = 'No se pudo cargar el modelo: ' + error.message;
            errorElement.style.display = 'block';
            loadingElement.style.display = 'none';
        }
    );
}

function loadUserModel(event) {
    const file = event.target.files[0];
    if (!file) return;

    const validExtensions = ['.glb', '.gltf'];
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validExtensions.includes(extension)) {
        errorMessage.textContent = 'Formato no soportado. Por favor, sube un archivo .glb o .gltf';
        errorElement.style.display = 'block';
        return;
    }

    const objectUrl = URL.createObjectURL(file);
    loadModel(objectUrl);
}

function centerModel(model) {
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 5 / maxDim;
    model.scale.set(scale, scale, scale);

    model.position.sub(center.multiplyScalar(scale));

    const newBox = new THREE.Box3().setFromObject(model);
    const newCenter = newBox.getCenter(new THREE.Vector3());
    model.position.y -= newCenter.y;
}

function animate() {
    requestAnimationFrame(animate);

    controls.update();

    if (mixer) {
        mixer.update(clock.getDelta());
    }

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function toggleWireframe() {
    wireframeMode = !wireframeMode;
    wireframeBtn.textContent = wireframeMode ? 'Mostrar Normal' : 'Mostrar Wireframe';

    models.forEach(model => {
        model.traverse(function (node) {
            if (node.isMesh) {
                node.material.wireframe = wireframeMode;
            }
        });
    });
}

function resetView() {
    gsap.to(camera.position, {
        x: 5,
        y: 2,
        z: 20,
        duration: 1.5,
        ease: 'power2.inOut'
    });

    controls.target.set(0, 0, 0);

    models.forEach(model => {
        gsap.to(model.rotation, {
            x: 0,
            y: 0,
            z: 0,
            duration: 1.5,
            ease: 'power2.inOut'
        });
    });
}

/*Descargar archivo*/
const downloadBtn = document.getElementById('download-btn');
downloadBtn.addEventListener('click', () => {
    const modelFileUrl = 'OXXO_a_la_vuelta_de_tu_vida.glb'; // Asegúrate de que este archivo existe y está accesible

    const a = document.createElement('a');
    a.href = modelFileUrl;
    a.download = modelFileUrl.split('/').pop(); // Nombre del archivo
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});
