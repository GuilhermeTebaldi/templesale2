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

O inventário técnico, os riscos encontrados e a proposta operacional estão em PRIVACIDADE_OPERACIONAL.md. A operação administrativa agora é desativação: mantém a conta e seus comprovantes e oculta empresa e conteúdo dos resultados e acessos públicos. A recuperação ocorre somente com a mesma identidade Auth0 e e-mail verificado, sem eliminar banimentos. A exclusão definitiva dos registros no TempleSale é uma ação separada, com confirmação explícita de e-mail e validação da identidade; eventual preservação excepcional por obrigação legal ou litígio exige procedimento específico, ainda não implementado.

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

## Desativação e recuperação

A tabela account_archives é aditiva e criada no bootstrap normal, independentemente de o aceite estar ativado. Nenhuma coluna ou dado existente é removido. Em desenvolvimento remoto somente leitura, não se cria tabela e a desativação permanece indisponível se ela não existir. A operação antiga DELETE /api/admin/users/:id passa a desativar: registra estados originais das empresas, desativa-as e revoga sessões em uma transação. Cadastro, fotos, publicações, interações e recibos são mantidos. A interface administrativa chama essa ação de Desativar empresa. Contas já apagadas antes da mudança não são recuperáveis por este recurso.

O retorno exige o mesmo subject Auth0 com e-mail verificado; troca de subject não recupera por simples coincidência de e-mail. Estados previamente inativos permanecem inativos. Banimentos existentes continuam impedindo login. O aceite já realizado permanece no histórico; documento alterado exige novo aceite quando o recurso estiver ativo. Não há botão ou rota para transformar aceite passado em recusa.

A conservação de contas desativadas precisa de prazo ou critérios operacionais definidos; não é autorização para guardar dados para sempre. Os arquivos de imagem já conhecidos por uma URL externa não são revogados automaticamente pela ocultação do perfil.

## Duas opções de encerramento

O menu da empresa oferece Desativar e preservar e Excluir definitivamente do TempleSale, com digitação do e-mail e confirmação final. O backend exige sessão, ID token Auth0 verificado, subject correspondente, email_verified=true e e-mail da própria conta. A operação administrativa continua autenticada e apresenta as duas opções; exclusão definitiva exige confirmação do e-mail da conta.

POST /api/account/close aceita mode=deactivate ou mode=delete e confirmation com o e-mail da conta. DELETE /api/admin/users/:id mantém desativação como padrão; mode=delete e confirmation no corpo escolhem exclusão definitiva. A exclusão permanente remove, em transação, registros pessoais, empresas, publicações, produtos, sessões, interações e comprovantes vinculados no banco local. Um novo login inicia novo cadastro sem o arquivo anterior.

Não há exclusão automática via Management API do Auth0 nem remoção física de objetos no Cloudinary ou de backups nesta mudança. A interface informa esse limite; solicitações de apagamento abrangente precisam também do procedimento nos fornecedores. Nenhum teste executa exclusão em contas reais.
