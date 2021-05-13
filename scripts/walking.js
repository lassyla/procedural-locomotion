
var distanceError = .5 ///unit 
var rotationError = .2 ///radian

function walk()
{
    if(currentBody){
        moveBody(); 
        moveLegs();
    } 
}

function CCDLegs() {
    //TO DO: different CCD methods

    for(var i = 0; i < legs.length; i++) {
        poleCCD(legs[i], 10); 
    }
    

}

var walkTarget = new THREE.Vector3();

var avg = new THREE.Vector3(); 
var worldPos = new THREE.Vector3(); 
var upVector = new THREE.Vector3(0, 1, 0); 

var rPos = new THREE.Vector3();  
var lPos = new THREE.Vector3(); 
var diff = new THREE.Vector3(); 

// var rPos2 = new THREE.Vector3();  
// var lPos2 = new THREE.Vector3(); 


function moveBody() {

    // XZ position: move towards target point  
    var direction = new THREE.Vector3(); 
    direction.subVectors(targetWalkingPos, ghostBody.position);
    direction.y = 0; 

    cyclePos += deltaTime; 
    if(cyclePos > bodyParams.cycleLength) cyclePos -= bodyParams.cycleLength; 

    if(direction.length() > distanceError){
        direction.normalize();  
        direction.multiplyScalar(bodyParams.walkSpeed * deltaTime);
        
        //rotate towards target
        var angle = ghostBody.rotation.y - targetWalkingAngle; 

        //get angle between 0 and 2PI
        while(angle < 0) angle = Math.PI * 2 + angle; 
        while(angle > Math.PI * 2) angle = angle - Math.PI * 2; 
        //choose shorter direction 
        if(angle > Math.PI) angle = Math.PI * 2 - angle; 

        if(Math.abs(angle) > rotationError) {
            ghostBody.rotation.y += walkingRotationDirection *  bodyParams.rotateSpeed * deltaTime;
            currentBody.userData.rootBone.rotation.y += walkingRotationDirection *  bodyParams.rotateSpeed * deltaTime;
            //move slightly slower if you're rotating
            direction.multiplyScalar(.5);
        }

        else {
            ghostBody.rotation.y = targetWalkingAngle;
            currentBody.userData.rootBone.rotation.y = targetWalkingAngle;

        }
        ghostBody.position.add(direction); 

    }
    else {
        currentBody.userData.walking = false; 
    }

    // Y position: average leg position + offset 
    //rset average
    avg.multiplyScalar(0); 
    for(var i = 0; i < legs.length; i++) {
        legs[i].userData.ikTarget.getWorldPosition(worldPos); 
        avg.add(worldPos);
        var offset = legs[i].userData.stepOffset.clone(); 
        offset.applyAxisAngle(upVector, currentBody.userData.rootBone.rotation.y);
        avg.sub(offset);
    }


    var bones = currentBody.userData.bones;
    //rotate individual bones based on their connected legs 
    for(var i = 1; i < bones.length - 1; i++) {
        //reset vectors
        rPos.multiplyScalar(0); 
        lPos.multiplyScalar(0); 
        //compare the left and right legs, if there are any. 
        if( bones[i].userData.attachPoints && bones[i].userData.attachPoints.length == 2) {
            if(bones[i].userData.attachPoints[0].userData.leg) {
                bones[i].userData.attachPoints[0].userData.leg.userData.ikTarget.getWorldPosition(rPos); 
                rPos.applyAxisAngle(upVector, -currentBody.userData.rootBone.rotation.y);
            }
            if(bones[i].userData.attachPoints[1].userData.leg) {
                bones[i].userData.attachPoints[1].userData.leg.userData.ikTarget.getWorldPosition(lPos); 
                lPos.applyAxisAngle(upVector, -currentBody.userData.rootBone.rotation.y);
            }
            diff.subVectors(rPos, lPos); 
            // if(Math.abs(rPos.x - ) > .1) console.log("x diff");
            if(Math.abs(diff.y) > .1 && i >= 2) {
                bones[i-1].rotation.y = -diff.y * .1; 
                // console.log("y diff");
            }
        }
    }
        
    //     //compare with the legs behind this 
    //     if( bones[i-1].userData.attachPoints && bones[i-1].userData.attachPoints.length == 2) {
    //         if(bones[i-1].userData.attachPoints[0].userData.leg) {
    //             bones[i-1].userData.attachPoints[0].userData.leg.userData.ikTarget.getWorldPosition(rPos); 
    //             rPos2.applyAxisAngle(upVector, -currentBody.userData.rootBone.rotation.y);
    //         }
    //         if(bones[i-1].userData.attachPoints[1].userData.leg) {
    //             bones[i-1].userData.attachPoints[1].userData.leg.userData.ikTarget.getWorldPosition(lPos); 
    //             lPos2.applyAxisAngle(upVector, -currentBody.userData.rootBone.rotation.y);
    //         }
    //         var xDiff = rPos.x + lPos.x - lPos2.x - rPos2.x; 
    //         var yDiff = rPos.y + lPos.y - lPos2.y - rPos2.y; 
    //         bones[i-1].rotation.z =  -Math.atan2(yDiff, xDiff) * .021; 

    //     }

        
    //  }

    avg.divideScalar(legs.length); 
    currentBody.userData.rootBone.position.set(avg.x, avg.y, avg.z);

        //TO DO: get body rotation as an averageof leg stuff. Make it work for terrain. 

}

