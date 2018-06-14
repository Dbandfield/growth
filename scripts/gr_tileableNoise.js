var Utils = require('./gr_utils.js');

class TileableNoise
{
    constructor()
    {
        this.m_perm = [];
        for(var i = 0; i < 256; i ++)
        {
            this.m_perm.push(i);
        }
        this.m_perm = Utils.shuffleArray(this.m_perm);
        this.m_perm = this.m_perm.concat(this.m_perm);

        this.m_dirs = [];
        for(var i = 0; i < 256; i ++)
        {
            var dbl = [];
            dbl.push(Math.cos(i * 2.0 * Math.PI / 256));
            dbl.push(Math.sin(i * 2.0 * Math.PI / 256));
            this.m_dirs.push(dbl)
        }
    }

    surflet(_x, _y, _gridX, _gridY, _period)
    {

        var distX = Math.abs(_x - _gridX);
        var distY = Math.abs(_y - _gridY);
        var polyX = 1 - 6 * Math.pow(distX, 5) + 
                        15 * Math.pow(distX, 4) - 
                        10 * Math.pow(distX, 3);
        var polyY = 1 - 6 * Math.pow(distY, 5) + 
                        15 * Math.pow(distY, 4) - 
                        10 * Math.pow(distY, 3);
        var ndx = this.m_perm[Math.floor(_gridX) % _period] +
                  Math.floor(_gridY) % _period;
        var hashed = this.m_perm[ndx];
        var grad = (_x - _gridX) * this.m_dirs[hashed][0] +
                   (_y - _gridY) * this.m_dirs[hashed][1]
        return polyX * polyY * grad;
    }

    noise(_x, _y, _period)
    {
        var intX = Math.floor(_x);
        var intY = Math.floor(_y);
        return this.surflet(_x, _y, intX + 0, intY + 0, _period) +
                this.surflet(_x, _y, intX + 1, intY + 0, _period) +
                this.surflet(_x, _y, intX + 0, intY + 1, _period) +
                this.surflet(_x, _y, intX + 1, intY + 1, _period);
    }

}

module.exports = TileableNoise;