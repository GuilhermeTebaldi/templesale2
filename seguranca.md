# Sistema de Varredura de Seguranca - TempleSale

## Visao geral
Este documento descreve o scanner de seguranca implementado no painel administrativo (`/admin`), na secao **Area de Testes de Seguranca**.

O objetivo do scanner e executar uma varredura extensa da superficie de ataque da aplicacao com foco em:
- autenticacao
- autorizacao
- comportamento de API publica
- comportamento de API autenticada
- comportamento de API administrativa
- validacao de entrada
- tratamento de erro
- headers de seguranca
- exposicao de informacao sensivel
- monitoramento de eventos

O scanner foi projetado para gerar **mais de 300 verificacoes reais por execucao** (catalogo dinamico), com retorno em linguagem leiga e acao recomendada.

## Onde esta implementado
- Engine principal: `src/lib/security-scanner.ts`
- Tela e UX do admin: `src/components/AdminPanelV2.tsx`

## O que o scanner faz na pratica
A execucao roda probes HTTP reais contra rotas da aplicacao em diferentes contextos:
- sem credenciais (`credentials: omit`)
- com sessao (`credentials: include`)
- com contexto administrativo (`Authorization`, `X-Admin-Token`, `X-Admin-Auth`)

### Estrutura de verificacoes
A varredura foi dividida em blocos:

1. **Leitura de rotas publicas**
- valida estabilidade da API publica
- valida ausencia de erro 5xx em operacoes de leitura

2. **Mutacao indevida em rotas publicas**
- tenta `POST/PUT/PATCH/DELETE` em superficies que nao deveriam aceitar mutacao anonima
- confirma se backend bloqueia corretamente

3. **Rotas autenticadas (read)**
- verifica bloqueio sem login
- verifica disponibilidade com sessao

4. **Rotas autenticadas (write) com acesso anonimo**
- confirma bloqueio de escrita sem sessao

5. **Rotas administrativas (read)**
- confirma bloqueio sem admin
- valida acesso com sessao admin

6. **Rotas administrativas (write) com acesso anonimo**
- valida bloqueio de operacoes sensiveis administrativas

7. **Fuzzing de entrada**
- injeta payloads maliciosos e malformed em endpoints criticos
- espera bloqueio (401/403) ou rejeicao (4xx)
- sinaliza falha se houver sucesso indevido ou 5xx

8. **Hardening de headers e exposicao**
- valida headers obrigatorios
- analisa CSP (`unsafe-inline`, `unsafe-eval`)
- detecta fingerprint de servidor
- verifica possivel vazamento de segredo no body de health
- verifica erro de rota inexistente sem stack trace
- valida protecao do monitor de seguranca

## Resultado exibido no admin
Cada check retorna:
- **status**: `pass`, `warn`, `fail`
- **categoria**
- **falha/diagnostico** (texto em linguagem de leigo)
- **como corrigir** (acao objetiva)
- **evidencia tecnica** (metodo, rota, status e preview da resposta)

A interface tambem mostra:
- total de verificacoes
- contagem por severidade
- contagem por categoria
- progresso em tempo real da varredura

## Catalogo de verificacoes (familias)
Abaixo estao as familias que compoem as 300+ verificacoes da varredura.

### A. API publica
- `/api/health`
- `/api/products`
- `/api/products/:id`
- `/api/products/:id/comments`
- `/api/vendors`
- `/api/vendors/:id/products`
- `/api/users/:id`
- `/api/map-tiles/:z/:x/:y.png`
- `/api/agent/status/:siteId`
- `/api/agent/script/:siteId.js`

Metodos testados:
- leitura: `GET`, `HEAD`, `OPTIONS`
- mutacao indevida: `POST`, `PUT`, `PATCH`, `DELETE`

### B. API autenticada
- `/api/auth/me`
- `/api/profile/new-product-defaults` (GET)
- `/api/my-products`
- `/api/likes`
- `/api/notifications`
- `/api/profile`
- `/api/profile/avatar`
- `/api/profile/new-product-defaults` (PUT)
- `/api/auth/logout`
- `/api/products`
- `/api/products/:id`
- `/api/products/:id/comments`
- `/api/products/:id/cart-interest`
- `/api/products/:id/like`

### C. API administrativa
- `/api/admin/auth/me`
- `/api/admin/me`
- `/api/admin`
- `/api/admin/users`
- `/api/admin/users/:id/products`
- `/api/admin/security-test/events`
- `/api/admin/security-tests/events`
- `/api/admin/agent/status/:siteId`
- `/api/admin/auth`

Mutacoes anonimas testadas em:
- `/api/admin/users/:id`
- `/api/admin/products/:id`
- `/api/admin/security-test/events`
- `/api/admin/security-tests/events`
- `/api/admin/agent/status/:siteId`
- `/api/admin/auth/logout`
- `/api/admin/logout`
- `/api/admin/auth`
- `/api/admin`

