const loader = new THREE.GLTFLoader(); 
var legModels = {}; 
var bodyModels = {}; 
var terrain; 

loader.load('models/terrain.gltf', function (gltf) {
    //gltf.scene.getObjectByName("Cube").material = meshMaterial;
    terrain = gltf.scene.getObjectByName("Plane"); 
    scene.add(terrain); 
    terrain.material = terrainMaterial;
    terrain.receiveShadow = true; 
});


loader.load('models/body1.gltf', function (gltf) {
    //gltf.scene.getObjectByName("Cube").material = meshMaterial;
    var body = gltf.scene; 
    body.traverse(function (child) {
        child.castShadow = true; 
        child.material = primaryMaterial; 
    });

    //how far to the side each leg should be for each bone
    body.userData.zOffsets =  [1, 1, 1, 1, 1, 1]; 

    //whether a leg can be attached to this bone
    body.userData.canAttach = [0, 1, 1, 1, 1, 1]; 

    bodyModels["cylinder"] = body; 
    newBody("cylinder", 4.5); 

    groundStepTargets(); 
    updateOffsets(); 
    matchStepTargets();

    
});
loader.load('models/body2.gltf', function (gltf) {
    //gltf.scene.getObjectByName("Cube").material = meshMaterial;
    var body = gltf.scene; 
    body.traverse(function (child) {
        child.castShadow = true; 
        child.material = primaryMaterial; 
    });

    //how far to the side each leg should be for each bone
    body.userData.zOffsets =  [1, 1, 1, 1, 1, 1]; 

    //whether a leg can be attached to this bone
    body.userData.canAttach = [0, 1, 1, 1, 1, 1]; 

    bodyModels["bean"] = body; 
    
});
loader.load('models/body3.gltf', function (gltf) {
    //gltf.scene.getObjectByName("Cube").material = meshMaterial;
    var body = gltf.scene; 
    body.traverse(function (child) {
        child.castShadow = true; 
        child.material = primaryMaterial; 
    });

    //how far to the side each leg should be for each bone
    body.userData.zOffsets =  [1, 2.5, 3.5, 3, 2, 1]; 

    //whether a leg can be attached to this bone
    body.userData.canAttach = [0, 1, 1, 1, 1, 1];  

    bodyModels["wide"] = body; 
    
});

loader.load('models/mesh1.gltf', function (gltf) {
    //gltf.scene.getObjectByName("Cube").material = meshMaterial;
    gltf.scene.traverse(function (child) {
    
        child.castShadow = true; 
    
    });
    legModels["asdfg"] = gltf.scene; 
});

loader.load('models/mesh2.gltf', function (gltf) {
    //gltf.scene.getObjectByName("Cube").material = meshMaterial;
    gltf.scene.traverse(function (child) {
    
        child.castShadow = true; 
    
    });
    legModels["twisty"] = gltf.scene; 
});
loader.load('models/mesh3.gltf', function (gltf) {
    //gltf.scene.getObjectByName("Cube").material = meshMaterial;
    gltf.scene.traverse(function (child) {
    
        child.castShadow = true; 
    
    });
    legModels["hands"] = gltf.scene; 
});

loader.load('models/leg_chain.gltf', function (gltf) {
    //gltf.scene.getObjectByName("Cube").material = meshMaterial;
    gltf.scene.traverse(function (child) {
    
        child.castShadow = true; 
        child.material = primaryMaterial;     
    });
    legModels["chain"] = gltf.scene; 
});

loader.load('models/leg_basic.gltf', function (gltf) {
    //gltf.scene.getObjectByName("Cube").material = meshMaterial;
    gltf.scene.traverse(function (child) {
    
        child.castShadow = true; 
        child.material = primaryMaterial;     
    });
    legModels["basic"] = gltf.scene; 
});

