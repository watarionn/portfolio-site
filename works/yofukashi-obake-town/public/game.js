/* よふかしおばけ町 - vanilla JavaScript / offline / no dependencies */
(() => {
  'use strict';
  const SIZE = 5;
  const CELLS = SIZE * SIZE;
  const STATE_VERSION = 1;
  const SAVE_KEY = 'obake-town-game-v1';
  const META_KEY = 'obake-town-records-v1';
  const PREFERENCE_KEY = 'obake-town-options-v1';
  const BROOM_COST = 12;
  const UNDO_COST = 6;
  const REROLL_COST = 4;
  const TIERS = [null,
    { icon: '🕯️', name: '月明かり', story: '誰かが灯した小さな明かり。町の始まり。' },
    { icon: '🍄', name: 'まよいキノコ', story: '夜になるとおしゃべりを始める不思議なキノコ。' },
    { icon: '🌲', name: '夜の森', story: '月明かりを浴びて、木々がこっそり歩いている。' },
    { icon: '🛖', name: 'おばけ小屋', story: '幽霊が初めて「マイホーム」を手に入れた。' },
    { icon: '🏠', name: 'ゆうれい長屋', story: '住人が増えて、回覧板が届き始めた。' },
    { icon: '🏫', name: '怪異研究所', story: '変な研究に大まじめな幽霊たち。' },
    { icon: '🏰', name: '月影のお城', story: '王様はまだ寝ているらしい。' },
    { icon: '🔮', name: '星くず天文台', story: '宇宙のなぞを解いて、ついでに町の天気を予報する。' },
    { icon: '🌌', name: '夜のむこう', story: '地図の端に新しい世界がひらけた。' }
  ];
  const BADGES = [
    { id: 'hello', label: 'はじめの一歩', icon: '🕯️', text: 'はじめて建物を進化させる' },
    { id: 'chain', label: '連鎖の名人', icon: '⚡', text: '一度に2連鎖以上する' },
    { id: 'settlers', label: '町の名物住人', icon: '👻', text: 'おばけ小屋を発見する' },
    { id: 'busy', label: '夜ふかし開発者', icon: '🔨', text: '累計100手を置く' },
    { id: 'rich', label: 'お金持ち幽霊', icon: '🌙', text: 'おこづかいを100以上ためる' },
    { id: 'scholar', label: '不思議の研究者', icon: '📚', text: '研究所を発見する' }
  ];
  const $ = (id) => document.getElementById(id);
  const nf = (value) => Number(value || 0).toLocaleString('ja-JP');
  const safeStorage = {
    get(key) { try { return localStorage.getItem(key); } catch (_) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); return true; } catch (_) { return false; } }
  };
  function dailyStamp() {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  }
  function hashSeed(value) {
    let h = 2166136261;
    for (const c of value) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
    return h >>> 0 || 1;
  }
  function randomFloat(s) {
    let x = s.rng >>> 0;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    s.rng = x >>> 0 || 1;
    return s.rng / 4294967296;
  }
  function nextTier(s) {
    const r = randomFloat(s);
    if (s.maxLevel >= 5 && r > .978) return 3;
    if (s.moves >= 4 && r > .84) return 2;
    return 1;
  }
  function freshGame(mode) {
    const stamp = dailyStamp();
    const seed = mode === 'daily' ? hashSeed(`obake-daily-${stamp}`) : ((Math.random() * 0xffffffff) >>> 0 || 1);
    return {
      v: STATE_VERSION, mode, day: mode === 'daily' ? stamp : null, seed, rng: seed,
      board: Array(CELLS).fill(0), queue: [1,1,1], score:0, coins:24,
      moves:0, maxLevel:1, bestCombo:0, history:null, broomMode:false
    };
  }
  function blankMeta() {
    return { v:1, discovered:[1], badges:[], bestScore:0, dailyBest:{}, bestCombo:0, totalMoves:0, totalMerges:0 };
  }
  function readJSON(key) { try { const text = safeStorage.get(key); return text ? JSON.parse(text) : null; } catch (_) { return null; } }
  function validBoard(board) { return Array.isArray(board) && board.length === CELLS && board.every(n=>Number.isInteger(n) && n >= 0 && n <= 9); }
  function validGame(g, mode) {
    return g && g.v === STATE_VERSION && g.mode === mode && (mode !== 'daily' || g.day === dailyStamp()) &&
      validBoard(g.board) && Array.isArray(g.queue) && g.queue.length === 3 && g.queue.every(n => [1,2,3].includes(n)) &&
      [g.score,g.coins,g.moves,g.maxLevel,g.rng].every(n => Number.isFinite(n) && n >= 0) && g.maxLevel >= 1 && g.maxLevel <= 9;
  }
  function loadMeta() {
    const raw = readJSON(META_KEY);
    if (!raw || raw.v !== 1 || !Array.isArray(raw.discovered) || !Array.isArray(raw.badges)) return blankMeta();
    const base = blankMeta();
    return {...base,...raw,discovered:Array.from(new Set([1,...raw.discovered.filter(n=>Number.isInteger(n)&&n>0&&n<10)])),badges:raw.badges.filter(id=>BADGES.some(x=>x.id === id))};
  }
  function loadGame(mode) {
    const all = readJSON(SAVE_KEY);
    const slot = mode === 'daily' ? 'daily' : 'free';
    return validGame(all?.[slot],mode) ? {...all[slot],broomMode:false,history:validHistory(all[slot].history)?all[slot].history:null} : freshGame(mode);
  }
  function validHistory(h) { return h && validBoard(h.board) && Array.isArray(h.queue) && h.queue.length === 3 && [h.coins,h.score,h.moves,h.rng,h.maxLevel].every(Number.isFinite); }
  let prefs = {sound:false,...(readJSON(PREFERENCE_KEY) || {})};
  let meta = loadMeta();
  let activeMode = 'free';
  let state = loadGame(activeMode);
  let toastTimer = null;
  let floatTimer = null;
  let audioContext = null;
  let lastMergedPosition = -1;
  function save() {
    const existing = readJSON(SAVE_KEY);
    const all = existing && typeof existing === 'object' && !Array.isArray(existing) ? existing : {};
    all[state.mode] = {...state,broomMode:false};
    const ok = safeStorage.set(SAVE_KEY,JSON.stringify(all));
    safeStorage.set(META_KEY,JSON.stringify(meta));
    $('saveStatus').textContent = ok ? '● 自動保存' : '○ 保存できない環境';
  }
  function recordBest() {
    meta.bestScore = Math.max(meta.bestScore, state.score);
    meta.bestCombo = Math.max(meta.bestCombo,state.bestCombo);
    if (state.mode === 'daily') {
      meta.dailyBest[state.day] = Math.max(Number(meta.dailyBest[state.day] || 0),state.score);
      const dates = Object.keys(meta.dailyBest).sort().reverse();
      dates.slice(45).forEach(d=>delete meta.dailyBest[d]);
    }
  }
  function badge(id) {
    if (meta.badges.includes(id)) return false;
    meta.badges.push(id);
    const found = BADGES.find(a=>a.id===id);
    if (found) flash(`実績解除！ ${found.icon} ${found.label}`);
    return true;
  }
  function checkBadges() {
    if (meta.totalMoves >= 100) badge('busy');
    if (meta.discovered.includes(4)) badge('settlers');
    if (meta.discovered.includes(6)) badge('scholar');
    if (state.coins >= 100) badge('rich');
  }
  function neighbors(index) {
    const x=index%SIZE,y=Math.floor(index/SIZE),out=[];
    if(x>0)out.push(index-1); if(x<SIZE-1)out.push(index+1);
    if(y>0)out.push(index-SIZE); if(y<SIZE-1)out.push(index+SIZE);
    return out;
  }
  function sameGroup(board, start) {
    const level=board[start]; if(!level)return [];
    const seen=new Set([start]),todo=[start];
    for(let i=0;i<todo.length;i++) for(const p of neighbors(todo[i])) {
      if(!seen.has(p) && board[p] === level) {seen.add(p);todo.push(p);}
    }
    return todo;
  }
  function population() {return state.board.reduce((n,t)=>n+(t>=4?Math.pow(2,Math.min(6,t-4)):0),0);}
  function playSound(steps, kind='merge') {
    if(!prefs.sound) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if(!Audio)return;
      audioContext = audioContext || new Audio();
      if(audioContext.state === 'suspended') audioContext.resume().catch(()=>{});
      const base=audioContext.currentTime;
      steps.forEach((f,i)=>{
        const osc=audioContext.createOscillator(),vol=audioContext.createGain();
        osc.type = kind === 'tap' ? 'sine' : 'triangle';osc.frequency.setValueAtTime(f,base+i*.085);
        vol.gain.setValueAtTime(.0001,base+i*.085);
        vol.gain.exponentialRampToValueAtTime(.055,base+i*.085+.012);
        vol.gain.exponentialRampToValueAtTime(.0001,base+i*.085+.18);
        osc.connect(vol);vol.connect(audioContext.destination);
        osc.start(base+i*.085);osc.stop(base+i*.085+.2);
      });
    }catch(_){/* No audio device: gameplay continues. */}
  }
  function tactile(){try{navigator.vibrate?.(14)}catch(_){}}
  function flash(text) {
    const toast=$('toast');toast.textContent=text;toast.classList.add('visible');
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('visible'),2000);
  }
  function floatOnBoard(text) {
    const el=$('boardFloat');
    el.innerHTML='';const span=document.createElement('span');span.className='floating-message';span.textContent=text;el.appendChild(span);
    clearTimeout(floatTimer);floatTimer=setTimeout(()=>{el.innerHTML=''},1150);
  }
  function say(text) { $('narrator').textContent=text; }
  function snapshot() {
    const {board,queue,score,coins,moves,maxLevel,bestCombo,rng}=state;
    return {board:[...board],queue:[...queue],score,coins,moves,maxLevel,bestCombo,rng};
  }
  function evolveAt(index) {
    let chains=0,discovered=[],totalGains=0;
    while(state.board[index] < 9) {
      const group=sameGroup(state.board,index);
      if(group.length<3)break;
      const tier=state.board[index],next=tier+1;
      group.forEach(p=>state.board[p]=0);
      state.board[index]=next;
      chains++;
      const gained=Math.round((tier+1)*12*Math.pow(1.8,Math.max(0,tier-1))*(group.length-2)*Math.max(1,chains*.8));
      const coins=3+tier*2+(group.length-3)*3+chains;
      state.score+=gained;state.coins+=coins;totalGains+=gained;
      state.maxLevel=Math.max(state.maxLevel,next);
      meta.totalMerges++;
      if(!meta.discovered.includes(next)) {meta.discovered.push(next);discovered.push(next);}
    }
    if(chains) {
      badge('hello');
      if(chains>=2)badge('chain');
      state.bestCombo=Math.max(state.bestCombo,chains);
      lastMergedPosition=index;
      const tier=state.board[index];
      if(discovered.length) {
        const last=discovered.at(-1),entry=TIERS[last];
        say(`新発見！ 「${entry.name}」が誕生！ ${entry.story}`);
        flash(`図鑑に追加！ ${entry.icon} ${entry.name}`);
      } else if(chains>1) {
        say(`${chains}連鎖！ おばけたちが大喜び。町の評判が${nf(totalGains)}アップ！`);
      } else say(`${TIERS[tier].icon} ${TIERS[tier].name}に進化！ おこづかいも手に入った。`);
      floatOnBoard(chains>1? `${chains} COMBO! +${nf(totalGains)}` : `進化！ +${nf(totalGains)}`);
      playSound(chains>1?[440,554,659,880]:[523,659,784]);
      tactile();
    }
    return chains;
  }
  function isImpossible() {return state.board.every(Boolean) && state.coins < BROOM_COST && !(state.history && state.coins>=UNDO_COST);}
  function onCell(index) {
    if(state.broomMode) {
      if(!state.board[index]) {flash('何もない場所はおそうじできないよ');return;}
      if(state.coins<BROOM_COST){state.broomMode=false;flash('おこづかいが足りないよ');render();return;}
      state.history=snapshot();state.board[index]=0;state.coins-=BROOM_COST;state.broomMode=false;lastMergedPosition=-1;
      say('おそうじ完了！ ここには新しい建物を建てられるよ。');playSound([277,350],'tap');
      recordBest();save();render();return;
    }
    if(state.board[index]) { flash(`${TIERS[state.board[index]].name}が建っているよ。空き地を選ぼう！`);return; }
    state.history=snapshot();
    const tier=state.queue.shift();state.board[index]=tier;
    state.moves++;meta.totalMoves++;
    state.queue.push(nextTier(state));lastMergedPosition=-1;
    const chains=evolveAt(index);
    if(!chains) {
      const phrases=['こちらが本日の建設予定地です。','おばけ町は今日もちょっとずつ発展中。','どんな町になるのかな？','おばけたちが、ちらちら様子を見ている。'];
      say(phrases[state.moves%phrases.length]);
      playSound([392],'tap');
    }
    checkBadges();recordBest();save();render();
    if(isImpossible())showEnd();
    else if(state.board.every(Boolean))flash('ぎゅうぎゅう！ おそうじか１手もどすを使おう');
  }
  function undo() {
    if(!validHistory(state.history)) {flash('戻せる１手がまだないよ');return;}
    if(state.coins<UNDO_COST) {flash('もどすには ☾ 6 が必要だよ');return;}
    const old=state.history;
    state={...state,...old,board:[...old.board],queue:[...old.queue],coins:Math.max(0,old.coins-UNDO_COST),history:null,broomMode:false};
    lastMergedPosition=-1;
    say('時の針をちょっと巻き戻した。今度はどこに建てよう？');
    if($('endDialog').open)$('endDialog').close();
    playSound([659,523,392],'tap');recordBest();save();render();
  }
  function broom() {
    if(state.coins<BROOM_COST){flash('おそうじには ☾ 12 が必要だよ');return;}
    state.broomMode=!state.broomMode;
    say(state.broomMode?'消したい建物をタップしてね。おそうじ費用は ☾ 12。':'おそうじをキャンセルしたよ。');
    render();
  }
  function reroll() {
    if(state.coins<REROLL_COST) {flash('引きなおしには ☾ 4 が必要だよ');return;}
    state.history=snapshot();
    const before=state.queue[0];
    let after=before;
    for(let i=0;i<10&&before===after;i++) after=nextTier(state);
    if(after===before) after=before===1?2:1;
    state.queue[0]=after;
    state.coins-=REROLL_COST;
    say(`次の建物が「${TIERS[after].name}」になったよ。`);
    playSound([550,700],'tap');save();render();
  }
  function newGame(mode=activeMode) {
    recordBest();state=freshGame(mode);activeMode=mode;lastMergedPosition=-1;
    say(mode==='daily'?'今日の町づくり開始！ 同じ日なら、建物の順番は何度でも同じ。':'新しい夜が始まった！ ちいさな灯りから町を育てよう。');
    if($('endDialog').open)$('endDialog').close();
    save();render();
  }
  function changeMode(mode) {
    if(mode===activeMode)return;
    recordBest();save();activeMode=mode;state=loadGame(mode);lastMergedPosition=-1;
    say(mode==='daily'?'今日の夜は、みんな同じ順番の建物からスタート。最高記録に挑戦しよう。':'おかえり。気ままな町づくりの続きだよ。');
    render();save();
  }
  function showEnd() {
    $('finalScore').textContent=nf(state.score);
    $('endDescription').textContent=`${nf(state.moves)}回建てて、${meta.discovered.length}種類の建物を発見したよ。町のみんなも大満足！`;
    $('endUndoBtn').disabled=!(validHistory(state.history)&&state.coins>=UNDO_COST);
    if(!$('endDialog').open)$('endDialog').showModal();
  }
  function renderBoard() {
    const board=$('board');const fragment=document.createDocumentFragment();
    state.board.forEach((level,i)=>{
      const cell=document.createElement('button');cell.type='button';cell.dataset.index=String(i);
      cell.className=`cell ${level?'filled tier-'+level:'empty'}${i===lastMergedPosition?' merge':''}`;
      cell.setAttribute('role','gridcell');
      cell.setAttribute('aria-label',`${Math.floor(i/SIZE)+1}行${i%SIZE+1}列：${level?TIERS[level].name:'空き地'}`);
      if(level){
        const count=document.createElement('span');count.className='cell-level';count.textContent=String(level);
        const art=document.createElement('span');art.className='emoji';art.textContent=TIERS[level].icon;
        cell.append(count,art);
      }else {
        const plus=document.createElement('span');plus.className='plot-mark';plus.textContent='＋';cell.appendChild(plus);
      }
      cell.addEventListener('click',()=>onCell(i));fragment.appendChild(cell);
    });
    board.replaceChildren(fragment);
    board.classList.toggle('broom-mode',state.broomMode);
  }
  function renderNext() {
    state.queue.forEach((n,i)=>{
      const el=$('next'+i);el.querySelector('.tile-emoji').textContent=TIERS[n].icon;
      el.querySelector('small').textContent=TIERS[n].name;
    });
  }
  function renderAlbumPreview() {
    const frag=document.createDocumentFragment();
    for(let i=1;i<=6;i++){
      const div=document.createElement('div');div.className='mini-entry'+(meta.discovered.includes(i)?'':' locked');
      div.textContent=meta.discovered.includes(i)?TIERS[i].icon:'?';div.title=meta.discovered.includes(i)?TIERS[i].name:'未発見';frag.appendChild(div);
    }
    $('albumPreview').replaceChildren(frag);
  }
  function renderGoal() {
    const next=TIERS.findIndex((_,i)=>i>1&&!meta.discovered.includes(i));
    if(next<0){$('goalEmoji').textContent='🌌';$('goalName').textContent='すべて発見！';$('goalDesc').textContent='きみの町は、ついに夜のむこうへ。';}
    else{$('goalEmoji').textContent=TIERS[next].icon;$('goalName').textContent=`${TIERS[next].name}を発見しよう`;$('goalDesc').textContent=`${TIERS[next-1].name}を3つ以上つなげよう`;}
    $('goalFraction').textContent=`${meta.discovered.length} / ${TIERS.length-1} 種類発見`;
    $('goalProgress').style.width=`${100*meta.discovered.length/(TIERS.length-1)}%`;
  }
  const RESIDENTS = [
    {name:'しらたま',icon:'👻',activities:['月を磨いている','お散歩に出かけた','町内会の準備中','お茶をいれている']},
    {name:'こむぎ',icon:'🐈',activities:['屋根の上でお昼寝中','キノコを数えている','月を追いかけている','路地をパトロール中']},
    {name:'まめ大福',icon:'👻',activities:['発明の実験中','お引っ越しの挨拶中','お菓子を探している','星を観測中']}
  ];
  function renderResidents() {
    const count=population();
    $('residentCount').textContent=count?`${nf(count)} 匹が暮らしている`:'まだ静か';
    const list=$('residentList');
    if(!count){
      const p=document.createElement('p');p.className='muted';
      p.textContent='おばけ小屋ができたら、誰かが引っ越してくるかも。';
      list.replaceChildren(p);return;
    }
    const frag=document.createDocumentFragment();
    RESIDENTS.slice(0,Math.min(count,3)).forEach((resident,i)=>{
      const row=document.createElement('div');row.className='resident';
      const avatar=document.createElement('span');avatar.className='resident-avatar';avatar.textContent=resident.icon;
      const info=document.createElement('div');const name=document.createElement('strong');name.textContent=resident.name;
      const activity=document.createElement('small');activity.textContent=resident.activities[(Math.floor(Date.now()/13000)+i+state.moves)%resident.activities.length];
      info.append(name,activity);row.append(avatar,info);frag.appendChild(row);
    });list.replaceChildren(frag);
  }
  function renderRecords() {
    $('bestScore').textContent=nf(activeMode==='daily'?meta.dailyBest[dailyStamp()]||0:meta.bestScore);
    $('bestCombo').textContent=`${nf(meta.bestCombo)} 連鎖`;
    $('discoveryCount').textContent=`${meta.discovered.length} / ${TIERS.length-1}`;
    $('totalMoves').textContent=nf(meta.totalMoves);
  }
  function render() {
    $('scoreValue').textContent=nf(state.score);
    $('coinValue').innerHTML=`${nf(state.coins)} <small>☾</small>`;
    $('citizenValue').innerHTML=`${nf(population())} <small>匹</small>`;
    $('turnValue').textContent=`${String(state.moves+1).padStart(2,'0')} 夜目`;
    $('districtName').textContent=state.maxLevel>=7?'星くず特区':state.maxLevel>=5?'おばけ商店街':state.maxLevel>=3?'まよなか新町':'月の裏通り';
    $('weatherText').textContent=state.maxLevel>=5?'☾ ふしぎな天気':state.moves%7===0?'✧ 月がきれい':'☾ 星の多い夜';
    $('undoBtn').disabled=!validHistory(state.history)||state.coins<UNDO_COST;
    $('broomBtn').disabled=state.coins<BROOM_COST;
    $('rerollBtn').disabled=state.coins<REROLL_COST;
    $('broomBtn').classList.toggle('active',state.broomMode);
    $('broomLabel').textContent=state.broomMode?'やめる':'おそうじ';
    $('freeModeBtn').classList.toggle('selected',activeMode==='free');
    $('dailyModeBtn').classList.toggle('selected',activeMode==='daily');
    $('modeInfo').textContent=activeMode==='free'?'気ままに町づくり。いつでも続きから遊べるよ。':`${dailyStamp().slice(0,4)}/${dailyStamp().slice(4,6)}/${dailyStamp().slice(6)} のお題。同じ日なら建物の順番は同じ。`;
    renderBoard();renderNext();renderAlbumPreview();renderGoal();renderResidents();renderRecords();
  }
  function showAlbum() {
    const list=document.createDocumentFragment();
    for(let i=1;i<TIERS.length;i++){
      const found=meta.discovered.includes(i),e=TIERS[i],el=document.createElement('div');
      el.className='album-entry'+(found?'':' locked');
      const art=document.createElement('div');art.className='art';art.textContent=found?e.icon:'？';
      const name=document.createElement('strong');name.textContent=found?e.name:'？？？';
      const description=document.createElement('small');description.textContent=found?e.story:'まだ見つかっていない';
      el.append(art,name,description);list.appendChild(el);
    }
    $('albumList').replaceChildren(list);
    const achievements=document.createDocumentFragment();
    for(const b of BADGES){const achieved=meta.badges.includes(b.id),el=document.createElement('div');el.className='achievement'+(achieved?' unlocked':'');
      const icon=document.createElement('i');icon.textContent=achieved?b.icon:'◌';
      const label=document.createElement('span');label.textContent=achieved?`${b.label} ／ ${b.text}`:b.text;
      el.append(icon,label);achievements.appendChild(el);
    }
    $('achievementsList').replaceChildren(achievements);
    $('albumDialog').showModal();
  }
  function wire() {
    $('helpBtn').addEventListener('click',()=>$('helpDialog').showModal());
    $('closeHelpBtn').addEventListener('click',()=>{$('helpDialog').close();safeStorage.set('obake-town-help-seen','yes')});
    $('albumBtn').addEventListener('click',showAlbum);
    $('closeAlbumBtn').addEventListener('click',()=>$('albumDialog').close());
    $('undoBtn').addEventListener('click',undo);
    $('endUndoBtn').addEventListener('click',undo);
    $('broomBtn').addEventListener('click',broom);
    $('rerollBtn').addEventListener('click',reroll);
    $('newGameBtn').addEventListener('click',()=>$('confirmDialog').showModal());
    $('confirmResetBtn').addEventListener('click',()=>{$('confirmDialog').close();newGame()});
    $('cancelResetBtn').addEventListener('click',()=>$('confirmDialog').close());
    $('retryBtn').addEventListener('click',()=>newGame());
    $('endCloseBtn').addEventListener('click',()=>$('endDialog').close());
    $('freeModeBtn').addEventListener('click',()=>changeMode('free'));
    $('dailyModeBtn').addEventListener('click',()=>changeMode('daily'));
    $('soundBtn').addEventListener('click',()=>{prefs.sound=!prefs.sound;safeStorage.set(PREFERENCE_KEY,JSON.stringify(prefs));renderSound();playSound([523,659,784]);});
    document.addEventListener('keydown',(ev)=>{
      if(ev.key.toLowerCase()==='escape'&&state.broomMode){state.broomMode=false;render();}
    });
  }
  function renderSound(){$('soundBtn').textContent=prefs.sound?'♪ 音をオフ':'♪ 音をオン';$('soundBtn').setAttribute('aria-pressed',String(prefs.sound));}
  wire();render();renderSound();checkBadges();save();
  setInterval(() => { if (!$('helpDialog').open && !$('albumDialog').open && !$('endDialog').open) renderResidents(); }, 13000);
  if(!safeStorage.get('obake-town-help-seen'))$('helpDialog').showModal();
  if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')) {
    window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{}));
  }
  // Pure helpers exported only for local, automated smoke testing. No network/backend dependency.
  if (location.hostname==='localhost' || location.hostname==='127.0.0.1') {
    window.__obakeTest={getState:()=>structuredClone(state),getMeta:()=>structuredClone(meta),neighbors,sameGroup,onCell,changeMode,newGame,undo};
  }
})();
