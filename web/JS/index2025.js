const subt = document.getElementById('subt');
const loading = document.getElementById('fa_sub');
var w = window.innerWidth
  || document.documentElement.clientWidth
  || document.body.clientWidth;
var h = window.innerHeight
  || document.documentElement.clientHeight
  || document.body.clientHeight;
var scene, camera, renderer, controls, light, selectObject;

const cube = new THREE.Group();
var clickt = 0
var rotationTween
var animation_box;
var mixer = new THREE.AnimationMixer();
const dracoLoader = new THREE.DRACOLoader();
dracoLoader.setDecoderPath('./three.js/examples/js/libs/draco/');
dracoLoader.setDecoderConfig({ type: 'js' });
dracoLoader.preload();

const manager = new THREE.LoadingManager();
const GLTFLoader = new THREE.GLTFLoader(manager);
GLTFLoader.setDRACOLoader(dracoLoader);


// function initScene() {
//   scene = new THREE.Scene();
//   scene.background = new THREE.Color(0x51C1EA);
// }

function initScene() {
    scene = new THREE.Scene();
    
    // 1. 创建一个纹理加载器
    const textureLoader = new THREE.TextureLoader();

    // 2. 加载图片，并将其用作场景背景
    textureLoader.load(
        './assets/bg.png', // 替换为你的背景图片路径
        function (texture) {
            // 图片加载成功后，将纹理设置为场景背景
            scene.background = texture;
        },
        // 3. (可选) 加载进度回调
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        // 4. (可选) 加载错误回调
        function (err) {
            console.error('An error happened loading the background texture:', err);
        }
    );
}

function initCamera() {
  camera = new THREE.PerspectiveCamera(45, w / h, 0.06, 12000);
  camera.position.set(89.71944579752005, 125.47103407517945, 349.899122525424);
  camera.lookAt(new THREE.Vector3(0, 0, 0));
}

function playAnimationOnce(object, animation) {
  mixer = new THREE.AnimationMixer(object);
  var action = mixer.clipAction(animation);
  action.setLoop(THREE.LoopOnce, 1);
  action.clampWhenFinished = true;
  action.play();
  action.timeScale = 1;
  action.onEnded = function () {
    mixer.stopAllAction();
    action.onEnded = null;
  }
}
function initRenderer() {
  if (Detector.webgl) {
    renderer = new THREE.WebGLRenderer({ antialias: true });
  } else {
    renderer = new THREE.CanvasRenderer();
  }
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.gammaFactor = 2.2;

  renderer.sortObjects = false;

  const rendererElement = renderer.domElement;
  rendererElement.addEventListener('mouseenter', function () {
    rendererElement.classList.add('custom-cursor');
  });
  document.body.appendChild(renderer.domElement);

}


function initContent() {
  const overlayMaterial = new THREE.ShaderMaterial({
    transparent: true,
    uniforms:
    {
      uAlpha: { value: 0.95 }
    },
    vertexShader: `
          void main()
          {
              gl_Position = vec4(position, 1.0);
          }
      `,
    fragmentShader: `
          uniform float uAlpha;
          void main()
          {
              gl_FragColor = vec4(0.435, 0.902, 0.902, uAlpha);
          }
      `
  })

  //遮罩层
  const overlayGeometry = new THREE.PlaneBufferGeometry(2, 2, 1, 1);
  const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial);
  scene.add(overlay);

  manager.onProgress = function (_item, loaded, total) {
    const progressRatio = loaded / total; // 进度统计
    subt.innerText = (progressRatio * 100).toFixed(2) + '%';
    // 加载完成
    if (progressRatio === 1) {
      overlayMaterial.uniforms.uAlpha.value = 0.8;
      // 渐变隐藏
      const hideOverlay = (i) => {
        overlayMaterial.uniforms.uAlpha.value = 0.8 - 0.025 * i;
        if (i < 33) {
          requestAnimationFrame(() => hideOverlay(i + 1));
        } else {
          // 遮罩隐藏
          requestAnimationFrame(() => {
            scene.remove(overlay);
            document.title = '生日快乐~'
            loading.classList.add('progress-full');
          });
        }
      };
      hideOverlay(0);
    }
  };

  GLTFLoader.load('https://gcore.jsdelivr.net/gh/midormeepo/CDN@main/web/models/main.glb', function (gltf) {
    cube.add(gltf.scene);
    animation_box = gltf.animations;
  });

