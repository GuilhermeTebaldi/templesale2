# Comentários imediatos e capacidade de publicação

## Implementado em 12/10/2026

- Comentário temporário no cliente, separado da lista confirmada do servidor. Atualizar o feed não apaga o envio pendente.
- Barra local de 2 px; POST de comentário e criação de publicação sem overlay global.
- Confirmação usa a resposta do POST; removida a consulta extra à publicação.
- Um comentário em trânsito por publicação neste cliente. Erros preservam o texto na sessão e permitem correção/reenvio manual; não há repetição automática de POST.
- Até quatro consultas de comentários simultâneas no feed, sem substituir dados mais novos por respostas antigas.
- Um fluxo de publicação de foto por vez nesta interface; falhas agora aparecem no feed.
- Servidor: orçamento por processo de 16 criações de comentários/publicações e quatro uploads de produto. Configurável por PUBLICATION_WRITE_CONCURRENCY e MEDIA_UPLOAD_CONCURRENCY. São valores iniciais, não limites de capacidade medidos.
- Ao exceder esse orçamento, resposta 503 WRITE_BUSY com Retry-After: 2; nada é colocado em uma fila ilimitada. A operação em andamento mantém seu lugar até terminar, inclusive se o cliente desconectar.
- Aquisição de conexão PostgreSQL limitada a cinco segundos; o limite não é um timeout de execução de SQL.
- /api/health informa writeCapacity, com operações ativas e limites por processo. Não é uma medição da frota inteira.

## Gargalos verificados no código

1. createProductCommentRecord aguarda buildContentTranslations antes do INSERT. O provedor externo está no caminho da gravação; seus timeouts/fallbacks contribuem para a demora. A tradução foi preservada nesta alteração.
2. selectPublicationCommentsRows seleciona todos os comentários da publicação. O GET e a resposta de criação devolvem a árvore inteira. Isso continua crescendo com a popularidade do post.
3. O PostgreSQL já usa Pool e há índice em publication_id/created_at. Não há necessidade de inventar um segundo pool ou duplicar os índices.
4. A criação de comentários/publicações não possui chave de idempotência durável. Uma resposta perdida pode ocorrer depois da gravação. Reenvio manual pode duplicar; o aviso pede conferir os comentários antes de reenviar.
5. A publicação de foto já sobe ao Cloudinary antes da gravação. Não deve ser apresentada como confirmada antes dessas duas etapas.
6. O editor de foto fecha no início do upload. A falha agora fica visível, mas recuperação do arquivo após fechar/recarregar ainda exige um rascunho persistente próprio.

## Próxima evolução, em ordem

### 1. Limitar o tamanho das leituras

Paginar comentários por cursor (created_at, id), separando comentários principais e respostas. O POST deve devolver apenas o comentário gravado e os contadores necessários. Manter o contrato atual durante a migração dos clientes. Medir tamanho da resposta, p95/p99, consultas por envio e espera no pool.

### 2. Tornar reenvios seguros

Gerar um identificador de operação no cliente. Registrar a chave, usuário, tipo de operação e hash do conteúdo com restrição UNIQUE no banco, na mesma transação da gravação. Repetir a mesma chave devolve o mesmo resultado; chave reutilizada com conteúdo diferente é recusada. Só depois habilitar tentativas limitadas com espera exponencial aleatória e respeito a Retry-After.

### 3. Tirar tradução da gravação sem perder trabalhos

Na mesma transação: gravar o comentário original e um trabalho em uma tabela outbox. Workers retiram trabalhos em lotes limitados, com bloqueio/lease, número máximo de tentativas e registro de falha definitiva. Atualização da tradução deve verificar se o texto não foi editado desde a criação do trabalho. Isso mantém o original disponível e permite recuperação após reinício. Não usar apenas setTimeout, Promise sem await ou fila em memória para trabalhos que não podem ser perdidos.

### 4. Medir antes de expandir infraestrutura

Teste de carga separado da produção com distribuição realista de posts populares, comentários, uploads e leituras. Medir capacidade por instância, CPU/memória, p95/p99, espera no pool, erros 429/503 e tempo de confirmação. Ajustar os limites a esses resultados e ao orçamento total de conexões do banco. Somar pools de todas as instâncias antes de aumentar max.

### 5. Crescer com controle global

