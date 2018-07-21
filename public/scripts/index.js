"use strict";

//local requires
// from three, but can't get via normal require. Edited to export.
var PointerLockControls = require('./gr_PointerLockControls.js')
var Loaders = require('./gr_loaders.js');
var EffectComposer = require('./EffectComposer.js');
var BloomPass = require('./BloomPass.js');
var RenderPass = require('./RenderPass.js');
var CopyShader = require('./CopyShader.js');
var ShaderPass = require('./ShaderPass.js');

// three addon
var Stats = require('./stats.js')

// mine
var Planet = require('./gr_planet.js');
var Sun = require('./gr_sun.js');
var Target = require('./gr_target.js');
var Utils = require('./gr_utils.js');
var Physics = require('./gr_physics.js');

// npm requires
var THREE = require('three');
var sio = require('socket.io-client');

// sequence management
// have all assets been loaded????
var planetsCreated = false;
var plantGeometryLoaded = false;
var allLoaded = false;
var assetSetupComplete = false;

// communication
var socket = sio();

// We have two scene, one main, and one for the HUD
// MAIN vars
var camera;
var listener;
var scene;
var renderer;
var controls;
var raycaster;

// the sun
var sun = null;

// planets
var planets = [];
var focusPlanetNdx = 0;

// plants
var plantGeometry = null;

// HUD VARS
var cameraHUD;
var sceneHUD;
var targetHUD;

// Text Overlays
var overlay = document.getElementById('overlay');
var instr = document.getElementById('instructions');
var display3D = document.getElementById('display3D');
var domAlways = document.getElementById('always');
var domCursorLabel = document.getElementById('cursor-label');

var alwaysMessages = 
{
    void : "",
    travelling : "Travelling to ",
    orientate : "Landing",
    onPlanet : "You are exploring "
}

var pausedMessages = 
{
    instructions: "Click to begin <br> W, A, S, D : move <br> Mouse : look <br> F : Travel to another planet",
    loading: "Loading ... "
}

var travelFlag = false;
var canWalk = false;
var controlsEnabled = true;
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var orientating = false;
// var canJump = false; // put back in later

// time
var clock = new THREE.Clock();


var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();
var gravVel = 0;
var maxGravVel = 50;

// post processing
var renderModel;
var bloomEffect;
var copyPass;
var effectComposer;

// profiling
var stats;

init();
animate();

function init()
{
    // Set text to loading
    instr.innerHTML = pausedMessages.loading;
    domAlways.innerHTML = alwaysMessages.void;

    stats = new Stats();
    stats.showPanel(0);
    document.body.appendChild(stats.dom);
    
    scene = new THREE.Scene();

    // Request universe information
    console.log("Requesting Universe Information");
    socket.emit('universe-gen', 'void', function(_msg)
    {
        console.log("Received: " + _msg);
    });

    socket.on('universe-gen', function(_data)
    {
        console.log("Received universe data!");
        console.log(_data);
        parseUniverse(_data, scene);
    });

    initPointerLock();
    initHUD(); 
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 100000);

    loadAssets();

    scene.background = new THREE.Color(0x000000);
    //scene.fog = new THREE.Fog(0x000000, 10, 10000);

    sun = new Sun({position: new THREE.Vector3(0, 0, 0), 
                    size: 2000, scene: scene, brightness: 2});

    controls = new PointerLockControls(camera);

    scene.add(controls.getObject());
    controls.getObject().position.set(3000, 3000, 3000);



    var onKeyDown = function(event) {
        switch (event.keyCode) {
            case 38: // up
            case 87: // w
                if(canWalk) moveForward = true;
                break;
            case 37: // left
            case 65: // a
                if(canWalk) moveLeft = true;
                break;
            case 40: // down
            case 83: // s
                if(canWalk) moveBackward = true;
                break;
            case 39: // right
            case 68: // d
                if(canWalk) moveRight = true;
                break;
            case 32: // space

                break;

        }
    };
    var onKeyUp = function(event) {

        switch (event.keyCode) {
            case 38: // up
            case 87: // w
                moveForward = false;
                break;
            case 37: // left
            case 65: // a
                moveLeft = false;
                break;
            case 40: // down
            case 83: // s
                moveBackward = false;
                break;
            case 39: // right
            case 68: // d
                moveRight = false;
                break;
            case 69:// e
                break;
            case 70:// f
                travelFlag = true;
                break;
        }
    };

    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
    raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0);

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(new THREE.Color(0,0,0), 1000.0);
    renderer.autoClear = false;
    display3D.appendChild(renderer.domElement);


    // post processing
    renderModel = new RenderPass(scene, camera);
    bloomEffect = new BloomPass(0.7);
    copyPass = new ShaderPass(CopyShader);
    copyPass.renderToScreen = true;
    effectComposer = new EffectComposer(renderer);
    effectComposer.addPass(renderModel);
    effectComposer.addPass(bloomEffect);
    effectComposer.addPass(copyPass);

    window.addEventListener('resize', onWindowResize, false);

    setTimeout(function()
        {
            console.log("Requesting pointerlock");
            var element = document.body;
            element.requestPointerLock = element.requestPointerLock ||
                element.mozRequestPointerLock ||
                element.webkitRequestPointerLock;

            element.requestPointerLock();
        }, 10000);
}

