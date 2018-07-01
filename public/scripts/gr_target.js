"use-strict"

// local requires
var checkArguments = require("./gr_arguments.js");
var Utils = require('./gr_utils.js');

var THREE = require('three');

var Target = class Target
{
    constructor(_args)
    {
        this.m_arguments = 
        [
            'scene'
        ];

        checkArguments(_args, this.m_arguments);

        this.m_scene = _args.scene;

        this.m_texExpanded = new THREE.TextureLoader().load("data/textures/target.png");    
        this.m_texContracted= new THREE.TextureLoader().load("data/textures/target-in.png");  
        this.m_geo = new THREE.PlaneGeometry(60, 60);
        this.m_mat = new THREE.MeshBasicMaterial({map: this.m_texContracted, transparent: true});
        this.m_plane = new THREE.Mesh(this.m_geo, this.m_mat);
        this.m_plane.rotateX(Utils.toRad(180));
        this.m_plane.position.set(0, 0, -10);
        this.m_on = true;
        this.m_scene.add(this.m_plane); 
        this.m_activated = false;
    }

    getActivated()
    {
        return this.m_activated;
    }

    activate()
    {
        this.m_mat.setValues({map: this.m_texExpanded});
        this.m_on = true;
        this.m_activated = true;
    }

    deactivate()
    {
        this.m_mat.setValues({map: this.m_texContracted});
        this.m_on = true;
        this.m_activated = false;

    }

    turnOn()
    {
        this.m_scene.add(this.m_plane);
        this.m_on = true;
    }

    turnOff()
    {
        this.m_scene.remove(this.m_plane);
        this.m_on = false;
    }

    getOn()
    {
        return this.m_on;
    }
}

module.exports = Target;