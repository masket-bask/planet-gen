const { createCanvas, loadImage, createImageData } = require('canvas');
let canvas = createCanvas(512, 512);
let ctx = canvas.getContext('2d');


const fs = require('fs');
let out;


function terrapaintFactory () {
    function octavate () {
      var val = 0
      var max = 0
      var p = this.period
      var amp = Math.pow(this.persistance, this.octaves)
      var args = []
      for (var i = 0; i < this.octaves; i++) {
        for (var j = 0; j < arguments.length; j++) {
          args[j] = arguments[j] / p
        }
        val += (this.noise.apply(this.thisArg, args) + this.offset) * amp
        max += amp * (this.offset + 1)
        amp /= this.persistance
        p /= 2
      }
      return val / max
    }
    function setOptions (options) {
      options = options || {}
      this.octaves = options.octaves || 1
      this.period = options.period || 32
      this.offset = options.offset ? 1 : 0
      this.persistance = options.persistance || 2
      this.update = options.update || function () { throw 'No update fn' }
      this.loopvalues = options.init || []
      this.colormap = options.colormap || function (v) { return [v, v, v, 255] }
      this.thisArg = options.thisArg || null
    }
    
    function Map (noise, options) {
      setOptions.call(this, options)
      this.noise = noise
    }
    Map.prototype.compute = function (width, height) {
      var map = new Uint8ClampedArray(width * height * 4)
      for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
          if (this.loopvalues.length !== 0) {
            this.loopvalues = this.update(this.loopvalues)
          }
          var noiseArgs = [x, y].concat(this.loopvalues)
          var val = Math.trunc(octavate.apply(this, noiseArgs) * 255)
          var pixelData
          if (typeof this.colormap === 'function') {
            pixelData = this.colormap(val)
          } else {
            pixelData = this.colormap[val]
          }
          map.set(pixelData, x * 4 + y * 4 * width)
        }
      }
    //   return new ImageData(map, width, height)
    return createImageData(map, width, height);
    }
    Map.prototype.draw = function (canvas) {
    //   canvas = typeof canvas === 'string'
    //     ? document.querySelector(canvas)
    //     : canvas
      canvas.getContext('2d').putImageData(this.compute(
        canvas.width,
        canvas.height
      ), 0, 0)
      this.canvas = canvas
    }
    Map.prototype.create = function (target, width, height) {
        return new Promise((resolve, reject) => {
            //   var canvas = document.createElement('canvas')
            var ctx = canvas.getContext('2d')
            //   target = typeof target === 'string'
            //     ? document.querySelector(target)
            //     : target
            canvas.width = width
            canvas.height = height
            ctx.putImageData(this.compute(width, height), 0, 0)
            const stream = canvas.createPNGStream();
            stream.pipe(out);
            out.on('finish', resolve());
            //   target.appendChild(canvas)
            this.canvas = canvas
        })
    }

    Map.prototype.createAndGetBuffer = function (width, height) {
      var ctx = canvas.getContext('2d')
      canvas.width = width;
      canvas.height = height;
      ctx.putImageData (this.compute (width, height), 0, 0)
      return canvas.toBuffer ();
    }
    // Map.prototype.loop = function () {
    //   var that = this
    //   var fn = function () {
    //     that.draw(that.canvas)
    //     this.animReq = requestAnimationFrame(fn)
    //   }
    //   this.animReq = requestAnimationFrame(fn)
    // }
    // Map.prototype.stop = function () {
    //   cancelAnimationFrame(this.animReq)
    // }
  
    function Curve (noise, options) {
      setOptions.call(this, options)
      this.noise = noise
    }
    Curve.prototype.compute = function (width, height) {
      var curve = new Uint8ClampedArray(width * height * 4).fill(255)
      for (var x = 0; x < width; x++) {
        if (this.loopvalues.length !== 0) {
          this.loopvalues = this.update(this.loopvalues)
        }
        var noiseArgs = [x].concat(this.loopvalues)
        var val = Math.trunc(octavate.apply(this, noiseArgs) * 255)
        //console.log(val)
        for (var i = 0; i < 3; i++) {
          curve[val * width * 4 + x * 4 + i] = 0
        }
      }
      //console.log(curve)
      //throw 'a'
      return new ImageData(curve, width, height)
    }
    Curve.prototype.draw = function (canvas) {
      Map.prototype.draw.call(this, canvas)
    }
    Curve.prototype.create = function (target, width, height) {
      Map.prototype.create.call(this, target, width, height)
    }
    Curve.prototype.loop = function () {
      Map.prototype.loop.call(this)
    }
    Curve.prototype.stop = function () {
      Map.prototype.stop.call(this)
    }
  
    var module = {
      map: function (noise, options) {
        return new Map(noise, options)
      },
      curve: function (noise, options) {
        return new Curve(noise, options)
      },
      THREE2: function () {
        return new THREE2()
      },
      THREE3: function () {
        return new THREE3()
      }
    }
  
    return module
  }
  //HERE STARTS NOISE STUFF

  function Grad(x, y, z) {
    this.x = x; this.y = y; this.z = z;
  }
  
  Grad.prototype.dot2 = function(x, y) {
    return this.x*x + this.y*y;
  };

  Grad.prototype.dot3 = function(x, y, z) {
    return this.x*x + this.y*y + this.z*z;
  };

  var grad3 = [new Grad(1,1,0),new Grad(-1,1,0),new Grad(1,-1,0),new Grad(-1,-1,0),
               new Grad(1,0,1),new Grad(-1,0,1),new Grad(1,0,-1),new Grad(-1,0,-1),
               new Grad(0,1,1),new Grad(0,-1,1),new Grad(0,1,-1),new Grad(0,-1,-1)];

  var p = [151,160,137,91,90,15,
  131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
  190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
  88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
  77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
  102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
  135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
  5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
  223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
  129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
  251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
  49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
  138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
  // To remove the need for index wrapping, double the permutation table length
  var perm = new Array(512);
  var gradP = new Array(512);

  // This isn't a very good seeding function, but it works ok. It supports 2^16
  // different seed values. Write something better if you need more seeds.
  seed = function(seed) {
    if(seed > 0 && seed < 1) {
      // Scale the seed out
      seed *= 65536;
    }

    seed = Math.floor(seed);
    if(seed < 256) {
      seed |= seed << 8;
    }

    for(var i = 0; i < 256; i++) {
      var v;
      if (i & 1) {
        v = p[i] ^ (seed & 255);
      } else {
        v = p[i] ^ ((seed>>8) & 255);
      }

      perm[i] = perm[i + 256] = v;
      gradP[i] = gradP[i + 256] = grad3[v % 12];
    }
  };

  

  /*
  for(var i=0; i<256; i++) {
    perm[i] = perm[i + 256] = p[i];
    gradP[i] = gradP[i + 256] = grad3[perm[i] % 12];
  }*/

  // Skewing and unskewing factors for 2, 3, and 4 dimensions
  var F2 = 0.5*(Math.sqrt(3)-1);
  var G2 = (3-Math.sqrt(3))/6;

  var F3 = 1/3;
  var G3 = 1/6;

  // 2D simplex noise
  simplex2 = function(xin, yin) {
    var n0, n1, n2; // Noise contributions from the three corners
    // Skew the input space to determine which simplex cell we're in
    var s = (xin+yin)*F2; // Hairy factor for 2D
    var i = Math.floor(xin+s);
    var j = Math.floor(yin+s);
    var t = (i+j)*G2;
    var x0 = xin-i+t; // The x,y distances from the cell origin, unskewed.
    var y0 = yin-j+t;
    // For the 2D case, the simplex shape is an equilateral triangle.
    // Determine which simplex we are in.
    var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
    if(x0>y0) { // lower triangle, XY order: (0,0)->(1,0)->(1,1)
      i1=1; j1=0;
    } else {    // upper triangle, YX order: (0,0)->(0,1)->(1,1)
      i1=0; j1=1;
    }
    // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
    // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
    // c = (3-sqrt(3))/6
    var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
    var y1 = y0 - j1 + G2;
    var x2 = x0 - 1 + 2 * G2; // Offsets for last corner in (x,y) unskewed coords
    var y2 = y0 - 1 + 2 * G2;
    // Work out the hashed gradient indices of the three simplex corners
    i &= 255;
    j &= 255;
    var gi0 = gradP[i+perm[j]];
    var gi1 = gradP[i+i1+perm[j+j1]];
    var gi2 = gradP[i+1+perm[j+1]];
    // Calculate the contribution from the three corners
    var t0 = 0.5 - x0*x0-y0*y0;
    if(t0<0) {
      n0 = 0;
    } else {
      t0 *= t0;
      n0 = t0 * t0 * gi0.dot2(x0, y0);  // (x,y) of grad3 used for 2D gradient
    }
    var t1 = 0.5 - x1*x1-y1*y1;
    if(t1<0) {
      n1 = 0;
    } else {
      t1 *= t1;
      n1 = t1 * t1 * gi1.dot2(x1, y1);
    }
    var t2 = 0.5 - x2*x2-y2*y2;
    if(t2<0) {
      n2 = 0;
    } else {
      t2 *= t2;
      n2 = t2 * t2 * gi2.dot2(x2, y2);
    }
    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1,1].
    return 70 * (n0 + n1 + n2);
  };

  // 3D simplex noise
  simplex3 = function(xin, yin, zin) {
    var n0, n1, n2, n3; // Noise contributions from the four corners

    // Skew the input space to determine which simplex cell we're in
    var s = (xin+yin+zin)*F3; // Hairy factor for 2D
    var i = Math.floor(xin+s);
    var j = Math.floor(yin+s);
    var k = Math.floor(zin+s);

    var t = (i+j+k)*G3;
    var x0 = xin-i+t; // The x,y distances from the cell origin, unskewed.
    var y0 = yin-j+t;
    var z0 = zin-k+t;

    // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
    // Determine which simplex we are in.
    var i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
    var i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
    if(x0 >= y0) {
      if(y0 >= z0)      { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; }
      else if(x0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; }
      else              { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; }
    } else {
      if(y0 < z0)      { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; }
      else if(x0 < z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; }
      else             { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; }
    }
    // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
    // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
    // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
    // c = 1/6.
    var x1 = x0 - i1 + G3; // Offsets for second corner
    var y1 = y0 - j1 + G3;
    var z1 = z0 - k1 + G3;

    var x2 = x0 - i2 + 2 * G3; // Offsets for third corner
    var y2 = y0 - j2 + 2 * G3;
    var z2 = z0 - k2 + 2 * G3;

    var x3 = x0 - 1 + 3 * G3; // Offsets for fourth corner
    var y3 = y0 - 1 + 3 * G3;
    var z3 = z0 - 1 + 3 * G3;

    // Work out the hashed gradient indices of the four simplex corners
    i &= 255;
    j &= 255;
    k &= 255;
    var gi0 = gradP[i+   perm[j+   perm[k   ]]];
    var gi1 = gradP[i+i1+perm[j+j1+perm[k+k1]]];
    var gi2 = gradP[i+i2+perm[j+j2+perm[k+k2]]];
    var gi3 = gradP[i+ 1+perm[j+ 1+perm[k+ 1]]];

    // Calculate the contribution from the four corners
    var t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
    if(t0<0) {
      n0 = 0;
    } else {
      t0 *= t0;
      n0 = t0 * t0 * gi0.dot3(x0, y0, z0);  // (x,y) of grad3 used for 2D gradient
    }
    var t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
    if(t1<0) {
      n1 = 0;
    } else {
      t1 *= t1;
      n1 = t1 * t1 * gi1.dot3(x1, y1, z1);
    }
    var t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
    if(t2<0) {
      n2 = 0;
    } else {
      t2 *= t2;
      n2 = t2 * t2 * gi2.dot3(x2, y2, z2);
    }
    var t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
    if(t3<0) {
      n3 = 0;
    } else {
      t3 *= t3;
      n3 = t3 * t3 * gi3.dot3(x3, y3, z3);
    }
    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1,1].
    return 32 * (n0 + n1 + n2 + n3);

  };

  // ##### Perlin noise stuff

  function fade(t) {
    return t*t*t*(t*(t*6-15)+10);
  }

  function lerp(a, b, t) {
    return (1-t)*a + t*b;
  }

  // 2D Perlin Noise
  perlin2 = function(x, y) {
    // Find unit grid cell containing point
    var X = Math.floor(x), Y = Math.floor(y);
    // Get relative xy coordinates of point within that cell
    x = x - X; y = y - Y;
    // Wrap the integer cells at 255 (smaller integer period can be introduced here)
    X = X & 255; Y = Y & 255;

    // Calculate noise contributions from each of the four corners
    var n00 = gradP[X+perm[Y]].dot2(x, y);
    var n01 = gradP[X+perm[Y+1]].dot2(x, y-1);
    var n10 = gradP[X+1+perm[Y]].dot2(x-1, y);
    var n11 = gradP[X+1+perm[Y+1]].dot2(x-1, y-1);

    // Compute the fade curve value for x
    var u = fade(x);

    // Interpolate the four results
    return lerp(
        lerp(n00, n10, u),
        lerp(n01, n11, u),
       fade(y));
  };

  // 3D Perlin Noise
  perlin3 = function(x, y, z) {
    // Find unit grid cell containing point
    var X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
    // Get relative xyz coordinates of point within that cell
    x = x - X; y = y - Y; z = z - Z;
    // Wrap the integer cells at 255 (smaller integer period can be introduced here)
    X = X & 255; Y = Y & 255; Z = Z & 255;

    // Calculate noise contributions from each of the eight corners
    var n000 = gradP[X+  perm[Y+  perm[Z  ]]].dot3(x,   y,     z);
    var n001 = gradP[X+  perm[Y+  perm[Z+1]]].dot3(x,   y,   z-1);
    var n010 = gradP[X+  perm[Y+1+perm[Z  ]]].dot3(x,   y-1,   z);
    var n011 = gradP[X+  perm[Y+1+perm[Z+1]]].dot3(x,   y-1, z-1);
    var n100 = gradP[X+1+perm[Y+  perm[Z  ]]].dot3(x-1,   y,   z);
    var n101 = gradP[X+1+perm[Y+  perm[Z+1]]].dot3(x-1,   y, z-1);
    var n110 = gradP[X+1+perm[Y+1+perm[Z  ]]].dot3(x-1, y-1,   z);
    var n111 = gradP[X+1+perm[Y+1+perm[Z+1]]].dot3(x-1, y-1, z-1);

    // Compute the fade curve value for x, y, z
    var u = fade(x);
    var v = fade(y);
    var w = fade(z);

    // Interpolate
    return lerp(
        lerp(
          lerp(n000, n100, u),
          lerp(n001, n101, u), w),
        lerp(
          lerp(n010, n110, u),
          lerp(n011, n111, u), w),
       v);
  };

  function islandColormap (val) {
    if (val < 120) {
      return [0, 162, 232, 255]
    }
    else if (val < 130) {
      return [153, 217, 234, 255]
    }
    else if (val < 140) {
      return [239, 228, 176, 255]
    }
    else if (val < 160) {
      return [181, 230, 29, 255]
    }
    else if (val < 185) {
      return [34, 177, 76, 255]
    }
    else if (val < 190) {
      return [185, 122, 87, 255]
    } 
    else if (val < 200) {
      return [195, 195, 195, 255]
    }
    else if (val < 210) {
      return [127, 127, 127, 255]
    }
    else {
      return [255, 255, 255, 255]
    }
  }