function animate() 
{
    requestAnimationFrame(animate);

    stats.begin();

    if(plantGeometryLoaded && 
        planetsCreated && !assetSetupComplete)
    {
        
        allLoaded = true;
        onAllLoaded();
        assetSetupComplete = true;
    }


    if(allLoaded)
    {
        var delta = clock.getDelta();
        
        sun.update(delta);

        if (controlsEnabled === true)
        {

            var newFocus = getLookingAt(controls.getObject());
            if(newFocus && 
            newFocus.object.id != planets[focusPlanetNdx].object.id)
            {
                domCursorLabel.innerHTML = newFocus.name;
                if(!targetHUD.getActivated())
                {
                    targetHUD.activate();
                }

                if(travelFlag)
                {
                    canWalk = false;
                    
                    for(var i in planets)
                    {
                        if(planets[i].object.id == newFocus.object.id)
                        {
                            focusPlanetNdx = i;
                            break;
                        }
                    }

                    domAlways.innerHTML = alwaysMessages.travelling + planets[focusPlanetNdx].name;
                
                    travelFlag = false;
                }
            }
            else
            {
                if(targetHUD.getActivated())
                {
                    domCursorLabel.innerHTML = "";
                    targetHUD.deactivate();
                }
            }

            var toPlanet = new THREE.Vector3();
            var from = new THREE.Vector3();
            controls.getObject().getWorldPosition(from);
            toPlanet.subVectors(planets[focusPlanetNdx].object.position, from);

            toPlanet.normalize();
            raycaster.set(from, toPlanet)
            var intersections = raycaster.intersectObject(planets[focusPlanetNdx].object);

            var distToPlanet = 0;
            var onObject = false;
            if(intersections.length > 0)
            {
                distToPlanet = intersections[0].distance;
                onObject = true;
            }

            velocity.x -= velocity.x * 10.0 * delta;
            velocity.z -= velocity.z * 10.0 * delta;
            direction.z = Number(moveForward) - Number(moveBackward);
            direction.x = Number(moveLeft) - Number(moveRight);

            direction.normalize(); // this ensures consistent movements in all directions

            if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
            if (moveLeft    || moveRight)    velocity.x -= direction.x * 400.0 * delta;

            controls.getObject().translateX(velocity.x * delta);
            controls.getObject().translateY(velocity.y * delta);
            controls.getObject().translateZ(velocity.z * delta);

            // If the object is 'below' the user (or put another way, 
            // if the user is not inside the object)
            // apply gravity.
            if(onObject)
            {
                
                if(intersections[0].distance < 20 &&
                    intersections[0].distance > 5)
                {
                    gravVel = 0;
                }
                else if(intersections[0].distance <= 10)
                {
                    gravVel -= delta * 1;
                }
                else
                {
                    gravVel = Math.min(gravVel + delta * 1, maxGravVel);
                }

                if(distToPlanet < 100) 
                {
                    if(!orientating)
                    {
                        orientating = true;
                        always.innerHTML = alwaysMessages.orientate;
                    }
                    var newCanWalk = Physics.orientate(controls.getObject(), 
                                planets[focusPlanetNdx].object.position, 
                                delta, 45);
                    if(newCanWalk != canWalk)
                    {
                        // change message
                        if(newCanWalk)
                        {
                            always.innerHTML = alwaysMessages.onPlanet + planets[focusPlanetNdx].name;
                        }

                        canWalk = newCanWalk;
                    }
                    maxGravVel = 5;
                }
                else
                {
                    maxGravVel = 50;
                }
            }
            else // inside object, negative gravity
            {
                gravVel -= delta * 1;
            }

            controls.getObject().position.addScaledVector(toPlanet, gravVel);
        }

        // renderer.render(scene, camera);
        renderer.clear();
        effectComposer.render(0.01);

        // updateHUD(renderer);
    }

    stats.end();
} // end animate

function onWindowResize() 
{
    effectComposer.reset();

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    cameraHUD.left =  -window.innerWidth/2;
    cameraHUD.right =  window.innerWidth/2;
    cameraHUD.top = -window.innerHeight/2;
    cameraHUD.bottom = window.innerHeight/2;
    cameraHUD.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

} 

