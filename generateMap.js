const Jimp = require('jimp');
const tumult = require('tumult');
const noise = new tumult.Perlin2(Math.random());


Number.prototype.clamp = function(min, max) {
    return Math.min(Math.max(this, min), max);
};

let generateMap = (w, h) => {
    return new Promise((resolve, reject) => {
        Jimp.read(w, h, 0xffffffff).then(img => {
            for(let i = 0; i < w; i++) {
                for(let j = 0; j < h; j++) {
                    
                    let n = noise.gen(i/32 * 0.35, j/32 * 0.35);
                    n = Math.floor(n * 100);
                    let col = {r: 25, g: 25, b: 30, a: 255};
                    // if(n < 0) {
                    //     col.r = 35;
                    //     col.g = 35;
                    //     col.b = 50;
                    // } else {
                    //     col.r = 120;
                    //     col.g = 35;
                    //     col.b = 25;
                    // }

                    col.r += n;
                    col.g += n;
                    col.b += n;
                    col.r = col.r.clamp(0, 255);
                    col.g = col.g.clamp(0, 255);
                    col.b = col.b.clamp(0, 255);

                    // console.log(col);
                    img.setPixelColour(Jimp.rgbaToInt(col.r, col.g, col.b, col.a), i, j);
                }
            }
            img.write('aaaaaa.png');
        });
    });
}

generateMap(200, 200).then(() => {
    console.log('map generated');
})

module.exports = {
    generate : generateMap
}