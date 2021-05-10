//for customizing the procedural character

var currentBody; 
var currentLeg; 
var legs = []; 
var walkSpeed = 6; //unit/sec
var distanceError = 1 ///unit 
var rotationError = .01 ///radian
var rotateSpeed = 1.5; //radian/sec
var cycleLength = .6; //sec
var cyclePos = 0; 
var stepHeight = 2; //units

var targetWalkingPos = new THREE.Vector3();
var targetWalkingQuaternion = new THREE.Quaternion(); 
var targetWalkingAngle = 0; 
var walkingRotationDirection = 1; 



//match each IK target to the step target (for dynamic placement of legs)
function matchStepTargets() {
    for(var i = 0; i < legs.length; i++) {
        var stepTargetWorldPos = new THREE.Vector3(); 
        legs[i].userData.stepTarget.getWorldPosition(stepTargetWorldPos); 
        legs[i].userData.ikTarget.position.copy(stepTargetWorldPos);
    }
}

//make the step targets touch the ground
function groundStepTargets() {
    for(var i = 0; i < legs.length; i++) {
        legs[i].userData.stepTarget.position.x= currentBody.userData.rootBone.position.y; 
    }
}
