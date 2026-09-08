'use strict';

(function bootstrapSecretRoom() {
  const effects = document.createElement('script');
  effects.src = 'secret-effects.js';
  effects.async = false;
  document.head.appendChild(effects);
  initAnswerForm();
})();

function initAnswerForm() {
  const input = document.getElementById('answerInput');
  const btn = document.getElementById('submitBtn');
  const resultEl = document.getElementById('result');
  const innerEl = document.getElementById('resultInner');
  if (!input || !btn || !resultEl || !innerEl) return;

  let isSubmitting = false;
  let lastIncorrect = '';

  function normalize(str) {
    return str.trim()
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
      })
      .replace(/[\u30A1-\u30F6]/g, function(s) {
        return String.fromCharCode(s.charCodeAt(0) - 0x60);
      })
      .toLowerCase();
  }

  function shakeInput() {
    input.classList.add('shake');
    input.addEventListener('animationend', function() {
      input.classList.remove('shake');
    }, { once: true });
  }

  function showMessage(html, type) {
    innerEl.classList.remove('show', 'correct', 'incorrect');
    innerEl.innerHTML = html;
    innerEl.classList.add('show', type);
    resultEl.style.minHeight = '5rem';
  }

  function submit() {
    if (isSubmitting) return;
    const normalized = normalize(input.value);
    if (!normalized) {
      input.focus();
      return;
    }
    if (normalized === lastIncorrect) {
      shakeInput();
      return;
    }

    isSubmitting = true;
    btn.disabled = true;
    btn.textContent = '…';

    fetch('check.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer: normalized }),
    })
      .then(function(res) {
        if (res.status === 429) throw new Error('too_many');
        if (res.status === 503) throw new Error('unavailable');
        if (!res.ok) throw new Error('server_error');
        return res.json();
      })
      .then(function(data) {
        if (data.result === 'correct') {
          lastIncorrect = '';
          showMessage('鍵が合いました。<br><span style="font-size:0.85em;opacity:0.7">扉が開きます……</span>', 'correct');
          setTimeout(function() {
            window.location.href = 'room.php';
          }, 2000);
          return;
        }

        lastIncorrect = normalized;
        const attempts = Number(data.attempts || 0);
        let msg = '合鍵では開きません。';
        if (attempts >= 3 && attempts < 6) {
          msg += '<br><span style="font-size:0.85em;opacity:0.7">……手掛かりをもう一度、丁寧に読め。</span>';
        } else if (attempts >= 6) {
          msg += '<br><span style="font-size:0.85em;opacity:0.7">……答えはひらがなだ。</span>';
        }
        showMessage(msg, 'incorrect');
        shakeInput();
      })
      .catch(function(err) {
        if (err.message === 'too_many') {
          showMessage('試行回数が多すぎます。しばらく待ってから再度お試しください。', 'incorrect');
        } else if (err.message === 'unavailable') {
          showMessage('現在、鍵の照合機能を利用できません。', 'incorrect');
        } else {
          showMessage('通信エラーが発生しました。ページを再読み込みしてください。', 'incorrect');
        }
      })
      .finally(function() {
        isSubmitting = false;
        btn.disabled = false;
        btn.innerHTML = '<span class="submit-icon">&#9670;</span><span>解錠</span>';
      });
  }

  btn.addEventListener('click', submit);
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  });
}
