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
            'size',
            'geometry',
            'name',
            'numPlants'
        ]

        checkArguments(_args, this.m_arguments);

        this.m_name = _args.name;
        this.m_scene = _args.scene;
        this.m_geometry = _args.geometry;
        this.m_texGround = new THREE.TextureLoader().load("data/textures/ground.png");    
        this.m_material = new THREE.MeshLambertMaterial({map: this.m_texGround});//, vertexColors: THREE.VertexColors});
        this.m_mesh = new THREE.Mesh(this.m_geometry, this.m_material);
        this.m_mesh.position.copy(_args.position);
        this.m_scene.add(this.m_mesh);
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
}

module.exports = Planet;