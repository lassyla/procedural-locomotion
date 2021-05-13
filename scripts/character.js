//for customizing the procedural character

var currentBody; 
var ghostBody; 
var currentLeg; 
var legs = []; 
var clickableObjects = []; 
var walkSpeed = 10; //unit/sec
var rotateSpeed = 2.5; //radian/sec
var cycleLength = .4; //sec
var cyclePos = 0; 

var targetWalkingPos = new THREE.Vector3();
var poleStrength = .5; 
//var targetWalkingQuaternion = new THREE.Quaternion(); 
var targetWalkingAngle = 0; 
var walkingRotationDirection = 1; 

const down = new THREE.Vector3(0, -1, 0); 
const up = new THREE.Vector3(0, 1, 0); 

//make leg match its hip attach
function stickattachPoint(hipControl) {
    // currentLeg = hipControl.userData.leg; 
    setCurrentLeg(hipControl.userData.leg); 

    var parent = currentLeg.userData.rootBone.parent; 
    parent.remove(currentLeg.userData.rootBone);
    currentLeg.userData.rootBone.position.copy(hipControl.position); 
    parent.attach(currentLeg.userData.rootBone);
}

function dragStepTarget(stepTarget) {
    curentLeg = stepTarget.userData.leg; 
    groundStepTarget(currentLeg); 
}
//match each IK target to the step target (for dynamic placement of legs)
function matchStepTargets() {
    for(var i = 0; i < legs.length; i++) {
        matchStepTarget(legs[i]); 
    }
}

function matchStepTarget(leg) {
    var stepTargetWorldPos = new THREE.Vector3(); 
    leg.userData.stepTarget.getWorldPosition(stepTargetWorldPos); 
    leg.userData.ikTarget.position.copy(stepTargetWorldPos);

}

//make all step targets touch the ground
function groundStepTargets() {
    for(var i = 0; i < legs.length; i++) {
        groundStepTarget(legs[i]);
    }
}

//make the step target touch the ground
function groundStepTarget(leg) {
    var pos = new THREE.Vector3(); 
    leg.userData.stepTarget.getWorldPosition(pos); 
    raycaster.set(pos, down); 
    intersects = raycaster.intersectObjects( [terrain] );
    var casted = false; 
    if (intersects.length > 0){
        casted = true; 
        leg.userData.stepTarget.position.y = intersects[0].point.y; 
    }
    else {
        raycaster.set(pos, up); 
        intersects = raycaster.intersectObjects( [terrain] );
        if (intersects.length > 0){
            casted = true
            leg.userData.stepTarget.position.y = intersects[0].point.y; 
        }
    }

}





//update the leg step offset from the main body 
function updateOffsets() {
    var bodyPos = new THREE.Vector3; 
    currentBody.userData.rootBone.getWorldPosition(bodyPos);
    for(var i = 0; i < legs.length; i++) {
        var offset = new THREE.Vector3; 
        legs[i].userData.stepTarget.getWorldPosition(offset); 
        offset.sub(bodyPos); 
        legs[i].userData.stepOffset = offset;
    }
}

const torusGeometry = new THREE.TorusGeometry( .5, .2, 10, 20 );
const sphereGeometry = new THREE.SphereGeometry( .5, 16, 16 );
const boxGeometry = new THREE.BoxGeometry( .5, .5, .5);
//const whiteMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff,  opacity: 0.5,transparent: true  });
const whiteMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff,  opacity: 0.5,transparent: true  });
const grayMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff,  opacity: 0.2,transparent: true  });
const pinkMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00,  opacity: 0.5,transparent: true  });
const greenMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00,  opacity: 0.5,transparent: true  });

