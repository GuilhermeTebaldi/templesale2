# Descoberta local do TempleSale

A página inicial oferece **Perto de você** e **Novidades**. Novidades mantém o feed existente e seu limite inicial de 18 publicações. A descoberta consulta o servidor, sem depender do catálogo ou do feed carregado no celular.

## Comportamento

- Primeiro acesso: explicação, botão de localização e cidade manual. Permissão já concedida permite atualizar a posição automaticamente. A posição salva é identificada como tal até chegar uma posição atual.
- GPS somente com a Home de descoberta ativa e a página visível. Consultas por movimento exigem pelo menos 30 segundos e 150 metros. Posições com precisão pior que 1 km são rejeitadas.
- Raio inicial de 5 km, ajustável. Cidade manual usa o nome cadastrado, sem inventar distâncias. Empresas sem coordenadas podem aparecer pela cidade.
- Empresa é a referência geográfica da descoberta, inclusive quando um produto possui coordenadas diferentes. Não há reescrita das coordenadas históricas dos produtos.
- Até 12 empresas por página na Home; até três publicações recentes por empresa. Na ausência de publicações, aparecem até três produtos. As fotos abrem a vitrine existente. Mapa e WhatsApp reutilizam os caminhos existentes.
- A busca considera empresa, categoria, descrição, palavras-chave, produtos e legendas. Ordenação: distância, correspondência textual, atividade recente, preenchimento de logo/WhatsApp e ID como desempate.

## API e banco

`GET /api/discovery?lat=41.6&lng=12.5&radius=5&search=pizza&limit=12&offset=0`

Alternativa manual: `GET /api/discovery?city=Ardea`. Filtros opcionais: `category` e `search`. Raio permitido: 0,1–50 km; limite: 1–24. Parâmetros inválidos retornam 400. O resultado inclui `items`, `hasMore` e `nextOffset`; cada item contém empresa, distância e prévias.

O servidor aplica uma caixa geográfica indexável e depois a distância esférica exata antes da paginação. Considera polos e cruzamento do antimeridiano. SQL parametrizado em PostgreSQL e SQLite.

Na inicialização, acrescenta índices geográficos, de cidade e de publicações, além de `discovery_metrics`. Não apaga nem migra registros existentes. O modo de desenvolvimento com banco remoto continua sem escrever métricas ou executar essas adições.

`POST /api/discovery/events` recebe `{ "event": "whatsapp", "establishmentId": 1 }`. Eventos permitidos: `company_open`, `whatsapp`, `map`. Descobertas e buscas são contadas pelo servidor. Os cliques medidos são os dos cards da descoberta; não representam usuários únicos, vendas ou todos os cliques do site.

`GET /api/admin/discovery-metrics` usa a autenticação administrativa existente e retorna os últimos 30 dias. A tabela contém apenas dia, evento, empresa e contagem, sem coordenadas, texto pesquisado ou identificação persistente do visitante. Não foi criada uma tela administrativa adicional.

## Validação

- `npm run lint`
- `npm run build`
- `node --experimental-sqlite --test tests/notifications.test.mjs`
- `node --import tsx --test tests/discovery.test.mjs`

O teste PostgreSQL pode ser executado apontando `DISCOVERY_PGLITE_MODULE` para um módulo PGlite instalado no ambiente de validação. PGlite não é dependência de produção.

Também foram exercitados, num servidor com SQLite isolado e dados fictícios, cadastro/login, criação/edição da empresa e publicação/edição/exclusão de foto. O ciclo de vida do GPS foi verificado em DOM simulado: primeira permissão, aba oculta, retorno, saída da Home, recusa e cidade manual.

Antes do piloto, verificar no iPhone real: permissão do GPS, deslocamento, câmera/teclado, rolagem, abertura do mapa e contato pelo WhatsApp. O navegador de teste não pôde ser baixado neste ambiente; não houve validação visual real nem validação dos serviços de produção. O build ainda informa o aviso preexistente de bundle maior que 500 kB.

## Publicação e piloto

O backend deve receber esta versão antes do frontend, pois a Home utiliza uma rota nova. Se a API estiver indisponível, a Home mostra erro e permite tentar novamente; Novidades continua acessível. Os índices são criados durante a inicialização e podem aumentar seu tempo em bases grandes.

Depois da publicação, conferir a rota de descoberta e cadastrar ou revisar dez empresas reais na mesma região, com coordenadas, fotos e contato corretos. Esse trabalho de campo não foi executado automaticamente. Não foram acrescentados notificações de ofertas, pagamento interno ou aplicativo nativo.
