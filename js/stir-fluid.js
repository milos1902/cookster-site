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
function createFluid(canvas,opts){
const config={SIM_RESOLUTION:128,DYE_RESOLUTION:512,DENSITY_DISSIPATION:0.7,VELOCITY_DISSIPATION:0.25,PRESSURE:0.8,PRESSURE_ITERATIONS:20,CURL:30,SPLAT_RADIUS:0.42,SPLAT_FORCE:6000};
if(opts&&opts.config)Object.assign(config,opts.config);
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

const MAIN_SRC=`
    precision highp float;precision mediump sampler2D;
    varying vec2 vUv;varying vec2 vL;varying vec2 vR;varying vec2 vT;varying vec2 vB;uniform sampler2D uTexture;uniform sampler2D uMask;uniform sampler2D uColor;uniform float uEnv;uniform vec4 uRev;uniform vec2 uWave;
    float dens(vec2 uv){vec3 c=texture2D(uTexture,uv).rgb;return max(c.r,max(c.g,c.b));}
    void main(){
      // waves that climb a little up the walls: the picture is lifted at the rim, with a crest that turns together with the stirring (uWave = height, phase)
      vec2 qq=(vUv-vec2(0.5))*2.0;
      float rr=clamp(length(qq),0.0,1.0);
      float th=atan(qq.y,qq.x);
      vec2 off=vec2(0.0,-uWave.x*rr*rr*(0.5+0.5*sin(th-uWave.y)));
      float d=clamp(dens(vUv+off)*2.4,0.0,1.0);
      // light and shade from the slope of the dye (like the original's SHADING): same red-orange of the sauce, darker and lighter streaks
      vec2 g=vec2(dens(vR+off)-dens(vL+off),dens(vT+off)-dens(vB+off))*26.0;
      float shade=clamp(1.0+g.x*-0.9+g.y*0.9,0.88,1.6);
      vec4 fm=texture2D(uMask,vUv+off);
      vec4 cc=texture2D(uColor,vUv+off);                         // colours of the food, carried and mixed by the stirring (red tomato + green pepper mix where they meet)
      vec3 food=cc.rgb/max(cc.a,0.05);
      vec3 base=min(food*mix(0.95,1.1,d),vec3(1.0));
      float m=smoothstep(0.12,0.55,fm.a);
      float a=smoothstep(0.01,0.22,d)*0.62*m*uEnv;      // only where the stirring really moved the dye: no hazy copy of the food over the food at the start
      // every stirring starts from the spoon and spreads slowly toward the rim (uRev = centre x, centre y, radius, aspect)
      float dist=length((vUv-uRev.xy)*vec2(uRev.w,1.0));
      a*=1.0-smoothstep(uRev.z-0.12,uRev.z,dist);
      gl_FragColor=vec4(base*shade*a,a);
    }
`;
const STEAM_SRC=`
    precision highp float;precision mediump sampler2D;
    varying vec2 vUv;varying vec2 vL;varying vec2 vR;varying vec2 vT;varying vec2 vB;uniform sampler2D uTexture;uniform float uEnv;uniform vec2 uWave;
    float dens(vec2 uv){vec3 c=texture2D(uTexture,uv).rgb;return max(c.r,max(c.g,c.b));}
    void main(){
      // the higher it goes the wider and softer it gets: more taps spread sideways with the height (thin at the food, wide and airy above)
      float sp=0.004+0.07*vUv.y;
      float d=0.0;
      for(int i=-4;i<=4;i++){float k=float(i)/4.0;d+=dens(vUv+vec2(k*sp,0.0))*(1.0-0.55*abs(k));}
      d=clamp(d/5.2*2.6,0.0,1.0);
      float lit=0.92+0.1*sin(vUv.y*14.0+d*5.0);
      float edge=smoothstep(0.0,0.14,vUv.x)*smoothstep(1.0,0.86,vUv.x)*smoothstep(1.0,0.4,vUv.y)*smoothstep(0.03,0.30,vUv.y);      // soft at the sides, at the top and at the bottom: it grows out of the food, no cut line
      float a=smoothstep(0.03,0.6,d)*0.6*edge*uEnv*(1.0-0.45*vUv.y);
      vec3 col=mix(vec3(0.80,0.80,0.83),vec3(0.97),lit*0.7);
      col*=mix(1.0,0.42,uWave.x);
      gl_FragColor=vec4(col*a,a);
    }`;
const LAND_SRC=`
    precision highp float;precision mediump sampler2D;
    varying vec2 vUv;varying vec2 vL;varying vec2 vR;varying vec2 vT;varying vec2 vB;uniform sampler2D uTexture;uniform float uEnv;uniform vec2 uWave;
    float dens(vec2 uv){vec3 c=texture2D(uTexture,uv).rgb;return max(c.r,max(c.g,c.b));}
    void main(){
      float d=clamp(dens(vUv)*2.4,0.0,1.0);
      vec2 g=vec2(dens(vR)-dens(vL),dens(vT)-dens(vB))*8.0;
      float lit=clamp(0.93+g.x*-0.2+g.y*0.25,0.75,1.1);
      float a=smoothstep(0.02,0.5,d)*0.55*uEnv;
      vec3 col=vec3(0.90,0.88,0.84)*lit;
      gl_FragColor=vec4(col*a,a);
    }
`;
const displayShader=compileShader(gl.FRAGMENT_SHADER,(opts&&opts.flat)?LAND_SRC:((opts&&opts.steam)?STEAM_SRC:MAIN_SRC));
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
let envV=1,revV=[.5,.5,3,1],waveV=[0,0];
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
  gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,maskTex);gl.uniform1i(displayProgram.uniforms.uMask,1);gl.uniform1f(displayProgram.uniforms.uEnv,envV);gl.uniform4f(displayProgram.uniforms.uRev,revV[0],revV[1],revV[2],revV[3]);gl.uniform2f(displayProgram.uniforms.uWave,waveV[0],waveV[1]);gl.uniform1i(displayProgram.uniforms.uColor,colDye.read.attach(2));
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
function setCalm(c,sim){config.VELOCITY_DISSIPATION=1.5;config.DENSITY_DISSIPATION=sim?1.3:(c?0.05:0.7);}      // after the spoon is let go the swirl keeps turning and slowly dies down
return {splat,step:dt=>{step(dt);advectColor(dt);},render,resize,setMask,loadColors,relaxColors,clear:clearAll,setCalm,setEnv:v=>{envV=v;},setWave:(a,ph)=>{waveV=[a,ph];},setReveal:(cx,cy,r)=>{revV=[cx,cy,r,canvas.width/canvas.height];},force:config.SPLAT_FORCE};
}