Se houver várias instâncias, acrescentar limitação distribuída por usuário/dispositivo e observabilidade agregada. Uploads grandes podem usar envio direto autorizado ao armazenamento, mantendo validações de tamanho/tipo/propriedade. Fila durável deve processar tarefas pesadas, com backlog limitado e política de expiração; uma fila não cria capacidade por si só.

## Limites da entrega

Não foi realizado teste de carga com milhões de operações. Os limites atuais protegem apenas as rotas envolvidas e cada processo; não substituem proteção no proxy, paginação ou coordenação entre instâncias. Rascunhos de comentários ficam na memória da sessão, sem garantia após fechar/recarregar. A publicação do frontend e a ativação do backend devem ser verificadas separadamente: Vercel hospeda o frontend e vercel.json encaminha /api ao saleday-backend.onrender.com. Um workflow Render concluído não comprova sozinho que esse serviço executa este commit.

## Referências consultadas

- React, atualizações otimistas e reconciliação com a lista atual: https://react.dev/reference/react/useOptimistic
- node-postgres, pool, espera por conexões e connectionTimeoutMillis: https://node-postgres.com/apis/pool
- AWS, limitar filas e falhar rapidamente em sobrecarga: https://docs.aws.amazon.com/wellarchitected/2022-03-31/framework/rel_mitigate_interaction_failure_fail_fast.html
- AWS, reenvios com backoff e requisito de idempotência: https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/retry-backoff.html

## Redução do custo por envio — 13/10/2026

- Feed usa GET de comentários com preview=1: no máximo dois registros, via LIMIT parametrizado no PostgreSQL e SQLite. O cliente também limita a prévia se o servidor antigo ignorar a opção.
- Criação usa response=created: devolve só o comentário inserido. O cliente incorpora esse registro à lista existente, sem consultar ou transferir a árvore inteira. Servidores/clientes antigos continuam usando o contrato anterior.
- O cache de comentários do feed mantém apenas dois registros por publicação. O botão diz Ver comentários, sem apresentar a quantidade parcial como total.
- O visualizador mantém sua lista e incorpora confirmações incrementalmente. A consulta inicial da lista completa e os fluxos de editar/excluir ainda usam o contrato anterior: paginação de comentários principais/respostas segue pendente, especialmente para posts muito populares.
- /api/health identifica commentDelivery=compact-v1 e apresenta total/idle/waiting do pool. São dados por processo, não métricas agregadas.
- Não foram apagados comentários, publicações ou outros registros; nenhum índice foi duplicado nem o schema alterado. Crescimento legítimo do banco continua exigindo acompanhamento de armazenamento e backups.
- Tradução síncrona, idempotência durável, recuperação de rascunho de foto e políticas de retenção de registros técnicos continuam sendo trabalhos distintos. Não existe garantia de capacidade ilimitada no plano inicial.

## Evolução aplicada — 13/10/2026

- Tradução automática de comentários removida por solicitação do usuário: criação/edição não chamam tradutores, e exibição usa o texto original. As traduções da interface e dos outros conteúdos permanecem. As colunas antigas não foram apagadas. Nenhuma fila de tradução foi criada.
- Lista completa substituída, no cliente atualizado, por páginas de 30 comentários principais e páginas separadas de 30 respostas. Cursor baseado em created_at/id; resposta lê no máximo 31 registros para detectar uma próxima página. Foco em notificações continua acessível mesmo fora da primeira página.
- Edição e exclusão passam a devolver confirmação compacta; respostas legadas continuam disponíveis para clientes antigos. A compatibilidade antiga não é a garantia de leituras limitadas: versões antigas do cliente ainda podem pedir a lista completa.
- Um índice específico para publication_id/parent_comment_id/created_at/id atende paginação de raízes e respostas. PostgreSQL cria o índice concorrentemente, sem reescrever os registros existentes.
- publication_write_operations registra usuário, identificação, tipo, hash e ID do recurso. A reivindicação da chave e a gravação estão na mesma transação. Repetições da mesma operação devolvem o recurso existente; conteúdo diferente com a mesma chave é recusado. Exclusões não são desfeitas por reenvio enquanto o registro técnico existir.
- Chaves do cliente sobrevivem a reinícios de página quando o navegador permite armazenamento. Até 32 identificações pendentes são retidas, sem armazenar o texto. Sucesso libera a chave; um novo envio intencional recebe outra identificação. Falhas de armazenamento usam memória da sessão.
- Janela de idempotência de sete dias, com limpeza técnica em lotes de até 1.000 por minuto; registros comerciais não são apagados. A proteção vale para a identificação preservada, o usuário identificado e essa janela; não cobre clientes antigos, perda da identificação ou reenvio após sua expiração.
- Fotos recebem identificação na etapa de gravação da publicação. O upload ao Cloudinary e a recuperação do arquivo após fechar o editor não foram redesenhados. Repetição do mesmo payload final é protegida; recuperação persistente do rascunho continua pendente.
- Verificação local: compilação e TypeScript. Nenhum novo teste local ou teste de carga foi executado, conforme a orientação vigente. O CI existente pode executar suas verificações automaticamente.
- Continuam pendentes: métricas agregadas e alertas, medição de capacidade, limitação distribuída, recuperação de rascunhos de fotos e revisão de retenção dos demais registros técnicos. Paginação limita cada resposta; a tela ainda acumula as páginas que o usuário solicita explicitamente, sem virtualização.

