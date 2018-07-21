/* 
    This file contains functions that exten the functionality of 
    three.js to model physics
*/

// the three.js library, npm installed
var THREE = require('three')

// general utility functions
var Utils = require('./gr_utils.js');

module.exports = 
{
    setAngleToDisableWalking : function(_ang)
    {
        this.m_angleToDisableWalking = _ang;
    },

    // This gets the world axes of the requested object. 
    // _whichAxis is a string 'x' 'y' or 'z' describing which
    // axis you want. Its based on the threejs getDirection
    // fn of Object3D, which was annoying because there was no
    // way for it to give you the y or x axes
    getWorldAxis : function(_whichAxis, _obj)
    {
        if(typeof(_whichAxis) != 'string')
        {
            comsole.warning("need string as argument");
            return null;
        }

        var toVec = new THREE.Vector3();

        if(_whichAxis == 'x')
        {
            toVec.set(1, 0, 0);
        }
        else if(_whichAxis == 'y')
        {
            toVec.set(0, 1, 0);
        }
        else if(_whichAxis == 'z')
        {
            toVec.set(0, 0, 1);
        }
        else 
        {
            console.log("argument should be 'x' 'y' or 'z'");
            return null;
        }

        var qua = new THREE.Quaternion();
        _obj.getWorldQuaternion(qua);
        return toVec.applyQuaternion(qua);
    },



    /**
     *  This rotates _obj so the negative y axis is pointing at
     * _other. This is in order to simulate gravity. Note:
     * does not actually move _obj towards _other.
     * 
     * If you provide _delta, then the object will be rotated
     * proportional to that value. If not, then it will be rotated
     * all the way.
     * 
     * If you provide _angleToDisableWalking, the function will 
     * return true when the object is within that angle of
     * being 'upright' and false otherwise. If not provided
     * the function will return null.
     * */
    orientate : function(_obj, _other, _delta, _angleToDisableWalking) 
    {
        var forwards = new THREE.Vector3(0, 0, -1);

        var x = new THREE.Vector3();
        var y = new THREE.Vector3();
        var z = new THREE.Vector3();

        // get direction to target and store in y
        y.subVectors(_obj.position, _other );

        if ( y.lengthSq() === 0 ) 
        {
            // same position, so force y to 1. 0 won't work.
            y.y = 1;
        }

        // make unit v
        y.normalize();

        var dir = new THREE.Vector3();
        dir = this.getWorldAxis('y', _obj);
        dir.normalize();
        var ang = dir.angleTo(y);

        var canWalk;

        if(_angleToDisableWalking == undefined)
        {
            canWalk = null;
        }
        else
        {
            canWalk = Utils.toDeg(ang) < _angleToDisableWalking;
        }

        var axis = new THREE.Vector3();
        axis.crossVectors(dir, y);    
        if(ang > 0.01 || ang < -0.01)
        {
            var toRotate;
            if(_delta == undefined)
            {
                toRotate = ang;
            }
            else
            {
                toRotate = Math.min(ang,  0.5 * _delta);
            }

            _obj.rotateOnWorldAxis(axis.normalize(), toRotate);
        }

        return canWalk;
    }
}

