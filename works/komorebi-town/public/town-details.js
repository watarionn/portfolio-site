/* こもれび町 3D の追加景観。既存の家・時刻切替・操作系には介入しない。
 * 追加依存と外部画像なし。大量の屋根瓦/野花は InstancedMesh を使用。 */
export function buildTownDetails({THREE,scene,houses,collision,rnd,lowPower,reducedMotion=false}) {
  const unit=new THREE.BoxGeometry(1,1,1);
  const stone=new THREE.MeshStandardMaterial({color:0xd2c9ac,roughness:.94});
  const wood=new THREE.MeshStandardMaterial({color:0x906b4d,roughness:1});
  const seaBlue=new THREE.MeshStandardMaterial({color:0x80c3ce,roughness:.28,transparent:true,opacity:.9});
  const lampWhite=new THREE.MeshBasicMaterial({color:0xffe5ae});
  const rope=new THREE.MeshStandardMaterial({color:0xb7a382,roughness:1});
  const dummy=new THREE.Object3D();
  const butterflies=[],rippleRings=[],glowObjects=[];
  function block(parent,x,y,z,w,h,d,material){
    const o=new THREE.Mesh(unit,material);o.position.set(x,y,z);o.scale.set(w,h,d);o.castShadow=false;
    parent.add(o);return o;
  }
  function sphere(parent,x,y,z,r,material){
    const o=new THREE.Mesh(new THREE.IcosahedronGeometry(r,1),material);
    o.position.set(x,y,z);o.castShadow=false;parent.add(o);return o;
  }
  // Each house's existing sloping roof is a stable anchor for fine shingle detail.
  const roofPalette=[0xd78975,0x82b5b7,0xd4a362,0xb191b9];
  const shingleGeo=new THREE.BoxGeometry(.63,.05,.38);
  for(const [i,entry] of houses.entries()){
    const roofColor=new THREE.Color(roofPalette[i]);
    for(const roof of entry.roofs){
      const tiles=new THREE.InstancedMesh(shingleGeo,
        new THREE.MeshStandardMaterial({color:0xffffff,roughness:1}),9*7);
      for(let row=0;row<7;row++)for(let col=0;col<9;col++){
        const k=row*9+col;
        dummy.position.set(-2.92+col*.73+(row%2)*.1,.197,-1.52+row*.51);
        dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();
        tiles.setMatrixAt(k,dummy.matrix);
        tiles.setColorAt(k,roofColor.clone().multiplyScalar(.86+(k%5)*.047));
      }
      tiles.instanceMatrix.needsUpdate=true;
      if(tiles.instanceColor)tiles.instanceColor.needsUpdate=true;
      tiles.castShadow=false;tiles.receiveShadow=false;roof.add(tiles);
    }
    // Cottage side beds preserve the doors, street and existing front planters.
    const house=entry.group;
    const planter=block(house,-2.85,.46,3.44,.82,.38,.69,wood);
    for(let k=0;k<3;k++)sphere(house,-3.08+k*.22,.85,3.43,.16,
      new THREE.MeshStandardMaterial({color:[0xf4cc87,0xe5aeb7,0xc1badc][(k+i)%3],roughness:1}));
    // A short wooden beam with a tiny accent above the awning or door.
    block(house,0,3.80,3.05,2.75,.16,.14,wood);
  }

  // Fountain is to the side of the noticeboard, outside the central entrance routes.
  const fountain=new THREE.Group();fountain.position.set(3.45,0,-3.70);scene.add(fountain);
  const basin=new THREE.Mesh(new THREE.CylinderGeometry(1.23,1.40,.43,12),stone);
  basin.position.y=.27;fountain.add(basin);
  const water=new THREE.Mesh(new THREE.CylinderGeometry(1.10,1.10,.025,24),seaBlue);
  water.position.y=.498;fountain.add(water);
  const column=new THREE.Mesh(new THREE.CylinderGeometry(.19,.27,.98,10),stone);
  column.position.y=1.02;fountain.add(column);
  sphere(fountain,0,1.53,0,.24,seaBlue);
  for(let i=0;i<2;i++){
    const ring=new THREE.Mesh(new THREE.RingGeometry(.3+i*.30,.34+i*.30,28),
      new THREE.MeshBasicMaterial({color:0xe2f5eb,transparent:true,opacity:.6,side:THREE.DoubleSide,depthWrite:false}));
    ring.rotation.x=-Math.PI/2;ring.position.y=.522;fountain.add(ring);rippleRings.push(ring);
  }
  collision.push({x:3.45,z:-3.70,r:1.35});

  // Timber pier extends over the water, and remains outside the walking boundary.
  const pier=new THREE.Group();pier.position.set(0,-.28,26);scene.add(pier);
  for(let plank=0;plank<10;plank++)block(pier,0,.33,plank*.72,4.5,.15,.67,wood);
  for(const x of [-2.05,2.05])for(const z of [.5,3.2,6.1]){
    block(pier,x,-.48,z,.22,1.72,.25,wood);
    block(pier,x,.55,z,.18,.54,.18,rope);
  }

  // Small shoreline reeds, garden stones, and wildflowers at walkable edges.
  const petalGeo=new THREE.IcosahedronGeometry(1,0);
  const petals=new THREE.InstancedMesh(petalGeo,
    new THREE.MeshStandardMaterial({color:0xffffff,roughness:1}),105);
  const stones=new THREE.InstancedMesh(petalGeo,stone,70);
  let flowerCount=0,stoneCount=0;
  for(let i=0;i<750&&(flowerCount<105||stoneCount<70);i++){
    const x=(rnd()-.5)*49,z=(rnd()-.5)*49;
    if(Math.abs(x)<3.1||Math.abs(z)<3.1||houses.some(h=>Math.abs(x-h.x)<5.6&&Math.abs(z-h.z)<5.6))continue;
    if(flowerCount<105){
      dummy.position.set(x,.15,z);dummy.scale.set(.10,.085,.10);
      dummy.rotation.set(0,0,0);dummy.updateMatrix();
      petals.setMatrixAt(flowerCount,dummy.matrix);
      petals.setColorAt(flowerCount,new THREE.Color([0xf6e3ae,0xe5a6af,0xd0b1e0,0xfaf2cf][flowerCount%4]));
      flowerCount++;
    }else if(stoneCount<70){
      dummy.position.set(x,.08,z);dummy.rotation.set(0,i*.1,0);
      dummy.scale.set(.18,.07,.12);dummy.updateMatrix();stones.setMatrixAt(stoneCount++,dummy.matrix);
    }
  }
  petals.count=flowerCount;stones.count=stoneCount;
  petals.instanceMatrix.needsUpdate=true;stones.instanceMatrix.needsUpdate=true;
  if(petals.instanceColor)petals.instanceColor.needsUpdate=true;
  petals.castShadow=false;stones.castShadow=false;scene.add(petals,stones);

  // Four whimsical butterflies are desktop-only. On mobile no new skeletal animation is required.
  if(!lowPower){
    const colors=[0xf8e4a3,0xe6afb8,0xc1d9b1,0xe1cfed];
    for(let i=0;i<4;i++){
      const group=new THREE.Group();scene.add(group);
      const wingMaterial=new THREE.MeshBasicMaterial({color:colors[i],side:THREE.DoubleSide});
      const left=new THREE.Mesh(new THREE.PlaneGeometry(.32,.22),wingMaterial),right=left.clone();
      left.position.x=-.16;right.position.x=.16;group.add(left,right);
      butterflies.push({group,left,right,phase:i*1.57});
    }
  }
  let mood=0,lastMotion=0;
  function setMood(phase){
    mood=phase;
    for(const ring of rippleRings)ring.material.opacity=phase===2?.37:.65;
  }
  function update(t){
    if(reducedMotion)return;
    if(lowPower&&t-lastMotion<.09)return;
    lastMotion=t;
    rippleRings.forEach((ring,i)=>{
      const size=.64+((t*.32+i*.44)%1.0);
      ring.scale.set(size,size,1);
    });
    for(const b of butterflies){
      const q=t*.8+b.phase;
      b.group.position.set(-3+Math.sin(q)*1.6,1.3+Math.sin(q*1.8)*.26,3+Math.cos(q*.6)*1.3);
      b.left.rotation.y=Math.sin(q*9)*.9;b.right.rotation.y=-b.left.rotation.y;
    }
  }
  return {setMood,update,summary(){return {houses:houses.length,shingles:houses.length*126,
    flowers:flowerCount,stones:stoneCount,pier:true,fountain:true,lowPower,mood};}};
}
