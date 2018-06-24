'use strict';

var checkArguments = require('./gr_arguments.js');
var THREE = require('three');

var Plant = class Plant
{
    constructor(_args)
    {
        this.m_arguments = 
        [
            'scene',
            'position',
            'mesh'
        ];

        checkArguments(_args, this.m_arguments);

        this.m_scene = _args.scene;
        this.m_material =new THREE.MeshLambertMaterial({color: 0xff0000});
        this.m_mesh = _args.mesh;
        this.m_mesh.material = this.m_material;
        this.m_scene.add(this.m_mesh);      
    }
}

module.exports = Plant;