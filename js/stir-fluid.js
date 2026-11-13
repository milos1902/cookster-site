/* Cookster: tečnost koja se vrti u posudi dok se meša (stalno uključeno; ?bezmesanja ga isključuje, npr. za poređenje).
   Simulacija tečnosti na grafičkoj kartici (WebGL): delovi su prepisani iz "WebGL Fluid Simulation" (Pavel Dobryakov), MIT licenca:

   MIT License
   Copyright (c) 2017 Pavel Dobryakov
   Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal
   in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
   The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

   Izbačeno iz originala: analitika, reklame, bloom, sunčeve zrake, panel sa podešavanjima. Dodato: crtanje u posudi i unos poteza kašike iz igre (na dnu fajla). */
(function(){
'use strict';
if(/[?&]bezmesanja/.test(location.search))return;
function getWebGLContext (canvas) {
    const params = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };

    let gl = canvas.getContext('webgl2', params);
    const isWebGL2 = !!gl;
    if (!isWebGL2)
        gl = canvas.getContext('webgl', params) || canvas.getContext('experimental-webgl', params);

    let halfFloat;
    let supportLinearFiltering;
    if (isWebGL2) {
        gl.getExtension('EXT_color_buffer_float');
        supportLinearFiltering = gl.getExtension('OES_texture_float_linear');
    } else {
        halfFloat = gl.getExtension('OES_texture_half_float');
        supportLinearFiltering = gl.getExtension('OES_texture_half_float_linear');
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    const halfFloatTexType = isWebGL2 ? gl.HALF_FLOAT : halfFloat.HALF_FLOAT_OES;
    let formatRGBA;
    let formatRG;
    let formatR;

    if (isWebGL2)
    {
        formatRGBA = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType);
        formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
        formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);
    }
    else
    {
        formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
        formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
        formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
    }


    return {
        gl,
        ext: {
            formatRGBA,
            formatRG,
            formatR,
            halfFloatTexType,
            supportLinearFiltering
        }
    };
}

function getSupportedFormat (gl, internalFormat, format, type)
{
    if (!supportRenderTextureFormat(gl, internalFormat, format, type))
    {
        switch (internalFormat)
        {
            case gl.R16F:
                return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
            case gl.RG16F:
                return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
            default:
                return null;
        }
    }

    return {
        internalFormat,
        format
    }
}

function supportRenderTextureFormat (gl, internalFormat, format, type) {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);

    let fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    return status == gl.FRAMEBUFFER_COMPLETE;
}
function createFluid(canvas){
const config={SIM_RESOLUTION:128,DYE_RESOLUTION:512,DENSITY_DISSIPATION:0.7,VELOCITY_DISSIPATION:0.25,PRESSURE:0.8,PRESSURE_ITERATIONS:20,CURL:30,SPLAT_RADIUS:0.42,SPLAT_FORCE:6000};
const got=getWebGLContext(canvas);if(!got||!got.gl||!got.ext.formatRGBA||!got.ext.formatRG||!got.ext.formatR)return null;
const gl=got.gl,ext=got.ext;
class Program {
    constructor (vertexShader, fragmentShader) {
        this.uniforms = {};
        this.program = createProgram(vertexShader, fragmentShader);
        this.uniforms = getUniforms(this.program);
    }

    bind () {
        gl.useProgram(this.program);
    }
}

function createProgram (vertexShader, fragmentShader) {
    let program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        console.trace(gl.getProgramInfoLog(program));

    return program;
}

function getUniforms (program) {
    let uniforms = [];
    let uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < uniformCount; i++) {
        let uniformName = gl.getActiveUniform(program, i).name;
        uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
    }
    return uniforms;
}

function compileShader (type, source, keywords) {
    source = addKeywords(source, keywords);

    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        console.trace(gl.getShaderInfoLog(shader));

    return shader;
};

function addKeywords (source, keywords) {
    if (keywords == null) return source;
    let keywordsString = '';
    keywords.forEach(keyword => {
        keywordsString += '#define ' + keyword + '\n';
    });
    return keywordsString + source;
}
const baseVertexShader = compileShader(gl.VERTEX_SHADER, `
    precision highp float;

    attribute vec2 aPosition;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform vec2 texelSize;

    void main () {
        vUv = aPosition * 0.5 + 0.5;
        vL = vUv - vec2(texelSize.x, 0.0);
        vR = vUv + vec2(texelSize.x, 0.0);
        vT = vUv + vec2(0.0, texelSize.y);
        vB = vUv - vec2(0.0, texelSize.y);
        gl_Position = vec4(aPosition, 0.0, 1.0);
    }
`);
const clearShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    uniform sampler2D uTexture;
    uniform float value;

    void main () {
        gl_FragColor = value * texture2D(uTexture, vUv);
    }
