

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
        forwardCCD(legs[i], 20); 
    }
}

function moveBody() {

    // XZ position: move towards target point  
    var direction = new THREE.Vector3(); 
    direction.subVectors(targetWalkingPos, currentBody.userData.rootBone.position);
    direction.y = 0; 

    cyclePos += deltaTime; 
    if(cyclePos > cycleLength) cyclePos -= cycleLength; 

    if(direction.length() > distanceError){
        direction.normalize();  
        direction.multiplyScalar(walkSpeed * deltaTime);
        currentBody.userData.rootBone.position.add(direction); 

        //rotate towards target
        var angle = currentBody.userData.rootBone.rotation.y - targetWalkingAngle; 

        //get angle between 0 and 2PI
        while(angle < 0) angle = Math.PI * 2 + angle; 
        while(angle > Math.PI * 2) angle = angle - Math.PI * 2; 
        //choose shorter direction 
        if(angle > Math.PI) angle = Math.PI * 2 - angle; 

        if(Math.abs(angle) > rotationError) {
            currentBody.userData.rootBone.rotation.y += walkingRotationDirection *  rotateSpeed * deltaTime;
        }
    }
    else {
        currentBody.userData.walking = false; 
    }

    // Y position: average leg position + offset 
    var avg = 0; 
    var worldPos = new THREE.Vector3(); 
    for(var i = 0; i < legs.length; i++) {
        legs[i].userData.effector.getWorldPosition(worldPos); 
        avg += worldPos.y; 
    }
    avg = avg / legs.length; 
    currentBody.userData.rootBone.position.y = currentBody.userData.height + avg; 
}

function moveLegs() {
    for(var i = 0; i < legs.length; i++) {

        //TO DO add cases for when endTime < beginTime
        //if the leg is in the stepping phase 
        if(cyclePos > legs[i].userData.stepBeginTime * cycleLength &&  cyclePos < legs[i].userData.stepEndTime * cycleLength ) {
            
            //if its at the beginning of the step phase, create the curve for the effector to follow 
            if(!legs[i].userData.stepping) {
                legs[i].userData.stepping = true; 
                var p1 = new THREE.Vector3(); 
                legs[i].userData.effector.getWorldPosition(p1);
                var p3 = new THREE.Vector3();
                legs[i].userData.stepTarget.getWorldPosition(p3);  
                if(p1.distanceTo(p3) > distanceError) {
                    var p2 = p1.clone(); 
                    //overshoot 
                    // if(currentBody.userData.walking) {
                    //     p3.sub(p1); 
                    //     p3.multiplyScalar(2); 
                    //     p3.add(p1); 
                    // }
                    //p3.addScaledVector(direction, walkSpeed * (legs[i].userData.stepEndTime - legs[i].userData.stepBeginTime) / cycleLength); 
                    var p4 = p3.clone(); 
                    // p2.addVectors(p1, p4); 
                    // p3.addVectors(p1, p4); 
                    // p2.multiplyScalar(0.5); 
                    // p3.multiplyScalar(0.5); 
                    p2.y = stepHeight; 
                    p3.y = stepHeight; 
                    p1.y = 0; 
                    p4.y = 0; 

                    var curve = new THREE.CubicBezierCurve3(p1, p2, p3, p4);
                    legs[i].userData.curvePath = curve; 
                    // Create the final object to add to the scene
                }
            }

            
            //follow the curve 

            var factor = cyclePos / cycleLength - legs[i].userData.stepBeginTime; 
            factor = factor / (legs[i].userData.stepEndTime - legs[i].userData.stepBeginTime);
            if(legs[i].userData.curvePath) {
                                        //update the curve to follow the step target

                legs[i].userData.stepTarget.getWorldPosition(legs[i].userData.curvePath.v3);  
                legs[i].userData.stepTarget.getWorldPosition(legs[i].userData.curvePath.v2);  
                legs[i].userData.curvePath.v2.y = stepHeight; 
                legs[i].userData.curvePath.v3.y = 0; 
                if(curveHelpersOn) {
                        var curveHelper = new THREE.Line( new THREE.BufferGeometry().setFromPoints( legs[i].userData.curvePath.getPoints( 50 ) ), new THREE.LineBasicMaterial( { color : 0xff0000, 	linewidth: 3 } ) );
                        if(legs[i].userData.curveHelper) scene.remove(legs[i].userData.curveHelper); 
                        legs[i].userData.curveHelper = curveHelper; 
                        scene.add(curveHelper);
                    }

                legs[i].userData.curvePath.getPoint(factor, legs[i].userData.ikTarget.position); 
            }
        }

        else {
            if(legs[i].userData.stepping) legs[i].userData.stepping = false; 
            legs[i].userData.curvePath = null; 
        }

    }
}