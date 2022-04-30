import * as THREE from 'https://cdn.skypack.dev/three@0.136.0'
import {FPSController} from "../modules/FPSController.mjs"
import {WEBGL} from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/WebGL';
import {ColladaLoader} from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/loaders/ColladaLoader.js"

if (!WEBGL.isWebGLAvailable()) {
	const warning = WEBGL.getWebGLErrorMessage();
	document.body.appendChild(warning);
}

// ---------- Loaders ----------
const texturesLoader = new THREE.TextureLoader();
const colladaLoader = new ColladaLoader();

const container = document.getElementById("container");

// ---------- Renderer ---------- 
const renderer = new THREE.WebGLRenderer({antialiasing: true});
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x87ceeb, 1.0);
renderer.clear();

container.appendChild(renderer.domElement);

// ---------- Camera ---------- 
let fov = 45;
let aspect = window.innerWidth / window.innerHeight;
let near = 0.1;
let far = 500;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.set(-75, 8, 0);
camera.up = new THREE.Vector3(0,1,0);
camera.lookAt(0,0,0);

// ---------- Controls ---------- 
const controls = new FPSController(camera, renderer.domElement);
controls.setLookHeight(8.0);
controls.setMoveSpeed(15.0);

// ---------- Scene ---------- 
const scene = new THREE.Scene();

// ---------- Lights ---------- 
const ambient = new THREE.AmbientLight(0x555555);
scene.add(ambient);
	
const directionaLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionaLight.position.set(-100, 100, -100);
scene.add(directionaLight);

directionaLight.castShadow = true;

// shadows map resolution
directionaLight.shadow.mapSize.width = 2048;
directionaLight.shadow.mapSize.height = 2048;

// light shadows based on camera
const distance = 200;
directionaLight.shadow.camera.left = -distance;
directionaLight.shadow.camera.right = distance;
directionaLight.shadow.camera.top = distance;
directionaLight.shadow.camera.bottom = -distance;			
directionaLight.shadow.camera.near = 0.5;
directionaLight.shadow.camera.far = 500;
directionaLight.shadow.bias = 0.0005;
	
const pointLight = new THREE.PointLight(0xffffff, 0.5, 50);
pointLight.position.set(-50, 20, -25);
scene.add(pointLight);

// ---------- Floor ---------- 

const floorTexture = texturesLoader.load("../assets/textures/floor.png")
floorTexture.wrapS = THREE.RepeatWrapping;
floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set( 10, 5 );
const floorMaterial = new THREE.MeshLambertMaterial({ map: floorTexture });
const floorGeometry = new THREE.PlaneGeometry(200, 100, 200, 100);
floorGeometry.rotateX(- Math.PI / 2);
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.receiveShadow = true;
scene.add(floor);

// ---------- Walls and middle boxs ----------

let walls = []

const wallMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
const wallsOffsets = [50, 100, 30]
const wallsGeometries = [
    new THREE.BoxBufferGeometry(200, 20, 1),  // North & South
    new THREE.BoxBufferGeometry(1, 20, 100), // East & West
    new THREE.BoxBufferGeometry(1, 20, 40), // Middle
]

wallsOffsets.forEach((boundary, i) => {
    const axis = i === 1 ? 'x' : 'z';
    const geometry = wallsGeometries[i];
    wallsGeometries.forEach((geom, j) => {
        const wall = new THREE.Mesh(geometry, wallMaterial);
        wall.name = "wall"
        wall.position[axis] = j === 0 ? boundary : -boundary;
        wall.position.y = 10;
        wall.castShadow = true;
        wall.receiveShadow = true;
        walls = [...walls, wall]
        scene.add(wall);
    })
})

const boxsGeometries = [new THREE.BoxBufferGeometry(20, 3, 5), new THREE.BoxBufferGeometry(8, 2, 8)]
const boxsOffset = 50;
boxsGeometries.forEach((geometry, i) => {
    const box = new THREE.Mesh(geometry, wallMaterial);
    box.name = "wall"
    box.position.set(!i ? -boxsOffset : boxsOffset, 0, 0)
    walls = [...walls, box]
    scene.add(box)
})

// ---------- Skybox ----------

const skyGeometry = new THREE.SphereGeometry(80, 20, 10, 0, Math.PI*2, 0, Math.PI/2);
skyGeometry.scale(1.8, 0.5, 1);
skyGeometry.translate(0, 8, 0);
const edgesGeom = new THREE.EdgesGeometry(skyGeometry); // or WireframeGeometry
const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
const skySphere = new THREE.LineSegments(edgesGeom, wireframeMaterial);
scene.add(skySphere);

// ---------- Objects ----------

let objects = [];

// Victoria statue

