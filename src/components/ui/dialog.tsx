import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

/**
 * Editado à mão, contra a regra de não mexer no que a CLI do shadcn gera, e a
 * razão está medida aqui.
 *
 * O Radix devolve o foco ao **gatilho** quando o diálogo fecha — mas só
 * conhece um gatilho se for um `<DialogTrigger>`. Neste app **oito dos nove
 * diálogos são controlados por estado** (`open={!!baby}`,
 * `open={isAddBabyDialogOpen}`), e não há gatilho para o Radix guardar.
 * Medido fechando cada um com Escape e lendo `document.activeElement` por 3s:
 *
 *   DeleteAccountDialog  (tem <DialogTrigger>)  -> "Excluir minha conta"
 *   AddBabyDialog / EditBabyDialog              -> body
 *   AddMilestoneDialog / AppointmentDetail…     -> body
 *
 * Ficar no `body` faz quem abriu pelo teclado voltar ao começo do documento e
 * tabular tudo de novo — WCAG 2.4.3.
 *
 * **A captura fica aqui, na raiz, e não no `DialogContent`.** Duas tentativas
 * anteriores falharam por isso: o `Content` só monta *depois* de o Radix ter
 * movido o foco para dentro, então guardar `document.activeElement` de lá
 * guarda um elemento do próprio diálogo — e restaurá-lo depois manda o foco
 * para o nada. A raiz fica montada o tempo todo e vê `open` virar.
 *
 * Só restaura se o foco tiver ficado órfão no `body`: se a pessoa moveu o
 * foco nesse meio-tempo, roubá-lo de volta é pior que o defeito.
 */
function Dialog({ open, onOpenChange, ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  const anteriorRef = React.useRef<HTMLElement | null>(null)
  const abertoAntesRef = React.useRef(open)

  React.useEffect(() => {
    if (open && !abertoAntesRef.current) {
      anteriorRef.current = document.activeElement as HTMLElement | null
    }
    if (!open && abertoAntesRef.current) {
      const alvo = anteriorRef.current
      // o Radix limpa o foco de forma assíncrona; esperar um quadro evita
      // restaurar antes e ver o próprio Radix desfazer em seguida
      requestAnimationFrame(() => {
        if (!alvo || !alvo.isConnected) return
        if (document.activeElement && document.activeElement !== document.body) return
        alvo.focus()
      })
    }
    abertoAntesRef.current = open
  }, [open])

  return <DialogPrimitive.Root data-slot="dialog" open={open} onOpenChange={onOpenChange} {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  const { t } = useTranslation()

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close data-slot="dialog-close" asChild>
            <Button
              variant="ghost"
              className="absolute top-2 right-2"
              size="icon-sm"
            >
              <XIcon
              />
              <span className="sr-only">{t('common.close')}</span>
            </Button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  const { t } = useTranslation()

  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">{t('common.close')}</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-heading text-base leading-none font-medium",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
