/* Cookster - interactive tomato cutting.
   Opens a close-up of the cutting board over the dimmed scene. The player drags the knife across
   the tomato; pieces are cut out of the real tomato art. On finish the pieces are baked into one
   PNG that becomes the "diced" tomato item, so moving it to the pan, cooking stages and saving all
   keep using the existing game code. */
(function(){
  const W=1280,H=720,K=1.36;           // canvas size and scale vs. the lab prototype
  const BOARD={w:426*1.9,h:285*1.9};
  const SNAP={w:300,h:237};            // same aspect as the diced item box (96x76)
  const rnd=(a,b)=>a+Math.random()*(b-a);
  const imgCache={};
  function load(src){
    if(!imgCache[src])imgCache[src]=new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src;});
    return imgCache[src];
  }

  function centroid(v){let x=0,y=0;for(const p of v){x+=p.x;y+=p.y}return{x:x/v.length,y:y/v.length};}
  function area(v){let a=0;for(let i=0;i<v.length;i++){const p=v[i],q=v[(i+1)%v.length];a+=p.x*q.y-q.x*p.y}return Math.abs(a/2);}
  function mk(verts,skin,x,y){
    const c=centroid(verts);
    verts=verts.map(p=>({x:p.x-c.x,y:p.y-c.y}));
    const a=area(verts);
    return{v:verts,skin,x:x+c.x,y:y+c.y,ox:c.x,oy:c.y,vx:0,vy:0,rot:0,a,r:Math.sqrt(a/Math.PI)};
  }
  // splits a convex polygon with the line through p, normal n; returns [A,skinA,B,skinB] or null
  function split(f,p,n){
    const A=[],B=[],sa=[],sb=[];
    const side=q=>(q.x-p.x)*n.x+(q.y-p.y)*n.y;
    const L=f.v.length;
    for(let i=0;i<L;i++){
      const a=f.v[i],b=f.v[(i+1)%L],da=side(a),db=side(b),sk=f.skin[i];
      if(da>=0){A.push(a);sa.push(sk);}else{B.push(a);sb.push(sk);}
      if((da>0&&db<0)||(da<0&&db>0)){
        const t=da/(da-db),q={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};
        if(da>=0){sa[sa.length-1]=sk;A.push(q);sa.push(false);B.push(q);sb.push(sk);}
        else{sb[sb.length-1]=sk;B.push(q);sb.push(false);A.push(q);sa.push(sk);}
      }
    }
    if(A.length<3||B.length<3||area(A)<30*K*K||area(B)<30*K*K)return null;
    return[A,sa,B,sb];
  }
  const rotv=(p,a)=>({x:p.x*Math.cos(a)-p.y*Math.sin(a),y:p.x*Math.sin(a)+p.y*Math.cos(a)});
  // n is the cut normal in the piece's own (rotated) frame. fall: 'whole' | 'piece' | null
  function children(f,r,n,kick,fall){
    const out=[];
    [[r[0],r[1],1],[r[2],r[3],-1]].forEach(([v,sk,sg])=>{
      const nf=mk(v,sk,0,0);                 // x,y,ox,oy = centroid in the parent's local frame
      const c={x:nf.x,y:nf.y},cw=rotv(c,f.rot);
      nf.x=f.x+cw.x;nf.y=f.y+cw.y;nf.ox=c.x+f.ox;nf.oy=c.y+f.oy;nf.rot=f.rot;
      nf.bk=f.bk||0;nf.bkT=f.bkT||0;
      const nw=rotv({x:n.x*sg,y:n.y*sg},f.rot);   // outward direction in world
      if(fall){
        // heavy: topples outward around the lowest vertex on the cut edge, overshoots and settles
        let pi=-1,py=-1e9;
        for(let i=0;i<nf.v.length;i++){
          if(sk[i])continue;
          for(const j of [i,(i+1)%nf.v.length]){const y=rotv(nf.v[j],nf.rot).y;if(y>py){py=y;pi=j;}}
        }
        const pv=rotv(nf.v[Math.max(0,pi)],nf.rot),big=fall==='whole';
        const sc=big?1:Math.min(1,nf.r/(60*K))*.7+.3;
        nf.fall={t:0,sign:nw.x>=0?1:-1,target:big?.42:.26*sc+.06,rot0:nf.rot,c0x:nf.x,c0y:nf.y,
          px:nf.x+pv.x,py:nf.y+pv.y,sx:nw.x*(big?46:30)*K*sc,sy:nw.y*(big?14:10)*K*sc};
      }else{
        nf.vx=nw.x*kick*rnd(.6,1.1);nf.vy=nw.y*kick*rnd(.6,1.1);
      }
      out.push(nf);
    });
    return out;
  }
  // knife drag p1->p2 (world coords); cuts every piece the segment crosses
  function cutSegment(f,p1,p2){
    const lp=rotv({x:p1.x-f.x,y:p1.y-f.y},-f.rot),lq=rotv({x:p2.x-f.x,y:p2.y-f.y},-f.rot);
    const dx=lq.x-lp.x,dy=lq.y-lp.y,len=Math.hypot(dx,dy)||1,n={x:-dy/len,y:dx/len};
    let hit=false;const L=f.v.length;
    for(let i=0;i<L&&!hit;i++){
      const a=f.v[i],b=f.v[(i+1)%L];
      const da=(a.x-lp.x)*n.x+(a.y-lp.y)*n.y,db=(b.x-lp.x)*n.x+(b.y-lp.y)*n.y;
      if(da*db<0){
        const t=da/(da-db),q={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};
        const s=((q.x-lp.x)*dx+(q.y-lp.y)*dy)/(len*len);
        if(s>=0&&s<=1)hit=true;
      }
    }
    if(!hit)return[f];
    const r=split(f,lp,n);
    return r?children(f,r,n,0,f.whole?'whole':'piece'):[f];
  }
  function cutWorldLine(f,n,c){
    const lp=rotv({x:n.x*c-f.x,y:n.y*c-f.y},-f.rot),nl=rotv(n,-f.rot);
    const r=split(f,lp,nl);
    return r?children(f,r,nl,.7,null):[f];
  }
  // grid cuts, so we get cubes instead of slivers
  function diceGrid(frags){
    const th=rnd(0,Math.PI/2),size=34*K;
    for(const ang of [th,th+Math.PI/2]){
      const n={x:Math.cos(ang),y:Math.sin(ang)},base=rnd(0,size);
      for(let c=-1400+base;c<1800;c+=size+rnd(-4,4)*K){
        const next=[];
        for(const f of frags){
          const d=c-(f.x*n.x+f.y*n.y);
          next.push(...(Math.abs(d)<f.r*1.5?cutWorldLine(f,n,c):[f]));
        }
        frags=next;
      }
    }
    frags=frags.filter(f=>f.a>240*K*K);
    for(const f of frags)f.rot+=rnd(-.15,.15);
    return frags;
  }

  // dice only the pieces that are still too big, keep the small ones as they are
  function diceBig(frags){
    const big=frags.filter(f=>f.r>26*K),small=frags.filter(f=>f.r<=26*K);
    return small.concat(big.length?diceGrid(big):[]);
  }

  function roundedPath(g,v){
    const L=v.length;g.beginPath();
    for(let i=0;i<L;i++){
      const a=v[i],b=v[(i+1)%L],m={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
      if(i===0){const z=v[L-1];g.moveTo((z.x+a.x)/2,(z.y+a.y)/2);}
      g.quadraticCurveTo(a.x,a.y,m.x,m.y);
    }
    g.closePath();
  }
  // "flesh" look: the real cross-section art, with a skin rim along the outer edges
  function drawFlesh(g,f,tex,tomImg){
    const S=210*K,tx=-f.ox-S/2,ty=-f.oy-S/2-4*K;
    g.save();roundedPath(g,f.v);g.clip();
    g.drawImage(tex,270,470,740,610,-f.ox-100*K,-f.oy-82*K,200*K,165*K);
    g.lineWidth=7;g.strokeStyle='rgba(255,215,170,.28)';roundedPath(g,f.v);g.stroke();
    let pat=null;
    try{pat=g.createPattern(tomImg,'no-repeat');pat.setTransform(new DOMMatrix().translate(tx,ty).scale(S/tomImg.width));}catch(_){}
    if(pat){
      g.strokeStyle=pat;g.lineWidth=20*K;g.lineJoin=g.lineCap='round';
      const L=f.v.length;
      for(let i=0;i<L;i++)if(f.skin[i]){const a=f.v[i],b=f.v[(i+1)%L];g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.stroke();}
    }
    g.restore();
    const L=f.v.length;
    g.lineJoin=g.lineCap='round';
    for(let i=0;i<L;i++){
      const a=f.v[i],b=f.v[(i+1)%L];
      g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);
      g.lineWidth=f.skin[i]?4:2.5;g.strokeStyle=f.skin[i]?'#6b1006':'#5a1208';g.stroke();
    }
  }
  // piece of the whole tomato's art. Only the art's own pixels are drawn (no filler shape behind it),
  // and the cut faces show the real red flesh with seeds.
  let tmp=null;
  function drawArt(g,f,tex,tomImg){
    const S=210*K,tx=-f.ox-S/2,ty=-f.oy-S/2-4*K;
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
    for(const p of f.v){x0=Math.min(x0,p.x);y0=Math.min(y0,p.y);x1=Math.max(x1,p.x);y1=Math.max(y1,p.y);}
    const bx=Math.floor(x0-30),by=Math.floor(y0-30),bw=Math.ceil(x1-x0+60),bh=Math.ceil(y1-y0+60);
    if(!tmp)tmp=document.createElement('canvas');
    if(tmp.width<bw)tmp.width=bw;if(tmp.height<bh)tmp.height=bh;
    const t=tmp.getContext('2d');
    t.setTransform(1,0,0,1,0,0);t.clearRect(0,0,tmp.width,tmp.height);
    t.translate(-bx,-by);
    t.save();roundedPath(t,f.v);t.clip();
    t.drawImage(tomImg,tx,ty,S,S);
    t.globalCompositeOperation='source-atop';
    const sx=200*K/740,sy=165*K/610;
    let pat=null;
    try{pat=t.createPattern(tex,'no-repeat');pat.setTransform(new DOMMatrix().translate(-f.ox-100*K-270*sx,-f.oy-82*K-470*sy).scale(sx,sy));}catch(_){}
    t.lineJoin=t.lineCap='round';
    const L=f.v.length;
    for(let i=0;i<L;i++)if(!f.skin[i]){
      const a=f.v[i],b=f.v[(i+1)%L];
      const ex=b.x-a.x,ey=b.y-a.y,len=Math.hypot(ex,ey);
      if(len<8)continue;
      const mx=(a.x+b.x)/2,my=(a.y+b.y)/2,ux=ex/len,uy=ey/len;
      // inward side = towards the piece centre (local origin)
      const inward=((-uy)*(-mx)+ux*(-my))>0;
      const ry=Math.min(len*.30,34*K),rx=len/2*.97;
      // the cut face, seen at a slant: a half-ellipse hanging off the cut edge
      t.beginPath();
      t.ellipse(mx,my,rx,ry,Math.atan2(uy,ux),inward?0:Math.PI,inward?Math.PI:Math.PI*2);
      t.closePath();
      t.fillStyle=pat||'#d9301a';t.fill();
      t.strokeStyle='rgba(255,205,170,.55)';t.lineWidth=3;t.stroke();
      t.strokeStyle='rgba(110,16,6,.9)';t.lineWidth=2.5;
      t.beginPath();t.moveTo(a.x,a.y);t.lineTo(b.x,b.y);t.stroke();
    }
    t.restore();
    g.save();
    g.shadowColor='rgba(40,12,0,.45)';g.shadowBlur=10;g.shadowOffsetY=5;
    g.drawImage(tmp,0,0,bw,bh,bx,by,bw,bh);
    g.restore();
  }
  function drawPiece(g,f,tex,tomImg){
    g.save();g.translate(f.x,f.y);g.rotate(f.rot);
    const bk=f.baked?1:(f.bk||0);
    if(bk<1&&tomImg)drawArt(g,f,tex,tomImg);
    if(bk>0){
      if(bk>=1){
        g.save();g.shadowColor='rgba(40,12,0,.45)';g.shadowBlur=10;g.shadowOffsetY=5;
        roundedPath(g,f.v);g.fillStyle='#d9301a';g.fill();g.restore();
      }
      g.globalAlpha=bk;
      drawFlesh(g,f,tex,tomImg);
      g.globalAlpha=1;
    }
    g.restore();
  }

  function bakePile(frags,tex,tomImg){
    // toss the cubes into a heap: random tilt, random bit of the flesh texture, slight overlap
    const total=frags.reduce((t,f)=>t+f.a,0),R=Math.sqrt(total/1.0/Math.PI);
    frags=frags.map(f=>f);
    for(const f of frags){
      const a=rnd(0,Math.PI*2),d=Math.sqrt(Math.random())*R;
      f.x=Math.cos(a)*d*1.15;f.y=Math.sin(a)*d*.85;
      f.rot=rnd(-.9,.9);f.ox=rnd(-60,60)*K;f.oy=rnd(-45,45)*K;
    }
    for(let it=0;it<80;it++){
      for(let i=0;i<frags.length;i++)for(let j=i+1;j<frags.length;j++){
        const a=frags[i],b=frags[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,m=(a.r+b.r)*.66;
        if(d<m){const k=(m-d)/d*.35;a.x-=dx*k;a.y-=dy*k;b.x+=dx*k;b.y+=dy*k;}
      }
      for(const f of frags){const q=(f.x/(R*1.2))**2+(f.y/(R*.9))**2;if(q>1){const k=1/Math.sqrt(q);f.x*=k;f.y*=k;}}
    }
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
    for(const f of frags){x0=Math.min(x0,f.x-f.r*1.3);y0=Math.min(y0,f.y-f.r*1.3);x1=Math.max(x1,f.x+f.r*1.3);y1=Math.max(y1,f.y+f.r*1.3);}
    const bw=x1-x0,bh=y1-y0,s=Math.min(SNAP.w/bw,SNAP.h/bh)*.94;
    const c=document.createElement('canvas');c.width=SNAP.w;c.height=SNAP.h;
    const g=c.getContext('2d');
    g.translate(SNAP.w/2,SNAP.h/2);g.scale(s,s);g.translate(-(x0+x1)/2,-(y0+y1)/2);
    for(const f of [...frags].sort((a,b)=>a.y-b.y)){f.baked=true;drawPiece(g,f,tex,tomImg);}
    // WebP keeps the transparent pile ~10x smaller than PNG (browsers without WebP encode fall back to PNG)
    return c.toDataURL('image/webp',.82);
  }

  let active=null;
  function supports(el){
    if(!el||el.dataset.vegetable!=='1')return false;
    if((el.dataset.vegKey||'')!=='paradajz')return false;
    return (el.dataset.cutState||'whole')==='whole';
  }

  async function start(el,def,cb){
    if(active)return;
    const [tomImg,sliceImg,boardImg]=await Promise.all([
      load(def.src),load(def.slicedSrc),load('assets/new_props/daska.png')]);
    const root=document.createElement('div');
    root.id='tomatoCutOverlay';
    root.style.cssText='position:fixed;inset:0;z-index:30000;background:rgba(18,9,3,.62);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .25s';
    const cv=document.createElement('canvas');cv.width=W;cv.height=H;
    cv.style.cssText='max-width:100vw;max-height:100vh;touch-action:none;cursor:crosshair;transform:scale(.9);transition:transform .3s cubic-bezier(.2,.8,.3,1)';
    const bar=document.createElement('div');
    bar.style.cssText='position:fixed;left:50%;top:14px;transform:translateX(-50%);display:flex;gap:8px;z-index:1;font:15px system-ui,sans-serif';
    const hint=document.createElement('div');
    hint.style.cssText='position:fixed;left:50%;bottom:14px;transform:translateX(-50%);color:#fff3d6;font:15px system-ui,sans-serif;text-shadow:0 1px 3px #000;text-align:center;max-width:90vw';
    hint.textContent='Prevuci nož preko paradajza da ga iseckaš (posle petog reza postaje iseckan). Kad završiš, klikni „Gotovo“.';
    const mkBtn=(t,fn)=>{const b=document.createElement('button');b.textContent=t;b.style.cssText='font:inherit;padding:8px 14px;border-radius:10px;border:2px solid #4a2a12;background:#f1d9a6;color:#3b1d0a;cursor:pointer';b.onclick=fn;bar.appendChild(b);return b;};
    // the overlay must not leak clicks/drags to the game underneath (it would pick the tomato up)
    for(const ev of ['pointerdown','pointerup','pointermove','mousedown','mouseup','mousemove','click','dblclick','touchstart','touchmove','touchend','contextmenu','wheel'])
      root.addEventListener(ev,e=>e.stopPropagation());
    root.append(cv,bar,hint);document.body.appendChild(root);
    requestAnimationFrame(()=>{root.style.opacity='1';cv.style.transform='scale(1)';});
    const g=cv.getContext('2d');

    // tomato = ellipse polygon whose rim edges are flagged as "skin"
    const n=22,rx=88*K,ry=80*K,verts=[],skin=[];
    for(let i=0;i<n;i++){const a=i/n*Math.PI*2;verts.push({x:Math.cos(a)*rx,y:Math.sin(a)*ry});skin.push(true);}
    const bx=W/2-BOARD.w/2,by=H/2-BOARD.h/2+10;
    let frags=[mk(verts,skin,W/2,H/2+10)];frags[0].whole=true;
    const TRAIL_MS=650;let trail=[],strokeId=0,raf=0,closed=false,cuts=0;const MAX_CUTS=5;

    function frame(){
      for(const f of frags){
        if(f.bkT&&(f.bk||0)<1)f.bk=Math.min(1,(f.bk||0)+1/40);
        if(f.fall){
          // damped swing: topples outward, overshoots a little, settles (feels heavy)
          const q=f.fall;q.t+=1/60;const t=q.t;
          const k=1-Math.exp(-5.5*t)*(Math.cos(9*t)+.6*Math.sin(9*t));
          const th=q.sign*q.target*k,c=Math.cos(th),sn=Math.sin(th);
          const dx=q.c0x-q.px,dy=q.c0y-q.py;
          const sl=1-Math.exp(-4*t);
          f.x=q.px+dx*c-dy*sn+q.sx*sl;f.y=q.py+dx*sn+dy*c+q.sy*sl;
          f.rot=q.rot0+th;
          if(t>1.8)f.fall=null;
          continue;
        }
        f.x+=f.vx;f.y+=f.vy;f.vx*=.9;f.vy*=.9;
      }
      for(let i=0;i<frags.length;i++)for(let j=i+1;j<frags.length;j++){
        const a=frags[i],b=frags[j];if(a.fall||b.fall)continue;
        const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,m=(a.r+b.r)*.9;
        if(d<m){const k=(m-d)/d*.2;a.x-=dx*k;a.y-=dy*k;b.x+=dx*k;b.y+=dy*k;}
      }
      g.clearRect(0,0,W,H);
      g.save();g.shadowColor='rgba(0,0,0,.5)';g.shadowBlur=30;g.shadowOffsetY=14;
      g.drawImage(boardImg,bx,by,BOARD.w,BOARD.h);g.restore();
      for(const f of [...frags].sort((a,b)=>a.y-b.y)){
        if(f.whole){const s=210*K;g.save();g.shadowColor='rgba(0,0,0,.35)';g.shadowBlur=16;g.shadowOffsetY=8;
          g.drawImage(tomImg,f.x-s/2,f.y-s/2-4*K,s,s);g.restore();}
        else drawPiece(g,f,sliceImg,tomImg);
      }
      drawTrail(g);
      raf=requestAnimationFrame(frame);
    }
    raf=requestAnimationFrame(frame);

    const pos=e=>{const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};};
    let stroke=null,lastChop=0;
    // one continuous tapered ribbon with a blue -> violet -> pink -> amber gradient and a soft glow
    function drawTrail(g){
      const now=performance.now();
      trail=trail.filter(q=>now-q.t<TRAIL_MS);
      const n=trail.length;if(n<2)return;
      const w=trail.map((q,i)=>{const life=1-(now-q.t)/TRAIL_MS;return 10*(.12+.88*i/(n-1))*Math.pow(Math.max(0,life),.55);});
      const ribbon=scale=>{
        const L=[],R=[];
        for(let i=0;i<n;i++){
          const a=trail[Math.max(0,i-1)],b=trail[Math.min(n-1,i+1)];
          let dx=b.x-a.x,dy=b.y-a.y;const d=Math.hypot(dx,dy)||1;dx/=d;dy/=d;
          const h=w[i]*scale/2;
          L.push({x:trail[i].x-dy*h,y:trail[i].y+dx*h});R.push({x:trail[i].x+dy*h,y:trail[i].y-dx*h});
        }
        g.beginPath();g.moveTo(L[0].x,L[0].y);
        for(let i=1;i<n;i++)g.lineTo(L[i].x,L[i].y);
        for(let i=n-1;i>=0;i--)g.lineTo(R[i].x,R[i].y);
        g.closePath();
      };
      const t0=trail[0],t1=trail[n-1];
      const gr=g.createLinearGradient(t0.x,t0.y,t1.x,t1.y);
      gr.addColorStop(0,'rgba(255,179,71,0)');gr.addColorStop(.35,'rgba(255,95,162,.75)');
      gr.addColorStop(.7,'rgba(165,107,255,.95)');gr.addColorStop(1,'rgba(76,141,255,1)');
      g.save();
      g.fillStyle=gr;g.shadowColor='rgba(150,110,255,.9)';g.shadowBlur=22;ribbon(2.6);g.globalAlpha=.35;g.fill();
      g.globalAlpha=1;g.shadowBlur=10;ribbon(1);g.fill();
      g.shadowBlur=0;g.fillStyle='rgba(255,255,255,.95)';ribbon(.32);g.fill();
      g.restore();
    }
    cv.addEventListener('pointerdown',e=>{
      cv.setPointerCapture(e.pointerId);const p=pos(e);
      stroke={id:++strokeId,pts:[p],cut:false};trail.push({x:p.x,y:p.y,t:performance.now()});
    });
    cv.addEventListener('pointermove',e=>{
      if(!stroke)return;
      const p=pos(e),prev=stroke.pts[stroke.pts.length-1];
      if(Math.hypot(p.x-prev.x,p.y-prev.y)<3)return;
      stroke.pts.push(p);trail.push({x:p.x,y:p.y,t:performance.now()});
      // the cut line follows the last ~40px of the stroke, so it cuts the moment the knife crosses a piece
      let back=stroke.pts[0],acc=0;
      for(let i=stroke.pts.length-1;i>0;i--){
        acc+=Math.hypot(stroke.pts[i].x-stroke.pts[i-1].x,stroke.pts[i].y-stroke.pts[i-1].y);
        if(acc>=40){back=stroke.pts[i-1];break;}
      }
      if(Math.hypot(p.x-back.x,p.y-back.y)<12)return;
      let cutAny=false;const next=[];
      for(const f of frags){
        if(f.stroke===stroke.id){next.push(f);continue;}
        const r=cutSegment(f,back,p);
        if(r.length>1){cutAny=true;for(const c of r)c.stroke=stroke.id;}
        next.push(...r);
      }
      frags=next;
      if(!cutAny)return;
      const now=performance.now();
      if(now-lastChop>140){lastChop=now;try{if(cb.onCutSound)cb.onCutSound();else if(typeof playChop==='function')playChop();}catch(_){}}
      if(!stroke.cut){
        stroke.cut=true;cuts++;
        if(cuts===MAX_CUTS){
          for(const f of frags)f.bkT=1;      // the whole-tomato picture turns into the sliced tomato
          hint.textContent='Paradajz je iseckan. Možeš da nastaviš da seckaš, ili klikni „Gotovo“.';
        }else if(cuts<MAX_CUTS)hint.textContent='Rez '+cuts+' od '+MAX_CUTS+'. Nastavi da seckaš, ili klikni „Gotovo“.';
      }
    });
    const endStroke=()=>{stroke=null;};
    cv.addEventListener('pointerup',endStroke);cv.addEventListener('pointercancel',endStroke);

    function close(){
      if(closed)return;closed=true;cancelAnimationFrame(raf);
      root.style.opacity='0';cv.style.transform='scale(.9)';
      setTimeout(()=>root.remove(),260);
      document.removeEventListener('keydown',onKey,true);
      active=null;
    }
    function finish(){
      if(closed)return;
      if(frags.length===1&&frags[0].whole){hint.textContent='Prvo iseckaj paradajz nožem.';return;}
      const src=bakePile(diceBig(frags),sliceImg,tomImg);
      close();cb.onDone(src);
    }
    function cancel(){close();cb.onCancel&&cb.onCancel();}
    function onKey(e){if(e.key==='Escape'){e.stopPropagation();cancel();}}
    document.addEventListener('keydown',onKey,true);
    mkBtn('Iseckaj sitno',()=>{frags=diceBig(frags);
      if(typeof playChop==='function')try{playChop();}catch(_){}});
    mkBtn('Gotovo',finish);
    mkBtn('Odustani',cancel);
    active={root,close};
  }

  window.CooksterTomatoCut={supports,start};
})();
