"use strict";

// React
import React, {Component} from 'react';

//local requires
// from three, but can't get via normal require. Edited to export.
import PointerLockControls from './gr_PointerLockControls.js';
import Loaders from './gr_loaders.js';
import EffectComposer from './EffectComposer.js';
import BloomPass from './BloomPass.js';
import RenderPass from './RenderPass.js';
import CopyShader from './CopyShader.js';
import ShaderPass from './ShaderPass.js';

// three addon
import Stats from './stats.js';

// mine
import Planet from './gr_planet.js';
import Sun from './gr_sun.js';
import Utils from './gr_utils.js';
import Physics from './gr_physics.js';

// npm requires
import * as THREE from 'three';
import sio from 'socket.io-client';

class ThreeScene extends Component
{
    constructor(props)
    {
        super(props);

        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.animate = this.animate.bind(this);

        // sequence management
        // have all assets been loaded????
        this.planetsCreated = false;
        this.plantGeometryLoaded = false;
        this.allLoaded = false;
        this.assetSetupComplete = false;

        // communication
        this.socket = sio();

        // MAIN vars
        this.camera;
        this.scene;
        this.renderer;
        this.controls;
        this.raycaster;

        // the sun
        this.sun = null;

        // planets
        this.planets = [];
        this.focusPlanetNdx = 0;

        // plants
        this.plantGeometry = null;

        // pointer lock
        this.plElement = document.body;

        this.alwaysMessages = 
        {
            void : "",
            travelling : "Travelling to ",
            orientate : "Landing",
            onPlanet : "You are exploring "
        }

        this.pausedMessages = 
        {
            instructions: "Click to begin <br> W, A, S, D : move <br> Mouse : look <br> F : Travel to another planet",
            loading: "Loading ... "
        }

        this.travelFlag = false;
        this.canWalk = false;
        this.controlsEnabled = true;
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.orientating = false;
        // var canJump = false; // put back in later

        // time
        this.clock = new THREE.Clock();

        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.gravVel = 0;
        this.maxGravVel = 50;

        // post processing
        this.renderModel;
        this.bloomEffect;
        this.copyPass;
        this.effectComposer;

        // profiling
        this.stats;
    }

    componentDidMount()
    {

        this.stats = new Stats();
        this.stats.showPanel(0);
        document.body.appendChild(this.stats.dom);
        
        this.scene = new THREE.Scene();

        // bind this so it works from socet callback
        var b_parseUniverse = this.parseUniverse.bind(this);

        // Request universe information
        console.log("Requesting Universe Information");
        this.socket.emit('universe-gen', 'void', function(_msg)
        {
            console.log("Received: " + _msg);
        });

        this.socket.on('universe-gen', function(_data)
        {
            console.log("Received universe data!");
            b_parseUniverse(_data);
        });


        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 100000);

        this.loadAssets();

        this.scene.background = new THREE.Color(0x000000);
        // Space doesn't have fog!
        //scene.fog = new THREE.Fog(0x000000, 10, 10000);

        this.sun = new Sun({position: new THREE.Vector3(0, 0, 0), 
                        size: 2000, scene: this.scene, brightness: 2});

        this.controls = new PointerLockControls(this.camera);

        console.log(this.controls);

        this.initPointerLock();

        this.scene.add(this.controls.getObject());

        // Player start position
        this.controls.getObject().position.set(3000, 3000, 3000);

        this.setControls();