function moveLegs() {
    groundStepTargets();
    for(var i = 0; i < legs.length; i++) {

        //TO DO add cases for when endTime < beginTime
        //if the leg is in the stepping phase 
        if(cyclePos > legs[i].userData.stepBeginTime * bodyParams.cycleLength &&  cyclePos < legs[i].userData.stepEndTime * bodyParams.cycleLength ) {
            
            //if its at the beginning of the step phase, create the curve for the effector to follow 
            if(!legs[i].userData.stepping) {
                legs[i].userData.stepping = true; 
                groundStepTarget(legs[i]); 
                var p1 = new THREE.Vector3(); 
                legs[i].userData.ikTarget.getWorldPosition(p1);
                var p3 = new THREE.Vector3();
                legs[i].userData.stepTarget.getWorldPosition(p3);  
                if(p1.distanceTo(p3) > distanceError) {
                    var p2 = p1.clone(); 
                    var p4 = p3.clone(); 
                    p2.y += legs[i].userData.stepHeight; 
                    p3.y += legs[i].userData.stepHeight; 
                    // p1.y = 0; 
                    // p4.y = 0; 

                    var curve = new THREE.CubicBezierCurve3(p1, p2, p3, p4);
                    legs[i].userData.curvePath = curve; 
                    // Create the final object to add to the scene
                    if(curveHelpersOn) {
                        var curveHelper = new THREE.Line( new THREE.BufferGeometry().setFromPoints( legs[i].userData.curvePath.getPoints( 50 ) ), new THREE.LineBasicMaterial( { color : 0xff0000, 	linewidth: 3 } ) );
                        if(legs[i].userData.curveHelper) scene.remove(legs[i].userData.curveHelper); 
                        legs[i].userData.curveHelper = curveHelper; 
                        scene.add(curveHelper);
                    }

                }
            }

            
            //follow the curve 
            var factor = cyclePos / bodyParams.cycleLength - legs[i].userData.stepBeginTime; 
            factor = factor / (legs[i].userData.stepEndTime - legs[i].userData.stepBeginTime);

            if(legs[i].userData.curvePath) {
                ////update the curve to follow the step target

                // legs[i].userData.stepTarget.getWorldPosition(legs[i].userData.curvePath.v3);  
                // legs[i].userData.stepTarget.getWorldPosition(legs[i].userData.curvePath.v2);  
                // legs[i].userData.curvePath.v2.y = stepHeight; 
                // legs[i].userData.curvePath.v3.y = 0; 
                legs[i].userData.curvePath.getPoint(factor, legs[i].userData.ikTarget.position); 
            }
        }

        else {
            if(legs[i].userData.stepping) legs[i].userData.stepping = false; 
            legs[i].userData.curvePath = null; 
        }

    }
}