// canvas was ^2.4.1
const { createCanvas, loadImage, registerFont } = require('canvas');

registerFont('googlefont.ttf', { family: 'Rationale' });

const tumult = require('tumult');
const nameGen = require('./genName');
const Vector = require('victor');
const Jimp = require('jimp');
const mapGen = require('./mapGen2');
const planetStats = require('./planetStats');

const fs = require('fs');


// const canvas = createCanvas(512, 560); //512
const canvas = createCanvas(512, 512); //512
const ctx = canvas.getContext('2d');
const noise = new tumult.Simplex1(Math.random() * 100);

//background
ctx.beginPath();
// ctx.rect(0, 0, 512, 560); //512
ctx.rect(0, 0, 512, 512); //512
ctx.fillStyle = "black";
ctx.fill();


let r = Math.floor(Math.random() * 255);
let g = Math.floor(Math.random() * 255);
let b = Math.floor(Math.random() * 255);

let athms = 150 + Math.floor(Math.random() * 100)
let grdb = ctx.createRadialGradient(252, 252, 0, 252, 252, athms);
grdb.addColorStop(0, `rgba(${r}, ${g}, ${b}, .15)`);
grdb.addColorStop(0.25, `rgba(${r}, ${g}, ${b}, .15)`);
grdb.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, .20)`);
grdb.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, .25)`);
grdb.addColorStop(1, `rgba(0, 0, 0, .1)`);
ctx.fillStyle = grdb;
ctx.fill();

// ctx.closePath();
//options
let radius = 128;
let numNodes = 128;
let nodes = [],
    width = (radius * 2) + 50,
    height = width,
    offset = 100,
    opac = Math.random() * 75;

//generate the outline and the colors
for (let i = 0; i < numNodes; i++) {
    let angle = (i / (numNodes / 2)) * Math.PI;
    let n = noise.gen(((radius * Math.cos(angle)) + (width / 2)) / 100, ((radius * Math.cos(angle)) + (width / 2)) / 100);

    n *= 20;
    // let n2 = noise.gen(((radius * Math.cos(angle)) + (width/2)) / 100, ((radius * Math.cos(angle)) + (width/2)) / 100);
    // n2*=20;
    let nn = 0; //nn = n
    let x = (radius * Math.cos(angle)) + (width / 2) + nn; // +n
    let y = (radius * Math.sin(angle)) + (width / 2) + nn; // +n
    n *= 30;
    n /= 10;
    let grd = ctx.createRadialGradient(x + offset, y + offset, 0, x, y, Math.abs(n) * 30);

    let r = Math.floor(Math.random() * 255);
    let g = Math.floor(Math.random() * 255);
    let b = Math.floor(Math.random() * 255);
    let color = `rgba(${r}, ${g}, ${b}, $)`;
    console.log (n, opac, color, color.replace ('$', Math.abs (n) / opac));
    grd.addColorStop(0, color.replace('$', Math.abs(n) / opac));
    grd.addColorStop(1, color.replace('$', '0'));

    nodes.push({ x: x, y: y, gradient: grd });
}

//draw the outline
ctx.beginPath();
ctx.moveTo(offset + nodes[0].x, offset + nodes[0].y);
for (let i = 0; i < nodes.length; i++) {
    let n = Math.random() * Math.pow(-1, Math.round(Math.random()));
    let n2 = Math.random() * Math.pow(-1, Math.round(Math.random()));
    // n /= 5;
    // n2 /= 5;
    n = 0, n2 = 0;
    if (i != nodes.length - 1) {
        ctx.lineTo(offset + nodes[i + 1].x + n * 2, offset + nodes[i + 1].y + n2 * 2);
    } else {
        ctx.lineTo(offset + nodes[0].x + n * 2, offset + nodes[0].y + n2 * 2);
    }
}
ctx.closePath();
ctx.save();
//clip the image inside the sphere
ctx.clip();

