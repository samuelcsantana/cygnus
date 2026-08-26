/**
 * Registra o service worker, e só em produção.
 *
 * Em desenvolvimento um SW ativo intercepta o HMR do Vite e serve módulos
 * velhos — o sintoma é uma edição que "não pega", que é exatamente o que a
 * regra do container (`:4205` é nginx, não Vite) já custou a esta base. Um
 * segundo jeito de produzir o mesmo engano não vale a conveniência.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return
  if (!('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Sem SW o app continua inteiro — perde o modo offline, não a função.
      // Silencioso de propósito: nada aqui é acionável pelo usuário.
    })
  })
}
