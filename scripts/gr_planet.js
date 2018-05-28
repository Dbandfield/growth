"use-strict"

// local requires
var checkArguments = require("./gr_arguments.js");

var THREE = require('three');

var Planet = class Planet
{
    constructor(_args)
    {
        this.m_arguments = 
        [
            'scene',
            'position',
            'size'
        ]

        checkArguments(_args, this.m_arguments);

        this.m_scene = _args.scene;
        this.m_geometry = new THREE.SphereGeometry(_args.size, 64, 64);
        for(var f in this.m_geometry.faces)
        {
            this.m_geometry.faces[f].color = new THREE.Color(Math.random(), Math.random(), Math.random())
        }
        this.m_material = new THREE.MeshBasicMaterial({color: 0x00efdd});
        this.m_material.vertexColors = THREE.FaceColors;
        this.m_mesh = new THREE.Mesh(this.m_geometry, this.m_material);
        this.m_mesh.position.copy(_args.position);
        this.m_scene.add(this.m_mesh);
    }

    get object()
    {
        return this.m_mesh;
    }

    display()
    {

    }

    update()
    {

    }
}

module.exports = Planet;