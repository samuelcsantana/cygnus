import type { LegalContent } from './types'

/** Web legal text approved by the service owner on 2026-09-08. */
export const privacyPtBR: LegalContent = {
  "locale": "pt-BR",
  "sections": [
    {
      "id": "controlador",
      "heading": "Responsável e alcance",
      "body": [
        "Samuel Santana é o responsável pelas decisões de tratamento de dados do Ninho Web, disponível em https://cygnus.samuelsantana.dev. O contato para privacidade, suporte e exercício de direitos é samuel.ssa89@gmail.com.",
        "Esta política abrange o site e o backend que o atende. A versão web armazena registros em servidores; não é um aplicativo exclusivamente local. Este documento não abrange o futuro aplicativo Android nem um futuro serviço pago de nuvem."
      ]
    },
    {
      "id": "dados-coletados",
      "heading": "Dados utilizados",
      "body": [
        "Conta: Nome, e-mail, senha protegida por hash quando utilizada, avatar, preferências de comunicação e data do cadastro.",
        "Login Google: Identificador da conta Google, e-mail e nome recebidos no fluxo de autenticação.",
        "Criança: Nome, nascimento, sexo ao nascer quando informado, tipo sanguíneo, alergias, avatar e medidas de peso/altura com suas datas.",
        "Vacinação: Vacina, dose, data, lote, local, profissional, observações e imagem do comprovante.",
        "Consultas e profissionais: Nome, especialidade, contato quando informado, data/hora, local, motivo, anotações, situação e medidas registradas.",
        "Medicamentos: Nome, dose e frequência informadas, motivo, prescritor, datas e observações.",
        "Marcos e imagens: Título, categoria, descrição, data e foto da conquista ou acontecimento.",
        "Plano de saúde: Nome do plano e identificação do beneficiário quando registrados.",
        "Colaboração: Identificadores dos responsáveis, e-mail do convite, permissões e datas relacionadas ao compartilhamento.",
        "Operação e suporte: Registros de acesso e ações, endereço IP, informações de navegador, falhas/desempenho, notificações, estado de leitura e mensagens enviadas ao contato de suporte.",
        "Documentos legais: Identificador da conta, documento, versão e data do aceite quando a funcionalidade de aceite estiver ativa.",
        "Os dados podem ser fornecidos por você ou por outra pessoa autorizada a acessar a criança. Campos livres e imagens podem conter informações adicionais; inclua somente o necessário para o acompanhamento.",
        "Dados de saúde são sensíveis. Nome de criança não se torna dado de saúde isoladamente, mas sua associação a informações clínicas exige cuidados específicos."
      ]
    },
    {
      "id": "finalidades",
      "heading": "Finalidades",
      "body": [
        "Utilizamos os dados para manter a conta e o acesso; organizar e apresentar o histórico; permitir alterações e compartilhamentos solicitados; exibir referências vacinais e de crescimento; gerar avisos; enviar códigos, convites e lembretes; investigar falhas; proteger o serviço; atender solicitações e cumprir obrigações aplicáveis.",
        "Não há funcionalidades de publicidade comportamental ou venda de dados implementadas no Ninho. O diagnóstico técnico de falhas e desempenho por serviço externo é descrito abaixo e não deve ser confundido com ausência de qualquer transmissão a terceiros."
      ]
    },
    {
      "id": "base-legal",
      "heading": "Bases legais e dados de crianças",
      "body": [
        "Os dados comuns de conta são utilizados para executar o serviço solicitado. Obrigações legais e exercício regular de direitos podem fundamentar operações específicas, conforme sua finalidade. Dados de saúde exigem hipótese própria do artigo 11 da LGPD; legítimo interesse não é uma justificativa genérica para seu tratamento.",
        "O tratamento de dados infantis deve observar o melhor interesse da criança. O cadastro é destinado a adultos responsáveis ou autorizados; isso não significa que exista hoje um mecanismo completo de verificação da maioridade ou da representação legal.",
        "Se o tratamento depender de consentimento, será necessário definir sua coleta específica, a comprovação pertinente e a forma de revogação. O aceite dos Termos de Uso e a leitura desta política não equivalem, por si, a autorização para todas as finalidades. A declaração de responsabilidade pelo cadastro também não substitui as medidas exigíveis de verificação.",
        "A definição e a observância da base legal de cada operação são responsabilidade do serviço. O canal de contato recebe questionamentos sobre tratamentos realizados e uso indevido dos dados de uma criança."
      ]
    },
    {
      "id": "autenticacao",
      "heading": "Autenticação, navegador e armazenamento local",
      "body": [
        "No acesso com senha, o servidor utiliza a senha para autenticação e mantém um hash, não uma cópia recuperável da senha. Códigos por e-mail permitem fluxos assistidos de acesso, recuperação e confirmação de exclusão.",
        "O login Google é opcional. O Ninho não recebe a senha da sua conta Google e não solicita acesso a mensagens do Gmail, arquivos do Drive ou agenda nesse fluxo. A autenticação relaciona a identidade Google à conta Ninho conforme as verificações do serviço. O Google também trata dados necessários ao seu próprio serviço, segundo suas condições.",
        "O navegador utiliza cookies de sessão, proteção contra requisições indevidas e transação temporária do login Google. Preferências como tema, idioma e identificação da criança selecionada podem ficar no armazenamento do navegador.",
        "Quando instalado como PWA, o Ninho pode guardar arquivos da interface para carregamento. Seu service worker não mantém o histórico autenticado da API e os uploads nesse cache persistente. Isso não impede cópias feitas por download, recursos do navegador ou ações do próprio usuário. Limpar os dados do navegador não apaga os registros armazenados nos servidores."
      ]
    },
    {
      "id": "compartilhamento",
      "heading": "Compartilhamento e destinatários",
      "body": [
        "Pessoas autorizadas: responsáveis convidados recebem acesso aos registros das crianças compartilhadas conforme suas permissões. Remover o acesso interrompe o uso autorizado futuro do sistema, mas não recupera cópias já obtidas fora dele.",
        "Serviços técnicos utilizados:",
        "Vercel: Disponibilização do frontend e encaminhamento das requisições ao backend.",
        "Render: Execução da API e infraestrutura de filas/cache.",
        "Neon: Hospedagem do banco de dados.",
        "Resend: Envio de códigos, convites e e-mails transacionais, incluindo lembretes.",
        "Sentry: Relatórios de erros e métricas de desempenho quando habilitado.",
        "Google: Autenticação opcional e processamento de mensagens dirigidas ao contato Gmail de suporte.",
        "Cada serviço recebe dados conforme a operação realizada; não significa que todos recebam o banco completo. E-mails de lembrete podem conter nome da criança, vacina ou dados da consulta. Informações técnicas e mensagens de erro podem incluir metadados de acesso; sua configuração e minimização precisam ser verificadas continuamente.",
        "Imagens de avatar ou outros links externos informados nos registros podem fazer o navegador se conectar ao respectivo provedor. Não presumimos controle sobre o tratamento realizado por sites externos.",
        "A classificação de cada provedor como operador ou controlador independente depende da atividade e dos contratos pertinentes. Esta política não afirma que todos atuam exclusivamente em nome de Samuel ou nunca utilizam dados para finalidades próprias.",
        "Dados também poderão ser fornecidos quando houver obrigação legal ou determinação válida de autoridade, limitados ao escopo aplicável. Novas finalidades de compartilhamento exigem avaliação e informação adequadas."
      ]
    },
    {
      "id": "transferencias",
      "heading": "Onde os dados são tratados",
      "body": [
        "Os serviços utilizados podem tratar dados fora do Brasil. A configuração verificada da API e do banco utiliza infraestrutura em Ohio, Estados Unidos; outros provedores podem utilizar regiões e subprocessadores próprios.",
        "Informações sobre os fornecedores, locais de tratamento e salvaguardas de transferência podem ser solicitadas pelo contato de privacidade. A contratação de infraestrutura estrangeira não afasta as exigências legais de transferência internacional. Esta política não declara que todos os contratos e mecanismos dos provedores tenham sido auditados."
      ]
    },
    {
      "id": "seguranca",
      "heading": "Segurança e limitação atual das imagens",
      "body": [
        "O Ninho utiliza conexão HTTPS em produção, senhas protegidas por hash, cookies de sessão HttpOnly, proteção contra requisições indevidas e verificação de acesso para os registros autenticados. Essas medidas reduzem riscos, mas não garantem segurança absoluta.",
        "As imagens enviadas têm uma limitação importante: seus endereços atualmente permitem leitura sem autenticação. Quem obtiver uma URL pode abrir a imagem, mesmo sem ser responsável autorizado na conta. Um endereço difícil de adivinhar não equivale a controle de acesso. Esta política não considera o envio uma autorização para exposição pública.",
        "O armazenamento atual de uploads também não oferece a durabilidade necessária para ser a única cópia dos documentos: os arquivos ficam no sistema de arquivos da API, sujeito a perda com reinicializações e mudanças da infraestrutura. Guarde os originais. O contato informado recebe pedidos relativos à exposição ou remoção de imagens.",
        "Essas limitações devem ser corrigidas tecnicamente; descrevê-las não elimina as obrigações de proteção. Incidentes serão avaliados e comunicados aos titulares e à ANPD quando exigido pelas regras aplicáveis."
      ]
    },
    {
      "id": "retencao",
      "heading": "Retenção e exclusão",
      "body": [
        "Os registros de acompanhamento permanecem associados à conta e aos perfis enquanto não forem removidos pelas funções disponíveis. A implementação atual não estabelece uma expiração automática geral por inatividade.",
        "Ao excluir a conta que criou uma criança, o banco remove em cascata seus perfis e registros relacionados. Isso também afeta o acesso dos demais responsáveis às crianças pertencentes à conta excluída. Não há transferência automática de propriedade.",
        "A remoção relacional não abrange automaticamente todos os arquivos enviados. Registros de auditoria, logs técnicos, cópias de segurança dos provedores, mensagens já entregues e arquivos exportados têm ciclos distintos; não é possível prometer eliminação integral imediata com a implementação atual.",
        "Não há atualmente uma tabela única de prazos de descarte implementada para todas essas categorias. A duração e eventual conservação devem ser avaliadas conforme a finalidade, necessidade e obrigação aplicável. Solicitações de exclusão e esclarecimento sobre arquivos, auditoria, suporte, logs e backups devem ser encaminhadas ao contato de privacidade. Esta política não autoriza retenção indefinida ou desnecessária."
      ]
    },
    {
      "id": "direitos",
      "heading": "Seus direitos e como solicitar",
      "body": [
        "Você pode solicitar confirmação e acesso, correção, informação sobre compartilhamentos, eliminação ou outras medidas sobre dados desnecessários, portabilidade nos termos aplicáveis e revogação de consentimento quando utilizado. O exercício considera a representação da criança e os direitos de outras pessoas.",
        "Envie o pedido a samuel.ssa89@gmail.com, indicando o e-mail da conta e o que deseja solicitar. Não envie senhas, códigos de acesso ou documentos médicos completos no primeiro contato. Poderão ser solicitadas informações proporcionais para verificar identidade e representação, sem coleta excessiva.",
        "Há recursos de edição e exclusão no serviço. A exportação técnica atual inclui parte dos registros, mas não todos os domínios e arquivos; não é apresentada aqui como backup completo. Para dados não contemplados nas opções disponíveis, utilize o contato informado.",
        "Os pedidos serão tratados conforme os requisitos e prazos legais aplicáveis ao caso. Quando houver impedimento ou conservação obrigatória, a resposta deverá explicar o fundamento e o alcance. Isso não constitui promessa de eliminação de cópias mantidas independentemente por outros responsáveis ou destinatários."
      ]
    },
    {
      "id": "comunicacoes",
      "heading": "Comunicações e preferências",
      "body": [
        "Códigos de acesso, recuperação e confirmações atendem a ações ou necessidades da conta. Lembretes de acompanhamento utilizam as preferências de comunicação disponíveis; o suporte pode receber pedidos relacionados a essas preferências.",
        "A central interna e os e-mails não têm hoje a mesma distribuição: a central é vinculada ao proprietário da criança, enquanto e-mails podem ser enviados a outros responsáveis conforme sua preferência. Alertas podem falhar ou atrasar e não substituem o acompanhamento independente das datas."
      ]
    },
    {
      "id": "mudancas",
      "heading": "Atualizações e contato",
      "body": [
        "A versão e a data de vigência são exibidas nesta página. Alterações relevantes serão informadas, e novas manifestações serão solicitadas quando pertinentes. O simples prosseguimento de uso não será considerado consentimento genérico para uma nova finalidade.",
        "Responsável e contato de privacidade: Samuel Santana — samuel.ssa89@gmail.com."
      ]
    }
  ]
}