/* 
Takes an object as an argument. It returns the object, if any that 
it is looking at
*/
function getLookingAt(_obj)
{
    // First see which planets are near centre of screenspace
    var closest = 0.2;
    var near = null;
    for(var p in planets)
    {
        if(p != focusPlanetNdx)
        {
            var screenPos = planets[p].object.position.clone().project(camera);

            screenPos.setZ(0);

            if(screenPos.length() < closest)
            {
                closest = screenPos.length();
                near = planets[p];
            } 
        }
    }

    /** Now see which are actually visible with ray casters.
     * ie. which don't have objects in the way
     */
    if(near)
    {
        var toPlanet = new THREE.Vector3();
        toPlanet.subVectors(near.object.position, _obj.position);
        toPlanet.normalize();

        var camDir = new THREE.Vector3();
        camera.getWorldDirection(camDir);
        camDir.normalize();

        /**
         *  don't continue if the planet is behind the view.
         * This is needed because the camera projection above
         * includes planets that are behind the camera but can still
         * be projected near the centre of the screen.
        */
        
        if(Utils.toDeg(camDir.angleTo(toPlanet)) < 90) // 90 is slightly arbitrary
        {
            var ray = new THREE.Raycaster(_obj.position.clone(), toPlanet);
            var intersections = ray.intersectObject(near.object);
            if(intersections.length > 0)
            {
                return near;
            }
        }
    }
}



function initView(_obj, _focus)
{
    _obj.lookAt(_focus.position);
}

function initPointerLock()
{
    var havePointerLock = 'pointerLockElement' in document ||
    'mozPointerLockElement' in document ||
    'webkitPointerLockElement' in document;
if (havePointerLock) 
{
    var element = document.body;
    var pointerlockchange = function(event)
    {
        if (document.pointerLockElement === element ||
            document.mozPointerLockElement === element ||
            document.webkitPointerLockElement === element) {
            controlsEnabled = true;
            controls.enabled = true;
            overlay.style.display = 'none';
        } else {
            controls.enabled = false;
            velocity.set(0, 0, 0);
            moveLeft = false;
            moveRight = false;
            moveForward = false;
            moveBackward = false;
            overlay.style.display = 'table';
            instr.style.display = '';
        }
    };

    var pointerlockerror = function(event) {
        instr.style.display = '';
        console.log("Pointer lock error!");
    };
    // Hook pointer lock state change events
    document.addEventListener('pointerlockchange', pointerlockchange, false);
    document.addEventListener('mozpointerlockchange', pointerlockchange, false);
    document.addEventListener('webkitpointerlockchange', pointerlockchange, false);
    document.addEventListener('pointerlockerror', pointerlockerror, false);
    document.addEventListener('mozpointerlockerror', pointerlockerror, false);
    document.addEventListener('webkitpointerlockerror', pointerlockerror, false);
    overlay.addEventListener('click', function(event) {

        element.requestPointerLock = element.requestPointerLock ||
            element.mozRequestPointerLock ||
            element.webkitRequestPointerLock;

        element.requestPointerLock();
    }, false);

} else {
    instr.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
}
}

function initHUD()
{
    cameraHUD = new THREE.OrthographicCamera(-window.innerWidth/2,
                                                window.innerWidth/2,
                                                -window.innerHeight/2,
                                                window.innerHeight/2);
    sceneHUD = new THREE.Scene();

    targetHUD = new Target({scene: sceneHUD});   
}

function updateHUD(_renderer)
{
    _renderer.render(sceneHUD, cameraHUD);
}

function loadAssets()
{
    var plantFilename = "/data/models/mushroom1.gltf";
    var onSuccess = function(_gltf)
    {
        plantGeometry = _gltf.scene.children[0].geometry;
        plantGeometryLoaded = true;
    };

    var onLoading = function(_xhr) 
    {
		console.log((_xhr.loaded / _xhr.total * 100) + '% loaded' );
    };

    var onFailure = function(_err)
    {
        console.log("Failed to load plant")
        throw _err;

    };
    
    Loaders.loadGLTF({'filename': plantFilename,
                        'onSuccess': onSuccess,
                        'onLoading': onLoading,
                        'onFailure': onFailure});
}

function parseUniverse(_data, _scene)
{
    var expectedProps = ['name', 'plantPositions', 'position', 'size', 'vertices']
    for(var p in _data)
    {
        for(var thing in expectedProps)
        {
            if(!_data[p].hasOwnProperty(expectedProps[thing]))
            {
                console.log("Planet data did not have property " + expectedProps[thing]);
                return null
            };
        }

        var geo = new THREE.SphereGeometry(_data[p].size, 32, 32);
        var verts = _data[p].vertices;
        for(var i = 0, v = 0; i <  verts.length; i += 3, v ++)
        {
            geo.vertices[v] = new THREE.Vector3(verts[i], 
                                                verts[i + 1], 
                                                verts[i + 2]);
        }

        var bufGeo = new THREE.BufferGeometry();
        bufGeo.fromGeometry(geo);

        var pos = new THREE.Vector3(_data[p].position[0],
                                    _data[p].position[1],
                                    _data[p].position[2]);

        var pl = new Planet({scene : scene, 
            position : pos,
            size: _data[p].size,
            geometry: bufGeo,
            name: _data[p].name,
            plantPositions: _data[p].plantPositions});
        planets.push(pl);
        _scene.add(pl.object);  
    }

    planetsCreated = true;
    instr.innerHTML = pausedMessages.instructions;
    domAlways.innerHTML = alwaysMessages.travelling + planets[focusPlanetNdx].name;

}

function onAllLoaded()
{
    for(var i in planets)
    {
        planets[i].makePlants(plantGeometry);
    }
}


