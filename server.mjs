import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import pg from 'pg'

const root = fileURLToPath(new URL('.', import.meta.url))
const port = Number(process.env.PORT || 5173)
const pool = process.env.DATABASE_URL ? new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }) : null
const mime = { '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon' }
const cookie = (req) => Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map(v => v.trim().split('=')))
const json = (res, status, body, headers = {}) => { res.writeHead(status, {'content-type':'application/json; charset=utf-8', ...headers}); res.end(JSON.stringify(body)) }
const hash = (password, salt = randomBytes(16).toString('hex')) => `${salt}:${scryptSync(password, salt, 64).toString('hex')}`
const verify = (password, stored) => { const [salt, value] = String(stored).split(':'); if (!salt || !value) return false; return timingSafeEqual(Buffer.from(value, 'hex'), scryptSync(password, salt, 64)) }
async function ensureAuthTable() { if (pool) await pool.query('CREATE TABLE IF NOT EXISTS axs_users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())') }
async function body(req) { let data=''; for await (const chunk of req) data += chunk; return JSON.parse(data || '{}') }
async function authApi(req, res, url) {
  if (!pool) return json(res, 503, { error: 'Authentication database is not configured.' })
  await ensureAuthTable(); const cookies = cookie(req); const sid = cookies.axs_session
  if (url.pathname === '/api/auth/session') { if (!sid) return json(res, 200, { user: null }); const result = await pool.query('SELECT id,email FROM axs_users WHERE id=$1', [sid]); return json(res, 200, { user: result.rows[0] || null }) }
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
  const data = await body(req); const email = String(data.email || '').trim().toLowerCase(); const password = String(data.password || '')
  if (!email || password.length < 8) return json(res, 400, { error: 'Enter a valid email and a password of at least 8 characters.' })
  if (url.pathname === '/api/auth/register') { const id = randomBytes(18).toString('hex'); try { await pool.query('INSERT INTO axs_users (id,email,password_hash) VALUES ($1,$2,$3)', [id,email,hash(password)]); return json(res, 200, { user: { id,email }, admin: email === 'ezemaebuka43@gmail.com' }, {'set-cookie':`axs_session=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`}) } catch { return json(res, 409, { error: 'Unable to create this account.' }) } }
  if (url.pathname === '/api/auth/login') { const result = await pool.query('SELECT id,email,password_hash FROM axs_users WHERE email=$1', [email]); const user = result.rows[0]; if (!user || !verify(password,user.password_hash)) return json(res, 401, { error: 'Invalid email or password.' }); return json(res, 200, { user: { id:user.id,email:user.email }, admin: email === 'ezemaebuka43@gmail.com' }, {'set-cookie':`axs_session=${user.id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`}) }
  if (url.pathname === '/api/auth/logout') return json(res, 200, {}, {'set-cookie':'axs_session=; Path=/; Max-Age=0'})
  return json(res, 404, { error: 'Not found' })
}
async function ticketmaster(url) { const params = new URLSearchParams(url.searchParams); if (process.env.TICKETMASTER_API_KEY) params.set('apikey', process.env.TICKETMASTER_API_KEY); params.set('size', params.get('size') || '24'); const upstream = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${params}`); return new Response(await upstream.text(), {status:upstream.status, headers:{'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=60'}}) }
const server = createServer(async (req,res) => { const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`); try { if (url.pathname === '/admin' || url.pathname === '/admin/') { const sid = cookie(req).axs_session; if (!sid || !pool) { res.writeHead(302, { location: '/signin' }); return res.end() } const admin = await pool.query('SELECT email FROM axs_users WHERE id=$1', [sid]); if (admin.rows[0]?.email?.toLowerCase() !== 'ezemaebuka43@gmail.com') { res.writeHead(302, { location: '/' }); return res.end() } } if (url.pathname.startsWith('/api/auth/')) return await authApi(req,res,url); if (url.pathname === '/api/events') { const r=await ticketmaster(url); res.writeHead(r.status,Object.fromEntries(r.headers)); return res.end(await r.text()) } if (url.pathname.startsWith('/api/apps/')) return json(res, 200, { data: [], entities: [] }); const requested = url.pathname === '/' ? '/index.html' : url.pathname; const filePath=normalize(join(root,requested)); if (!filePath.startsWith(root)) throw new Error('Invalid path'); res.writeHead(200, {'content-type':mime[extname(filePath)] || 'application/octet-stream'}); res.end(await readFile(filePath)) } catch (error) { console.error('[v0] request error',error); if (res.headersSent) return; res.writeHead(404, {'content-type':'text/plain; charset=utf-8'}); res.end('Not found') } })
server.listen(port, () => console.log(`[v0] AXS server listening on ${port}`))
