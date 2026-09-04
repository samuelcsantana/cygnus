import { describe, expect, it } from 'vitest'

import {
  centimetersInputToMillimeters,
  formatCentimeters,
  formatKilograms,
  gramsToKilogramsInput,
  kilogramsInputToGrams,
} from './measurements'

/**
 * A conversão existe porque a API guarda inteiros — grama e milímetro — e as pessoas leem quilo e
 * centímetro. O que estes testes travam é o custo dessa escolha: se a conversão errar, o número
 * que o app mostra não é o que a balança disse.
 */
describe('measurements', () => {
  /**
   * A vírgula é o separador decimal de quem digita em português, e é por isso que o campo é
   * `type="text"`: um `type="number"` descarta o valor inteiro ao ver uma vírgula, sem erro.
   * Aceitar as duas formas é o que faz o campo não perder o peso da criança em silêncio.
   */
  it('aceita vírgula e ponto como separador decimal', () => {
    expect(kilogramsInputToGrams('15,8')).toBe(15800)
    expect(kilogramsInputToGrams('15.8')).toBe(15800)
    expect(centimetersInputToMillimeters('100,5')).toBe(1005)
  })

  it('trata campo vazio como ausência, não como zero', () => {
    expect(kilogramsInputToGrams('')).toBeNull()
    expect(kilogramsInputToGrams('   ')).toBeNull()
    expect(kilogramsInputToGrams(undefined)).toBeNull()
    expect(centimetersInputToMillimeters('')).toBeNull()
  })

  it('devolve null para texto que não é número', () => {
    expect(kilogramsInputToGrams('abc')).toBeNull()
    expect(centimetersInputToMillimeters('1,2,3')).toBeNull()
  })

  /**
   * O motivo de a API guardar inteiro: 15,8 × 1000 em ponto flutuante dá 15800.000000000002, e o
   * arredondamento aqui é o que impede esse resto de chegar ao banco e, de lá, a uma curva.
   */
  it('arredonda para a unidade inteira que a API guarda', () => {
    expect(kilogramsInputToGrams('15,8')).toBe(15800)
    expect(kilogramsInputToGrams('3,2456')).toBe(3246)
    expect(centimetersInputToMillimeters('100,04')).toBe(1000)
  })

  it('volta para o campo com ponto, e para a tela no formato do idioma', () => {
    expect(gramsToKilogramsInput(15800)).toBe('15.8')
    expect(gramsToKilogramsInput(null)).toBe('')
    expect(formatKilograms(15800, 'pt-BR')).toBe('15,8 kg')
    expect(formatKilograms(15800, 'en')).toBe('15.8 kg')
    expect(formatCentimeters(1000, 'pt-BR')).toBe('100 cm')
  })
})
