import{a as C}from"./chunk-RUILMBVM.js";import{S as Z,Z as L,a as K,fa as O,k as X,ma as tt,na as et,oa as A,pa as V,q as Y,r as q,s as J,sa as rt}from"./chunk-4RDZB6CQ.js";var Lt=C.default||C;function E(r,t,e){if(r)for(let i in r){let o=i.toLocaleLowerCase(),a=t[o];if(a){let u=r[i];i==="header"&&(u=u.replace(/@in\s+[^;]+;\s*/g,"").replace(/@out\s+[^;]+;\s*/g,"")),e&&a.push(`//----${e}----//`),a.push(u)}else q(`${i} placement hook does not exist in shader`)}}var Rt=/\{\{(.*?)\}\}/g;function D(r){let t={};return(r.match(Rt)?.map(i=>i.replace(/[{()}]/g,""))??[]).forEach(i=>{t[i]=[]}),t}function it(r,t){let e,i=/@in\s+([^;]+);/g;for(;(e=i.exec(r))!==null;)t.push(e[1])}function R(r,t,e=!1){let i=[];it(t,i),r.forEach(s=>{s.header&&it(s.header,i)});let o=i;e&&o.sort();let a=o.map((s,l)=>`       @location(${l}) ${s},`).join(`
`),u=t.replace(/@in\s+[^;]+;\s*/g,"");return u=u.replace("{{in}}",`
${a}
`),u}function ot(r,t){let e,i=/@out\s+([^;]+);/g;for(;(e=i.exec(r))!==null;)t.push(e[1])}function kt(r){let e=/\b(\w+)\s*:/g.exec(r);return e?e[1]:""}function $t(r){let t=/@.*?\s+/g;return r.replace(t,"")}function nt(r,t){let e=[];ot(t,e),r.forEach(l=>{l.header&&ot(l.header,e)});let i=0,o=e.sort().map(l=>l.indexOf("builtin")>-1?l:`@location(${i++}) ${l}`).join(`,
`),a=e.sort().map(l=>`       var ${$t(l)};`).join(`
`),u=`return VSOutput(
            ${e.sort().map(l=>` ${kt(l)}`).join(`,
`)});`,s=t.replace(/@out\s+[^;]+;\s*/g,"");return s=s.replace("{{struct}}",`
${o}
`),s=s.replace("{{start}}",`
${a}
`),s=s.replace("{{return}}",`
${u}
`),s}function k(r,t){let e=r;for(let i in t){let o=t[i];o.join(`
`).length?e=e.replace(`{{${i}}}`,`//-----${i} START-----//
${o.join(`
`)}
//----${i} FINISH----//`):e=e.replace(`{{${i}}}`,"")}return e}var S=Object.create(null),$=new Map,jt=0;function st({template:r,bits:t}){let e=ut(r,t);if(S[e])return S[e];let{vertex:i,fragment:o}=Ht(r,t);return S[e]=lt(i,o,t),S[e]}function at({template:r,bits:t}){let e=ut(r,t);return S[e]||(S[e]=lt(r.vertex,r.fragment,t)),S[e]}function Ht(r,t){let e=t.map(u=>u.vertex).filter(u=>!!u),i=t.map(u=>u.fragment).filter(u=>!!u),o=R(e,r.vertex,!0);o=nt(e,o);let a=R(i,r.fragment,!0);return{vertex:o,fragment:a}}function ut(r,t){return t.map(e=>($.has(e)||$.set(e,jt++),$.get(e))).sort((e,i)=>e-i).join("-")+r.vertex+r.fragment}function lt(r,t,e){let i=D(r),o=D(t);return e.forEach(a=>{E(a.vertex,i,a.name),E(a.fragment,o,a.name)}),{vertex:k(r,i),fragment:k(t,o)}}var ct=`
    @in aPosition: vec2<f32>;
    @in aUV: vec2<f32>;

    @out @builtin(position) vPosition: vec4<f32>;
    @out vUV : vec2<f32>;
    @out vColor : vec4<f32>;

    {{header}}

    struct VSOutput {
        {{struct}}
    };

    @vertex
    fn main( {{in}} ) -> VSOutput {

        var worldTransformMatrix = globalUniforms.uWorldTransformMatrix;
        var modelMatrix = mat3x3<f32>(
            1.0, 0.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 0.0, 1.0
          );
        var position = aPosition;
        var uv = aUV;

        {{start}}

        vColor = vec4<f32>(1., 1., 1., 1.);

        {{main}}

        vUV = uv;

        var modelViewProjectionMatrix = globalUniforms.uProjectionMatrix * worldTransformMatrix * modelMatrix;

        vPosition =  vec4<f32>((modelViewProjectionMatrix *  vec3<f32>(position, 1.0)).xy, 0.0, 1.0);

        vColor *= globalUniforms.uWorldColorAlpha;

        {{end}}

        {{return}}
    };
`,ht=`
    @in vUV : vec2<f32>;
    @in vColor : vec4<f32>;

    {{header}}

    @fragment
    fn main(
        {{in}}
      ) -> @location(0) vec4<f32> {

        {{start}}

        var outColor:vec4<f32>;

        {{main}}

        var finalColor:vec4<f32> = outColor * vColor;

        {{end}}

        return finalColor;
      };
`,ft=`
    in vec2 aPosition;
    in vec2 aUV;

    out vec4 vColor;
    out vec2 vUV;

    {{header}}

    void main(void){

        mat3 worldTransformMatrix = uWorldTransformMatrix;
        mat3 modelMatrix = mat3(
            1.0, 0.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 0.0, 1.0
          );
        vec2 position = aPosition;
        vec2 uv = aUV;

        {{start}}

        vColor = vec4(1.);

        {{main}}

        vUV = uv;

        mat3 modelViewProjectionMatrix = uProjectionMatrix * worldTransformMatrix * modelMatrix;

        gl_Position = vec4((modelViewProjectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);

        vColor *= uWorldColorAlpha;

        {{end}}
    }
`,dt=`

    in vec4 vColor;
    in vec2 vUV;

    out vec4 finalColor;

    {{header}}

    void main(void) {

        {{start}}

        vec4 outColor;

        {{main}}

        finalColor = outColor * vColor;

        {{end}}
    }
`;var mt={name:"global-uniforms-bit",vertex:{header:`
        struct GlobalUniforms {
            uProjectionMatrix:mat3x3<f32>,
            uWorldTransformMatrix:mat3x3<f32>,
            uWorldColorAlpha: vec4<f32>,
            uResolution: vec2<f32>,
        }

        @group(0) @binding(0) var<uniform> globalUniforms : GlobalUniforms;
        `}},me={name:"global-uniforms-ubo-bit",vertex:{header:`
          uniform globalUniforms {
            mat3 uProjectionMatrix;
            mat3 uWorldTransformMatrix;
            vec4 uWorldColorAlpha;
            vec2 uResolution;
          };
        `}},pt={name:"global-uniforms-bit",vertex:{header:`
          uniform mat3 uProjectionMatrix;
          uniform mat3 uWorldTransformMatrix;
          uniform vec4 uWorldColorAlpha;
          uniform vec2 uResolution;
        `}};function xt({bits:r,name:t}){let e=st({template:{fragment:ht,vertex:ct},bits:[mt,...r]});return O.from({name:t,vertex:{source:e.vertex,entryPoint:"main"},fragment:{source:e.fragment,entryPoint:"main"}})}function vt({bits:r,name:t}){return new L({name:t,...at({template:{vertex:ft,fragment:dt},bits:[pt,...r]})})}var gt={name:"color-bit",vertex:{header:`
            @in aColor: vec4<f32>;
        `,main:`
            vColor *= vec4<f32>(aColor.rgb * aColor.a, aColor.a);
        `}},_t={name:"color-bit",vertex:{header:`
            in vec4 aColor;
        `,main:`
            vColor *= vec4(aColor.rgb * aColor.a, aColor.a);
        `}};var j={};function Ft(r){let t=[];if(r===1)t.push("@group(1) @binding(0) var textureSource1: texture_2d<f32>;"),t.push("@group(1) @binding(1) var textureSampler1: sampler;");else{let e=0;for(let i=0;i<r;i++)t.push(`@group(1) @binding(${e++}) var textureSource${i+1}: texture_2d<f32>;`),t.push(`@group(1) @binding(${e++}) var textureSampler${i+1}: sampler;`)}return t.join(`
`)}function Nt(r){let t=[];if(r===1)t.push("outColor = textureSampleGrad(textureSource1, textureSampler1, vUV, uvDx, uvDy);");else{t.push("switch vTextureId {");for(let e=0;e<r;e++)e===r-1?t.push("  default:{"):t.push(`  case ${e}:{`),t.push(`      outColor = textureSampleGrad(textureSource${e+1}, textureSampler${e+1}, vUV, uvDx, uvDy);`),t.push("      break;}");t.push("}")}return t.join(`
`)}function bt(r){return j[r]||(j[r]={name:"texture-batch-bit",vertex:{header:`
                @in aTextureIdAndRound: vec2<u32>;
                @out @interpolate(flat) vTextureId : u32;
            `,main:`
                vTextureId = aTextureIdAndRound.y;
            `,end:`
                if(aTextureIdAndRound.x == 1)
                {
                    vPosition = vec4<f32>(roundPixels(vPosition.xy, globalUniforms.uResolution), vPosition.zw);
                }
            `},fragment:{header:`
                @in @interpolate(flat) vTextureId: u32;

                ${Ft(r)}
            `,main:`
                var uvDx = dpdx(vUV);
                var uvDy = dpdy(vUV);

                ${Nt(r)}
            `}}),j[r]}var H={};function Wt(r){let t=[];for(let e=0;e<r;e++)e>0&&t.push("else"),e<r-1&&t.push(`if(vTextureId < ${e}.5)`),t.push("{"),t.push(`	outColor = texture(uTextures[${e}], vUV);`),t.push("}");return t.join(`
`)}function St(r){return H[r]||(H[r]={name:"texture-batch-bit",vertex:{header:`
                in vec2 aTextureIdAndRound;
                out float vTextureId;

            `,main:`
                vTextureId = aTextureIdAndRound.y;
            `,end:`
                if(aTextureIdAndRound.x == 1.)
                {
                    gl_Position.xy = roundPixels(gl_Position.xy, uResolution);
                }
            `},fragment:{header:`
                in float vTextureId;

                uniform sampler2D uTextures[${r}];

            `,main:`

                ${Wt(r)}
            `}}),H[r]}var Bt={name:"round-pixels-bit",vertex:{header:`
            fn roundPixels(position: vec2<f32>, targetSize: vec2<f32>) -> vec2<f32>
            {
                return (floor(((position * 0.5 + 0.5) * targetSize) + 0.5) / targetSize) * 2.0 - 1.0;
            }
        `}},yt={name:"round-pixels-bit",vertex:{header:`
            vec2 roundPixels(vec2 position, vec2 targetSize)
            {
                return (floor(((position * 0.5 + 0.5) * targetSize) + 0.5) / targetSize) * 2.0 - 1.0;
            }
        `}};var w=class{constructor(t){typeof t=="number"?this.rawBinaryData=new ArrayBuffer(t):t instanceof Uint8Array?this.rawBinaryData=t.buffer:this.rawBinaryData=t,this.uint32View=new Uint32Array(this.rawBinaryData),this.float32View=new Float32Array(this.rawBinaryData),this.size=this.rawBinaryData.byteLength}get int8View(){return this._int8View||(this._int8View=new Int8Array(this.rawBinaryData)),this._int8View}get uint8View(){return this._uint8View||(this._uint8View=new Uint8Array(this.rawBinaryData)),this._uint8View}get int16View(){return this._int16View||(this._int16View=new Int16Array(this.rawBinaryData)),this._int16View}get int32View(){return this._int32View||(this._int32View=new Int32Array(this.rawBinaryData)),this._int32View}get float64View(){return this._float64Array||(this._float64Array=new Float64Array(this.rawBinaryData)),this._float64Array}get bigUint64View(){return this._bigUint64Array||(this._bigUint64Array=new BigUint64Array(this.rawBinaryData)),this._bigUint64Array}view(t){return this[`${t}View`]}destroy(){this.rawBinaryData=null,this.uint32View=null,this.float32View=null,this.uint16View=null,this._int8View=null,this._uint8View=null,this._int16View=null,this._int32View=null,this._float64Array=null,this._bigUint64Array=null}static sizeOf(t){switch(t){case"int8":case"uint8":return 1;case"int16":case"uint16":return 2;case"int32":case"uint32":case"float32":return 4;default:throw new Error(`${t} isn't a valid view type`)}}};function F(r,t,e,i){if(e??(e=0),i??(i=Math.min(r.byteLength-e,t.byteLength)),!(e&7)&&!(i&7)){let o=i/8;new Float64Array(t,0,o).set(new Float64Array(r,e,o))}else if(!(e&3)&&!(i&3)){let o=i/4;new Float32Array(t,0,o).set(new Float32Array(r,e,o))}else new Uint8Array(t).set(new Uint8Array(r,e,i))}var At={normal:"normal-npm",add:"add-npm",screen:"screen-npm"},Qt=(r=>(r[r.DISABLED=0]="DISABLED",r[r.RENDERING_MASK_ADD=1]="RENDERING_MASK_ADD",r[r.MASK_ACTIVE=2]="MASK_ACTIVE",r[r.INVERSE_MASK_ACTIVE=3]="INVERSE_MASK_ACTIVE",r[r.RENDERING_MASK_REMOVE=4]="RENDERING_MASK_REMOVE",r[r.NONE=5]="NONE",r))(Qt||{});function N(r,t){return t.alphaMode==="no-premultiply-alpha"&&At[r]||r}var Kt=["precision mediump float;","void main(void){","float test = 0.1;","%forloop%","gl_FragColor = vec4(0.0);","}"].join(`
`);function Xt(r){let t="";for(let e=0;e<r;++e)e>0&&(t+=`
else `),e<r-1&&(t+=`if(test == ${e}.0){}`);return t}function wt(r,t){if(r===0)throw new Error("Invalid value of `0` passed to `checkMaxIfStatementsInShader`");let e=t.createShader(t.FRAGMENT_SHADER);try{for(;;){let i=Kt.replace(/%forloop%/gi,Xt(r));if(t.shaderSource(e,i),t.compileShader(e),!t.getShaderParameter(e,t.COMPILE_STATUS))r=r/2|0;else break}}finally{t.deleteShader(e)}return r}var y=null;function It(){if(y)return y;let r=Z();return y=r.getParameter(r.MAX_TEXTURE_IMAGE_UNITS),y=wt(y,r),r.getExtension("WEBGL_lose_context")?.loseContext(),y}var z=class{constructor(){this.ids=Object.create(null),this.textures=[],this.count=0}clear(){for(let t=0;t<this.count;t++){let e=this.textures[t];this.textures[t]=null,this.ids[e.uid]=null}this.count=0}};var W=class{constructor(){this.renderPipeId="batch",this.action="startBatch",this.start=0,this.size=0,this.textures=new z,this.blendMode="normal",this.topology="triangle-strip",this.canBundle=!0}destroy(){this.textures=null,this.gpuBindGroup=null,this.bindGroup=null,this.batcher=null,this.elements=null}},U=[],M=0;J.register({clear:()=>{if(U.length>0)for(let r of U)r&&r.destroy();U.length=0,M=0}});function Ut(){return M>0?U[--M]:new W}function Pt(r){r.elements=null,U[M++]=r}var I=0,Tt=class zt{constructor(t){this.uid=X("batcher"),this.dirty=!0,this.batchIndex=0,this.batches=[],this._elements=[],t={...zt.defaultOptions,...t},t.maxTextures||(Y("v8.8.0","maxTextures is a required option for Batcher now, please pass it in the options"),t.maxTextures=It());let{maxTextures:e,attributesInitialSize:i,indicesInitialSize:o}=t;this.attributeBuffer=new w(i*4),this.indexBuffer=new Uint16Array(o),this.maxTextures=e}begin(){this.elementSize=0,this.elementStart=0,this.indexSize=0,this.attributeSize=0;for(let t=0;t<this.batchIndex;t++)Pt(this.batches[t]);this.batchIndex=0,this._batchIndexStart=0,this._batchIndexSize=0,this.dirty=!0}add(t){this._elements[this.elementSize++]=t,t._indexStart=this.indexSize,t._attributeStart=this.attributeSize,t._batcher=this,this.indexSize+=t.indexSize,this.attributeSize+=t.attributeSize*this.vertexSize}checkAndUpdateTexture(t,e){let i=t._batch.textures.ids[e._source.uid];return!i&&i!==0?!1:(t._textureId=i,t.texture=e,!0)}updateElement(t){this.dirty=!0;let e=this.attributeBuffer;t.packAsQuad?this.packQuadAttributes(t,e.float32View,e.uint32View,t._attributeStart,t._textureId):this.packAttributes(t,e.float32View,e.uint32View,t._attributeStart,t._textureId)}break(t){let e=this._elements;if(!e[this.elementStart])return;let i=Ut(),o=i.textures;o.clear();let a=e[this.elementStart],u=N(a.blendMode,a.texture._source),s=a.topology;this.attributeSize*4>this.attributeBuffer.size&&this._resizeAttributeBuffer(this.attributeSize*4),this.indexSize>this.indexBuffer.length&&this._resizeIndexBuffer(this.indexSize);let l=this.attributeBuffer.float32View,h=this.attributeBuffer.uint32View,x=this.indexBuffer,f=this._batchIndexSize,d=this._batchIndexStart,g="startBatch",m=[],b=this.maxTextures;for(let v=this.elementStart;v<this.elementSize;++v){let n=e[v];e[v]=null;let c=n.texture._source,p=N(n.blendMode,c),_=u!==p||s!==n.topology;if(c._batchTick===I&&!_){n._textureId=c._textureBindLocation,f+=n.indexSize,n.packAsQuad?(this.packQuadAttributes(n,l,h,n._attributeStart,n._textureId),this.packQuadIndex(x,n._indexStart,n._attributeStart/this.vertexSize)):(this.packAttributes(n,l,h,n._attributeStart,n._textureId),this.packIndex(n,x,n._indexStart,n._attributeStart/this.vertexSize)),n._batch=i,m.push(n);continue}c._batchTick=I,(o.count>=b||_)&&(this._finishBatch(i,d,f-d,o,u,s,t,g,m),g="renderBatch",d=f,u=p,s=n.topology,i=Ut(),o=i.textures,o.clear(),m=[],++I),n._textureId=c._textureBindLocation=o.count,o.ids[c.uid]=o.count,o.textures[o.count++]=c,n._batch=i,m.push(n),f+=n.indexSize,n.packAsQuad?(this.packQuadAttributes(n,l,h,n._attributeStart,n._textureId),this.packQuadIndex(x,n._indexStart,n._attributeStart/this.vertexSize)):(this.packAttributes(n,l,h,n._attributeStart,n._textureId),this.packIndex(n,x,n._indexStart,n._attributeStart/this.vertexSize))}o.count>0&&(this._finishBatch(i,d,f-d,o,u,s,t,g,m),d=f,++I),this.elementStart=this.elementSize,this._batchIndexStart=d,this._batchIndexSize=f}_finishBatch(t,e,i,o,a,u,s,l,h){t.gpuBindGroup=null,t.bindGroup=null,t.action=l,t.batcher=this,t.textures=o,t.blendMode=a,t.topology=u,t.start=e,t.size=i,t.elements=h,++I,this.batches[this.batchIndex++]=t,s.add(t)}finish(t){this.break(t)}ensureAttributeBuffer(t){t*4<=this.attributeBuffer.size||this._resizeAttributeBuffer(t*4)}ensureIndexBuffer(t){t<=this.indexBuffer.length||this._resizeIndexBuffer(t)}_resizeAttributeBuffer(t){let e=Math.max(t,this.attributeBuffer.size*2),i=new w(e);F(this.attributeBuffer.rawBinaryData,i.rawBinaryData),this.attributeBuffer=i}_resizeIndexBuffer(t){let e=this.indexBuffer,i=Math.max(t,e.length*1.5);i+=i%2;let o=i>65535?new Uint32Array(i):new Uint16Array(i);if(o.BYTES_PER_ELEMENT!==e.BYTES_PER_ELEMENT)for(let a=0;a<e.length;a++)o[a]=e[a];else F(e.buffer,o.buffer);this.indexBuffer=o}packQuadIndex(t,e,i){t[e]=i+0,t[e+1]=i+1,t[e+2]=i+2,t[e+3]=i+0,t[e+4]=i+2,t[e+5]=i+3}packIndex(t,e,i,o){let a=t.indices,u=t.indexSize,s=t.indexOffset,l=t.attributeOffset;for(let h=0;h<u;h++)e[i++]=o+a[h+s]-l}destroy(t={}){if(this.batches!==null){for(let e=0;e<this.batchIndex;e++)Pt(this.batches[e]);this.batches=null,this.geometry.destroy(!0),this.geometry=null,t.shader&&(this.shader?.destroy(),this.shader=null);for(let e=0;e<this._elements.length;e++)this._elements[e]&&(this._elements[e]._batch=null);this._elements=null,this.indexBuffer=null,this.attributeBuffer.destroy(),this.attributeBuffer=null}}};Tt.defaultOptions={maxTextures:null,attributesInitialSize:4,indicesInitialSize:6};var Mt=Tt;var Yt=new Float32Array(1),qt=new Uint32Array(1),G=class extends rt{constructor(){let e=new V({data:Yt,label:"attribute-batch-buffer",usage:A.VERTEX|A.COPY_DST,shrinkToFit:!1}),i=new V({data:qt,label:"index-batch-buffer",usage:A.INDEX|A.COPY_DST,shrinkToFit:!1}),o=24;super({attributes:{aPosition:{buffer:e,format:"float32x2",stride:o,offset:0},aUV:{buffer:e,format:"float32x2",stride:o,offset:8},aColor:{buffer:e,format:"unorm8x4",stride:o,offset:16},aTextureIdAndRound:{buffer:e,format:"uint16x2",stride:o,offset:20}},indexBuffer:i})}};var Gt={};function Ct(r){let t=Gt[r];if(t)return t;let e=new Int32Array(r);for(let i=0;i<r;i++)e[i]=i;return t=Gt[r]=new tt({uTextures:{value:e,type:"i32",size:r}},{isStatic:!0}),t}var P=class extends et{constructor(t){let e=vt({name:"batch",bits:[_t,St(t),yt]}),i=xt({name:"batch",bits:[gt,bt(t),Bt]});super({glProgram:e,gpuProgram:i,resources:{batchSamplers:Ct(t)}}),this.maxTextures=t}};var T=null,Vt=class Et extends Mt{constructor(t){super(t),this.geometry=new G,this.name=Et.extension.name,this.vertexSize=6,T??(T=new P(t.maxTextures)),this.shader=T}packAttributes(t,e,i,o,a){let u=a<<16|t.roundPixels&65535,s=t.transform,l=s.a,h=s.b,x=s.c,f=s.d,d=s.tx,g=s.ty,{positions:m,uvs:b}=t,v=t.color,n=t.attributeOffset,B=n+t.attributeSize;for(let c=n;c<B;c++){let p=c*2,_=m[p],Q=m[p+1];e[o++]=l*_+x*Q+d,e[o++]=f*Q+h*_+g,e[o++]=b[p],e[o++]=b[p+1],i[o++]=v,i[o++]=u}}packQuadAttributes(t,e,i,o,a){let u=t.texture,s=t.transform,l=s.a,h=s.b,x=s.c,f=s.d,d=s.tx,g=s.ty,m=t.bounds,b=m.maxX,v=m.minX,n=m.maxY,B=m.minY,c=u.uvs,p=t.color,_=a<<16|t.roundPixels&65535;e[o+0]=l*v+x*B+d,e[o+1]=f*B+h*v+g,e[o+2]=c.x0,e[o+3]=c.y0,i[o+4]=p,i[o+5]=_,e[o+6]=l*b+x*B+d,e[o+7]=f*B+h*b+g,e[o+8]=c.x1,e[o+9]=c.y1,i[o+10]=p,i[o+11]=_,e[o+12]=l*b+x*n+d,e[o+13]=f*n+h*b+g,e[o+14]=c.x2,e[o+15]=c.y2,i[o+16]=p,i[o+17]=_,e[o+18]=l*v+x*n+d,e[o+19]=f*n+h*v+g,e[o+20]=c.x3,e[o+21]=c.y3,i[o+22]=p,i[o+23]=_}_updateMaxTextures(t){this.shader.maxTextures!==t&&(T=new P(t),this.shader=T)}destroy(){this.shader=null,super.destroy()}};Vt.extension={type:[K.Batcher],name:"default"};var ar=Vt;var Dt=class{constructor(t){this.items=Object.create(null);let{renderer:e,type:i,onUnload:o,priority:a,name:u}=t;this._renderer=e,e.gc.addResourceHash(this,"items",i,a??0),this._onUnload=o,this.name=u}add(t){return this.items[t.uid]?!1:(this.items[t.uid]=t,t.once("unload",this.remove,this),t._gcLastUsed=this._renderer.gc.now,!0)}remove(t,...e){if(!this.items[t.uid])return;let i=t._gpuData[this._renderer.uid];i&&(this._onUnload?.(t,...e),t.off("unload",this.remove,this),i.destroy(),t._gpuData[this._renderer.uid]=null,this.items[t.uid]=null)}removeAll(...t){Object.values(this.items).forEach(e=>e&&this.remove(e,...t))}destroy(...t){this.removeAll(...t),this.items=Object.create(null),this._renderer=null,this._onUnload=null}};export{Lt as a,E as b,D as c,R as d,nt as e,k as f,st as g,at as h,ct as i,ht as j,ft as k,dt as l,mt as m,me as n,pt as o,xt as p,vt as q,gt as r,_t as s,bt as t,St as u,Bt as v,yt as w,w as x,F as y,At as z,Qt as A,N as B,wt as C,It as D,z as E,W as F,Mt as G,G as H,Ct as I,P as J,ar as K,Dt as L};
