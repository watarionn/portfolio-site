/**
 * こもれび町 3D: lightweight handcrafted village details.
 * One shared set of geometry/materials, instanced roof tiles and meadow plants.
 * All scenery is original procedural geometry. No additional remote assets.
 */
export function createScenery({THREE,scene,collision,homes,sun,skylight,quality='full'}){
  const TAU=Math.PI*2;
  const boxGeo=new THREE.BoxGeometry(1,1,1);
  const leafGeo=new THREE.IcosahedronGeometry(1,0);
  const materials=new Map(),lamps=[],windows=[],ripples=[],butterflies=[];
  const getMat=(hex,extra={})=>{
    const key=hex+'/'+JSON.stringify(extra);
    if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color:hex,roughness:.9,...extra}));
    return materials.get(key);
  };
  const wood=getMat(0x806049),oak=getMat(0xc38e60),cream=getMat(0xfff4da),white=getMat(0xfffaf0);
  const stone=getMat(0xd9c8a7),darkStone=getMat(0xb99f81),leaf=getMat(0x69a879);
  const flower=[getMat(0xffd5a3),getMat(0xf1aeb9),getMat(0xc9b8e6),getMat(0xfff3d4)];
  function part(parent,w,h,d,mat,x,y,z,shadow=false){
    const m=new THREE.Mesh(boxGeo,mat);
    m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=shadow;m.receiveShadow=false;
    parent.add(m);return m;
  }
  function orb(parent,x,y,z,r,mat,shadow=false){
    const m=new THREE.Mesh(leafGeo,mat);m.position.set(x,y,z);m.scale.setScalar(r);
    m.castShadow=shadow;parent.add(m);return m;
  }
  function canvasTexture(draw,w=512,h=256){
    const cv=document.createElement('canvas');cv.width=w;cv.height=h;
    const ctx=cv.getContext('2d');draw(ctx,w,h);
    const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
    tex.anisotropy=1;return tex;
  }
  const buildingDefs=[
    {title:'図書館',mark:'本',color:0xbf829a,trim:0x765d87,desc:'読みものの家',planter:0xeaa5b7},
    {title:'工房',mark:'✦',color:0xc49668,trim:0x947150,desc:'ものづくりの家',planter:0xf4d49a},
    {title:'展示館',mark:'絵',color:0x7fb1bd,trim:0x568b99,desc:'作品を眺める家',planter:0xd3bcf2},
    {title:'あそび場',mark:'★',color:0xd79582,trim:0xa96964,desc:'ゲームの家',planter:0xf0b9a8}
  ];
  const roofGeo=new THREE.BoxGeometry(1,1,1);
  const dummy=new THREE.Object3D();
  const signTextures=[];
  homes.forEach(([x,z,_roof,front],index)=>{
    const d=buildingDefs[index],g=new THREE.Group();g.position.set(x,0,z);
    g.rotation.y=front<0?Math.PI:0;scene.add(g);
    const trim=getMat(d.trim),accent=getMat(d.color),plaster=getMat(0xf8e5ce);
    // Facade timber framing, foundation and a raised doorstep.
    part(g,6.3,.28,5.8,darkStone,0,.23,0);
    for(const px of [-2.82,2.82]){
      part(g,.17,3.25,.19,trim,px,2.23,2.78);
      part(g,.17,3.25,.19,trim,px,2.23,-2.78);
    }
    part(g,6.3,.12,.24,trim,0,3.75,2.84);
    part(g,6.3,.12,.24,trim,0,3.75,-2.84);
    part(g,1.68,.16,1.55,stone,0,.14,3.18);
    part(g,1.27,.12,.82,cream,0,2.75,3.13);
    // Eaves, a colored ridge and reused instanced roof shingles.
    part(g,7.02,.21,.28,trim,0,5.97,0);
    for(const side of [-1,1])part(g,7.0,.15,.28,trim,0,3.82,side*3.31);
    const count=72,roofTiles=new THREE.InstancedMesh(roofGeo,getMat(0xffffff),count);
    roofTiles.castShadow=false;roofTiles.receiveShadow=false;
    const tileColor=new THREE.Color(d.color);
    let i=0;
    for(const side of [-1,1])for(let row=0;row<4;row++)for(let col=0;col<9;col++){
      const localZ=side*(.48+row*.67);
      dummy.position.set(-3.0+col*.75+(row%2)*.10,5.90-Math.abs(localZ)*.60+.16,localZ);
      dummy.rotation.set(side*.53,0,0);dummy.scale.set(.58,.075,.20);dummy.updateMatrix();
      roofTiles.setMatrixAt(i,dummy.matrix);
      roofTiles.setColorAt(i,tileColor.clone().multiplyScalar((i%7===0)?.87:((i+row)%5===0)?1.10:1));
      i++;
    }
    roofTiles.instanceMatrix.needsUpdate=true;
    if(roofTiles.instanceColor)roofTiles.instanceColor.needsUpdate=true;
    g.add(roofTiles);
    // A banner with original Japanese lettering, always facing the front entrance.
    const tex=canvasTexture((ctx,w,h)=>{
      ctx.fillStyle='#fff6df';ctx.fillRect(0,0,w,h);
      ctx.fillStyle='#5f7c67';ctx.fillRect(0,0,w,15);ctx.fillRect(0,h-16,w,16);
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillStyle='#58765e';ctx.font='bold 71px sans-serif';ctx.fillText(d.title,w/2,110);
      ctx.fillStyle='#84998a';ctx.font='34px sans-serif';ctx.fillText(d.desc,w/2,183);
    });
    signTextures.push(tex);
    const board=new THREE.Mesh(new THREE.PlaneGeometry(2.3,1.15),
      new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));
    board.position.set(0,3.17,3.02);board.castShadow=false;g.add(board);
    // Each building gets its own identity and a three-dimensional doorway canopy.
    part(g,2.12,.13,1.12,accent,0,2.77,3.2);
    for(const wx of [-1.9,1.9]){
      const win=part(g,.72,.73,.07,getMat(0xf4dfad,{emissive:0xffbb73,emissiveIntensity:0}),
        wx,2.05,2.96);windows.push(win.material);
      part(g,.10,.8,.10,white,wx,2.05,3.035);
      part(g,.78,.10,.13,white,wx,2.05,3.045);
      part(g,1.17,.21,.38,oak,wx,1.45,3.13);
      // Window-box flowers use only 4 petals and a shared small palette.
      for(const dx of [-.34,-.1,.15,.36]){
        orb(g,wx+dx,1.69,3.16,.095,flower[(index+Math.round((dx+1)*6))%flower.length]);
      }
    }
    if(index===0){ // Library: a book-shaped hanging sign.
      part(g,.11,1.38,.10,wood,-3.22,2.85,2.92);
      part(g,1.13,.81,.17,trim,-3.22,2.43,3.0);
      part(g,.09,.66,.19,cream,-3.22,2.44,3.13);
    } else if(index===1){ // Workshop: chimney, copper ventilation and tool display.
      part(g,.95,1.12,.85,trim,-1.8,5.58,-.8);
      part(g,1.12,.19,1.04,stone,-1.8,6.19,-.8);
      for(const ax of [.95,1.35,1.75])part(g,.11,.60,.11,wood,ax,1.65,3.11);
    } else if(index===2){ // Gallery: roof pennants.
      for(let j=0;j<5;j++)part(g,.34,.35,.08,flower[j%4],-1.8+j*.9,6.16,0);
    } else { // Playhouse: striped cloth awning and small toy blocks.
      for(let j=0;j<6;j++)part(g,.28,.32,.30,j%2?cream:accent,-.94+j*.37,2.54,3.65);
      for(let j=0;j<3;j++)part(g,.28,.28,.28,flower[j],1.15+j*.37,.22,3.35);
    }
  });

  // A waterside garden set away from walking roads. Its collision is explicit.
  const pond=new THREE.Group();pond.position.set(-8,0,8);scene.add(pond);
  const sand=getMat(0xe3d0aa),water=getMat(0x75bbbd,{metalness:.05,roughness:.24});
  const rim=new THREE.Mesh(new THREE.TorusGeometry(2.55,.29,6,50),sand);
  rim.rotation.x=-Math.PI/2;rim.scale.y=.66;rim.position.y=.11;rim.castShadow=false;pond.add(rim);
  const pool=new THREE.Mesh(new THREE.CircleGeometry(2.5,48),water);
  pool.rotation.x=-Math.PI/2;pool.scale.y=.66;pool.position.y=.078;pool.receiveShadow=false;pond.add(pool);
  const rippleMat=new THREE.MeshBasicMaterial({color:0xdaf5e9,transparent:true,opacity:.42,depthWrite:false});
  for(let k=0;k<3;k++){
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.53,.034,4,36),rippleMat.clone());
    ring.rotation.x=-Math.PI/2;ring.scale.y=.67;ring.position.y=.11+k*.004;ring.castShadow=false;pond.add(ring);
    ripples.push({ring,phase:k*.9});
  }
  collision.push({x:-8,z:8,r:2.72});

  // Eight low-poly flower beds and little wooden benches.
  const gardens=[[-5.5,8.7],[-10.6,9.8],[-6.5,-7.2],[7.6,6.3],[-7.3,-5.8],[7.7,-7.5],[5.5,9.0],[-10.1,-7.4]];
  gardens.forEach(([x,z],n)=>{
    const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
    part(g,1.35,.16,.71,wood,0,.08,0);
    part(g,1.23,.14,.59,getMat(0x6d985e),0,.17,0);
    for(let j=0;j<6;j++)orb(g,(j%3-.95)*.37,.28+(j%2)*.1,(Math.floor(j/3)-.5)*.34,
      .12,flower[(j+n)%flower.length]);
  });
  function bench(x,z,angle){
    const b=new THREE.Group();b.position.set(x,0,z);b.rotation.y=angle;scene.add(b);
    part(b,2.12,.20,.72,oak,0,.88,0);
    part(b,2.12,.16,.19,oak,0,1.42,-.27);
    for(const bx of [-.8,.8])part(b,.16,.8,.16,wood,bx,.4,0);
  }
  bench(-10.4,5.4,-.3);
  bench(8.3,5.9,.75);

  // Lanterns are emissive only, not costly real-time point lights.
  const halo=canvasTexture((ctx,w,h)=>{
    const g=ctx.createRadialGradient(w/2,h/2,1,w/2,h/2,w*.43);
    g.addColorStop(0,'rgba(255,239,175,.72)');g.addColorStop(.2,'rgba(255,225,154,.27)');
    g.addColorStop(1,'rgba(255,227,152,0)');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  },128,128);
  function lantern(x,z){
    const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
    part(g,.13,2.7,.13,wood,0,1.35,0);
    part(g,.76,.16,.74,trimMat(),0,2.75,0);
    part(g,.48,.58,.46,getMat(0xffeac1,{emissive:0xe7b268,emissiveIntensity:.1}),0,3.12,0);
    const bulb=g.children[g.children.length-1];lamps.push(bulb.material);
    part(g,.91,.16,.80,trimMat(),0,3.48,0);
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:halo,transparent:true,depthWrite:false,opacity:0}));
    sprite.position.set(0,3.1,0);sprite.scale.set(4.3,4.3,1);g.add(sprite);lamps.push(sprite.material);
  }
  function trimMat(){return getMat(0x6b7b67);}
  for(const [x,z] of [[-4.1,-4.0],[4.1,-4.0],[-4.1,4.0],[4.1,4.0]])lantern(x,z);

  // Hundreds of meadow accents cost only a few draw calls via InstancedMesh.
  const grassGeo=new THREE.ConeGeometry(.12,.48,3),grassMat=getMat(0x66a676,{side:THREE.DoubleSide});
  let seed=714003;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const accents=[];
  for(let k=0;k<390;k++){
    const x=(random()-.5)*46,z=(random()-.5)*46;
    if(Math.abs(x)<3.2||Math.abs(z)<3.2)continue;
    if(homes.some(([hx,hz])=>Math.hypot(x-hx,z-hz)<6.25))continue;
    if(Math.hypot(x+8,z-8)<4.2)continue;
    accents.push([x,z,.65+random()*.70,random()*TAU]);
    if(accents.length>=170)break;
  }
  const tuft=new THREE.InstancedMesh(grassGeo,grassMat,accents.length);
  tuft.castShadow=false;tuft.receiveShadow=false;
  accents.forEach(([x,z,s,rot],i)=>{
    dummy.position.set(x,.25*s,z);dummy.rotation.set(0,rot,0);
    dummy.scale.set(s,s,s);dummy.updateMatrix();tuft.setMatrixAt(i,dummy.matrix);
  });
  tuft.instanceMatrix.needsUpdate=true;scene.add(tuft);

  // The sharp square island edge gets a warm sand trim and subtle foam.
  for(const pos of [-25.7,25.7]){
    part(scene,52,.08,.46,sand,0,.018,pos);
    part(scene,.46,.08,52,sand,pos,.018,0);
  }
  const foamMat=new THREE.MeshBasicMaterial({color:0xe8f9e9,transparent:true,opacity:.32,depthWrite:false});
  const foam=[];
  for(let i=0;i<14;i++){
    const side=i%4,t=-20+(Math.floor(i/4))*12+random()*4;
    const x=side<2?(side===0?-26.3:26.3):t;
    const z=side>=2?(side===2?-26.3:26.3):t;
    const w=new THREE.Mesh(new THREE.TorusGeometry(1.7,.045,4,28),foamMat.clone());
    w.rotation.x=-Math.PI/2;w.scale.y=.33;w.position.set(x,-1.04,z);scene.add(w);
    foam.push({mesh:w,phase:i*.38});
  }
  // The pond has just four softly hovering butterflies.
  for(let i=0;i<4;i++){
    const g=new THREE.Group();scene.add(g);
    const wing=getMat(i%2?0xe7a1ad:0xf9dba1);
    const left=orb(g,-.12,0,0,.17,wing),right=orb(g,.12,0,0,.17,wing);
    left.scale.set(.15,.19,.055);right.scale.set(.15,.19,.055);
    butterflies.push({g,left,right,phase:i*1.8});
  }

  const modes=[
    {name:'昼',background:0xc5e6db,fog:0xc5e6db,sky:2.1,sun:3.0,light:0xffefcf},
    {name:'夕方',background:0xe6c3a8,fog:0xe6c3a8,sky:1.45,sun:1.95,light:0xffb883},
    {name:'夜',background:0x738ca2,fog:0x738ca2,sky:.82,sun:.83,light:0x9bbde6}
  ];
  let mode=0;
  function setMode(index){
    mode=((index%3)+3)%3;
    const m=modes[mode];
    scene.background.setHex(m.background);scene.fog.color.setHex(m.fog);
    sun.intensity=m.sun;sun.color.setHex(m.light);skylight.intensity=m.sky;
    windows.forEach(material=>{material.emissiveIntensity=mode===0?0:mode===1?.42:.9;});
    lamps.forEach(material=>{
      if(material.isSpriteMaterial)material.opacity=mode===0?0:mode===1?.35:.78;
      else material.emissiveIntensity=mode===0?.1:mode===1?.85:1.65;
    });
    return m.name;
  }
  function update(time){
    for(const r of ripples){
      const t=(time*.23+r.phase)%1;
      r.ring.scale.set(.6+t*1.8,.4+t*1.1,1);
      r.ring.material.opacity=(1-t)*.47;
    }
    foam.forEach((w,i)=>{w.mesh.material.opacity=.24+.1*Math.sin(time*.7+w.phase);});
    butterflies.forEach(({g,left,right,phase},i)=>{
      const a=time*.42+phase;
      g.position.set(-8+Math.sin(a)*2,1.10+Math.sin(time*2+phase)*.24,
        8+Math.cos(a*.82)*1.6);
      left.rotation.y=Math.sin(time*10+phase)*.58;
      right.rotation.y=-Math.sin(time*10+phase)*.58;
    });
  }
  setMode(0);
  return {setMode,nextMode:()=>setMode(mode+1),label:()=>modes[mode].name,update,
    stats:{roofInstances:homes.length*72,meadowInstances:accents.length}};
}
