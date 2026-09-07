/**
 * 魚類辞典 — aquarium.js
 * 用例カードのインタラクション・泡・ふよふよ
 */

'use strict';

document.addEventListener('DOMContentLoaded', function () {

  /* ─── カードの散らばり設定 ─── */
  const cards = document.querySelectorAll('.fish-card');

  cards.forEach(function (card, i) {

    // 傾き：奇数偶数で左右交互にバラつかせる
    const baseTilt = (i % 2 === 0 ? 1 : -1);
    const tilt     = baseTilt * (0.4 + Math.random() * 1.8);

    // ふよふよパラメータ
    const floatY     = 2 + Math.random() * 3;
    const floatX     = 1 + Math.random() * 2;
    const floatSpeed = 4 + Math.random() * 4;
    const floatDelay = -(Math.random() * 4);   // マイナスで最初からバラバラに動く

    card.style.setProperty('--tilt',        tilt        + 'deg');
    card.style.setProperty('--float-y',     floatY      + 'px');
    card.style.setProperty('--float-x',     floatX      + 'px');
    card.style.setProperty('--float-speed', floatSpeed  + 's');
    card.style.setProperty('--float-delay', floatDelay  + 's');
  });


  /* ─── カードのフリップ ─── */
  cards.forEach(function (card) {

    const front = card.querySelector('.fish-front');
    const back  = card.querySelector('.fish-back');

    function flip() {
      const isFlipped = card.classList.toggle('flipped');
      // aria-hidden を切り替えてスクリーンリーダー対応
      front.setAttribute('aria-hidden', isFlipped ? 'true'  : 'false');
      back.setAttribute( 'aria-hidden', isFlipped ? 'false' : 'true');
    }

    // クリック
    card.addEventListener('click', flip);

    // キーボード（Enter / Space）
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        flip();
      }
    });
  });


  /* ─── 泡生成 ─── */
  const bubbleContainer = document.getElementById('bubble-container');

  if (bubbleContainer) {
    const BUBBLE_COUNT = 22;

    for (let i = 0; i < BUBBLE_COUNT; i++) {
      const bubble = document.createElement('div');
      bubble.className = 'bubble';

      const size = 6 + Math.random() * 28;          // px
      const dur  = 10 + Math.random() * 14;          // s
      const del  = -(Math.random() * dur);           // 最初からバラバラに

      bubble.style.left              = (Math.random() * 100) + 'vw';
      bubble.style.width             = size + 'px';
      bubble.style.height            = size + 'px';
      bubble.style.animationDuration = dur  + 's';
      bubble.style.animationDelay    = del  + 's';
      // 大きい泡は少し透明に
      bubble.style.opacity           = (0.3 + Math.random() * 0.4).toFixed(2);

      bubbleContainer.appendChild(bubble);
    }
  }


  /* ─── タブ非表示でアニメーション停止 ─── */
  document.addEventListener('visibilitychange', function () {
    const state = document.hidden ? 'paused' : 'running';

    document.querySelectorAll(
      '.fish-card, .bubble, .water-caustic'
    ).forEach(function (el) {
      el.style.animationPlayState = state;
    });
  });

});
