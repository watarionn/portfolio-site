'use strict';
// =============================================
// 認証共通 — auth.js
// =============================================

/* ─── 現在のユーザーを取得 ─── */
async function getUser() {
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

/* ─── プロフィール取得 ─── */
async function getProfile(userId) {
  const { data } = await sb.from('profiles').select('*').eq('id', userId).single();
  return data;
}

/* ─── ナビゲーションのログイン状態を反映 ─── */
async function updateNavAuth() {
  const user = await getUser();
  const authArea = document.getElementById('nav-auth');
  if (!authArea) return;

  if (user) {
    const profile = await getProfile(user.id);
    authArea.innerHTML = `
      <span class="nav-username">${escHtml(profile?.username || '採取者')}</span>
      <button class="nav-btn nav-btn--ghost" id="logoutBtn">ログアウト</button>
    `;
    document.getElementById('logoutBtn').addEventListener('click', async () => {
      await sb.auth.signOut();
      location.reload();
    });
  } else {
    authArea.innerHTML = `
      <a href="auth.html" class="nav-btn">ログイン / 登録</a>
    `;
  }
}

/* ─── アプリ内リダイレクトを安全に解決 ─── */
function getSafeAppRedirect(raw, fallback) {
  const fallbackUrl = new URL(fallback || 'yorei.html', location.href);
  const fallbackPath = fallbackUrl.pathname + fallbackUrl.search + fallbackUrl.hash;
  if (!raw) return fallbackPath;

  try {
    const target = new URL(raw, location.href);
    const appDir = new URL('.', location.href);
    if (target.origin !== location.origin) return fallbackPath;
    if (!target.pathname.startsWith(appDir.pathname)) return fallbackPath;
    return target.pathname + target.search + target.hash;
  } catch (_) {
    return fallbackPath;
  }
}

/* ─── ログインが必要なページで使う ─── */
async function requireAuth() {
  const user = await getUser();
  if (!user) {
    const redirect = location.pathname + location.search + location.hash;
    location.href = 'auth.html?redirect=' + encodeURIComponent(redirect);
    return null;
  }
  return user;
}

/* ─── PostgREST 論理フィルタ用の値を引用 ─── */
function quotePostgrestLogicValue(value) {
  return '"' + String(value)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"') + '"';
}

function ilikeContainsLogic(column, keyword) {
  return `${column}.ilike.${quotePostgrestLogicValue(`*${keyword}*`)}`;
}

/* ─── XSSエスケープ ─── */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ─── 日付フォーマット ─── */
function fmtDate(str) {
  if (!str) return '';
  return str.slice(0, 10).replace(/-/g, '年').replace(/(\d+)年(\d+)$/, '$1年$2月').replace(/(\d+)$/, '$1日');
}

/* ─── ページ読み込み時に認証状態を反映 ─── */
document.addEventListener('DOMContentLoaded', updateNavAuth);