## Proteção das publicações aplicada — 13/10/2026

- Admissão de uploads antes de express.raw: somente dois uploads de produto/perfil por processo por padrão, compartilhando o mesmo orçamento. Antes, o limite era avaliado depois de armazenar o arquivo inteiro na memória. Arquivos continuam limitados a 12 MiB. O recebimento tem prazo de 60 segundos; arquivos muito lentos são interrompidos. Isso limita os buffers desse caminho, não toda a memória do processo nem o tráfego até o proxy.
- Publicações e comentários têm orçamentos separados de quatro operações simultâneas cada. PostgreSQL com quatro ou mais pedidos esperando conexão recusa novas operações protegidas com 503 WRITE_BUSY, antes de iniciar o trabalho. Não há fila ilimitada no servidor.
- O cliente tenta novamente somente recusas explícitas WRITE_BUSY, no máximo três tentativas por etapa, respeitando Retry-After numérico e acrescentando espera aleatória. A barra existente permanece durante esse envio. A imagem já enviada não é reenviada nas tentativas de gravação. Erros de rede, timeouts, 400/401/409 e respostas ambíguas não provocam novo POST automático.
- Cloudinary tem prazo de 45 segundos por envio. Um timeout pode ocorrer depois de o provedor ter recebido o arquivo; não é prova de falha definitiva nem autoriza repetir automaticamente. Recuperação persistente e limpeza de arquivos órfãos continuam pendentes.
- A transação de criação no PostgreSQL usa limites locais de 8 segundos por statement, 2 segundos para espera em locks e 8 segundos de ociosidade em transação. Esses limites valem apenas para as gravações da evolução, sem afetar migrações ou outras consultas do sistema. Rollback continua obrigatório; conexões cujo rollback falha são descartadas. Não é prazo total de uma requisição.
- Erros de conexões ociosas do pool são tratados, evitando a interrupção do processo por evento error sem listener. DATABASE_POOL_MAX permite configurar o pool existente, mantendo dez conexões por padrão. Somar pools de todas as instâncias antes de aumentar este valor.
- Configuração por ambiente: PUBLICATION_WRITE_CONCURRENCY, COMMENT_WRITE_CONCURRENCY, MEDIA_UPLOAD_CONCURRENCY, DATABASE_POOL_MAX, PUBLICATION_STATEMENT_TIMEOUT_MS e PUBLICATION_LOCK_TIMEOUT_MS. Limites iniciais conservadores, sem medição de capacidade e sem ajuste automático ao trocar o plano do Render.
- Health identifica publicationProtection=bounded-v3 e informa ativos, admissões, recusas, conclusões, falhas, pico e maior duração por processo. Os contadores usam espaço constante e são reiniciados com o processo; não criam registros adicionais no banco. Não substituem alertas nem percentis históricos.
- Idempotência, índices e paginação existentes foram preservados. Não há novas tabelas, Redis, workers nem reescrita de dados comerciais nesta etapa. Escalar hardware permite ajustar os orçamentos; múltiplas instâncias ainda exigem controle distribuído e orçamento global de conexões. Upload direto autorizado ao Cloudinary é uma evolução posterior que exige preservar validações de tamanho, tipo e propriedade.
- Fontes: https://node-postgres.com/apis/pool ; https://www.postgresql.org/docs/current/runtime-config-client.html ; https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/ ; https://cloudinary.com/documentation/client_side_uploading .
- Verificação por revisão do código e implantação. Nenhum teste local ou teste de carga executado nesta etapa, conforme solicitado. CI existente pode executar automaticamente.

