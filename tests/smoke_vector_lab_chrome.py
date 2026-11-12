"""Browser E2E for standalone Vector Lab using real VTracer 1.0 WASM.

Uses a disposable Chrome profile via the zero-dependency CDP driver and a
temporary loopback-only server. Synthetic input only, never private images.
"""
from __future__ import annotations
import json
import subprocess
import threading
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
APP=ROOT/"tools"/"vector-lab"
DRIVER=ROOT/"tests"/"js"/"vector_lab_cdp.mjs"
PROBE=r"""
<script>
window.addEventListener("load",async()=>{
 const out=document.createElement("pre");out.id="vector-lab-probe";document.body.append(out);
 const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const el=id=>document.getElementById(id);
 try{
  const c=document.createElement("canvas");c.width=c.height=64;
  const ctx=c.getContext("2d");ctx.fillStyle="#dce1de";ctx.fillRect(0,0,64,64);
  ctx.fillStyle="#1a4b75";ctx.fillRect(9,4,48,56);
  ctx.fillStyle="#f39a24";ctx.fillRect(21,14,24,34);
  ctx.fillStyle="#c61e7b";ctx.fillRect(22,21,8,30);
  const blob=await new Promise(ok=>c.toBlob(ok,"image/png"));
  const file=new File([blob],"synthetic.png",{type:"image/png"});
  el("auto").checked=false;
  const dt=new DataTransfer();dt.items.add(file);el("file").files=dt.files;
  el("file").dispatchEvent(new Event("change",{bubbles:true}));
  for(let i=0;i<100&&el("run").disabled;i++)await sleep(100);
  if(el("run").disabled)throw Error("image load failed "+el("status").textContent);
  const hashes={};
  async function trace(name,fields,engine="vtracer"){
    el("engine").value=engine;
    el("engine").dispatchEvent(new Event("change",{bubbles:true}));
    for(const [key,value]of Object.entries(fields)){
      const field=el(key);if(!field)throw Error("missing field "+key);
      if(typeof value==="boolean")field.checked=value;else field.value=String(value);
      field.dispatchEvent(new Event("change",{bubbles:true}));
    }
    el("run").click();
    let started=false,finished=false;
    for(let i=0;i<800;i++){
      if(el("run").disabled)started=true;
      if(started&&!el("run").disabled){
        finished=true;break;
      }
      await sleep(100);
    }
    if(!finished)throw Error(name+" timeout");
    if(!el("status").textContent.includes("生成したよ"))throw Error(name+" failed: "+el("status").textContent);
    const img=el("result");if(img.hidden||!img.src)throw Error(name+" missing SVG");
    const svg=await(await fetch(img.src)).text();
    if(!svg.includes("<svg"))throw Error(name+" non-SVG");
    hashes[name]=svg;
  }
  await trace("default",{}, "vtracer");
  await trace("watershed",{clustering:"watershed",watershedDetail:180,maxColors:8,mode:"spline",simplify:1.25,hierarchical:"cutout"});
  await trace("palette",{clustering:"color-cluster",palette:"#102030, #dca075, #faf5e7",maxColors:12,optimize:2});
  await trace("adaptive",{clustering:"bw",adaptive:true,adaptiveWindow:15,adaptiveT:12});
  await trace("fixed",{clustering:"bw",adaptive:false,binaryThreshold:120});
  await trace("imagetracer",{engine:"imagetracer"},"imagetracer");
  el("approx-count").value="3";
  el("approx-shape").value="triangle";
  await trace("primitive",{},"primitive");
  el("approx-count").value="8";
  await trace("geometrize",{},"geometrize");
  el("approx-count").value="8";
  await trace("primeval",{},"primeval");
  // Five engines are now directly selectable in the compact UI.
  const cards=[...document.querySelectorAll("[data-engine]")];
  if(cards.length!==5)throw Error("five engine UI cards missing");
  const primeCard=document.querySelector('[data-engine="primeval"]');
  primeCard.click();
  if(el("engine").value!=="primeval" || primeCard.getAttribute("aria-pressed")!=="true")
    throw Error("engine card is not synchronized to active engine");
  document.querySelector('[data-view="result"]').click();
  if(!el("result").style.clipPath.includes("0%"))throw Error("result-only mode missing");
  document.querySelector('[data-view="source"]').click();
  if(!el("result").style.clipPath.includes("100%"))throw Error("source-only mode missing");
  document.querySelector('[data-view="compare"]').click();
  if(el("compare-tools").hidden)throw Error("comparison slider hidden");
  if(el("jump-result").hidden)throw Error("result jump button missing");
  if(document.getElementById("others-title")||document.getElementById("help"))
    throw Error("redundant sections remain in UI");
  if(window.innerWidth<=700){
    const picker=document.querySelector(".engine-picker");
    if(getComputedStyle(picker).overflowX!=="auto")
      throw Error("mobile engine picker does not scroll");
    if(picker.scrollWidth<=picker.clientWidth)
      throw Error("mobile engine picker is not horizontally scrollable");
    const card=document.querySelector('[data-engine="vtracer"]');
    if(card.getBoundingClientRect().height<44)
      throw Error("mobile engine card touch target too small");
    if(document.documentElement.scrollWidth>window.innerWidth+2)
      throw Error("unexpected page-wide horizontal overflow "+document.documentElement.scrollWidth);
  }
  const importInput=document.querySelector('[data-import="primitive"]');
  const imported=new File(['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path fill="#ee7722" d="M0 0H64V64H0Z"/></svg>'],
    "primitive.svg",{type:"image/svg+xml"});
  const dt2=new DataTransfer();dt2.items.add(imported);importInput.files=dt2.files;
  importInput.dispatchEvent(new Event("change",{bubbles:true}));
  for(let i=0;i<100&&!el("result-meta").textContent.includes("Primitive");i++)await sleep(50);
  const ok=el("candidates").querySelectorAll(".candidate").length>=3 &&
    !el("save-svg").disabled&&!el("save-png").disabled&&!el("save-json").disabled;
  // A uniform-color fixture can legitimately make adaptive/fixed B&W identical.
  const changed=hashes.default!==hashes.watershed && hashes.watershed!==hashes.palette;
  // Actual standalone layout acceptance: no document or nested vertical scroll.
  let pwa=null;
  if(navigator.standalone===true){
    if(!document.body.classList.contains("vl-pwa"))throw Error("PWA class not activated");
    const nav=el("workspace-tabs");
    if(nav.hidden||getComputedStyle(nav).display==="none")throw Error("PWA navigation missing");
    const panes=["source","settings","result","candidates"];
    const checkPage=()=>{
      const d=document.documentElement,b=document.body;
      if(d.scrollHeight>innerHeight+2 || b.scrollHeight>innerHeight+2)
        throw Error("page vertically scrollable "+JSON.stringify({
          page:d.scrollHeight,body:b.scrollHeight,height:innerHeight,screen:document.body.dataset.workspace
        }));
      if(d.scrollWidth>innerWidth+2)throw Error("page horizontal overflow in PWA");
      const panel=el(document.body.dataset.workspace==="candidates"?"workspace-result":"workspace-"+document.body.dataset.workspace);
      if(!panel||getComputedStyle(panel).display==="none")throw Error("workspace pane not visible");
      const pr=panel.getBoundingClientRect();
      if(pr.top<0||pr.bottom>innerHeight-38)throw Error("PWA panel extends beyond viewport "+pr.bottom);
      return panel;
    };
    for(const pane of panes){
      const tab=document.querySelector('[data-workspace="'+pane+'"]');
      tab.click();
      if(document.body.dataset.workspace!==pane || tab.getAttribute("aria-pressed")!=="true")
        throw Error("PWA tab switch failed "+pane);
      const panel=checkPage();
      if(pane==="settings"){
        const stages=["basic","color","shape","fine"];
        for(const stage of stages){
          document.querySelector('[data-settings-stage="'+stage+'"]').click();
          if(document.body.dataset.settingsStage!==stage)throw Error("settings stage unsynced");
          const group=panel.querySelector('[data-vl-settings="'+stage+'"]');
          if(!group||getComputedStyle(group).display==="none")throw Error("settings group hidden: "+stage);
          const children=[...panel.querySelectorAll('[data-vl-settings="'+stage+'"]')]
            .filter(x=>getComputedStyle(x).display!=="none");
          const box=el("vtracer-panel").getBoundingClientRect();
          for(const child of children){
            const rect=child.getBoundingClientRect();
            if(rect.bottom>box.bottom+3)throw Error("settings clipped "+stage+" "+rect.bottom+"/"+box.bottom);
          }
          if(panel.scrollHeight>panel.clientHeight+2)
            throw Error("settings nested vertical overflow "+stage);
        }
      }
      if(pane==="result"){
        if(el("workspace-result").scrollHeight>el("workspace-result").clientHeight+2)
          throw Error("result nested vertical overflow");
      }
      if(pane==="candidates"){
        if(!el("candidate-bank").open)throw Error("candidate list collapsed");
        if(el("workspace-result").scrollHeight>el("workspace-result").clientHeight+2)
          throw Error("candidate nested vertical overflow");
      }
    }
    document.querySelector('[data-workspace="result"]').click();
    checkPage();
    pwa={noPageScroll:true,stages:4,tabs:4,viewport:[innerWidth,innerHeight]};
  }
  const summary={default:hashes.default.length,watershed:hashes.watershed.length,
    palette:hashes.palette.length,adaptive:hashes.adaptive.length,fixed:hashes.fixed.length,
    imagetracer:hashes.imagetracer.length,
    primitive:hashes.primitive.length,geometrize:hashes.geometrize.length,
    primeval:hashes.primeval.length,changed,externalImport:ok,pwa,
    selected:el("result-meta").textContent,source:el("source-meta").textContent};
  out.textContent="VTRACER_ROUTE_RESULT="+JSON.stringify(summary);
 }catch(e){out.textContent="VTRACER_ROUTE_FAILURE="+String(e);}
});
</script>
"""

