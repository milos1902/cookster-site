/* Cookster: the window of the kitchen opens with a click. By day a short clip plays (assets/effects/prozor_zeleni.webm/.mp4, made in Higgsfield on a GREEN screen: only the window strip is a real picture, the floor is flat green):
   the sash swings open, pushes the flowerpot off the sill, it falls (this part is sped up) and breaks (soil, shards, petals) and the mess is gone after a few seconds.
   The green is cut out in the browser (a WebGL shader, the canvas #windowOpenClip), so the shards lie over the LIVE kitchen and get its light and shadows. The clip then fades out into the still picture of the open window.
   Closing the window brings the flowerpot back (it is a part of the kitchen picture).
   assets/effects/prozor_otvoren.webp is a piece of the picture with the window wide open, laid over the kitchen only around the window (the rest of the scene is untouched).
   At night the window is shown closed (the night picture of js/day-light.js has no open version), so the piece fades with the "night" value of the clock. */
(function(){
if(window.CooksterWindow)return;
var KEY='cooksterWindowOpen',W=176,H=440,open=false,anim=null,box=null,inner=null,hot=null,lvl=open?1:0,vid=null,cv=null,gl=null,tex=null,prog=null,vidT=0,playing=false,broke=false,CLIP_W=706,CLIP_H=941,BREAK_AT=1.27,CLIP_RATE=1.2,FADE_AT=2.2,FADE_END=3.0;      // the clip covers the part of the scene (0,0)-(706,941), BREAK_AT = the second of the clip when the pot hits the floor
try{localStorage.setItem(KEY,'0');}catch(e){}      // the window is always closed when the game starts (the choice is no longer remembered between visits)
function build(){
  var sc=document.getElementById('scene');if(!sc)return false;
  if(box&&box.parentNode===sc)return true;
  box=document.createElement('div');box.id='windowOpen';
  box.style.cssText='position:absolute;left:0;top:0;width:'+W+'px;height:'+H+'px;pointer-events:none;z-index:1;transform-origin:0 40%;will-change:transform,opacity;opacity:'+(open?1:0);
  inner=document.createElement('div');inner.style.cssText='position:absolute;inset:0;background:url(assets/effects/prozor_otvoren.webp?v=4) 0 0/100% 100% no-repeat';
  box.appendChild(inner);
  sc.appendChild(box);
  vid=document.createElement('video');vid.muted=true;vid.playsInline=true;vid.preload='auto';vid.setAttribute('playsinline','');
  [['assets/effects/prozor_zeleni.webm?v=4','video/webm'],['assets/effects/prozor_zeleni.mp4?v=4','video/mp4']].forEach(function(x){var so=document.createElement('source');so.src=x[0];so.type=x[1];vid.appendChild(so);});
  vid.addEventListener('ended',endClip);
  cv=document.createElement('canvas');cv.id='windowOpenClip';cv.width=1080;cv.height=1440;
  cv.style.cssText='position:absolute;left:0;top:0;width:'+CLIP_W+'px;height:'+CLIP_H+'px;pointer-events:none;z-index:70000;opacity:0;-webkit-mask-image:url(assets/effects/prozor_maska.png?v=6);mask-image:url(assets/effects/prozor_maska.png?v=6);-webkit-mask-size:100% 100%;mask-size:100% 100%';      // above the things on the floor (the barrel), under the chandelier and the dark of the room; the mask (drawn by the player) lets through only the window part and the floor: the wall, the table and the cupboard hide the shards
  sc.appendChild(cv);initGL();

  hot=document.createElement('div');hot.id='windowHot';hot.title='Otvori / zatvori prozor';
  hot.dataset.soundTarget='windowHot';hot.dataset.soundActions='open,close,break';hot.dataset.label='Prozor';
  hot.style.cssText='position:absolute;left:0;top:0;width:112px;height:300px;z-index:6;cursor:pointer;clip-path:polygon(0 0,100% 0,100% 62%,60% 100%,0 100%)';
  hot.addEventListener('click',function(e){e.stopPropagation();toggle();});
  sc.appendChild(hot);return true;
}
/* the green screen: alpha from how green a pixel is (g much bigger than r and b), the green fringe on the edges is removed */
function initGL(){
  try{
    gl=cv.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false});if(!gl){gl=null;return;}
    var vs='attribute vec2 p;varying vec2 uv;void main(){uv=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}',
        fs='precision mediump float;varying vec2 uv;uniform sampler2D t;uniform float post;uniform vec2 px;'+
        'float keyA(vec4 c,vec2 q){float m=max(c.r,c.b);float k=c.g-m;if(q.x<.2&&q.y<.68)return 1.-smoothstep(.45,.70,k);return 1.-smoothstep(post>.5?.12:.20,post>.5?.40:.50,k);}'+
        'void main(){vec4 c=texture2D(t,uv);float a=keyA(c,uv);float mn=a;'+
        'for(int i=-1;i<=1;i++){for(int j=-1;j<=1;j++){vec2 q=uv+vec2(float(i),float(j))*px;mn=min(mn,keyA(texture2D(t,q),q));}}'+      // the pixel next to a see-through one is the fringe of the green: it is eaten (about 1 px) and its green is taken out
        'float m=max(c.r,c.b);float k=c.g-m;float e=1.-mn;'+
        'if(!(uv.x<.2&&uv.y<.68)){float spill=smoothstep(.0,.14,k);c.g=mix(c.g,min(c.g,m),spill);if(post>.5){float s2=smoothstep(-.22,.02,k);c.g=mix(c.g,min(c.g,.5*m),s2);}}'+
        'c.g=mix(c.g,min(c.g,.8*m),smoothstep(.0,.5,e));'+
        'float af=a*smoothstep(.0,.55,mn);gl_FragColor=vec4(c.rgb*af,af);}';
    function sh(type,src){var o=gl.createShader(type);gl.shaderSource(o,src);gl.compileShader(o);return o;}
    prog=gl.createProgram();gl.attachShader(prog,sh(gl.VERTEX_SHADER,vs));gl.attachShader(prog,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(prog);
    if(!gl.getProgramParameter(prog,gl.LINK_STATUS)){gl=null;return;}
    gl.useProgram(prog);var bf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,bf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    var loc=gl.getAttribLocation(prog,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.clearColor(0,0,0,0);
  }catch(e){gl=null;}
}
function drawFrame(){
  if(!gl||!playing)return;
  try{gl.viewport(0,0,cv.width,cv.height);gl.clear(gl.COLOR_BUFFER_BIT);gl.bindTexture(gl.TEXTURE_2D,tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,vid);gl.uniform2f(gl.getUniformLocation(prog,'px'),1.6/cv.width,1.6/cv.height);gl.uniform1f(gl.getUniformLocation(prog,'post'),vid.currentTime>=BREAK_AT-.15?1:0);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);}catch(e){}
  var ft=vid.currentTime;if(ft>=FADE_AT){var f=Math.max(0,Math.min(1,(ft-FADE_AT)/(FADE_END-FADE_AT)));if(open&&box&&box.style.opacity!=='1')box.style.opacity=1;cv.style.transition='none';cv.style.opacity=(1-f).toFixed(3);}      // the mess fades out softly (the still picture of the open window lies under it)
  if(!broke&&vid.currentTime>=BREAK_AT){broke=true;try{if(typeof playImpactSound==='function'&&hot)playImpactSound(hot,'break');}catch(e){}}
  requestAnimationFrame(drawFrame);
}
function toggle(){set(!open,true);}
function endClip(){if(!cv)return;clearTimeout(vidT);if(open&&box)box.style.opacity=1;cv.style.transition='opacity .45s ease';cv.style.opacity='0';setTimeout(function(){if(cv.style.opacity==='0'){playing=false;}},500);}
function stopClip(){if(!vid)return;clearTimeout(vidT);playing=false;try{vid.pause();}catch(e){}cv.style.transition='none';cv.style.opacity='0';}
function night(){var D=window.CooksterDay;try{return D&&D.phase?D.phase().nw:0;}catch(e){return 0;}}
function set(v,animate){
  if(!build())return;var was=open;open=!!v;try{localStorage.setItem(KEY,open?'1':'0');}catch(e){}
  stopClip();broke=false;lvlGo();
  var willClip=open&&!was&&animate&&gl&&night()<.3;      // with the clip the picture of the open window shows only when the clip ends (no flash of the open window before the clip starts)
  box.style.opacity=(open&&!willClip)?1:0;box.style.transform='';
  try{if(typeof playImpactSound==='function'&&hot)playImpactSound(hot,open?'open':'close');}catch(e){}
  if(willClip){      // by day: the clip with the flowerpot; at night the window is only switched (the night picture has no clip)
    try{vid.currentTime=0;}catch(e){}
    vid.defaultPlaybackRate=CLIP_RATE;vid.playbackRate=CLIP_RATE;
    var pr=vid.play();playing=true;
    if(pr&&pr.then)pr.then(function(){cv.style.transition='none';cv.style.opacity='1';requestAnimationFrame(drawFrame);}).catch(function(){playing=false;});
    else{cv.style.transition='none';cv.style.opacity='1';requestAnimationFrame(drawFrame);}
    vidT=setTimeout(endClip,Math.round(3300/CLIP_RATE)+100);      // in case "ended" does not come
  }
}
function tick(){      // at night the window is closed on the picture
  if(!build())return;var D=window.CooksterDay,nw=0;try{nw=D&&D.phase?D.phase().nw:0;}catch(e){}
  inner.style.opacity=String(Math.max(0,Math.min(1,1-nw)).toFixed(2));
}
setInterval(tick,400);
/* the light of the room follows the window: as long as the window is opening (0.8 s) or closing (0.5 s), drawn every frame (not 4 times a second) */
var lvlFrom=lvl,lvlTo=lvl,lvlT0=0,lvlDur=800,lvlRun=false;
function lvlStep(){var k=Math.max(0,Math.min(1,(performance.now()-lvlT0)/lvlDur));lvl=lvlFrom+(lvlTo-lvlFrom)*(k*k*(3-2*k));try{if(window.CooksterDay&&CooksterDay.refresh)CooksterDay.refresh();}catch(e){}if(k<1)requestAnimationFrame(lvlStep);else lvlRun=false;}
function lvlGo(){lvlFrom=lvl;lvlTo=open?1:0;lvlT0=performance.now();lvlDur=open?800:500;if(!lvlRun){lvlRun=true;requestAnimationFrame(lvlStep);}}
window.addEventListener('load',function(){setTimeout(function(){build();tick();},300);});
window.CooksterWindow={toggle:toggle,set:function(v){set(v,true);},isOpen:function(){return open;},level:function(){return lvl;},video:function(){return vid;}};
})();