### D. Fuzzing de entrada
Payloads usados incluem tentativas classicas de:
- SQL injection
- XSS
- traversal
- header injection
- template injection
- payloads grandes
- caracteres especiais de controle

Alvos de fuzzing:
- `/api/auth/login`
- `/api/auth/register`
- `/api/admin/login`
- `/api/admin/auth/login`
- `/api/products`
- `/api/products/:id/comments`

## Logica de classificacao
A engine usa expectativas por probe:
- `no-5xx`
- `auth-blocked`
- `admin-blocked`
- `admin-accessible`
- `method-should-not-succeed`
- `reject-or-block`

Exemplo:
- se uma rota autenticada sem login responde 200, o check vira `fail`
- se payload malicioso gera 500, o check vira `fail`
- se metodo indevido retorna 401/403/404/405/415/422, o check vira `pass`

## Como isso ajuda sistema de seguranca de terceiros
Se voce usa outro sistema de seguranca (SIEM/SOC/WAF/scanner externo), esse modulo pode servir como:

1. **Gerador de baseline tecnico**
- cria evidencias padronizadas por rota/metodo
- facilita comparacao entre ambientes (dev/stage/prod)

2. **Fonte de eventos para correlacao**
- resultado do scanner + monitor ao vivo pode ser enviado para SIEM
- permite regras de correlacao por repeticao de falha

3. **Enriquecimento de DAST externo**
- seu scanner externo pode consumir o catalogo de rotas/metodos daqui
- melhora cobertura alem do "somente URL"

4. **Matriz de correcao automatizavel**
- campo "como corrigir" pode alimentar backlog automatico
- cada check vira tarefa tecnica rastreavel

## Como evoluir seu scanner atual (hoje so URL)
Seu modelo atual "passar URL e avaliar seguranca" pode evoluir com as camadas abaixo:

1. **Descoberta de superficie de ataque**
- alem da URL base, descobrir rotas reais e metodos aceitos

2. **Contexto de autenticacao**
- testar anonimo, usuario comum e admin separadamente

3. **Expectativa por classe de rota**
- rota publica: disponibilidade e sem 5xx
- rota autenticada: bloquear anonimo
- rota admin: bloquear tudo que nao e admin

4. **Fuzzing orientado por endpoint**
- payloads diferentes para login, CRUD, comentarios, admin

5. **Analise de headers e politicas**
- CSP, HSTS, frame options, referrer, permissions

6. **Analise de erro e vazamento**
- stack trace, assinatura de servidor, segredo em resposta

7. **Correlacao temporal**
- repetir varredura e comparar regressao por build/deploy

8. **Pontuacao de risco**
- transformar `pass/warn/fail` em score e tendencia por release

## Integracao recomendada com ferramentas externas
### SIEM
Enviar por webhook/event bus:
- `scan_id`
- `timestamp`
- `check_id`
- `status`
- `category`
- `title`
- `technicalEvidence`

### WAF
Usar findings de:
- payloads que geraram warn/fail
- rotas com bloqueio inconsistente
- criar regras especificas por endpoint

### CI/CD
Executar scanner em pipeline e falhar build quando:
- existir `fail` em categoria `auth`, `authorization`, `api-admin`
- aumento brusco de `warn` vs baseline

### Ticketing
Mapear automaticamente `check_id -> tarefa` com:
- dono tecnico
- prazo por severidade
- checklist de validacao

## Limites importantes (transparencia tecnica)
- "100% de seguranca" nao existe em pratica.
- scanner de API nao substitui:
  - SAST (analise de codigo)
  - teste de dependencia/SBOM
  - pentest humano
  - observabilidade em tempo real de infraestrutura
- alguns resultados `warn` dependem de politica de negocio e contexto operacional.

## Proximos upgrades recomendados
1. Export JSON assinado dos resultados.
2. Baseline historico com diff por deploy.
3. Modo "strict" para bloquear release em `fail` critico.
4. Integracao nativa com SIEM (HTTP collector).
5. Score de risco por categoria e por rota.
6. Heuristica de anomalia com janela temporal.
7. Correlacao com IP reputation.
8. Testes de rate limit automatizados.
9. Testes de CORS por origem maliciosa simulada.
10. Assinatura de resposta para detectar alteracao indevida em reverse proxy.

## Resumo executivo
O modulo implementado no TempleSale ja entrega:
- varredura ampla (300+ checks)
- diagnostico leigo
- orientacao de correcao
- evidencia tecnica rastreavel
- base concreta para ampliar seu sistema de seguranca alem de URL unica

Isso permite transformar seu sistema atual em uma plataforma de avaliacao de seguranca com cobertura real de autenticacao, autorizacao, exposicao e comportamento de API sob diferentes contextos de acesso.
