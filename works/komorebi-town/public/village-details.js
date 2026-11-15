/* こもれび町 3D: original storybook scenery. No external art or new packages. */
export function decorateTown({THREE,scene,homes,collision,rnd,lowPower=false,reducedMotion=false}) {
  const root=new THREE.Group();root.name='こもれび町の景観';scene.add(root);
  const make=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.88,...extra});
  const boxGeo=new THREE.BoxGeometry(1,1,1),ballGeo=new THREE.IcosahedronGeometry(1,1);
  const wood=make(0x896649),cream=make(0xfff1d6),stone=make(0xc9bc9f);
  const foliage=make(0x64a17a),pot=make(0xc58a65);
  const lightGlass=make(0xffe6a3,{emissive:0xffc779,emissiveIntensity:0});
  const lampGlass=make(0xffe6a3,{emissive:0xffc779,emissiveIntensity:0});
  const flowerColors=[0xf6d18b,0xeeb4c4,0xd6c2ee,0xfff0d5];
  const flowers=flowerColors.map(c=>make(c));
  const names=['図書館','工房','展示館','あそび場'];
  const roofColors=[0xd78975,0x82b5b7,0xd4a362,0xb191b9];
  const trimColors=[0x946774,0x567c84,0xa47b58,0x886798];
  const animated=[],glows=[],ripples=[];
  const temp=new THREE.Object3D();
  function block(g,m,x,y,z,w,h,d) {
    const o=new THREE.Mesh(boxGeo,m);o.position.set(x,y,z);o.scale.set(w,h,d);
    o.castShadow=false;o.receiveShadow=false;g.add(o);return o;
  }
  function pebble(g,m,x,y,z,sx,sy,sz) {
    const o=new THREE.Mesh(ballGeo,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);
    o.castShadow=false;o.receiveShadow=false;g.add(o);return o;
  }
  function textureLabel(value) {
    const c=document.createElement('canvas');c.width=256;c.height=96;
    const ctx=c.getContext('2d');
    ctx.fillStyle='#ab8e6a';ctx.fillRect(0,0,256,96);
    ctx.fillStyle='#fff1d8';ctx.fillRect(9,9,238,78);
    ctx.fillStyle='#5b7664';ctx.font='bold 42px sans-serif';ctx.textAlign='center';
    ctx.fillText(value,128,64);
    const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
    return new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide});
  }
  function plant(parent,x,z,index) {
    block(parent,pot,x,.32,z,.48,.57,.47);
    block(parent,cream,x,.60,z,.59,.09,.54);
    for(let i=0;i<3;i++){
      const dx=(i-1)*.20;
      pebble(parent,foliage,x+dx,.88,z,.15,.27,.17);
      pebble(parent,flowers[(index+i)%4],x+dx,.99,z+.02,.13,.13,.13);
    }
  }
  const slope=Math.atan2(2.05,3.4);
  const colors=[0xe7b38c,0x8fc4c3,0xe8c590,0xc2a8c7];
  for(let i=0;i<homes.length;i++){
    const [x,z,,front]=homes[i];
    const g=new THREE.Group();g.name=names[i];g.position.set(x,0,z);
    g.rotation.y=front<0?Math.PI:0;root.add(g);
    const accent=make(trimColors[i]),roof=make(roofColors[i]);
    // Individually offset roof shingles, but only two instanced draw calls per house.
    for(const side of [-1,1]) {
      const plane=new THREE.Group();plane.position.set(0,4.85,side*1.7);
      plane.rotation.x=side*slope;g.add(plane);
      const tiles=new THREE.InstancedMesh(boxGeo,roof,45);
      let k=0;
      for(let row=0;row<5;row++)for(let col=0;col<9;col++){
        temp.position.set(-2.74+col*.68+(row%2)*.12,.2,-1.7+row*.84);
        temp.scale.set(.60,.084,.65);temp.rotation.set(0,0,0);temp.updateMatrix();
        tiles.setMatrixAt(k++,temp.matrix);
      }
      tiles.instanceMatrix.needsUpdate=true;tiles.castShadow=false;plane.add(tiles);
    }
    // Timber-framed facades, window boxes, name boards and a walkable doorstep.
    for(const px of [-2.87,2.87])block(g,wood,px,2,2.78,.17,3.5,.18);
    block(g,wood,0,3.62,2.78,5.9,.17,.18);
    block(g,cream,0,.17,3.24,2.1,.18,1.3);
    block(g,accent,0,3.04,3.00,2.62,1.04,.16);
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(2.37,.83),textureLabel(names[i]));
    sign.position.set(0,3.04,3.095);g.add(sign);
    for(const wx of [-1.85,1.85]){
      block(g,accent,wx,1.45,3.04,1.19,.26,.43);
      for(let p=0;p<3;p++)pebble(g,flowers[(i+p)%4],wx-.35+p*.35,1.67,3.13,.14,.13,.13);
    }
    block(g,lightGlass,-1.85,2.12,2.84,.71,.73,.05);
    plant(g,-2.27,3.35,i);plant(g,2.27,3.35,i+2);
    block(g,lampGlass,1.0,2.66,3.04,.26,.35,.23);
    block(g,wood,1.0,2.88,3.03,.35,.08,.35);
    if(i===0){
      block(g,accent,-2.05,1.18,3.3,.72,1.05,.50);
      block(g,wood,-2.05,1.62,3.57,.60,.12,.11);
    } else if(i===1){
      for(let k=0;k<3;k++)block(g,make([0xe0b881,0x8da9a3,0xd59c72][k]),2.05+k*.24,1.37+k*.12,3.53,.14,.74,.13);
      const vane=new THREE.Group();vane.position.set(-1.66,6.45,-.8);g.add(vane);
      block(vane,wood,0,.15,0,.09,1.1,.09);block(vane,accent,0,.46,0,.95,.11,.12);
      animated.push({type:'vane',object:vane});
    } else if(i===2){
      for(const px of [-2.35,2.35])block(g,make(px<0?0x9ab6ce:0xe7b2ae),px,2.79,3.04,.45,.77,.11);
      pebble(g,stone,2,.78,4.05,.45,.72,.42);
    } else {
      for(let k=0;k<6;k++)block(g,make(k%2?0xffe3b1:0xdba0ad),-1.4+k*.55,2.52,3.44,.53,.11,.96);
      for(let k=0;k<3;k++){
        pebble(g,make([0xf0aabb,0xa7cbbe,0xffd597][k]),2.1+(k-1)*.32,2.2+k*.24,3.82,.27,.39,.27);
        block(g,wood,2.1+(k-1)*.32,1.42+k*.17,3.82,.025,1.22,.025);
      }
    }
    for(let k=0;k<4;k++)block(g,stone,0,.105,3.57+k*.52,1.16,.075,.34);
  }
  // Decorative plants and paving are batched instead of making hundreds of meshes.
  function batch(geometry,material,points) {
    if(!points.length)return;
    const inst=new THREE.InstancedMesh(geometry,material,points.length);
    points.forEach((p,i)=>{temp.position.set(p[0],p[1],p[2]);
      temp.rotation.set(0,p[6]||0,0);temp.scale.set(p[3],p[4],p[5]);
      temp.updateMatrix();inst.setMatrixAt(i,temp.matrix);
      if(p[7])inst.setColorAt(i,new THREE.Color(p[7]));});
    inst.instanceMatrix.needsUpdate=true;inst.castShadow=false;inst.receiveShadow=false;root.add(inst);
  }
  const blossoms=[],tufts=[],stones=[];
  for(let n=0;n<310;n++){
    const x=(rnd()-.5)*48,z=(rnd()-.5)*48;
    if(Math.abs(x)<3.5||Math.abs(z)<3.5)continue;
    if(homes.some(h=>Math.abs(x-h[0])<5.1&&Math.abs(z-h[1])<5.1))continue;
    if(n%3===0)blossoms.push([x,.20,z,.13,.15,.13,0,flowerColors[n%4]]);
    else tufts.push([x,.20,z,.13,.25,.13,rnd()*6.28,0x60a27c]);
  }
  batch(ballGeo,make(0xffffff),blossoms);
  batch(new THREE.ConeGeometry(1,1,3),make(0xffffff),tufts);
  for(let n=0;n<220;n++){
    const x=(rnd()-.5)*48,z=(rnd()-.5)*48;
    if(!(Math.abs(x)<2.5||Math.abs(z)<2.5)||x*x+z*z<33)continue;
    stones.push([x,.10,z,.16+rnd()*.21,.045,.20+rnd()*.12,rnd()*6.28]);
  }
  batch(boxGeo,stone,stones);
  // Small fountain with ripples on the cobbled circular plaza.
  const fountain=new THREE.Group();fountain.position.set(-1.5,0,2.1);root.add(fountain);
  collision.push({x:-1.5,z:2.1,r:1.4});
  const cylinder=(r1,r2,h,m,y,parent=fountain)=>{
    const o=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,14),m);
    o.position.y=y;parent.add(o);return o;
  };
  cylinder(1.14,1.2,.55,stone,.35);
  cylinder(1.23,1.23,.19,make(0xb3c0b2),.65);
  cylinder(1.06,1.06,.07,make(0x8bcfcb,{metalness:.04}),.76);
  cylinder(.21,.29,.65,cream,1.12);
  pebble(fountain,make(0xe4f5d4),0,1.50,0,.23,.24,.23);
  const waterMaterial=new THREE.MeshBasicMaterial({color:0xd8f5f0,transparent:true,opacity:.54,depthWrite:false});
  for(let k=0;k<3;k++){
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.36+k*.19,.025,6,40),waterMaterial);
    ring.position.y=.815+k*.004;ring.rotation.x=Math.PI/2;fountain.add(ring);
    ripples.push({ring,offset:k});
  }
  // Four vintage street lamps. Emissive glass rather than many expensive lights.
  for(const [x,z] of [[-6.8,-6.8],[6.8,-6.8],[-6.8,6.8],[6.8,6.8]]) {
    const g=new THREE.Group();g.position.set(x,0,z);root.add(g);
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.10,.14,2.52,8),wood);
    pole.position.y=1.30;g.add(pole);
    block(g,wood,0,2.57,0,.49,.14,.48);
    block(g,lampGlass,0,2.82,0,.31,.40,.32);
    block(g,cream,0,3.06,0,.55,.13,.55);
    collision.push({x,z,r:.43});
  }
  for(const [x,z] of [[-6.2,-3.7],[6.2,-3.7],[-6.2,3.7],[6.2,3.7]]) {
    const bed=new THREE.Group();bed.position.set(x,0,z);root.add(bed);
    pebble(bed,stone,0,.12,0,1.2,.19,.50);
    for(let i=0;i<7;i++){
      pebble(bed,foliage,(i-3)*.31,.37,Math.sin(i)*.17,.24,.24,.21);
      pebble(bed,flowers[i%4],(i-3)*.31,.57,Math.sin(i)*.17,.14,.13,.13);
    }
  }
  const coast=[];
  for(let n=0;n<110;n++){
    const side=n%4,at=-24.5+rnd()*49,edge=24.8+rnd()*1.8;
    const x=side===0?-edge:side===1?edge:at;
    const z=side===2?-edge:side===3?edge:at;
    coast.push([x,-.88,z,.20+rnd()*.3,.19+rnd()*.23,.24+rnd()*.3]);
  }
  batch(ballGeo,make(0xa8aaa0),coast);
  function setTime(mode) {
    const level=mode===0?0:mode===1?.75:1.4;
    lightGlass.emissiveIntensity=level;lampGlass.emissiveIntensity=level;
  }
  function update(t) {
    if(reducedMotion)return;
    for(const {ring,offset} of ripples)ring.scale.setScalar(.80+((t*.27+offset/3)%1)*.55);
    for(const a of animated)a.object.rotation.y=t*.20;
  }
  setTime(0);
  return {setTime,update,stats:{roofTiles:360,flowers:blossoms.length,tufts:tufts.length,stones:stones.length}};
}
