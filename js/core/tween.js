/* Cookster v166 - lightweight centralized tween system.
   Keeps small visual transitions consistent without adding a library. */
(function(){
  const active=new WeakMap();
  const easings={
    linear:t=>t,
    outCubic:t=>1-Math.pow(1-t,3),
    inOutCubic:t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,
    outBack:t=>{
      const c1=1.70158,c3=c1+1;
      return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2);
    }
  };

  function bucket(target){
    let b=active.get(target);
    if(!b){b=new Map();active.set(target,b);}
    return b;
  }
  function cancel(target,key='default'){
    if(!target)return;
    const b=active.get(target), job=b?.get(key);
    if(job){
      job.cancelled=true;
      if(job.raf)cancelAnimationFrame(job.raf);
      if(job.animation){try{job.animation.cancel()}catch{}}
      b.delete(key);
    }
  }
  function number(target,key,from,to,duration,onUpdate,opts={}){
    if(!target||typeof onUpdate!=='function')return null;
    cancel(target,key);
    const ease=typeof opts.ease==='function'?opts.ease:(easings[opts.ease||'outCubic']||easings.outCubic);
    const job={cancelled:false,raf:0};
    bucket(target).set(key,job);
    const start=performance.now(), d=Math.max(1,+duration||1);
    const a=+from||0,b=+to||0;
    const tick=now=>{
      if(job.cancelled)return;
      const raw=Math.min(1,Math.max(0,(now-start)/d));
      const t=ease(raw);
      onUpdate(a+(b-a)*t,raw);
      if(raw<1){
        job.raf=requestAnimationFrame(tick);
      }else{
        bucket(target).delete(key);
        opts.onComplete?.();
      }
    };
    job.raf=requestAnimationFrame(tick);
    return job;
  }
  function opacity(el,to,duration=120,opts={}){
    if(!el)return;
    const from=Number.isFinite(parseFloat(getComputedStyle(el).opacity))?parseFloat(getComputedStyle(el).opacity):1;
    return number(el,opts.key||'opacity',from,+to,duration,v=>el.style.opacity=String(v),opts);
  }
  function styleNumber(el,prop,to,duration=160,opts={}){
    if(!el)return;
    const unit=opts.unit??'px';
    const cur=parseFloat(getComputedStyle(el)[prop])||0;
    return number(el,opts.key||prop,cur,+to,duration,v=>el.style[prop]=v+unit,opts);
  }
  function pulse(el,frames,options={}){
    if(!el||!el.animate)return null;
    const key=options.key||'pulse';
    cancel(el,key);
    const job={cancelled:false,raf:0,animation:null};
    bucket(el).set(key,job);
    const anim=el.animate(frames,{
      duration:options.duration||180,
      easing:options.easing||'cubic-bezier(.22,.8,.24,1)',
      fill:options.fill||'none'
    });
    job.animation=anim;
    anim.onfinish=()=>{
      if(!job.cancelled)bucket(el).delete(key);
      options.onComplete?.();
    };
    const oldCancel=job.cancelled;
    job.cancel=()=>{job.cancelled=true;try{anim.cancel()}catch{}};
    return job;
  }
  function quickNumber(target,key,to,duration,onUpdate,opts={}){
    if(!target)return;
    const store=target.__cooksterTweenValues||(target.__cooksterTweenValues={});
    const from=Number.isFinite(store[key])?store[key]:(+opts.from||0);
    cancel(target,key);
    return number(target,key,from,to,duration,v=>{
      store[key]=v;
      onUpdate(v);
    },{...opts,onComplete:()=>{
      store[key]=to;
      opts.onComplete?.();
    }});
  }

  // v198.5.27: generic compatibility facade. Older renderer code called
  // CooksterTween.to(), although this module never implemented it. That threw
  // during every food-stage transition and caused repeated render retries.
  function to(el,props={},opts={}){
    if(!el||!props||typeof props!=='object')return null;
    const entries=Object.entries(props);
    if(entries.length===1&&entries[0][0]==='opacity'){
      return opacity(el,+entries[0][1],opts.duration||160,{...opts,key:opts.key||'opacity'});
    }
    const jobs=[];
    for(const [prop,value] of entries){
      if(prop==='opacity'){
        jobs.push(opacity(el,+value,opts.duration||160,{...opts,key:`${opts.key||'to'}:${prop}`}));
      }else if(Number.isFinite(+value)){
        jobs.push(styleNumber(el,prop,+value,opts.duration||160,{...opts,key:`${opts.key||'to'}:${prop}`,unit:opts.unit??'px'}));
      }
    }
    return jobs;
  }

  window.CooksterTween={number,quickNumber,opacity,styleNumber,pulse,to,cancel,easings};
})();
