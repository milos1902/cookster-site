/* The dough as a mesh of points. In every stage of the dough its picture is put over a net of small triangles (13 x 17 points): the hand takes the dough at a place
   and the points near it follow the mouse (the nearer, the more), so the dough is pulled like a real one and it STAYS in the shape it was pulled to.
   Stages (each one 5 seconds of kneading): 0 = the wet flour (flour and water), 1 = the lumpy mass, 2 = the dough that first appears stretched (the player makes
   the ball by hand). The points go back to the neutral net when the stage changes. They are saved with the trough (dataset.inMesh, inMeshS).
   It is drawn with WebGL on a canvas in the opening of the trough. */
(function(){
'use strict';
if(window.CooksterDoughMesh)return;
var NX=13,NY=17,CY=.46,SIG=.3,VS=2;
var STG=[{src:'assets/flour/testo_smesa.webp?v=1',ar:303/480},{src:'assets/flour/testo_grudve.webp?v=1',ar:271/480},{src:'assets/flour/testo_razvuceno.webp?v=1',ar:270/480}];
var list=[];
STG.forEach(function(g,i){g.img=new Image();g.ok=false;g.img.onload=function(){g.ok=true;list.forEach(function(t){if(t._m&&t._m.on&&t._m.stage===i)draw(t);});};g.img.src=g.src;});
function bhOf(tr,m){var H=tr.offsetHeight||197;return H*(m.stage===0?(.48+Math.min(1,(m.F||0)/200)*.16):(m.stage===1?.70:.68));}   // the height of the dough in the opening of the trough
function box(tr,m){var W=tr.offsetWidth||105,H=tr.offsetHeight||197,bh=bhOf(tr,m),bw=bh*STG[m.stage].ar;return {W:W,H:H,bw:bw,bh:bh,x0:W/2-bw/2,y0:H*CY-bh/2};}
function local(tr,cx,cy){var r=tr.getBoundingClientRect(),k=(r.width/(tr.offsetWidth||1))||1;return [(cx-r.left)/k,(cy-r.top)/k];}
function init(tr){
  if(tr._m)return tr._m;
  var m={off:new Float32Array(NX*NY*2),on:false,gl:null,cv:null,ok:true,grab:null,stage:-1,F:0,texs:[null,null,null],texUp:[false,false,false]};tr._m=m;list.push(tr);
  try{var s=tr.dataset.inMesh,st=tr.dataset.inMeshS;if(s&&st!==undefined){var a=s.split(',');if(a.length===NX*NY*2){for(var i=0;i<a.length;i++)m.off[i]=(+a[i]||0)/1000;m.savedStage=+st;}}}catch(e){}
  return m;
}
function glSetup(tr,m){
  var W=tr.offsetWidth||105,H=tr.offsetHeight||197,cv=document.createElement('canvas');cv.width=Math.round(W*VS);cv.height=Math.round(H*VS);
  cv.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;opacity:0;display:none';
  var gl=cv.getContext('webgl',{premultipliedAlpha:true,alpha:true,antialias:true,preserveDrawingBuffer:true});   // the copy of the trough in the hand copies the picture of this canvasif(!gl){m.ok=false;return false;}
  function sh(t,src){var s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);return s;}
  var pr=gl.createProgram();
  gl.attachShader(pr,sh(gl.VERTEX_SHADER,'attribute vec2 a_p;attribute vec2 a_uv;uniform vec2 u_r;varying vec2 v_uv;void main(){vec2 c=a_p/u_r*2.0-1.0;gl_Position=vec4(c.x,-c.y,0.0,1.0);v_uv=a_uv;}'));
  gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,'precision mediump float;uniform sampler2D u_t;varying vec2 v_uv;void main(){gl_FragColor=texture2D(u_t,v_uv);}'));
  gl.linkProgram(pr);gl.useProgram(pr);
  var uv=new Float32Array(NX*NY*2),idx=[],i,j;
  for(j=0;j<NY;j++)for(i=0;i<NX;i++){uv[(j*NX+i)*2]=i/(NX-1);uv[(j*NX+i)*2+1]=j/(NY-1);}
  for(j=0;j<NY-1;j++)for(i=0;i<NX-1;i++){var a=j*NX+i,b=a+1,c=a+NX,d=c+1;idx.push(a,b,c,b,d,c);}
  var ub=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,ub);gl.bufferData(gl.ARRAY_BUFFER,uv,gl.STATIC_DRAW);
  var la=gl.getAttribLocation(pr,'a_uv');gl.enableVertexAttribArray(la);gl.vertexAttribPointer(la,2,gl.FLOAT,false,0,0);
  var pb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,pb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(NX*NY*2),gl.DYNAMIC_DRAW);
  var lp=gl.getAttribLocation(pr,'a_p');gl.enableVertexAttribArray(lp);gl.vertexAttribPointer(lp,2,gl.FLOAT,false,0,0);
  var ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(idx),gl.STATIC_DRAW);
  gl.uniform2f(gl.getUniformLocation(pr,'u_r'),cv.width,cv.height);
  gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  m.gl=gl;m.cv=cv;m.pb=pb;m.n=idx.length;m.pos=new Float32Array(NX*NY*2);
  (tr._dw||tr).appendChild(cv);
  return true;
}
function texFor(m,st){
  var gl=m.gl;
  if(!m.texs[st]){var t=gl.createTexture();m.texs[st]=t;m.texUp[st]=false;}
  gl.bindTexture(gl.TEXTURE_2D,m.texs[st]);
  if(!m.texUp[st]){
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,STG[st].img);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    m.texUp[st]=true;
  }
}
function curPos(b,m,k){var i=k%NX,j=(k/NX)|0;return [b.x0+b.bw*i/(NX-1)+m.off[k*2]*b.bh,b.y0+b.bh*j/(NY-1)+m.off[k*2+1]*b.bh];}
function draw(tr){
  var m=tr._m;if(!m||!m.ok||m.stage<0||!STG[m.stage].ok)return;
  if(!m.gl&&!glSetup(tr,m))return;
  var gl=m.gl,b=box(tr,m),k,pos=m.pos;
  texFor(m,m.stage);
  for(k=0;k<NX*NY;k++){var p=curPos(b,m,k);pos[k*2]=p[0]*VS;pos[k*2+1]=p[1]*VS;}
  gl.bindBuffer(gl.ARRAY_BUFFER,m.pb);gl.bufferSubData(gl.ARRAY_BUFFER,0,pos);
  gl.viewport(0,0,m.cv.width,m.cv.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawElements(gl.TRIANGLES,m.n,gl.UNSIGNED_SHORT,0);
}
function save(tr){var m=tr._m;if(!m)return;var s=[],any=false;for(var i=0;i<m.off.length;i++){var v=Math.round(m.off[i]*1000);if(v)any=true;s.push(v);}
  if(any){tr.dataset.inMesh=s.join(',');tr.dataset.inMeshS=String(m.stage);}else{delete tr.dataset.inMesh;delete tr.dataset.inMeshS;}}
window.CooksterDoughMesh={
  /* the stage of the dough (0, 1, 2) and the flour in the trough: the mesh shows its picture; returns true if the mesh is drawing (the old pictures are then hidden) */
  setStage:function(tr,stage,flour){
    var m=init(tr);if(!m.ok)return false;
    if(m.stage!==stage){
      var keep=(m.stage<0&&m.savedStage===stage);            // the first time after a load the saved shape is kept when it belongs to this stage
      if(!keep){m.off.fill(0);if(m.stage>=0){delete tr.dataset.inMesh;delete tr.dataset.inMeshS;}}
      m.stage=stage;m.savedStage=undefined;
    }
    m.F=flour||0;m.on=true;
    if(!m.gl&&STG[stage].ok)glSetup(tr,m);
    if(!m.gl||!STG[stage].ok)return false;
    m.cv.style.display='';m.cv.style.opacity='1';draw(tr);return true;
  },
  hide:function(tr){var m=tr._m;if(!m)return;m.on=false;if(m.cv){m.cv.style.display='none';m.cv.style.opacity='0';}},
  grab:function(tr,cx,cy){var m=tr._m;if(!m||!m.on)return;var p=local(tr,cx,cy);m.grab={x:p[0],y:p[1]};},
  drag:function(tr,cx,cy){
    var m=tr._m;if(!m||!m.on||!m.grab||!m.ok||m.stage<0)return;
    var p=local(tr,cx,cy),dx=p[0]-m.grab.x,dy=p[1]-m.grab.y;if(!dx&&!dy)return;
    var b=box(tr,m),sg=b.bh*SIG,k;
    for(k=0;k<NX*NY;k++){var c=curPos(b,m,k),r=Math.hypot(c[0]-m.grab.x,c[1]-m.grab.y),w=Math.exp(-(r/sg)*(r/sg));
      if(w<.01)continue;m.off[k*2]+=dx*w/b.bh;m.off[k*2+1]+=dy*w/b.bh;}
    m.grab.x=p[0];m.grab.y=p[1];draw(tr);
  },
  release:function(tr){var m=tr._m;if(m)m.grab=null;save(tr);},
  active:function(tr){var m=tr._m;return !!(m&&m.on&&m.gl);}
};
})();
