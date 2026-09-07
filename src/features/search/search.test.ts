import { describe, expect, it } from 'vitest'

import { buildAppointment } from '@/test/fixtures/appointment'
import { buildBaby } from '@/test/fixtures/baby'

import { groupByDomain, matches, normalise, search, type SearchResult } from './search'

const baby = buildBaby({ id: '11111111-1111-4111-8111-111111111111', name: 'Elis' })

function run(query: string, overrides: Partial<Parameters<typeof search>[0]> = {}): SearchResult[] {
  return search({
    query,
    babies: [baby],
    vaccines: [],
    appointments: [],
    medications: [],
    milestones: [],
    specialists: [],
    ...overrides,
  })
}

describe('normalise', () => {
  it('ignora acento e caixa', () => {
    // Quem digita no celular com pressa não segura a tecla do acento, e o dado
    // do catálogo tem acento. Os dois lados passam por aqui.
    expect(normalise('Varicela')).toBe(normalise('varícela'))
    expect(normalise('  SARAMPO ')).toBe('sarampo')
  })
})

describe('matches', () => {
  it('acha no meio do texto, em qualquer um dos campos', () => {
    expect(matches(['Dra. Fernanda Lima', null], 'fernanda')).toBe(true)
    expect(matches([null, 'Odontopediatria'], 'pedia')).toBe(true)
  })

  it('ignora campo que ninguém preencheu', () => {
    expect(matches([null, undefined, ''], 'a')).toBe(false)
  })

  /**
   * Uma letra casa com quase tudo e não responde nada — e a lista piscando a
   * cada tecla de uma palavra sendo digitada é pior do que lista nenhuma.
   */
  it('exige dois caracteres', () => {
    expect(matches(['Elis'], 'e')).toBe(false)
    expect(matches(['Elis'], 'el')).toBe(true)
  })
})

describe('search', () => {
  it('acha a criança pelo nome', () => {
    expect(run('eli').map((result) => result.domain)).toEqual(['babies'])
  })

  it('acha a criança pela alergia, que é o que se procura com pressa', () => {
    const withAllergy = buildBaby({ id: baby.id, name: 'Elis', allergies: ['Amoxicilina'] })

    expect(run('amoxi', { babies: [withAllergy] })).toHaveLength(1)
  })

  it('acha a consulta pelo que foi escrito nela, não só pelo nome do médico', () => {
    const items = [buildAppointment({ id: 'a', notes: 'Encaminhada para fonoaudióloga' })]

    const results = run('fonoaudiologa', { appointments: [{ baby, items }] })

    expect(results).toHaveLength(1)
    expect(results[0]!.domain).toBe('appointments')
    expect(results[0]!.to).toBe('/appointments')
  })

  it('diz de qual criança é cada resultado', () => {
    const items = [buildAppointment({ id: 'a', doctorName: 'Dr. Paulo', specialty: 'Pediatria' })]

    expect(run('paulo', { appointments: [{ baby, items }] })[0]!.subtitle).toBe('Elis · Pediatria')
  })

  it('não devolve nada com menos de dois caracteres', () => {
    expect(run('e')).toEqual([])
    expect(run(' ')).toEqual([])
  })

  it('dá chave única a linhas de features diferentes com o mesmo id', () => {
    // Duas tabelas podem ter a mesma uuid; a chave da lista não pode colidir.
    const shared = '22222222-2222-4222-8222-222222222222'
    const results = search({
      query: 'teste',
      babies: [],
      vaccines: [],
      appointments: [{ baby, items: [buildAppointment({ id: shared, doctorName: 'Teste' })] }],
      medications: [
        {
          baby,
          items: [
            {
              id: shared,
              babyId: baby.id,
              name: 'Teste',
              dosage: null,
              frequency: null,
              reason: null,
              prescriberName: null,
              startedOn: '2026-01-01',
              endedOn: null,
              notes: null,
              createdAt: '2026-01-01T00:00:00.000Z',
            },
          ],
        },
      ],
      milestones: [],
      specialists: [],
    })

    expect(new Set(results.map((result) => result.key)).size).toBe(results.length)
  })
})

describe('groupByDomain', () => {
  it('agrupa na ordem do menu e omite o que não teve resultado', () => {
    const results: SearchResult[] = [
      { key: 'm', domain: 'milestones', title: 'Sentou', subtitle: null, to: '/milestones' },
      { key: 'v', domain: 'vaccines', title: 'BCG', subtitle: null, to: '/vaccines' },
    ]

    expect(groupByDomain(results).map((group) => group.domain)).toEqual(['vaccines', 'milestones'])
  })
})
