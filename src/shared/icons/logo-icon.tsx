import { IconBase, type IconProps } from './icon-base'

/**
 * A marca do Ninho: o "n" minúsculo da Fraunces, a serifa que o app já usa como fonte de display.
 *
 * **Por que uma letra e não um ninho desenhado.** Três rodadas de pictograma foram testadas e as
 * três colidiram com um símbolo mais forte: tigela com um ovo em cima vira uma pessoa; com dois
 * ovos vira um rosto sorridente; o ninho como aro com o ovo dentro vira um olho; visto de cima
 * vira wifi. Não é falta de desenho — é que "curva com pontos" é o vocabulário de rostos, e num
 * glifo monocromático de 24px não há como escapar dele. Uma letra não colide com nada.
 *
 * **Por que o "n" minúsculo e não o "N".** O "n" da Fraunces já é um arco apoiado em duas hastes:
 * a forma de abrigo, sem precisar desenhar abrigo nenhum.
 *
 * **Por que um `path` e não texto.** Um monograma escrito como `<text>` só existe depois que a
 * fonte carrega, e este repositório já passou meses renderizando em `system-ui` porque o nome da
 * família tinha um espaço de diferença (PR #73). Marca que às vezes não aparece não é marca. O
 * contorno abaixo é o glifo real, extraído da própria `@fontsource-variable/fraunces` instanciada
 * em `wght 900, opsz 72, SOFT 0, WONK 0` e encaixado na caixa de 24×24 com margem de 2.6 — não é
 * um desenho parecido, é a mesma curva.
 */
export function LogoIcon(props: IconProps) {
  return (
    <IconBase fill="currentColor" stroke="none" {...props}>
      <path d="M10.02 5.41V17.24Q10.02 17.68 10.11 17.88Q10.2 18.09 10.42 18.17L10.86 18.33Q11.22 18.51 11.22 18.85Q11.22 19.44 10.51 19.44H3.3Q2.94 19.44 2.77 19.29Q2.6 19.14 2.6 18.88Q2.6 18.69 2.7 18.55Q2.8 18.41 3.04 18.32L3.5 18.17Q3.72 18.09 3.81 17.89Q3.9 17.68 3.9 17.24V8.2Q3.9 7.88 3.8 7.74Q3.7 7.6 3.49 7.56L3.03 7.5Q2.8 7.44 2.71 7.32Q2.61 7.19 2.61 7Q2.61 6.77 2.74 6.64Q2.87 6.51 3.2 6.39L7.77 4.91Q8.28 4.73 8.57 4.65Q8.87 4.56 9.16 4.56Q9.58 4.56 9.8 4.8Q10.02 5.04 10.02 5.41ZM9.5 9.07 8.91 8.43 9.44 7.95Q11.37 6.2 12.8 5.4Q14.22 4.59 15.4 4.59Q17.11 4.59 18.08 5.69Q19.05 6.8 19.24 8.79L20.1 17.24Q20.15 17.68 20.22 17.89Q20.28 18.09 20.5 18.17L20.96 18.32Q21.2 18.41 21.3 18.55Q21.4 18.69 21.4 18.88Q21.4 19.14 21.23 19.29Q21.07 19.44 20.7 19.44H13.39Q12.68 19.44 12.68 18.85Q12.68 18.51 13.04 18.33L13.48 18.17Q13.7 18.09 13.81 17.88Q13.92 17.68 13.87 17.24L13.18 9.56Q13.1 8.67 12.78 8.25Q12.46 7.82 11.78 7.82Q11.34 7.82 10.9 8.02Q10.47 8.22 10.07 8.57Z" />
    </IconBase>
  )
}