`);

const splatShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    uniform sampler2D uTarget;
    uniform float aspectRatio;
    uniform vec3 color;
    uniform vec2 point;
    uniform float radius;

    void main () {
        vec2 p = vUv - point.xy;
        p.x *= aspectRatio;
        vec3 splat = exp(-dot(p, p) / radius) * color;
        vec3 base = texture2D(uTarget, vUv).xyz;
        gl_FragColor = vec4(base + splat, 1.0);
    }
`);

const advectionShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform vec2 texelSize;
    uniform vec2 dyeTexelSize;
    uniform float dt;
    uniform float dissipation;

    vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
        vec2 st = uv / tsize - 0.5;

        vec2 iuv = floor(st);
        vec2 fuv = fract(st);

        vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
        vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
        vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
        vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);

        return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
    }

    void main () {
    #ifdef MANUAL_FILTERING
        vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
        vec4 result = bilerp(uSource, coord, dyeTexelSize);
    #else
        vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
        vec4 result = texture2D(uSource, coord);
    #endif
        float decay = 1.0 + dissipation * dt;
        gl_FragColor = result / decay;
    }`,
    ext.supportLinearFiltering ? null : ['MANUAL_FILTERING']
);

const divergenceShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uVelocity;

    void main () {
        float L = texture2D(uVelocity, vL).x;
        float R = texture2D(uVelocity, vR).x;
        float T = texture2D(uVelocity, vT).y;
        float B = texture2D(uVelocity, vB).y;

        vec2 C = texture2D(uVelocity, vUv).xy;
        if (vL.x < 0.0) { L = -C.x; }
        if (vR.x > 1.0) { R = -C.x; }
        if (vT.y > 1.0) { T = -C.y; }
        if (vB.y < 0.0) { B = -C.y; }

        float div = 0.5 * (R - L + T - B);
        gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
    }
`);

const curlShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uVelocity;

    void main () {
        float L = texture2D(uVelocity, vL).y;
        float R = texture2D(uVelocity, vR).y;
        float T = texture2D(uVelocity, vT).x;
        float B = texture2D(uVelocity, vB).x;
        float vorticity = R - L - T + B;
        gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
    }
`);

const vorticityShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uVelocity;
    uniform sampler2D uCurl;
    uniform float curl;
    uniform float dt;

    void main () {
        float L = texture2D(uCurl, vL).x;
        float R = texture2D(uCurl, vR).x;
        float T = texture2D(uCurl, vT).x;
        float B = texture2D(uCurl, vB).x;
        float C = texture2D(uCurl, vUv).x;

        vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
        force /= length(force) + 0.0001;
        force *= curl * C;
        force.y *= -1.0;

        vec2 velocity = texture2D(uVelocity, vUv).xy;
        velocity += force * dt;
        velocity = min(max(velocity, -1000.0), 1000.0);
        gl_FragColor = vec4(velocity, 0.0, 1.0);
    }
`);

const pressureShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uDivergence;

    void main () {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        float C = texture2D(uPressure, vUv).x;
        float divergence = texture2D(uDivergence, vUv).x;
        float pressure = (L + R + B + T - divergence) * 0.25;
        gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
    }
`);

const gradientSubtractShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uVelocity;

    void main () {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        vec2 velocity = texture2D(uVelocity, vUv).xy;
        velocity.xy -= vec2(R - L, T - B);
        gl_FragColor = vec4(velocity, 0.0, 1.0);
    }
`);
const blit = (() => {
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    return (target, clear = false) => {
        if (target == null)
        {
            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }
        else
        {
            gl.viewport(0, 0, target.width, target.height);
            gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
        }
        if (clear)
        {
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }
        // CHECK_FRAMEBUFFER_STATUS();
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }
})();
function createFBO (w, h, internalFormat, format, type, param) {
    gl.activeTexture(gl.TEXTURE0);
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

    let fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT);

    let texelSizeX = 1.0 / w;
    let texelSizeY = 1.0 / h;

    return {
        texture,
        fbo,
        width: w,
        height: h,
        texelSizeX,
        texelSizeY,
        attach (id) {
            gl.activeTexture(gl.TEXTURE0 + id);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            return id;
        }
    };
}

