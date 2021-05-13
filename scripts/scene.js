
//set up the THREE Scene with a plane, drag controls, orbit controls, and lights. 

const scene = new THREE.Scene();
const clock = new THREE.Clock();

const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
camera.position.z = 8;
camera.position.y = 14;


const canvas = document.getElementById( "c" );

const renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );
renderer.setClearColor( 0xaaaaaa, 1 );
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

const raycaster = new THREE.Raycaster();
var intersects; 
const mouse = new THREE.Vector2();

const meshMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff, skinning:true });
const terrainMaterial = new THREE.MeshLambertMaterial({ color: 0x888888, skinning:true, side: THREE.DoubleSide });
const primaryMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff, skinning:true });
const highlightMaterial = new THREE.MeshLambertMaterial({ color: 0xffffaa, skinning:true });

const directionalLight = new THREE.DirectionalLight(0xffffcc, 0.5);
scene.add(directionalLight);
directionalLight.position.set(0, 50, 0); 
directionalLight.castShadow = true;

//expand area where shadows can cast (the entire terrain) 
directionalLight.shadow.camera.left = -40;  
directionalLight.shadow.camera.right = 40;  
directionalLight.shadow.camera.bottom = -40;  
directionalLight.shadow.camera.top = 40;  


const ambientLight = new THREE.AmbientLight(0x403020);
scene.add(ambientLight);

const planeGeometry = new THREE.PlaneGeometry( 140, 140, 32 );

// terrain = new THREE.Mesh( planeGeometry, terrainMaterial );
// terrain.rotation.x = -Math.PI/2; 
// terrain.receiveShadow = true; 
// scene.add( terrain );


const objects = []; 

//if in animation mode 
var playing = false; 
var deltaTime;



//dragControls.transformGroup = true; 

function animate() {
    deltaTime = clock.getDelta();

    requestAnimationFrame(animate);
    render(); 

    if(playing) {
        walk(); 
    }
    else {
    }
    CCDLegs();
}

function render() {
    renderer.render(scene, camera);
}

animate(); 



