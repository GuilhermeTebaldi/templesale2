# Atlas de manutenção do TempleSale

Ferramenta offline e somente de leitura, separada do aplicativo. O gerador lê blobs de um commit Git: alterações não commitadas não entram no relatório. Não inicia `server.ts`, não importa módulos do aplicativo, não lê `.env`, não consulta banco, Auth0 ou APIs e não executa testes do produto durante a geração.

## Gerar e abrir

Com as dependências existentes instaladas por `npm ci`, execute na raiz:

```sh
node --test tests/atlas.test.mjs
node tools/atlas/generate.mjs --ref HEAD --base HEAD^ --strict
```

Abra `atlas-output/index.html`. O desenho, os links e o catálogo são pré-renderizados; não dependem de JavaScript. A busca de texto do navegador/leitor localiza arquivos e definições. O gerador também produz `atlas.json`, `changes.json` e `summary.md`. Use `--out /caminho/externo` para outro destino. Sem `--base`, a comparação é explicitamente omitida. A saída nunca pode ser uma pasta do aplicativo.

## Escopo e evidência

- Interface, servidor, CSS, configurações conhecidas, inicialização pública, testes e ferramentas do próprio atlas possuem categorias separadas. Contagens ampliadas **não são diretamente comparáveis** aos 110 arquivos do atlas inicial.
- Definições nomeadas possuem caminho, escopo, linhas e hash do conteúdo tokenizado, sem publicar o corpo do código. Funções/callbacks sem nome são contados separadamente. Rotas literais de `app`/`router` no servidor incluem aliases e montagens `USE`.
- Importações/exportações locais, `require` e `import()` literais formam o grafo de módulos. Chamadas resolvidas pelo TypeScript não representam todos os callbacks, eventos ou caminhos de execução. A análise adota a resolução bundler e o alias `@/` existentes; não executa o compilador de produção nem promete reproduzir qualquer futura configuração.
- O índice lexical de CSS preserva contexto de media queries e regras aninhadas; ignora comentários e strings ao reconhecer chaves. Relações com JSX são **candidatos textuais** por classes/IDs, não prova de correspondência de seletor, cascata, visibilidade ou geometria. Tailwind/@apply, estilos inline, seletores dinâmicos e herança exigem inspeção adicional.
- Estados React e chamadas de setters são associados pelo binding lexical. Eventos com constantes/arrays identificáveis são localizados; nomes dinâmicos ficam explícitos. Não são monitoramento ou traces de execução.
- `flows.json` é um roteiro editorial. Cada âncora textual é resolvida novamente no commit e recebe sua linha real. `--strict` falha diante de arquivo, âncora ou teste ausente. Revise o roteiro quando um fluxo mudar; não substitua a âncora só para fazer a verificação passar.
- A referência literal de um teste em workflow não comprova execução, sucesso ou cobertura. Imports dentro de strings de fixtures, cenários gerados dinamicamente e comandos construídos por scripts podem não ser resolvidos automaticamente.
- Arquivos sem caminho a partir das entradas conhecidas não são automaticamente código morto. Configurações são publicadas como metadados; seus valores e conteúdos não são copiados ao relatório. A ferramenta não é um scanner de segredos nem uma auditoria de segurança.

## Comparação e atualização automática

`.github/workflows/atlas.yml` roda em pull requests, pushes em `main` e acionamento manual, com permissões somente de leitura. Compara o head do PR com sua base; em push, compara com o head anterior; manualmente, usa o pai quando disponível. Não cria commits, não publica GitHub Pages, não altera deployments nem chama o backend. Os workflows de publicação já existentes permanecem independentes e inalterados.

Em **Actions → Code Atlas**, abra a execução e baixe o artefato `templesale-atlas-<commit>`. Os arquivos ficam disponíveis por até 90 dias, sujeitos à política do repositório; o gerador e os roteiros permanecem versionados. O relatório sempre identifica os commits usados. Faça download para retenção adicional.

Arquivos e definições adicionados, removidos ou alterados são comparados separadamente. A identidade de uma definição usa caminho, escopo, nome e ordinal: mover/renomear aparece como remoção e adição. Reordenar definições homônimas pode afetar a identidade; mover apenas a linha não altera o hash. Alterar uma função interna pode alterar o hash da função externa também. O relatório não infere equivalência semântica nem impacto em produção.

## Fluxo piloto: navegação móvel

O roteiro começa em `App.tsx`/`isMapOpen`, passa por `Header.tsx`, `MobileNavigation.tsx`, `index.css`, `app-scroll.ts` e `overlay-viewport.ts`. Relaciona os testes de navegação e layout existentes a abertura/fechamento do mapa, teclado, rolagem, retorno do aplicativo e verificação de integridade. Diagnosticar um defeito ainda exige reprodução, eventos observados e medições de viewport; a presença do watchdog de 1 segundo não demonstra a causa nem justifica outro temporizador.
