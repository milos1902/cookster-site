/* Cookster v133 - collision / footprint resolver.
   All footprint numbers live in CooksterCatalog.COLLISION; game.js only asks for rectangles. */
(function(){
  function cfg(){
    return window.CooksterCatalog?.COLLISION||{};
  }

  function profileNameFor(el){
    if(!el)return 'default';
    if(el.dataset.collisionProfile)return el.dataset.collisionProfile;
    const id=el.dataset.itemId||'';
    return cfg().itemProfiles?.[id]||'default';
  }

  function occupiedRectFor(el){
    if(!el)return null;
    // The parked knife is a child of the board. Its scene-space cx/by remain
    // at the old position when the board moves, so they cannot be used as an
    // independent collision footprint.
    if(el.dataset.itemId==='noz'&&el.dataset.attachedToBoard==='1')return null;
    const profiles=cfg().occupiedProfiles||{};
    const name=profileNameFor(el);
    const p=profiles[name]===undefined?profiles.default:profiles[name];
    if(!p)return null;

    const cx=+el.dataset.cx, by=+el.dataset.by;
    const w=el.offsetWidth, h=el.offsetHeight;
    if(!Number.isFinite(cx)||!Number.isFinite(by)||!w||!h)return null;
    if((el.dataset.itemId||'')==='kamera_stativ'){
      const fw=Math.max(34,w*.38),fh=Math.max(16,h*.075);
      return {left:cx-fw/2,right:cx+fw/2,top:by-fh,bottom:by};
    }
    return {
      left:cx-w*p.left,
      right:cx+w*p.right,
      top:by-h*p.top,
      bottom:by-h*p.bottom
    };
  }

  function candidateRectFor(cand,el,snapProfile){
    if(!cand)return null;

    // Snap profiles already define their physical contact footprint.
    if(snapProfile){
      const fw=cand.w*snapProfile.footW;
      const fh=cand.h*snapProfile.footH;
      return {
        left:cand.cx-fw/2,
        right:cand.cx+fw/2,
        top:cand.by-fh,
        bottom:cand.by
      };
    }

    const profiles=cfg().candidateProfiles||{};
    const id=el?.dataset?.itemId||'';
    if(id==='kamera_stativ'){
      const fw=Math.max(34,cand.w*.38),fh=Math.max(16,cand.h*.075);
      return {left:cand.cx-fw/2,right:cand.cx+fw/2,top:cand.by-fh,bottom:cand.by};
    }
    const name=(el?.dataset?.collisionCandidateProfile)
      ||cfg().candidateItemProfiles?.[id]
      ||'default';
    const p=profiles[name]||profiles.default||{x:.18,top:.34,bottom:.10,minX:8,minTop:6,minBottom:4};

    const px=Math.max(p.minX||0,cand.w*p.x);
    const pyTop=Math.max(p.minTop||0,cand.h*p.top);
    const pyBottom=Math.max(p.minBottom||0,cand.h*p.bottom);
    return {
      left:cand.left+px,
      right:cand.right-px,
      top:cand.top+pyTop,
      bottom:cand.bottom-pyBottom
    };
  }

  function tag(el,name){
    if(el&&name)el.dataset.collisionProfile=name;
    return el;
  }

  window.CooksterCollision={
    profileNameFor,
    occupiedRectFor,
    candidateRectFor,
    tag
  };
})();