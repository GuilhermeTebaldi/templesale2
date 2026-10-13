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
