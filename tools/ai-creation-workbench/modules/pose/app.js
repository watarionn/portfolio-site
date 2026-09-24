(() => {
  'use strict';

  const canvas = document.getElementById('poseCanvas');
  const ctx = canvas.getContext('2d');
  const stageWrap = document.getElementById('stageWrap');
  const statusText = document.getElementById('statusText');

  const $ = (id) => document.getElementById(id);

  const JOINTS = [
    { id: 'nose', label: '鼻' },
    { id: 'neck', label: '首' },
    { id: 'r_shoulder', label: '右肩' },
    { id: 'r_elbow', label: '右肘' },
    { id: 'r_wrist', label: '右手首' },
    { id: 'l_shoulder', label: '左肩' },
    { id: 'l_elbow', label: '左肘' },
    { id: 'l_wrist', label: '左手首' },
    { id: 'r_hip', label: '右腰' },
    { id: 'r_knee', label: '右膝' },
    { id: 'r_ankle', label: '右足首' },
    { id: 'l_hip', label: '左腰' },
    { id: 'l_knee', label: '左膝' },
    { id: 'l_ankle', label: '左足首' },
    { id: 'r_eye', label: '右目' },
    { id: 'l_eye', label: '左目' },
    { id: 'r_ear', label: '右耳' },
    { id: 'l_ear', label: '左耳' }
  ];

  const LIMBS = [
    ['neck', 'r_shoulder', '#ff4f4f'],
    ['r_shoulder', 'r_elbow', '#ff8a36'],
    ['r_elbow', 'r_wrist', '#ffd43b'],
    ['neck', 'l_shoulder', '#49d363'],
    ['l_shoulder', 'l_elbow', '#3ddbd9'],
    ['l_elbow', 'l_wrist', '#44a3ff'],
    ['neck', 'r_hip', '#b47cff'],
    ['r_hip', 'r_knee', '#ff6bd6'],
    ['r_knee', 'r_ankle', '#ff4f93'],
    ['neck', 'l_hip', '#7ae582'],
    ['l_hip', 'l_knee', '#00d4ff'],
    ['l_knee', 'l_ankle', '#2f80ed'],
    ['r_hip', 'l_hip', '#ffffff'],
    ['neck', 'nose', '#ffffff'],
    ['nose', 'r_eye', '#ffcc00'],
    ['r_eye', 'r_ear', '#ffcc00'],
    ['nose', 'l_eye', '#7fff00'],
    ['l_eye', 'l_ear', '#7fff00']
  ];

  const MIRROR_PAIRS = {
    r_shoulder: 'l_shoulder', r_elbow: 'l_elbow', r_wrist: 'l_wrist',
    r_hip: 'l_hip', r_knee: 'l_knee', r_ankle: 'l_ankle',
    r_eye: 'l_eye', r_ear: 'l_ear',
    l_shoulder: 'r_shoulder', l_elbow: 'r_elbow', l_wrist: 'r_wrist',
    l_hip: 'r_hip', l_knee: 'r_knee', l_ankle: 'r_ankle',
    l_eye: 'r_eye', l_ear: 'r_ear'
  };

  const state = {
    points: {},
    selectedJoint: null,
    dragging: false,
    zoom: 1,
    referenceImage: null,
    referenceVisible: true,
    referenceName: '',
    settings: {
      width: 1024,
      height: 1024,
      drawMode: 'openpose',
      backgroundMode: 'black',
      lineWidth: 10,
      jointSize: 13,
      showGrid: true,
      showJoints: true,
      showLabels: false,
      mirrorMode: false,
      showChairGuide: false,
      keepInside: true,
      referenceOpacity: 0.35,
      referenceFit: 'contain',
      exportReference: false
    }
  };

  function n(x, y) { return { x, y }; }

  const PRESETS = {
    standing_front: {
      nose: n(.50, .16), neck: n(.50, .25),
      r_shoulder: n(.43, .27), r_elbow: n(.38, .43), r_wrist: n(.36, .59),
      l_shoulder: n(.57, .27), l_elbow: n(.62, .43), l_wrist: n(.64, .59),
      r_hip: n(.46, .52), r_knee: n(.44, .73), r_ankle: n(.43, .91),
      l_hip: n(.54, .52), l_knee: n(.56, .73), l_ankle: n(.57, .91),
      r_eye: n(.485, .145), l_eye: n(.515, .145), r_ear: n(.455, .155), l_ear: n(.545, .155)
    },
    arms_up: {
      nose: n(.50, .16), neck: n(.50, .25),
      r_shoulder: n(.43, .27), r_elbow: n(.36, .18), r_wrist: n(.32, .08),
      l_shoulder: n(.57, .27), l_elbow: n(.64, .18), l_wrist: n(.68, .08),
      r_hip: n(.46, .52), r_knee: n(.44, .73), r_ankle: n(.43, .91),
      l_hip: n(.54, .52), l_knee: n(.56, .73), l_ankle: n(.57, .91),
      r_eye: n(.485, .145), l_eye: n(.515, .145), r_ear: n(.455, .155), l_ear: n(.545, .155)
    },
    walking: {
      nose: n(.50, .16), neck: n(.50, .25),
      r_shoulder: n(.43, .27), r_elbow: n(.35, .37), r_wrist: n(.41, .49),
      l_shoulder: n(.57, .27), l_elbow: n(.66, .37), l_wrist: n(.60, .51),
      r_hip: n(.46, .52), r_knee: n(.38, .72), r_ankle: n(.33, .90),
      l_hip: n(.54, .52), l_knee: n(.64, .69), l_ankle: n(.71, .88),
      r_eye: n(.485, .145), l_eye: n(.515, .145), r_ear: n(.455, .155), l_ear: n(.545, .155)
    },
    sitting_chair: {
      nose: n(.50, .16), neck: n(.50, .25),
      r_shoulder: n(.43, .28), r_elbow: n(.39, .43), r_wrist: n(.43, .55),
      l_shoulder: n(.57, .28), l_elbow: n(.61, .43), l_wrist: n(.57, .55),
      r_hip: n(.45, .52), r_knee: n(.36, .68), r_ankle: n(.33, .86),
      l_hip: n(.55, .52), l_knee: n(.64, .68), l_ankle: n(.67, .86),
      r_eye: n(.485, .145), l_eye: n(.515, .145), r_ear: n(.455, .155), l_ear: n(.545, .155)
    },
    straddling_chair: {
      nose: n(.50, .15), neck: n(.50, .25),
      r_shoulder: n(.42, .28), r_elbow: n(.38, .42), r_wrist: n(.45, .50),
      l_shoulder: n(.58, .28), l_elbow: n(.62, .42), l_wrist: n(.55, .50),
      r_hip: n(.44, .52), r_knee: n(.29, .69), r_ankle: n(.24, .90),
      l_hip: n(.56, .52), l_knee: n(.71, .69), l_ankle: n(.76, .90),
      r_eye: n(.485, .135), l_eye: n(.515, .135), r_ear: n(.455, .15), l_ear: n(.545, .15)
    },
    crouch: {
      nose: n(.50, .23), neck: n(.50, .32),
      r_shoulder: n(.42, .34), r_elbow: n(.34, .49), r_wrist: n(.38, .63),
      l_shoulder: n(.58, .34), l_elbow: n(.66, .49), l_wrist: n(.62, .63),
      r_hip: n(.44, .56), r_knee: n(.32, .70), r_ankle: n(.39, .87),
      l_hip: n(.56, .56), l_knee: n(.68, .70), l_ankle: n(.61, .87),
      r_eye: n(.485, .215), l_eye: n(.515, .215), r_ear: n(.455, .23), l_ear: n(.545, .23)
    },
    side_view: {
      nose: n(.55, .16), neck: n(.50, .25),
      r_shoulder: n(.48, .28), r_elbow: n(.46, .43), r_wrist: n(.48, .58),
      l_shoulder: n(.52, .28), l_elbow: n(.56, .43), l_wrist: n(.58, .58),
      r_hip: n(.48, .52), r_knee: n(.46, .73), r_ankle: n(.45, .91),
      l_hip: n(.52, .52), l_knee: n(.57, .72), l_ankle: n(.60, .90),
      r_eye: n(.545, .145), l_eye: n(.565, .145), r_ear: n(.505, .155), l_ear: n(.525, .155)
    }
  };

  function clonePreset(key) {
    const preset = PRESETS[key] || PRESETS.standing_front;
    const points = {};
    for (const joint of JOINTS) {
      const p = preset[joint.id] || PRESETS.standing_front[joint.id];
      points[joint.id] = { x: p.x * canvas.width, y: p.y * canvas.height };
    }
    return points;
  }

  function setCanvasSize(width, height) {
    const oldW = canvas.width;
    const oldH = canvas.height;
    canvas.width = width;
    canvas.height = height;
    state.settings.width = width;
    state.settings.height = height;

    if (Object.keys(state.points).length) {
      const sx = width / oldW;
      const sy = height / oldH;
      for (const p of Object.values(state.points)) {
        p.x *= sx;
        p.y *= sy;
      }
    }
    applyCanvasCssSize();
    render();
  }

  function applyCanvasCssSize() {
    const cssW = canvas.width * state.zoom;
    const cssH = canvas.height * state.zoom;
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
  }

  function setStatus(text) {
    statusText.textContent = text;
  }

  function getBackgroundColor() {
    switch (state.settings.backgroundMode) {
      case 'white': return '#ffffff';
      case 'gray': return '#808080';
      case 'transparent': return null;
      case 'black':
      default: return '#000000';
    }
  }

  function drawBackground(targetCtx, w, h) {
    const bg = getBackgroundColor();
    if (bg) {
      targetCtx.fillStyle = bg;
      targetCtx.fillRect(0, 0, w, h);
    } else {
      targetCtx.clearRect(0, 0, w, h);
    }
  }

  function drawGrid(targetCtx, w, h) {
    if (!state.settings.showGrid) return;
    targetCtx.save();
    targetCtx.globalAlpha = .22;
    targetCtx.strokeStyle = state.settings.backgroundMode === 'white' ? '#888' : '#fff';
    targetCtx.lineWidth = 1;
    const step = Math.max(32, Math.round(Math.min(w, h) / 16));
    for (let x = 0; x <= w; x += step) {
      targetCtx.beginPath();
      targetCtx.moveTo(x, 0);
      targetCtx.lineTo(x, h);
      targetCtx.stroke();
    }
    for (let y = 0; y <= h; y += step) {
      targetCtx.beginPath();
      targetCtx.moveTo(0, y);
      targetCtx.lineTo(w, y);
      targetCtx.stroke();
    }
    targetCtx.globalAlpha = .36;
    targetCtx.beginPath();
    targetCtx.moveTo(w / 2, 0);
    targetCtx.lineTo(w / 2, h);
    targetCtx.moveTo(0, h / 2);
    targetCtx.lineTo(w, h / 2);
    targetCtx.stroke();
    targetCtx.restore();
  }

  function drawReference(targetCtx, w, h, include) {
    if (!include || !state.referenceImage || !state.referenceVisible) return;
    const img = state.referenceImage;
    const fit = state.settings.referenceFit;
    let x = 0, y = 0, dw = w, dh = h;
    if (fit !== 'stretch') {
      const scaleContain = Math.min(w / img.width, h / img.height);
      const scaleCover = Math.max(w / img.width, h / img.height);
      const scale = fit === 'cover' ? scaleCover : scaleContain;
      dw = img.width * scale;
      dh = img.height * scale;
      x = (w - dw) / 2;
      y = (h - dh) / 2;
    }
    targetCtx.save();
    targetCtx.globalAlpha = state.settings.referenceOpacity;
    targetCtx.drawImage(img, x, y, dw, dh);
    targetCtx.restore();
  }

  function drawChairGuide(targetCtx) {
    if (!state.settings.showChairGuide) return;
    const w = canvas.width;
    const h = canvas.height;
    targetCtx.save();
    targetCtx.strokeStyle = state.settings.backgroundMode === 'white' ? 'rgba(0,0,0,.35)' : 'rgba(255,255,255,.4)';
    targetCtx.lineWidth = Math.max(3, state.settings.lineWidth / 2);
    targetCtx.setLineDash([12, 10]);
    targetCtx.strokeRect(w * .36, h * .50, w * .28, h * .08);
    targetCtx.beginPath();
    targetCtx.moveTo(w * .40, h * .58);
    targetCtx.lineTo(w * .36, h * .86);
    targetCtx.moveTo(w * .60, h * .58);
    targetCtx.lineTo(w * .64, h * .86);
    targetCtx.moveTo(w * .50, h * .50);
    targetCtx.lineTo(w * .50, h * .30);
    targetCtx.stroke();
    targetCtx.restore();
  }

  function colorForJoint(id) {
    if (id === state.selectedJoint) return '#ff3860';
    if (state.settings.drawMode === 'openpose') return '#ffffff';
    if (state.settings.drawMode === 'white_stick') return '#ffffff';
    return '#ff3860';
  }

  function limbColor(color) {
    switch (state.settings.drawMode) {
      case 'openpose': return color;
      case 'white_stick': return '#ffffff';
      case 'silhouette': return '#111111';
      case 'stick':
      default: return '#111111';
    }
  }

  function drawSkeleton(targetCtx) {
    const mode = state.settings.drawMode;
    const lineWidth = Number(state.settings.lineWidth);
    const jointSize = Number(state.settings.jointSize);

    if (mode === 'silhouette') {
      drawSilhouette(targetCtx);
      return;
    }

    targetCtx.save();
    targetCtx.lineCap = 'round';
    targetCtx.lineJoin = 'round';

    for (const [a, b, color] of LIMBS) {
      const pa = state.points[a];
      const pb = state.points[b];
      if (!pa || !pb) continue;
      targetCtx.strokeStyle = limbColor(color);
      targetCtx.lineWidth = lineWidth;
      targetCtx.beginPath();
      targetCtx.moveTo(pa.x, pa.y);
      targetCtx.lineTo(pb.x, pb.y);
      targetCtx.stroke();
    }

    if (state.settings.showJoints) {
      for (const joint of JOINTS) {
        const p = state.points[joint.id];
        if (!p) continue;
        targetCtx.beginPath();
        targetCtx.fillStyle = colorForJoint(joint.id);
        targetCtx.strokeStyle = mode === 'white_stick' ? '#111111' : '#ffffff';
        targetCtx.lineWidth = 2;
        targetCtx.arc(p.x, p.y, jointSize, 0, Math.PI * 2);
        targetCtx.fill();
        targetCtx.stroke();
      }
    }

    if (state.settings.showLabels) {
      targetCtx.font = `${Math.max(12, Math.round(canvas.width / 80))}px sans-serif`;
      targetCtx.textBaseline = 'middle';
      for (const joint of JOINTS) {
        const p = state.points[joint.id];
        if (!p) continue;
        targetCtx.fillStyle = state.settings.backgroundMode === 'white' ? '#111' : '#fff';
        targetCtx.fillText(joint.label, p.x + jointSize + 4, p.y);
      }
    }
    targetCtx.restore();
  }

  function drawSilhouette(targetCtx) {
    const p = state.points;
    const lw = Number(state.settings.lineWidth) * 2.4;
    targetCtx.save();
    targetCtx.lineCap = 'round';
    targetCtx.lineJoin = 'round';
    targetCtx.strokeStyle = '#111111';
    targetCtx.fillStyle = '#111111';
    targetCtx.lineWidth = lw;

    const headRadius = Math.max(28, canvas.width * .045);
    targetCtx.beginPath();
    targetCtx.arc(p.nose.x, p.nose.y + headRadius * .15, headRadius, 0, Math.PI * 2);
    targetCtx.fill();

    const silhouetteLimbs = [
      ['neck', 'r_shoulder'], ['r_shoulder', 'r_elbow'], ['r_elbow', 'r_wrist'],
      ['neck', 'l_shoulder'], ['l_shoulder', 'l_elbow'], ['l_elbow', 'l_wrist'],
      ['neck', 'r_hip'], ['r_hip', 'r_knee'], ['r_knee', 'r_ankle'],
      ['neck', 'l_hip'], ['l_hip', 'l_knee'], ['l_knee', 'l_ankle'], ['r_hip', 'l_hip']
    ];
    for (const [a, b] of silhouetteLimbs) {
      targetCtx.beginPath();
      targetCtx.moveTo(p[a].x, p[a].y);
      targetCtx.lineTo(p[b].x, p[b].y);
      targetCtx.stroke();
    }
    targetCtx.restore();
  }

  function renderToContext(targetCtx, options = {}) {
    const w = targetCtx.canvas.width;
    const h = targetCtx.canvas.height;
    drawBackground(targetCtx, w, h);
    drawReference(targetCtx, w, h, options.includeReference ?? true);
    drawGrid(targetCtx, w, h);
    drawChairGuide(targetCtx);
    drawSkeleton(targetCtx);
  }

  function render() {
    renderToContext(ctx, { includeReference: true });
    updateSelectedBox();
  }

  function getCanvasPoint(evt) {
    const rect = canvas.getBoundingClientRect();
    const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
    const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  function nearestJoint(pos) {
    let best = null;
    let bestDist = Infinity;
    const threshold = Math.max(24, Number(state.settings.jointSize) * 2.2);
    for (const joint of JOINTS) {
      const p = state.points[joint.id];
      const d = Math.hypot(p.x - pos.x, p.y - pos.y);
      if (d < bestDist) {
        bestDist = d;
        best = joint.id;
      }
    }
    return bestDist <= threshold ? best : null;
  }

  function clampPoint(p) {
    if (!state.settings.keepInside) return p;
    p.x = Math.max(0, Math.min(canvas.width, p.x));
    p.y = Math.max(0, Math.min(canvas.height, p.y));
    return p;
  }

  function moveJoint(id, x, y) {
    const p = state.points[id];
    if (!p) return;
    p.x = x;
    p.y = y;
    clampPoint(p);

    const mirrorId = MIRROR_PAIRS[id];
    if (state.settings.mirrorMode && mirrorId) {
      const mp = state.points[mirrorId];
      mp.x = canvas.width - p.x;
      mp.y = p.y;
      clampPoint(mp);
    }
  }

  function onPointerDown(evt) {
    evt.preventDefault();
    const pos = getCanvasPoint(evt);
    const joint = nearestJoint(pos);
    if (joint) {
      state.selectedJoint = joint;
      state.dragging = true;
      setStatus(`${jointLabel(joint)} を編集中`);
    } else {
      state.selectedJoint = null;
      setStatus('関節をドラッグしてポーズを編集');
    }
    render();
  }

  function onPointerMove(evt) {
    if (!state.dragging || !state.selectedJoint) return;
    evt.preventDefault();
    const pos = getCanvasPoint(evt);
    moveJoint(state.selectedJoint, pos.x, pos.y);
    render();
  }

  function onPointerUp() {
    state.dragging = false;
  }

  function jointLabel(id) {
    return JOINTS.find(j => j.id === id)?.label || id;
  }

  function updateSelectedBox() {
    const box = $('selectedJointBox');
    if (!state.selectedJoint) {
      box.textContent = '未選択';
      $('jointX').value = '';
      $('jointY').value = '';
      return;
    }
    const p = state.points[state.selectedJoint];
    box.textContent = `${jointLabel(state.selectedJoint)} / ${state.selectedJoint}`;
    $('jointX').value = Math.round(p.x);
    $('jointY').value = Math.round(p.y);
  }

  function applyPreset(key) {
    state.points = clonePreset(key);
    state.selectedJoint = null;
    setStatus(`プリセット「${$('presetSelect').selectedOptions[0].textContent}」を適用`);
    render();
  }

  function exportCanvasAsPng() {
    const out = document.createElement('canvas');
    out.width = canvas.width;
    out.height = canvas.height;
    const outCtx = out.getContext('2d');
    renderToContext(outCtx, { includeReference: state.settings.exportReference });
    out.toBlob((blob) => {
      if (!blob) return;
      downloadBlob(blob, makeFileName('pose', 'png'));
    }, 'image/png');
  }

  function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function makeFileName(prefix, ext) {
    const now = new Date();
    const pad = (v) => String(v).padStart(2, '0');
    const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    return `${prefix}_${state.settings.drawMode}_${canvas.width}x${canvas.height}_${stamp}.${ext}`;
  }

  function normalizedPoints() {
    const data = {};
    for (const joint of JOINTS) {
      const p = state.points[joint.id];
      data[joint.id] = {
        x: Number((p.x / canvas.width).toFixed(6)),
        y: Number((p.y / canvas.height).toFixed(6))
      };
    }
    return data;
  }

  function exportJson() {
    const payload = {
      app: 'ControlNet Pose Helper',
      version: '1.0.0',
      width: canvas.width,
      height: canvas.height,
      settings: { ...state.settings },
      points: normalizedPoints()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    downloadBlob(blob, makeFileName('pose', 'json'));
  }

  function makeSvg(includeReference = false) {
    const w = canvas.width;
    const h = canvas.height;
    const bg = getBackgroundColor();
    const mode = state.settings.drawMode;
    const lw = Number(state.settings.lineWidth);
    const js = Number(state.settings.jointSize);
    const parts = [];
    parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`);
    if (bg) parts.push(`<rect width="100%" height="100%" fill="${bg}"/>`);
    if (includeReference && state.referenceImage) {
      parts.push(`<!-- 下絵はSVG保存では埋め込みません。PNG保存を使ってください。 -->`);
    }
    if (state.settings.showGrid) {
      const gridColor = state.settings.backgroundMode === 'white' ? '#888' : '#fff';
      const step = Math.max(32, Math.round(Math.min(w, h) / 16));
      parts.push(`<g opacity="0.18" stroke="${gridColor}" stroke-width="1">`);
      for (let x = 0; x <= w; x += step) parts.push(`<line x1="${x}" y1="0" x2="${x}" y2="${h}"/>`);
      for (let y = 0; y <= h; y += step) parts.push(`<line x1="0" y1="${y}" x2="${w}" y2="${y}"/>`);
      parts.push(`</g>`);
    }
    if (state.settings.showChairGuide) {
      const guide = state.settings.backgroundMode === 'white' ? 'rgba(0,0,0,.35)' : 'rgba(255,255,255,.4)';
      parts.push(`<g fill="none" stroke="${guide}" stroke-width="${Math.max(3, lw / 2)}" stroke-dasharray="12 10">`);
      parts.push(`<rect x="${w * .36}" y="${h * .50}" width="${w * .28}" height="${h * .08}"/>`);
      parts.push(`<path d="M${w * .40} ${h * .58} L${w * .36} ${h * .86} M${w * .60} ${h * .58} L${w * .64} ${h * .86} M${w * .50} ${h * .50} L${w * .50} ${h * .30}"/>`);
      parts.push(`</g>`);
    }
    if (mode === 'silhouette') {
      parts.push(makeSilhouetteSvg());
    } else {
      parts.push(`<g fill="none" stroke-linecap="round" stroke-linejoin="round">`);
      for (const [a, b, color] of LIMBS) {
        const pa = state.points[a];
        const pb = state.points[b];
        const stroke = mode === 'openpose' ? color : (mode === 'white_stick' ? '#ffffff' : '#111111');
        parts.push(`<line x1="${pa.x.toFixed(1)}" y1="${pa.y.toFixed(1)}" x2="${pb.x.toFixed(1)}" y2="${pb.y.toFixed(1)}" stroke="${stroke}" stroke-width="${lw}"/>`);
      }
      parts.push(`</g>`);
      if (state.settings.showJoints) {
        parts.push(`<g stroke-width="2">`);
        for (const joint of JOINTS) {
          const p = state.points[joint.id];
          const fill = joint.id === state.selectedJoint ? '#ff3860' : (mode === 'white_stick' ? '#ffffff' : '#ff3860');
          parts.push(`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${js}" fill="${fill}" stroke="#ffffff"/>`);
        }
        parts.push(`</g>`);
      }
    }
    parts.push(`</svg>`);
    return parts.join('\n');
  }

  function makeSilhouetteSvg() {
    const p = state.points;
    const lw = Number(state.settings.lineWidth) * 2.4;
    const headRadius = Math.max(28, canvas.width * .045);
    const lines = [
      ['neck', 'r_shoulder'], ['r_shoulder', 'r_elbow'], ['r_elbow', 'r_wrist'],
      ['neck', 'l_shoulder'], ['l_shoulder', 'l_elbow'], ['l_elbow', 'l_wrist'],
      ['neck', 'r_hip'], ['r_hip', 'r_knee'], ['r_knee', 'r_ankle'],
      ['neck', 'l_hip'], ['l_hip', 'l_knee'], ['l_knee', 'l_ankle'], ['r_hip', 'l_hip']
    ];
    const parts = [`<g stroke="#111" fill="#111" stroke-linecap="round" stroke-linejoin="round" stroke-width="${lw}">`];
    parts.push(`<circle cx="${p.nose.x.toFixed(1)}" cy="${(p.nose.y + headRadius * .15).toFixed(1)}" r="${headRadius}"/>`);
    for (const [a, b] of lines) {
      parts.push(`<line x1="${p[a].x.toFixed(1)}" y1="${p[a].y.toFixed(1)}" x2="${p[b].x.toFixed(1)}" y2="${p[b].y.toFixed(1)}"/>`);
    }
    parts.push(`</g>`);
    return parts.join('\n');
  }

  function exportSvg() {
    const blob = new Blob([makeSvg(state.settings.exportReference)], { type: 'image/svg+xml' });
    downloadBlob(blob, makeFileName('pose', 'svg'));
  }

  async function copyPromptMemo() {
    const prompt = [
      `ControlNet pose reference image settings:`,
      `canvas=${canvas.width}x${canvas.height}`,
      `draw_mode=${state.settings.drawMode}`,
      `background=${state.settings.backgroundMode}`,
      `line_width=${state.settings.lineWidth}`,
      `joint_size=${state.settings.jointSize}`,
      `recommended_use=${state.settings.drawMode === 'openpose' ? 'OpenPose ControlNet direct condition image' : 'Canny or pose sketch reference'}`,
      `note=Use prompt/LoRA/IP-Adapter separately for character identity. This image controls pose and layout only.`
    ].join('\n');
    try {
      await navigator.clipboard.writeText(prompt);
      setStatus('設定メモをコピーしました');
    } catch {
      setStatus('コピーに失敗しました。ブラウザの権限を確認してください。');
    }
  }

  function loadJsonFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data.points) throw new Error('points がありません');
        const width = Number(data.width || canvas.width);
        const height = Number(data.height || canvas.height);
        canvas.width = width;
        canvas.height = height;
        state.settings = { ...state.settings, ...(data.settings || {}), width, height };
        syncControlsFromState();
        state.points = {};
        for (const joint of JOINTS) {
          const p = data.points[joint.id];
          if (!p) throw new Error(`${joint.id} がありません`);
          state.points[joint.id] = { x: p.x * width, y: p.y * height };
        }
        state.selectedJoint = null;
        applyCanvasCssSize();
        setStatus('JSONを読み込みました');
        render();
      } catch (err) {
        setStatus(`JSON読み込み失敗: ${err.message}`);
      }
    };
    reader.readAsText(file);
  }

  function loadReferenceImage(file) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        state.referenceImage = img;
        state.referenceVisible = true;
        state.referenceName = file.name;
        setStatus(`下絵を読み込み: ${file.name}`);
        render();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function centerPose() {
    const xs = Object.values(state.points).map(p => p.x);
    const ys = Object.values(state.points).map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const dx = canvas.width / 2 - (minX + maxX) / 2;
    const dy = canvas.height / 2 - (minY + maxY) / 2;
    for (const p of Object.values(state.points)) {
      p.x += dx;
      p.y += dy;
      clampPoint(p);
    }
    render();
  }

  function flipPose() {
    for (const p of Object.values(state.points)) {
      p.x = canvas.width - p.x;
    }
    const newPoints = { ...state.points };
    for (const [a, b] of Object.entries(MIRROR_PAIRS)) {
      if (a.startsWith('r_')) newPoints[a] = { ...state.points[b] };
      if (a.startsWith('l_')) newPoints[a] = { ...state.points[b] };
    }
    state.points = newPoints;
    render();
  }

  function nudgeSelected(dx, dy) {
    if (!state.selectedJoint) return;
    const p = state.points[state.selectedJoint];
    moveJoint(state.selectedJoint, p.x + dx, p.y + dy);
    render();
  }

  function syncStateFromControls() {
    state.settings.drawMode = $('drawMode').value;
    state.settings.backgroundMode = $('backgroundMode').value;
    state.settings.lineWidth = Number($('lineWidth').value);
    state.settings.jointSize = Number($('jointSize').value);
    state.settings.showGrid = $('showGrid').checked;
    state.settings.showJoints = $('showJoints').checked;
    state.settings.showLabels = $('showLabels').checked;
    state.settings.mirrorMode = $('mirrorMode').checked;
    state.settings.showChairGuide = $('showChairGuide').checked;
    state.settings.keepInside = $('keepInside').checked;
    state.settings.referenceOpacity = Number($('referenceOpacity').value) / 100;
    state.settings.referenceFit = $('referenceFit').value;
    state.settings.exportReference = $('exportReference').checked;
    state.zoom = Number($('zoomRange').value) / 100;
    applyCanvasCssSize();
  }

  function syncControlsFromState() {
    $('canvasWidth').value = state.settings.width;
    $('canvasHeight').value = state.settings.height;
    $('drawMode').value = state.settings.drawMode;
    $('backgroundMode').value = state.settings.backgroundMode;
    $('lineWidth').value = state.settings.lineWidth;
    $('jointSize').value = state.settings.jointSize;
    $('showGrid').checked = state.settings.showGrid;
    $('showJoints').checked = state.settings.showJoints;
    $('showLabels').checked = state.settings.showLabels;
    $('mirrorMode').checked = state.settings.mirrorMode;
    $('showChairGuide').checked = state.settings.showChairGuide;
    $('keepInside').checked = state.settings.keepInside;
    $('referenceOpacity').value = Math.round(state.settings.referenceOpacity * 100);
    $('referenceFit').value = state.settings.referenceFit;
    $('exportReference').checked = state.settings.exportReference;
    $('zoomRange').value = Math.round(state.zoom * 100);
  }

  function bindEvents() {
    canvas.addEventListener('mousedown', onPointerDown);
    canvas.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    canvas.addEventListener('touchstart', onPointerDown, { passive: false });
    canvas.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);

    canvas.addEventListener('wheel', (evt) => {
      evt.preventDefault();
      const current = Number($('zoomRange').value);
      const next = Math.max(50, Math.min(200, current + (evt.deltaY < 0 ? 5 : -5)));
      $('zoomRange').value = next;
      syncStateFromControls();
      render();
    }, { passive: false });

    document.addEventListener('keydown', (evt) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
      const step = evt.shiftKey ? 10 : 2;
      if (evt.key === 'ArrowLeft') { evt.preventDefault(); nudgeSelected(-step, 0); }
      if (evt.key === 'ArrowRight') { evt.preventDefault(); nudgeSelected(step, 0); }
      if (evt.key === 'ArrowUp') { evt.preventDefault(); nudgeSelected(0, -step); }
      if (evt.key === 'ArrowDown') { evt.preventDefault(); nudgeSelected(0, step); }
      if (evt.key === 'Escape') { state.selectedJoint = null; render(); }
    });

    $('applyPresetBtn').addEventListener('click', () => applyPreset($('presetSelect').value));
    $('exportPngBtn').addEventListener('click', exportCanvasAsPng);
    $('exportSvgBtn').addEventListener('click', exportSvg);
    $('exportJsonBtn').addEventListener('click', exportJson);
    $('copyPromptBtn').addEventListener('click', copyPromptMemo);
    $('centerPoseBtn').addEventListener('click', centerPose);
    $('flipPoseBtn').addEventListener('click', flipPose);
    $('resetPoseBtn').addEventListener('click', () => applyPreset('standing_front'));
    $('clearSelectionBtn').addEventListener('click', () => { state.selectedJoint = null; render(); });

    $('canvasWidth').addEventListener('change', () => setCanvasSize(Number($('canvasWidth').value), canvas.height));
    $('canvasHeight').addEventListener('change', () => setCanvasSize(canvas.width, Number($('canvasHeight').value)));

    const redrawIds = [
      'drawMode', 'backgroundMode', 'lineWidth', 'jointSize', 'showGrid', 'showJoints', 'showLabels',
      'mirrorMode', 'showChairGuide', 'keepInside', 'referenceOpacity', 'referenceFit', 'exportReference', 'zoomRange'
    ];
    for (const id of redrawIds) {
      const el = $(id);
      el.addEventListener('input', () => { syncStateFromControls(); render(); });
      el.addEventListener('change', () => { syncStateFromControls(); render(); });
    }

    $('referenceInput').addEventListener('change', (evt) => {
      const file = evt.target.files?.[0];
      if (file) loadReferenceImage(file);
    });
    $('toggleReferenceBtn').addEventListener('click', () => {
      state.referenceVisible = !state.referenceVisible;
      render();
    });
    $('clearReferenceBtn').addEventListener('click', () => {
      state.referenceImage = null;
      state.referenceName = '';
      $('referenceInput').value = '';
      render();
    });
    $('jsonInput').addEventListener('change', (evt) => {
      const file = evt.target.files?.[0];
      if (file) loadJsonFile(file);
    });
    $('applyJointPositionBtn').addEventListener('click', () => {
      if (!state.selectedJoint) return;
      moveJoint(state.selectedJoint, Number($('jointX').value), Number($('jointY').value));
      render();
    });
  }

  function init() {
    state.points = clonePreset('standing_front');
    syncControlsFromState();
    applyCanvasCssSize();
    bindEvents();
    render();
  }

  init();
})();
