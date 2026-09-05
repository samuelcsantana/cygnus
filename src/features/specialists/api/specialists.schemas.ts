import { z } from 'zod'

export const specialistSchema = z.object({
  id: z.string().uuid(),
  /** Quem criou. Só essa pessoa edita ou remove — enxergar não é possuir. */
  userId: z.string().uuid(),
  name: z.string(),
  specialty: z.string().nullable(),
  phone: z.string().nullable(),
  /** As crianças que este profissional atende. Vazio é resposta válida: agenda pessoal. */
  babyIds: z.array(z.string().uuid()),
  /** Responsáveis que também enxergam esta entrada, indicados por quem criou. */
  sharedWithUserIds: z.array(z.string().uuid()),
  createdAt: z.string(),
})
export type Specialist = z.infer<typeof specialistSchema>

export const specialistListSchema = z.array(specialistSchema)

export const specialistFormSchema = z.object({
  name: z.string().min(1),
  specialty: z.string().optional(),
  // Sem checagem de formato, igual à API. Um número pode ser fixo, celular, ramal de clínica ou vir
  // com código do país — e é o campo que precisa funcionar às 3h.
  phone: z.string().optional(),
  babyIds: z.array(z.string().uuid()),
  sharedWithUserIds: z.array(z.string().uuid()),
})
export type SpecialistFormInput = z.infer<typeof specialistFormSchema>

/**
 * Uma entrada sem criança e sem compartilhamento só existe para quem a criou.
 *
 * A tela precisa dizer isso, porque é a diferença entre "guardei o telefone do pediatra" e "guardei
 * o telefone do pediatra e o outro responsável também vê" — e ninguém adivinha qual das duas
 * aconteceu olhando uma lista.
 */
export function isPrivateEntry(specialist: Specialist): boolean {
  return specialist.babyIds.length === 0 && specialist.sharedWithUserIds.length === 0
}
