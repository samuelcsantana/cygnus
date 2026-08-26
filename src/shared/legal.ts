/**
 * O registro versionado dos documentos legais.
 *
 * Sem dependência nenhuma de propósito: a **versão** é o que o backend precisa
 * guardar junto do aceite, e este módulo é a única fonte dela. Um documento
 * mudou de conteúdo? A versão sobe, e todo mundo que aceitou a anterior precisa
 * aceitar de novo — é isso que torna o consentimento auditável em vez de um
 * booleano sem significado.
 *
 * `effectiveFrom` é a data em que a versão passa a valer, não a data em que o
 * arquivo foi editado. Enquanto `status` for `'draft'`, o texto **não está em
 * vigor** e a tela diz isso ao leitor.
 */

export type LegalDocumentId = 'privacy' | 'terms'

export interface LegalDocument {
  id: LegalDocumentId
  /** Sobe a cada mudança de conteúdo. É o que o aceite referencia. */
  version: string
  effectiveFrom: string
  /**
   * `draft` = redigido como estrutura, sem texto jurídico revisado.
   * Só vira `in-force` depois de revisão humana — **conteúdo jurídico não pode
   * ser gerado automaticamente**, e uma página que finge estar em vigor é pior
   * que uma que admite não estar.
   */
  status: 'draft' | 'in-force'
  path: string
}

export const LEGAL_DOCUMENTS: Record<LegalDocumentId, LegalDocument> = {
  privacy: { id: 'privacy', version: '0.1.0-draft', effectiveFrom: '2026-08-26', status: 'draft', path: '/privacidade' },
  terms: { id: 'terms', version: '0.1.0-draft', effectiveFrom: '2026-08-26', status: 'draft', path: '/termos' },
}

/** As categorias de dado que o app realmente manuseia, derivadas dos schemas. */
export const DATA_CATEGORIES = ['account', 'child', 'health', 'appointments', 'milestones', 'sharing'] as const
export type DataCategory = (typeof DATA_CATEGORIES)[number]
