const ADMIN_EMAIL = 'ezemaebuka43@gmail.com'
const AUTH_KEY = 'axs-auth-session'
export function getSession() { try { return JSON.parse(sessionStorage.getItem(AUTH_KEY) || 'null') } catch { return null } }
export function isAdminSession() { return getSession()?.email?.toLowerCase() === ADMIN_EMAIL }
export async function requireAuth(onAuthenticated) { const response = await fetch('/api/auth/session'); const data = await response.json(); if (data.user) { sessionStorage.setItem(AUTH_KEY, JSON.stringify(data.user)); return onAuthenticated(data.user) } renderAuthScreen() }
export function renderAuthScreen() {
 const root=document.querySelector('#root'); if(!root)return
 root.innerHTML=`<main class="axs-auth-shell"><section class="axs-auth-brand"><div class="axs-logo">axs</div></section><section class="axs-auth-card"><div class="axs-auth-inner"><h1>Sign in or create account</h1><p class="axs-auth-subtitle">If you don&apos;t have an account, we&apos;ll create one for you.</p><form id="axs-auth-form"><label for="axs-email">Email address</label><input id="axs-email" name="email" type="email" autocomplete="email" required><label id="axs-password-label" for="axs-password">Password</label><input id="axs-password" name="password" type="password" autocomplete="current-password" minlength="8" required><button type="submit">Continue</button><p id="axs-auth-error" role="alert"></p></form><p class="axs-auth-switch">Already have an account? <button id="axs-login-toggle" type="button">Login</button></p></div><footer><a href="/terms">Terms of Use</a><a href="/privacy">Privacy Policy</a></footer></section></main>`
 const form=document.querySelector('#axs-auth-form'), toggle=document.querySelector('#axs-login-toggle'), subtitle=document.querySelector('.axs-auth-subtitle'), error=document.querySelector('#axs-auth-error'); let loginMode=false
 const sync=()=>{subtitle.textContent=loginMode?'Enter your email and password to continue.':"If you don't have an account, we'll create one for you.";toggle.textContent=loginMode?'Create account':'Login'}
 toggle.onclick=()=>{loginMode=!loginMode;sync()}
 form.onsubmit=async event=>{event.preventDefault();error.textContent='';const data=Object.fromEntries(new FormData(form));const response=await fetch(loginMode?'/api/auth/login':'/api/auth/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});const result=await response.json();if(!response.ok){error.textContent=result.error||'Unable to continue.';return}sessionStorage.setItem(AUTH_KEY,JSON.stringify(result.user));location.reload()}; sync()
}
