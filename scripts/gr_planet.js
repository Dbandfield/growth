"use-strict"

// local requires
var checkArguments = require("./gr_arguments.js");
var ImprovedNoise = require("./ImprovedNoise.js");
var TileableNoise = require("./gr_tileableNoise.js");
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
        var heightData = this.generateHeightFromVertices(this.m_geometry.vertices);

        // this.m_noise = new TileableNoise();

        // var heightData = [];
        // for(var i = 0; i < (64 * 64); i ++)
        // {
        //     var x = i % 64;
        //     var y = ~~(i / 64);
        //     x /= 64;
        //     y /= 64;
        //     heightData.push(this.m_noise.noise(x, y, 64));
        // }

        // get highest
        var highest = 0;
        for(var i in heightData)
        {
            if(heightData[i] > highest)
            {
                highest = heightData[i];
            }
        }
        var vCol = []
        for(var i = 0; i < this.m_geometry.vertices.length; i ++)
        {
            var r = 1.0 + (heightData[i] / (highest * 4));
            this.m_geometry.vertices[i].multiplyScalar(r);
            var col = new THREE.Color();
            col.setHSL(0, 0.3, r - 0.5);
            vCol.push(col);
        }

        for(var f in this.m_geometry.faces)
        {
            var v1 = this.m_geometry.faces[f].a;
            var v2 = this.m_geometry.faces[f].b;
            var v3 = this.m_geometry.faces[f].c;

            this.m_geometry.faces[f].vertexColors[0] = vCol[v1];
            this.m_geometry.faces[f].vertexColors[1] = vCol[v2];
            this.m_geometry.faces[f].vertexColors[2] = vCol[v3];

        }

        this.m_geometry.verticesNeedUpdate = true;
        this.m_material = new THREE.MeshLambertMaterial({color: 0xffffff, vertexColors: THREE.VertexColors});
        // this.m_material.vertexColors = THREE.FaceColors;
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

    generateHeightFromVertices(_verts) 
    {
        var size = _verts.length;
        var data = new Uint8Array(size);
        var perlin = new ImprovedNoise();
        var quality = 1;
    
        for (var j = 0; j < 4; j++) 
        {
            var ndx = 0;
            for (var i = 0; i < size; i ++) 
            {
                var x = _verts[i].x/5;
                var y = _verts[i].y/5;
                var z = _verts[i].z/5;

                data[i] += Math.abs(perlin.noise(x / quality, y / quality, z / quality) * quality * 1.75);                
            }
    
            quality *= 5;
        }
        return data;
    }
}

module.exports = Planet;