function createDoubleFBO (w, h, internalFormat, format, type, param) {
    let fbo1 = createFBO(w, h, internalFormat, format, type, param);
    let fbo2 = createFBO(w, h, internalFormat, format, type, param);

    return {
        width: w,
        height: h,
        texelSizeX: fbo1.texelSizeX,
        texelSizeY: fbo1.texelSizeY,
        get read () {
            return fbo1;
        },
        set read (value) {
            fbo1 = value;
        },
        get write () {
            return fbo2;
        },
        set write (value) {
            fbo2 = value;
        },
        swap () {
            let temp = fbo1;
            fbo1 = fbo2;
            fbo2 = temp;
        }
    }
}
function step (dt) {
    gl.disable(gl.BLEND);

    curlProgram.bind();
    gl.uniform2f(curlProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0));
    blit(curl);

    vorticityProgram.bind();
    gl.uniform2f(vorticityProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read.attach(0));
    gl.uniform1i(vorticityProgram.uniforms.uCurl, curl.attach(1));
    gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL);
    gl.uniform1f(vorticityProgram.uniforms.dt, dt);
    blit(velocity.write);
    velocity.swap();

    divergenceProgram.bind();
    gl.uniform2f(divergenceProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.attach(0));
    blit(divergence);

    clearProgram.bind();
    gl.uniform1i(clearProgram.uniforms.uTexture, pressure.read.attach(0));
    gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE);
    blit(pressure.write);
    pressure.swap();

    pressureProgram.bind();
    gl.uniform2f(pressureProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));
    for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
        gl.uniform1i(pressureProgram.uniforms.uPressure, pressure.read.attach(1));
        blit(pressure.write);
        pressure.swap();
    }

    gradienSubtractProgram.bind();
    gl.uniform2f(gradienSubtractProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(gradienSubtractProgram.uniforms.uPressure, pressure.read.attach(0));
    gl.uniform1i(gradienSubtractProgram.uniforms.uVelocity, velocity.read.attach(1));
    blit(velocity.write);
    velocity.swap();

    advectionProgram.bind();
    gl.uniform2f(advectionProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    if (!ext.supportLinearFiltering)
        gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, velocity.texelSizeX, velocity.texelSizeY);
    let velocityId = velocity.read.attach(0);
    gl.uniform1i(advectionProgram.uniforms.uVelocity, velocityId);
    gl.uniform1i(advectionProgram.uniforms.uSource, velocityId);
    gl.uniform1f(advectionProgram.uniforms.dt, dt);
    gl.uniform1f(advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION);
    blit(velocity.write);
    velocity.swap();

    if (!ext.supportLinearFiltering)
        gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, dye.texelSizeX, dye.texelSizeY);
    gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0));
    gl.uniform1i(advectionProgram.uniforms.uSource, dye.read.attach(1));
    gl.uniform1f(advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION);
    blit(dye.write);
    dye.swap();
}

