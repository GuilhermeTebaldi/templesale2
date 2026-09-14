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
