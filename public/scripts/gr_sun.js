"use strict";

var checkArguments = require("./gr_arguments.js");
var THREE = require('three');
var Particles = require('./GPUParticleSystem.js');
var Utils = require('./gr_utils.js');

class Sun
{
    constructor(_args)
    {
        checkArguments(_args,
            [
            'position',
            'size',
            'brightness',
            'scene']);

        this.position = _args.position;
        this.size = _args.size;
        this.brightness = _args.brightness;
        this.scene = _args.scene;

        this.lightColour = new THREE.Color();
        this.lightColour.setHSL(0.2, 1, 0.7)
        this.light = new THREE.PointLight(this.lightColour, this.brightness, 0, 1);
        this.tex1 = new THREE.TextureLoader().load("data/textures/sun.png");    
        this.tex2 = new THREE.TextureLoader().load("data/textures/noise.png");
        this.geometry= new THREE.SphereBufferGeometry(this.size, 32, 32);

        this.tex1.wrapS = this.tex1.wrapT = THREE.RepeatWrapping;
        this.tex2.wrapS = this.tex2.wrapT = THREE.RepeatWrapping;

        this.uniforms =
        {
            time: { value: 1.0 },
            tex1: { value: this.tex1},
            tex2: { value: this.tex2}
        };

        this.material = new THREE.ShaderMaterial({uniforms: this.uniforms,
                                                vertexShader: document.getElementById('sunVShader').textContent,
                                                fragmentShader: document.getElementById('sunFShader').textContent});

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.add(this.light);

        this.mesh.position.copy(this.position);

        this.scene.add(this.mesh);
        this.scene.add(this.light);

        // yay particles
        this.particleColour = new THREE.Color();
        this.particleColour.setHSL(0.1, 1, 0.5);
        this.particleSystem = new Particles({maxParticles: 250000});
        this.scene.add(this.particleSystem);
        this.particleOptions = 
        {
            position: this.position.clone(),
            positionRandomness: 0.1,
            velocity: new THREE.Vector3(),
            velocityRandomness: .5,
            color: this.lightColour,
            colorRandomness: 0,
            turbulence: .5,
            lifetime: 10,
            size: 15,
            sizeRandomness: 1
        };

        this.particleSpawnOptions = 
        {
            spawnRate: 15000,
            horizontalSpeed: 1.5,
            verticalSpeed: 1.33,
            timeScale: 1
        };

        this.tmr = 0;
        this.spawnRate = 0.6;

        this.tick = 0;
    }

    update(delta)
    {
        this.tmr += delta;
        this.tick += delta;
        if(this.tick < 0) this.tick = 0;
        if(this.tmr > this.spawnRate)
        {
            this.particleOptions.position.copy(this.position);
            var qua = new THREE.Quaternion();
            var vec = new THREE.Vector3((Math.random() * 2.0) - 1.0, 
                                    (Math.random() * 2.0) - 1.0, 
                                    (Math.random() * 2.0) - 1.0);
            vec.normalize();
            vec.multiplyScalar(this.size * 1.05);
            this.particleOptions.position.add(vec);

            this.tmr = 0;
            this.particleSystem.spawnParticle(this.particleOptions);
        }

        this.particleSystem.update(this.tick);

        this.uniforms.time.value = this.tick;

    }
}

module.exports = Sun;