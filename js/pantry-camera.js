(function(){
  'use strict';
  // Fixed optical centre, fixed focal length, yaw only. For a source point
  // (u,v,f), rotate its ray by -angle and project back through the same lens.
  // The image offset in this homography comes from ray rotation, NOT camera
  // translation, orbiting, zooming, or rotating a picture about a hinge.
  var TURN=Math.PI/4, FOV=75*Math.PI/180;
  var skipped=/^(SCRIPT|STYLE|LINK)$/;
  function yawProjection(angle,focal){
    var c=Math.cos(angle),s=Math.sin(angle);
    return 'matrix3d('+[
      c,0,0,s/focal, 0,1,0,0, 0,0,1,0, -focal*s,0,0,c
    ].join(',')+')';
  }
  function smoothstep(a,b,x){
    var t=Math.max(0,Math.min(1,(x-a)/(b-a)));
    return t*t*(3-2*t);
  }
  function motionProgress(progress,duration){
    var time=Math.max(0,Math.min(1,progress))*duration;
    var start=Math.min(200,duration*.4),stop=Math.min(200,duration*.4);
    var brakeAt=duration-stop,total=duration-(start+stop)/2;
    // Integral of quintic smootherstep velocity: continuous speed,
    // acceleration and jerk at both joins. No snap into the final brake.
    function integral(u){return 2.5*Math.pow(u,4)-3*Math.pow(u,5)+Math.pow(u,6)}
    if(time<start)return start*integral(time/start)/total;
    if(time<=brakeAt)return (time-start/2)/total;
    var u=(time-brakeAt)/stop;
    return (brakeAt-start/2+stop*(u-integral(u)))/total;
  }
  function readyImages(root){
    return Promise.all(Array.from(root.querySelectorAll('img')).map(function(img){
      if(!img.getAttribute('src'))return Promise.resolve();
      if(img.decode)return img.decode();
      if(img.complete&&img.naturalWidth)return Promise.resolve();
      return new Promise(function(resolve,reject){
        img.onload=resolve;img.onerror=function(){reject(new Error('Camera image failed to load'))};
      });
    }));
  }

  function copyStyle(source,target,pseudo){
    var style=getComputedStyle(source,pseudo||null);
    for(var i=0;i<style.length;i++){
      var key=style[i];
      if(key.indexOf('--')===0||/^(animation|transition)/.test(key))continue;
      target.style.setProperty(key,style.getPropertyValue(key));
    }
    target.style.setProperty('animation','none','important');
    target.style.setProperty('transition','none','important');
    target.style.willChange='auto';
    target.style.pointerEvents='none';
    return style;
  }

  function pseudoCopy(source,kind){
    var style=getComputedStyle(source,kind);
    if(!style.content||style.content==='none'||style.content==='normal'||style.display==='none')return null;
    var el=document.createElement('div');
    copyStyle(source,el,kind);
    if(style.content!=='""'&&style.content!=="''"){
      el.textContent=style.content.replace(/^["']|["']$/g,'');
    }
    return el;
  }

  function snapshot(source){
    if(source.nodeType!==1)return source.cloneNode(false);
    if(skipped.test(source.tagName)||source.classList.contains('pantry-nav')||
        getComputedStyle(source).display==='none')return null;
    var clone=source.cloneNode(false);
    // Render-only copies must never be mistaken for live game items or IDs.
    Array.from(clone.attributes).forEach(function(attr){
      if(attr.name==='id'||attr.name==='class'||attr.name==='name'||
          attr.name.indexOf('data-')===0||attr.name.indexOf('on')===0){
        clone.removeAttribute(attr.name);
      }
    });
    copyStyle(source,clone);
    if(source.tagName==='CANVAS'){
      clone.width=source.width;clone.height=source.height;
      // Drawing is allowed even for a tainted local canvas: no pixel readback.
      if(source.width&&source.height)clone.getContext('2d').drawImage(source,0,0);
    }
    var before=pseudoCopy(source,'::before');
    if(before)clone.appendChild(before);
    Array.from(source.childNodes).forEach(function(child){
      var next=snapshot(child);if(next)clone.appendChild(next);
    });
    var after=pseudoCopy(source,'::after');
    if(after)clone.appendChild(after);
    return clone;
  }

  function turn(options){
    var kitchen=options.kitchen,pantry=options.pantry;
    var duration=options.duration||700;
    var side=options.side===-1?-1:1;      // -1: the camera turns to the left (the tavern), 1: to the right (the pantry)
    var originalWidth=innerWidth,originalHeight=innerHeight;
    var templates=[snapshot(kitchen),snapshot(pantry)];
    templates.forEach(function(template){
      Object.assign(template.style,{
        position:'absolute',inset:'auto',left:'0px',top:'0px',
        width:originalWidth+'px',height:originalHeight+'px',
        transform:'none',transformOrigin:'50% 50%',opacity:'1',
        visibility:'visible',display:'block',zIndex:'0',
        overflow:'hidden'
      });
      template.inert=true;
    });
    var stage=document.createElement('div');
    stage.id='pantryCameraTurn';
    stage.setAttribute('aria-hidden','true');
    stage.inert=true;
    var focal=originalWidth/(2*Math.tan(FOV/2));
    var scene=document.getElementById('scene');
    var art=pantry.querySelector('.ps-art');
    var backgrounds=[getComputedStyle(scene).backgroundImage,'url("'+art.src+'")'];
    var views=templates.map(function(template,index){
      var view=document.createElement('div');
      view.className='pantry-camera-view';
      var fill=document.createElement('div');
      fill.className='pantry-camera-edge-fill';
      fill.style.backgroundImage=backgrounds[index];
      view.appendChild(fill);view.appendChild(template);stage.appendChild(view);
      return view;
    });
    stage.dataset.cameraX='0';stage.dataset.cameraY='0';stage.dataset.cameraZ='0';
    stage.dataset.zoom='1';stage.dataset.focalLength=String(focal);
    stage.dataset.cameraHeight=String(originalHeight/2);
    var frame=0,done=false,started=null;
    var finish,reject;
    var finished=new Promise(function(resolve,fail){finish=resolve;reject=fail});
    document.body.classList.add('pantry-turning');
    pantry.appendChild(stage);

    function render(progress){
      var eased=motionProgress(progress,duration);
      var yaw=side*TURN*(options.direction===1?eased:1-eased);
      var fraction=yaw/TURN;
      var mix=smoothstep(.38,.62,fraction);
      var blur=14*(1-smoothstep(0,.22,Math.abs(fraction-.5)));
      // One source is dominant on either side of the central ~80ms swap.
      // Both occupy the SAME screen rectangle: never two adjacent half views.
      views[0].style.opacity='1';
      views[1].style.opacity=String(mix);
      views.forEach(function(view,index){
        var local=yaw-index*TURN*side;
        templates[index].style.transform=yawProjection(local,focal);
        // Feather source-photo boundaries into an ambient edge fill. This
        // covers unavailable off-photo rays without hard trapezoid borders.
        var edge=Math.min(22,Math.abs(local)*60);
        templates[index].style.maskImage=edge<.01?'none':
          'linear-gradient(90deg,transparent,#000 '+edge+'px,#000 calc(100% - '+edge+'px),transparent),'+
          'linear-gradient(0deg,transparent,#000 '+edge+'px,#000 calc(100% - '+edge+'px),transparent)';
        templates[index].style.maskComposite='intersect';
        view.style.filter='blur('+blur.toFixed(3)+'px)';
      });
      stage.dataset.yaw=(yaw*180/Math.PI).toFixed(3);
      stage.dataset.mix=mix.toFixed(3);
      stage.dataset.blur=blur.toFixed(3);
    }
    function tick(now){
      if(done)return;
      try{
        if(started===null)started=now;
        var progress=Math.min(1,(now-started)/duration);
        render(progress);
        if(progress===1){done=true;finish();return}
        frame=requestAnimationFrame(tick);
      }catch(error){done=true;reject(error)}
    }
    function resized(){if(!done){done=true;finish()}}
    window.addEventListener('resize',resized);
    // Decode both sources before exposing the overlay; never show an incomplete
    // clone on the first fast frame, including when loaded from file://.
    try{
      render(0);
      readyImages(stage).then(function(){
        if(done)return;
        pantry.style.opacity='';
        frame=requestAnimationFrame(tick);
      }).catch(function(error){if(!done){done=true;reject(error)}});
    }catch(error){
      stage.remove();document.body.classList.remove('pantry-turning');
      window.removeEventListener('resize',resized);
      throw error;
    }
    return {
      finished:finished,
      cancel:function(){
        cancelAnimationFrame(frame);stage.remove();
        window.removeEventListener('resize',resized);
        document.body.classList.remove('pantry-turning');
        if(!done){done=true;finish()}
      }
    };
  }
  window.CooksterPantryCamera={turn:turn,projectYaw:yawProjection,motionProgress:motionProgress};
})();