GLTFLoader.load('https://gcore.jsdelivr.net/gh/midormeepo/CDN@main/web/models/bg.glb', function (gltf) {
    cube.add(gltf.scene);
    animation_box = gltf.animations;

    gltf.scene.traverse(function (child) {
        if (child.isMesh) {
            if (child.material && !(child.material instanceof THREE.ShaderMaterial)) {
                child.material.transparent = true;
                child.material.opacity = 0.2;
                // 添加这一行代码，确保只渲染正面
                child.material.side = THREE.FrontSide;
                child.material.depthWrite = false;
            }
        }
    });
});


  GLTFLoader.load('https://gcore.jsdelivr.net/gh/midormeepo/CDN@main/web/models/bo.glb', function (gltf) {
    cube.add(gltf.scene);
    animation_box = gltf.animations;

    gltf.scene.traverse(function (child) {
      if (child.isMesh) {
        if (child.material && !(child.material instanceof THREE.ShaderMaterial)) {
          child.material.transparent = true;
          child.material.opacity = 0.1;
          child.material.depthWrite = false;
        }
      }
    });
  });


  // 配置 cube
  cube.position.y -= 60;
  cube.scale.set(4, 4, 4);
  scene.add(cube);

  var startRotation = { x: 0, y: 0, z: 0 };
  var targetRotation = { x: 0, y: Math.PI * 2, z: 0 };
  rotationTween = new TWEEN.Tween(startRotation)
    .to(targetRotation, 5000)
    .onUpdate(function () {
      cube.rotation.y = startRotation.y;
    })
    .repeat(Infinity);

}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  w = window.innerWidth;
  h = window.innerHeight;
}
function initControls() {
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.5;
  // controls.enableZoom = false;
  controls.autoRotate = false;
  controls.autoRotateSpeed = 0.2;
  controls.minDistance = 42;
  controls.maxDistance = 400;
  controls.enablePan = true;
  controls.maxPolarAngle = 0.5 * Math.PI;
}
function initLight() {
  const light = new THREE.AmbientLight(0x404040); // 柔和的白光
  scene.add(light);
  const light2 = new THREE.PointLight(0xffffff, 0.8, 0);
  light2.position.set(100, 100, 100);
  scene.add(light2);
}
function init() {
  initScene();
  initCamera();
  initRenderer();
  initContent();
  initLight();
  initControls();
  addEventListener('resize', onWindowResize, false);
  // addEventListener('click', onMouseClick, false);
  // addEventListener('touchstart', onMouseClick, false);

}
var clock = new THREE.Clock();
function animate() {
  if (selectObject != undefined && selectObject != null) {
    renderDiv(selectObject);
  }
  requestAnimationFrame(animate);
  renderer.shadowMap.enabled = true; // 关闭阴影映射
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.render(scene, camera);
  controls.update();
  var deltaTime = clock.getDelta();
  mixer.update(deltaTime);
  TWEEN.update();
}
init();
animate();

function onMouseClick(event) {
  if (clickt == 0) {
    playAnimationOnce(cube, animation_box[0])
  }
  if (clickt == 1) {
    playAnimationOnce(cube, animation_box[1])
  }

  if (clickt == 2) {
    new TWEEN.Tween(camera.position)
      .to(new THREE.Vector3(50, 50, 50), 1500)
      .onComplete(() => {
        renderer.domElement.remove();
        document.getElementById('popup').style.display = 'flex';
      })
      .start();
  }
  clickt++

}