        this.raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0);

        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(new THREE.Color(0,0,0), 1000.0);
        this.renderer.autoClear = false;
        // THREE Change
        this.mount.appendChild(this.renderer.domElement);

        // post processing
        this.renderModel = new RenderPass(this.scene, this.camera);
        this.bloomEffect = new BloomPass(0.7);
        this.copyPass = new ShaderPass(CopyShader);
        this.copyPass.renderToScreen = true;
        this.effectComposer = new EffectComposer(this.renderer);
        this.effectComposer.addPass(this.renderModel);
        this.effectComposer.addPass(this.bloomEffect);
        this.effectComposer.addPass(this.copyPass);

        window.addEventListener('resize', () => {this.onWindowResize();}, false);

        setTimeout(() =>
            {
                console.log("Requesting pointerlock");
                var element = document.body;
                element.requestPointerLock = element.requestPointerLock ||
                    element.mozRequestPointerLock ||
                    element.webkitRequestPointerLock;

                element.requestPointerLock();
            }, 10000);

        this.start(); // begin animmation
    }

    onKeyDown(event)
    {
        switch (event.keyCode) 
        {
            case 38: // up
            case 87: // w
                if(this.canWalk) this.moveForward = true;
                break;
            case 37: // left
            case 65: // a
                if(this.canWalk) this.moveLeft = true;
                break;
            case 40: // down
            case 83: // s
                if(this.canWalk) this.moveBackward = true;
                break;
            case 39: // right
            case 68: // d
                if(this.canWalk) this.moveRight = true;
                break;
            case 32: // space

                break;

        }
    }

    onKeyUp(event)
    {
        switch (event.keyCode) 
        {
            case 38: // up
            case 87: // w
                this.moveForward = false;
                break;
            case 37: // left
            case 65: // a
                this.moveLeft = false;
                break;
            case 40: // down
            case 83: // s
                this.moveBackward = false;
                break;
            case 39: // right
            case 68: // d
                this.moveRight = false;
                break;
            case 69:// e
                break;
            case 70:// f
                this.travelFlag = true;
                break;
        }
    }

    setControls()
    {
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        document.addEventListener('keydown', this.onKeyDown, false);
        document.addEventListener('keyup', this.onKeyUp, false);
    }

    /* Cleanup when removed */
    componentWillUnmount() 
    {
        this.stop()
        this.mount.removeChild(this.renderer.domElement)
    }

    /* Begin animation loop */
    start() 
    {
        if (!this.frameId) 
        {
        this.frameId = requestAnimationFrame(this.animate)
        }
    }

    animate() 
    {
        this.stats.begin();

        if(this.plantGeometryLoaded && 
            this.planetsCreated && 
            !this.assetSetupComplete)
        {
            
            this.allLoaded = true;
            this.onAllLoaded();
            this.assetSetupComplete = true;
        }

        if(this.allLoaded)
        {
            var delta = this.clock.getDelta();
            
            this.sun.update(delta);

            if (this.controlsEnabled === true)
            {
                var newFocus = this.getLookingAt(this.controls.getObject());
                if(newFocus && 
                newFocus.object.id != this.planets[this.focusPlanetNdx].object.id)
                {
                    this.props.activateTarget(newFocus.name);

                    if(this.travelFlag)
                    {
                        this.canWalk = false;
                        
                        for(var i in this.planets)
                        {
                            if(this.planets[i].object.id == newFocus.object.id)
                            {
                                this.focusPlanetNdx = i;
                                break;
                            }
                        }
                    
                        this.travelFlag = false;
                    }
                }
                else
                {
                    this.props.deactivateTarget();
                }

                var toPlanet = new THREE.Vector3();
                var from = new THREE.Vector3();
                this.controls.getObject().getWorldPosition(from);
                toPlanet.subVectors(this.planets[this.focusPlanetNdx].object.position, from);

                toPlanet.normalize();
                this.raycaster.set(from, toPlanet)
                var intersections = this.raycaster.intersectObject(this.planets[this.focusPlanetNdx].object);

                var distToPlanet = 0;
                var onObject = false;
                if(intersections.length > 0)
                {
                    distToPlanet = intersections[0].distance;
                    onObject = true;
                }

                this.velocity.x -= this.velocity.x * 10.0 * delta;
                this.velocity.z -= this.velocity.z * 10.0 * delta;
                this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
                this.direction.x = Number(this.moveLeft) - Number(this.moveRight);

                this.direction.normalize(); // this ensures consistent movements in all directions

                if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * 400.0 * delta;
                if (this.moveLeft    || this.moveRight)    this.velocity.x -= this.direction.x * 400.0 * delta;

                this.controls.getObject().translateX(this.velocity.x * delta);
                this.controls.getObject().translateY(this.velocity.y * delta);
                this.controls.getObject().translateZ(this.velocity.z * delta);

                // If the object is 'below' the user (or put another way, 
                // if the user is not inside the object)
                // apply gravity.
                if(onObject)
                {
                    
                    if(intersections[0].distance < 20 &&
                        intersections[0].distance > 5)
                    {
                        this.gravVel = 0;
                    }
                    else if(intersections[0].distance <= 10)
                    {
                        this.gravVel -= delta * 1;
                    }
                    else
                    {
                        this.gravVel = Math.min(this.gravVel + delta * 1, this.maxGravVel);
                    }

                    if(distToPlanet < 100) 
                    {
                        
                        if(!this.orientating)
                        {
                            this.orientating = true;
                        }

                        var newCanWalk = Physics.orientate(this.controls.getObject(), 
                        this.planets[this.focusPlanetNdx].object.position, 
                                    delta, 45);
                        if(newCanWalk != this.canWalk)
                        {
                            // change message
                            if(newCanWalk)
                            {
                                // REACT CHANGE
                                // always.innerHTML = alwaysMessages.onPlanet + planets[focusPlanetNdx].name;
                            }

                            this.canWalk = newCanWalk;
                        }
                        this.maxGravVel = 5;
                    }
                    else
                    {
                        this.maxGravVel = 50;
                    }
                }
                else // inside object, negative gravity
                {
                    this.gravVel -= delta * 1;
                }

                this.controls.getObject().position.addScaledVector(toPlanet, this.gravVel);
            }

            this.renderer.render(this.scene, this.camera);
            this.renderer.clear();
            this.effectComposer.render(0.01);
        }

        this.stats.end();

        this.frameId = window.requestAnimationFrame(this.animate);

    } // end animate

    onWindowResize() 
    {
        this.effectComposer.reset();

        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
    } 

    /* 
    Takes an object as an argument. It returns the object, if any that 
    it is looking at
    */
    getLookingAt(_obj)
    {
        // First see which planets are near centre of screenspace
        var closest = 0.2;
        var near = null;
        for(var p in this.planets)
        {
            if(p != this.focusPlanetNdx)
            {
                var screenPos = this.planets[p].object.position.clone().project(this.camera);

                screenPos.setZ(0);

                if(screenPos.length() < closest)
                {
                    closest = screenPos.length();
                    near = this.planets[p];
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
            this.camera.getWorldDirection(camDir);
            camDir.normalize();

            /**
             *  don't continue if the planet is behind the view.
             * This is needed because the camera projection above
             * includes planets that are behind the camera but can still
             * be projected near the centre of the screen.
            */
            
            if(Utils.toDeg(camDir.angleTo(toPlanet)) < 90) // 90 is slightly arbitrary ... can something be slightly arbitrary? no. hmm.
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

    pointerLockChange(event)
    {
        if (document.pointerLockElement === this.plElement ||
            document.mozPointerLockElement === this.plElement ||
            document.webkitPointerLockElement === this.plElement) 
        {
            this.controlsEnabled = true;
            this.controls.enabled = true;

            this.props.unpause();
            console.log("Pointer lock change unpause");
        } 
        else 
        {
            this.controls.enabled = false;
            this.velocity.set(0, 0, 0);
            this.moveLeft = false;
            this.moveRight = false;
            this.moveForward = false;
            this.moveBackward = false;

            this.props.pause(); 
            console.log("Pointer lock change pause");                   
        }
    }

    pointerLockError(event) 
    {
        console.log("Pointer lock error!");
    };

    initPointerLock()
    {
        var overlay = document.getElementById("overlay");

        var havePointerLock = 'pointerLockElement' in document ||
        'mozPointerLockElement' in document ||
        'webkitPointerLockElement' in document;
        if (havePointerLock) 
        {
            this.pointerLockChange = this.pointerLockChange.bind(this);
            this.pointerLockError = this.pointerLockError.bind(this);

            // Hook pointer lock state change events
            document.addEventListener('pointerlockchange', this.pointerLockChange, false);
            document.addEventListener('mozpointerlockchange', this.pointerLockChange, false);
            document.addEventListener('webkitpointerlockchange', this.pointerLockChange, false);
            document.addEventListener('pointerlockerror', this.pointerLockError, false);
            document.addEventListener('mozpointerlockerror', this.pointerLockError, false);
            document.addEventListener('webkitpointerlockerror', this.pointerLockError, false);

            overlay.addEventListener('click', function(event) 
            {
                var element = document.body;

                console.log("CLick!");
                element.requestPointerLock = element.requestPointerLock ||
                    element.mozRequestPointerLock ||
                    element.webkitRequestPointerLock;
        
                element.requestPointerLock();

            }, false);

        } 
        else 
        {
            // REACT CHANGE
            // instr.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
        }
    }

    loadAssets()
    {
        var plantFilename = "/data/models/mushroom1.gltf";
        var onSuccess = function(_gltf, _this)
        {
            _this.plantGeometry = _gltf.scene.children[0].geometry;
            _this.plantGeometryLoaded = true;
        };

        var onLoading = function(_xhr, _this) 
        {
            console.log((_xhr.loaded / _xhr.total * 100) + '% loaded' );
        };

        var onFailure = function(_err, _this)
        {
            console.log("Failed to load plant")
            throw _err;

        };
        
        Loaders.loadGLTF({'filename': plantFilename,
                            'onSuccess': (gltf) => {onSuccess(gltf, this);},
                            'onLoading': (xhr) => {onLoading(xhr, this);},
                            'onFailure': (e) => {onFailure(e, this);}});
    }

    parseUniverse(_data)
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

            var pl = new Planet({scene : this.scene, 
                position : pos,
                size: _data[p].size,
                geometry: bufGeo,
                name: _data[p].name,
                plantPositions: _data[p].plantPositions});
            this.planets.push(pl);
            this.scene.add(pl.object);  
        }

        this.planetsCreated = true;

        // REACT CHANGE
        // instr.innerHTML = pausedMessages.instructions;
        // domAlways.innerHTML = alwaysMessages.travelling + planets[focusPlanetNdx].name;

    }

    /* Stop animation loop */
    stop() 
    {
        cancelAnimationFrame(this.frameId)
    }

    onAllLoaded()
    {
        for(var i in this.planets)
        {
            this.planets[i].makePlants(this.plantGeometry);
        }
    }

    render()
    {
        return(<div ref={(mount) => { this.mount = mount}} />);
    }
}

module.exports = ThreeScene;