// ---- the game side -----------------------------------------------------------------------------------------------------------------------------
// One layer (a canvas + its own fluid) per vessel that needs the effect: the vessel that is being stirred, and the vessels that simmer (heating, with the bar of the doneness
// at the halfway point or more). The canvas lies over the food of the vessel (placed like the game's own .stir-ripples, directly in the vessel, at the measured area of the food, or at
// the area drawn in the tool "Deo gde se hrana vidi pri mešanju i njihanju"). While stirring: the tip of the spoon and the angular speed of the dish drive the fluid;
// while simmering: bubbles burst here and there and send rings through the food (instead of the white dots of the old css).
var tint={r:.5,g:.5,b:.5},failed=false,lastT=0,SPEED=1,REST=.3,SIM=.6,MAXL=3;
var BELOW=/[?&]mesanjeispod/.test(location.search);      // the effect lies UNDER the food pieces; toggle: CooksterStirBelow(true/false)
window.CooksterStirBelow=function(v){BELOW=!!v;return BELOW;};
window.CooksterStirSpeed=function(v){SPEED=+v||1;return SPEED;};
var px=0,py=0;window.addEventListener('pointermove',function(e){px=e.clientX;py=e.clientY;},{passive:true});
function stirringNow(){try{return typeof stirring!=='undefined'&&!!stirring&&!!stirVessel;}catch(e){return false}}
function stirVesselNow(){try{return stirringNow()?stirVessel:null;}catch(e){return null}}
function angSpeed(){try{return (typeof stirAngularVelocity!=='undefined')?+stirAngularVelocity||0:0;}catch(e){return 0}}
// the vessels that simmer: heating (class sizzling), with food, the doneness at the halfway point or more (the bar), not burnt
var simList=[],steamList=[],simAt=0;
function scanSim(now){
  if(now-simAt<300)return;simAt=now;
  var out=[],sm=[];
  try{
    (window.items||items).forEach(function(v){
      if(!v||!v.classList||!v.isConnected)return;
      if(!(v._vesselContent||v._panContent))return;
      var sz=v.classList.contains('sizzling');
      var m=CooksterPan.read(v),n=Object.keys((m&&m.ingredients)||{}).length;if(!n)return;
      var heat=+m.heat||0;if(!sz&&heat<=.1)return;
      var st=(window.CooksterFoodStateMachine&&CooksterFoodStateMachine.vesselState(m))||{progress:+m.doneness||0};
      var p=Math.max(0,Math.min(1,+st.progress||0)),ph=(st.phase&&st.phase.id)||'',burnt=ph==='burnt'||!!m.burnt;
      if(sz&&p>=.5&&!burnt)out.push({v:v,p:p});
      if(p>=.12)sm.push({v:v,s:burnt?1:Math.max(.3,Math.min(1,(p-.12)/.5)),grey:burnt||ph==='browned'?(burnt?1:.5):0});      // the steam of the game: from 12% of the bar, also while the pan cools
    });
  }catch(e){}
  simList=out;steamList=sm;
}
function simOf(v){for(var i=0;i<simList.length;i++)if(simList[i].v===v)return simList[i].p;return 0;}
var layers=[];
function Layer(){
  var L={host:null,cv:null,fl:null,last:null,env:0,prevOn:false,revR:3,revC:[.5,.5],dirAcc:0,dirSgn:1,swirlPhase:0,maskN:0,lastMask:0,mk:null,mx:null,areaKey:'',curArea:null,bub:0,mode:'rest'};
  L.updateMask=function(host,now,force){
    if(!force&&now-L.lastMask<110)return;L.lastMask=now;
    if(!L.mk){L.mk=document.createElement('canvas');L.mk.width=160;L.mk.height=94;L.mx=L.mk.getContext('2d');}
    var mk=L.mk,mx=L.mx,cv=L.cv;
    mx.setTransform(1,0,0,1,0,0);mx.clearRect(0,0,mk.width,mk.height);
    var cs=host.querySelectorAll('.vessel-content canvas,.pan-content canvas'),n=0;
    mx.filter=BELOW?'blur(5px)':'blur(1px)';
    var cr=cv.getBoundingClientRect(),cEl=host._vesselContent||host._panContent,fr=cEl?cEl.getBoundingClientRect():null,dx0=0,dy0=0,dw=mk.width,dh=mk.height;
    if(fr&&fr.width>2&&fr.height>2&&cr.width>2&&cr.height>2){dx0=(fr.left-cr.left)/cr.width*mk.width;dy0=(fr.top-cr.top)/cr.height*mk.height;dw=fr.width/cr.width*mk.width;dh=fr.height/cr.height*mk.height;}
    for(var i=0;i<cs.length;i++){var c=cs[i];if(c===cv||!c.width||!c.height)continue;try{mx.drawImage(c,dx0,dy0,dw,dh);n++;}catch(e){}}
    mx.filter='none';
    // no food canvas found: if the content layer of the vessel is shown (there IS food, drawn some other way) the effect covers the whole food area, otherwise (empty vessel) nothing is shown
    var hasFood=false;try{var cl=host._vesselContent||host._panContent;hasFood=!!cl&&getComputedStyle(cl).display!=='none';}catch(e){}
    L.maskN=n||(hasFood?1:0);L.fl.setMask(n||!hasFood?mk:null);L.fl.relaxColors(L.mode==='stir'?0.012:0.03);
  };
  L.applyArea=function(h0){
    var cv=L.cv,a=null;try{a=window.CooksterVesselFoodCalibration&&CooksterVesselFoodCalibration.stirArea&&CooksterVesselFoodCalibration.stirArea(h0);}catch(e){}
    var key=a?JSON.stringify(a):'';
    if(key===L.areaKey)return;L.areaKey=key;L.curArea=a;
    if(a){var b=a.box;cv.style.left=b.left+'%';cv.style.top=b.top+'%';cv.style.width=b.width+'%';cv.style.height=b.height+'%';cv.style.clipPath='polygon('+a.poly.map(function(q){return q[0]+'% '+q[1]+'%';}).join(',')+')';cv.style.borderRadius='0';}
    else{cv.style.left='var(--vessel-food-left,19.5%)';cv.style.top='var(--vessel-food-top,16.8%)';cv.style.width='var(--vessel-food-width,69.5%)';cv.style.height='var(--vessel-food-height,56.8%)';cv.style.clipPath='ellipse(50% 50% at 50% 50%)';cv.style.borderRadius='50%';}
  };
  L.hide=function(){if(L.cv&&L.cv.dataset.on==='1'){L.cv.dataset.on='0';L.cv.style.display='none';if(L.fl)L.fl.clear();}L.last=null;L.prevOn=false;};
  // a bubble bursts: a bright ring spreads from the place (a push outward + a little dye), the food moves a little
  L.bubble=function(s){
    var fl=L.fl,ang=Math.random()*Math.PI*2,rad=Math.sqrt(Math.random())*.36;
    var x=.5+Math.cos(ang)*rad,y=.5+Math.sin(ang)*rad*.9,K=7,r0=.03,f=(14+16*Math.random())*s;
    for(var k=0;k<K;k++){var a=k*Math.PI*2/K,ca=Math.cos(a),sa=Math.sin(a);fl.splat(x+ca*r0,y+sa*r0,ca*f,sa*f,{r:.14*s,g:.14*s,b:.14*s});}
    fl.splat(x,y,0,0,{r:.12*s,g:.12*s,b:.12*s});
  };
  // mode: 'stir' (the spoon), 'simmer' (bubbles), 'rest' (what is left after the stirring)
  L.update=function(host,t,dt,mode,simP){
    var on=mode==='stir',alive=host&&host.isConnected&&(on||mode==='simmer'||L.maskN>0);
    L.mode=mode;L.host=host;
    var goal=on?1:(mode==='simmer'?SIM:(alive?REST:0));
    L.env=Math.max(0,Math.min(1,L.env+(L.env<goal?dt/(mode==='simmer'?1.6:.5):-dt/4.0)));
    if(L.env>goal&&!on)L.env=Math.max(goal,L.env);
    if(!on&&L.env<=.003&&!alive){L.hide();return false;}
    if(!host)return false;
    var cv=L.cv;
    if(!cv){cv=L.cv=document.createElement('canvas');cv.style.cssText='position:absolute;left:var(--vessel-food-left,19.5%);top:var(--vessel-food-top,16.8%);width:var(--vessel-food-width,69.5%);height:var(--vessel-food-height,56.8%);pointer-events:none;z-index:9;border-radius:50%;clip-path:ellipse(50% 50% at 50% 50%);';cv.width=cv.height=256;}
    var fresh=false;
    if(cv.parentNode!==host){host.appendChild(cv);if(L.fl)L.fl.clear();fresh=true;}
    if(cv.dataset.on!=='1')fresh=true;
    cv.style.display='block';cv.dataset.on='1';L.applyArea(host);
    try{var cEl=host._vesselContent||host._panContent,zc=cEl?(parseInt(getComputedStyle(cEl).zIndex,10)||5):5,zWant=String(BELOW?Math.max(0,zc-1):9);if(cv.style.zIndex!==zWant)cv.style.zIndex=zWant;cv.style.transform=BELOW?'translateY(2px)':'none';}catch(e){}
    var r=cv.getBoundingClientRect();if(r.width<8||r.height<8)return false;
    if(!L.fl){L.fl=createFluid(cv);if(!L.fl){failed=true;return false;}fresh=true;}
    var fl=L.fl,w=Math.max(64,Math.min(256,Math.round(r.width))),h=Math.max(64,Math.min(256,Math.round(r.height)));
    if(cv.width!==w||cv.height!==h){fl.resize(w,h);fresh=true;}
    if(fresh){L.updateMask(host,t,true);fl.loadColors();}
    var om=angSpeed(),sN=Math.min(1,Math.abs(om)/48),sNs=on?sN:0;
    if(on&&!L.prevOn){fl.clear();L.updateMask(host,t,true);fl.loadColors();L.revR=0;L.env=0;L.last=null;}       // a new stirring: start from zero again, from the spoon
    L.prevOn=on;
    if(on)L.revR=Math.min(3,L.revR+dt*.9);else if(mode==='simmer')L.revR=3;
    fl.setCalm(!on,mode==='simmer');fl.setEnv(Math.min(1,L.env*(BELOW?1.5:1)));fl.setWave((L.curArea?.10:.035)*sNs*L.env,L.swirlPhase);
    (function(){var cx=(px-r.left)/r.width,cy=1-(py-r.top)/r.height;if(on)L.revC=[Math.max(0,Math.min(1,cx)),Math.max(0,Math.min(1,cy))];fl.setReveal(L.revC[0],L.revC[1],L.revR);})();
    if(on){
      var x=(px-r.left)/r.width,y=1-(py-r.top)/r.height;
      if(L.last&&x>-.1&&x<1.1&&y>-.1&&y<1.1){
        var mdx=x-L.last.x,mdy=y-L.last.y;
        L.dirAcc=L.dirAcc*.9+((x-.5)*mdy-(y-.5)*mdx)*60;      // + = counter-clockwise (y up)
        if(sN>.02){var f=fl.force*.35*sN;if(mdx||mdy)fl.splat(x,y,mdx*f,mdy*f,tint);}
      }
      L.last={x:x,y:y};
    }else L.last=null;
    if(Math.abs(L.dirAcc)>.05)L.dirSgn=L.dirAcc>0?1:-1;
    // the fluid goes round at the angular speed of the dish (the number of the game), so both start, turn and stop together
    var sw=on||sN>.02?sN:0;
    if(sw>.02){
      var wrad=Math.abs(om)*Math.PI/180,K=8,rr=.27,add=wrad*rr*128*dt*1.5*SPEED;
      L.swirlPhase+=dt*wrad*L.dirSgn;
      for(var k=0;k<K;k++){var ang=L.swirlPhase+k*Math.PI*2/K,ca=Math.cos(ang),sa=Math.sin(ang);fl.splat(.5+rr*ca,.5+rr*sa,-sa*L.dirSgn*add,ca*L.dirSgn*add,{r:tint.r*.25*sw,g:tint.g*.25*sw,b:tint.b*.25*sw});}
    }
    // simmering: bubbles burst here and there, more often and stronger the more done the food is
    if(false){
      var s=.45+.55*Math.max(0,Math.min(1,(simP-.5)*2));
      L.bub+=dt*(2.2+4.5*s);
      while(L.bub>=1){L.bub-=1;L.bubble(s);}
    }
    L.updateMask(host,t);
    fl.step(dt);fl.render();
    return true;
  };
  return L;
}
// STEAM from the vessel (it replaces the white smoke of the old css, .pan-smoke): a column of white curls rises from the opening of the vessel and fades
var steams=[];
function Steam(){
  var S={key:null,cv:null,bc:null,bx:null,fl:null,env:0,ph:Math.random()*10,parts:[],acc:0,t0:0};
  S.hide=function(){if(S.cv&&S.cv.dataset.on==='1'){S.cv.dataset.on='0';S.cv.style.display='none';if(S.bc)S.bc.style.display='none';if(S.fl)S.fl.clear();S.parts=[];}};
  S.update=function(host,t,dt,s,grey,simP){
    var on=s>0;
    S.env=Math.max(0,Math.min(1,S.env+(on?dt/7:-dt/2.5)));
    if(!on&&S.env<=.003){S.hide();return false;}
    if(!host||!host.isConnected)return false;
    var cv=S.cv,box='left:calc(var(--vessel-food-left,19.5%) - 12%);top:calc(var(--vessel-food-top,16.8%) - 215%);width:calc(var(--vessel-food-width,69.5%) + 24%);height:250%;pointer-events:none;';
    if(!cv){
      cv=S.cv=document.createElement('canvas');cv.style.cssText='position:absolute;'+box+'z-index:14;';cv.width=96;cv.height=240;
      S.bc=document.createElement('canvas');S.bc.style.cssText='position:absolute;'+box+'z-index:15;';S.bc.width=120;S.bc.height=300;S.bx=S.bc.getContext('2d');
    }
    if(cv.parentNode!==host){host.appendChild(cv);host.appendChild(S.bc);if(S.fl)S.fl.clear();S.parts=[];}
    cv.style.display='block';S.bc.style.display='block';cv.dataset.on='1';
    var r=cv.getBoundingClientRect();if(r.width<8||r.height<8)return false;
    if(!S.fl){S.fl=createFluid(cv,{steam:true,config:{SIM_RESOLUTION:64,DYE_RESOLUTION:256,DENSITY_DISSIPATION:0.2,VELOCITY_DISSIPATION:0.15,CURL:14,SPLAT_RADIUS:0.03}});if(!S.fl){failed=true;return false;}}
    var fl=S.fl,w=Math.max(48,Math.min(110,Math.round(r.width))),h=Math.max(96,Math.min(260,Math.round(r.height)));
    if(cv.width!==w||cv.height!==h)fl.resize(w,h);
    fl.setCalm(false,false);fl.setEnv(S.env);fl.setWave(grey,0);
    if(on){
      // two thin plumes leave the food and go up without stopping: a new puff is sent before the one before has died away
      var tt=t/1000+S.ph;
      for(var k=0;k<2;k++){
        var bx=k?.62:.38,x=bx+Math.sin(tt*.9+k*2.1)*.035,y=.12;
        var sway=Math.sin(tt*1.3+k*3.0+x*6)*2.2;
        fl.splat(x,y,sway,(30+10*Math.random())*(.55+.45*s),{r:.15*s,g:.15*s,b:.15*s});
        for(var hh=.26;hh<.95;hh+=.14)fl.splat(x+Math.sin(tt*.7+hh*5+k)*.05,hh,sway*.5,22*(.55+.45*s),{r:0,g:0,b:0});      // the warm air keeps pulling it up along the whole way (it does not stop)
      }
    }
    fl.step(dt);fl.render();
    // bubbles: small round balloons come out of the food, go up and keep going in the air until they fade away (no bursting inside the food)
    var bc=S.bc,bx2=S.bx,rw=r.width,rh=r.height;
    var bw=Math.max(60,Math.min(160,Math.round(rw))),bh=Math.max(150,Math.min(380,Math.round(rh)));
    if(bc.width!==bw||bc.height!==bh){bc.width=bw;bc.height=bh;}
    if(simP>0){S.acc+=dt*(1.2+3.2*Math.max(0,Math.min(1,(simP-.5)*2)));while(S.acc>=1){S.acc-=1;if(S.parts.length<24)S.parts.push({x:.30+Math.random()*.40,y:.02,r:2+Math.random()*3.2,vy:.07+Math.random()*.06,ph:Math.random()*6.28,age:0});}}
    bx2.clearRect(0,0,bc.width,bc.height);
    for(var i=S.parts.length-1;i>=0;i--){
      var q=S.parts[i];q.age+=dt;q.y+=q.vy*dt*(1+q.y*1.2);q.x+=Math.sin(q.age*2.2+q.ph)*.0025;
      if(q.y>.92){S.parts.splice(i,1);continue;}
      var al=Math.min(1,q.age/.5)*(1-q.y/.92)*.85,px_=q.x*bc.width,py_=bc.height-q.y*bc.height,rr=q.r*(1+q.y*.9)*(bc.width/110);
      var g=bx2.createRadialGradient(px_-rr*.3,py_-rr*.35,rr*.1,px_,py_,rr);
      g.addColorStop(0,'rgba(255,255,255,'+(al*.9)+')');g.addColorStop(.55,'rgba(255,255,255,'+(al*.22)+')');g.addColorStop(1,'rgba(255,255,255,'+(al*.55)+')');
      bx2.fillStyle=g;bx2.beginPath();bx2.arc(px_,py_,rr,0,6.2832);bx2.fill();
    }
    return true;
  };
  return S;
}
function steamFor(v){for(var i=0;i<steams.length;i++)if(steams[i].key===v)return steams[i];return null;}
function layerFor(v){for(var i=0;i<layers.length;i++)if(layers[i].host===v||layers[i].key===v)return layers[i];return null;}
function frame(t){
  requestAnimationFrame(frame);
  if(failed)return;
  var dt=Math.min(.033,(t-lastT)/1000||.016);lastT=t;
  scanSim(t);
  var sv=stirVesselNow(),want=[];
  if(sv)want.push({v:sv,mode:'stir',p:simOf(sv)});
  // layers of the vessels that are not wanted any more: they sink (rest) until they fade away; gone vessels are dropped
  layers=layers.filter(function(L){return !(L.key&&!L.key.isConnected&&(!L.cv||L.cv.dataset.on!=='1'));});
  want.forEach(function(w){var L=layerFor(w.v);if(!L){if(layers.length>=MAXL+1)return;L=Layer();L.key=w.v;layers.push(L);}L.want=w;});
  layers.forEach(function(L){
    var w=L.want;L.want=null;
    if(w)L.update(w.v,t,dt,w.mode,w.p);
    else L.update(L.key,t,dt,'rest',0);
  });
  // steam: the vessels that smoke (the bar of the doneness is past 12%, heating); the others fade
  steams=steams.filter(function(S){return !(S.key&&!S.key.isConnected&&(!S.cv||S.cv.dataset.on!=='1'));});
  var sw=steamList.slice(0,MAXL);
  sw.forEach(function(o){var S=steamFor(o.v);if(!S){if(steams.length>=MAXL+1)return;S=Steam();S.key=o.v;steams.push(S);}S.want=o;});
  steams.forEach(function(S){var o=S.want;S.want=null;if(o)S.update(S.key,t,dt,o.s,o.grey,simOf(S.key));else S.update(S.key,t,dt,0,0,0);});
  document.documentElement.dataset.sfLayers=String(layers.length);
}
requestAnimationFrame(frame);
window.__sfDebug=function(){return {steams:steams.map(function(S){return +S.env.toFixed(2);}),steamN:steamList.length,layers:layers.map(function(L){return {mode:L.mode,env:+L.env.toFixed(2),maskN:L.maskN,hasFl:!!L.fl};}),sim:simList.length,failed:failed};};
window.CooksterStirFluid={test:function(host){        // for testing: a canvas with a rotating splat in the given element
  var c=document.createElement('canvas');c.width=c.height=256;c.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;';host.appendChild(c);
  var f=createFluid(c);if(!f)return false;var a=0;
  (function loop(){a+=.18;f.splat(.5+.25*Math.cos(a),.5+.25*Math.sin(a),-Math.sin(a)*f.force*.04,Math.cos(a)*f.force*.04,tint);f.step(.016);f.render();requestAnimationFrame(loop);})();
  return true;}};