const victoriaMaterial = new THREE.MeshLambertMaterial({color: 0xdddddd});
colladaLoader.load("../assets/models/victoire.dae",
	function(collada) {
		const dae = collada.scene.children[0];
		dae.material = victoriaMaterial;
		dae.rotateZ(Math.PI/2);
		dae.rotateX(Math.PI);
		dae.scale.set(0.8, 0.8, 0.8);
		dae.position.set(50, -0.4, 0);
		dae.castShadow = true;
		dae.name = "Victoria"
		dae.receiveShadow = true;
		objects = [...objects, dae]
		scene.add(dae);
	},
	// onProgress callback
	function (xhr) {
		console.log('Loading in progress...');
	},
	// onError callback
	function(err) {
		console.log('An error happened');
	}
);

// ---------- Paintings ----------

const pictures = [
    {
        name: "Steve Jonson : Painting 1 - Source: Unsplash",
        url: "../assets/textures/paintings/steve-johnson-1131910-unsplash.jpg"
    },
    {
        name: "Steve Jonson : Painting 2 - Source: Unsplash",
        url: "../assets/textures/paintings/steve-johnson-1133776-unsplash.jpg"
    },
]

pictures.forEach(({name, url}, i) => {
    const painting = createPainting(url);
    painting.position.set(-50, 10, !i ? 49 : -49);
    i && painting.rotateY(Math.PI);

    painting.castShadow = true;
    painting.receiveShadow = true;
    painting.name = name
    objects = [...objects, painting];
})

// ---------- Raycasters ----------

const clickRaycaster = new THREE.Raycaster();
let intersects = [];
let mouseNDC = new THREE.Vector2();
let mouse = new THREE.Vector2();
let intersectedObject = null

// ---------- Popup ----------
const popUp = document.createElement("div");
popUp.id = "popUp";
popUp.style.position = "absolute";
let positionPopupProjected = new THREE.Vector3();
let positionPopup = new THREE.Vector3();
let popUpX = 0;
let popUpY = 0;
// ---------- Loop ----------

let clock = new THREE.Clock();
function render() {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
    controls.collisions(walls, scene)
    controls.update(clock.getDelta());
	let state = calculatePopUpPosition(camera)
    updatePopUpPosition(state)
}
render();

// ---------- Events ----------

window.addEventListener("resize", onWindowResize, false);

window.addEventListener("keyup", (e) => {
    if(e.key === "f") toggleFullScreen();
})

window.addEventListener("contextmenu", raycastClick);

// ---------- Functions ----------

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.render(scene, camera);
}


function createPainting(fileName) {
	const paintingMat = new THREE.MeshLambertMaterial({color: 0xaaaaaa});

	const paintingGeom = new THREE.BoxGeometry(10, 10, 0.5);

	const materials = Array(6).fill(paintingMat)
	
	const painting = new THREE.Mesh(paintingGeom, materials);

	painting.castShadow = true;
	painting.receiveShadow = true;

	scene.add(painting);

	new THREE.TextureLoader()
		.load(fileName,
			function(tex) {
			
				let aspectRatio = tex.image.width/tex.image.height;
	
				materials[5] = new THREE.MeshBasicMaterial({map: tex});

				painting.scale.set(aspectRatio, 1.0, 1.0);
				painting.material[5].needsUpdate = true;
		
				renderer.render(scene, camera);
			});

	return painting;
}

function raycastClick(event){
    event.preventDefault();
	mouse.x = event.clientX;
	mouse.y = event.clientY;
	mouseNDC.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouseNDC.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    clickRaycaster.setFromCamera( mouseNDC, camera );
    intersects = clickRaycaster.intersectObjects(objects);

    if(!intersects.length || intersects[0].object.id === intersectedObject?.id){
        if(!intersectedObject) return
        intersectedObject = null;
        togglePopup(false)
        return;
    }

    intersectedObject = intersects[0].object;
    positionPopup = intersects[0].point;   
    let state = calculatePopUpPosition(camera)
    togglePopup(state)
}

function togglePopup(state) {
    if(!state){
        if(document.getElementById("popUp")) document.body.removeChild(popUp)
        return
    }
    popUp.innerHTML = intersectedObject.name
    popUp.style.top = popUpY+"px"
    popUp.style.left = popUpX+"px"
    document.body.append(popUp)
}

function calculatePopUpPosition(camera){
    positionPopupProjected.copy(positionPopup);
    positionPopupProjected.project(camera);
    if ((positionPopupProjected.x > -1 && positionPopupProjected.x < 1) &&
        (positionPopupProjected.y > -1 && positionPopupProjected.y < 1)) {

        popUpX = Math.floor((positionPopupProjected.x + 1) * 0.5 * window.innerWidth);
        popUpY = Math.floor(-(positionPopupProjected.y - 1) * 0.5 * window.innerHeight);
        return true;
    }else{
        return false;
    }
}

function updatePopUpPosition(state){
    if(!document.getElementById("popUp")) return
    popUp.style.top = popUpY+"px"
    popUp.style.left = popUpX+"px"
    if(!state) popUp.style.display = "none"
    else popUp.style.display = "block"
}






