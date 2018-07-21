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
            'position'        
        ];

        checkArguments(_args, this.m_arguments);

        this.scene = _args.scene;
        this.material =new THREE.MeshBasicMaterial({color: 0xff0000});
        this.position = _args.position;        
    }

    setup(geometry)
    {
        this.geometry = geometry;
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);     
    }
}

module.exports = Plant;