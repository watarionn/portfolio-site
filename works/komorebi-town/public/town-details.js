/* こもれび町 3D: miniature storybook scenery, native Three.js only.
 * Geometry and palettes are original, procedural assets; no external textures. */
export function buildTownDetails({THREE,scene,houses,collision,rnd,lowPower,sun,ambient,renderer}) {
  const wooden=new THREE.MeshStandardMaterial({color:0x886b53,roughness:1});
  const trim=new THREE.MeshStandardMaterial({color:0xf5e7c9,roughness:1});
  const stone=new THREE.MeshStandardMaterial({color:0xcfccb5,roughness:1});
  const rock=new THREE.MeshStandardMaterial({color:0xb4bca8,roughness:1});
  const leaf=new THREE.MeshStandardMaterial({color:0x719d79,roughness:1});
  const soil=new THREE.MeshStandardMaterial({color:0x927454,roughness:1});
  const blue=new THREE.MeshStandardMaterial({color:0x81c6d1,roughness:.29,metalness:.03,transparent:true,opacity:.89});
  const white=new THREE.MeshStandardMaterial({color:0xfff5df,roughness:1});
  const dark=new THREE.MeshStandardMaterial({color:0x4b5b4a,roughness:.86});
  const bulbMat=new THREE.MeshBasicMaterial({color:0xffe4a8});
  const boxGeometry=new THREE.BoxGeometry(1,1,1);
  const sphereGeometry=new THREE.IcosahedronGeometry(1,1);
  function cube(parent,x,y,z,w,h,d,material,cast=false){
    const m=new THREE.Mesh(boxGeometry,material);m.position.set(x,y,z);m.scale.set(w,h,d);
    m.castShadow=cast&&!lowPower;m.receiveShadow=false;parent.add(m);return m;
  }
  function orb(parent,x,y,z,r,material,cast=false){
    const m=new THREE.Mesh(sphereGeometry,material);m.position.set(x,y,z);m.scale.setScalar(r);
    m.castShadow=cast&&!lowPower;parent.add(m);return m;
  }
  function labelTexture(text,ink='#4a6d5c'){
    const c=document.createElement('canvas');c.width=384;c.height=112;
    const ctx=c.getContext('2d');ctx.fillStyle='#fff7df';ctx.fillRect(0,0,384,112);
    ctx.strokeStyle='#b19b77';ctx.lineWidth=9;ctx.strokeRect(7,7,370,98);
    ctx.fillStyle=ink;ctx.font='bold 60px sans-serif';ctx.textAlign='center';
    ctx.fillText(text,192,76,345);
    const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;return texture;
  }
  const lanterns=[],windows=[],butterflies=[],ripples=[];
  const houseLabels=['図書館','工房','展示館','あそび場'];
  const roofColors=[0xd78975,0x82b5b7,0xd4a362,0xb191b9];
  const tileGeometry=new THREE.BoxGeometry(.61,.055,.40);
  const dummy=new THREE.Object3D();
  houses.forEach(({group,front,x,z},index)=>{
    // Place dozens of shingles in two instanced meshes, not hundreds of draw calls.
    const roofColor=new THREE.Color(roofColors[index]);
    for(const roof of [group.children[1],group.children[2]]){
      const count=9*8;
      const shingles=new THREE.InstancedMesh(tileGeometry,new THREE.MeshStandardMaterial({color:0xffffff,roughness:.98}),count);
      let k=0;
      for(let row=0;row<8;row++)for(let col=0;col<9;col++){
        dummy.position.set(-2.94+col*.72+(row%2)*.12,.198,-1.69+row*.48);
        dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();
        shingles.setMatrixAt(k,dummy.matrix);
        const shade=.86+((col*7+row*3+index)%5)*.055;
        shingles.setColorAt(k,roofColor.clone().multiplyScalar(shade));k++;
      }
      shingles.instanceMatrix.needsUpdate=true;
      if(shingles.instanceColor)shingles.instanceColor.needsUpdate=true;
      shingles.castShadow=false;shingles.receiveShadow=false;roof.add(shingles);
    }
    // Architectural rhythm: timber frames, shutters, small steps and raised flower boxes.
    for(const side of [-1,1]){
      cube(group,side*2.85,2.2,2.81,.16,3.6,.18,wooden);
      cube(group,side*1.85,1.52,3.00,1.38,.17,.38,wooden);
      cube(group,side*2.47,2.13,2.96,.20,1.12,.17,trim);
      cube(group,side*1.22,2.13,2.96,.20,1.12,.17,trim);
      cube(group,side*1.85,.88,3.26,1.20,.38,.52,soil);
      for(let f=0;f<3;f++){
        const fx=side*1.85+(f-1)*.35;
        orb(group,fx,1.15,3.27,.22,index===2?leaf:new THREE.MeshStandardMaterial({color:[0xe4a4a9,0xf7df8b,0xd6b6e9][f],roughness:1}));
      }
    }
    cube(group,0,2.7,2.83,.16,1.75,.16,wooden);
    cube(group,0,3.80,2.89,5.9,.16,.25,trim);
    cube(group,0,.11,3.65,2.25,.21,1.65,stone);
    cube(group,0,.23,3.95,1.75,.15,.44,rock);
    // Label faces the door and remains readable from the front.
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(2.22,.65),
      new THREE.MeshBasicMaterial({map:labelTexture(houseLabels[index]),side:THREE.DoubleSide}));
    sign.position.set(0,3.43,2.92);group.add(sign);
    const lamp=cube(group,.73,2.97,3.09,.26,.34,.22,bulbMat);
    lanterns.push(lamp);
    const glass=new THREE.MeshStandardMaterial({color:0xffdf96,emissive:0xffbf60,emissiveIntensity:.05,roughness:.38});
    for(const wx of [-1.85,1.85]){
      const pane=cube(group,wx,2.17,2.975,.76,.74,.08,glass);
      windows.push(pane);
      cube(group,wx,2.17,3.034,.08,.8,.08,trim);
      cube(group,wx,2.17,3.034,.8,.08,.08,trim);
    }
    // Distinct landmarks: a book shop awning, workshop chimney, gallery banners, toys.
    if(index===0){
      const awning=cube(group,0,3.02,3.52,2.1,.15,1.22,new THREE.MeshStandardMaterial({color:0x9a7690,roughness:1}));
      awning.rotation.x=-.15;
      for(let i=0;i<3;i++)cube(group,-.74+i*.72,.64,4.25,.43,.62,.35,new THREE.MeshStandardMaterial({color:[0xc27770,0x739a9c,0xdeb36c][i]}));
    }else if(index===1){
      cube(group,-1.74,6.25,-.72,1.03,.27,.99,trim);
      const crateMat=new THREE.MeshStandardMaterial({color:0xc69b65,roughness:1});
      cube(group,2.75,.38,3.56,.95,.76,.95,crateMat);
      cube(group,2.95,.93,3.74,.78,.42,.78,crateMat);
    }else if(index===2){
      for(let i=0;i<4;i++){
        const flag=cube(group,-2.3+i*1.45,4.05,2.89,.60,.52,.11,
          new THREE.MeshStandardMaterial({color:[0x8ca4c9,0xe3ad8d,0xb8a0c5,0x9cbea0][i]}));
        flag.rotation.z=.11*(i%2?1:-1);
      }
    }else{
      const colors=[0xe4a3a1,0xe6bc70,0x91baca];
      for(let i=0;i<3;i++)orb(group,-2.4+i*.52,.53,4.25,.36,
        new THREE.MeshStandardMaterial({color:colors[i],roughness:1}));
    }
  });

  // Flower beds and stones share geometry via instancing. Paths stay clear.
  const petals=new THREE.InstancedMesh(sphereGeometry,new THREE.MeshStandardMaterial({color:0xffffff,roughness:1}),145);
  const pebbles=new THREE.InstancedMesh(sphereGeometry,rock,95);
  let n=0,p=0;
  for(let i=0;i<900&&(n<145||p<95);i++){
    const x=(rnd()-.5)*49,z=(rnd()-.5)*49;
    if(Math.abs(x)<3.2||Math.abs(z)<3.2||houses.some(h=>Math.abs(x-h.x)<5.8&&Math.abs(z-h.z)<5.5))continue;
    if(n<145){
      const size=.11+rnd()*.09;dummy.position.set(x,.17,z);dummy.rotation.set(0,0,0);
      dummy.scale.set(size,size*.8,size);dummy.updateMatrix();petals.setMatrixAt(n,dummy.matrix);
      petals.setColorAt(n,new THREE.Color([0xf8e1a0,0xf0a8b4,0xe1c2ed,0xfaf7e3][n%4]));n++;
    }else if(p<95){
      dummy.position.set(x,.10,z);dummy.rotation.set(0,rnd()*Math.PI,0);
      dummy.scale.set(.13+rnd()*.13,.07,.12+rnd()*.10);dummy.updateMatrix();pebbles.setMatrixAt(p++,dummy.matrix);
    }
  }
  petals.count=n;pebbles.count=p;petals.instanceMatrix.needsUpdate=true;
  if(petals.instanceColor)petals.instanceColor.needsUpdate=true;
  pebbles.instanceMatrix.needsUpdate=true;scene.add(petals,pebbles);

  // Decorative village plaza fountain. A physical collision prevents walking through it.
  const fountain=new THREE.Group();fountain.position.set(3.35,0,-3.8);scene.add(fountain);
  const basin=new THREE.Mesh(new THREE.CylinderGeometry(1.28,1.42,.56,12),stone);
  basin.position.y=.30;fountain.add(basin);
  const water=new THREE.Mesh(new THREE.CylinderGeometry(1.13,1.13,.025,24),blue);
  water.position.y=.595;fountain.add(water);
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(.19,.30,1.12,10),stone);
  stem.position.y=1.16;fountain.add(stem);
  orb(fountain,0,1.79,0,.25,blue);
  const rippleMat=new THREE.MeshBasicMaterial({color:0xd9f9ef,transparent:true,opacity:.7,side:THREE.DoubleSide,depthWrite:false});
  for(let i=0;i<2;i++){
    const ring=new THREE.Mesh(new THREE.RingGeometry(.35+i*.3,.39+i*.3,26),rippleMat.clone());
    ring.rotation.x=-Math.PI/2;ring.position.y=.626;fountain.add(ring);ripples.push(ring);
  }
  collision.push({x:3.35,z:-3.8,r:1.4});

  // Garden lanterns, placed outside the main footpaths and close to landmarks.
  const lanternPositions=[[-4.7,-4.8],[4.8,4.9],[-5.2,4.6],[5.0,-5.0],[-19,-8],[-7,-19],[18,8],[7,19]];
  const glowCanvas=document.createElement('canvas');glowCanvas.width=128;glowCanvas.height=128;
  const glowCtx=glowCanvas.getContext('2d');
  const gradient=glowCtx.createRadialGradient(64,64,4,64,64,64);
  gradient.addColorStop(0,'rgba(255,245,181,.54)');gradient.addColorStop(.4,'rgba(255,220,135,.21)');gradient.addColorStop(1,'rgba(255,205,109,0)');
  glowCtx.fillStyle=gradient;glowCtx.fillRect(0,0,128,128);
  const glowTex=new THREE.CanvasTexture(glowCanvas);
  const glowMat=new THREE.SpriteMaterial({map:glowTex,depthWrite:false,transparent:true,opacity:0});
  const halos=[];
  lanternPositions.forEach(([x,z])=>{
    const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
    cube(g,0,1.42,0,.15,2.84,.15,dark);
    cube(g,0,2.83,0,.74,.12,.72,dark);
    const bulb=cube(g,0,2.60,0,.50,.43,.48,bulbMat);
    cube(g,0,2.34,0,.73,.10,.70,dark);
    lanterns.push(bulb);
    if(!lowPower){const halo=new THREE.Sprite(glowMat.clone());halo.position.set(0,2.62,0);halo.scale.set(3.7,3.7,1);g.add(halo);halos.push(halo);}
  });

  // Quiet dock on the southern coast; no land or movement boundary changes.
  const pier=new THREE.Group();pier.position.set(0,-.04,26);scene.add(pier);
  for(let i=0;i<9;i++)cube(pier,0,.12,i*.80,4.6,.14,.70,wooden);
  for(const x of [-2.1,2.1])for(const z of [.6,3.6,6.5])cube(pier,x,-.60,z,.26,1.75,.30,dark);
  // Little butterflies add life without skeletons or new texture downloads.
  if(!lowPower){
    const wingMaterial=new THREE.MeshBasicMaterial({color:0xfbe6a5,side:THREE.DoubleSide});
    for(let i=0;i<4;i++){
      const g=new THREE.Group();scene.add(g);
      const left=new THREE.Mesh(new THREE.PlaneGeometry(.30,.19),wingMaterial);
      const right=left.clone();left.position.set(-.16,0,0);right.position.set(.16,0,0);
      g.add(left,right);butterflies.push({group:g,left,right,offset:i*1.83});
    }
  }
  const moods=[
    {name:'昼',sky:0xc5e6db,ambient:2.1,sun:3.0,exposure:1.48,bulb:0.0},
    {name:'夕方',sky:0xedc6a5,ambient:1.68,sun:2.1,exposure:1.38,bulb:.65},
    {name:'夜',sky:0x314c68,ambient:1.28,sun:1.05,exposure:1.21,bulb:1.0}
  ];
  let phase=0;
  function applyMood(){
    const mood=moods[phase];scene.background.set(mood.sky);
    if(scene.fog)scene.fog.color.set(mood.sky);
    ambient.intensity=mood.ambient;sun.intensity=mood.sun;
    renderer.toneMappingExposure=mood.exposure;
    for(const pane of windows)pane.material.emissiveIntensity=.08+mood.bulb*1.4;
    for(const halo of halos)halo.material.opacity=mood.bulb;
    for(const lantern of lanterns)lantern.material.color.setHex(mood.bulb>0?0xffedbb:0xb0aea0);
  }
  applyMood();
  let lastMotion=0;
  function update(t){
    // The visual motion is deliberately slow and can be skipped on low-power phones.
    if(lowPower&&t-lastMotion<.085)return;
    lastMotion=t;
    ripples.forEach((ring,i)=>{const size=.72+(t*.38+i*.46)%1.0;
      ring.scale.set(size,size,1);ring.material.opacity=.48*(1-(size-.72)/1.3);});
    for(const b of butterflies){
      const time=t*.8+b.offset;
      b.group.position.set(-3.2+Math.sin(time)*1.6,1.5+Math.sin(time*2)*.3,3.3+Math.cos(time*.7)*1.3);
      b.left.rotation.y=Math.sin(time*8)*.95;
      b.right.rotation.y=-b.left.rotation.y;
    }
  }
  return {update,cycleTime(){phase=(phase+1)%moods.length;applyMood();return moods[phase].name;},
    getTime(){return moods[phase].name;},getSummary(){return {houses:houses.length,flowers:n,pebbles:p,lamps:lanternPositions.length}}};
}
