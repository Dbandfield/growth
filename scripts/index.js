"use strict";

//local requires
// from three, but can't get via normal require. Edited to export.
var ImprovedNoise = require('./ImprovedNoise.js')
var PointerLockControls = require('./gr_PointerLockControls.js')
// mine
var Planet = require('./gr_planet.js');
var Target = require('./gr_target.js');
var Utils = require('./gr_utils.js');

// npm requires
var THREE = require('three');

// We have two scene, one main, and one for the HUD
// MAIN vars
var camera;
var listener;
var scene;
var renderer;
var controls;
var raycaster;

// planets
var numPlanets = 10;
var planets = [];
var focusPlanetNdx = 0;

var travelFlag = false;
var canWalk = false;
var angleToDisableWalking = 45;

// HUD VARS
var cameraHUD;
var sceneHUD;
var targetHUD;

var overlay = document.getElementById('overlay');
var instr = document.getElementById('instructions');
var display3D = document.getElementById('display3D');

var controlsEnabled = true;
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
// var canJump = false; // put back in later

var prevTime = performance.now();

var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();
var gravVel = 0;

init();
animate();

function init()
{
    initPointerLock();
    initHUD(); 
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 100000);
    scene = new THREE.Scene();

    var takenPositions = [];
    var pos = new THREE.Vector3(Math.random() * 10000, 
                                Math.random() * 10000, 
                                Math.random() * 10000);

    for(var i = 0; i < numPlanets; i ++)
    {
        takenPositions.push(pos);
        planets.push(new Planet({scene : scene, 
                                position : pos,
                                size: (Math.random() * 300) + 300}));
        scene.add(planets[i].object);
        // TODO: find way of getting new vlid random positions not involving trial and error
        var validPos = false;
        while(!validPos)
        {
            pos = new THREE.Vector3(Math.random() * 10000, 
                                    Math.random() * 10000, 
                                    Math.random() * 10000);
            validPos = true;
            for(var p in takenPositions)
            {
                if(pos.distanceTo(takenPositions[p]) < 1500)
                {
                    validPos = false;
                }
            }
        }

        takenPositions.push(pos);
    }

    // model
    var onProgress = function(xhr) {
        if (xhr.lengthComputable) {
            var percentComplete = xhr.loaded / xhr.total * 100;
            console.log(Math.round(percentComplete, 2) + '% downloaded');
        }
    };

    var onError = function(xhr) {};

    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.Fog(0x000000, 10, 10000);
    //var light = new THREE.HemisphereLight(0xbb8888, 0x001100, 1);
    var light = new THREE.HemisphereLight(0xffffff, 0x112255, 1);
    light.position.set(0.5, 1, 0.75);
    scene.add(light);
    controls = new PointerLockControls(camera);

    scene.add(controls.getObject());
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


    initView(controls.getObject(), planets[focusPlanetNdx].object);

}

function animate() {

    requestAnimationFrame(animate);

    var time = performance.now();
    var delta = (time - prevTime) / 1000;
    prevTime = time;

    var params = [];

    if (controlsEnabled === true)
    {

        var newFocus = getLookingAt(controls.getObject());
        if(newFocus && 
           newFocus.object.id != planets[focusPlanetNdx].object.id)
        {
            if(!targetHUD.getOn())
            {
                targetHUD.turnOn();
            }

            if(travelFlag)
            {
                
                for(var i in planets)
                {
                    if(planets[i].object.id == newFocus.object.id)
                    {
                        focusPlanetNdx = i;
                        break;
                    }
                }
            
                travelFlag = false;
            }
        }
        else
        {
            if(targetHUD.getOn())
            {
                targetHUD.turnOff();
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
            if(intersections[0].distance < 10)
            {
                gravVel = 0;
            }
            else
            {
                gravVel = Math.min(gravVel + delta * 1, 5);
            }

            if(distToPlanet < 100) 
            {
                orientate(controls.getObject(), 
                            planets[focusPlanetNdx].object.position, 
                            delta);
            }
        }
        else // inside object, negative gravity
        {
            gravVel -= delta * 1;
        }

        controls.getObject().position.addScaledVector(toPlanet, gravVel);
    }

    renderer.render(scene, camera);
    updateHUD(renderer);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/* 
Takes an object as an argument. It returns the object, if any that 
it is looking at
*/
function getLookingAt(_obj)
{
    // First see which planets are near centre of screenspace
    var thresh = 0.2;
    var near = [];
    for(var p in planets)
    {
        var screenPos = planets[p].object.position.clone().project(camera);
        screenPos.setZ(0);

        var isClose = screenPos.length() < thresh;
        if(isClose)
        {
            near.push(planets[p]);
        }
    }

    for(p in near)
    {
        var toPlanet = new THREE.Vector3();
        toPlanet.subVectors(near[p].object.position, _obj.position);
        toPlanet.normalize();

        var ray = new THREE.Raycaster(_obj.position.clone(), toPlanet);
        var intersections = ray.intersectObject(near[p].object);
        if(intersections.length > 0)
        {
            return near[p];
        }
    }
}

// This gets the world axes of the requested object. 
// _whichAxis is a string 'x' 'y' or 'z' describing which
// axis you want. Its based on the threejs getDirection
// fn of Object3D, which was annoying because there was no
// way for it to give you the y or x axes
function getWorldAxis(_whichAxis, _obj)
{
    if(typeof(_whichAxis) != 'string')
    {
        comsole.warning("need string as argument");
        return null;
    }

    var toVec = new THREE.Vector3();

    if(_whichAxis == 'x')
    {
        toVec.set(1, 0, 0);
    }
    else if(_whichAxis == 'y')
    {
        toVec.set(0, 1, 0);
    }
    else if(_whichAxis == 'z')
    {
        toVec.set(0, 0, 1);
    }
    else 
    {
        console.log("argument should be 'x' 'y' or 'z'");
        return null;
    }

    var qua = new THREE.Quaternion();
    _obj.getWorldQuaternion(qua);
    return toVec.applyQuaternion(qua);
}

// This rotates _obj so the negative y axis is pointing at
// _other. This is in order to simulate gravity. Note:
// does not actually move _obj towards _other.
function orientate(_obj, _other, _delta) 
{
    var forwards = new THREE.Vector3(0, 0, -1);

    var x = new THREE.Vector3();
    var y = new THREE.Vector3();
    var z = new THREE.Vector3();

    // get direction to target and store in y
    y.subVectors(_obj.position, _other );

    if ( y.lengthSq() === 0 ) 
    {
        // same position, so force y to 1. 0 won't work.
        y.y = 1;
    }

    // make unit v
    y.normalize();

    var dir = new THREE.Vector3();
    dir = getWorldAxis('y', _obj);
    dir.normalize();
    var ang = dir.angleTo(y);

    canWalk = Utils.toDeg(ang) < angleToDisableWalking;

    var axis = new THREE.Vector3();
    axis.crossVectors(dir, y);    
    if(ang > 0.01 || ang < -0.01)
    {
        var toRotate = Math.min(ang,  0.5 * _delta);
        _obj.rotateOnWorldAxis(axis.normalize(), toRotate);
    }
};

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
            overlay.style.display = 'block';
            instr.style.display = '';
        }
        console.log("Pointer lock change!");
        controlsEnabled = true;
        controls.enabled = true;
        overlay.style.display = 'none';
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
    instr.addEventListener('click', function(event) {
        instr.style.display = 'none';

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



