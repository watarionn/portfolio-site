/* こもれび町 2.5D: handcrafted environment detail and atmospheric layer.
 * No assets, third-party runtime, network access or persistent data needed. */
(() => {
  'use strict';
  window.KomorebiArt = function ({ctx, iso, getZoom, reduceMotion}) {
    const TAU=Math.PI*2;
    let phase=0, tick=0;
    const palettes=[
      {label:'昼', sky:'#8ebdc1', tint:null, lamps:false},
      {label:'夕方', sky:'#d9a98f', tint:'rgba(231,130,84,.22)', lamps:true},
      {label:'夜', sky:'#526888', tint:'rgba(24,37,85,.60)', lamps:true}
    ];
    const seedPoints=[];
    let r=8572;
    const rand=()=>{r=(Math.imul(r,1664525)+1013904223)>>>0;return r/4294967296;};
    for(let i=0;i<45;i++)seedPoints.push({x:1+rand()*25,z:1+rand()*25,rate:rand()*2.6,seed:rand()*TAU});
    const c=(x,y)=>[Math.round(x),Math.round(y)];
    const rect=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));};
    const polygon=(ps,color,stroke)=>{ctx.beginPath();ctx.moveTo(...c(...ps[0]));for(let i=1;i<ps.length;i++)ctx.lineTo(...c(...ps[i]));ctx.closePath();ctx.fillStyle=color;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}};
    function oval(x,y,rx,ry,color){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fillStyle=color;ctx.fill();}
    function ring(x,y,rx,ry,color,width=1){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
    const txt=(s,x,y,font,color)=>{ctx.font=font;ctx.textAlign='center';ctx.fillStyle=color;ctx.fillText(s,x,y);};
    function roofBrick(x,y,s,variant){
      // Offset tiles imply individually laid shingles without a texture download.
      for(let row=0;row<4;row++)for(let col=0;col<7;col++){
        const X=x+(-22+col*7+row%2*3)*s, Y=y+(row*5+col*.5)*s;
        rect(X,Y,5*s,1.1*s,variant===0?'#fff2e1a0':variant===1?'#f8d9b392':variant===2?'#d3f1eaa0':'#ffe1c39b');
      }
    }
    function sign(x,y,s,icon,color){
      // Framed hanging iron sign, in the same visual language as the town roofs.
      rect(x-2*s,y-22*s,3*s,21*s,'#695f54');rect(x-2*s,y-22*s,16*s,3*s,'#695f54');
      oval(x+12*s,y-12*s,9*s,10*s,'#fff7d9');ring(x+12*s,y-12*s,9*s,10*s,color,2*s);
      txt(icon,x+12*s,y-8*s,`bold ${13*s}px serif`,color);
    }
    function plantPot(x,y,s,kind){
      oval(x,y+2*s,8*s,3*s,'#405a4160');
      polygon([[x-6*s,y-5*s],[x+6*s,y-5*s],[x+4*s,y+5*s],[x-4*s,y+5*s]],'#c47d58','#9a614a');
      rect(x-7*s,y-6*s,14*s,3*s,'#d99b73');
      for(let i=0;i<6;i++){
        const a=i*2.4;oval(x+Math.sin(a)*5*s,y-(13+i%3*4)*s,4*s,3*s,kind==='flowers'?['#e8a8ba','#fff2b1','#d1b4e8'][i%3]:'#6baf7e');
      }
    }
    function drawHouse(h){
      const p=iso(h.x,h.z),s=getZoom();
      if(p.x<-155||p.x>innerWidth+155||p.y<-220||p.y>innerHeight+150)return;
      const top=p.y-49*s;
      const base=p.y+19*s;
      // Edged roof and hand-painted shingle rows.
      roofBrick(p.x,top-23*s,s,(['図書館','工房','展示館','あそび場'].indexOf(h.name)+4)%4);
      polygon([[p.x-44*s,top+3*s],[p.x,top+25*s],[p.x,top+29*s],[p.x-44*s,top+7*s]],'#f2d8ae');
      polygon([[p.x,top+25*s],[p.x+44*s,top+3*s],[p.x+44*s,top+7*s],[p.x,top+29*s]],'#d7b38c');
      // Warm stone foundation and timber framing.
      polygon([[p.x-46*s,p.y-3*s],[p.x,p.y+22*s],[p.x,p.y+27*s],[p.x-46*s,p.y+2*s]],'#c7af8f');
      polygon([[p.x,p.y+22*s],[p.x+46*s,p.y-3*s],[p.x+46*s,p.y+2*s],[p.x,p.y+27*s]],'#aa987f');
      rect(p.x-37*s,p.y-29*s,3*s,20*s,'#bba184');
      rect(p.x+32*s,p.y-25*s,3*s,16*s,'#b59b7c');
      // Windows: shadows and clear four-pane highlights.
      for(const dx of [-25,25]){
        rect(p.x+dx*s-6*s,p.y-27*s,13*s,17*s,'#a17b64');
        rect(p.x+dx*s-4*s,p.y-25*s,9*s,13*s,'#9fd2ca');
        rect(p.x+dx*s,p.y-25*s,1.5*s,13*s,'#f8f2d6');
        rect(p.x+dx*s-4*s,p.y-20*s,9*s,1.5*s,'#f8f2d6');
        rect(p.x+dx*s-6*s,p.y-12*s,14*s,2*s,'#f8e0b0');
      }
      // Each of four landmarks has its own facade details and silhouette.
      if(h.name==='図書館'){
        const ink='#765c91';
        sign(p.x-40*s,p.y-31*s,s,'本',ink);
        polygon([[p.x-17*s,p.y-14*s],[p.x+2*s,p.y-4*s],[p.x+2*s,p.y],[p.x-17*s,p.y-10*s]],'#e9c6b3');
        for(let i=0;i<4;i++)rect(p.x-42*s+i*5*s,p.y-10*s+i*2*s,3*s,10*s,['#e18f7d','#6b98a0','#e9bd74','#907faf'][i]);
        plantPot(p.x-50*s,base,s*.75,'flowers');
        // Small attic window and books carved on the roof.
        oval(p.x,top-18*s,10*s,6*s,'#704e75');oval(p.x,top-18*s,7*s,4*s,'#eecb91');
      }else if(h.name==='工房'){
        sign(p.x-40*s,p.y-30*s,s,'⚙','#966744');
        rect(p.x+15*s,top-52*s,13*s,31*s,'#b48a75');rect(p.x+13*s,top-54*s,17*s,4*s,'#f5d3b4');
        if(!reduceMotion)for(let i=0;i<3;i++){
          const a=tick*.35+i;oval(p.x+(23+Math.sin(a)*5)*s,top-(61+i*12+Math.cos(a)*2)*s,(7+i*2)*s,(4+i*1.5)*s,'#f8f0d2a5');
        }
        rect(p.x-42*s,p.y-5*s,23*s,4*s,'#937458');
        rect(p.x-38*s,p.y-14*s,4*s,10*s,'#d3a164');rect(p.x-31*s,p.y-18*s,4*s,14*s,'#e7c47b');
        plantPot(p.x+55*s,base,s*.65,'leaves');
      }else if(h.name==='展示館'){
        sign(p.x-40*s,p.y-30*s,s,'絵','#4f8798');
        for(const dx of [-32,30]){
          oval(p.x+dx*s,p.y-24*s,7*s,9*s,'#6d929c');
          oval(p.x+dx*s,p.y-24*s,5*s,7*s,'#e7e4b6');
          rect(p.x+(dx-1)*s,p.y-29*s,2*s,11*s,'#fff2d9');
        }
        // Exhibition flags on the roof line.
        for(let i=0;i<5;i++)polygon([[p.x+(i*9-19)*s,top-22*s],[p.x+(i*9-15)*s,top-18*s],[p.x+(i*9-19)*s,top-12*s]],['#d77c7b','#e7b86d','#7aa6aa','#b99bc6','#df917b'][i]);
        plantPot(p.x+52*s,base,s*.9,'flowers');
      }else {
        sign(p.x-40*s,p.y-30*s,s,'★','#b87858');
        // Fabric canopy, bunting and a toy display near the entrance.
        polygon([[p.x-47*s,p.y-16*s],[p.x-12*s,p.y],[p.x-12*s,p.y+8*s],[p.x-47*s,p.y-8*s]],'#e4b885');
        for(let i=0;i<5;i++)polygon([[p.x+(-44+i*7)*s,p.y+(-14+i*3.5)*s],[p.x+(-37+i*7)*s,p.y+(-10+i*3.5)*s],[p.x+(-39+i*7)*s,p.y+(-3+i*3.5)*s]],i%2?'#f6d499':'#d88d83');
        rect(p.x+36*s,p.y-22*s,2*s,32*s,'#937356');
        oval(p.x+37*s,p.y-33*s,9*s,12*s,'#df989c');
        oval(p.x+51*s,p.y-29*s,8*s,11*s,'#b8b1df');
        plantPot(p.x-51*s,base,s*.8,'flowers');
      }
    }
    function drawTree(t){const p=iso(t.x,t.z),s=getZoom()*t.size;
      if(p.x<-100||p.x>innerWidth+100||p.y<-150||p.y>innerHeight+70)return;
      const y=p.y-27*s;
      // Flecks of sunlight in the canopy, clustered on visible crown facets.
      for(let i=0;i<12;i++){
        const a=i*2.39996+t.shade,rr=(9+(i%4)*4)*s;
        const X=p.x+Math.cos(a)*rr,Y=y+Math.sin(a)*rr*.58;
        rect(X,Y,(i%3+2)*s,2*s,['#e9eba9ad','#d3e89bae','#b6d8a3','#fff4ba9c'][i%4]);
      }
      if(t.shade===1){for(let i=0;i<3;i++)oval(p.x+(i-1)*13*s,y+(i%2)*7*s,2.7*s,2.7*s,'#dc918d');}
      if(t.shade===2){for(let i=0;i<3;i++)oval(p.x+(i-1)*12*s,y+(i%2)*9*s,2*s,2*s,'#f1d088');}
    }
    function drawPlantBed(x,z,kind=0){const p=iso(x,z),s=getZoom();if(p.x<-70||p.x>innerWidth+70||p.y<-90||p.y>innerHeight+60)return;
      oval(p.x,p.y+3*s,18*s,7*s,'#618d68aa');
      oval(p.x,p.y,17*s,6*s,'#629c68');
      for(let i=0;i<8;i++){
        const a=i*2.4,xx=p.x+Math.cos(a)*12*s,yy=p.y+Math.sin(a)*4*s;
        oval(xx,yy,3.8*s,2.8*s,['#f6f0bb','#e5a3af','#c8b5e2','#ffffff'][((i+kind)%4)]);
        oval(xx,yy,1*s,1*s,'#eab768');
      }
    }
    function drawLamp(x,z){const p=iso(x,z),s=getZoom();if(p.x<-55||p.x>innerWidth+55||p.y<-95||p.y>innerHeight+50)return;
      oval(p.x,p.y+2*s,9*s,3*s,'#6a85617a');
      rect(p.x-1.6*s,p.y-41*s,3.2*s,42*s,'#5f6755');
      rect(p.x-7*s,p.y-44*s,14*s,3*s,'#5f6755');
      polygon([[p.x-6*s,p.y-44*s],[p.x-9*s,p.y-55*s],[p.x+9*s,p.y-55*s],[p.x+6*s,p.y-44*s]],'#617866');
      rect(p.x-5*s,p.y-52*s,10*s,10*s,phase===0?'#f3e8bb':'#ffe2a0');
      rect(p.x-6*s,p.y-53*s,2*s,12*s,'#5f6755');rect(p.x+4*s,p.y-53*s,2*s,12*s,'#5f6755');
      if(phase){const g=ctx.createRadialGradient(p.x,p.y-47*s,2,p.x,p.y-47*s,48*s);
        g.addColorStop(0,'#ffedabbb');g.addColorStop(.26,'#ffe5a166');g.addColorStop(1,'#ffe9aa00');
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y-47*s,48*s,0,TAU);ctx.fill();}
    }
    function drawBench(x,z){const p=iso(x,z),s=getZoom();if(p.x<-65||p.x>innerWidth+65||p.y<-65||p.y>innerHeight+60)return;
      oval(p.x,p.y+3*s,24*s,7*s,'#61806b8f');
      rect(p.x-18*s,p.y-10*s,4*s,20*s,'#766957');rect(p.x+14*s,p.y-10*s,4*s,20*s,'#766957');
      polygon([[p.x-24*s,p.y-10*s],[p.x+8*s,p.y+4*s],[p.x+24*s,p.y-4*s],[p.x-8*s,p.y-18*s]],'#b88961','#755845');
      polygon([[p.x-24*s,p.y-19*s],[p.x+8*s,p.y-5*s],[p.x+8*s,p.y-1*s],[p.x-24*s,p.y-15*s]],'#9d714f');
      for(let i=0;i<3;i++)rect(p.x-14*s+i*7*s,p.y-11*s+i*2*s,3*s,2*s,'#e1b084');
    }
    function drawGroundDetails(){
      const plants=[[9,9,1],[17,9,2],[9,17,0],[17,17,1],[5,13,0],[21,13,3]];
      for(const [x,z,kind] of plants)drawPlantBed(x,z,kind);
      const points=[[11,11],[15,11],[11,15],[15,15]];
      for(const [x,z] of points)drawLamp(x,z);
      drawBench(11,18);drawBench(17,12);
    }
    function drawFountain(x,z){const p=iso(x,z),s=getZoom();
      // Countertop parapet, stacked stone tiers and running water.
      oval(p.x,p.y+7*s,39*s,17*s,'#8e9682');
      oval(p.x,p.y+3*s,35*s,14*s,'#dfd3ad');
      oval(p.x,p.y-1*s,31*s,11*s,'#a9d8d4');
      oval(p.x,p.y-2*s,26*s,8*s,'#72b0b8');
      ring(p.x,p.y-1*s,(10+(tick*6)%14)*s,(3+(tick*2)%5)*s,'#e3fcfa97',1.7*s);
      rect(p.x-4*s,p.y-30*s,8*s,26*s,'#e7dab7');
      oval(p.x,p.y-31*s,10*s,5*s,'#b4dadd');
      rect(p.x-3*s,p.y-41*s,6*s,13*s,'#a5c8c1');
      oval(p.x,p.y-43*s,5*s,5*s,'#eef5dd');
      if(!reduceMotion)for(let i=0;i<4;i++){
        const a=(tick*1.7+i*1.58),rr=10*s;
        rect(p.x+Math.cos(a)*rr,p.y-30*s+(Math.sin(a)*3*s),2*s,4*s,'#d2f1eb');
      }
    }
    function drawAtmosphere(W,H,houses){
      if(phase===1||phase===2){ctx.fillStyle=palettes[phase].tint;ctx.fillRect(0,0,W,H);}
      if(phase===0){ // faint dappled sunlight follows the camera in screen space
        const g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,'#fff5cf13');g.addColorStop(.65,'#ffffff00');g.addColorStop(1,'#b5d49c0b');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
      }
      if(phase>0){
        // Warm windows emerge at dusk, glows remain entirely ornamental.
        for(const h of houses){const p=iso(h.x,h.z),s=getZoom();
          if(p.x<-110||p.x>W+110||p.y<-140||p.y>H+70)continue;
          for(const dx of [-25,25]){
            const x=p.x+dx*s,y=p.y-19*s;
            const g=ctx.createRadialGradient(x,y,1,x,y,28*s);
            g.addColorStop(0,'#fff5c3bd');g.addColorStop(.4,'#ffe2a058');g.addColorStop(1,'#ffe3ad00');
            ctx.fillStyle=g;ctx.fillRect(x-28*s,y-28*s,56*s,56*s);
            rect(x-3*s,y-5*s,6*s,8*s,'#ffebb0');
          }
        }
      }
      if(phase===2){
        // Fireflies stay subtle: one glow per few tiles, fading gently.
        for(let i=0;i<seedPoints.length;i++){
          const b=seedPoints[i];if(i%2!==0)continue;
          const p=iso(b.x,b.z),fl=reduceMotion?.5:.35+.65*(.5+.5*Math.sin(tick*1.35+b.seed));
          if(p.x<0||p.y<0||p.x>W||p.y>H)continue;
          const x=p.x+Math.sin(tick*.55+b.seed)*10,y=p.y-18+Math.cos(tick*.37+b.rate)*8;
          oval(x,y,2.2,2.2,`rgba(255,234,150,${fl})`);
        }
      }else if(!reduceMotion){
        // Floating petals give scale to the streets without changing navigation.
        for(let i=0;i<seedPoints.length;i++){
          const b=seedPoints[i];if(i%3!==0)continue;
          const p=iso(b.x,b.z),x=p.x+Math.sin(tick*.6+b.seed)*10,y=p.y-22+Math.cos(tick*.5+b.seed)*4;
          if(x<0||y<0||x>W||y>H)continue;
          rect(x,y,3,2,phase===1?'#f7d4b5b0':'#fff0d3b7');
        }
      }
      // Gentle edge vignette, translucent enough to preserve legibility.
      const v=ctx.createRadialGradient(W*.5,H*.43,Math.min(W,H)*.22,W*.5,H*.5,Math.max(W,H)*.78);
      v.addColorStop(0,'#172c2200');v.addColorStop(1,phase===2?'#10192c44':'#35644f1d');ctx.fillStyle=v;ctx.fillRect(0,0,W,H);
    }
    return {
      getPhase:()=>phase,
      label:()=>palettes[phase].label,
      nextPhase:()=>{phase=(phase+1)%3;return palettes[phase].label;},
      sky:()=>palettes[phase].sky,
      advance:now=>{tick=reduceMotion?0:now/1000;},
      drawTree,drawHouse,drawGroundDetails,drawFountain,drawAtmosphere
    };
  };
})();