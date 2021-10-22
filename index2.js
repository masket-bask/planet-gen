const tumult = require ('tumult');
const Vector = require ('victor');
const Jimp = require ('jimp');
const mapGen = require ('./mapGen2');
const path = require ('path');
const generateName = require ('./genName');
const readline = require ('readline-sync');

const fs = require ('fs');
const { createCanvas, registerFont, loadImage } = require ('canvas');
registerFont ('googlefont.ttf', { family: 'Rationale' });

// random - https://stackoverflow.com/a/47593316
// generator
let sfc32 = (a, b, c, d) => {
    return () => {
      a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; 
      let t = (a + b) | 0;
      a = b ^ b >>> 9;
      b = c + (c << 3) | 0;
      c = (c << 21 | c >>> 11);
      d = d + 1 | 0;
      t = t + d | 0;
      c = c + t | 0;
      return (t >>> 0) / 4294967296;
    }
}
// hash
let xmur3 = function (str) {
    for (var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
        h = Math.imul (h ^ str.charCodeAt (i), 3432918353),
        h = h << 13 | h >>> 19;
    return function () {
        h = Math.imul (h ^ h >>> 16, 2246822507);
        h = Math.imul (h ^ h >>> 13, 3266489909);
        return (h ^= h >>> 16) >>> 0;
    }
}

let random = () => console.log ('random not defined yet');

let drawBackground = (width, height, ctx) => {
    ctx.beginPath ();
    ctx.rect (0, 0, width, height);
    ctx.fillStyle = "black";
    ctx.fill ();
}

let drawGlow = (width, height, ctx, minGlow, maxGlowMultiplier) => {
    let glowColor = {
        r: Math.floor (random () * 255),
        g: Math.floor (random () * 255),
        b: Math.floor (random () * 255)
    };

    let glow = minGlow + Math.floor (random () * maxGlowMultiplier);
    let glowGradient = ctx.createRadialGradient (width / 2, height / 2, 0, width / 2, height / 2, glow)

    glowGradient.addColorStop (0, `rgba(${glowColor.r}, ${glowColor.g}, ${glowColor.b}, .05)`);
    glowGradient.addColorStop (0.25, `rgba(${glowColor.r}, ${glowColor.g}, ${glowColor.b}, .05)`);
    glowGradient.addColorStop (0.35, `rgba(${glowColor.r}, ${glowColor.g}, ${glowColor.b}, .10)`);
    // glowGradient.addColorStop (0.35, `rgba(${glowColor.r + 100}, ${glowColor.g + 100}, ${glowColor.b + 100}, .3)`);
    glowGradient.addColorStop (0.5, `rgba(${glowColor.r}, ${glowColor.g}, ${glowColor.b}, .15)`);
    glowGradient.addColorStop (1, `rgba(0, 0, 0, .1)`);

    ctx.fillStyle = glowGradient;
    ctx.fill ();
}

let drawOutline = (offset, nodes, ctx, show) => {
    ctx.beginPath ();
    ctx.strokeStyle = "white";
    ctx.moveTo (offset + nodes [0].x, offset + nodes [0].y);
    for (let i = 0; i < nodes.length; i++) {
        if (i != nodes.length - 1) {
            ctx.lineTo (offset + nodes [i + 1].x, offset + nodes [i + 1].y);
        } else {
            ctx.lineTo (offset + nodes [0].x, offset + nodes [0].y);
        }
    }
    ctx.closePath ();
    if (show) ctx.stroke ();
    ctx.save ();
    ctx.clip ();
}


let distortImage = async (input, r) => {
    // return new Promise((resolve, reject) => {
    let img = await Jimp.read (input);
    if (random () < .25) img.posterize (random ());

    const source = img.clone ();
    const { width, height } = source.bitmap;
    let options = { r };
    await new Promise (resolve => {
        source.scan (0, 0, width, height, (x, y) => {
            const hx = x / width;
            const hy = y / height;
            const r = Math.sqrt (Math.pow (hx - 0.5, 2) + Math.pow (hy - 0.5, 2));
            const rn = 2 * Math.pow (r, options.r);
            const cosA = (hx - 0.5) / r;
            const sinA = (hy - 0.5) / r;
            const newX = Math.round ((rn * cosA + 0.5) * width);
            const newY = Math.round ((rn * sinA + 0.5) * height);
            const color = source.getPixelColor (newX, newY);

            img.setPixelColor (color, x, y);
            if (x == width - 1 && y == height - 1) {
                resolve ();
            }
        });
    });
    img.setPixelColor (
        source.getPixelColor (width / 2, height / 2),
        width / 2,
        height / 2
    );
    
    let buf = await img.getBufferAsync ("image/png");
    return buf;
}

let generatePlanet = async (ctx, offset, radius, nodes, terrainImage) => {
    let terrain = await loadImage (terrainImage);
    ctx.strokeStyle = "white";
    ctx.fillStyle = "blue";
    ctx.globalCompositeOperation = 'hard-light';
    ctx.globalAlpha = 0.4 + random () * 0.6;
    ctx.drawImage (terrain, offset + 20, offset + 20, radius * 2 + 20, radius * 2 + 20);
    ctx.globalAlpha = 1;

    // overlayed color
    for (let i = 0; i < nodes.length; i++) {
        ctx.fillStyle = nodes [i].gradient;
        ctx.fill ();
    }

    // shadows
    let rnd = {
        x: random () * 100 + Math.pow (-1, Math.round (random ())),
        y: random () * 100 + Math.pow (-1, Math.round (random ()))
    }

    if (random () < .25) {
        for (let i = 0; i < nodes.length; i++) {
            let grd = ctx.createRadialGradient (nodes [i].x + offset + rnd.x, nodes [i].y + offset + rnd.y, 0, nodes [i].x + offset + rnd.x, nodes [i].y + offset + rnd.y, 128);
            grd.addColorStop (0, 'rgba(0, 0, 0, .05)');
            grd.addColorStop (1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = grd;
            ctx.fill ();
        }
    } else {

        rnd.x += radius;
        rnd.y += radius;
        let gradient = ctx.createRadialGradient (rnd.x + offset, rnd.y + offset, 0, rnd.x + offset, rnd.y + offset, 256);
        gradient.addColorStop (0, 'rgba(255, 255, 255, .25)');
        gradient.addColorStop (0.25, 'rgba(0, 0, 0, .25)');
        gradient.addColorStop (0.35, 'rgba(0, 0, 0, .30)');
        gradient.addColorStop (0.5, 'rgba(0, 0, 0, .35)');
        gradient.addColorStop (1, 'rgba(255, 255, 255, .35)');
        ctx.fillStyle = gradient;
        ctx.fill ();
    }

    ctx.restore ();
}

let initRandom = seed => {
    const s = xmur3 (seed);
    random = sfc32 (s (), s (), s (), s ());
    console.log ('inited random');
}

let generate = async ({
        width = 512,
        height = 512,
        seed,
        output,
        minGlow = 10,
        maxGlowMultiplier = 200,
        radius = 128,
        numNodes = 128,
        doInitRandom = true,
        reliefMultiplier = 1,
        outline = false
    }) => {
    const stats = {
        size: '',
        name: ''
    };
    // const s = xmur3 (seed);
    // random = sfc32 (s (), s (), s (), s ());

    if (doInitRandom) initRandom (seed);

    const canvas = createCanvas (width, height);
    const ctx = canvas.getContext ('2d');
    const noise = new tumult.Simplex1 (seed);

    // minGlow = radius * 1.2;

    // draw the background
    drawBackground (width, height, ctx);

    // draw stars
    const stars = await loadImage ('stars.png');
    ctx.globalAlpha = 0.3 + random ();
    ctx.drawImage (stars, 0, 0, width, height);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'hard-light';

    // randomize the glow and radius
    minGlow = minGlow + random () * 100;
    // random ();
    maxGlowMultiplier = maxGlowMultiplier + random () * 100;
    radius = Math.floor (70 + random () * 100);

    // glow
    drawGlow (width, height, ctx, minGlow, maxGlowMultiplier)

    // generate outline nodes
    let nodes = [];
    let planetWidth = (radius * 2) + 50;
    let offset = 231 - radius; // i don't know why 231 centers it
    let opacity = random () * 75;

    for (let i = 0; i < numNodes; i++) {
        let angle = (i / (numNodes / 2)) * Math.PI;
        let pos = ((radius * Math.cos (angle)) + (planetWidth / 2)) / 100;
        let n = noise.gen (pos, pos);

        
        let nn = 0;
        let x = (radius * Math.cos (angle)) + (planetWidth / 2) + nn;
        let y = (radius * Math.sin (angle)) + (planetWidth / 2) + nn;
        
        n *= 20 + random () * 50; // intensity of gradient applied
        
        let gradient = ctx.createRadialGradient (x + offset, y + offset, 0, x, y, Math.abs (n) * 30);

        let gradientColor = {
            r: Math.floor (random () * 255),
            g: Math.floor (random () * 255),
            b: Math.floor (random () * 255)
        };

        let color = `rgba(${gradientColor.r}, ${gradientColor.g}, ${gradientColor.b}, $)`;
        gradient.addColorStop (0, color.replace ('$', Math.abs (n) / opacity));
        gradient.addColorStop (1, color.replace ('$', '0'));

        // relief
        let relief = {
            x: Math.sin (i) * random () * reliefMultiplier,
            y: - Math.cos (i) * random () * reliefMultiplier
        }
        x += relief.x;
        y += relief.y;

        nodes.push ({ x, y, gradient });
    }

    drawOutline (offset, nodes, ctx, outline);

    let map = mapGen.generate2 ({
        seed,
        width,
        height,
        random,
        octaves: Math.round (random () * 9) + 1, // rand(1,10) (was 10)
        period: Math.round (random () * 224) + 32, // rand(32, 256) (was 64)
        offset: 1
    });

    let distorted = await distortImage (map, 2);

    generatePlanet (ctx, offset, radius, nodes, distorted);

    // save the image
    const out = fs.createWriteStream (path.join (__dirname, output));
    const stream = canvas.createPNGStream ();
    stream.pipe (out);
    await new Promise (resolve => {
        out.on ('finish', () => {
            resolve ();
        });
    });

    // determine the size
    if (radius < 100) stats.size = 'small';
    else if (radius < 130) stats.size = 'medium';
    else if (radius < 160) stats.size = 'large';
    else stats.size = 'giant';

    // generate the name
    // stats.name = generateName (random);
    // stats.name = stats.name [0].toUpperCase () + stats.name.substring (1);

    return stats;
};

/*
stats:
LIFE: NONE / MICROBES / AQUATIC CREATURES / MAMMALS / HUMANS / ADVANCED CIVILIZATION
SIZE: SMALL / MEDIUM / LARGE / GIANT
COLOR: RED / BLUE / BROWN / YELLOW / RAINBOW / ETC
GLOW COLOR: []


< 100 (small)
100-130 (medium)
130-160 (large)
> 160 (giant)
*/

// generate ({
//     seed: process.argv [2] || 'luna',
//     output: './outputs/1.png',
//     reliefMultiplier: 0,
//     outline: false
// }).then (res => {
//     console.log (res);
// });

// let statsForEach = [];

// let generateMany = (n, i = 0) => {
//     if (i < n) {
//         let seed = (i).toString ();
//         generate ({
//             seed: seed,
//             output: `./outputs/${seed}.png`,
//             reliefMultiplier: 0,
//             outline: false
//         }).then (res => {
//             console.log (`generated ${seed}`);
//             statsForEach.push (res);
//             generateMany (n, ++i);
//         });
//     };
// }

// generateMany (512, 256);

// cool ones
/*
"andrei"
"6"
1

*/

let i = 0;
let s = 0;
(async () => {
    while (true) {
        let seed = (s).toString ();
        initRandom (seed);
        let name = generateName (random);
        let stats = await generate ({
            seed: name,
            doInitRandom: false,
            output: './outputs/temp.png',
            reliefMultiplier: 0,
            outline: false
        });
        if (readline.keyInYN ('keep planet?')) {
            fs.copyFileSync (path.join (__dirname, 'outputs', 'temp.png'), path.join (__dirname, 'outputs', `${(i).toString ().padStart (3, '0')}-${name}-${stats.size}.png`));
            console.log (`saved ${i}`);
            i++;   
        }

        s++;
    }
}) ();