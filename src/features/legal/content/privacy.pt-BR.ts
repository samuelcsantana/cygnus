import type { LegalContent } from './types'

/**
 * Privacy policy — DRAFT, pt-BR.
 *
 * **To publish the reviewed version:** replace `sections` below, then in
 * `src/shared/legal.ts` bump `privacy.version`, set `effectiveFrom` to the date
 * it starts binding, and change `status` to `'in-force'`. That is the whole
 * procedure; nothing else reads this file.
 *
 * What is factual here and what is not, because the distinction is the point:
 *
 * - Everything describing **what the software does** — which fields exist, who
 *   can see them, which providers process them — was read off this repository's
 *   Zod schemas and deploy configuration. It is verifiable and needs no lawyer
 *   to be true.
 * - Everything that is a **legal commitment** — retention periods, the
 *   controller's identity, the lawful basis claimed for each operation — is
 *   marked `needsReview` and carries no invented figures. A fabricated
 *   retention period is worse than an absent one: it reads as a promise, and
 *   nobody made it.
 */
export const privacyPtBR: LegalContent = {
  locale: 'pt-BR',
  sections: [
    {
      id: 'o-que-este-documento-e',
      heading: 'O que este documento é',
      body: [
        'Esta política explica quais dados o Meu Neném coleta, por que os coleta, com quem os compartilha e o que você pode exigir a respeito deles. Ela trata de dados de saúde de uma criança, que a Lei Geral de Proteção de Dados classifica como dado pessoal sensível, e por isso descreve cada tratamento em vez de resumi-los.',
        'O texto se aplica ao aplicativo web e à interface de programação que o atende. Não se aplica a serviços de terceiros que você alcance a partir dele, como o calendário oficial do Ministério da Saúde linkado na tela de vacinas.',
      ],
    },
    {
      id: 'controlador',
      heading: 'Quem é o controlador e como falar com ele',
      needsReview: true,
      body: [
        'Esta seção precisa da identificação de quem responde legalmente pelo tratamento — nome ou razão social, inscrição, endereço e um canal de contato que seja efetivamente lido — e da indicação de encarregado, se houver. Nada disso pode ser preenchido por inferência.',
      ],
    },
    {
      id: 'dados-coletados',
      heading: 'Quais dados são coletados',
      body: [
        'Dados de conta: nome, endereço de e-mail e senha. A senha é guardada apenas como hash e nunca é armazenada nem transmitida em texto legível.',
        'Perfil da criança: nome, data de nascimento, sexo, tipo sanguíneo, alergias, foto e cor de avatar.',
        'Saúde: vacinas aplicadas, com data, número de lote, local de aplicação, profissional responsável, foto do comprovante e anotações livres; e os marcos de desenvolvimento registrados, com título, descrição, data e foto.',
        'Consultas: data e hora, profissional, especialidade, local, motivo e anotações.',
        'Compartilhamento: o endereço de e-mail de quem você convida como responsável e a data em que o convite foi aceito.',
        'Dados técnicos gerados pelo uso: endereço de rede e identificação do navegador nas requisições ao servidor, e relatórios de falha quando algo quebra na tela.',
        'O aplicativo não usa cookies de publicidade, não faz rastreamento de terceiros e não vende dados. Os únicos cookies são o de sessão e o de proteção contra falsificação de requisição, ambos necessários para você continuar autenticado.',
      ],
    },
    {
      id: 'base-legal',
      heading: 'Com que base legal cada tratamento acontece',
      needsReview: true,
      body: [
        'A LGPD exige uma base legal declarada por finalidade, e para dado sensível de criança as hipóteses são mais estreitas — em regra, consentimento específico e destacado dado por ao menos um dos pais ou responsável legal, nos termos do artigo 14. A escolha da base para cada finalidade descrita acima é decisão jurídica e precisa de revisão profissional antes de ser afirmada aqui.',
      ],
    },
    {
      id: 'retencao',
      heading: 'Por quanto tempo cada dado é guardado',
      needsReview: true,
      body: [
        'Os prazos de retenção por categoria, e o que acontece com o histórico de saúde quando a conta é excluída, precisam ser definidos e revisados. Um prazo inventado aqui seria uma promessa que ninguém assumiu, e por isso este documento não traz número nenhum enquanto for rascunho.',
        'O que já é verdade sobre o sistema, e não depende de revisão: excluir a conta remove, em cascata, os perfis de criança e todo o histórico de vacinas, consultas, marcos e notificações associado a eles.',
      ],
    },
    {
      id: 'compartilhamento',
      heading: 'Com quem os dados são compartilhados',
      body: [
        'Com quem você convida. Ao convidar alguém como responsável por uma criança, essa pessoa passa a ver e a editar o perfil e todo o histórico daquela criança. O convite é individual, tem prazo de validade e pode ser recusado; a lista de responsáveis fica visível para você, com a data em que cada um aceitou.',
        'Com os provedores de infraestrutura sem os quais o serviço não existe: a aplicação é servida pela Vercel; a interface de programação roda na Render; o banco de dados é hospedado na Neon; os e-mails transacionais, como o convite de responsável e o código de acesso, são enviados pela Resend; e as falhas de execução são relatadas ao Sentry para diagnóstico.',
        'Esses provedores atuam como operadores: tratam os dados para prestar o serviço contratado e não os utilizam para finalidade própria. A localização dos servidores de cada um e as cláusulas de transferência internacional aplicáveis precisam constar da versão revisada.',
        'Fora isso, não há compartilhamento. Nenhum dado é enviado a anunciantes, corretores de dados ou serviços de análise de comportamento.',
      ],
      needsReview: true,
    },
    {
      id: 'seguranca',
      heading: 'Como os dados são protegidos',
      body: [
        'A sessão é mantida por cookies que o código da página não consegue ler, o que limita o efeito de uma eventual injeção de script. As requisições que alteram dados exigem um segundo token conferido pelo servidor, para que outro site não consiga agir em seu nome.',
        'As senhas passam por uma função de derivação lenta antes de serem guardadas, o que torna inviável reconstruí-las a partir do banco.',
        'Toda requisição que toca dados de uma criança verifica, no servidor, se quem pediu é responsável por ela — conhecer o identificador não basta.',
        'Nenhuma dessas medidas elimina risco. Se ocorrer incidente de segurança relevante, a comunicação a você e à Autoridade Nacional de Proteção de Dados segue o que a lei exigir, no prazo que ela fixar.',
      ],
    },
    {
      id: 'direitos',
      heading: 'Quais são os seus direitos e como exercê-los',
      needsReview: true,
      body: [
        'A LGPD garante confirmação da existência de tratamento, acesso aos dados, correção do que estiver incompleto ou desatualizado, anonimização ou eliminação do que for desnecessário, portabilidade, informação sobre com quem os dados foram compartilhados, e revogação do consentimento.',
        'O que já dá para fazer pela própria tela, hoje: corrigir os dados de conta e do perfil da criança, remover um responsável convidado, e excluir a conta inteira com todo o histórico.',
        'O canal para os demais pedidos e o prazo de resposta dependem da seção de contato acima, e serão indicados junto com ela.',
      ],
    },
    {
      id: 'criancas',
      heading: 'Dados de crianças',
      needsReview: true,
      body: [
        'Todo o conteúdo deste aplicativo é, por definição, dado de criança inserido por um adulto responsável. O aplicativo não se destina ao uso pela própria criança e não oferece cadastro para menores.',
        'O tratamento deve ocorrer sempre no melhor interesse da criança, e a versão revisada precisa declarar como o consentimento do responsável é colhido e comprovado.',
      ],
    },
    {
      id: 'mudancas',
      heading: 'Como as mudanças são comunicadas',
      body: [
        'Cada versão deste documento tem número e data de vigência, mostrados no topo desta página. O registro de aceite guarda qual versão você aceitou e quando — aceitar uma versão nova não apaga o aceite da anterior, de modo que o histórico de consentimento é auditável.',
        'Quando o texto mudar de forma relevante, a nova versão é publicada com nova numeração e o aceite é pedido novamente.',
      ],
    },
  ],
}
