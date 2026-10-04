/* Cookster - 3D tomato cutting.
   The tomato is a real 3D solid. A knife stroke on the screen defines a plane (through the camera and the stroke); every
   piece that plane crosses is sliced into two closed solids, the cut faces are filled with the inside of the tomato, and each
   new piece becomes a rigid body: it is pushed apart, falls onto the board and rocks to a stop.
   Left drag = cut, right drag = turn the tomato (the board stays still). E bakes the pieces into the same atlas the 2D game uses. */
(function(){
  'use strict';
  const SNAP={w:300,h:237};
  let T=null,active=null;
  const RX=1,RY=.84;

  function webglOK(){
    try{const c=document.createElement('canvas');return !!(c.getContext('webgl2')||c.getContext('webgl'));}catch(_){return false;}
  }
  async function loadThree(){
    if(!T)T=await import('./vendor/three.module.min.js');
    return T;
  }
  const loadImg=src=>new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src;});

  // ---------- mesh as a soup of triangles: vertex = [x,y,z,u,v,nx,ny,nz] ----------
  const lerpV=(a,b,k)=>{const o=new Array(8);for(let i=0;i<8;i++)o[i]=a[i]+(b[i]-a[i])*k;
    const l=Math.hypot(o[5],o[6],o[7])||1;o[5]/=l;o[6]/=l;o[7]/=l;return o;};

  function tomatoTris(){
    const {SphereGeometry}=T;
    const geo=new SphereGeometry(1,112,80);
    const pos=geo.attributes.position;
    const sm=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
    for(let i=0;i<pos.count;i++){
      let x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
      const ang=Math.atan2(z,x),r=Math.hypot(x,z);
      const lobe=1+.022*Math.cos(ang*5+.4)*Math.sin(Math.min(1,Math.abs(y)*1.1+.15)*Math.PI*.9)*(1-.5*Math.abs(y));
      x*=lobe;z*=lobe;
      let yy=y*RY;
      yy-=.2*Math.exp(-(r*r)/.09)*sm(.4,.95,y)*(1+.15*Math.cos(ang*5+.4));
      if(y<0)yy*=1-.08*sm(.35,1,-y);
      pos.setXYZ(i,x,yy,z);
    }
    geo.computeVertexNormals();
    // weld the normals along the texture seam / poles
    const nrm=geo.attributes.normal,key=i=>Math.round(pos.getX(i)*2000)+','+Math.round(pos.getY(i)*2000)+','+Math.round(pos.getZ(i)*2000);
    const acc=new Map();
    for(let i=0;i<pos.count;i++){const k=key(i),a=acc.get(k)||[0,0,0];a[0]+=nrm.getX(i);a[1]+=nrm.getY(i);a[2]+=nrm.getZ(i);acc.set(k,a);}
    const uv=geo.attributes.uv,idx=geo.index,verts=[];
    for(let i=0;i<pos.count;i++){const a=acc.get(key(i)),l=Math.hypot(a[0],a[1],a[2])||1;
      verts.push([pos.getX(i),pos.getY(i),pos.getZ(i),uv.getX(i),uv.getY(i),a[0]/l,a[1]/l,a[2]/l]);}
    const tris=[];
    for(let i=0;i<idx.count;i+=3){
      const a=verts[idx.getX(i)],b=verts[idx.getX(i+1)],c=verts[idx.getX(i+2)];
      // skip degenerate pole triangles
      const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
      const cx=uy*vz-uz*vy,cy=uz*vx-ux*vz,cz=ux*vy-uy*vx;
      if(cx*cx+cy*cy+cz*cz<1e-14)continue;
      tris.push({v:[a.slice(),b.slice(),c.slice()],cap:0});
    }
    return tris;
  }

  // slice a triangle soup by the plane n.p = d (n unit, plain arrays). Returns {pos,neg,pts}
  function slice(tris,n,d){
    const pos=[],neg=[],pts=[],E=1e-7;
    const dist=p=>n[0]*p[0]+n[1]*p[1]+n[2]*p[2]-d;
    const fan=(arr,out,cap)=>{for(let i=1;i+1<arr.length;i++)out.push({v:[arr[0],arr[i],arr[i+1]],cap});};
    for(const t of tris){
      const V=t.v,s=[dist(V[0]),dist(V[1]),dist(V[2])];
      const hasP=s[0]>E||s[1]>E||s[2]>E,hasN=s[0]<-E||s[1]<-E||s[2]<-E;
      if(!hasN){pos.push(t);
        for(let i=0;i<3;i++)if(Math.abs(s[i])<=E)pts.push(V[i]);
        continue;}
      if(!hasP){neg.push(t);
        for(let i=0;i<3;i++)if(Math.abs(s[i])<=E)pts.push(V[i]);
        continue;}
      const P=[],N=[];
      for(let i=0;i<3;i++){
        const a=V[i],b=V[(i+1)%3],sa=s[i],sb=s[(i+1)%3];
        if(sa>=-E)P.push(a);
        if(sa<=E)N.push(a);
        if(Math.abs(sa)<=E)pts.push(a);
        if((sa>E&&sb<-E)||(sa<-E&&sb>E)){const m=lerpV(a,b,sa/(sa-sb));P.push(m);N.push(m);pts.push(m);}
      }
      if(P.length>=3)fan(P,pos,t.cap);
      if(N.length>=3)fan(N,neg,t.cap);
    }
    return {pos,neg,pts};
  }

  // cap polygon of a cut: points sorted round their centre; returns triangles for the two sides
  let capId=1;
  function makeCaps(pts,n){
    const seen=new Map(),P=[];
    for(const p of pts){const k=Math.round(p[0]*5000)+','+Math.round(p[1]*5000)+','+Math.round(p[2]*5000);if(!seen.has(k)){seen.set(k,1);P.push(p);}}
    if(P.length<3)return null;
    let cx=0,cy=0,cz=0;for(const p of P){cx+=p[0];cy+=p[1];cz+=p[2];}
    cx/=P.length;cy/=P.length;cz/=P.length;
    // plane basis, turned by a random angle so every cut face shows another part of the inside
    let e1=Math.abs(n[1])<.9?[0,1,0]:[1,0,0];
    let d=e1[0]*n[0]+e1[1]*n[1]+e1[2]*n[2];e1=[e1[0]-n[0]*d,e1[1]-n[1]*d,e1[2]-n[2]*d];
    let l=Math.hypot(...e1);e1=e1.map(x=>x/l);
    const e2=[n[1]*e1[2]-n[2]*e1[1],n[2]*e1[0]-n[0]*e1[2],n[0]*e1[1]-n[1]*e1[0]];
    const ang=P.map(p=>{const dx=p[0]-cx,dy=p[1]-cy,dz=p[2]-cz;
      return {p,a:Math.atan2(dx*e2[0]+dy*e2[1]+dz*e2[2],dx*e1[0]+dy*e1[1]+dz*e1[2]),
        u:dx*e1[0]+dy*e1[1]+dz*e1[2],w:dx*e2[0]+dy*e2[1]+dz*e2[2]};}).sort((a,b)=>a.a-b.a);
    const rot=Math.random()*Math.PI*2,cr=Math.cos(rot),sr=Math.sin(rot);
    const id=capId++;
    // the rim of a cut face leans a little towards the skin's normal, so the edge reads as very slightly rounded
    const ROUND=.3;
    const mk=(p,u,w,sg,rim)=>{
      let nx=n[0]*sg,ny=n[1]*sg,nz=n[2]*sg;
      if(rim){nx=nx*(1-ROUND)+p[5]*ROUND;ny=ny*(1-ROUND)+p[6]*ROUND;nz=nz*(1-ROUND)+p[7]*ROUND;const l=Math.hypot(nx,ny,nz)||1;nx/=l;ny/=l;nz/=l;}
      return [p[0],p[1],p[2],.5+(u*cr-w*sr)/2.1,.5+(u*sr+w*cr)/1.75,nx,ny,nz];
    };
    const centre=[cx,cy,cz];
    const posSide=[],negSide=[];
    for(let i=0;i<ang.length;i++){
      const a=ang[i],b=ang[(i+1)%ang.length];
      // neg piece: outward normal +n, counter clockwise seen from +n; pos piece: outward -n
      negSide.push({v:[mk(centre,0,0,1,false),mk(a.p,a.u,a.w,1,true),mk(b.p,b.u,b.w,1,true)],cap:id});
      posSide.push({v:[mk(centre,0,0,-1,false),mk(b.p,b.u,b.w,-1,true),mk(a.p,a.u,a.w,-1,true)],cap:id});
    }
    return {posSide,negSide};
  }

  // volume, centre of mass, bounding radius of a closed triangle soup
  function props(tris){
    let V=0,cx=0,cy=0,cz=0;
    for(const t of tris){
      const [a,b,c]=t.v;
      const vol=(a[0]*(b[1]*c[2]-b[2]*c[1])-a[1]*(b[0]*c[2]-b[2]*c[0])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;
      V+=vol;cx+=vol*(a[0]+b[0]+c[0])/4;cy+=vol*(a[1]+b[1]+c[1])/4;cz+=vol*(a[2]+b[2]+c[2])/4;
    }
    if(V<1e-5)return null;
    return {V,com:[cx/V,cy/V,cz/V]};
  }

  async function start(el,def,cb){
    if(active)return true;
    if(!webglOK())return false;
    try{await loadThree();}catch(_){return false;}
    const THREE=T;
    const [capImg,boardImg]=await Promise.all([loadImg('assets/market_veg/paradajz_presek_3d.webp').catch(()=>null),loadImg('assets/new_props/daska.png').catch(()=>null)]);

    // ---------- DOM ----------
    const root=document.createElement('div');
    root.id='tomatoCut3dOverlay';
    root.style.cssText='position:fixed;inset:0;z-index:30000;background:rgba(18,9,3,0);backdrop-filter:blur(0px);-webkit-backdrop-filter:blur(0px);transition:background .2s ease-out,backdrop-filter .2s ease-out,-webkit-backdrop-filter .2s ease-out;touch-action:none';
    const cv=document.createElement('canvas');cv.style.cssText='position:absolute;inset:0;width:100%;height:100%;cursor:crosshair;transform-origin:50% 50%;will-change:transform';
    const trail=document.createElement('canvas');trail.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
    const hint=document.createElement('div');
    hint.style.cssText='position:fixed;left:50%;bottom:14px;transform:translateX(-50%);color:#fff3d6;font:15px system-ui,sans-serif;text-shadow:0 1px 3px #000;text-align:center;max-width:90vw';
    hint.textContent='Levi klik i povuci nož preko paradajza · desni klik i povuci = okreni paradajz · E = gotovo, daska se vraća na sto';
    for(const ev of ['pointerdown','pointerup','pointermove','mousedown','mouseup','mousemove','click','dblclick','touchstart','touchmove','touchend','contextmenu','wheel'])
      root.addEventListener(ev,e=>{e.stopPropagation();if(ev==='contextmenu')e.preventDefault();});
    // the board is the game's own picture, flat behind the 3D canvas; the stage (picture + canvas) moves as one
    const stage=document.createElement('div');stage.style.cssText='position:absolute;inset:0;transform-origin:50% 50%;will-change:transform';
    const boardEl=document.createElement('img');boardEl.src='assets/new_props/daska.png';boardEl.draggable=false;boardEl.style.cssText='position:absolute;pointer-events:none;user-select:none';
    cv.style.willChange='';cv.style.transformOrigin='';
    stage.append(boardEl,cv);
    root.append(stage,trail,hint);document.body.appendChild(root);

    // ---------- renderer, scene ----------
    let renderer;
    try{renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true,preserveDrawingBuffer:true});}
    catch(_){root.remove();return false;}
    renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000,0);
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(16,1,.1,80);
    const FLOOR=-.76,HX=3.1,HZ=1.89;           // the board's top surface: 6.2 x 3.78 units
    let az=.0,el2=1.32,dist=20;
    const placeCam=()=>{camera.position.set(Math.sin(az)*Math.cos(el2)*dist,FLOOR+Math.sin(el2)*dist,Math.cos(az)*Math.cos(el2)*dist);camera.lookAt(0,FLOOR,0);camera.updateMatrixWorld();};
    // no lamps, no shadows: only an even soft light, so nothing looks lit from one side
    scene.add(new THREE.AmbientLight(0xffffff,.92));
    scene.add(new THREE.HemisphereLight(0xffffff,0xd8b8a8,.34));

    // ---------- materials ----------
    const skinTex=(()=>{const c=document.createElement('canvas');c.width=1024;c.height=512;const g=c.getContext('2d');
      const gr=g.createLinearGradient(0,0,0,512);gr.addColorStop(0,'#c8301a');gr.addColorStop(.35,'#d92a18');gr.addColorStop(.7,'#c2200f');gr.addColorStop(1,'#8e1409');
      g.fillStyle=gr;g.fillRect(0,0,1024,512);
      for(let i=0;i<260;i++){g.fillStyle=`rgba(${i%2?255:120},${i%2?90:10},10,${.04+Math.random()*.05})`;const r=30+Math.random()*90;g.beginPath();g.ellipse(Math.random()*1024,Math.random()*512,r,r*.6,Math.random()*3,0,7);g.fill();}
      const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=THREE.RepeatWrapping;return t;})();
    const skinMat=new THREE.MeshStandardMaterial({map:skinTex,roughness:.75,metalness:0});
    // inside of the tomato: the flesh part of the game's cross-section picture
    const capTex=(()=>{const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');
      // skin red all round: the cut face of a tomato is framed by a thin red skin, and only inside it comes the flesh with the seeds
      const sk=g.createRadialGradient(256,256,200,256,256,300);sk.addColorStop(0,'#e03420');sk.addColorStop(1,'#c42a16');
      g.fillStyle=sk;g.fillRect(0,0,512,512);
      if(capImg){
        const k=capImg.width/1250,IN=.95;          // flesh covers 91.5 % of the width: the rest is the skin ring
        g.save();g.beginPath();g.ellipse(256,256,256*IN,256*IN,0,0,Math.PI*2);g.clip();
        g.filter='saturate(1.45) contrast(1.05) brightness(1.04)';
        g.drawImage(capImg,150*k,128*k,1055*k,870*k,256*(1-IN),256*(1-IN),512*IN,512*IN);
        g.filter='none';
        // pale flesh becomes a clean tomato red: colour from a strong red, light and dark from the picture
        g.globalAlpha=.7;g.globalCompositeOperation='hue';g.fillStyle='#ff2810';g.fillRect(0,0,512,512);
        g.globalAlpha=.85;g.globalCompositeOperation='saturation';g.fillStyle='#ff2a12';g.fillRect(0,0,512,512);
        g.globalAlpha=1;g.globalCompositeOperation='source-over';g.restore();
        // the thin ring where flesh meets skin
        g.strokeStyle='rgba(255,110,80,.55)';g.lineWidth=6;g.beginPath();g.ellipse(256,256,256*IN,256*IN,0,0,Math.PI*2);g.stroke();
      }
      const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;})();
    const capMat=new THREE.MeshStandardMaterial({map:capTex,roughness:.8,metalness:0});
    const leafMat=new THREE.MeshStandardMaterial({color:0x5f7d2b,roughness:.55,side:THREE.DoubleSide,vertexColors:true});
    const stemMat=new THREE.MeshStandardMaterial({color:0x6e8a30,roughness:.6});

    // ---------- calyx (stem + sepals), a child of whichever piece carries the top ----------
    function sepal(len,wid,curl,lift){
      const g=new THREE.PlaneGeometry(1,1,8,28);
      const p=g.attributes.position,col=new Float32Array(p.count*3);
      for(let i=0;i<p.count;i++){
        const u=p.getX(i),t=p.getY(i)+.5;
        const shape=Math.pow(Math.sin(Math.PI*Math.min(1,Math.pow(t,.55))),.9);
        const w=wid*.5*shape*u*2*(1-.35*t),rad=len*t;
        const h=.05+lift*.2*Math.sin(Math.min(1,t*1.1)*Math.PI*.7)-.06*t+curl*.09*Math.pow(t,3);
        const fold=-Math.abs(u)*.1*wid*(1-t*.5);
        p.setXYZ(i,w,h+fold,rad);
        const c=new THREE.Color().setHSL(.24-.02*t,.52,.30+.14*t+(Math.abs(u)<.06?.07:0));
        col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;
      }
      g.setAttribute('color',new THREE.BufferAttribute(col,3));g.computeVertexNormals();
      const m=new THREE.Mesh(g,leafMat);return m;
    }
    function makeCalyx(){
      const grp=new THREE.Group(),topY=.64;
      for(let i=0;i<5;i++){const s=sepal((.72+(i%2)*.12)*.8,.3,1+(i%3)*.8,1+(i%2)*.4);s.rotation.y=i/5*Math.PI*2+.3;s.position.y=.03;grp.add(s);}
      const disc=new THREE.Mesh(new THREE.CylinderGeometry(.22,.3,.07,24),new THREE.MeshStandardMaterial({color:0x547424,roughness:.6}));disc.position.y=.01;grp.add(disc);
      const stem=new THREE.Mesh(new THREE.CylinderGeometry(.06,.085,.3,16),stemMat);stem.position.y=.17;stem.rotation.z=.12;grp.add(stem);
      const cut=new THREE.Mesh(new THREE.CircleGeometry(.06,16),new THREE.MeshStandardMaterial({color:0xd8c785,roughness:.7}));cut.rotation.x=-Math.PI/2;cut.position.y=.151;stem.add(cut);
      grp.userData.base=[0,topY,0];
      return grp;
    }

    // ---------- pieces ----------
    const pieces=[];
    function geoOf(tris,com){
      const skin=tris.filter(t=>!t.cap),caps=tris.filter(t=>t.cap);
      const all=skin.concat(caps),n=all.length*3;
      const P=new Float32Array(n*3),U=new Float32Array(n*2),N=new Float32Array(n*3);
      let k=0;
      for(const t of all)for(const v of t.v){
        P[k*3]=v[0]-com[0];P[k*3+1]=v[1]-com[1];P[k*3+2]=v[2]-com[2];U[k*2]=v[3];U[k*2+1]=v[4];N[k*3]=v[5];N[k*3+1]=v[6];N[k*3+2]=v[7];k++;
      }
      const g=new THREE.BufferGeometry();
      g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('uv',new THREE.BufferAttribute(U,2));g.setAttribute('normal',new THREE.BufferAttribute(N,3));
      g.addGroup(0,skin.length*3,0);g.addGroup(skin.length*3,caps.length*3,1);
      g.computeBoundingSphere();
      return g;
    }
    function addPiece(tris,worldPos,quat,vel,angVel,calyxLocal){
      const pr=props(tris);if(!pr)return null;
      // re-centre on the centre of mass
      const com=pr.com;
      const g=geoOf(tris,com);
      const mesh=new THREE.Mesh(g,[skinMat,capMat]);
      // collision sample points: a subset of the unique vertices
      const seen=new Set(),samples=[];
      for(const t of tris)for(const v of t.v){const k=Math.round(v[0]*40)+','+Math.round(v[1]*40)+','+Math.round(v[2]*40);if(!seen.has(k)){seen.add(k);samples.push(new THREE.Vector3(v[0]-com[0],v[1]-com[1],v[2]-com[2]));}}
      const req=Math.cbrt(3*pr.V/(4*Math.PI));
      const b={tris:tris.map(t=>({v:t.v,cap:t.cap})),mesh,com,V:pr.V,m:pr.V,I:.4*pr.V*req*req*1.2,
        pos:worldPos.clone(),quat:quat.clone(),v:vel.clone(),w:angVel.clone(),samples,radius:g.boundingSphere.radius,asleep:true,still:0,calyx:null};
      mesh.position.copy(b.pos);mesh.quaternion.copy(b.quat);
      scene.add(mesh);pieces.push(b);
      if(calyxLocal){
        const cx=makeCalyx();cx.position.set(calyxLocal[0]-com[0],calyxLocal[1]-com[1],calyxLocal[2]-com[2]);
        // tilt the calyx with the surface normal there (it sits on the dimple, facing up in the tomato's frame)
        mesh.add(cx);b.calyx=cx;b.calyxLocal=calyxLocal;
      }
      return b;
    }
    // the whole tomato rests on the board
    {
      const tris=tomatoTris();
      addPiece(tris,new THREE.Vector3(0,0,0),new THREE.Quaternion(),new THREE.Vector3(),new THREE.Vector3(),[0,.64,0]);
      pieces[0].pos.y=FLOOR+.756+0;pieces[0].mesh.position.copy(pieces[0].pos);
    }

    // ---------- cutting ----------
    let cuts=0;
    const V3=THREE.Vector3,Q=THREE.Quaternion;
    function cutWith(n,d,only,strokeId){      // world plane n.x = d; only(p) says which pieces may be cut
      const made=[];
      for(const p of [...pieces]){
        if(only&&!only(p))continue;
        const dp=n.dot(p.pos)-d;
        if(Math.abs(dp)>p.radius)continue;
        // plane in the piece's local frame (local points are relative to the centre of mass)
        const inv=p.quat.clone().invert();
        const nl=n.clone().applyQuaternion(inv),dl=d-n.dot(p.pos);
        // slicing works in the frame the triangles were stored in: shift by the centre of mass
        const dTri=dl+nl.x*p.com[0]+nl.y*p.com[1]+nl.z*p.com[2];
        const nA=[nl.x,nl.y,nl.z];
        const {pos,neg,pts}=slice(p.tris,nA,dTri);
        if(!pos.length||!neg.length)continue;
        const caps=makeCaps(pts,nA);if(!caps)continue;
        const A=pos.concat(caps.posSide),B=neg.concat(caps.negSide);
        // which side takes the calyx
        let cA=null,cB=null;
        if(p.calyxLocal){const s=nA[0]*p.calyxLocal[0]+nA[1]*p.calyxLocal[1]+nA[2]*p.calyxLocal[2]-dTri;if(s>=0)cA=p.calyxLocal;else cB=p.calyxLocal;}
        // remove the parent
        scene.remove(p.mesh);p.mesh.geometry.dispose();pieces.splice(pieces.indexOf(p),1);
        const mk=(tris,cl,sign)=>{
          const pr=props(tris);if(!pr)return null;
          const comW=new V3(pr.com[0]-p.com[0]*0,pr.com[1],pr.com[2]);
          // tris are in the parent's stored frame; world position of the new COM
          const rel=new V3(pr.com[0]-p.com[0],pr.com[1]-p.com[1],pr.com[2]-p.com[2]).applyQuaternion(p.quat);
          const wp=p.pos.clone().add(rel);
          // velocity: parent's motion plus a push away from the cut plane, plus a little spin and some upward flick
          const push=n.clone().multiplyScalar(sign*(.16+Math.random()*.08));
          const side=push.clone();side.y=0;
          const v=p.v.clone().add(p.w.clone().cross(rel)).add(side).add(new V3(0,.05,0));
          const w=p.w.clone().add(new V3((Math.random()-.5)*.3,(Math.random()-.5)*.2,(Math.random()-.5)*.3)).add(n.clone().cross(new V3(0,1,0)).multiplyScalar(sign*(.5+Math.random()*.4)));
          const b=addPiece(tris,wp,p.quat,v,w,cl);
          if(b){b.asleep=false;b.stroke=strokeId;made.push(b);}
        };
        mk(A,cA,1);mk(B,cB,-1);
      }
      return made.length;
    }

    // ---------- physics ----------
    const G=-30,E_REST=.18,MU=.55;
    const tmp=new V3(),r=new V3(),vp=new V3(),rn=new V3(),qt=new Q();
    function stepPhysics(dt){
      for(const b of pieces){
        if(b.asleep)continue;
        b.v.y+=G*dt;
        b.pos.addScaledVector(b.v,dt);
        // rotation
        const wl=b.w.length();
        if(wl>1e-6){qt.setFromAxisAngle(tmp.copy(b.w).divideScalar(wl),wl*dt);b.quat.premultiply(qt).normalize();}
        // contacts with the board (a few passes so a flat face settles)
        let touching=false;
        for(let it=0;it<3;it++){
          let deepest=0;
          for(const s of b.samples){
            r.copy(s).applyQuaternion(b.quat);
            const y=b.pos.y+r.y;
            if(y>=FLOOR)continue;
            touching=true;
            deepest=Math.max(deepest,FLOOR-y);
            vp.copy(b.w).cross(r).add(b.v);
            if(vp.y<0){
              rn.copy(r).cross(tmp.set(0,1,0));
              const eff=1/b.m+rn.lengthSq()/b.I;
              const e=-vp.y<1.4?0:E_REST;
              const j=-(1+e)*vp.y/eff;
              b.v.y+=j/b.m;
              b.w.addScaledVector(rn,j/b.I);
              // friction along the sliding direction
              const tx=vp.x,tz=vp.z,tl=Math.hypot(tx,tz);
              if(tl>1e-5){
                const tdir=new V3(tx/tl,0,tz/tl),rt=r.clone().cross(tdir);
                const effT=1/b.m+rt.lengthSq()/b.I;
                const jt=Math.min(MU*j,tl/effT);
                b.v.addScaledVector(tdir,-jt/b.m);
                b.w.addScaledVector(rt,-jt/b.I);
              }
            }
          }
          if(deepest>0)b.pos.y+=deepest*.6;
        }
        b.v.multiplyScalar(touching?.992:.999);b.w.multiplyScalar(touching?.965:.998);
        // edge of the board
        if(Math.abs(b.pos.x)>HX-.2-Math.min(.9,b.radius*.7)){b.pos.x=Math.sign(b.pos.x)*(HX-.2-Math.min(.9,b.radius*.7));b.v.x*=-.2;}
        if(Math.abs(b.pos.z)>HZ-.2-Math.min(.9,b.radius*.7)){b.pos.z=Math.sign(b.pos.z)*(HZ-.2-Math.min(.9,b.radius*.7));b.v.z*=-.2;}
        if(touching&&b.v.lengthSq()<.012&&b.w.lengthSq()<.06){b.still+=dt;if(b.still>.35){b.asleep=true;b.v.set(0,0,0);b.w.set(0,0,0);}}
        else b.still=0;
      }
      // pieces push each other apart on the board (simple spheres), so they never sit inside each other
      for(let i=0;i<pieces.length;i++)for(let j=i+1;j<pieces.length;j++){
        const a=pieces[i],c=pieces[j];
        const dx=c.pos.x-a.pos.x,dz=c.pos.z-a.pos.z,d=Math.hypot(dx,dz)||.001,m=(a.radius+c.radius)*.5;
        if(d<m&&Math.abs(a.pos.y-c.pos.y)<m){
          // pieces are heavy: they ease apart slowly instead of jumping
          const step=Math.min((m-d)*.5,.0035)/d;
          if(!a.asleep||c.asleep){a.pos.x-=dx*step;a.pos.z-=dz*step;}
          if(!c.asleep||a.asleep){c.pos.x+=dx*step;c.pos.z+=dz*step;}
        }
      }
    }

    // ---------- board approaches / goes back (0.2 s), the game behind it blurs ----------
    const ANIM_MS=200;
    let ready=false;
    function layout(){
      const W=innerWidth,H=innerHeight;
      const Wf=Math.min(W*.82,H*.8*426/285),Hf=Wf*285/426;
      return {W,H,Wf,Hf,L:(W-Wf)/2,T:(H-Hf)/2+6};
    }
    // camera: the board's top surface must land exactly on the board picture shown at the middle of the screen
    function fitCamera(){
      const lo=layout(),tw=lo.Wf*.9155,th=lo.Hf*.835,tx=lo.L+lo.Wf*.0469+tw/2,ty=lo.T+lo.Hf*.0421+th/2;
      boardEl.style.cssText='position:absolute;pointer-events:none;user-select:none;left:'+lo.L+'px;top:'+lo.T+'px;width:'+lo.Wf+'px;height:'+lo.Hf+'px';
      camera.clearViewOffset();
      for(let i=0;i<10;i++){
        placeCam();
        const pr=(x,z)=>{const v=new V3(x,FLOOR,z).project(camera);return {x:(v.x+1)/2*lo.W,y:(1-v.y)/2*lo.H};};
        const a=pr(-HX,HZ),b=pr(HX,HZ),c=pr(-HX,-HZ),d=pr(HX,-HZ);
        const mw=((b.x-a.x)+(d.x-c.x))/2,mh=((a.y-c.y)+(b.y-d.y))/2;
        dist=Math.max(6,Math.min(60,dist*mw/tw));
      }
      placeCam();
      const o=new V3(0,FLOOR,0).project(camera);
      const ox=(o.x+1)/2*lo.W,oy=(1-o.y)/2*lo.H;
      camera.setViewOffset(lo.W,lo.H,ox-tx,oy-ty,lo.W,lo.H);
    }
    function boardTransform(){
      const lo=layout(),r=(cb.board||el).getBoundingClientRect();
      const sc=Math.max(.05,r.width/lo.Wf),cx=lo.W/2,cy=lo.H/2,px=lo.L+lo.Wf/2,py=lo.T+lo.Hf/2;
      const dx=(r.left+r.width/2)-cx-sc*(px-cx),dy=(r.top+r.height/2)-cy-sc*(py-cy);
      return `translate(${dx}px,${dy}px) scale(${sc})`;
    }
    const resize=()=>{const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();trail.width=w;trail.height=h;fitCamera();};
    addEventListener('resize',resize);resize();
    // start: the canvas sits exactly over the board in the game, then grows to full size while the background blurs
    stage.style.transform=boardTransform();
    el.style.visibility='hidden';
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      stage.style.transition='transform '+ANIM_MS+'ms cubic-bezier(.2,.8,.3,1)';stage.style.transform='none';
      root.style.background='rgba(18,9,3,.4)';root.style.backdropFilter=root.style.webkitBackdropFilter='blur(9px)';
      setTimeout(()=>{ready=true;},ANIM_MS);
    }));

    // ---------- input: a straight knife stroke from where the drag started to the pointer, glowing ribbon like the 2D version ----------
    const tg=trail.getContext('2d');
    const TRAIL_MS=650;
    let stroke=null,orbit=null,trailPts=[],strokeId=0;
    const pt=e=>({x:e.clientX,y:e.clientY});
    function drawTrail(){
      tg.clearRect(0,0,trail.width,trail.height);
      const now=performance.now();
      trailPts=trailPts.filter(q=>now-q.t<TRAIL_MS);
      const n=trailPts.length;if(n<2)return;
      const g=tg,tr=trailPts;
      const w=tr.map((q,i)=>{const life=1-(now-q.t)/TRAIL_MS;return 10*(.12+.88*i/(n-1))*Math.pow(Math.max(0,life),.55);});
      const ribbon=scale=>{
        const L=[],R=[];
        for(let i=0;i<n;i++){
          const a=tr[Math.max(0,i-1)],b=tr[Math.min(n-1,i+1)];
          let dx=b.x-a.x,dy=b.y-a.y;const d=Math.hypot(dx,dy)||1;dx/=d;dy/=d;
          const h=w[i]*scale/2;
          L.push({x:tr[i].x-dy*h,y:tr[i].y+dx*h});R.push({x:tr[i].x+dy*h,y:tr[i].y-dx*h});
        }
        g.beginPath();g.moveTo(L[0].x,L[0].y);
        for(let i=1;i<n;i++)g.lineTo(L[i].x,L[i].y);
        for(let i=n-1;i>=0;i--)g.lineTo(R[i].x,R[i].y);
        g.closePath();
      };
      const t0=tr[0],t1=tr[n-1];
      const gr=g.createLinearGradient(t0.x,t0.y,t1.x,t1.y);
      gr.addColorStop(0,'rgba(255,179,71,0)');gr.addColorStop(.35,'rgba(255,95,162,.75)');
      gr.addColorStop(.7,'rgba(165,107,255,.95)');gr.addColorStop(1,'rgba(76,141,255,1)');
      g.save();
      g.fillStyle=gr;g.shadowColor='rgba(150,110,255,.9)';g.shadowBlur=22;ribbon(2.6);g.globalAlpha=.35;g.fill();
      g.globalAlpha=1;g.shadowBlur=10;ribbon(1);g.fill();
      g.shadowBlur=0;g.fillStyle='rgba(255,255,255,.95)';ribbon(.32);g.fill();
      g.restore();
    }
    // right drag: the tomato itself turns (the board and camera stay put). Sideways = spin, up/down = tip it (whole tomato only)
    function turnPieces(dyaw,dpitch){
      const qy=new Q().setFromAxisAngle(new V3(0,1,0),dyaw),qx=new Q().setFromAxisAngle(new V3(1,0,0),pieces.length===1?dpitch:0);
      for(const b of pieces){
        b.quat.premultiply(qx).premultiply(qy).normalize();
        // keep it resting on the board
        let low=1e9;
        for(const smp of b.samples){const y=smp.clone().applyQuaternion(b.quat).y;if(y<low)low=y;}
        b.pos.y=FLOOR-low;b.v.set(0,0,0);b.w.set(0,0,0);
        if(b.asleep===false)b.asleep=true;
      }
    }
    // does the knife line (screen space) pass right through this piece, from one side to the other?
    const toScreen=v=>{const q=v.clone().project(camera);return {x:(q.x+1)/2*innerWidth,y:(1-q.y)/2*innerHeight};};
    function crosses(p,a,b){
      const c=toScreen(p.pos),right=new V3().setFromMatrixColumn(camera.matrixWorld,0).multiplyScalar(p.radius*.9).add(p.pos),rs=Math.hypot(toScreen(right).x-c.x,toScreen(right).y-c.y);
      const dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy||1;
      const t=Math.max(0,Math.min(1,((c.x-a.x)*dx+(c.y-a.y)*dy)/l2)),qx=a.x+dx*t,qy=a.y+dy*t;
      const dm=Math.hypot(c.x-qx,c.y-qy),da=Math.hypot(c.x-a.x,c.y-a.y),db=Math.hypot(c.x-b.x,c.y-b.y);
      return dm<rs*.85&&da>rs*.95&&db>rs*.95;
    }
    const toRay=p=>{const nd=new V3((p.x/innerWidth)*2-1,-(p.y/innerHeight)*2+1,.5).unproject(camera);return nd.sub(camera.position).normalize();};
    cv.addEventListener('contextmenu',e=>e.preventDefault());
    cv.addEventListener('pointerdown',e=>{
      if(!ready)return;
      cv.setPointerCapture(e.pointerId);
      if(e.button===2){orbit={x:e.clientX,y:e.clientY};return;}
      if(e.button===0){stroke={id:++strokeId,start:pt(e),cut:false};trailPts.push({x:e.clientX,y:e.clientY,t:performance.now()});}
    });
    let lastChop=0;
    cv.addEventListener('pointermove',e=>{
      if(orbit){turnPieces((e.clientX-orbit.x)*.011,(e.clientY-orbit.y)*.009);orbit={x:e.clientX,y:e.clientY};return;}
      if(!stroke)return;
      const p=pt(e),s0=stroke.start,dd0=Math.hypot(p.x-s0.x,p.y-s0.y);
      if(dd0<14)return;
      const steps=Math.max(2,Math.ceil(dd0/6)),now0=performance.now();
      trailPts=[];for(let i=0;i<=steps;i++)trailPts.push({x:s0.x+(p.x-s0.x)*i/steps,y:s0.y+(p.y-s0.y)*i/steps,t:now0});
      // cut every piece the line has gone right through (pieces cut by this stroke are left alone)
      const id=stroke.id;
      const d1=toRay(s0),d2=toRay(p),n=d1.clone().cross(d2).normalize(),dd=n.dot(camera.position);
      const k=cutWith(n,dd,q=>q.stroke!==id&&crosses(q,s0,p),id);
      if(k){
        if(!stroke.cut){stroke.cut=true;cuts++;}
        const now=performance.now();
        if(now-lastChop>140){lastChop=now;try{cb.onCutSound&&cb.onCutSound();}catch(_){}}
      }
    });
    const endStroke=e=>{if(orbit&&e&&e.button===2){orbit=null;return;}stroke=null;};
    cv.addEventListener('pointerup',endStroke);cv.addEventListener('pointercancel',endStroke);
    cv.addEventListener('wheel',e=>e.preventDefault(),{passive:false});

    // ---------- loop ----------
    let raf=0,last=performance.now(),closed=false;
    function loop(now){
      if(closed){return;}
      raf=requestAnimationFrame(loop);
      const dt=Math.min(.033,(now-last)/1000);last=now;
      for(let i=0;i<4;i++)stepPhysics(dt/4);
      for(const b of pieces){b.mesh.position.copy(b.pos);b.mesh.quaternion.copy(b.quat);}
      drawTrail();
      renderer.render(scene,camera);
    }
    raf=requestAnimationFrame(loop);

    // ---------- bake into the 2D atlas ----------
    function bake(){
      const SZ=256,PU=110;   // pixels per world unit while baking
      const br=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
      br.setPixelRatio(1);br.setSize(SZ,SZ,false);br.outputColorSpace=THREE.SRGBColorSpace;br.setClearColor(0x000000,0);
      const bcv=br.domElement;
      const bs=new THREE.Scene();
      bs.add(new THREE.AmbientLight(0xffffff,.92));bs.add(new THREE.HemisphereLight(0xffffff,0xd8b8a8,.34));
      const oc=new THREE.OrthographicCamera(-SZ/2/PU,SZ/2/PU,SZ/2/PU,-SZ/2/PU,.1,20);
      oc.position.set(0,8,0);oc.up.set(0,0,-1);oc.lookAt(0,0,0);
      const sprites=[];
      const cc=document.createElement('canvas');cc.width=cc.height=SZ;const cg=cc.getContext('2d',{willReadFrequently:true});
      for(const b of pieces){
        // lay the piece on its largest cut face, cut face up
        const area=new Map();
        for(const t of b.tris){if(!t.cap)continue;const [A,B,C]=t.v;
          const ux=B[0]-A[0],uy=B[1]-A[1],uz=B[2]-A[2],vx=C[0]-A[0],vy=C[1]-A[1],vz=C[2]-A[2];
          const cx=uy*vz-uz*vy,cy=uz*vx-ux*vz,cz=vx*0+ux*vy-uy*vx,a=Math.hypot(cx,cy,cz)/2;
          const e=area.get(t.cap)||{a:0,n:[A[5],A[6],A[7]]};e.a+=a;area.set(t.cap,e);}
        let best=null;for(const e of area.values())if(!best||e.a>best.a)best=e;
        const q=new Q();
        if(best)q.setFromUnitVectors(new V3(...best.n).normalize(),new V3(0,1,0));
        q.premultiply(new Q().setFromAxisAngle(new V3(0,1,0),Math.random()*Math.PI*2));
        const m=new THREE.Mesh(b.mesh.geometry,[skinMat,capMat]);m.quaternion.copy(q);bs.add(m);
        // centre the piece's bounding box under the camera so the sprite fits
        m.position.set(0,0,0);
        br.clear();br.render(bs,oc);
        bs.remove(m);
        cg.clearRect(0,0,SZ,SZ);cg.drawImage(bcv,0,0,SZ,SZ);
        const id=cg.getImageData(0,0,SZ,SZ).data;
        let x0=SZ,y0=SZ,x1=-1,y1=-1;
        for(let y=0;y<SZ;y++)for(let x=0;x<SZ;x++)if(id[(y*SZ+x)*4+3]>20){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
        if(x1<0)continue;
        const w=x1-x0+1,h=y1-y0+1,sc=document.createElement('canvas');sc.width=w;sc.height=h;
        sc.getContext('2d').drawImage(cc,x0,y0,w,h,0,0,w,h);
        sprites.push({img:sc,w,h,ax:SZ/2-x0,ay:SZ/2-y0,x:b.pos.x*PU,y:b.pos.z*PU,r:Math.max(w,h)/2,rot:0});
      }
      if(!sprites.length){try{br.dispose();}catch(_){}return null;}
      // toss them together into a heap (like the 2D version): pull towards the middle, then push overlapping ones apart
      for(const s of sprites){s.x*=.55;s.y*=.55;}
      for(let it=0;it<80;it++){
        for(let i=0;i<sprites.length;i++)for(let j=i+1;j<sprites.length;j++){
          const a=sprites[i],b=sprites[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,m=(a.r+b.r)*.66;
          if(d<m){const k=(m-d)/d*.35;a.x-=dx*k;a.y-=dy*k;b.x+=dx*k;b.y+=dy*k;}
        }
      }
      for(const s of sprites)s.rot=(Math.random()-.5)*1.4;
      let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
      for(const s of sprites){x0=Math.min(x0,s.x-s.r*1.2);y0=Math.min(y0,s.y-s.r*1.2);x1=Math.max(x1,s.x+s.r*1.2);y1=Math.max(y1,s.y+s.r*1.2);}
      const bw=x1-x0,bh=y1-y0,s=Math.min(SNAP.w/bw,SNAP.h/bh)*.94,mx=(x0+x1)/2,my=(y0+y1)/2;
      // heap picture
      const hc=document.createElement('canvas');hc.width=SNAP.w;hc.height=SNAP.h;const hg=hc.getContext('2d');
      for(const sp of [...sprites].sort((a,b)=>a.y-b.y)){
        hg.save();hg.translate(SNAP.w/2+(sp.x-mx)*s,SNAP.h/2+(sp.y-my)*s);hg.rotate(sp.rot);
        hg.drawImage(sp.img,-sp.ax*s,-sp.ay*s,sp.w*s,sp.h*s);hg.restore();
      }
      const heap=hc.toDataURL('image/webp',.82);
      // atlas
      const PAD=10,cells=sprites.map(sp=>({sp,w:Math.ceil(sp.w*s+PAD*2),h:Math.ceil(sp.h*s+PAD*2)}));
      const order=[...cells].sort((a,b)=>b.h-a.h),maxW=480;let x=0,y=0,rowH=0,usedW=0;
      for(const c of order){if(x+c.w>maxW){x=0;y+=rowH;rowH=0;}c.sx=x;c.sy=y;x+=c.w;rowH=Math.max(rowH,c.h);usedW=Math.max(usedW,x);}
      const AW=Math.max(8,usedW),AH=Math.max(8,y+rowH);
      const ac=document.createElement('canvas');ac.width=AW;ac.height=AH;const ag=ac.getContext('2d');
      for(const c of cells)ag.drawImage(c.sp.img,c.sx+PAD,c.sy+PAD,c.sp.w*s,c.sp.h*s);
      const r1=v=>Math.round(v*10)/10;
      const meta={W:r1(bw*s),H:r1(bh*s),p:cells.map(c=>[c.sx,c.sy,c.w,c.h,r1(PAD+c.sp.ax*s),r1(PAD+c.sp.ay*s),
        r1((c.sp.x-mx)*s),r1((c.sp.y-my)*s),Math.round(c.sp.rot*1000)/1000])};
      const out={heap,atlas:ac.toDataURL('image/webp',.82)+'#'+JSON.stringify(meta)};
      try{br.dispose();br.forceContextLoss();}catch(_){}
      return out;
    }

    // leaving: the board goes back to its place on the table (0.2 s) and the background sharpens again
    function close(){
      if(closed)return;closed=true;cancelAnimationFrame(raf);ready=false;
      removeEventListener('resize',resize);document.removeEventListener('keydown',onKey,true);
      stage.style.transition='transform '+ANIM_MS+'ms cubic-bezier(.5,0,.8,.3)';stage.style.transform=boardTransform();
      root.style.background='rgba(18,9,3,0)';root.style.backdropFilter=root.style.webkitBackdropFilter='blur(0px)';
      setTimeout(()=>{try{renderer.dispose();}catch(_){}root.remove();el.style.visibility='';},ANIM_MS+30);
      active=null;
    }
    // the loop keeps drawing during the going-back animation
    function finish(){
      if(closed||!ready)return;
      if(!cuts){cancel();return;}
      const baked=bake();
      if(baked)cb.onDone(baked.heap,baked.atlas);
      close();
    }
    function cancel(){close();cb.onCancel&&cb.onCancel();}
    function onKey(e){
      if(e.key==='Escape'){e.stopPropagation();e.preventDefault();cancel();return;}
      if((e.key==='e'||e.key==='E')&&!e.repeat){e.stopImmediatePropagation();e.preventDefault();finish();}
    }
    document.addEventListener('keydown',onKey,true);
    active={root,close};
    window.__cut3d={pieces,cutWith,camera,get cuts(){return cuts;},finish};
    return true;
  }

  window.CooksterTomatoCut3D={
    supports(el){return !!el&&el.dataset.vegKey==='paradajz'&&(el.dataset.cutState||'whole')==='whole'&&webglOK();},
    start
  };
})();
