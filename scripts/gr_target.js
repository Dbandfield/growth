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

        var tex = new THREE.TextureLoader().load("data/textures/target.png");     
        this.m_geo = new THREE.PlaneGeometry(100, 100);
        this.m_mat = new THREE.MeshBasicMaterial({map: tex, transparent: true});
        this.m_plane = new THREE.Mesh(this.m_geo, this.m_mat);
        this.m_plane.rotateX(Utils.toRad(180));
        this.m_plane.position.set(0, 0, -10);
        this.m_on = false;
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