class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):
  super().__init__(*args,directory=str(ROOT/"tools"),**kwargs)
 def log_message(self,*args):pass
 def do_GET(self):
  if self.path.split("?")[0] in ("/vector-lab/","/vector-lab/index.html"):
   html=(APP/"index.html").read_text(encoding="utf-8")
   data=html.replace("</body>",PROBE+"</body>").encode("utf-8")
   self.send_response(200);self.send_header("Content-Type","text/html; charset=utf-8")
   self.send_header("Cache-Control","no-store");self.send_header("Content-Length",str(len(data)))
   self.end_headers();self.wfile.write(data)
  else:super().do_GET()
def main():
 server=ThreadingHTTPServer(("127.0.0.1",0),Handler)
 t=threading.Thread(target=server.serve_forever,daemon=True);t.start()
 try:
  url=f"http://127.0.0.1:{server.server_port}/vector-lab/"
  proc=subprocess.run(["node",str(DRIVER),url,"#vector-lab-probe"],cwd=ROOT,
    capture_output=True,text=True,encoding="utf-8",errors="replace",timeout=260)
  if proc.returncode:raise RuntimeError((proc.stdout+"\n"+proc.stderr)[-3000:])
  marker="VTRACER_ROUTE_RESULT="
  if marker not in proc.stdout:raise RuntimeError(proc.stdout[-2500:])
  data=json.loads(proc.stdout.split(marker,1)[1].strip().splitlines()[0])
  print(json.dumps(data,ensure_ascii=False))
  assert all(data[x]>0 for x in ("default","watershed","palette","adaptive","fixed","imagetracer"))
  assert data["changed"] and data["externalImport"]
  print("VECTOR_LAB_CHROME_PASS")
 finally:
  server.shutdown();server.server_close();t.join(timeout=4)
if __name__=="__main__":main()
