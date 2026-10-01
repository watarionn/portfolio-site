(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const D = Math.PI / 180;
  const clamp = (v,a,b) => Math.min(b,Math.max(a,v));
  const sleep = (ms) => new Promise((resolve)=>setTimeout(resolve,ms));
  const stage = $('stage3d');
  const status = $('status3d');
  const say = (text) => { status.textContent = text; };

  if (typeof THREE === 'undefined') {
    say('Three.jsを読み込めませんでした。ネットワーク接続を確認して再読み込みしてください。');
    window.PoseStudio3D = null;
    return;
  }

  const renderer = new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.setClearColor(0x000000,0);
  const canvas = renderer.domElement;
  stage.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30,1,.1,50);
  scene.add(new THREE.HemisphereLight(0xffffff,0x777777,1.0));
  const light1 = new THREE.DirectionalLight(0xffffff,.85); light1.position.set(2,4,3); scene.add(light1);
  const light2 = new THREE.DirectionalLight(0xffffff,.42); light2.position.set(-2,2,-3); scene.add(light2);

  const grid = new THREE.GridHelper(3,12,0x9ca2a8,0x5e646c);
  grid.material.transparent=true;
  grid.material.opacity=.42;
  scene.add(grid);

  const target = new THREE.Vector3(0,.88,0);
  const cam = {az:0,el:.1,dist:4.2};

  function placeCamera(){
    const c=Math.cos(cam.el);
    camera.position.set(
      target.x+cam.dist*Math.sin(cam.az)*c,
      target.y+cam.dist*Math.sin(cam.el),
      target.z+cam.dist*Math.cos(cam.az)*c
    );
    camera.lookAt(target);
    camera.updateMatrixWorld(true);
  }

  let dirty=false;
  function draw(){
    if(dirty) return;
    dirty=true;
    requestAnimationFrame(()=>{
      dirty=false;
      renderer.render(scene,camera);
    });
  }

  function fit(){
    const w=stage.clientWidth,h=stage.clientHeight;
    if(w<2||h<2) return;
    renderer.setSize(w,h,false);
    camera.aspect=w/h;
    camera.updateProjectionMatrix();
    placeCamera();
    draw();
  }

  const COLORS = {
    body:0xb9b7b1,
    body2:0xa9a7a2,
    marker:0x39a9c8,
    selected:0x9b4b3d
  };
  const material = (color) => new THREE.MeshLambertMaterial({color,side:THREE.DoubleSide});
  const joints={};
  const markers=[];
  const pickTargets=[];
  const root=new THREE.Group();
  scene.add(root);

  function mesh(geometry,color,parent,x=0,y=0,z=0){
    const m=new THREE.Mesh(geometry,material(color));
    m.position.set(x,y,z);
    parent.add(m);
    return m;
  }

  function joint(name,label,parent,x,y,z,r=.025){
    const group=new THREE.Group();
    group.position.set(x,y,z);
    parent.add(group);

    const marker=new THREE.Mesh(
      new THREE.SphereGeometry(r*2.35,12,8),
      new THREE.MeshBasicMaterial({color:COLORS.marker,transparent:true,opacity:.82,depthTest:false})
    );
    marker.renderOrder=10;
    marker.userData.joint=name;
    group.add(marker);
    markers.push(marker);

    const hitTarget=new THREE.Mesh(
      new THREE.SphereGeometry(r*4.8,10,8),
      new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,depthTest:false})
    );
    hitTarget.userData.joint=name;
    hitTarget.renderOrder=11;
    group.add(hitTarget);
    pickTargets.push(hitTarget);

    joints[name]={g:group,label,marker,hitTarget};
    return group;
  }

  function segment(parent,len,rTop,rBottom,color,dir){
    return mesh(new THREE.CylinderGeometry(rTop,rBottom,len,14),color,parent,0,dir*len/2,0);
  }

  const hips=joint('hips','腰',root,0,1.02,0,.03);
  mesh(new THREE.SphereGeometry(.19,18,12),COLORS.body2,hips,0,-.02,0).scale.set(1.05,.72,.72);

  const spine=joint('spine','腹',hips,0,.13,0);
  mesh(new THREE.SphereGeometry(.16,18,12),COLORS.body,spine,0,.08,0).scale.set(.9,1.25,.78);

  const chest=joint('chest','胸',spine,0,.23,0,.03);
  mesh(new THREE.SphereGeometry(.22,20,14),COLORS.body,chest,0,.13,0).scale.set(1.05,1.05,.7);

  const neck=joint('neck','首',chest,0,.28,0);
  segment(neck,.12,.065,.075,COLORS.body,1);

  const head=joint('head','頭',neck,0,.12,0,.03);
  mesh(new THREE.SphereGeometry(.17,20,14),COLORS.body,head,0,.13,0).scale.set(.9,1.08,.88);

  [['L',1,'左'],['R',-1,'右']].forEach(([side,sign,label])=>{
    const shoulder=joint('sh'+side,label+'肩',chest,.22*sign,.2,0,.025);
    mesh(new THREE.SphereGeometry(.095,16,10),COLORS.body,shoulder);
    segment(shoulder,.32,.065,.055,COLORS.body,-1);

    const elbow=joint('el'+side,label+'ひじ',shoulder,0,-.32,0);
    mesh(new THREE.SphereGeometry(.07,16,10),COLORS.body,elbow);
    segment(elbow,.30,.055,.04,COLORS.body,-1);

    const wrist=joint('wr'+side,label+'手首',elbow,0,-.30,0,.02);
    mesh(new THREE.SphereGeometry(.085,16,10),COLORS.body,wrist,0,-.045,0);

    const hip=joint('hip'+side,label+'股',hips,.13*sign,-.06,0,.03);
    mesh(new THREE.SphereGeometry(.105,16,10),COLORS.body2,hip);
    segment(hip,.48,.09,.07,COLORS.body2,-1);

    const knee=joint('kn'+side,label+'膝',hip,0,-.48,0,.028);
    mesh(new THREE.SphereGeometry(.08,16,10),COLORS.body2,knee);
    segment(knee,.48,.07,.05,COLORS.body2,-1);

    const ankle=joint('an'+side,label+'足首',knee,0,-.48,0,.025);
    mesh(new THREE.SphereGeometry(.07,16,10),COLORS.body2,ankle,0,-.03,0).scale.set(.8,.75,1.35);
  });

  const NAMES=Object.keys(joints);
  const DEFAULTS={shL:[0,0,8],shR:[0,0,-8],elL:[-6,0,0],elR:[-6,0,0]};
  const blank=()=>{
    const pose={};
    NAMES.forEach((name)=>{pose[name]=DEFAULTS[name]?DEFAULTS[name].slice():[0,0,0];});
    return pose;
  };

  function build(values){
    const p=blank();
    let oy=0;
    Object.keys(values||{}).forEach((key)=>{
      if(key==='oy'){oy=values[key];return;}
      const value=values[key];
      if(key.endsWith('*')){
        const base=key.slice(0,-1);
        p[base+'L']=value.slice();
        p[base+'R']=[value[0],-value[1],-value[2]];
      }else if(p[key]){
        p[key]=value.slice();
      }
    });
    return {pose:p,oy};
  }

  const PRESETS={
    '直立':{},
    'Tポーズ':{'sh*':[0,0,90],'el*':[0,0,0]},
    'Aポーズ':{'sh*':[0,0,40]},
    '歩き':{hipL:[-28,0,0],knL:[10,0,0],hipR:[22,0,0],knR:[35,0,0],shL:[24,0,8],shR:[-22,0,-8],'el*':[-25,0,0],spine:[4,0,0]},
    '走り':{hipL:[-60,0,0],knL:[70,0,0],hipR:[25,0,0],knR:[20,0,0],shL:[35,0,8],shR:[-40,0,-8],'el*':[-90,0,0],spine:[15,0,0],oy:.03},
    '手を振る':{shR:[0,0,-90],elR:[0,0,-80],head:[0,0,6]},
    '座り':{'hip*':[-90,0,0],'kn*':[90,0,0],'sh*':[-20,0,10],'el*':[-60,0,0],oy:-.40},
    'しゃがみ':{'hip*':[-70,0,10],'kn*':[125,0,0],spine:[18,0,0],oy:-.28},
    'ジャンプ':{'hip*':[-50,0,5],'kn*':[80,0,0],'sh*':[0,0,150],oy:.25},
    'おじぎ':{spine:[35,0,0],head:[10,0,0],'sh*':[0,0,8]}
  };

  const VIEWS=[
    ['正面',0,'front'],
    ['右',-Math.PI/2,'right'],
    ['背面',Math.PI,'back'],
    ['左',Math.PI/2,'left']
  ];

  let pose=blank();
  let oy=0;
  let selected='head';

  function snapshot(){
    return {
      pose:Object.fromEntries(NAMES.map((name)=>[name,pose[name].slice()])),
      oy,
      camera:{...cam}
    };
  }

  function apply(){
    NAMES.forEach((name)=>{
      const r=pose[name];
      joints[name].g.rotation.set(r[0]*D,r[1]*D,r[2]*D);
    });
    joints.hips.g.position.y=.90+oy;
    scene.updateMatrixWorld(true);
    draw();
  }

  function setState(state){
    const source=state||{};
    const next=blank();
    NAMES.forEach((name)=>{
      const v=source.pose?.[name];
      if(Array.isArray(v)&&v.length===3&&v.every(Number.isFinite)){
        next[name]=v.map((q)=>clamp(q,-180,180));
      }
    });
    pose=next;
    oy=clamp(Number(source.oy)||0,-.6,.6);
    if(source.camera){
      cam.az=Number.isFinite(source.camera.az)?source.camera.az:cam.az;
      cam.el=Number.isFinite(source.camera.el)?clamp(source.camera.el,-1.2,1.2):cam.el;
      cam.dist=Number.isFinite(source.camera.dist)?clamp(source.camera.dist,1.5,9):cam.dist;
      placeCamera();
    }
    apply();
    syncUi();
  }

  function applyPreset(name){
    stopAnimation();
    setState(build(PRESETS[name]||PRESETS['直立']));
    say(`「${name}」を適用しました`);
  }

  const sliders=[$('joint3dX'),$('joint3dY'),$('joint3dZ')];
  const outputs=[$('joint3dXOut'),$('joint3dYOut'),$('joint3dZOut')];

  function syncUi(){
    const r=pose[selected];
    sliders.forEach((slider,index)=>{
      slider.value=r[index];
      outputs[index].textContent=Math.round(r[index])+'°';
    });
    $('rootHeight').value=oy;
    $('rootHeightOut').textContent=oy.toFixed(2);
    $('joint3dSelect').value=selected;
    markers.forEach((marker)=>{
      marker.material.color.set(marker.userData.joint===selected?COLORS.selected:COLORS.marker);
    });
    draw();
  }

  NAMES.forEach((name)=>{
    const option=document.createElement('option');
    option.value=name;
    option.textContent=joints[name].label;
    $('joint3dSelect').append(option);
  });

  Object.keys(PRESETS).forEach((name)=>{
    const button=document.createElement('button');
    button.type='button';
    button.textContent=name;
    button.addEventListener('click',()=>applyPreset(name));
    $('preset3dButtons').append(button);
  });

  VIEWS.forEach(([label,az])=>{
    const button=document.createElement('button');
    button.type='button';
    button.textContent=label;
    button.addEventListener('click',()=>{
      cam.az=az;cam.el=.1;placeCamera();draw();
      say(`視点を「${label}」にしました`);
    });
    $('view3dButtons').append(button);
  });

  $('joint3dSelect').addEventListener('change',(event)=>{selected=event.target.value;syncUi();});
  sliders.forEach((slider,index)=>slider.addEventListener('input',()=>{
    pose[selected][index]=Number(slider.value);
    apply();
    syncUi();
  }));
  $('rootHeight').addEventListener('input',()=>{
    oy=Number($('rootHeight').value);
    apply();
    syncUi();
  });
  $('resetJoint3dButton').addEventListener('click',()=>{
    pose[selected]=DEFAULTS[selected]?DEFAULTS[selected].slice():[0,0,0];
    apply();syncUi();
  });
  $('resetAll3dButton').addEventListener('click',()=>applyPreset('直立'));

  const DIRECT_CHAINS={
    wrL:['elL','shL'], elL:['shL'], shL:['chest','spine'],
    wrR:['elR','shR'], elR:['shR'], shR:['chest','spine'],
    anL:['knL','hipL'], knL:['hipL'], hipL:['hips'],
    anR:['knR','hipR'], knR:['hipR'], hipR:['hips'],
    head:['neck','chest'], neck:['chest','spine'], chest:['spine','hips'], spine:['hips']
  };

  const pointers=new Map();
  const ray=new THREE.Raycaster();
  const ndc=new THREE.Vector2();
  const dragPlane=new THREE.Plane();
  const dragTarget=new THREE.Vector3();
  let drag=null;
  let pinch=0;

  function pointerDistance(){
    const values=[...pointers.values()];
    return Math.hypot(values[0].x-values[1].x,values[0].y-values[1].y)||1;
  }

  function setNdc(clientX,clientY){
    const rect=canvas.getBoundingClientRect();
    ndc.set(
      ((clientX-rect.left)/rect.width)*2-1,
      -((clientY-rect.top)/rect.height)*2+1
    );
  }

  function pick(event){
    setNdc(event.clientX,event.clientY);
    ray.setFromCamera(ndc,camera);
    const hit=ray.intersectObjects(pickTargets,false)[0];
    return hit?hit.object.userData.joint:null;
  }

  function worldPosition(name){
    const out=new THREE.Vector3();
    joints[name].g.getWorldPosition(out);
    return out;
  }

  function rememberPoseFromGroup(name){
    const r=joints[name].g.rotation;
    const toDeg=(value)=>{
      let d=value/D;
      while(d>180)d-=360;
      while(d<-180)d+=360;
      return clamp(d,-180,180);
    };
    pose[name]=[toDeg(r.x),toDeg(r.y),toDeg(r.z)];
  }

  function targetOnDragPlane(name,clientX,clientY){
    scene.updateMatrixWorld(true);
    const effector=worldPosition(name);
    const normal=new THREE.Vector3();
    camera.getWorldDirection(normal);
    dragPlane.setFromNormalAndCoplanarPoint(normal,effector);
    setNdc(clientX,clientY);
    ray.setFromCamera(ndc,camera);
    return ray.ray.intersectPlane(dragPlane,dragTarget)?dragTarget.clone():effector;
  }

  function solveIk(name,targetWorld){
    const chain=DIRECT_CHAINS[name]||[];
    if(!chain.length) return false;

    for(let iteration=0;iteration<7;iteration++){
      for(const jointName of chain){
        scene.updateMatrixWorld(true);
        const effector=worldPosition(name);
        const pivot=worldPosition(jointName);
        const from=effector.clone().sub(pivot);
        const to=targetWorld.clone().sub(pivot);
        if(from.lengthSq()<1e-8||to.lengthSq()<1e-8) continue;

        const delta=new THREE.Quaternion().setFromUnitVectors(from.normalize(),to.normalize());
        const worldQuat=new THREE.Quaternion();
        joints[jointName].g.getWorldQuaternion(worldQuat);
        const desiredWorld=delta.multiply(worldQuat);

        const parentWorld=new THREE.Quaternion();
        joints[jointName].g.parent.getWorldQuaternion(parentWorld);
        const local=parentWorld.invert().multiply(desiredWorld).normalize();
        joints[jointName].g.quaternion.copy(local);
        joints[jointName].g.rotation.setFromQuaternion(local,'XYZ');
        rememberPoseFromGroup(jointName);
        scene.updateMatrixWorld(true);
      }
      if(worldPosition(name).distanceToSquared(targetWorld)<0.00002) break;
    }
    return true;
  }

  function moveJointOnScreen(name,clientX,clientY){
    if(!joints[name]) return false;
    if(name==='hips'){
      const rect=canvas.getBoundingClientRect();
      const current=worldPosition('hips').clone().project(camera);
      const targetY=-((clientY-rect.top)/rect.height)*2+1;
      oy=clamp(oy+(targetY-current.y)*.9,-.6,.6);
      apply();
      return true;
    }
    const targetWorld=targetOnDragPlane(name,clientX,clientY);
    const moved=solveIk(name,targetWorld);
    if(moved){
      scene.updateMatrixWorld(true);
      draw();
    }
    return moved;
  }

  function moveJointToNormalizedScreen(name,x,y){
    const rect=canvas.getBoundingClientRect();
    return moveJointOnScreen(name,rect.left+clamp(x,0,1)*rect.width,rect.top+clamp(y,0,1)*rect.height);
  }

  function jointScreenPosition(name){
    if(!joints[name]) return null;
    scene.updateMatrixWorld(true);
    const p=worldPosition(name).project(camera);
    return {x:p.x*.5+.5,y:-p.y*.5+.5};
  }

  function worldBoneLengths(){
    scene.updateMatrixWorld(true);
    const pairs={
      upperArmL:['shL','elL'],forearmL:['elL','wrL'],
      upperArmR:['shR','elR'],forearmR:['elR','wrR'],
      thighL:['hipL','knL'],shinL:['knL','anL'],
      thighR:['hipR','knR'],shinR:['knR','anR']
    };
    return Object.fromEntries(Object.entries(pairs).map(([key,[a,b]])=>[key,worldPosition(a).distanceTo(worldPosition(b))]));
  }

  canvas.addEventListener('pointerdown',(event)=>{
    canvas.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(pointers.size===2){drag=null;pinch=pointerDistance();return;}
    const name=pick(event);
    if(name){
      selected=name;
      syncUi();
      drag={joint:true,name};
      say(`${joints[name].label}を指で移動できます`);
    }else{
      drag={joint:false};
    }
  });

  canvas.addEventListener('pointermove',(event)=>{
    const p=pointers.get(event.pointerId);
    if(!p) return;
    const dx=event.clientX-p.x,dy=event.clientY-p.y;
    p.x=event.clientX;p.y=event.clientY;
    if(pointers.size===2){
      const d=pointerDistance();
      cam.dist=clamp(cam.dist*pinch/d,1.5,9);
      pinch=d;
      placeCamera();draw();
      return;
    }
    if(!drag) return;
    if(drag.joint){
      moveJointOnScreen(drag.name,event.clientX,event.clientY);
      syncUi();
    }else{
      cam.az-=dx*.008;
      cam.el=clamp(cam.el+dy*.006,-1.2,1.2);
      placeCamera();draw();
    }
  });

  function pointerUp(event){
    pointers.delete(event.pointerId);
    if(pointers.size<2) pinch=0;
    drag=null;
  }
  canvas.addEventListener('pointerup',pointerUp);
  canvas.addEventListener('pointercancel',pointerUp);
  canvas.addEventListener('wheel',(event)=>{
    event.preventDefault();
    cam.dist=clamp(cam.dist*(1+event.deltaY*.001),1.5,9);
    placeCamera();draw();
  },{passive:false});

  function setHelpers(visible){
    markers.forEach((marker)=>{marker.visible=visible;});
    grid.visible=visible;
  }

  function download(blob,name){
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=name;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1500);
  }

  const blobOf=(target,type='image/png')=>new Promise((resolve)=>target.toBlob(resolve,type));
  const exportSize=()=>$('export3dSize').value.split('x').map(Number);

  function snap(width,height,override={}){
    const pixelRatio=renderer.getPixelRatio();
    const keep={...cam};
    Object.assign(cam,override);
    setHelpers(false);
    renderer.setPixelRatio(1);
    renderer.setSize(width,height,false);
    camera.aspect=width/height;
    camera.updateProjectionMatrix();
    placeCamera();
    renderer.render(scene,camera);
    const out=document.createElement('canvas');
    out.width=width;out.height=height;
    out.getContext('2d').drawImage(canvas,0,0,width,height);
    Object.assign(cam,keep);
    setHelpers(true);
    renderer.setPixelRatio(pixelRatio);
    fit();
    return out;
  }

  let busy=false;
  async function guard(fn){
    if(busy){say('処理中です。完了までお待ちください。');return;}
    busy=true;
    stopAnimation();
    try{await fn();}
    catch(error){console.error(error);say('失敗しました: '+error.message);}
    finally{busy=false;}
  }

  const ORTHO={el:0,dist:4.6};

  $('export3dPngButton').addEventListener('click',()=>guard(async()=>{
    const [w,h]=exportSize();
    download(await blobOf(snap(w,h)),'pose_3d.png');
    say('現在視点のPNGを保存しました');
  }));

  $('export3dSheetButton').addEventListener('click',()=>guard(async()=>{
    const [w,h]=exportSize();
    const sheet=document.createElement('canvas');
    sheet.width=w*4;sheet.height=h;
    const x=sheet.getContext('2d');
    VIEWS.forEach(([,az],index)=>x.drawImage(snap(w,h,{...ORTHO,az}),w*index,0));
    download(await blobOf(sheet),'pose_4views.png');
    say('4方向シートを保存しました');
  }));

  $('export3dFourButton').addEventListener('click',()=>guard(async()=>{
    const [w,h]=exportSize();
    for(const [label,az,id] of VIEWS){
      download(await blobOf(snap(w,h,{...ORTHO,az})),`pose_${id}.png`);
      say(label+'を保存中');
      await sleep(350);
    }
    say('4方向を個別保存しました');
  }));

  function worldPoint(group,x=0,y=0,z=0){
    return group.localToWorld(new THREE.Vector3(x,y,z));
  }

  function keypointVectors(){
    scene.updateMatrixWorld(true);
    const hd=joints.head.g;
    const J=(name)=>joints[name].g;
    return [
      worldPoint(hd,0,.1,.1),
      worldPoint(J('neck')),
      worldPoint(J('shR')),worldPoint(J('elR')),worldPoint(J('wrR')),
      worldPoint(J('shL')),worldPoint(J('elL')),worldPoint(J('wrL')),
      worldPoint(J('hipR')),worldPoint(J('knR')),worldPoint(J('anR')),
      worldPoint(J('hipL')),worldPoint(J('knL')),worldPoint(J('anL')),
      worldPoint(hd,-.035,.11,.09),worldPoint(hd,.035,.11,.09),
      worldPoint(hd,-.1,.10,0),worldPoint(hd,.1,.10,0)
    ];
  }

  function projectRaw(width,height){
    const c2=camera.clone();
    c2.aspect=width/height;
    c2.updateProjectionMatrix();
    c2.updateMatrixWorld(true);
    return keypointVectors().map((vector)=>{
      const v=vector.clone().project(c2);
      return [(v.x*.5+.5)*width,(-v.y*.5+.5)*height];
    });
  }

  function projectTo2D(){
    const p=projectRaw(1000,1000).map(([x,y])=>({x:clamp(x/1000,0,1),y:clamp(y/1000,0,1)}));
    const ids=['nose','neck','r_shoulder','r_elbow','r_wrist','l_shoulder','l_elbow','l_wrist','r_hip','r_knee','r_ankle','l_hip','l_knee','l_ankle','r_eye','l_eye','r_ear','l_ear'];
    return Object.fromEntries(ids.map((id,index)=>[id,p[index]]));
  }

  function openPosePayload(width,height){
    const flat=[];
    projectRaw(width,height).forEach(([x,y])=>flat.push(+x.toFixed(2),+y.toFixed(2),1));
    return {version:1.3,canvas_width:width,canvas_height:height,people:[{person_id:[-1],pose_keypoints_2d:flat}]};
  }

  $('export3dOpenPoseJsonButton').addEventListener('click',()=>guard(async()=>{
    const [w,h]=exportSize();
    download(new Blob([JSON.stringify(openPosePayload(w,h),null,2)],{type:'application/json'}),'pose_openpose.json');
    say('OpenPose JSONを保存しました');
  }));

  const OPENPOSE_LIMBS=[[1,2],[1,5],[2,3],[3,4],[5,6],[6,7],[1,8],[8,9],[9,10],[1,11],[11,12],[12,13],[1,0],[0,14],[14,16],[0,15],[15,17]];

  $('export3dOpenPoseButton').addEventListener('click',()=>guard(async()=>{
    const [w,h]=exportSize();
    const points=projectRaw(w,h);
    const out=document.createElement('canvas');
    out.width=w;out.height=h;
    const x=out.getContext('2d');
    x.fillStyle='#000';x.fillRect(0,0,w,h);
    x.lineCap='round';x.lineWidth=w/70;
    OPENPOSE_LIMBS.forEach(([a,b],index)=>{
      x.strokeStyle=`hsl(${index*21},100%,50%)`;
      x.beginPath();x.moveTo(points[a][0],points[a][1]);x.lineTo(points[b][0],points[b][1]);x.stroke();
    });
    points.forEach((point,index)=>{
      x.fillStyle=`hsl(${index*20},100%,55%)`;
      x.beginPath();x.arc(point[0],point[1],w/90,0,Math.PI*2);x.fill();
    });
    download(await blobOf(out),'pose_openpose.png');
    say('OpenPose画像を保存しました');
  }));

  $('export3dDataButton').addEventListener('click',()=>{
    download(new Blob([JSON.stringify({app:'pose-studio',mode:'3d',version:1,...snapshot()},null,2)],{type:'application/json'}),'pose_3d_data.json');
    say('3DポーズJSONを保存しました');
  });

  let animA=build(PRESETS['直立']);
  let animB=build(PRESETS['手を振る']);
  let playing=false;
  let startTime=0;
  const period=()=>Number($('animationPeriod').value)||2;

  function animAt(seconds){
    const u=.5-.5*Math.cos(2*Math.PI*seconds/period());
    NAMES.forEach((name)=>{
      pose[name]=animA.pose[name].map((v,index)=>v+(animB.pose[name][index]-v)*u);
    });
    oy=animA.oy+(animB.oy-animA.oy)*u;
    apply();
  }

  function animationLoop(now){
    if(!playing) return;
    animAt((now-startTime)/1000);
    requestAnimationFrame(animationLoop);
  }

  function stopAnimation(){
    if(!playing) return;
    playing=false;
    $('playAnimationButton').textContent='▶ 再生';
    syncUi();
  }

  $('setAnimAButton').addEventListener('click',()=>{animA=snapshot();say('現在のポーズをAに設定しました');});
  $('setAnimBButton').addEventListener('click',()=>{animB=snapshot();say('現在のポーズをBに設定しました');});
  $('playAnimationButton').addEventListener('click',()=>{
    if(busy) return;
    if(playing){stopAnimation();return;}
    playing=true;
    $('playAnimationButton').textContent='■ 停止';
    startTime=performance.now();
    requestAnimationFrame(animationLoop);
  });

  $('exportGifButton').addEventListener('click',()=>guard(async()=>{
    if(typeof window.makeGif!=='function') throw new Error('GIFエンコーダを読み込めませんでした');
    const W=280,H=420,fps=12,T=period(),count=Math.round(fps*T),frames=[],keep=snapshot();
    try{
      for(let i=0;i<count;i++){
        animAt(T*i/count);
        frames.push(snap(W,H,{...ORTHO,az:cam.az}).getContext('2d').getImageData(0,0,W,H).data);
        if(i%2===0){say(`GIF生成中 ${i+1}/${count}`);await sleep(0);}
      }
      const gif=window.makeGif(frames,W,H,Math.round(100/fps));
      download(new Blob([gif],{type:'image/gif'}),'pose.gif');
      say('GIFを保存しました');
    }finally{
      setState(keep);
    }
  }));

  $('exportVideoButton').addEventListener('click',()=>guard(async()=>{
    if(!window.MediaRecorder||!canvas.captureStream) throw new Error('このブラウザは動画保存に対応していません');
    const type=['video/mp4','video/webm;codecs=vp9','video/webm'].find((candidate)=>MediaRecorder.isTypeSupported(candidate));
    if(!type) throw new Error('対応する動画形式がありません');
    const keep=snapshot();
    const chunks=[];
    setHelpers(false);
    try{
      const recorder=new MediaRecorder(canvas.captureStream(30),{mimeType:type});
      recorder.ondataavailable=(event)=>{if(event.data&&event.data.size)chunks.push(event.data);};
      const stopped=new Promise((resolve)=>{recorder.onstop=resolve;});
      recorder.start();
      const begin=performance.now(),duration=period()*1000;
      await new Promise((resolve)=>{
        (function frame(){
          const elapsed=performance.now()-begin;
          animAt(Math.min(elapsed,duration)/1000);
          renderer.render(scene,camera);
          if(elapsed<duration) requestAnimationFrame(frame);
          else resolve();
        })();
      });
      recorder.stop();
      await stopped;
      download(new Blob(chunks,{type}),`pose.${type.startsWith('video/mp4')?'mp4':'webm'}`);
      say('動画を保存しました');
    }finally{
      setHelpers(true);
      setState(keep);
    }
  }));

  if(typeof ResizeObserver!=='undefined') new ResizeObserver(fit).observe(stage);
  window.addEventListener('resize',fit);

  setState(build(PRESETS['直立']));
  fit();

  window.PoseStudio3D=Object.freeze({
    getState:snapshot,
    setState,
    projectTo2D,
    applyPreset,
    moveJointToNormalizedScreen,
    getJointScreenPosition:jointScreenPosition,
    getWorldBoneLengths:worldBoneLengths,
    getPresetNames:()=>Object.keys(PRESETS)
  });
})();