function newBody(i, height) {
    //to do: delete old body 
    if(currentBody) {
        removeBody(); 
    }

    currentBody = THREE.SkeletonUtils.clone(bodyModels[i]); 
    console.log(currentBody); 

    // currentBody.castShadow = true; 
    currentBody.userData.walking = false; 


    scene.add(currentBody);
    currentBody.userData.rootBone = currentBody.getObjectByName("Bone"); 
    currentBody.userData.mesh = currentBody.getObjectByName("Cube"); 

    currentBody.userData.mesh.castShadow = true; 
        
    currentBody.userData.helper = new THREE.SkeletonHelper(currentBody.userData.rootBone);
    //  scene.add(currentBody.userData.helper);
    currentBody.userData.bones = currentBody.userData.helper.bones; 
    console.log(currentBody.userData.bones); 

    //add places where legs can be attached 
    for(var i = 0; i < currentBody.userData.bones.length; i++) {
        if(currentBody.userData.canAttach[i]){
            var attachPointL = new THREE.Mesh(sphereGeometry, pinkMaterial); 
            var attachPointR = new THREE.Mesh(sphereGeometry, pinkMaterial); 
            attachPointL.userData.isAttachPoint = true; 
            attachPointR.userData.isAttachPoint = true; 
            attachPointL.userData.boneNum = i; 
            attachPointR.userData.boneNum = i; 

            currentBody.userData.bones[i].add(attachPointL); 
            currentBody.userData.bones[i].add(attachPointR); 
            attachPointL.position.z += currentBody.userData.zOffsets[i]; 
            attachPointR.position.z -= currentBody.userData.zOffsets[i]; 

            currentBody.userData.bones[i].userData.attachPoints = [attachPointL, attachPointR]; 

            clickableObjects.push(attachPointL); 
            clickableObjects.push(attachPointR); 
        }
    }

    //base height and rotation of the body
    currentBody.userData.height = height; 
    currentBody.userData.rootBone.position.y = currentBody.userData.height;
    currentBody.userData.baseRotation = 0; 

    currentBody.userData.beginningPos = currentBody.userData.rootBone.position.clone(); 
    newGhostBody(); 
}

function setBodyHeight() {
    updateOffsets(); 
}
function setBodyRotation() {
    updateOffsets(); 
}

function newGhostBody() {
    //var ghostGeometry = new THREE.BoxGeometry(3, 3, 3); 
    // ghostBody = new THREE.Mesh(ghostGeometry, whiteMaterial); 
    ghostBody = new THREE.Object3D(); 
    // var head = new THREE.Mesh(boxGeometry, whiteMaterial); 
    // head.position.set(2, 1.5, 0); 
    // ghostBody.attach(head); 
    scene.add(ghostBody); 
}

function newLeg(i, attachPoint, zOffset, beginTime, endTime) {
    if(!currentBody) {
        console.log("need a body first"); 
        return; 
    }

    console.log(beginTime); 
    console.log(endTime); 
    
    const leg = THREE.SkeletonUtils.clone(legModels[i]); 

    leg.castShadow = true; 

    leg.userData.isLeg = true; 

    leg.userData.rootBone = leg.getObjectByName("RootBone"); 
    leg.userData.helper = new THREE.SkeletonHelper(leg.userData.rootBone);
    
    //different "current" bone for pole vector constraint 
    leg.userData.currentPoleBone = leg.userData.rootBone.children[0]; 

    leg.userData.elbowBone = leg.getObjectByName("ElbowBone"); 
    

    leg.userData.effector = leg.getObjectByName("EndBone"); 
    leg.userData.currentBone = leg.userData.effector; 

    leg.userData.ikTarget = new THREE.Object3D();
    var stepTarget = new THREE.Mesh(torusGeometry, pinkMaterial);
    stepTarget.userData.isStepTarget = true; 
    stepTarget.userData.leg = leg; 
    stepTarget.rotation.x = Math.PI / 2; 
    leg.userData.stepTarget = stepTarget;
    leg.userData.ikTarget.add(new THREE.Mesh(boxGeometry, greenMaterial) );

    //between 0 and 1, the time in the cycle that a step begins and ends. 
    leg.userData.stepBeginTime = beginTime; 
    leg.userData.stepEndTime = endTime; 
    leg.userData.stepHeight = 3.5; 

    scene.add(leg); 
   // scene.add(leg.userData.helper); 

    currentBody.userData.helper.bones[attachPoint.userData.boneNum].add(leg.userData.rootBone); 
    leg.userData.spinePos = 0; 
    leg.userData.rootBone.rotation.z = Math.PI / -2; 
    leg.userData.rootBone.position.z += zOffset;

    //link to the attach point geo 
    attachPoint.userData.leg = leg; 
    leg.userData.attachPoint = attachPoint;


    //set the targets position to the effector position 
    leg.userData.effector.getWorldPosition(leg.userData.ikTarget.position);
    leg.userData.effector.getWorldPosition(leg.userData.stepTarget.position);
    leg.userData.stepTarget.position.y = 0; 
    leg.userData.ikTarget.position.y = 0; 
    leg.userData.stepping = false; 

    //set pole target to be in front of the step target
    leg.userData.poleTarget = new THREE.Mesh(boxGeometry, greenMaterial); 
    leg.userData.effector.getWorldPosition(leg.userData.poleTarget.position);
    leg.userData.poleTarget.position.y = currentBody.userData.height / 2; 
    leg.userData.poleTarget.position.x += 1; 
    leg.userData.poleTarget.userData.leg = leg; 

    //step targets are attached to the ghost body 
    ghostBody.attach(leg.userData.stepTarget); 

    currentBody.userData.rootBone.attach(leg.userData.poleTarget);  

    dragControls.getObjects().push(leg.userData.stepTarget); 
    clickableObjects.push(leg.userData.stepTarget); 
    // dragControls.getObjects().push(leg.userData.attachPoint); 
    dragControls.getObjects().push(leg.userData.poleTarget); 
    clickableObjects.push(leg.userData.poleTarget); 

    leg.userData.stepOffset = new THREE.Vector3(); 

    leg.userData.model = i; 

    setCurrentLeg(leg); 
    
    updateOffsets(); 

    legs.push(leg);
}

