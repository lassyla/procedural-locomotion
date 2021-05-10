
//returns true if within the threshold, otherwise false
//algorithm from http://www.virtualpuppetry.com/inverse_kinematics_ccd/paper.pdf 

function CCDStep(leg) {
    //make sure bones are actually loaded

    var effectorWorldPos = new THREE.Vector3(); 
    leg.userData.effector.getWorldPosition(effectorWorldPos); 
    var targetWorldPos = leg.userData.ikTarget.position; 

    //check if effector is within threshold 
    if(targetWorldPos.distanceTo(effectorWorldPos) < .01) {
        return true;
    }

    var boneWorldPos = new THREE.Vector3(); 
    leg.userData.currentBone.getWorldPosition(boneWorldPos); 

    var inv = new THREE.Quaternion();
    leg.userData.currentBone.getWorldQuaternion(inv);
    inv.invert();

    //normalized vector from current bone to effector
    var v1 = new THREE.Vector3();
    v1.subVectors(boneWorldPos, effectorWorldPos);
    v1.applyQuaternion(inv);
    v1 = v1.normalize();

    //normalized vector from current bone to target
    var v2 = new THREE.Vector3();
    v2.subVectors(boneWorldPos, targetWorldPos);
    v2.applyQuaternion(inv);
    v2 = v2.normalize(); 

    //angle between the two vectors
    var dot = v1.dot(v2);
    var angle = Math.acos(dot);
    angle = THREE.MathUtils.clamp(angle, -1., 1.);

    //do not bother if the angle is too small, causes jittering
    if(Math.abs(angle) < .001) return false; 

    //skip if the vectors are perpendicular or parallel
    if(Math.abs(dot) < .00005) return false; 
    if(1.0 - Math.abs(dot) < .00001) return false; 

    //axis to rotate over is perpendicular to the two vectors
    var cross = new THREE.Vector3(); 

    cross.crossVectors(v1, v2);
    cross.normalize(); 
    leg.userData.currentBone.rotateOnAxis(cross, angle);
    leg.userData.currentBone.rotation.x= 0; 


    return false;
}
function forwardCCD(leg, iterations) {
    if(!leg.userData.currentBone) return false; 

    for(var i = 0; i < iterations; i++){
        if(CCDStep(leg)) return; 
        if(leg.userData.currentBone != leg.userData.rootBone) leg.userData.currentBone = leg.userData.currentBone.parent; 
        else leg.userData.currentBone = leg.userData.effector.parent; 
    }
}

function backwardCCD(leg, iterations) {
    if(!leg.userData.currentBone) return false; 

    for(var i = 0; i < iterations; i++){
        if(CCDStep(leg)) return; 
        if(leg.userData.currentBone != leg.userData.effector) leg.userData.currentBone = leg.userData.currentBone.children[0]; 
        else leg.userData.currentBone = leg.userData.rootBone; 
    }
}

function bouncingCCD(leg, iterations) {
    if(!leg.userData.currentBone) return false; 

    for(var i = 0; i < iterations; i++){
        if(CCDStep(leg)) return; 
        if(leg.userData.currentBounce == leg.userData.currentBone){
            //start over the bouncing 
            if(leg.userData.currentBounce == leg.userData.rootBone) leg.userData.currentBounce = leg.userData.currentBounce = leg.userData.effector.parent; 
            //move to the next bounce
            else leg.userData.currentBounce = leg.userData.currentBounce.parent; 
            leg.userData.currentBone = leg.userData.effector.parent; 
        }
        else leg.userData.currentBone = leg.userData.currentBone.parent;
    }
}

function clampedCCD(leg, iterations) {
    var angle_limit = .8; 
    const up = new THREE.Quaternion(0,0,0,1);

    if(!leg.userData.currentBone) return false; 
    for(var i = 0; i < iterations; i++){
        CCDStep(leg)
        
        var angle = 2 * Math.acos(leg.userData.currentBone.quaternion.w); 

        if(angle > angle_limit) {
            var amt = angle / (angle + angle_limit); 
            leg.userData.currentBone.quaternion.rotateTowards(up, angle - angle_limit); 
        }

        if(leg.userData.currentBone != leg.userData.rootBone) leg.userData.currentBone = leg.userData.currentBone.parent; 
        else leg.userData.currentBone = leg.userData.effector.parent; 
    }

}

//inspired by explanation in http://tinyphoenixgames.com/blog/building-stretchy-ik-chain-maya
function stretchCCD(leg) {

    if(!leg.userData.currentBone) return false; 

    var rootWorldPos = new THREE.Vector3(); 
    leg.userData.rootBone.getWorldPosition(rootWorldPos); 

    var targetWorldPos = leg.userData.ikTarget.position; 

    var yscale = 1; 
    var dist = targetWorldPos.distanceTo(rootWorldPos); 
    if(dist > leg.userData.limit) {
        yscale = dist / leg.userData.limit;
    }
    leg.userData.rootBone.scale.y = yscale; 
}

//https://forum.unity.com/threads/ik-chain.40431/
function poleCCD(leg, iterations) {
    if(!leg.userData.currentBone) return false; 
    moveToPole(leg);
    for(var i = 0; i < iterations; i++){
        if(CCDStep(leg)) return; 
        if(leg.userData.currentBone != leg.userData.effector) leg.userData.currentBone = leg.userData.currentBone.children[0]; 
        else leg.userData.currentBone = leg.userData.rootBone.children[0]; 
    }
}

//points elbow towards pole mesh
function moveToPole(leg) {
    if(!leg.userData.currentBone) return false; 

    var elbowWorldPos = new THREE.Vector3(); 
    leg.userData.elbowBone.getWorldPosition(elbowWorldPos); 
    var polePos = leg.userData.poleMesh.position; 
    var rootWorldPos =  new THREE.Vector3(); 
    leg.userData.rootBone.getWorldPosition(rootWorldPos); 

    var inv = new THREE.Quaternion();
    leg.userData.rootBone.getWorldQuaternion(inv);
    inv.invert();

    var v1 = new THREE.Vector3();
    v1.subVectors(rootWorldPos, elbowWorldPos);
    v1.applyQuaternion(inv);

    v1 = v1.normalize();

    var v2 = new THREE.Vector3();
    v2.subVectors(rootWorldPos, polePos);
    v2.applyQuaternion(inv);

    v2 = v2.normalize(); 

    var dot = v1.dot(v2);
    var angle = Math.acos(dot);
    angle = THREE.MathUtils.clamp(angle, -1., 1.);

    if(Math.abs(angle) < .001) return false; 
    if(Math.abs(dot) < .00005) return false; 
    if(1.0 - Math.abs(dot) < .00001) return false; 

    var cross = new THREE.Vector3(); 

    cross.crossVectors(v1, v2);
    cross.normalize(); 
    leg.userData.rootBone.rotateOnAxis(cross, angle);

}