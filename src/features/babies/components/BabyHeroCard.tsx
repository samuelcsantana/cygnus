import { useTranslation } from 'react-i18next'

import type { Baby } from '@/features/babies/api/babies.schemas'
import { ageInMonths } from '@/lib/date'
import { cn } from '@/lib/utils'
import { AlertCircleIcon } from '@/shared/icons/alert-circle-icon'
import { PencilIcon } from '@/shared/icons/pencil-icon'
import { babyAvatarAppearance, babyInitials } from '@/shared/utils/babyAvatarColor'

export interface BabyHeroCardProps {
  baby: Baby
  delayedVaccineCount: number
  /**
   * Falso enquanto o calendário da criança não carregou — carregando ou erro.
   *
   * Sem isto o cartão lê `delayedVaccineCount === 0` e anuncia "Vacinas em
   * dia", que é o valor que uma lista vazia produz **também quando a
   * requisição falhou**. Num app cuja razão de existir é acompanhar o
   * calendário do PNI, afirmar que a criança está protegida sem ter olhado é a
   * pior falha possível: a pessoa não vê erro nenhum e conclui que não há nada
   * a fazer.
   */
  vaccineStatusKnown: boolean
  onEdit: (baby: Baby) => void
}

/**
 * A criança, em tamanho de manchete, no topo do painel — um cartão por filho.
 *
 * Substituiu a `FamilyStrip`, que era a mesma informação em chip compacto, e a
 * troca não foi só de escala: **`bloodType` e `allergies` eram coletados no
 * cadastro e não apareciam em lugar nenhum depois.** A pessoa digitava a
 * alergia da criança e o app nunca mais a mostrava. Num app de saúde infantil
 * esse é o dado que alguém precisa achar rápido, e ele estava só de ida.
 *
 * Por isso o cartão afirma os dois lados: com alergia registrada, diz qual;
 * sem nenhuma, diz que não há **registro** — e não que não há alergia. É a
 * mesma distinção que `vaccineStatusKnown` faz para as vacinas, pela mesma
 * razão: silêncio aqui seria lido como "está tudo certo".
 *
 * O contraste deste cartão **não é coberto por nenhum portão**: o axe lê o
 * ancestral opaco mais próximo e não avalia texto sobre gradiente. Toda cor
 * abaixo foi medida sobre a **parada mais clara** do gradiente (emerald-700,
 * o pior caso), e as razões estão anotadas onde a cor é usada. Se o gradiente,
 * as paradas ou as cores de texto mudarem, re-medir — o que reprovou na
 * primeira tentativa foi justamente o instinto de usar branco translúcido:
 * `text-white/70` dá 3.54:1 e `/80` dá 4.11:1 sobre emerald-700, os dois
 * abaixo do piso. Nada aqui usa alfa em texto por causa disso.
 *
 * Pelo mesmo motivo o gradiente para em emerald-700 e não em emerald-600: com
 * a parada clara em 600, **nem branco puro passa** (3.77:1).
 */
