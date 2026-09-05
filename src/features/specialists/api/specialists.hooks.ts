import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'

import { fetchBabyGuardians } from '@/features/babies/api/babies.api'
import { babyGuardiansQueryKey, useBabies } from '@/features/babies/api/babies.hooks'

import { createSpecialist, deleteSpecialist, fetchSpecialists, updateSpecialist } from './specialists.api'
import type { Specialist, SpecialistFormInput } from './specialists.schemas'

export function specialistsQueryKey() {
  return ['specialists'] as const
}

function byName(a: Specialist, b: Specialist) {
  return a.name.localeCompare(b.name)
}

/**
 * Tudo o que esta conta enxerga, numa consulta só.
 *
 * A lista é da conta, não da criança, então não há motivo para uma requisição por filho. Quem
 * precisa de um recorte por criança filtra em memória — ver `useSpecialistsForBaby`.
 */
export function useSpecialists() {
  return useQuery({
    queryKey: specialistsQueryKey(),
    queryFn: fetchSpecialists,
    select: (items: Specialist[]) => [...items].sort(byName),
  })
}

/** O recorte de uma criança, servido do mesmo cache — sem requisição adicional. */
export function useSpecialistsForBaby(babyId: string | null) {
  return useQuery({
    queryKey: specialistsQueryKey(),
    queryFn: fetchSpecialists,
    select: (items: Specialist[]) =>
      [...items].filter((specialist) => !!babyId && specialist.babyIds.includes(babyId)).sort(byName),
  })
}

export interface CoGuardian {
  userId: string
  name: string
  email: string
}

/**
 * As pessoas com quem dá para compartilhar: quem já divide alguma criança com você.
 *
 * É o mesmo conjunto que a API aceita, e é de propósito — uma tela que oferece o que o servidor vai
 * recusar transforma uma regra de segurança em erro de formulário sem explicação.
 */
export function useCoGuardians(currentUserId: string | undefined): CoGuardian[] {
  const babies = useBabies()
  const babyList = babies.data ?? []

  const results = useQueries({
    queries: babyList.map((baby) => ({
      queryKey: babyGuardiansQueryKey(baby.id),
      queryFn: () => fetchBabyGuardians(baby.id),
      enabled: babies.isSuccess,
    })),
  })

  const seen = new Map<string, CoGuardian>()
  for (const result of results) {
    for (const guardian of result.data ?? []) {
      if (guardian.userId !== currentUserId) {
        seen.set(guardian.userId, { userId: guardian.userId, name: guardian.name, email: guardian.email })
      }
    }
  }

  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name))
}

export function useCreateSpecialist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SpecialistFormInput) => createSpecialist(input),
    onSuccess: (specialist) => {
      queryClient.setQueryData<Specialist[]>(specialistsQueryKey(), (prev) =>
        prev ? [...prev, specialist] : [specialist],
      )
    },
  })
}

export function useUpdateSpecialist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ specialistId, input }: { specialistId: string; input: SpecialistFormInput }) =>
      updateSpecialist(specialistId, input),
    onSuccess: (specialist) => {
      queryClient.setQueryData<Specialist[]>(specialistsQueryKey(), (prev) =>
        prev?.map((item) => (item.id === specialist.id ? specialist : item)),
      )
    },
  })
}

export function useDeleteSpecialist() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (specialistId: string) => deleteSpecialist(specialistId),
    onSuccess: (_data, deletedId) => {
      queryClient.setQueryData<Specialist[]>(specialistsQueryKey(), (prev) =>
        prev?.filter((item) => item.id !== deletedId),
      )
      // Remover o profissional anula o `specialistId` das consultas que ele atendeu (a chave
      // estrangeira faz isso), então a lista em cache está desatualizada nesse campo. As consultas
      // em si continuam inteiras — isto é refetch, não conserto.
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.includes('appointments'),
      })
    },
  })
}
