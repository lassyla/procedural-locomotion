

//debugging
var curveHelpersOn = false; 

//https://threejs.org/docs/#examples/en/controls/DragControls
const orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
// const transformControls = new THREE.TransformControls(camera, renderer.domElement)
// scene.add(transformControls);

const dragControls = new THREE.DragControls(objects, camera, renderer.domElement);

var autoOffset = 0; 

const bodyParams = {
    model: "",
    walkSpeed:10, //unit/sec
    rotateSpeed: 2.5, //radian/sec
    cycleLength: .4, 
    bodyY: 4, 
    bodyPitch: 0, 
};

const legParams = {
    model: "basic",
    stepHeight: 1.5, 
    stepBeginTime: .5, 
    stepEndTime: .9

}

const models = { Cylinder: "cylinder", Bean: "bean", Wide: "wide"};
const legModelNames = { Chain: "chain", Basic: "basic"};

const gui = new dat.GUI();
const bodyFolder = gui.addFolder("body"); 
bodyFolder.add( bodyParams, 'model', models ).name( 'body model' ).onChange(function() {
    removeBody(); 
    newBody(this.getValue(), bodyParams.bodyY); 
});

bodyFolder.add( bodyParams, 'walkSpeed', 0, 30 ).name( 'walking speed' );
bodyFolder.add( bodyParams, 'rotateSpeed', .1, 8).name( 'turning speed' );
bodyFolder.add( bodyParams, 'cycleLength', .1, 2 ).name( 'cycle length' );
bodyFolder.add( bodyParams, 'bodyY', 2, 5).name( 'body Y' ).onChange(function() {
    currentBody.height = this.getValue(); 
    currentBody.userData.rootBone.position.y = currentBody.height; 
});
bodyFolder.add( bodyParams, 'bodyPitch', -.3, .3 ).name( 'body pitch' ).onChange(function() {
    currentBody.baseRotation = this.getValue() - Math.PI / 2; 
    currentBody.userData.rootBone.rotation.z = currentBody.baseRotation; 
});

const legFolder = gui.addFolder("leg"); 
legFolder.add( legParams, 'model', legModelNames ).name( 'body model' ).onChange(function() {
    if(currentLeg) {
        console.log(currentLeg); 
        var attachPoint = currentLeg.userData.attachPoint; 
        var zOffset = currentLeg.userData.rootBone.position.z; 
        var beginTime = currentLeg.userData.stepBeginTime; 
        var endTime = currentLeg.userData.stepEndTime; 
        var stepHeight = currentLeg.stepHeight; 
        console.log(beginTime); 
        console.log(endTime); 
        removeLeg(); 
        newLeg(this.getValue(), attachPoint, zOffset, beginTime, endTime); 
        currentLeg.stepHeight = stepHeight; 
    }
}).listen();
legFolder.add( legParams, 'stepHeight', 0, 3).name( 'step height' ).onChange(function() {
    if(currentLeg) currentLeg.userData.stepHeight = this.getValue(); 
}).listen();
legFolder.add( legParams, 'stepBeginTime', 0, 1).name( 'cycle start' ).onChange(function() {
    if(currentLeg) currentLeg.userData.stepBeginTime = this.getValue(); 
}).listen();
legFolder.add( legParams, 'stepEndTime', 0, 1).name( 'cycle end' ).onChange(function() {
    if(currentLeg) currentLeg.userData.stepEndTime = this.getValue(); 
}).listen();

// //https://stackoverflow.com/questions/16166440/refresh-dat-gui-with-new-values
// function updateDisplay() {
//     for (var i in gui.__controllers) {
//         gui.__controllers[i].updateDisplay();
//     }
//     for (var f in gui.__folders) {
//         updateDisplay(gui.__folders[f]);
//     }
// }

dragControls.addEventListener('dragstart', function (event) {
    orbitControls.enabled = false; 
  //  ikEnabled = false; 
    if(event.object.userData.leg) {
        setCurrentLeg(event.object.userData.leg);
    }
});
dragControls.addEventListener('dragend', function (event) {
    if(event.object.userData.isattachPoint) {
        stickattachPoint(event.object); 
    }

    orbitControls.enabled = true; 
   // ikEnabled = true; 

});
dragControls.addEventListener('drag', function (event) {
    if(event.object.userData.isStepTarget) {
        dragStepTarget(event.object); 
    }

    groundStepTargets(); 
    matchStepTargets()
});



function mouseMove(event) {
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

}