let generatePlanet = (terrainimg, outpath) => {
    return new Promise((resolve, reject) => {
        loadImage(terrainimg).then(img => {
            ctx.strokeStyle = "white";
            ctx.fillStyle = "blue";
            // ctx.drawImage(img, offset, offset, 300, 300);
            ctx.globalCompositeOperation = 'hard-light';
            //color
            for (let i = 0; i < nodes.length; i++) {
                ctx.fillStyle = nodes[i].gradient;
                ctx.fill();
            }
            //shadows
            /*
            let rndx = Math.random() * 100 * Math.pow(-1, Math.round(Math.random()));
            let rndy = Math.random() * 100 * Math.pow(-1, Math.round(Math.random()));
            if (Math.random() < .25) { //original method
                for (let i = 0; i < nodes.length; i++) {
                    let grd = ctx.createRadialGradient(nodes[i].x + offset + rndx, nodes[i].y + offset + rndy, 0, nodes[i].x + offset + rndx, nodes[i].y + offset + rndy, 128);
                    grd.addColorStop(0, 'rgba(0, 0, 0, .05)');
                    grd.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    ctx.fillStyle = grd;
                    ctx.fill();
                }
            } else { //smooth method
                rndx += 128;
                rndy += 128;
                let grd = ctx.createRadialGradient(rndx + offset, rndy + offset, 0, rndx + offset, rndy + offset, 256);
                grd.addColorStop(0, 'rgba(255, 255, 255, .15)');
                grd.addColorStop(0.25, 'rgba(0, 0, 0, .15)');
                grd.addColorStop(0.35, 'rgba(0, 0, 0, .20)');
                grd.addColorStop(0.5, 'rgba(0, 0, 0, .25)');
                grd.addColorStop(1, 'rgba(255, 255, 255, .25)');
                ctx.fillStyle = grd;
                ctx.fill();
            }
            */

            // if(Math.random() < .25) ctx.stroke();
            // ctx.stroke();
            ctx.restore();

            //overlay stuff
            ctx.fillStyle = "white";
            ctx.font = '46px "Rationale"';
            let name = nameGen.toUpperCase ();
            // ctx.fillText(name, 20, 50);
            ctx.font = "20px Courier";
            // let stats = planetStats.getStats();
            // ctx.fillText(`TEMPERATURE: ${stats.temp}K (${(Number(stats.temp) - 273.15).toFixed(2)}ºC)`, 20, 450);
            // ctx.fillText(`ATMOSPHERE PRESSURE: ${stats.atmosphere.toUpperCase()}`, 20, 480);
            // ctx.fillText(`GRAVITY: ${stats.gravity.toUpperCase()}`, 20, 510);
            // ctx.fillText(`INHABITANTS: ${stats.inhabitants.toUpperCase()}`, 20, 540);
            // console.log(stats);
            const out = fs.createWriteStream(__dirname + `/${outpath}-${name}.png`);
            const stream = canvas.createPNGStream();
            stream.pipe(out);
            out.on('finish', () => resolve());
        }).catch(err => console.log(err));
    })
}


// let power = 1.1;

function distortPoint(p) {
    let theta = Math.atan2(p.y, p.x);
    let radius = p.length();
    radius = Math.pow(radius, power);
    p.x = (radius * Math.cos(theta) + 1) * 0.5;
    p.y = (radius * Math.sin(theta) + 1) * 0.5;
    return p;
}

function Fisheye(srcpixels, w, h) {
    let dstpixels = [];
    for (let y = 0; y < h; y++) {
        let ny = ((2 * y) / h) - 1;
        let ny2 = ny * ny;
        for (let x = 0; x < w; x++) {
            let nx = ((2 * x) / w) - 1;
            let nx2 = nx * nx;
            let r = Math.sqrt(nx2 + ny2);
            if (0 <= r && r <= 1) {
                let nr = Math.sqrt(1 - r * r);
                nr = (r + (1 - nr)) / 2;
                if (nr <= 1) {
                    let theta = Math.atan2(ny, nx);
                    let nxn = nr * Math.cos(theta);
                    let nyn = nr * Math.sin(theta);
                    let x2 = Math.floor(((nxn + 1) * w) / 2);
                    let y2 = Math.floor(((nyn + 1) * h) / 2);
                    let srcpos = Math.floor(y2 * w + x2);
                    if (srcpos >= 0 && srcpos < w * h) {
                        dstpixels[y * w + x] = srcpixels[srcpos];
                    }
                }
            }
        }
    }
    return dstpixels;
}