// ---- the puff of dust when a thing lands on the table: smoke made by the fluid, thrown out to the left and to the right of the thing and drifting away in the air ----
var LP={cv:null,fl:null,on:false,idle:0,last:0,fails:false};
function landLoop(t){
  if(!LP.on)return;
  requestAnimationFrame(landLoop);
  var dt=Math.min(.033,(t-LP.last)/1000||.016);LP.last=t;
  LP.fl.setEnv(1);LP.fl.step(dt);LP.fl.render();
  LP.idle+=dt;
  if(LP.idle>3.2){LP.on=false;LP.cv.style.display='none';LP.fl.clear();}
}
window.CooksterLandPuff=function(cx,by,vis,opacity){
  if(failed||LP.fails||/[?&]bezmesanja/.test(location.search))return false;
  var sc=document.getElementById('scene');if(!sc)return false;
  if(!LP.cv){
    LP.cv=document.createElement('canvas');LP.cv.width=420;LP.cv.height=236;
    LP.cv.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:9996;display:none';
    sc.appendChild(LP.cv);
    LP.fl=createFluid(LP.cv,{flat:true,config:{SIM_RESOLUTION:128,DYE_RESOLUTION:420,DENSITY_DISSIPATION:0.55,VELOCITY_DISSIPATION:0.9,CURL:22,SPLAT_RADIUS:0.05}});
    if(!LP.fl){LP.fails=true;return false;}
  }
  if(LP.cv.parentNode!==sc)sc.appendChild(LP.cv);
  LP.cv.style.display='block';
  var v=Math.max(.5,Math.min(1.3,vis||1)),x0=cx/1672,y0=1-(by-2)/941,half=(55+30*v)/1672;
  for(var side=-1;side<=1;side+=2){
    for(var i=0;i<4;i++){
      var x=x0+side*(half+i*.004+Math.random()*.004),y=y0+(Math.random()-.3)*.012;
      LP.fl.splat(x,y,side*(55+45*Math.random())*v,(6+14*Math.random()),{r:.45*opacity,g:.45*opacity,b:.45*opacity});
    }
  }
  LP.idle=0;
  if(!LP.on){LP.on=true;LP.last=performance.now();requestAnimationFrame(landLoop);}
  return true;
};
// the white dots and the little bubbles of the old css are not shown any more: the fluid does it (only when the fluid can work: WebGL)
(function(){
  var ok=false;try{var c=document.createElement('canvas');ok=!!(c.getContext('webgl2')||c.getContext('webgl'));}catch(e){}
  if(!ok)return;
  var st=document.createElement('style');
  st.textContent='body.sf-on .item.sizzling .pan-content.visible::after,body.sf-on .item.sizzling .vessel-content.visible::after,body.sf-on .item.sizzling.stirring-vessel .vessel-content.visible::before,body.sf-on .item.sizzling.stirring-vessel .pan-content.visible::before{content:none!important;background:none!important}body.sf-on .stir-bubbles,body.sf-on .pan-smoke{display:none!important}';
  document.head.appendChild(st);document.body.classList.add('sf-on');
})();
})();