const displayShader=compileShader(gl.FRAGMENT_SHADER,`
    precision highp float;precision mediump sampler2D;
    varying vec2 vUv;varying vec2 vL;varying vec2 vR;varying vec2 vT;varying vec2 vB;uniform sampler2D uTexture;uniform sampler2D uMask;uniform sampler2D uColor;uniform float uEnv;uniform vec4 uRev;
    float dens(vec2 uv){vec3 c=texture2D(uTexture,uv).rgb;return max(c.r,max(c.g,c.b));}
    void main(){
      float d=clamp(dens(vUv)*2.4,0.0,1.0);
      // light and shade from the slope of the dye (like the original's SHADING): same red-orange of the sauce, darker and lighter streaks
      vec2 g=vec2(dens(vR)-dens(vL),dens(vT)-dens(vB))*26.0;
      float shade=clamp(1.0+g.x*-0.9+g.y*0.9,0.35,1.8);
      vec4 fm=texture2D(uMask,vUv);
      vec4 cc=texture2D(uColor,vUv);                         // colours of the food, carried and mixed by the stirring (red tomato + green pepper mix where they meet)
      vec3 food=cc.rgb/max(cc.a,0.05);
      vec3 base=min(food*mix(0.80,1.12,d),vec3(1.0));
      float m=smoothstep(0.12,0.55,fm.a);
      float a=smoothstep(0.01,0.22,d)*0.62*m*uEnv;      // only where the stirring really moved the dye: no hazy copy of the food over the food at the start
      // every stirring starts from the spoon and spreads slowly toward the rim (uRev = centre x, centre y, radius, aspect)
      float dist=length((vUv-uRev.xy)*vec2(uRev.w,1.0));
      a*=1.0-smoothstep(uRev.z-0.12,uRev.z,dist);
      gl_FragColor=vec4(base*shade*a,a);
    }
`);
const clearProgram=new Program(baseVertexShader,clearShader);
const splatProgram=new Program(baseVertexShader,splatShader);
const advectionProgram=new Program(baseVertexShader,advectionShader);
const divergenceProgram=new Program(baseVertexShader,divergenceShader);
const curlProgram=new Program(baseVertexShader,curlShader);
const vorticityProgram=new Program(baseVertexShader,vorticityShader);
const pressureProgram=new Program(baseVertexShader,pressureShader);
const gradienSubtractProgram=new Program(baseVertexShader,gradientSubtractShader);
const displayProgram=new Program(baseVertexShader,displayShader);
const copyShader=compileShader(gl.FRAGMENT_SHADER,`
    precision mediump float;precision mediump sampler2D;
    varying highp vec2 vUv;uniform sampler2D uTexture;
    void main(){gl_FragColor=texture2D(uTexture,vUv);}
`);
const copyProgram=new Program(baseVertexShader,copyShader);
let dye,velocity,divergence,curl,pressure,colDye;
function getResolution(r){let ar=canvas.width/canvas.height;if(ar<1)ar=1/ar;const min=Math.round(r),max=Math.round(r*ar);return canvas.width>canvas.height?{width:max,height:min}:{width:min,height:max};}
function initFramebuffers(){
  const simRes=getResolution(config.SIM_RESOLUTION),dyeRes=getResolution(config.DYE_RESOLUTION);
  const texType=ext.halfFloatTexType,rgba=ext.formatRGBA,rg=ext.formatRG,r=ext.formatR;
  const filtering=ext.supportLinearFiltering?gl.LINEAR:gl.NEAREST;
  gl.disable(gl.BLEND);
  dye=createDoubleFBO(dyeRes.width,dyeRes.height,rgba.internalFormat,rgba.format,texType,filtering);
  colDye=createDoubleFBO(dyeRes.width,dyeRes.height,rgba.internalFormat,rgba.format,texType,filtering);
  velocity=createDoubleFBO(simRes.width,simRes.height,rg.internalFormat,rg.format,texType,filtering);
  divergence=createFBO(simRes.width,simRes.height,r.internalFormat,r.format,texType,gl.NEAREST);
  curl=createFBO(simRes.width,simRes.height,r.internalFormat,r.format,texType,gl.NEAREST);
  pressure=createDoubleFBO(simRes.width,simRes.height,r.internalFormat,r.format,texType,gl.NEAREST);
}
function splat(x,y,dx,dy,color){
  splatProgram.bind();
  gl.uniform1i(splatProgram.uniforms.uTarget,velocity.read.attach(0));
  gl.uniform1f(splatProgram.uniforms.aspectRatio,canvas.width/canvas.height);
  gl.uniform2f(splatProgram.uniforms.point,x,y);
  gl.uniform3f(splatProgram.uniforms.color,dx,dy,0.0);
  const ar=canvas.width/canvas.height;
  gl.uniform1f(splatProgram.uniforms.radius,config.SPLAT_RADIUS/100.0*(ar>1?ar:1));
  blit(velocity.write);velocity.swap();
  gl.uniform1i(splatProgram.uniforms.uTarget,dye.read.attach(0));
  gl.uniform3f(splatProgram.uniforms.color,color.r,color.g,color.b);
  blit(dye.write);dye.swap();
}
let envV=1,revV=[.5,.5,3,1];
const maskTex=gl.createTexture();
function setMask(c){            // c: a canvas whose opaque part is where the food really is (the fluid shows only there); null = everywhere
  gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,maskTex);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
  if(c)gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);
  else gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([205,62,40,255]));
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
  gl.activeTexture(gl.TEXTURE0);
}
setMask(null);
function render(){
  gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.enable(gl.BLEND);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight);
  gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
  displayProgram.bind();
  gl.uniform2f(displayProgram.uniforms.texelSize,1/gl.drawingBufferWidth,1/gl.drawingBufferHeight);
  gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,maskTex);gl.uniform1i(displayProgram.uniforms.uMask,1);gl.uniform1f(displayProgram.uniforms.uEnv,envV);gl.uniform4f(displayProgram.uniforms.uRev,revV[0],revV[1],revV[2],revV[3]);gl.uniform1i(displayProgram.uniforms.uColor,colDye.read.attach(2));
  gl.uniform1i(displayProgram.uniforms.uTexture,dye.read.attach(0));
  blit(null);
}
function resize(w,h){canvas.width=w;canvas.height=h;initFramebuffers();}
initFramebuffers();
function clearAll(){[dye.read,dye.write,velocity.read,velocity.write].forEach(f=>{gl.bindFramebuffer(gl.FRAMEBUFFER,f.fbo);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);});}
function advectColor(dt){                       // the colours are carried by the same flow as the dye (no fading)
  advectionProgram.bind();
  gl.uniform2f(advectionProgram.uniforms.texelSize,velocity.texelSizeX,velocity.texelSizeY);
  if(!ext.supportLinearFiltering)gl.uniform2f(advectionProgram.uniforms.dyeTexelSize,colDye.texelSizeX,colDye.texelSizeY);
  gl.uniform1i(advectionProgram.uniforms.uVelocity,velocity.read.attach(0));
  gl.uniform1i(advectionProgram.uniforms.uSource,colDye.read.attach(1));
  gl.uniform1f(advectionProgram.uniforms.dt,dt);
  gl.uniform1f(advectionProgram.uniforms.dissipation,0.0);
  blit(colDye.write);colDye.swap();
}
function loadColors(){                          // hard copy: the colour layer = the food as it is now
  gl.disable(gl.BLEND);copyProgram.bind();
  gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,maskTex);gl.activeTexture(gl.TEXTURE0);
  gl.uniform1i(copyProgram.uniforms.uTexture,1);
  blit(colDye.write);colDye.swap();
}
function relaxColors(k){                        // the colour layer slowly goes back to the real food (k = how much per call)
  copyProgram.bind();
  gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,maskTex);gl.activeTexture(gl.TEXTURE0);
  gl.uniform1i(copyProgram.uniforms.uTexture,1);
  gl.enable(gl.BLEND);gl.blendColor(0,0,0,k);gl.blendFunc(gl.CONSTANT_ALPHA,gl.ONE_MINUS_CONSTANT_ALPHA);
  blit(colDye.read);
  gl.disable(gl.BLEND);
}
function setCalm(c){config.VELOCITY_DISSIPATION=1.5;config.DENSITY_DISSIPATION=c?0.05:0.7;}      // after the spoon is let go the swirl keeps turning and slowly dies down
return {splat,step:dt=>{step(dt);advectColor(dt);},render,resize,setMask,loadColors,relaxColors,clear:clearAll,setCalm,setEnv:v=>{envV=v;},setReveal:(cx,cy,r)=>{revV=[cx,cy,r,canvas.width/canvas.height];},force:config.SPLAT_FORCE};
}

