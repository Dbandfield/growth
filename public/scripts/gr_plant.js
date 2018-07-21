'use strict';

var checkArguments = require('./gr_arguments.js');
var Physics = require('./gr_physics.js');

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
        this.material =new THREE.MeshLambertMaterial({color: 0x555555});
        this.position = _args.position;        
    }

    /**
     * Set up the mesh. Separated from the ctor
     * in case setup information isn't available
     * until later on.
     * 
     * @param {THREE.Geometry} geometry 
     *      Geometry to use
     * @param {THREE.Object3D} orientateTo 
     *      An object to point base at (ie, a planet)
     */
    setup(geometry, orientateTo)
    {
        this.geometry = geometry;
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        var rScale = Math.random() * 10;
        var xScale = (Math.random() * 0.4 + 0.8) * rScale;
        var yScale = (Math.random() * 0.4 + 0.8) * rScale;
        var zScale = xScale; // should really be symmetrical in x/z plane

        this.mesh.scale.set(xScale, yScale, zScale);
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);     

        Physics.orientate(this.mesh, orientateTo.position);

        var from = new THREE.Vector3();
        var to = new THREE.Vector3();
        var dirToOther = new THREE.Vector3();
        this.mesh.getWorldPosition(from);
        orientateTo.getWorldPosition(to);
        dirToOther.subVectors(to, from);
        dirToOther.normalize();

        var raycaster = new THREE.Raycaster(from, 
                                            dirToOther);
        var intersections = raycaster.intersectObject(orientateTo);
        if(intersections.length > 0)
        {
            this.mesh.position.copy(intersections[0].point);
        }
    }
}

module.exports = Plant;