let cColors = [];
let pickedColors = [];
cColors.push([
  [28, 29, 33, 255],
  [162, 136, 166, 255],
  [187, 155, 176, 255],
  [204, 188, 188, 255],
  [241, 227, 228, 255]
],[
  [255, 159, 28, 255],
  [255, 191, 105, 255],
  [255, 255, 255, 255],
  [203, 243, 240, 255],
  [46, 196, 182, 255]
],[
  [234, 246, 255, 255],
  [234, 246, 255, 255],
  [0, 159, 253, 255],
  [42, 42, 114, 255],
  [35, 37, 40, 255]
],[
  [230, 228, 206, 255],
  [237, 227, 233, 255],
  [235, 195, 219, 255],
  [192, 155, 216, 255],
  [159, 132, 189, 255]
],[
  [242, 243, 174, 255],
  [237, 211, 130, 255],
  [252, 158, 79, 255],
  [244, 68, 46, 255],
  [2, 1, 34, 255]
],[
  [202, 207, 133, 255],
  [140, 186, 128, 255],
  [101, 142, 156, 255],
  [77, 83, 130, 255],
  [81, 70, 99, 255]
]);
function customColormap(val) {
  if(val < 120) {
    //1
    return pickedColors[0];
  } else if(val < 130) {
    //2
    return pickedColors[1];
  } else if(val < 140) {
    //3
    return pickedColors[2];
  } else if(val < 160) {
    //4
    return pickedColors[3];
  } else if(val < 185) {
    //5
    return pickedColors[4];
  } else return [255, 255, 255, 255];
}