// ---- the game side -----------------------------------------------------------------------------------------------------------------------------
// While the player stirs (game.js: stirring, stirVessel), a canvas lies over the food of that vessel (placed like the game's own .stir-ripples: directly in the vessel, at --vessel-food-left/top/width/height, the measured area of the food). The tip of the spoon = the pointer; every move of it puts speed and colour into the fluid (splat).
var cv=null,fl=null,failed=false,last=null,lastT=0,tint={r:.5,g:.5,b:.5};
function target(){
  try{return (typeof stirring!=='undefined'&&stirring&&stirVessel)?stirVessel:null;}catch(e){return null}
}
// The fluid must show only where the food really is (two pieces on the bottom of the pot = the fluid only there, not over the whole top of the pot).
// The food of a vessel is drawn on canvases (piece-sim-canvas ...) in its content layer, which has the same box as this canvas: their opaque part is the mask.
var revC=[.5,.5],mk=null,mx=null,lastMask=0,maskN=0,wasOn=false,seen=false;
function updateMask(host,now,force){
  if(!force&&now-lastMask<110)return;lastMask=now;
  if(!mk){mk=document.createElement('canvas');mk.width=160;mk.height=94;mx=mk.getContext('2d');}
  mx.setTransform(1,0,0,1,0,0);mx.clearRect(0,0,mk.width,mk.height);
  var cs=host.querySelectorAll('.vessel-content canvas,.pan-content canvas'),n=0;
  mx.filter=BELOW?'blur(5px)':'blur(1px)';
  for(var i=0;i<cs.length;i++){var c=cs[i];if(c===cv||!c.width||!c.height)continue;try{mx.drawImage(c,0,0,mk.width,mk.height);n++;}catch(e){}}
  mx.filter='none';
  // no food canvas found: if the content layer of the vessel is shown (there IS food, drawn some other way) the effect covers the whole food area, otherwise (empty vessel) nothing is shown
  var hasFood=false;try{var cl=host._vesselContent||host._panContent;hasFood=!!cl&&getComputedStyle(cl).display!=='none';}catch(e){}
  maskN=n||(hasFood?1:0);fl.setMask(n||!hasFood?mk:null);fl.relaxColors(stirringNow()?0.012:0.03);
}
function stirringNow(){try{return typeof stirring!=='undefined'&&!!stirring&&!!stirVessel;}catch(e){return false}}
var px=0,py=0;window.addEventListener('pointermove',function(e){px=e.clientX;py=e.clientY;},{passive:true});
var BELOW=/[?&]mesanjeispod/.test(location.search);      // the effect lies UNDER the food pieces (shows in the gaps and a little around them); toggle: CooksterStirBelow(true/false)
window.CooksterStirBelow=function(v){BELOW=!!v;if(cv)cv.dataset.z='';return BELOW;};
var env=0,hostKeep=null,prevOn=false,revR=3,REST=.3,dirAcc=0,dirSgn=1,swirlPhase=0,SPEED=1;       // SPEED: one knob, 1 = the same speed as the dish
function frame(t){
  requestAnimationFrame(frame);
  if(failed)return;
  var host=target(),dt=Math.min(.033,(t-lastT)/1000||.016);lastT=t;
  var on=!!host;if(on){hostKeep=host;seen=true;}
  // The first time the player stirs, the effect fades in from the food (0.5 s). When the spoon is let go it keeps turning slowly and sinks into the dish
  // (about 4 s) but stays above the food as a thin, transparent layer (REST) that mixes with it, until the vessel is emptied or taken away.
  var alive=!!hostKeep&&hostKeep.isConnected&&(on||maskN>0);
  var goal=on?1:(alive?REST:0);
  env=Math.max(0,Math.min(1,env+(env<goal?dt/.5:-dt/4.0)));
  if(env>goal&&!on)env=Math.max(goal,env);
  if(!on&&env<=.003&&!alive){
    if(cv&&cv.dataset.on==='1'){cv.dataset.on='0';cv.style.display='none';if(fl)fl.clear();}
    last=null;hostKeep=null;seen=false;wasOn=false;return;
  }
  var h0=host||hostKeep;if(!h0)return;
  if(!cv){cv=document.createElement('canvas');cv.style.cssText='position:absolute;left:var(--vessel-food-left,19.5%);top:var(--vessel-food-top,16.8%);width:var(--vessel-food-width,69.5%);height:var(--vessel-food-height,56.8%);pointer-events:none;z-index:9;border-radius:50%;clip-path:ellipse(50% 50% at 50% 50%);';cv.width=cv.height=256;}
  var fresh=false;
  if(cv.parentNode!==h0){h0.appendChild(cv);if(fl)fl.clear();fresh=true;}
  if(cv.dataset.on!=='1')fresh=true;
  cv.style.display='block';cv.dataset.on='1';
  try{var cEl=h0._vesselContent||h0._panContent,zc=cEl?(parseInt(getComputedStyle(cEl).zIndex,10)||5):5,zWant=String(BELOW?Math.max(0,zc-1):9);if(cv.style.zIndex!==zWant)cv.style.zIndex=zWant;cv.style.transform=BELOW?'translateY(2px)':'none';}catch(e){}
  var r=cv.getBoundingClientRect();if(r.width<8||r.height<8)return;
  if(!fl){fl=createFluid(cv);if(!fl){failed=true;return;}fresh=true;}
  var w=Math.max(64,Math.min(256,Math.round(r.width))),h=Math.max(64,Math.min(256,Math.round(r.height)));
  if(cv.width!==w||cv.height!==h){fl.resize(w,h);fresh=true;}
  if(fresh){updateMask(h0,t,true);fl.loadColors();}
  if(on&&!prevOn){        // a new stirring: start from zero again, from the spoon, as the first time
    fl.clear();updateMask(h0,t,true);fl.loadColors();revR=0;env=0;last=null;
  }
  prevOn=on;
  if(on)revR=Math.min(3,revR+dt*.9);        // spreads from the spoon to the rim in about a second and a half
  fl.setCalm(!on);fl.setEnv(Math.min(1,env*(BELOW?1.5:1)));
  (function(){var cx=(px-r.left)/r.width,cy=1-(py-r.top)/r.height;if(on)revC=[Math.max(0,Math.min(1,cx)),Math.max(0,Math.min(1,cy))];fl.setReveal(revC[0],revC[1],revR);})();
  // The speed is the speed of the DISH: the game turns the food with stirAngularVelocity (deg/s, it ramps up slowly while stirring and dies down after the spoon
  // is let go). The fluid is driven by the same number, so both start, turn and stop together. The mouse gives only the direction and a little local stirring.
  var om=0;try{om=(typeof stirAngularVelocity!=='undefined')?+stirAngularVelocity||0:0;}catch(e){}
  var sN=Math.min(1,Math.abs(om)/48);
  if(on){
    var x=(px-r.left)/r.width,y=1-(py-r.top)/r.height;
    if(last&&x>-.1&&x<1.1&&y>-.1&&y<1.1){
      var mdx=x-last.x,mdy=y-last.y;
      dirAcc=dirAcc*.9+((x-.5)*mdy-(y-.5)*mdx)*60;      // + = turning counter-clockwise (y up), - = clockwise
      if(sN>.02){var f=fl.force*.35*sN;if(mdx||mdy)fl.splat(x,y,mdx*f,mdy*f,tint);}
    }
    last={x:x,y:y};
  }else last=null;
  if(Math.abs(dirAcc)>.05)dirSgn=dirAcc>0?1:-1;
  if(sN>.02){
    var wrad=Math.abs(om)*Math.PI/180,K=8,rr=.27,add=wrad*rr*128*dt*1.5*SPEED;       // ring of pushes: the fluid goes round at the angular speed of the dish
    swirlPhase+=dt*wrad*dirSgn;
    for(var k=0;k<K;k++){
      var ang=swirlPhase+k*Math.PI*2/K,ca=Math.cos(ang),sa=Math.sin(ang);
      fl.splat(.5+rr*ca,.5+rr*sa,-sa*dirSgn*add,ca*dirSgn*add,{r:tint.r*.25*sN,g:tint.g*.25*sN,b:tint.b*.25*sN});
    }
  }
  updateMask(h0,t);
  fl.step(dt);fl.render();
}
requestAnimationFrame(frame);
window.CooksterStirSpeed=function(v){SPEED=+v||1;return SPEED;};
window.__sfDebug=function(){return {maskN:maskN,env:env,revR:revR,prevOn:prevOn,om:(typeof stirAngularVelocity!=="undefined"?stirAngularVelocity:null),stir:(typeof stirring!=="undefined"?stirring:null),keep:!!hostKeep,conn:!!(hostKeep&&hostKeep.isConnected),seen:seen,failed:failed};};
window.CooksterStirFluid={test:function(host){        // for testing: a canvas with a rotating splat in the given element
  var c=document.createElement('canvas');c.width=c.height=256;c.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;';host.appendChild(c);
  var f=createFluid(c);if(!f)return false;var a=0;
  (function loop(){a+=.18;f.splat(.5+.25*Math.cos(a),.5+.25*Math.sin(a),-Math.sin(a)*f.force*.04,Math.cos(a)*f.force*.04,tint);f.step(.016);f.render();requestAnimationFrame(loop);})();
  return true;}};
})();