## Recuperação e coordenação — 13/10/2026

- Datas de comentários PostgreSQL são normalizadas como segundos para exibição, preservando a data original com precisão no cursor. Cursor novo usa esse valor original na comparação, compatível com BIGINT e timestamps. Cursor antigo consulta a âncora por ID; se ela foi excluída, pede uma nova página. SQLite mantém o cursor numérico.
- Rascunho da imagem final, legenda, URL já enviada e chave de operação são preservados em IndexedDB: até quatro rascunhos, até 12 MiB por foto e validade de sete dias. Limpeza ocorre ao salvar/acessar; não há promessa de armazenamento ilimitado ou de disponibilidade após o navegador apagar seus dados. Falha/quota bloqueada conserva somente memória da sessão e mostra aviso.
- Editor permanece aberto até a confirmação; fechamento interrompe a espera local e conserva o rascunho preparado. Prazo local de 120 segundos inclui tentativas, upload e gravação. Abort no navegador não prova que o backend desistiu; ao retomar um envio com chave, a rota autenticada de consulta da operação procura a publicação já gravada antes de iniciar outro POST.
- Foto com URL preservada não é enviada novamente ao retomar a mesma operação. Alterar um rascunho cuja gravação ainda está incerta exige resolver o envio anterior; não se gera uma nova chave silenciosamente. Rascunho só é removido após confirmação ou expiração. A imagem é salva após sua composição, não a cada movimento do editor: fechar/recarregar antes dessa etapa ainda pode perder a edição.
- Doze consultas deixaram de agrupar todas as curtidas; contam pelo publication_id, utilizando o índice existente e mantendo a mesma visibilidade de dados. Limpeza de sessões vencidas ocorre no máximo uma vez por minuto por processo, em lotes de 500; índice de expires_at criado concorrentemente em PG. Consulta de sessão continua verificando validade individualmente, portanto a limpeza não amplia autorização.
- Métricas de duração usam sete faixas fixas por processo, sem gravar histórico no banco. Rota autenticada de administração /api/admin/publication-capacity informa memória, atraso p99 do event loop, admissões, recusas, faixas de duração, conexões indiretas pelos dados existentes, ocupação global de slots e estimativas de linhas vivas/mortas e manutenção de tabelas PostgreSQL. Não há painel ou alertas externos configurados; estatísticas de tabelas são estimativas.
- publication_capacity_slots é uma tabela técnica com slots reutilizáveis por tipo, por padrão quatro publicações, quatro comentários e dois uploads para todas as instâncias atualizadas que usam este banco/schema. A aquisição é atômica com FOR UPDATE SKIP LOCKED, sem conexão dedicada mantida durante todo o envio. A liberação usa token para não liberar o slot de outro trabalho. Falhas de liberação expiram em cinco minutos. Admissões têm transação com statement_timeout de 5s e lock_timeout de 1s.
- PUBLICATION_GLOBAL_CONCURRENCY, COMMENT_GLOBAL_CONCURRENCY e MEDIA_GLOBAL_CONCURRENCY configuram orçamento compartilhado (até 64 slots por tipo); manter configurações iguais nas instâncias. Limites locais e orçamento de conexões por processo continuam separados. Leases podem expirar se um trabalho ultrapassar cinco minutos; não substituem fencing/renovação para trabalhos arbitrariamente longos. Instâncias antigas sem essa admissão não participam do controle.
- Health identifica publicationProtection=resilient-v4 e sharedCapacity.mode=postgres-leases em produção PG. Nenhum teste local ou carga foi executado. CI existente pode executar automaticamente; implantação e leituras de produção são verificadas separadamente.
- Upload direto ao Cloudinary foi investigado e permanece pendente. A documentação oficial informa que presets não impõem limite de tamanho por preset; validar apenas no navegador não preserva a restrição atual de 12 MiB no servidor. Antes de ativar, escolher limite da conta confirmado ou validação confiável por metadados/webhook assinado, orçamento da API e coordenação dos uploads. Não há preset sem assinatura nem segredo enviado ao navegador nesta entrega. Fonte: https://cloudinary.com/documentation/upload_presets#protect_unsigned_presets .
