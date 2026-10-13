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
