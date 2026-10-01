(() => {
  'use strict';

  const canvas = document.getElementById('pose2dCanvas');
  const ctx = canvas.getContext('2d');
  const stageWrap = document.getElementById('stage2dWrap');
  const status = document.getElementById('status2d');
  const $ = (id) => document.getElementById(id);

  const JOINTS = [
    { id:'nose', label:'鼻' }, { id:'neck', label:'首' },
    { id:'r_shoulder', label:'右肩' }, { id:'r_elbow', label:'右ひじ' }, { id:'r_wrist', label:'右手首' },
    { id:'l_shoulder', label:'左肩' }, { id:'l_elbow', label:'左ひじ' }, { id:'l_wrist', label:'左手首' },
    { id:'r_hip', label:'右股' }, { id:'r_knee', label:'右膝' }, { id:'r_ankle', label:'右足首' },
    { id:'l_hip', label:'左股' }, { id:'l_knee', label:'左膝' }, { id:'l_ankle', label:'左足首' },
    { id:'r_eye', label:'右目' }, { id:'l_eye', label:'左目' }, { id:'r_ear', label:'右耳' }, { id:'l_ear', label:'左耳' }
  ];

  const LIMBS = [
    ['neck','r_shoulder','#ff4f4f'], ['r_shoulder','r_elbow','#ff8a36'], ['r_elbow','r_wrist','#ffd43b'],
    ['neck','l_shoulder','#49d363'], ['l_shoulder','l_elbow','#3ddbd9'], ['l_elbow','l_wrist','#44a3ff'],
    ['neck','r_hip','#b47cff'], ['r_hip','r_knee','#ff6bd6'], ['r_knee','r_ankle','#ff4f93'],
    ['neck','l_hip','#7ae582'], ['l_hip','l_knee','#00d4ff'], ['l_knee','l_ankle','#2f80ed'],
    ['r_hip','l_hip','#ffffff'], ['neck','nose','#ffffff'],
    ['nose','r_eye','#ffcc00'], ['r_eye','r_ear','#ffcc00'], ['nose','l_eye','#7fff00'], ['l_eye','l_ear','#7fff00']
  ];

  const MIRROR_PAIRS = {
    r_shoulder:'l_shoulder', r_elbow:'l_elbow', r_wrist:'l_wrist',
    r_hip:'l_hip', r_knee:'l_knee', r_ankle:'l_ankle', r_eye:'l_eye', r_ear:'l_ear',
    l_shoulder:'r_shoulder', l_elbow:'r_elbow', l_wrist:'r_wrist',
    l_hip:'r_hip', l_knee:'r_knee', l_ankle:'r_ankle', l_eye:'r_eye', l_ear:'r_ear'
  };

  const FIXED_PARENT = {
    r_shoulder:'neck', r_elbow:'r_shoulder', r_wrist:'r_elbow',
    l_shoulder:'neck', l_elbow:'l_shoulder', l_wrist:'l_elbow',
    r_knee:'r_hip', r_ankle:'r_knee',
    l_knee:'l_hip', l_ankle:'l_knee',
    nose:'neck', r_eye:'nose', l_eye:'nose', r_ear:'r_eye', l_ear:'l_eye'
  };

  const FOLLOWERS = {
    r_shoulder:['r_elbow','r_wrist'], r_elbow:['r_wrist'],
    l_shoulder:['l_elbow','l_wrist'], l_elbow:['l_wrist'],
    r_hip:['r_knee','r_ankle'], r_knee:['r_ankle'],
    l_hip:['l_knee','l_ankle'], l_knee:['l_ankle'],
    nose:['r_eye','l_eye','r_ear','l_ear'],
    r_eye:['r_ear'], l_eye:['l_ear']
  };

  let boneLengths = {};

  const n = (x,y) => ({x,y});
  const PRESETS = {
    standing_front:{
      nose:n(.50,.16), neck:n(.50,.25),
      r_shoulder:n(.43,.27), r_elbow:n(.38,.43), r_wrist:n(.36,.59),
      l_shoulder:n(.57,.27), l_elbow:n(.62,.43), l_wrist:n(.64,.59),
      r_hip:n(.46,.52), r_knee:n(.44,.73), r_ankle:n(.43,.91),
      l_hip:n(.54,.52), l_knee:n(.56,.73), l_ankle:n(.57,.91),
      r_eye:n(.485,.145), l_eye:n(.515,.145), r_ear:n(.455,.155), l_ear:n(.545,.155)
    },
    arms_up:{
      nose:n(.50,.16), neck:n(.50,.25),
      r_shoulder:n(.43,.27), r_elbow:n(.36,.18), r_wrist:n(.32,.08),
      l_shoulder:n(.57,.27), l_elbow:n(.64,.18), l_wrist:n(.68,.08),
      r_hip:n(.46,.52), r_knee:n(.44,.73), r_ankle:n(.43,.91),
      l_hip:n(.54,.52), l_knee:n(.56,.73), l_ankle:n(.57,.91),
      r_eye:n(.485,.145), l_eye:n(.515,.145), r_ear:n(.455,.155), l_ear:n(.545,.155)
    },
    walking:{
      nose:n(.50,.16), neck:n(.50,.25),
      r_shoulder:n(.43,.27), r_elbow:n(.35,.37), r_wrist:n(.41,.49),
      l_shoulder:n(.57,.27), l_elbow:n(.66,.37), l_wrist:n(.60,.51),
      r_hip:n(.46,.52), r_knee:n(.38,.72), r_ankle:n(.33,.90),
      l_hip:n(.54,.52), l_knee:n(.64,.69), l_ankle:n(.71,.88),
      r_eye:n(.485,.145), l_eye:n(.515,.145), r_ear:n(.455,.155), l_ear:n(.545,.155)
    },
    sitting_chair:{
      nose:n(.50,.16), neck:n(.50,.25),
      r_shoulder:n(.43,.28), r_elbow:n(.39,.43), r_wrist:n(.43,.55),
      l_shoulder:n(.57,.28), l_elbow:n(.61,.43), l_wrist:n(.57,.55),
      r_hip:n(.45,.52), r_knee:n(.36,.68), r_ankle:n(.33,.86),
      l_hip:n(.55,.52), l_knee:n(.64,.68), l_ankle:n(.67,.86),
      r_eye:n(.485,.145), l_eye:n(.515,.145), r_ear:n(.455,.155), l_ear:n(.545,.155)
    },
    straddling_chair:{
      nose:n(.50,.15), neck:n(.50,.25),
      r_shoulder:n(.42,.28), r_elbow:n(.38,.42), r_wrist:n(.45,.50),
      l_shoulder:n(.58,.28), l_elbow:n(.62,.42), l_wrist:n(.55,.50),
      r_hip:n(.44,.52), r_knee:n(.29,.69), r_ankle:n(.24,.90),
      l_hip:n(.56,.52), l_knee:n(.71,.69), l_ankle:n(.76,.90),
      r_eye:n(.485,.135), l_eye:n(.515,.135), r_ear:n(.455,.15), l_ear:n(.545,.15)
    },
    crouch:{
      nose:n(.50,.23), neck:n(.50,.32),
      r_shoulder:n(.42,.34), r_elbow:n(.34,.49), r_wrist:n(.38,.63),
      l_shoulder:n(.58,.34), l_elbow:n(.66,.49), l_wrist:n(.62,.63),
      r_hip:n(.44,.56), r_knee:n(.32,.70), r_ankle:n(.39,.87),
      l_hip:n(.56,.56), l_knee:n(.68,.70), l_ankle:n(.61,.87),
      r_eye:n(.485,.215), l_eye:n(.515,.215), r_ear:n(.455,.23), l_ear:n(.545,.23)
    },
    side_view:{
      nose:n(.55,.16), neck:n(.50,.25),
      r_shoulder:n(.48,.28), r_elbow:n(.46,.43), r_wrist:n(.48,.58),
      l_shoulder:n(.52,.28), l_elbow:n(.56,.43), l_wrist:n(.58,.58),
      r_hip:n(.48,.52), r_knee:n(.46,.73), r_ankle:n(.45,.91),
      l_hip:n(.52,.52), l_knee:n(.57,.72), l_ankle:n(.60,.90),
      r_eye:n(.545,.145), l_eye:n(.565,.145), r_ear:n(.505,.155), l_ear:n(.525,.155)
    }
  };

  const state = {
    points:{},
    selected:null,
    dragging:false,
    referenceImage:null,
    referenceVisible:true,
    referenceName:'',
    settings:{
      width:1024, height:1024, drawMode:'openpose', background:'black',
      lineWidth:10, jointSize:13, showGrid:true, showJoints:true, showLabels:false,
      mirror:false, lockBoneLengths:true, chairGuide:false, keepInside:true, referenceOpacity:.35, referenceFit:'contain'
    }
  };

  function say(text){ status.textContent=text; }
  function clone(value){ return JSON.parse(JSON.stringify(value)); }
  function clamp(v,a,b){ return Math.min(b,Math.max(a,v)); }

  function clonePreset(key){
    const preset=PRESETS[key]||PRESETS.standing_front;
    const points={};
    JOINTS.forEach((joint)=>{
      const p=preset[joint.id]||PRESETS.standing_front[joint.id];
      points[joint.id]={x:p.x*canvas.width,y:p.y*canvas.height};
    });
    return points;
  }

  function captureBoneLengths(){
    const next={};
    Object.entries(FIXED_PARENT).forEach(([child,parent])=>{
      const a=state.points[parent],b=state.points[child];
      if(a&&b) next[child]=Math.hypot(b.x-a.x,b.y-a.y);
    });
    boneLengths=next;
  }

  function translateFollowers(id,dx,dy){
    (FOLLOWERS[id]||[]).forEach((child)=>{
      const p=state.points[child];
      if(!p) return;
      p.x+=dx;
      p.y+=dy;
    });
  }

  function constrainedTarget(id,x,y){
    let tx=x,ty=y;
    if(state.settings.keepInside){
      tx=clamp(tx,0,canvas.width);
      ty=clamp(ty,0,canvas.height);
    }
    if(!state.settings.lockBoneLengths) return {x:tx,y:ty};
    const parentId=FIXED_PARENT[id];
    const parent=parentId&&state.points[parentId];
    const length=boneLengths[id];
    if(!parent||!Number.isFinite(length)||length<=0) return {x:tx,y:ty};
    let dx=tx-parent.x,dy=ty-parent.y;
    let dist=Math.hypot(dx,dy);
    if(dist<.0001){
      const current=state.points[id];
      dx=current.x-parent.x;
      dy=current.y-parent.y;
      dist=Math.hypot(dx,dy)||1;
    }
    return {
      x:parent.x+dx/dist*length,
      y:parent.y+dy/dist*length
    };
  }

  function moveSingleJoint(id,x,y,translateChildren=true){
    const p=state.points[id];
    if(!p) return;
    const before={x:p.x,y:p.y};
    const target=constrainedTarget(id,x,y);
    p.x=target.x;
    p.y=target.y;
    const dx=p.x-before.x,dy=p.y-before.y;
    if(state.settings.lockBoneLengths&&translateChildren) translateFollowers(id,dx,dy);
  }

  function backgroundColor(){
    if(state.settings.background==='white') return '#fff';
    if(state.settings.background==='gray') return '#808080';
    if(state.settings.background==='transparent') return null;
    return '#000';
  }

  function drawBackground(target,w,h){
    const bg=backgroundColor();
    if(bg){target.fillStyle=bg;target.fillRect(0,0,w,h);}
    else target.clearRect(0,0,w,h);
  }

  function drawGrid(target,w,h){
    if(!state.settings.showGrid) return;
    target.save();
    target.globalAlpha=.20;
    target.strokeStyle=state.settings.background==='white'?'#777':'#fff';
    target.lineWidth=1;
    const step=Math.max(32,Math.round(Math.min(w,h)/16));
    for(let x=0;x<=w;x+=step){target.beginPath();target.moveTo(x,0);target.lineTo(x,h);target.stroke();}
    for(let y=0;y<=h;y+=step){target.beginPath();target.moveTo(0,y);target.lineTo(w,y);target.stroke();}
    target.globalAlpha=.35;
    target.beginPath();
    target.moveTo(w/2,0);target.lineTo(w/2,h);
    target.moveTo(0,h/2);target.lineTo(w,h/2);target.stroke();
    target.restore();
  }

  function drawReference(target,w,h){
    if(!state.referenceImage||!state.referenceVisible) return;
    const img=state.referenceImage;
    let x=0,y=0,dw=w,dh=h;
    if(state.settings.referenceFit!=='stretch'){
      const contain=Math.min(w/img.width,h/img.height);
      const cover=Math.max(w/img.width,h/img.height);
      const s=state.settings.referenceFit==='cover'?cover:contain;
      dw=img.width*s;dh=img.height*s;x=(w-dw)/2;y=(h-dh)/2;
    }
    target.save();
    target.globalAlpha=state.settings.referenceOpacity;
    target.drawImage(img,x,y,dw,dh);
    target.restore();
  }

  function drawChairGuide(target){
    if(!state.settings.chairGuide) return;
    const w=canvas.width,h=canvas.height;
    target.save();
    target.strokeStyle=state.settings.background==='white'?'rgba(0,0,0,.38)':'rgba(255,255,255,.42)';
    target.lineWidth=Math.max(3,state.settings.lineWidth/2);
    target.setLineDash([12,10]);
    target.strokeRect(w*.36,h*.50,w*.28,h*.08);
    target.beginPath();
    target.moveTo(w*.40,h*.58);target.lineTo(w*.36,h*.86);
    target.moveTo(w*.60,h*.58);target.lineTo(w*.64,h*.86);
    target.moveTo(w*.50,h*.50);target.lineTo(w*.50,h*.30);
    target.stroke();
    target.restore();
  }

  function limbColor(color){
    if(state.settings.drawMode==='openpose') return color;
    if(state.settings.drawMode==='white_stick') return '#fff';
    return '#111';
  }

  function drawSilhouette(target){
    const p=state.points;
    const lw=Number(state.settings.lineWidth)*2.4;
    const head=Math.max(28,canvas.width*.045);
    const lines=[
      ['neck','r_shoulder'],['r_shoulder','r_elbow'],['r_elbow','r_wrist'],
      ['neck','l_shoulder'],['l_shoulder','l_elbow'],['l_elbow','l_wrist'],
      ['neck','r_hip'],['r_hip','r_knee'],['r_knee','r_ankle'],
      ['neck','l_hip'],['l_hip','l_knee'],['l_knee','l_ankle'],['r_hip','l_hip']
    ];
    target.save();
    target.lineCap='round';target.lineJoin='round';
    target.strokeStyle='#111';target.fillStyle='#111';target.lineWidth=lw;
    target.beginPath();target.arc(p.nose.x,p.nose.y+head*.15,head,0,Math.PI*2);target.fill();
    lines.forEach(([a,b])=>{target.beginPath();target.moveTo(p[a].x,p[a].y);target.lineTo(p[b].x,p[b].y);target.stroke();});
    target.restore();
  }

  function drawSkeleton(target){
    if(state.settings.drawMode==='silhouette'){drawSilhouette(target);return;}
    target.save();
    target.lineCap='round';target.lineJoin='round';
    LIMBS.forEach(([a,b,color])=>{
      const pa=state.points[a],pb=state.points[b];
      target.strokeStyle=limbColor(color);
      target.lineWidth=Number(state.settings.lineWidth);
      target.beginPath();target.moveTo(pa.x,pa.y);target.lineTo(pb.x,pb.y);target.stroke();
    });
    if(state.settings.showJoints){
      JOINTS.forEach((joint)=>{
        const p=state.points[joint.id];
        target.beginPath();
        target.fillStyle=joint.id===state.selected?'#b5483f':(state.settings.drawMode==='white_stick'?'#fff':'#f4efe7');
        target.strokeStyle=state.settings.drawMode==='white_stick'?'#222':'#6f4729';
        target.lineWidth=2;
        target.arc(p.x,p.y,Number(state.settings.jointSize),0,Math.PI*2);
        target.fill();target.stroke();
      });
    }
    if(state.settings.showLabels){
      target.font=`${Math.max(12,Math.round(canvas.width/80))}px sans-serif`;
      target.textBaseline='middle';
      JOINTS.forEach((joint)=>{
        const p=state.points[joint.id];
        target.fillStyle=state.settings.background==='white'?'#222':'#fff';
        target.fillText(joint.label,p.x+Number(state.settings.jointSize)+4,p.y);
      });
    }
    target.restore();
  }

  function render(){
    drawBackground(ctx,canvas.width,canvas.height);
    drawReference(ctx,canvas.width,canvas.height);
    drawGrid(ctx,canvas.width,canvas.height);
    drawChairGuide(ctx);
    drawSkeleton(ctx);
    syncSelectedControls();
  }

  function normalizedPoints(){
    const out={};
    JOINTS.forEach((joint)=>{
      const p=state.points[joint.id];
      out[joint.id]={x:+(p.x/canvas.width).toFixed(6),y:+(p.y/canvas.height).toFixed(6)};
    });
    return out;
  }

  function getState(){
    return {
      settings:clone(state.settings),
      points:normalizedPoints()
    };
  }

  const HISTORY_LIMIT=50;
  let historyPast=[];
  let historyFuture=[];
  let gestureBefore=null;

  function stateKey(value){
    return JSON.stringify(value);
  }

  function emitHistory(){
    window.dispatchEvent(new CustomEvent('posestudio:historychange',{
      detail:{mode:'2d',canUndo:historyPast.length>0,canRedo:historyFuture.length>0}
    }));
  }

  function resetHistory(){
    historyPast=[];
    historyFuture=[];
    gestureBefore=null;
    emitHistory();
  }

  function commitBefore(before){
    const after=getState();
    if(!before||stateKey(before)===stateKey(after)) return false;
    historyPast.push(before);
    if(historyPast.length>HISTORY_LIMIT) historyPast.shift();
    historyFuture=[];
    emitHistory();
    return true;
  }

  function restoreState(data={}){
    const width=Number(data.settings?.width||data.width||canvas.width);
    const height=Number(data.settings?.height||data.height||canvas.height);
    canvas.width=clamp(width,256,2048);
    canvas.height=clamp(height,256,2048);
    state.settings={...state.settings,...(data.settings||{}),width:canvas.width,height:canvas.height};
    const source=data.points||{};
    state.points={};
    JOINTS.forEach((joint)=>{
      const p=source[joint.id]||PRESETS.standing_front[joint.id];
      const normalized=(p.x<=1.2&&p.y<=1.2);
      state.points[joint.id]={
        x:normalized?p.x*canvas.width:p.x,
        y:normalized?p.y*canvas.height:p.y
      };
    });
    captureBoneLengths();
    syncControls();
    fitCanvasCss();
    render();
  }

  function setState(data={},options={}){
    restoreState(data);
    if(options.resetHistory!==false) resetHistory();
  }

  function undo(){
    if(!historyPast.length) return false;
    const current=getState();
    const previous=historyPast.pop();
    historyFuture.push(current);
    restoreState(previous);
    emitHistory();
    say('元に戻しました');
    return true;
  }

  function redo(){
    if(!historyFuture.length) return false;
    const current=getState();
    const next=historyFuture.pop();
    historyPast.push(current);
    restoreState(next);
    emitHistory();
    say('やり直しました');
    return true;
  }

  function loadProjected(points){
    const data={};
    JOINTS.forEach((joint)=>{
      const p=points[joint.id]||PRESETS.standing_front[joint.id];
      data[joint.id]={x:clamp(p.x,0,1),y:clamp(p.y,0,1)};
    });
    setState({settings:state.settings,points:data});
    say('3Dの現在視点を2Dへ反映しました。ここから関節を微調整できます。');
  }

  function applyPreset(key,options={}){
    const before=options.record===false?null:getState();
    state.points=clonePreset(key);
    captureBoneLengths();
    state.selected=null;
    render();
    if(before) commitBefore(before);
    say('プリセットを適用しました');
  }

  function setCanvasSize(w,h){
    const before=getState();
    const oldW=canvas.width,oldH=canvas.height;
    canvas.width=clamp(Number(w)||1024,256,2048);
    canvas.height=clamp(Number(h)||1024,256,2048);
    const sx=canvas.width/oldW,sy=canvas.height/oldH;
    Object.values(state.points).forEach((p)=>{p.x*=sx;p.y*=sy;});
    state.settings.width=canvas.width;state.settings.height=canvas.height;
    captureBoneLengths();
    fitCanvasCss();render();
    commitBefore(before);
  }

  function fitCanvasCss(){
    const maxW=Math.max(280,stageWrap.clientWidth-48);
    const maxH=Math.max(380,stageWrap.clientHeight-48);
    const scale=Math.min(maxW/canvas.width,maxH/canvas.height,1);
    canvas.style.width=`${Math.round(canvas.width*scale)}px`;
    canvas.style.height=`${Math.round(canvas.height*scale)}px`;
  }

  function canvasPoint(evt){
    const rect=canvas.getBoundingClientRect();
    const clientX=evt.touches?.[0]?.clientX??evt.clientX;
    const clientY=evt.touches?.[0]?.clientY??evt.clientY;
    return {
      x:(clientX-rect.left)*canvas.width/rect.width,
      y:(clientY-rect.top)*canvas.height/rect.height
    };
  }

  function nearestJoint(point){
    let best=null,dist=Infinity;
    JOINTS.forEach((joint)=>{
      const p=state.points[joint.id];
      const d=Math.hypot(p.x-point.x,p.y-point.y);
      if(d<dist){dist=d;best=joint.id;}
    });
    return dist<=Math.max(28,state.settings.jointSize*2.4)?best:null;
  }

  function clampPoint(p){
    if(!state.settings.keepInside) return;
    p.x=clamp(p.x,0,canvas.width);
    p.y=clamp(p.y,0,canvas.height);
  }

  function moveJoint(id,x,y){
    moveSingleJoint(id,x,y,true);
    if(state.settings.mirror&&MIRROR_PAIRS[id]){
      const mirrorId=MIRROR_PAIRS[id];
      const source=state.points[id];
      moveSingleJoint(mirrorId,canvas.width-source.x,source.y,true);
    }
  }

  function pointerDown(evt){
    evt.preventDefault();
    const point=canvasPoint(evt);
    state.selected=nearestJoint(point);
    state.dragging=!!state.selected;
    gestureBefore=state.dragging?getState():null;
    render();
  }

  function pointerMove(evt){
    if(!state.dragging||!state.selected) return;
    evt.preventDefault();
    const p=canvasPoint(evt);
    moveJoint(state.selected,p.x,p.y);
    render();
  }

  function pointerUp(){
    if(state.dragging&&gestureBefore) commitBefore(gestureBefore);
    gestureBefore=null;
    state.dragging=false;
  }

  function syncSelectedControls(){
    const joint=JOINTS.find((item)=>item.id===state.selected);
    $('selectedJoint2d').textContent=joint?joint.label:'未選択';
    if(joint){
      $('joint2dX').value=Math.round(state.points[joint.id].x);
      $('joint2dY').value=Math.round(state.points[joint.id].y);
    }else{
      $('joint2dX').value='';$('joint2dY').value='';
    }
  }

  function syncFromControls(){
    state.settings.drawMode=$('drawMode2d').value;
    state.settings.background=$('background2d').value;
    state.settings.lineWidth=Number($('lineWidth2d').value);
    state.settings.jointSize=Number($('jointSize2d').value);
    state.settings.showGrid=$('showGrid2d').checked;
    state.settings.showJoints=$('showJoints2d').checked;
    state.settings.showLabels=$('showLabels2d').checked;
    state.settings.mirror=$('mirror2d').checked;
    state.settings.lockBoneLengths=$('lockBoneLengths2d').checked;
    state.settings.chairGuide=$('chairGuide2d').checked;
    state.settings.keepInside=$('keepInside2d').checked;
    state.settings.referenceOpacity=Number($('referenceOpacity2d').value)/100;
    state.settings.referenceFit=$('referenceFit2d').value;
    render();
  }

  function syncControls(){
    $('canvas2dWidth').value=canvas.width;$('canvas2dHeight').value=canvas.height;
    $('drawMode2d').value=state.settings.drawMode;$('background2d').value=state.settings.background;
    $('lineWidth2d').value=state.settings.lineWidth;$('jointSize2d').value=state.settings.jointSize;
    $('showGrid2d').checked=state.settings.showGrid;$('showJoints2d').checked=state.settings.showJoints;
    $('showLabels2d').checked=state.settings.showLabels;$('mirror2d').checked=state.settings.mirror;
    $('lockBoneLengths2d').checked=state.settings.lockBoneLengths!==false;
    $('chairGuide2d').checked=state.settings.chairGuide;$('keepInside2d').checked=state.settings.keepInside;
    $('referenceOpacity2d').value=Math.round(state.settings.referenceOpacity*100);
    $('referenceFit2d').value=state.settings.referenceFit;
  }

  function centerPose(){
    const before=getState();
    const values=Object.values(state.points);
    const xs=values.map(p=>p.x),ys=values.map(p=>p.y);
    const dx=canvas.width/2-(Math.min(...xs)+Math.max(...xs))/2;
    const dy=canvas.height/2-(Math.min(...ys)+Math.max(...ys))/2;
    values.forEach((p)=>{p.x+=dx;p.y+=dy;clampPoint(p);});
    render();
    commitBefore(before);
  }

  function flipPose(){
    const historyBefore=getState();
    Object.values(state.points).forEach((p)=>{p.x=canvas.width-p.x;});
    const before=clone(state.points);
    Object.entries(MIRROR_PAIRS).forEach(([a,b])=>{state.points[a]=clone(before[b]);});
    render();
    commitBefore(historyBefore);
  }

  function download(blob,name){
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }

  function exportPng(){
    canvas.toBlob((blob)=>blob&&download(blob,'pose_2d.png'),'image/png');
    say('PNGを保存しました');
  }

  function makeSvg(){
    const w=canvas.width,h=canvas.height,bg=backgroundColor();
    const lines=[];
    lines.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`);
    if(bg) lines.push(`<rect width="100%" height="100%" fill="${bg}"/>`);
    if(state.settings.drawMode==='silhouette'){
      const p=state.points,lw=Number(state.settings.lineWidth)*2.4,head=Math.max(28,w*.045);
      lines.push(`<g stroke="#111" fill="#111" stroke-linecap="round" stroke-linejoin="round" stroke-width="${lw}">`);
      lines.push(`<circle cx="${p.nose.x}" cy="${p.nose.y+head*.15}" r="${head}"/>`);
      [['neck','r_shoulder'],['r_shoulder','r_elbow'],['r_elbow','r_wrist'],['neck','l_shoulder'],['l_shoulder','l_elbow'],['l_elbow','l_wrist'],['neck','r_hip'],['r_hip','r_knee'],['r_knee','r_ankle'],['neck','l_hip'],['l_hip','l_knee'],['l_knee','l_ankle'],['r_hip','l_hip']].forEach(([a,b])=>lines.push(`<line x1="${p[a].x}" y1="${p[a].y}" x2="${p[b].x}" y2="${p[b].y}"/>`));
      lines.push('</g>');
    }else{
      lines.push('<g fill="none" stroke-linecap="round" stroke-linejoin="round">');
      LIMBS.forEach(([a,b,color])=>lines.push(`<line x1="${state.points[a].x}" y1="${state.points[a].y}" x2="${state.points[b].x}" y2="${state.points[b].y}" stroke="${limbColor(color)}" stroke-width="${state.settings.lineWidth}"/>`));
      lines.push('</g>');
    }
    lines.push('</svg>');
    return lines.join('\n');
  }

  function exportSvg(){
    download(new Blob([makeSvg()],{type:'image/svg+xml'}),'pose_2d.svg');
    say('SVGを保存しました');
  }

  function openPosePayload(){
    const order=['nose','neck','r_shoulder','r_elbow','r_wrist','l_shoulder','l_elbow','l_wrist','r_hip','r_knee','r_ankle','l_hip','l_knee','l_ankle','r_eye','l_eye','r_ear','l_ear'];
    const flat=[];
    order.forEach((id)=>{const p=state.points[id];flat.push(+p.x.toFixed(2),+p.y.toFixed(2),1);});
    return {version:1.3,canvas_width:canvas.width,canvas_height:canvas.height,people:[{person_id:[-1],pose_keypoints_2d:flat}]};
  }

  function exportOpenPoseJson(){
    download(new Blob([JSON.stringify(openPosePayload(),null,2)],{type:'application/json'}),'pose_openpose.json');
    say('OpenPose JSONを保存しました');
  }

  function exportData(){
    download(new Blob([JSON.stringify({app:'pose-studio',mode:'2d',version:1,...getState()},null,2)],{type:'application/json'}),'pose_2d_data.json');
    say('2DポーズJSONを保存しました');
  }

  function loadReference(file){
    const reader=new FileReader();
    reader.onload=()=>{
      const img=new Image();
      img.onload=()=>{state.referenceImage=img;state.referenceVisible=true;state.referenceName=file.name;render();say('下絵を読み込みました');};
      img.src=reader.result;
    };
    reader.readAsDataURL(file);
  }

  function nudge(dx,dy){
    if(!state.selected) return;
    const before=getState();
    const p=state.points[state.selected];
    moveJoint(state.selected,p.x+dx,p.y+dy);
    render();
    commitBefore(before);
  }

  function bind(){
    canvas.addEventListener('mousedown',pointerDown);
    canvas.addEventListener('mousemove',pointerMove);
    window.addEventListener('mouseup',pointerUp);
    canvas.addEventListener('touchstart',pointerDown,{passive:false});
    canvas.addEventListener('touchmove',pointerMove,{passive:false});
    window.addEventListener('touchend',pointerUp);

    $('applyPreset2dButton').addEventListener('click',()=>applyPreset($('preset2dSelect').value));
    $('canvas2dWidth').addEventListener('change',()=>setCanvasSize($('canvas2dWidth').value,canvas.height));
    $('canvas2dHeight').addEventListener('change',()=>setCanvasSize(canvas.width,$('canvas2dHeight').value));
    ['drawMode2d','background2d','lineWidth2d','jointSize2d','showGrid2d','showJoints2d','showLabels2d','mirror2d','lockBoneLengths2d','chairGuide2d','keepInside2d','referenceOpacity2d','referenceFit2d'].forEach((id)=>{
      $(id).addEventListener('input',syncFromControls);$(id).addEventListener('change',syncFromControls);
    });
    $('center2dButton').addEventListener('click',centerPose);
    $('flip2dButton').addEventListener('click',flipPose);
    $('reset2dButton').addEventListener('click',()=>applyPreset('standing_front'));
    $('clearSelection2dButton').addEventListener('click',()=>{state.selected=null;render();});
    $('applyJoint2dButton').addEventListener('click',()=>{
      if(!state.selected)return;
      const before=getState();
      moveJoint(state.selected,Number($('joint2dX').value),Number($('joint2dY').value));
      render();
      commitBefore(before);
    });
    $('reference2dInput').addEventListener('change',(e)=>{const file=e.target.files?.[0];if(file)loadReference(file);});
    $('toggleReference2dButton').addEventListener('click',()=>{state.referenceVisible=!state.referenceVisible;render();});
    $('clearReference2dButton').addEventListener('click',()=>{state.referenceImage=null;state.referenceName='';$('reference2dInput').value='';render();});
    $('export2dPngButton').addEventListener('click',exportPng);
    $('export2dSvgButton').addEventListener('click',exportSvg);
    $('export2dOpenPoseJsonButton').addEventListener('click',exportOpenPoseJson);
    $('export2dDataButton').addEventListener('click',exportData);

    document.addEventListener('keydown',(e)=>{
      const tag=document.activeElement?.tagName?.toLowerCase();
      if(tag==='input'||tag==='select'||tag==='textarea') return;
      const step=e.shiftKey?10:2;
      if(e.key==='ArrowLeft'){e.preventDefault();nudge(-step,0);}
      if(e.key==='ArrowRight'){e.preventDefault();nudge(step,0);}
      if(e.key==='ArrowUp'){e.preventDefault();nudge(0,-step);}
      if(e.key==='ArrowDown'){e.preventDefault();nudge(0,step);}
      if(e.key==='Escape'){state.selected=null;render();}
    });

    if(typeof ResizeObserver!=='undefined') new ResizeObserver(fitCanvasCss).observe(stageWrap);
    window.addEventListener('resize',fitCanvasCss);
  }

  state.points=clonePreset('standing_front');
  captureBoneLengths();
  syncControls();
  bind();
  fitCanvasCss();
  render();
  resetHistory();

  function currentBoneLengths(){
    const pairs={
      upperArmR:['r_shoulder','r_elbow'],forearmR:['r_elbow','r_wrist'],
      upperArmL:['l_shoulder','l_elbow'],forearmL:['l_elbow','l_wrist'],
      thighR:['r_hip','r_knee'],shinR:['r_knee','r_ankle'],
      thighL:['l_hip','l_knee'],shinL:['l_knee','l_ankle']
    };
    return Object.fromEntries(Object.entries(pairs).map(([key,[a,b]])=>[
      key,Math.hypot(state.points[b].x-state.points[a].x,state.points[b].y-state.points[a].y)
    ]));
  }

  window.PoseStudio2D=Object.freeze({
    JOINTS,
    getState,
    setState,
    loadProjected,
    moveJoint,
    undo,
    redo,
    canUndo:()=>historyPast.length>0,
    canRedo:()=>historyFuture.length>0,
    getBoneLengths:currentBoneLengths,
    renderPreview(targetCanvas,poseState){
      const c=targetCanvas,x=c.getContext('2d'),data=poseState?.points||{};
      x.fillStyle='#292c31';x.fillRect(0,0,c.width,c.height);
      x.strokeStyle='#eee';x.lineCap='round';x.lineWidth=Math.max(2,c.width/45);
      const p={};
      JOINTS.forEach((j)=>{const q=data[j.id]||PRESETS.standing_front[j.id];p[j.id]={x:q.x*c.width,y:q.y*c.height};});
      LIMBS.forEach(([a,b])=>{x.beginPath();x.moveTo(p[a].x,p[a].y);x.lineTo(p[b].x,p[b].y);x.stroke();});
      x.fillStyle='#d5ccc0';
      JOINTS.forEach((j)=>{x.beginPath();x.arc(p[j.id].x,p[j.id].y,Math.max(2,c.width/55),0,Math.PI*2);x.fill();});
    }
  });
})();
