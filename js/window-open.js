/* Cookster: the window of the kitchen opens with a click. By day a short clip plays (assets/effects/prozor_zeleni.webm/.mp4, made in Higgsfield on a GREEN screen: only the window strip is a real picture, the floor is flat green):
   the sash swings open, pushes the flowerpot off the sill, it falls (this part is sped up) and breaks (soil, shards, petals) and the mess is gone after a few seconds.
   The green is cut out in the browser (a WebGL shader, the canvas #windowOpenClip), so the shards lie over the LIVE kitchen and get its light and shadows. The clip then fades out into the still picture of the open window.
   Closing the window brings the flowerpot back (it is a part of the kitchen picture).
   assets/effects/prozor_otvoren.webp is a piece of the picture with the window wide open, laid over the kitchen only around the window (the rest of the scene is untouched).
   At night the window is shown closed (the night picture of js/day-light.js has no open version), so the piece fades with the "night" value of the clock. */
(function(){
if(window.CooksterWindow)return;
var KEY='cooksterWindowOpen',W=176,H=440,open=false,anim=null,box=null,inner=null,hot=null,lvl=open?1:0,vid=null,cv=null,tmask=null,gl=null,tex=null,prog=null,vidT=0,playing=false,broke=false,CLIP_W=706,CLIP_H=941,BREAK_AT=1.74;      // the clip covers the part of the scene (0,0)-(706,941), BREAK_AT = the second of the clip when the pot hits the floor
try{open=localStorage.getItem(KEY)==='1';}catch(e){}
function build(){
  var sc=document.getElementById('scene');if(!sc)return false;
  if(box&&box.parentNode===sc)return true;
  box=document.createElement('div');box.id='windowOpen';
  box.style.cssText='position:absolute;left:0;top:0;width:'+W+'px;height:'+H+'px;pointer-events:none;z-index:1;transform-origin:0 40%;will-change:transform,opacity;opacity:'+(open?1:0);
  inner=document.createElement('div');inner.style.cssText='position:absolute;inset:0;background:url(assets/effects/prozor_otvoren.webp?v=4) 0 0/100% 100% no-repeat';
  box.appendChild(inner);
  sc.appendChild(box);
  vid=document.createElement('video');vid.muted=true;vid.playsInline=true;vid.preload='auto';vid.setAttribute('playsinline','');
  [['assets/effects/prozor_zeleni.webm?v=1','video/webm'],['assets/effects/prozor_zeleni.mp4?v=1','video/mp4']].forEach(function(x){var so=document.createElement('source');so.src=x[0];so.type=x[1];vid.appendChild(so);});
  vid.addEventListener('ended',endClip);
  cv=document.createElement('canvas');cv.id='windowOpenClip';cv.width=1080;cv.height=1440;
  cv.style.cssText='position:absolute;left:0;top:0;width:'+CLIP_W+'px;height:'+CLIP_H+'px;pointer-events:none;z-index:2;opacity:0';
  sc.appendChild(cv);initGL();
  /* the table lies OVER the shards that fly under it: a copy of the picture of the kitchen, cut to the outline of the table (top, drawers, the left leg), over the clip, only while the clip plays */
  tmask=document.createElement('div');tmask.id='windowOpenTable';
  tmask.style.cssText='position:absolute;left:0;top:0;width:1672px;height:941px;pointer-events:none;z-index:3;display:none;background:var(--scene-bg) 0 0/1672px 941px no-repeat;clip-path:polygon(452px 230px,800px 230px,800px 677px,501px 677px,503px 766px,462px 767px,440px 690px,421px 606px,380px 603px,375px 597px,375px 570px,395px 490px,407px 430px,420px 370px,435px 310px,445px 270px)';
  sc.appendChild(tmask);
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
        fs='precision mediump float;varying vec2 uv;uniform sampler2D t;uniform float post;void main(){vec4 c=texture2D(t,uv);float m=max(c.r,c.b);float k=c.g-m;float a;if(uv.x<.2&&uv.y<.68){a=1.-smoothstep(.45,.70,k);}else{a=1.-smoothstep(post>.5?.12:.20,post>.5?.40:.50,k);float spill=smoothstep(.0,.14,k);c.g=mix(c.g,min(c.g,m),spill);if(post>.5){float s2=smoothstep(-.22,.02,k);c.g=mix(c.g,min(c.g,.5*m),s2);}}gl_FragColor=vec4(c.rgb*a,a);}';
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
  try{gl.viewport(0,0,cv.width,cv.height);gl.clear(gl.COLOR_BUFFER_BIT);gl.bindTexture(gl.TEXTURE_2D,tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,vid);gl.uniform1f(gl.getUniformLocation(prog,'post'),vid.currentTime>=BREAK_AT-.15?1:0);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);}catch(e){}
  if(!broke&&vid.currentTime>=BREAK_AT){broke=true;try{if(typeof playImpactSound==='function'&&hot)playImpactSound(hot,'break');}catch(e){}}
  requestAnimationFrame(drawFrame);
}
function toggle(){set(!open,true);}
function endClip(){if(!cv)return;clearTimeout(vidT);cv.style.transition='opacity .45s ease';cv.style.opacity='0';setTimeout(function(){if(cv.style.opacity==='0'){playing=false;if(tmask)tmask.style.display='none';}},500);}
function stopClip(){if(!vid)return;clearTimeout(vidT);playing=false;try{vid.pause();}catch(e){}cv.style.transition='none';cv.style.opacity='0';if(tmask)tmask.style.display='none';}
function night(){var D=window.CooksterDay;try{return D&&D.phase?D.phase().nw:0;}catch(e){return 0;}}
function set(v,animate){
  if(!build())return;var was=open;open=!!v;try{localStorage.setItem(KEY,open?'1':'0');}catch(e){}
  stopClip();broke=false;
  box.style.opacity=open?1:0;box.style.transform='';
  try{if(typeof playImpactSound==='function'&&hot)playImpactSound(hot,open?'open':'close');}catch(e){}
  if(open&&!was&&animate&&gl&&night()<.3){      // by day: the clip with the flowerpot; at night the window is only switched (the night picture has no clip)
    try{vid.currentTime=0;}catch(e){}
    var pr=vid.play();playing=true;
    if(pr&&pr.then)pr.then(function(){cv.style.transition='none';cv.style.opacity='1';tmask.style.display='block';requestAnimationFrame(drawFrame);}).catch(function(){playing=false;});
    else{cv.style.transition='none';cv.style.opacity='1';tmask.style.display='block';requestAnimationFrame(drawFrame);}
    vidT=setTimeout(endClip,4600);      // in case "ended" does not come
  }
}
function tick(){      // at night the window is closed on the picture
  if(!build())return;var D=window.CooksterDay,nw=0;try{nw=D&&D.phase?D.phase().nw:0;}catch(e){}
  inner.style.opacity=String(Math.max(0,Math.min(1,1-nw)).toFixed(2));
}
setInterval(tick,400);
setInterval(function(){var t=open?1:0;if(Math.abs(t-lvl)>.001){lvl+=(t-lvl)*.06;if(Math.abs(t-lvl)<.01)lvl=t;}},40);      // the light of the room follows the window slowly (about 1.5 s)
window.addEventListener('load',function(){setTimeout(function(){build();tick();},300);});
window.CooksterWindow={toggle:toggle,set:function(v){set(v,true);},isOpen:function(){return open;},level:function(){return lvl;},video:function(){return vid;}};
})();
