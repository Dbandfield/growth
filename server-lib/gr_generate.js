"use-strict";
/*
    This contains functions for planet management
*/
var CheckArguments = require("../public/scripts/gr_arguments.js");
var ImprovedNoise = require("../public/scripts/ImprovedNoise.js");
var Three = require("three");

module.exports = 
{
    /* generate a new planet and store it in 
        for each planet this includes information for:
        - position
        - geometry
        - location of plants 
        
        arguments:
        'position' : provide a position for the planet. This should
        be a 3 element array
        'name': string name for planet*/
    generatePlanet : function(_args)
    {
        var toCheck = ['position', 'name'];   
        CheckArguments(_args, toCheck);

        var sz = (Math.random() * 300) + 300;
        var geo = new Three.SphereGeometry(sz, 32, 32);
        var heightData = generateHeightFromVertices(geo.vertices);
        // get highest
        var highest = 0;
        for(var i in heightData)
        {
            if(heightData[i] > highest)
            {
                highest = heightData[i];
            }
        }

        // vertices will be extracted from geometry and store in
        // a 2 dim array this is what will be exported
        var exportVerts = [];

        for(var i = 0; i < geo.vertices.length; i ++)
        {
            // 1 + relative height of vertex
            var r = 1.0 + (heightData[i] / (highest * 4));
            // move vertex away from centre of sphere
            geo.vertices[i].multiplyScalar(r);

            exportVerts.push(geo.vertices[i].x);
            exportVerts.push(geo.vertices[i].y);
            exportVerts.push(geo.vertices[i].z);
        }

        var numPlants = 0;
        var exportObject = 
        {
            vertices: exportVerts,
            name: _args.name,
            position: _args.position,
            numPlants: numPlants,
            size: sz
        }

        return exportObject;
    },

    generateUniverse: function()
    {
        // an array of planet info which will be returned
        var exportArr = []; 

        var maxDist = 20000;
        var halfMaxDist = maxDist / 2;

        var sunSize = 5000;

        var numPlanets = 10;
        var takenPositions = [];
        var pos = new Three.Vector3((Math.random() * maxDist) - halfMaxDist, 
                                    (Math.random() * maxDist) - halfMaxDist, 
                                    (Math.random() * maxDist) - halfMaxDist);

        var names = ["Matunus", "Vindonnus", "Cocidius", "Ucuetis", "Toutatis", "Taranis", "Epona", "Andarta", "Andraste", "Damona"];

        for(var i = 0; i < numPlanets; i ++)
        {
            takenPositions.push(pos);
            var planetInfo = this.generatePlanet({name: names[i], position: [pos.x, pos.y, pos.z]});
            exportArr.push(planetInfo);

            // TODO: find way of getting new valid random positions not involving trial and error
            var validPos = false;
            while(!validPos)
            {
                pos = new Three.Vector3((Math.random() * maxDist) - halfMaxDist, 
                                        (Math.random() * maxDist) - halfMaxDist, 
                                        (Math.random() * maxDist) - halfMaxDist);
                validPos = true;
                for(var p in takenPositions)
                {
                    if(pos.distanceTo(takenPositions[p]) < 1500 || 
                        pos.distanceTo(new Three.Vector3(0, 0, 0) < sunSize))
                    {
                        validPos = false;
                    }
                }
            }
    
            takenPositions.push(pos);
        }

        return exportArr;
    }

};

function generateHeightFromVertices(_verts) 
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