let distortImage = (inpath, outpath, r) => {
    return new Promise((resolve, reject) => {
        Jimp.read(inpath).then(img => {
            if (Math.random() < .25) {
                img.posterize(Math.random());
            }

            const source = img.cloneQuiet();
            const { width, height } = source.bitmap;
            let options = { r: r };
            source.scanQuiet(0, 0, width, height, (x, y) => {
                const hx = x / width;
                const hy = y / height;
                const r = Math.sqrt(Math.pow(hx - 0.5, 2) + Math.pow(hy - 0.5, 2));
                const rn = 2 * Math.pow(r, options.r);
                const cosA = (hx - 0.5) / r;
                const sinA = (hy - 0.5) / r;
                const newX = Math.round((rn * cosA + 0.5) * width);
                const newY = Math.round((rn * sinA + 0.5) * height);
                const color = source.getPixelColor(newX, newY);

                img.setPixelColor(color, x, y);
            });
            img.setPixelColor(
                source.getPixelColor(width / 2, height / 2),
                width / 2,
                height / 2
            );
            img.writeAsync(outpath).then(resolve());
        });
    });
}


function getNodes(num, w, radius, offx, offy) {
    let nodes1 = [];
    for (let i = 0; i < num; i++) {
        let angle = (i / (num / 2)) * Math.PI;
        let n = noise.gen(((radius * Math.cos(angle)) + (w / 2)) / 100, ((radius * Math.cos(angle)) + (w / 2)) / 100);

        n *= 20;
        let nn = n; //nn = n
        let x = (radius * Math.cos(angle)) + (w / 2) + nn; // +n
        let y = (radius * Math.sin(angle)) + (w / 2) + nn; // +n
        n *= 30;
        n /= 10;
        let grd = ctx.createRadialGradient(x + offx, y + offy, 0, x, y, Math.abs(n) * 30);

        let r = Math.floor(Math.random() * 255);
        let g = Math.floor(Math.random() * 255);
        let b = Math.floor(Math.random() * 255);
        let color = `rgba(${r}, ${g}, ${b}, $)`;
        grd.addColorStop(0, color.replace('$', Math.abs(n) / opac));
        grd.addColorStop(1, color.replace('$', '0'));

        nodes1.push({ x: x, y: y, gradient: grd });
    }
    return nodes1;
}



function drawLandMass(n1, n2, cp1, cp2) {
    ctx.beginPath();
    ctx.moveTo(nodes[n1].x + offset, nodes[n1].y + offset);
    ctx.bezierCurveTo(nodes[n1].x + offset + cp1, nodes[n1].y + offset, nodes[n2].x + offset + cp2, nodes[n2].y + offset, nodes[n2].x + offset, nodes[n2].y + offset);
    ctx.moveTo(nodes[n2].x + offset, nodes[n2].y + offset);
    if (n2 > n1) {
        for (let i = n2 - 1; i >= n1; i--) {
            ctx.lineTo(nodes[i].x + offset, nodes[i].y + offset);
        }
    } else {
        for (let i = n1; i < numNodes; i++) {
            ctx.lineTo(nodes[i].x + offset, nodes[i].y + offset);
        }
        for (let i = 0; i < n2; i++) {
            ctx.lineTo(nodes[i].x + offset, nodes[i].y + offset);
        }
    }

    ctx.fillStyle = "rgba(25, 0, 35, .75)";
    ctx.closePath();
    // ctx.stroke();
    ctx.fill();
}

    mapGen.generate({
        width: 512,
        height: 512,
        seed: Date.now(),
        octaves: Math.round(Math.random() * 9) + 1, // rand(1,10) (was 10)
        period: Math.round(Math.random() * 224) + 32, // rand(32, 256) (was 64)
        offset: 1,
        filename: __dirname + '/map.png'
    }).then (() => {
        let n = fs.readdirSync ('./outputs').length;
        // console.log ();
        setTimeout(() => {
            distortImage('map.png', 'map_distorted.png', 2).then(() => {
                setTimeout(() => {
                    generatePlanet('map_distorted.png', `./outputs/${n.toString ().padStart (3, '0')}`).then(() => {
                        console.log('saved image ' + n);

                    })
                }, 200);
            });
        }, 200);
    });


// console.log(nameGen);