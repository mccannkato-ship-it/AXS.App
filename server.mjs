import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))
const port = Number(process.env.PORT || 5173)

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
}

async function ticketmaster(url) {
  const params = new URLSearchParams(url.searchParams)
  params.set('apikey', process.env.TICKETMASTER_API_KEY || '')
  params.set('size', params.get('size') || '24')
  const upstream = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${params}`)
  const body = await upstream.text()
  return new Response(body, { status: upstream.status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=60' } })
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
  try {
    if (url.pathname === '/api/events') {
      const response = await ticketmaster(url)
      res.writeHead(response.status, Object.fromEntries(response.headers))
      res.end(await response.text())
      return
    }
    const requested = url.pathname === '/' ? '/index.html' : url.pathname
    const filePath = normalize(join(root, requested))
    if (!filePath.startsWith(root)) throw new Error('Invalid path')
    const file = await readFile(filePath)
    res.writeHead(200, { 'content-type': mime[extname(filePath)] || 'application/octet-stream' })
    res.end(file)
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
    res.end('Not found')
  }
})

server.listen(port, () => console.log(`[v0] AXS server listening on ${port}`))
