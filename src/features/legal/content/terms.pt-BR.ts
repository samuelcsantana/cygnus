import type { LegalContent } from './types'

/**
 * Terms of use — DRAFT, pt-BR.
 *
 * **To publish the reviewed version:** replace `sections` below, then in
 * `src/shared/legal.ts` bump `terms.version`, set `effectiveFrom`, and change
 * `status` to `'in-force'`. See `privacy.pt-BR.ts` for the same note and for
 * why the factual and the legal halves are marked apart.
 */
export const termsPtBR: LegalContent = {
  locale: 'pt-BR',
  sections: [
    {
      id: 'o-que-o-servico-e',
      heading: 'O que o serviço é, e o que ele não é',
      body: [
        'O Ninho é uma ferramenta de acompanhamento: guarda o que você registra sobre a saúde de uma criança — vacinas aplicadas, consultas, marcos de desenvolvimento — e mostra o calendário nacional de imunização como referência.',
        'Ele não é um serviço de saúde. Não emite diagnóstico, não prescreve, não substitui a caderneta oficial de vacinação nem a avaliação de um profissional ou de uma unidade de saúde. O calendário exibido é material informativo de referência pública, e o aplicativo pode estar desatualizado em relação à fonte oficial.',
        'Decisões sobre a saúde da criança são suas e do profissional que a acompanha. Nenhum aviso, lembrete ou ausência de aviso dentro do aplicativo deve ser lido como orientação clínica.',
      ],
    },
    {
      id: 'quem-pode-usar',
      heading: 'Quem pode usar',
      body: [
        'O cadastro é para adultos que sejam pais ou responsáveis legais pela criança cujos dados serão registrados, ou para quem eles convidarem expressamente como responsável.',
        'Ao registrar dados de uma criança, você declara ter autoridade para fazê-lo. Ao convidar outra pessoa como responsável, você está dando a ela acesso de leitura e edição a todo o histórico daquela criança — inclusive ao que foi registrado antes do convite.',
      ],
      needsReview: true,
    },
    {
      id: 'sua-conta',
      heading: 'Sua conta',
      body: [
        'Você é responsável por manter a confidencialidade das suas credenciais e por tudo que for feito a partir da sua conta. Se suspeitar de acesso indevido, troque a senha e remova os responsáveis que não reconhecer.',
        'Você pode excluir a conta a qualquer momento pela tela de perfil. A exclusão remove, em cascata, os perfis de criança e o histórico associado a eles.',
      ],
    },
    {
      id: 'seu-conteudo',
      heading: 'O conteúdo que você registra',
      body: [
        'O que você escreve e envia continua sendo seu. O serviço recebe apenas a autorização necessária para armazenar, exibir e transmitir esse conteúdo a você e às pessoas que você convidar — nada além disso, e nenhuma finalidade publicitária.',
        'Você se compromete a não usar o serviço para registrar dados de terceiros sem autoridade para tanto, nem para conteúdo ilícito.',
      ],
      needsReview: true,
    },
    {
      id: 'disponibilidade',
      heading: 'Disponibilidade e mudanças no serviço',
      body: [
        'O serviço é oferecido no estado em que se encontra, sem garantia de disponibilidade ininterrupta. A infraestrutura pode ficar indisponível por manutenção, falha de provedor ou limite de plano.',
        'Funcionalidades podem mudar ou ser descontinuadas. Mudanças que afetem dados já registrados serão comunicadas antes de valer.',
        'A extensão da limitação de responsabilidade aplicável, e a forma de comunicação prévia, precisam de revisão jurídica — inclusive porque o Código de Defesa do Consumidor limita o que pode ser afastado.',
      ],
      needsReview: true,
    },
    {
      id: 'gratuidade',
      heading: 'Preço',
      body: [
        'O serviço é gratuito hoje e não há cobrança, assinatura ou compra dentro do aplicativo. Se isso mudar, os termos serão atualizados e o aceite pedido de novo antes de qualquer cobrança.',
      ],
      needsReview: true,
    },
    {
      id: 'encerramento',
      heading: 'Encerramento',
      body: [
        'Você pode encerrar o uso a qualquer momento excluindo a conta. As hipóteses em que o serviço pode encerrar uma conta, e o aviso devido nesse caso, precisam ser definidas na versão revisada.',
      ],
      needsReview: true,
    },
    {
      id: 'lei-e-foro',
      heading: 'Lei aplicável e foro',
      needsReview: true,
      body: [
        'A lei aplicável e o foro competente precisam ser declarados por quem responde pelo serviço, e dependem da identificação do controlador na política de privacidade.',
      ],
    },
    {
      id: 'mudancas-nos-termos',
      heading: 'Mudanças nestes termos',
      body: [
        'Cada versão tem número e data de vigência, mostrados no topo desta página. Quando o texto mudar de forma relevante, a nova versão é publicada com nova numeração e o aceite é pedido novamente — e o aceite anterior permanece registrado, com a versão e a data em que foi dado.',
      ],
    },
  ],
}
