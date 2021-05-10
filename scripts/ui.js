

//debugging
var curveHelpersOn = true; 

function startAnimationMode() {
    playing = true; 
    dragControls.enabled = false; 
    cyclePos = 0; 
    //orbitControls.enabled = false; 
}
function stopAnimationMode() {
    //TO DO: reset model positions
    playing = false; 
    dragControls.enabled = true; 
    currentBody.userData.rootBone.position.set(0, 4,0);
    targetWalkingPos.set(0, 0, 0); 
    matchStepTargets()
   // orbitControls.enabled = true; 
}

document.body.onkeydown = function(e){
    //space
    if(e.keyCode == 32){
        if(!currentBody){
            currentBody = newBody(0); 
            scene.add(currentBody);
            //scene.add(currentBody.userData.helper); 
            targetWalkingPos = currentBody.userData.rootBone.position; 
            // move up 
            currentBody.userData.height = 4; 
            currentBody.userData.rootBone.position.set(0, currentBody.userData.height,0);
            targetWalkingQuaternion.copy(currentBody.userData.rootBone.quaternion); 
        // dragControls.getObjects().push(currentBody); 
        }
    }
    //a
    if(e.keyCode == 65){
        newLeg(1, 1, 1, .5, .9); 
        newLeg(1, 1, -1, .0, .4); 
        // newLeg(1, 3, 1, .0, .4); 
        // newLeg(1, 3, -1, .5, .9); 
        newLeg(1, 5, 1, .5, .9); 
        newLeg(1, 5, -1, .0, .4); 
        matchStepTargets();
    }

    //left key
    if(e.keyCode == 37){
        if (currentLeg.userData.spinePos > 0) currentLeg.userData.spinePos;
        currentBody.userData.helper.bones[currentLeg.userData.spinePos].attach(currentLeg.userData.rootBone);
    }
    //right key
    if(e.keyCode == 39){
        if (currentLeg.userData.spinePos < currentBody.userData.helper.bones.length - 1) currentLeg.userData.spinePos++;
        currentBody.userData.helper.bones[currentLeg.userData.spinePos].attach(currentLeg.userData.rootBone);
    }
    //up key
    if(e.keyCode == 38){

        currentBody.userData.rootBone.position.y += .1; 
    }                
    //down key
    if(e.keyCode == 40){

        currentBody.userData.rootBone.position.y -= .1; 
    }
    //P key
    if(e.keyCode == 80){
        startAnimationMode(); 
    
    }
    //Q key
    if(e.keyCode == 81){
        stopAnimationMode(); 

    }
}
function mouseClick( event ) {
    if(playing){
        // calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components

        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
        raycaster.setFromCamera( mouse, camera );
        const intersects = raycaster.intersectObjects( [plane] );

        //TO DO: make this a separate function 
        if (intersects.length > 0){
            targetWalkingPos = intersects[0].point; 
            targetWalkingAngle = -Math.PI/2 + Math.atan2(targetWalkingPos.x - currentBody.userData.rootBone.position.x, targetWalkingPos.z - currentBody.userData.rootBone.position.z) ;
            var angle = currentBody.userData.rootBone.rotation.y - targetWalkingAngle; 

            //get angle between 0 and 2PI
            while(angle < 0) angle = Math.PI * 2 + angle; 
            while(angle > Math.PI * 2) angle = angle - Math.PI * 2; 

            if (angle > Math.PI) walkingRotationDirection = 1;  
            else walkingRotationDirection = -1; 
            currentBody.userData.walking = true; 
            cyclePos = 0; 

        }
    }
}

window.addEventListener( 'dblclick', mouseClick, false );
