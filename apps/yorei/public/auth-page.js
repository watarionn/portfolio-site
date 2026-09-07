'use strict';
// =============================================
// 認証ページ — auth-page.js
// =============================================

const msgEl   = document.getElementById('auth-msg');
const tabLogin  = document.getElementById('tab-login');
const tabSignup = document.getElementById('tab-signup');
const loginForm  = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

function requestedRedirect() {
  const params = new URLSearchParams(location.search);
  return getSafeAppRedirect(params.get('redirect'), 'yorei.html');
}

/* ─── ログイン済みならリダイレクト ─── */
(async function() {
  const user = await getUser();
  if (user) {
    location.href = requestedRedirect();
  }
})();

/* ─── タブ切替 ─── */
tabLogin.addEventListener('click', function() {
  tabLogin.classList.add('active');
  tabSignup.classList.remove('active');
  loginForm.hidden = false;
  signupForm.hidden = true;
  clearMsg();
});
tabSignup.addEventListener('click', function() {
  tabSignup.classList.add('active');
  tabLogin.classList.remove('active');
  signupForm.hidden = false;
  loginForm.hidden = true;
  clearMsg();
});

/* ─── ログイン ─── */
loginForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  const btn   = this.querySelector('button[type=submit]');
  btn.disabled = true; btn.textContent = '…';

  const { error } = await sb.auth.signInWithPassword({ email, password: pass });

  if (error) {
    showMsg('ログインに失敗しました。メールアドレスとパスワードを確認してください。', 'err');
  } else {
    location.href = requestedRedirect();
  }
  btn.disabled = false; btn.textContent = 'ログイン';
});

/* ─── 新規登録 ─── */
signupForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  const name  = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const pass  = document.getElementById('signup-pass').value;
  const btn   = this.querySelector('button[type=submit]');

  if (!name) { showMsg('採取者名を入力してください。', 'err'); return; }
  if (pass.length < 8) { showMsg('パスワードは8文字以上にしてください。', 'err'); return; }

  btn.disabled = true; btn.textContent = '…';

  const { error } = await sb.auth.signUp({
    email,
    password: pass,
    options: { data: { username: name } },
  });

  if (error) {
    showMsg('登録に失敗しました：' + error.message, 'err');
  } else {
    showMsg('確認メールを送信しました。メールのリンクをクリックしてアカウントを有効化してください。', 'ok');
    this.reset();
  }
  btn.disabled = false; btn.textContent = '登録する';
});

function showMsg(text, type) {
  msgEl.innerHTML = `<div class="msg msg--${type}">${escHtml(text)}</div>`;
}
function clearMsg() { msgEl.innerHTML = ''; }