//   var config = {
//     octaves: 5,
//     period: 64,
//     colormap: islandColormap,
//     offset: 1
//   }
//   seed(1);
  //MY STUFF
//   console.log(terrapaintFactory);
//   let map = terrapaintFactory().map(perlin2, config);
//   console.log(map);
//   map.create('', 128, 128);
module.exports = {
    generate : config => {
      return new Promise ((resolve, reject) => {
          seed (seed);
          pickedColors = cColors [Math.floor (Math.random () * cColors.length)];
          // config.colormap = islandColormap;
          config.colormap = customColormap;
          canvas = createCanvas (config.width, config.height);
          ctx = canvas.getContext ('2d');
          let algos = [simplex2, perlin2];
          let pickedAlgo = algos [Math.floor (Math.random () * algos.length)];
          let map = terrapaintFactory ().map(pickedAlgo, config);
          out = fs.createWriteStream (config.filename);
          map.create('', config.width, config.height).then(() => {
              resolve();
          })
      })
    },
    generate2: config => {
      seed (config.seed);
      pickedColors = cColors [Math.floor (config.random () * cColors.length)];
      config.colormap = customColormap;
      canvas = createCanvas (config.width, config.height);
      ctx = canvas.getContext ('2d');
      let algos = [simplex2, perlin2];
      let pickedAlgo = algos [Math.floor (config.random () * algos.length)];
      let map = terrapaintFactory ().map (pickedAlgo, config);
      let buf = map.createAndGetBuffer (config.width, config.height);
      return buf;
    }
}