export function BabyHeroCard({ baby, delayedVaccineCount, vaccineStatusKnown, onEdit }: BabyHeroCardProps) {
  const { t } = useTranslation()
  const avatarAppearance = babyAvatarAppearance(baby.id, baby.avatarColor)

  return (
    // O cartão pinta o próprio fundo, então é escuro nos dois temas e as cores
    // abaixo são fixas de propósito — sem variante `dark:`. É o mesmo padrão do
    // painel de marca do AuthLayout, e o que evita a armadilha registrada no
    // CLAUDE.md: um tint que flipa com o tema enquanto o texto sobre ele não
    // flipa (ou o contrário) vira branco-no-branco em metade dos casos.
    <article className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 to-emerald-700 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      {/* `flex-wrap` com um piso de largura no bloco de texto, em vez de dois
          layouts trocados por breakpoint.

          A 360px o grupo à direita (chip + editar) roubava ~140px e sobrava
          pouco para o conteúdo: "Tipo A+" quebrava em duas linhas e a lista de
          alergias em três. Com o piso de 10rem, o grupo não cabe na mesma linha
          nesse tamanho e cai inteiro para baixo, alinhado à direita pelo
          `ml-auto` — o texto recupera a largura toda.

          Duplicar o grupo em dois blocos com `sm:hidden` seria o caminho
          óbvio e está errado por dois motivos: dois lugares para manter, e o
          mesmo texto passaria a existir duas vezes no DOM, o que quebra
          `getByText` por ambiguidade e engana leitor de tela. */}
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
        {baby.avatarUrl ? (
          <img
            src={baby.avatarUrl}
            alt=""
            className={cn(
              'h-14 w-14 flex-shrink-0 rounded-2xl bg-emerald-50 object-cover',
              baby.avatarColor ? 'border-2' : 'ring-2 ring-white/25',
            )}
            style={baby.avatarColor ? { borderColor: baby.avatarColor } : undefined}
          />
        ) : (
          <span
            className={cn(
              'font-display flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl text-lg font-black',
              avatarAppearance.className,
            )}
            style={avatarAppearance.style}
          >
            {babyInitials(baby.name)}
          </span>
        )}

        <div className="min-w-[10rem] flex-1">
          {/* Branco puro: 5.48:1 sobre emerald-700. */}
          <h3 className="font-display truncate text-lg font-extrabold text-white">{baby.name}</h3>

          {/* emerald-50: 5.21:1 sobre emerald-700. O tipo sanguíneo vai em mono
              porque é código, não prosa — mesma regra de `--font-mono`. A idade
              fica proporcional: "2 meses" é frase. */}
          <p className="mt-0.5 text-[13px] text-emerald-50">
            {t('babies.monthsOld', { count: ageInMonths(baby.birthDate) })}
            {baby.bloodType && (
              <>
                {' · '}
                <span className="font-mono">{t('babies.hero.bloodType', { value: baby.bloodType })}</span>
              </>
            )}
          </p>

          {/* amber-50: 5.01:1 sobre emerald-700. Âmbar e não vermelho de
              propósito — alergia registrada é uma condição a ter em conta, não
              um erro a corrigir, e o vermelho deste app já significa "vacina
              atrasada", que é uma pendência com ação. */}
          {baby.allergies.length > 0 ? (
            <p className="mt-1.5 flex items-start gap-1.5 text-[13px] font-semibold text-amber-50">
              <AlertCircleIcon aria-hidden className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              <span className="min-w-0">
                {t('babies.hero.allergies', {
                  count: baby.allergies.length,
                  list: baby.allergies.join(', '),
                })}
              </span>
            </p>
          ) : (
            <p className="mt-1.5 text-[13px] text-emerald-50">{t('babies.hero.noAllergiesRecorded')}</p>
          )}
        </div>

        <div className="ml-auto flex flex-shrink-0 items-center gap-1">
          {/* Chips claros com texto escuro, e não texto claro solto sobre o
              gradiente: assim o texto é medido contra o próprio chip, que é
              opaco, em vez de contra um fundo que varia ao longo do cartão.
              Medidos: rose-700 sobre rose-50 5.67:1, emerald-700 sobre
              emerald-50 5.21:1, ink sobre slate-100 14.41:1. Como preenchimento
              sobre a parada clara do gradiente os três ficam entre 4.95 e 5.21,
              bem acima do piso de 3:1 de elemento gráfico.

              A ordem importa: "não sei" vem antes de qualquer afirmação. Um
              atraso conhecido ainda é reportado, porque essa informação é
              sempre verdadeira quando existe. */}
          {!vaccineStatusKnown ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-ink">
              {t('babies.dashboard.vaccineStatusUnknown')}
            </span>
          ) : delayedVaccineCount > 0 ? (
            <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700">
              {t('babies.dashboard.vaccineStatusDelayed', { count: delayedVaccineCount })}
            </span>
          ) : (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
              {t('babies.dashboard.vaccineStatusUpToDate')}
            </span>
          )}

          {/* 44x44 de verdade, e não os 28x28 com um pseudo-elemento
              `-inset-2.5` por cima que a FamilyStrip usa. Os dois entregam a
              mesma área clicável, mas o `audit-surface.mjs` mede
              `getBoundingClientRect` do botão e só enxerga o primeiro — a strip
              aparece na auditoria como três avisos de alvo pequeno que não são
              verdade. Aqui o cartão tem espaço de sobra para o tamanho real,
              então não há motivo para pagar o aviso.

              Em opacidade cheia, ao contrário da strip: lá o ícone esmaecido
              convivia com um cartão claro e denso; sobre este fundo escuro,
              esmaecer emerald-50 derruba o contraste do único controle do
              cartão. */}
          <button
            type="button"
            onClick={() => onEdit(baby)}
            aria-label={t('babies.edit.action', { name: baby.name })}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-emerald-50 transition-colors hover:bg-white/15"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  )
}
