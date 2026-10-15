/* The dough as a mesh of points. In every stage of the dough its picture is put over a net of small triangles (21 x 27 points): the hand takes the dough at a place
   and the points near it follow the mouse (the nearer, the more), so the dough is pulled like a real one and it STAYS in the shape it was pulled to.
   Stages: 0 = the wet flour (flour and water, 7 seconds of kneading), 1 = the dough that first appears stretched (the player makes
   the ball by hand). The points go back to the neutral net when the stage changes. They are saved with the trough (dataset.inMesh, inMeshS).
   It is drawn with WebGL on a canvas in the opening of the trough. */
(function(){
'use strict';
if(window.CooksterDoughMesh)return;
var NX=21,NY=27,CY=.46,SIG=.2,VS=2,FADE=3000;
var STG=[{src:'assets/flour/testo_f1.webp?v=1',ar:321/480},{src:'assets/flour/testo_f2.webp?v=1',ar:319/480},{src:'assets/flour/testo_f3.webp?v=1',ar:314/480},{src:'assets/flour/testo_f4.webp?v=1',ar:305/480},{src:'assets/flour/testo_f5.webp?v=1',ar:308/480},{src:'assets/flour/testo_kugla.webp?v=2',ar:1}];      // phases 1 to 5 of the mixing (the wet flour becomes the dough, 4 s each), then 6 = the whole ball
var list=[];
STG.forEach(function(g,i){g.img=new Image();g.ok=false;g.img.onload=function(){g.ok=true;list.forEach(function(t){if(t._m&&t._m.on&&t._m.stage===i)draw(t);});};g.img.src=g.src;});
function bhOf(tr,st,F){var H=tr.offsetHeight||197;return H*(st<=4?.56:.44);}   // the height of the dough in the opening of the trough
function box(tr,st,F){var W=tr.offsetWidth||105,H=tr.offsetHeight||197,bh=bhOf(tr,st,F),bw=bh*STG[st].ar,bl=(st===5&&tr._m)?(tr._m.ball||0):0;return {W:W,H:H,bw:bw,bh:bh,x0:W/2-bw/2,y0:H*CY-bh/2,ball:bl,cx:W/2,cy:H*CY,rx:H*.2,ry:H*.25};}
function local(tr,cx,cy){var r=tr.getBoundingClientRect(),k=(r.width/(tr.offsetWidth||1))||1;return [(cx-r.left)/k,(cy-r.top)/k];}
function init(tr){
  if(tr._m)return tr._m;
  var m={off:new Float32Array(NX*NY*2),on:false,gl:null,cv:null,ok:true,grab:null,stage:-1,F:0,texs:[null,null,null,null,null,null],texUp:[false,false,false,false,false,false],ball:0};tr._m=m;list.push(tr);
  try{var s=tr.dataset.inMesh,st=tr.dataset.inMeshS;if(s&&st!==undefined){var a=s.split(',');if(a.length===NX*NY*2){for(var i=0;i<a.length;i++)m.off[i]=(+a[i]||0)/1000;m.savedStage=+st;}}if(tr.dataset.inBall)m.ball=+tr.dataset.inBall||0;}catch(e){}
  return m;
}
function glSetup(tr,m){
  var W=tr.offsetWidth||105,H=tr.offsetHeight||197,cv=document.createElement('canvas');cv.width=Math.round(W*VS);cv.height=Math.round(H*VS);
  cv.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;opacity:0;display:none';
  var gl=cv.getContext('webgl',{premultipliedAlpha:true,alpha:true,antialias:true,preserveDrawingBuffer:true});   // the copy of the trough in the hand copies the picture of this canvasif(!gl){m.ok=false;return false;}
  function sh(t,src){var s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);return s;}
  var pr=gl.createProgram();
  gl.attachShader(pr,sh(gl.VERTEX_SHADER,'attribute vec2 a_p;attribute vec2 a_uv;uniform vec2 u_r;varying vec2 v_uv;void main(){vec2 c=a_p/u_r*2.0-1.0;gl_Position=vec4(c.x,-c.y,0.0,1.0);v_uv=a_uv;}'));
  gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,'precision mediump float;uniform sampler2D u_t;uniform float u_a;varying vec2 v_uv;void main(){gl_FragColor=texture2D(u_t,v_uv)*u_a;}'));
  gl.linkProgram(pr);gl.useProgram(pr);
  var uv=new Float32Array(NX*NY*2),idx=[],i,j;
  for(j=0;j<NY;j++)for(i=0;i<NX;i++){uv[(j*NX+i)*2]=i/(NX-1);uv[(j*NX+i)*2+1]=j/(NY-1);}
  for(j=0;j<NY-1;j++)for(i=0;i<NX-1;i++){var a=j*NX+i,b=a+1,c=a+NX,d=c+1;idx.push(a,b,c,b,d,c);}
  var ub=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,ub);gl.bufferData(gl.ARRAY_BUFFER,uv,gl.STATIC_DRAW);
  var la=gl.getAttribLocation(pr,'a_uv');gl.enableVertexAttribArray(la);gl.vertexAttribPointer(la,2,gl.FLOAT,false,0,0);
  var pb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,pb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(NX*NY*2),gl.DYNAMIC_DRAW);
  var lp=gl.getAttribLocation(pr,'a_p');gl.enableVertexAttribArray(lp);gl.vertexAttribPointer(lp,2,gl.FLOAT,false,0,0);
  var ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(idx),gl.STATIC_DRAW);
  gl.uniform2f(gl.getUniformLocation(pr,'u_r'),cv.width,cv.height);m.ua=gl.getUniformLocation(pr,'u_a');
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
/* The points that hold the dough: at the start of the kneading (wet flour) the dough is stuck to many points; they resist the hand and pull the dough back.
   The longer it is kneaded, the more points let it go (each point has its own moment), and at the end it is free from all of them. */
