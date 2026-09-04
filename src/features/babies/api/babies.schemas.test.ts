import { describe, expect, it } from 'vitest'

import { babyFormSchema } from './babies.schemas'

describe('babyFormSchema', () => {
  it('rejects a birth date in the future', () => {
    const tomorrow = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().slice(0, 10)

    const result = babyFormSchema.safeParse({
      name: 'Miguel',
      birthDate: tomorrow,
      gender: 'MALE',
    })

    expect(result.success).toBe(false)
  })

  it('accepts a valid past birth date with only the required fields', () => {
    const result = babyFormSchema.safeParse({
      name: 'Miguel',
      birthDate: '2024-01-01',
      gender: 'MALE',
    })

    expect(result.success).toBe(true)
  })

  /**
   * O sexo ao nascer deixou de ser obrigatório, e este teste é o que impede a obrigatoriedade de
   * voltar sem querer: o campo não é lido por nada no app, e exigir dado sensível de uma criança
   * sem uso é coleta que não se justifica.
   */
  it('aceita um cadastro sem sexo ao nascer', () => {
    const result = babyFormSchema.safeParse({
      name: 'Miguel',
      birthDate: '2024-01-01',
    })

    expect(result.success).toBe(true)
  })
})
