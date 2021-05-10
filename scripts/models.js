const loader = new THREE.GLTFLoader(); 
var legModels = []; 
var bodyModels = []; 


loader.load('../models/body1.gltf', function (gltf) {
    //gltf.scene.getObjectByName("Cube").material = meshMaterial;
    bodyModels.push(gltf.scene); 
});

loader.load('../models/mesh1.gltf', function (gltf) {
    //gltf.scene.getObjectByName("Cube").material = meshMaterial;
    legModels.push(gltf.scene); 
});

loader.load('../models/mesh2.gltf', function (gltf) {
    //gltf.scene.getObjectByName("Cube").material = meshMaterial;
    legModels.push(gltf.scene); 
});
loader.load('../models/mesh3.gltf', function (gltf) {
    //gltf.scene.getObjectByName("Cube").material = meshMaterial;
    legModels.push(gltf.scene); 
});
function newBody(i) {
    //to do: delete old body 

    //const body = cloneGltf(bodyModels[i]).scene.children[0]; 
    const body = THREE.SkeletonUtils.clone(bodyModels[i]); 

    body.userData.rootBone = body.getObjectByName("Bone"); 
    body.userData.helper = new THREE.SkeletonHelper(body.userData.rootBone);
    body.userData.walking = false; 

    return body;
}

const torusGeometry = new THREE.TorusGeometry( .5, .2, 10, 20 );
const sphereGeometry = new THREE.SphereGeometry( .5, 32, 32 );
const whiteMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff,  opacity: 0.5,transparent: true  });

function newLeg(i, boneNum, zOffset, beginTime, endTime, ) {
    if(!currentBody) {
        console.log("need a body first"); 
        return; 
    }
    const leg = THREE.SkeletonUtils.clone(legModels[i]); 

    leg.userData.isLeg = true; 

    leg.userData.rootBone = leg.getObjectByName("RootBone"); 
    leg.userData.helper = new THREE.SkeletonHelper(leg.userData.rootBone);
    
    leg.userData.effector = leg.getObjectByName("EndBone"); 
    leg.userData.currentBone = leg.userData.effector; 

    leg.userData.ikTarget = new THREE.Object3D();
    var stepTarget = new THREE.Mesh(sphereGeometry, whiteMaterial);
    leg.userData.stepTarget = stepTarget;

    //between 0 and 1, the time in the cycle that a step begins and ends. 
    leg.userData.stepBeginTime = beginTime; 
    leg.userData.stepEndTime = endTime; 


    scene.add(leg); 
   // scene.add(leg.userData.helper); 

    currentBody.userData.helper.bones[boneNum].add(leg.userData.rootBone); 
    leg.userData.spinePos = 0; 
    leg.userData.rootBone.rotation.z = Math.PI / -2; 
    leg.userData.rootBone.position.z += zOffset;

    //add the hip-placement geo where the rootbone is
    var hipAttach = new THREE.Mesh(sphereGeometry, whiteMaterial);
    hipAttach.userData.isHipAttach = true; 
    hipAttach.userData.leg = leg; 
    leg.userData.hipAttach = hipAttach;
    //scene.add(hipAttach); 
    leg.userData.rootBone.getWorldPosition(hipAttach.position); 


    //set the targets position to the effector position 
    leg.userData.effector.getWorldPosition(leg.userData.ikTarget.position);
    leg.userData.effector.getWorldPosition(leg.userData.stepTarget.position);
    leg.userData.stepTarget.position.y = 0; 
    leg.userData.ikTarget.position.y = 0; 
    leg.userData.stepping = false; 

    currentBody.userData.helper.bones[0].attach(leg.userData.stepTarget); 

    dragControls.getObjects().push(leg.userData.stepTarget); 
    dragControls.getObjects().push(leg.userData.hipAttach); 


    currentLeg = leg; 
    legs.push(leg); 

    return leg;
}