function hash(k){var x=Math.sin(k*12.9898)*43758.5453;return x-Math.floor(x);}
function stick(m,k){if(m.stage>4)return 0;var th=.15+.85*hash(k);return Math.max(0,Math.min(1,(th-(m.prog||0))/.15));}
function dots(tr,m){
  if(!m.dc){var c=document.createElement('canvas');c.width=m.cv.width;c.height=m.cv.height;c.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none';m.cv.parentNode.appendChild(c);m.dc=c;m.dx=c.getContext('2d');}
  var x=m.dx,b=box(tr,m.stage,m.F),k;x.clearRect(0,0,m.dc.width,m.dc.height);if(m.stage!==0)return;
  for(k=0;k<NX*NY;k++){var a=stick(m,k);if(a<.05)continue;var p=curPos(b,m.off,k);x.fillStyle='rgba(95,70,45,'+(.55*a).toFixed(2)+')';x.beginPath();x.arc(p[0]*VS,p[1]*VS,1.6*VS,0,7);x.fill();}
}
function settle(tr){      // the points that still hold the dough pull it back to its place
  var m=tr._m;if(!m||!m.on||m.settling)return;if(m.stage>4&&!(m.stage===5&&m.ball>.05))return;m.settling=true;
  (function f(){
    if(!m.on||(m.stage>4&&!(m.stage===5&&m.ball>.05))){m.settling=false;return;}
    if(m.stage===5&&m.ball>0){var kk=1-m.ball*.045,q;for(q=0;q<m.off.length;q++)m.off[q]*=kk;}      // the skeleton of the ball: the points come back to the ball
    var k,big=0;if(m.glue)for(k=0;k<NX*NY;k++)if(m.glue[k]>0)m.glue[k]=Math.max(0,m.glue[k]-.0025);
    for(k=0;k<NX*NY;k++){var a=stick(m,k);if(a>0){m.off[k*2]*=1-a*.05;m.off[k*2+1]*=1-a*.05;}big=Math.max(big,Math.abs(m.off[k*2]),Math.abs(m.off[k*2+1]));}
    draw(tr);
    if(big>.003)requestAnimationFrame(f);else m.settling=false;
  })();
}
function curPos(b,off,k){
  var i=k%NX,j=(k/NX)|0,x=b.x0+b.bw*i/(NX-1),y=b.y0+b.bh*j/(NY-1);
  if(b.ball>0){                                           // the skeleton of the ball: the net goes from the rectangle of the picture to a disc (a square mapped to a circle)
    var u=2*i/(NX-1)-1,v=2*j/(NY-1)-1,dx=b.cx+u*b.bw/2,dy=b.cy+v*b.bh/2;      // (the picture of the ball is round: a square stays a square, the old square->disc mapping pulled the corners in and the ball looked like a diamond)
    x+=(dx-x)*b.ball;y+=(dy-y)*b.ball;
  }
  return [x+off[k*2]*b.bh,y+off[k*2+1]*b.bh];
}
function pass(tr,m,st,F,off,alpha,tx){
  var gl=m.gl,b=box(tr,st,F),k,pos=m.pos;texFor(m,tx===undefined?st:tx);
  for(k=0;k<NX*NY;k++){var p=curPos(b,off,k);pos[k*2]=p[0]*VS;pos[k*2+1]=p[1]*VS;}
  gl.bindBuffer(gl.ARRAY_BUFFER,m.pb);gl.bufferSubData(gl.ARRAY_BUFFER,0,pos);gl.uniform1f(m.ua,alpha);
  gl.drawElements(gl.TRIANGLES,m.n,gl.UNSIGNED_SHORT,0);
}
function draw(tr){
  var m=tr._m;if(!m||!m.ok||m.stage<0||!STG[m.stage].ok)return;
  if(!m.gl&&!glSetup(tr,m))return;
  var gl=m.gl;gl.viewport(0,0,m.cv.width,m.cv.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
  var f=1;
  if(m.fade){f=Math.min(1,(performance.now()-m.fade.t0)/FADE);f=f*f*(3-2*f);       // the old picture melts into the new one (3 seconds): the old one is drawn whole, the new one over it with more and more strength
    if(STG[m.fade.from].ok)pass(tr,m,m.fade.from,m.fade.F,m.fade.off,1);
    if(f>=1)m.fade=null;}
  var af=m.fade?f:1;
  pass(tr,m,m.stage,m.F,m.off,af);
}
function fadeLoop(tr){var m=tr._m;if(!m||!m.fade){return;}draw(tr);if(m.fade)requestAnimationFrame(function(){fadeLoop(tr);});}
/* the dough keeps its size when it is squeezed: the area of the net is brought back to the area of the dough in the picture (it can grow only up to the opening of the trough) */
function area(b,off){var A=0,i,j;for(j=0;j<NY-1;j++)for(i=0;i<NX-1;i++){var k=j*NX+i,p=curPos(b,off,k),q=curPos(b,off,k+1),r=curPos(b,off,k+NX),t=curPos(b,off,k+NX+1);
  A+=Math.abs((q[0]-p[0])*(r[1]-p[1])-(r[0]-p[0])*(q[1]-p[1]))/2+Math.abs((q[0]-t[0])*(r[1]-t[1])-(r[0]-t[0])*(q[1]-t[1]))/2;}return A;}
/* the dough stays one piece: a neighbour of a point can be neither much farther (it does not tear into a thin film) nor much nearer (it does not fold up),
   and no point leaves the opening of the trough */
function relax(tr,m){
  var b=box(tr,m.stage,m.F),W=b.W,H=b.H,k,n=NX*NY,P=new Float32Array(n*2),it,i,j;
  for(k=0;k<n;k++){var p=curPos(b,m.off,k);P[k*2]=p[0];P[k*2+1]=p[1];}
  var MAX=1.9,MIN=.5,Z0=new Float32Array(n*2),R0=[];for(k=0;k<n;k++)R0.push(curPos(b,Z0,k));
  function rl(a,c){return Math.hypot(R0[c][0]-R0[a][0],R0[c][1]-R0[a][1])||1;}
  function edge(a,c,L0){var dx=P[c*2]-P[a*2],dy=P[c*2+1]-P[a*2+1],L=Math.hypot(dx,dy)||.0001,t=0;
    if(L>L0*MAX)t=(L-L0*MAX)/L*.5;else if(L<L0*MIN)t=-(L0*MIN-L)/L*.5;if(!t)return;
    P[a*2]+=dx*t*.5;P[a*2+1]+=dy*t*.5;P[c*2]-=dx*t*.5;P[c*2+1]-=dy*t*.5;}
  for(it=0;it<6;it++){
    for(j=0;j<NY;j++)for(i=0;i<NX;i++){var a=j*NX+i;if(i<NX-1)edge(a,a+1,rl(a,a+1));if(j<NY-1)edge(a,a+NX,rl(a,a+NX));}
    var NB=window.CooksterNacveBounds;
    for(k=0;k<n;k++){
      if(NB&&NB.get){var px=P[k*2]/W*100,py=P[k*2+1]/H*100;if(!NB.inside(px,py)){var q=NB.nearest(px,py);P[k*2]=q[0]/100*W;P[k*2+1]=q[1]/100*H;if(m.stage<=4){if(!m.glue)m.glue=new Float32Array(n);m.glue[k]=1;}}}
      else{P[k*2]=Math.max(W*.15,Math.min(W*.87,P[k*2]));P[k*2+1]=Math.max(H*.12,Math.min(H*.79,P[k*2+1]));}
    }
  }
  // a point can go away from its place only so far (the dough is pulled and shaped, it does not slide away or turn into a thin streak)
  var Z=new Float32Array(n*2);
  for(k=0;k<n;k++){var rp=curPos(b,Z,k),ox=(P[k*2]-rp[0])/b.bh,oy=(P[k*2+1]-rp[1])/b.bh;      // the offset from the REST place (the rectangle of the picture, or the round skeleton of the ball)
    m.off[k*2]=Math.max(-.42,Math.min(.42,ox));m.off[k*2+1]=Math.max(-.42,Math.min(.42,oy));}
}
function keepSize(tr,m){
  var b=box(tr,m.stage,m.F),A0=area(b,new Float32Array(NX*NY*2)),A=area(b,m.off);if(A<=0)return;
  var sc=Math.sqrt(A0/A);if(sc<1.015)return;sc=Math.min(sc,2);
  // the centre of the net and the width it may have
  var k,cx=0,cy=0,mnx=1e9,mxx=-1e9,mny=1e9,mxy=-1e9;
  for(k=0;k<NX*NY;k++){var p=curPos(b,m.off,k);cx+=p[0];cy+=p[1];mnx=Math.min(mnx,p[0]);mxx=Math.max(mxx,p[0]);mny=Math.min(mny,p[1]);mxy=Math.max(mxy,p[1]);}
  cx/=NX*NY;cy/=NX*NY;
  var maxW=b.W*.72,maxH=b.H*.72;sc=Math.min(sc,maxW/Math.max(1,mxx-mnx),maxH/Math.max(1,mxy-mny));if(sc<1.01)return;
  for(k=0;k<NX*NY;k++){var q=curPos(b,m.off,k);m.off[k*2]+=((cx+(q[0]-cx)*sc)-q[0])/b.bh;m.off[k*2+1]+=((cy+(q[1]-cy)*sc)-q[1])/b.bh;}
}
function save(tr){var m=tr._m;if(!m)return;var s=[],any=false;for(var i=0;i<m.off.length;i++){var v=Math.round(m.off[i]*1000);if(v)any=true;s.push(v);}
  if(any){tr.dataset.inMesh=s.join(',');tr.dataset.inMeshS=String(m.stage);}else{delete tr.dataset.inMesh;delete tr.dataset.inMeshS;}
  if(m.stage===5&&m.ball>.01)tr.dataset.inBall=m.ball.toFixed(3);else delete tr.dataset.inBall;}
window.CooksterDoughMesh={
  /* the stage of the dough (0, 1, 2) and the flour in the trough: the mesh shows its picture; returns true if the mesh is drawing (the old pictures are then hidden) */
  setStage:function(tr,stage,flour,prog){      // stage = the phase of the mixing, 0 to 4, and 5 = the whole ball
    var m=init(tr);if(!m.ok)return false;
    if(m.stage!==stage){
      var keep=(m.stage<0&&m.savedStage===stage);            // the first time after a load the saved shape is kept when it belongs to this phase
      var soft=(m.stage>=0&&m.stage<=4&&stage<=4);           // between the wet phases the points stay where they are (only the picture melts into the next one)
      if(!keep){
        if(m.stage>=0&&m.gl)m.fade={from:m.stage,F:m.F,off:m.off.slice(),t0:performance.now()};
        if(!soft){m.off.fill(0);m.glue=null;if(m.stage>=0){delete tr.dataset.inMesh;delete tr.dataset.inMeshS;}}
        if(stage===5)m.ball=.85;else if(!soft)m.ball=0;      // the whole ball: its skeleton holds the dough round
      }
      m.stage=stage;m.savedStage=undefined;
    }
    m.F=flour||0;m.prog=prog||0;m.on=true;
    if(!m.gl&&STG[stage].ok)glSetup(tr,m);
    if(!m.gl||!STG[stage].ok)return false;
    m.cv.style.display='';m.cv.style.opacity='1';draw(tr);if(m.fade)fadeLoop(tr);settle(tr);return true;
  },
  hide:function(tr){var m=tr._m;if(!m)return;m.on=false;if(m.cv){m.cv.style.display='none';m.cv.style.opacity='0';}},
  grab:function(tr,cx,cy){var m=tr._m;if(!m||!m.on)return;var p=local(tr,cx,cy);m.grab={x:p[0],y:p[1]};},
  drag:function(tr,cx,cy){
    var m=tr._m;if(!m||!m.on||!m.grab||!m.ok||m.stage<0)return;
    var p=local(tr,cx,cy),dx=p[0]-m.grab.x,dy=p[1]-m.grab.y;if(!dx&&!dy)return;
    if(m.stage<=4){      // the wet dough is slow and sticky: however fast the mouse goes, the points move only a little in one step (the hold trails behind the mouse)
      var ln=Math.hypot(dx,dy),LM=2.7;if(ln>LM){dx*=LM/ln;dy*=LM/ln;}
      p=[m.grab.x+dx,m.grab.y+dy];
    }
    if(m.glue)for(var g=0;g<m.glue.length;g++)if(m.glue[g]>0)m.glue[g]=Math.max(0,m.glue[g]-.01);      // the glue weakens while the dough is worked
    var b=box(tr,m.stage,m.F),sg=b.bh*SIG,k;
    for(k=0;k<NX*NY;k++){var c=curPos(b,m.off,k),r=Math.hypot(c[0]-m.grab.x,c[1]-m.grab.y),w=Math.exp(-(r/sg)*(r/sg));
      if(w<.01)continue;var gl=m.glue?m.glue[k]*Math.max(0,1-(m.prog||0)*1.4):0,hold=(1-.6*stick(m,k))*(1-.5*gl);
      if(m.stage===5)hold*=1-.65*(m.ball||0);
      if(window.CooksterNacveBounds&&CooksterNacveBounds.wall(c[0]/b.W*100,c[1]/b.H*100))hold*=.35;      // on the wall the dough goes slower (it climbs)
      m.off[k*2]+=dx*w*hold/b.bh;m.off[k*2+1]+=dy*w*hold/b.bh;}
    for(var it=0;it<3;it++){keepSize(tr,m);relax(tr,m);}      // the wall holds, the dough that is pushed against it is flattened there and spreads to the free sides (the volume stays)
    m.grab.x=p[0];m.grab.y=p[1];draw(tr);settle(tr);
  },
  release:function(tr){var m=tr._m;if(m)m.grab=null;save(tr);},
  active:function(tr){var m=tr._m;return !!(m&&m.on&&m.gl);}
};
})();
