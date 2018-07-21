"use strict"

module.exports = 
{

    toRad : function(_deg)
    {
        return _deg * (Math.PI / 180);
    },

    toDeg : function(_rad)
    {
        return _rad * (180 / Math.PI);
    },

    shuffleArray : function(_array)
    {
        let counter = _array.length;

        while (counter > 0)
        {
            let index = Math.floor(Math.random() * counter);
            counter --;
            let temp = _array[counter];
            _array[counter] = _array[index];
            _array[index] = temp;
        }

        return _array;
    },

    randomRange : function(_min, _max)
    {
        return (Math.random() * (_max - _min)) + _min
    }

}