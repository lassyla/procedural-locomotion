
//set up the THREE Scene with a plane, drag controls, orbit controls, and lights. 

const scene = new THREE.Scene();
const clock = new THREE.Clock();

const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
camera.position.z = 8;
camera.position.y = 14;


const canvas = document.getElementById( "c" );

const renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );
renderer.setClearColor( 0xaaaaff, 1 );
renderer.setSize(window.innerWidth, window.innerHeight);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const meshMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff, skinning:true });


const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
scene.add(directionalLight);
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const planeGeometry = new THREE.PlaneGeometry( 140, 140, 32 );

const plane = new THREE.Mesh( planeGeometry, meshMaterial );
plane.rotation.x = -Math.PI/2; 
scene.add( plane );
camera.lookAt(plane.position); 

const objects = []; 

//if in animation mode 
var playing = false; 
var deltaTime;

//https://threejs.org/docs/#examples/en/controls/DragControls
const orbitControls = new THREE.OrbitControls(camera, renderer.domElement);

const dragControls = new THREE.DragControls(objects, camera, renderer.domElement);
dragControls.addEventListener('dragstart', function (event) {
    orbitControls.enabled = false; 
});
dragControls.addEventListener('dragend', function (event) {
    orbitControls.enabled = true; 
});
dragControls.addEventListener('drag', function (event) {
    if(event.object.userData.isHipAttach) {
        //event.object.getWorldPosition(event.object.userData.leg.userData.rootBone.position; 
        //TO DO: connect it to the closest bone 
    }
    groundStepTargets(); 
    matchStepTargets()
});


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

//rendering multiple scene code from https://github.com/mrdoob/three.js/blob/master/examples/webgl_multiple_elements.html
function render() {

    renderer.render(scene, camera);

}

animate(); 



