import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'

// Isolated origin for real network-loss testing. Stopping it cannot affect other tests.
export async function startStaticServer(basePath: string) {
  const root = resolve('dist')
  const mime: Record<string, string> = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.webmanifest': 'application/manifest+json',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
  }
  const server = createServer(async (request, response) => {
    const pathname = new URL(request.url || '/', 'http://localhost').pathname
    if (!pathname.startsWith(basePath)) {
      response.writeHead(404).end()
      return
    }
    const path = resolve(root, pathname.slice(basePath.length) || 'index.html')
    if (!path.startsWith(`${root}${sep}`)) {
      response.writeHead(404).end()
      return
    }
    try {
      const body = await readFile(path)
      response.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream' })
      response.end(body)
    } catch {
      response.writeHead(404).end()
    }
  })
  await new Promise<void>((accept) => server.listen(0, '127.0.0.1', accept))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Cannot start test origin')
  let stopped = false
  return {
    url: `http://127.0.0.1:${address.port}${basePath}`,
    stop: async () => {
      if (stopped) return
      stopped = true
      server.closeAllConnections()
      await new Promise<void>((accept, reject) =>
        server.close((error) => (error ? reject(error) : accept())),
      )
    },
  }
}
