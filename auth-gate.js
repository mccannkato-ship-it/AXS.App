const ADMIN_EMAIL = 'ezemaebuka43@gmail.com'
const AUTH_KEY = 'axs-auth-session'

export function getSession() {
  try { return JSON.parse(sessionStorage.getItem(AUTH_KEY) || 'null') } catch { return null }
}

export function isAdminSession() {
  return getSession()?.email?.toLowerCase() === ADMIN_EMAIL
}

export function requireAuth(onAuthenticated) {
  const session = getSession()
  if (session?.email) return onAuthenticated(session)
  renderAuthScreen()
}

function renderAuthScreen() {
  const root = document.querySelector('#root')
  if (!root) return
  root.innerHTML = `<main class="axs-auth-shell"><section class="axs-auth-brand"><div class="axs-logo">axs</div></section><section class="axs-auth-card"><div class="axs-auth-inner"><h1>Sign in or create account</h1><p class="axs-auth-subtitle">If you don&apos;t have an account, we&apos;ll create one for you.</p><form id="axs-auth-form"><label for="axs-email">Email address</label><input id="axs-email" name="email" type="email" autocomplete="email" required><label id="axs-password-label" class="axs-password-label" for="axs-password">Password</label><input id="axs-password" name="password" type="password" autocomplete="current-password" required><button type="submit">Continue</button><p id="axs-auth-error" role="alert"></p></form><p class="axs-auth-switch">Already have an account? <button id="axs-login-toggle" type="button">Login</button></p></div><footer><a href="/terms">Terms of Use</a><a href="/privacy">Privacy Policy</a></footer></section></main>`
  const form = document.querySelector('#axs-auth-form')
  const toggle = document.querySelector('#axs-login-toggle')
  let loginMode = false
  const sync = () => {
    document.querySelector('.axs-auth-subtitle').textContent = loginMode ? 'Enter your email and password to continue.' : "If you don't have an account, we'll create one for you."
    document.querySelector('#axs-password-label').hidden = !loginMode
    document.querySelector('#axs-password').hidden = !loginMode
    toggle.textContent = loginMode ? 'Create account' : 'Login'
  }
  toggle.addEventListener('click', () => { loginMode = !loginMode; sync() })
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const data = new FormData(form)
    const email = String(data.get('email') || '').trim().toLowerCase()
    const password = String(data.get('password') || '')
    if (loginMode && password.length < 8) {
      document.querySelector('#axs-auth-error').textContent = 'Password must be at least 8 characters.'
      return
    }
    sessionStorage.setItem(AUTH_KEY, JSON.stringify({ email, name: email.split('@')[0] }))
    window.location.reload()
  })
  sync()
}