function mouseDown(event) {
    if(!playing) {
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
        raycaster.setFromCamera( mouse, camera );
        intersects = raycaster.intersectObjects( clickableObjects );
        if(intersects.length > 0) {
            //if its an empty attach point, add a new leg (otherwise select that leg); 
            if(intersects[0].object.userData.isAttachPoint ) {
                if(intersects[0].object.userData.leg == null){
                    newLeg("basic", intersects[0].object, intersects[0].object.position.z, autoOffset, autoOffset + .4); 

                    //toggle the automatic time offset to evenly stagger the legs 
                    if(autoOffset == 0) autoOffset = .5; 
                    else autoOffset = 0; 

                    intersects[0].object.userData.leg = currentLeg; 
                }
                else{
                    setCurrentLeg(intersects[0].object.userData.leg); 
                }

            }
        }
        else {
            // setCurrentLeg(null); 
        }
    }
}
function doubleClick( event ) {

    if(playing){
        // calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
        raycaster.setFromCamera( mouse, camera );
        intersects = raycaster.intersectObjects( [terrain] );

        //TO DO: make this a separate function 
        if (intersects.length > 0){
            targetWalkingPos = intersects[0].point; 
         //   walkTarget.position.copy(targetWalkingPos); 

            targetWalkingAngle = -Math.PI/2 + Math.atan2(targetWalkingPos.x - ghostBody.position.x, targetWalkingPos.z - ghostBody.position.z) ;
            
            var angle = ghostBody.rotation.y - targetWalkingAngle; 

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

//resets the model and adds helpers back 
function startAnimationMode() {
    if(playing) return; 
    if(legs.length == 0) return; 
    setCurrentLeg(null); 

    updateOffsets();
    playing = true; 
    dragControls.enabled = false; 
    cyclePos = 0; 
    hideClickableObjects();
    hideSkeletonHelpers(); 

}

//enters mode where you can click to make your model walk 
function stopAnimationMode() {
    if(!playing) return; 

    playing = false; 
    dragControls.enabled = true; 
    currentBody.userData.rootBone.position.copy(currentBody.userData.beginningPos);
    currentBody.userData.rootBone.rotation.y = 0; 
    ghostBody.position.set(0, 0, 0); 
    ghostBody.rotation.y = 0; 
    targetWalkingPos.set(0, 0, 0); 

    showClickableObjects();
    showSkeletonHelpers(); 

    //zero out the step target height just in case raycasting doesnt work 
    for(var i = 0; i < legs.length; i++) {
        legs[i].userData.stepTarget.position.y = 0; 
    }
    matchStepTargets()
   // orbitControls.enabled = true; 
}

function hideClickableObjects() {
    for(var i = 0; i < clickableObjects.length; i++) {
        clickableObjects[i].visible = false; 
    }
}
function showClickableObjects() {
    for(var i = 0; i < clickableObjects.length; i++) {
        clickableObjects[i].visible = true; 
    }
}
function hideStepTargets() {
    for(var i = 0; i < legs.length; i++) {
        legs[i].userData.stepTarget.visible = false; 
    }
}

function hideAttachPoints() {
    for(var i = 0; i < legs.length; i++) {
        legs[i].userData.attachPoint.visible = false; 
    }
}
function hidePoleTargets() {
    for(var i = 0; i < legs.length; i++) {
        legs[i].userData.poleTarget.visible = false; 
    }
}
function showPoleTargets() {
    for(var i = 0; i < legs.length; i++) {
        legs[i].userData.poleTarget.visible = true; 
    }
}

function showStepTargets() {
    for(var i = 0; i < legs.length; i++) {
        legs[i].userData.stepTarget.visible = true; 
    }
}


function showAttachPoints() {
    for(var i = 0; i < legs.length; i++) {
        legs[i].userData.attachPoint.visible = true; 
    }
}

function showSkeletonHelpers() {
    currentBody.userData.helper.visible = true;
    for(var i = 0; i < legs.length; i++) {
        legs[i].userData.helper.visible = true; 
    }
}

function hideSkeletonHelpers() {
    currentBody.userData.helper.visible = false;
    for(var i = 0; i < legs.length; i++) {
        legs[i].userData.helper.visible = false; 
    }
}

document.body.onkeydown = function(e){
    //space
    if(e.keyCode == 32){


    }

    //left key
    if(e.keyCode == 37){
    }
    //right key
    if(e.keyCode == 39){
    }
    //up key
    if(e.keyCode == 38){

       // currentBody.userData.rootBone.rotation.y += .1; 
        currentLeg.userData.rootBone.scale.y += .1; 
    }                
    //down key
    if(e.keyCode == 40){

        currentLeg.userData.rootBone.scale.y -= .1; 
    }
    //P key
    if(e.keyCode == 80){
        startAnimationMode(); 
    
    }
    //Q key
    if(e.keyCode == 81){
        stopAnimationMode(); 

    }
    //del key
    if(e.keyCode == 46){
        //do not remove if there's only one leg left
        if(legs.length <= 1) return; 

        removeLeg(); 
        // removeBody(); 
    }
    
}




window.addEventListener( 'dblclick', doubleClick, false );
window.addEventListener( 'pointermove', mouseMove, false );
window.addEventListener( 'pointerdown', mouseDown, false );
