# Descoberta local integrada

A entrada abre diretamente o feed de fotos original. Não existem abas “Perto de você”/“Novidades” nem uma página adicional de descoberta. A pesquisa usa a tela e o campo existentes.

O GPS é controlado no App, independentemente de uma tela de descoberta. Com permissão, feed e busca recebem a posição automaticamente; o servidor ordena antes de limitar os resultados. O feed exibe apenas a página de publicações retornada pelo servidor, sem acrescentar favoritos ou fotos de outros perfis. A busca preserva a ordem e as correspondências do servidor, inclusive correspondências em produtos.

O mapa recebe a mesma posição do visitante, mostra um marcador azul e enquadra visitante e empresa ao abrir um destino. Atualizações do GPS movem o marcador e atualizam distâncias sem recriar o mapa. Endereço da empresa não é usado como posição do visitante.

Sem localização disponível, as rotas existentes continuam funcionando; a pesquisa aceita cidade no campo habitual. O navegador continua responsável pela autorização do GPS. Não foram acrescentados botões.

A infraestrutura de descoberta por raio e as validações obrigatórias de coordenadas da empresa foram preservadas. Atualizações do GPS continuam limitadas a página visível, pelo menos 30 segundos e deslocamento de 150 metros.

## Validação

- npm run lint
- npm run build
- node --import tsx --test tests/discovery.test.mjs
- node --experimental-sqlite --test tests/notifications.test.mjs

A validação de GPS real e enquadramento no iPhone depende de teste no dispositivo.


## Origem temporária no mapa e fotos recentes

Um toque na área livre do mapa define um ponto de busca apenas naquela sessão do mapa. A consulta usa a rota de descoberta por raio (5 km), preserva a ordem do servidor e não mistura resultados fora da área. O ponto é laranja; o visitante permanece azul. As distâncias dos resultados se referem ao ponto escolhido. Fechar o mapa descarta essa origem temporária.

No feed, o servidor seleciona **uma publicação por empresa**: a mais recente por data e ID. Uma segunda foto no mesmo dia substitui a primeira na próxima consulta; se não houver publicação do dia, a última foto continua elegível, sem prazo de expiração. A vitrine mantém todas as publicações. Publicar não altera automaticamente o horário de funcionamento nem comprova que a empresa está aberta.

Com GPS, a distância da empresa vem antes da data da publicação. Sem GPS, a ordem é cronológica, com uma foto por empresa e sem inventar uma distância. Feed e pesquisa não têm um corte por raio; retornam páginas/quantidades limitadas, ordenadas no servidor. A busca por um ponto escolhido no mapa continua com raio de 5 km.

## Atualização durante o uso

O feed observa os cards visíveis, incluindo uma margem de 240 px. Nas atualizações automáticas, conserva todo o trecho até o último card já visto, com os mesmos IDs e objetos. Apenas o restante ainda não visto é substituído. A pessoa pode continuar lendo sem perder a posição; as distâncias podem acompanhar o GPS.

O GPS inicia uma nova consulta ao mudar pelo menos 150 metros e após 30 segundos. Com o feed visível, uma consulta leve a cada 60 segundos verifica publicações novas. Aba oculta, mapa, perfil ou publicação aberta suspendem as consultas do feed; ao voltar, a consulta usa a posição atual. Perda temporária de sinal não desliga o acompanhamento. Não há rastreamento em segundo plano.

Puxar para atualizar ou tocar novamente no Feed existente descarta a ordem anterior e carrega a seleção atual desde o começo. Erros de rede conservam os cards já carregados; a próxima atualização em primeiro plano tenta novamente. Consultas automáticas não acionam o bloqueio global de carregamento.

## Paginação e compatibilidade

`GET /api/publications?pagination=cursor&lat=...&lng=...` retorna `pagination.nextCursor`. O cursor vincula posição, último item e maior ID de publicação da consulta. Novas inserções não deslocam as páginas em andamento. Uma mudança de posição inicia outra sequência.

`excludeIds` aceita até 200 IDs de empresas já exibidas. O cliente também elimina repetições por empresa e percorre páginas adicionais quando necessário. Requisições antigas são abortadas e suas respostas não podem alterar uma sequência nova.

As rotas, o formato de publicação e a paginação antiga por offset continuam disponíveis. Se o frontend encontrar um backend anterior sem cursor, usa offset e mantém a deduplicação. A garantia de estabilidade entre páginas é completa quando ambos estão atualizados.

A pesquisa pode pedir `GET /api/establishments?...&previews=3`: uma consulta em lote traz até três prévias de cada resultado, independentemente das fotos do feed. Isso conserva as prévias e a abertura de fotos na tela de pesquisa existente.

## Mapa e medição

A tarja central foi retirada do mapa para visitantes e comerciantes. A busca, os marcadores e os contatos permanecem nos controles existentes. A origem escolhida no mapa não substitui a posição real do visitante no feed.

A API de métricas registra contagens de pesquisa, abertura da empresa, WhatsApp e mapa. Cliques repetidos são agrupados por um minuto; são indicadores aproximados, não comprovação de venda. `GET /api/admin/discovery-metrics` exige acesso de administrador e também lista empresas ativas sem coordenadas válidas. Nenhum cadastro antigo recebe localização inventada.

## Regressões automatizadas

A CI executa TypeScript, build, testes existentes de notificações, consultas geográficas em SQLite e PostgreSQL 16, seleção da última foto, prévias independentes, cursores com publicações novas e exclusões, e preservação do trecho já visto. O PostgreSQL da CI usa banco e esquema descartáveis.

Com um banco de teste disponível:
`DISCOVERY_TEST_DATABASE_URL=postgres://... node --import tsx --test tests/discovery.test.mjs tests/publication-feed.test.mjs`

A validação final de GPS físico, rolagem no iPhone, Auth0, upload e WhatsApp continua exigindo teste no dispositivo com uma conta própria. Não use credenciais ou banco de produção nos testes.


## Configuração administrativa

Valores administrativos antes embutidos no código foram removidos. O servidor usa `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `ADMIN_SESSION_SECRET`, além dos aliases já suportados. A área de testes usa `ADMIN_TEST_AREA_PASSWORD`. Configure os valores somente nas variáveis protegidas da hospedagem; não os coloque no Git.

Sem essa configuração, o login administrativo responde 503 e sessões sem chave não são aceitas. Feed, pesquisa, mapa e autenticação Auth0 não dependem dessas variáveis. Chaves de API administrativas configuradas mantêm o caminho existente.

Credenciais antes versionadas devem ser substituídas no provedor. A remoção deste commit não apaga valores do histórico do Git.
