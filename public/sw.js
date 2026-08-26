/**
 * Service worker escrito à mão, sem Workbox, e a razão é a lista de exclusões
 * logo abaixo: `embed/` e `mf/` são contratos publicados cujos consumidores
 * vivem em deploys de outras pessoas. Um cache errado ali não é um bug local —
 * é uma versão congelada que o consumidor não tem como invalidar. Preferi 60
 * linhas explícitas a um gerador cujo escopo eu teria de auditar do mesmo
 * jeito.
 *
 * Estratégias, e o porquê de cada uma:
 *
 *   navegação  -> rede primeiro, cache como rede de segurança
 *                 O `index.html` é servido com `no-cache` (vercel.json) porque
 *                 aponta para os assets com hash. Cache-first aqui serviria um
 *                 index velho apontando para assets que já não existem — a
 *                 forma clássica de um PWA se quebrar sozinho.
 *
 *   /assets/   -> cache primeiro
 *                 Seguro *só* porque o nome carrega hash e o Vercel os serve
 *                 `immutable`. Nome novo a cada build, então não há stale.
 *
 *   o resto    -> passa direto, sem tocar
 */

const VERSAO = 'v1'
const CACHE_CASCA = `cygnus-casca-${VERSAO}`
const CACHE_ASSETS = `cygnus-assets-${VERSAO}`

/**
 * O que este service worker **nunca** intercepta.
 *
 * - `/embed/` e `/mf/`: contratos publicados, nomes de arquivo estáveis e sem
 *   hash, `max-age=600` de propósito. Cachear congela a versão para terceiros.
 * - `/api/` e `/uploads/`: dado de saúde de criança, atrás de sessão. Não entra
 *   em Cache Storage, que é legível por qualquer script do mesmo origin e
 *   sobrevive ao logout.
 */
const NUNCA = ['/embed/', '/mf/', '/api/', '/uploads/']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_CASCA).then((cache) => cache.addAll(['/', '/manifest.webmanifest'])).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== CACHE_CASCA && n !== CACHE_ASSETS).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (NUNCA.some((prefixo) => url.pathname.startsWith(prefixo))) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((resposta) => {
          const copia = resposta.clone()
          caches.open(CACHE_CASCA).then((cache) => cache.put('/', copia))
          return resposta
        })
        .catch(() => caches.match('/').then((cacheada) => cacheada ?? Response.error())),
    )
    return
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then(
        (cacheada) =>
          cacheada ??
          fetch(request).then((resposta) => {
            if (resposta.ok) {
              const copia = resposta.clone()
              caches.open(CACHE_ASSETS).then((cache) => cache.put(request, copia))
            }
            return resposta
          }),
      ),
    )
  }
})
