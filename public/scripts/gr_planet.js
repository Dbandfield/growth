"use strict";

// local requires
var checkArguments = require("./gr_arguments.js");
var Plant = require("./gr_plant.js");


var THREE = require('three');

var Planet = class Planet
{
    constructor(_args)
    {
        this.m_arguments = 
        [
            'scene',
            'position',
            'size',
            'geometry',
            'name',
            'plantPositions'
        ]

        checkArguments(_args, this.m_arguments);

        this.m_name = _args.name;
        this.m_scene = _args.scene;
        this.m_geometry = _args.geometry;
        this.m_texGround = new THREE.TextureLoader().load("data/textures/ground.png");    
        this.m_material = new THREE.MeshLambertMaterial({map: this.m_texGround});//, vertexColors: THREE.VertexColors});
        this.m_mesh = new THREE.Mesh(this.m_geometry, this.m_material);
        this.position = new THREE.Vector3().copy(_args.position);
        this.m_mesh.position.copy(this.position);
        this.m_scene.add(this.m_mesh);

        this.plantGeometry = null;

        this.plants = [];

        for(var i in _args.plantPositions)
        {
            var pos = _args.plantPositions[i];
            pos = new THREE.Vector3(pos[0], pos[1], pos[2]);
            pos = pos.add(this.position);
            this.plants.push(new Plant({scene: this.m_scene, 
                                        position: pos}));
        }
    }

    get name()
    {
        return this.m_name;
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

    makePlants(plantGeometry)
    {
        for(var i in this.plants)
        {
            this.plants[i].setup(plantGeometry);
        }
    }
}

module.exports = Planet;