import { useTranslation } from 'react-i18next'
import { useRouteError } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { LogoIcon } from '@/shared/icons/logo-icon'

/**
 * Detecta a falha de import dinâmico de um chunk de rota.
 *
 * Os navegadores não concordam na mensagem — Chrome diz "Failed to fetch
 * dynamically imported module", Firefox "error loading dynamically imported
 * module", Safari "Importing a module script failed" — então a checagem é por
 * pedaço de texto, e larga. Um falso positivo aqui só troca a cópia de um erro
 * por outra cópia de erro; um falso negativo devolve a tela genérica, que é o
 * que já existia. Nenhum dos dois piora nada.
 */
function ehChunkFaltando(erro: unknown): boolean {
  const texto = erro instanceof Error ? `${erro.name} ${erro.message}` : String(erro)
  return /dynamically imported module|Importing a module script failed|error loading dynamically/i.test(texto)
}

/**
 * O `errorElement` da raiz do roteador.
 *
 * Existe porque o React Router trata erro de rota **antes** de qualquer error
 * boundary do React: sem `errorElement`, ele renderiza a própria tela de
 * desenvolvimento — "Unexpected Application Error!" e o stack — para o usuário
 * final. O `ErrorBoundary` do `App.tsx` nunca chega a ver esse caso.
 *
 * O cenário que mais importa não é offline, é **deploy**: todas as rotas são
 * `lazy`, este projeto tem autoDeploy na `main`, e um deploy troca o nome dos
 * chunks. Quem estiver com a aba aberta e navegar depois disso pede um arquivo
 * que já não existe. Recarregar é a correção exata — traz o `index.html` novo,
 * que aponta para os chunks novos — e é por isso que o botão diz isso em vez
 * de "tente de novo".
 */
export function RouteErrorRoute() {
  const { t } = useTranslation()
  const erro = useRouteError()
  const online = useOnlineStatus()
  const chunkFaltando = ehChunkFaltando(erro)

  // O mesmo erro do navegador tem duas causas com remédios opostos: um deploy
  // trocou os chunks (recarregar resolve) ou não há rede (recarregar não
  // resolve nada). Sem distinguir, metade das vezes a tela mandaria o usuário
  // fazer algo inútil. o hook useOnlineStatus já existia para o OfflineBanner.
  const chave = chunkFaltando ? (online ? 'staleVersion' : 'offline') : 'boundary'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="bg-primary/10 text-primary mb-2 inline-flex h-16 w-16 items-center justify-center rounded-2xl">
        <LogoIcon className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold text-ink">
        {t(`errors.${chave}.title`)}
      </h1>
      <p className="max-w-md text-ink-muted">
        {t(`errors.${chave}.description`)}
      </p>
      <Button
        onClick={() => window.location.reload()}
        className="mt-2 h-12 w-full max-w-xs text-[15px] font-semibold"
      >
        {t('errors.boundary.reload')}
      </Button>
    </div>
  )
}
