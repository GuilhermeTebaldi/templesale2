# Aceite de termos do TempleSale

O recurso acrescenta uma etapa após o login Auth0. A área da conta permanece bloqueada até a confirmação. Recusar encerra a sessão sem apagar a conta; os recursos públicos continuam disponíveis. O documento e os comprovantes privados ficam no menu da empresa. O aviso também pode ser lido antes do cadastro.

## Publicação

O recurso vem desativado. Antes de ativá-lo, completar e revisar:

- LEGAL_OPERATOR_NAME: responsáveis pela operação; padrão confirmado: Guilherme Tebaldi e Cristiane Elisabeth Eistalt Tebaldi.
- LEGAL_OPERATOR_ADDRESS: campo opcional, mantido vazio por solicitação dos responsáveis; não é exibido quando ausente.
- LEGAL_OPERATOR_COUNTRY: Itália, conforme informado pelos responsáveis.
- LEGAL_OPERATOR_TAX_ID: identificação fiscal, quando aplicável.
- LEGAL_PRIVACY_RETENTION: prazos ou critérios reais de conservação, incluindo contas, logs, backups e comprovantes.
- LEGAL_PRIVACY_TRANSFER_DETAILS: fornecedores, países reais de tratamento e instrumentos aplicáveis às transferências internacionais.

O contato público é thetemplesale@gmail.com. A omissão do endereço atende à preferência dos responsáveis e não comprova cumprimento de todas as obrigações de identificação aplicáveis.

Os textos livres de conservação e transferência devem conter as informações em português e italiano. Os dados precisam corresponder às configurações e aos contratos reais dos fornecedores. O texto é uma minuta e requer revisão jurídica adequada à operação; não garante conformidade integral do site.

Depois da revisão, configurar LEGAL_TERMS_ENABLED=true no backend e publicar. A ativação exige os campos obrigatórios e cria apenas a tabela legal_acceptances e seu índice no banco já utilizado. As contas existentes também precisam aceitar; não há aceite retroativo presumido.

O inventário técnico, os riscos encontrados e a proposta operacional estão em PRIVACIDADE_OPERACIONAL.md. A exclusão da conta remove seus comprovantes vinculados na nova tabela; eventual preservação excepcional por obrigação legal ou litígio exige procedimento específico, ainda não implementado.

## Identificação e evidência

O backend valida o ID token Auth0 com o client ID existente, compara o subject e o e-mail com a conta e exige email_verified=true. O usuário declara nome completo, empresa representada, maioridade e autorização. O servidor registra data UTC, identificador, subject, e-mail, declarações, versão, idioma, SHA-256 e cópia exata dos termos e do aviso apresentados.

Não há assinatura qualificada, validação documental da empresa ou envio automático de e-mail. A verificação de e-mail depende do Auth0. Se o e-mail ainda não estiver verificado, o usuário deve verificá-lo pelo fluxo do provedor e entrar novamente.

O SHA-256 identifica o conteúdo; não é selo qualificado nem impede alterações por um administrador do banco. Preservar backups e controles de acesso adequados. A retenção informada precisa ser implementada na operação, inclusive nas rotinas de exclusão e nos backups.

Alterar o texto em server/legal-document.ts exige incrementar LEGAL_VERSION. Mudanças no conteúdo ou nos dados do operador também invalidam o aceite atual pelo hash. Os textos anteriores ficam nos comprovantes privados, sem alteração. Aceites repetidos do mesmo documento são idempotentes.

## Verificação

- npm run lint
- npm run build
- node --experimental-sqlite --import tsx --test tests/legal.test.mjs

Também validar no navegador: login sem aceite, documento rolável, campos e declaração, recusa, e-mail não verificado, confirmação, atualização da página, menu com comprovante e mudança de versão. Não usar contas reais para gerar aceites de teste.