//change materials of old leg + new leg
function setCurrentLeg(leg) {
    //revert materials
    if(currentLeg) {
        currentLeg.traverse(function (child) {
            child.material = primaryMaterial; 
        })
        currentLeg.userData.poleTarget.material = grayMaterial; 
        currentLeg.userData.stepTarget.material = grayMaterial; 
        currentLeg.userData.attachPoint.material = grayMaterial; 
    
    }

    currentLeg = leg; 
    //set to highlighted material 
    if(leg) {
        leg.traverse(function (child) {
            child.material = highlightMaterial; 
        })
        currentLeg.userData.poleTarget.material = whiteMaterial; 
        currentLeg.userData.stepTarget.material = whiteMaterial; 
        currentLeg.userData.attachPoint.material = whiteMaterial; 

        legParams.stepBeginTime = currentLeg.userData.stepBeginTime; 
        legParams.stepEndTime = currentLeg.userData.stepEndTime; 
        legParams.stepHeight = currentLeg.userData.stepHeight; 
        legParams.model = currentLeg.userData.model; 
        // updateDisplay();
    }
    //disable the gui for legs
    else {

    }

    // updateDisplay();
}

function switchLeg(leg, newModel) {

}
function switchBody(newModel) {

}

function removeLeg() {
    currentBody.userData.helper.bones[currentLeg.userData.attachPoint.userData.boneNum].remove(currentLeg.userData.rootBone); 

    currentLeg.userData.attachPoint.userData.leg = null;
    currentLeg.userData.attachPoint.material = pinkMaterial; 
    

    dragControls.getObjects().splice(dragControls.getObjects().indexOf(currentLeg.userData.poleTarget), 1);
    clickableObjects.splice(clickableObjects.indexOf(currentLeg.userData.poleTarget), 1);
    dragControls.getObjects().splice(dragControls.getObjects().indexOf(currentLeg.userData.stepTarget), 1);
    clickableObjects.splice(clickableObjects.indexOf(currentLeg.userData.stepTarget), 1);


    currentBody.userData.rootBone.remove(currentLeg.userData.poleTarget); 
    currentLeg.userData.poleTarget.geometry.dispose();
    currentLeg.userData.poleTarget.material.dispose();

    scene.remove(currentLeg.userData.helper); 
    currentLeg.userData.helper.geometry.dispose();
    currentLeg.userData.helper.material.dispose();

    ghostBody.remove(currentLeg.userData.stepTarget); 
    currentLeg.userData.stepTarget.geometry.dispose();
    currentLeg.userData.stepTarget.material.dispose();
    
    legs.splice(legs.indexOf(currentLeg), 1);

    scene.remove(currentLeg); 
    currentLeg.traverse(function (child) {
        if(child.material) child.material.dispose(); 
        if(child.geometry) child.geometry.dispose(); 
    })
    currentLeg = null; 

}

function removeBody() {
    while(legs.length > 0) {
        currentLeg = legs[0]; 
        removeLeg();
    } 
    currentBody.traverse(function (child) {
        if(child.material) child.material.dispose(); 
        if(child.geometry) child.geometry.dispose(); 
    })
    scene.remove(currentBody); 
    currentBody = null; 
}