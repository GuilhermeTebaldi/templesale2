# Deploy automático para `www.templesale.com`

Este repositório agora possui:

- `.github/workflows/ci.yml`
  - valida `npm run lint` e `npm run build`
- `.github/workflows/deploy-vercel.yml`
  - faz deploy automático para produção na Vercel em cada push na `main`
- `.github/workflows/deploy-render-backend.yml`
  - detecta mudanças de backend no push da `main` e dispara deploy automático no Render via Deploy Hook

## O que você precisa configurar 1 vez

No GitHub do projeto (`Settings > Secrets and variables > Actions > New repository secret`), crie:

1. `VERCEL_TOKEN`
2. `VERCEL_ORG_ID`
3. `VERCEL_PROJECT_ID`
4. `RENDER_DEPLOY_HOOK_URL`

## Como obter os valores

### `VERCEL_TOKEN`

- Vercel Dashboard > `Settings` > `Tokens` > criar token.

### `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID`

Opção 1 (recomendada): via CLI no projeto

```bash
npx vercel link
cat .vercel/project.json
```

Use os campos `orgId` e `projectId`.

Opção 2: diretamente no Dashboard da Vercel em `Project Settings`.

### `RENDER_DEPLOY_HOOK_URL`

- Render Dashboard > serviço backend > `Settings` > `Deploy Hook`
- Copie a URL completa do hook e salve no secret `RENDER_DEPLOY_HOOK_URL`.

## Fluxo esperado depois

1. Você altera local.
2. Faz commit + push para `main`.
3. GitHub Actions valida e publica automático no `www.templesale.com` (Vercel).
4. Se houver mudança de backend, o workflow dispara deploy automático do Render.

Sem push para `main`, nada sobe para produção.

## Importante para não quebrar o fluxo

- O backend precisa estar no mesmo repositório que o serviço do Render está conectado.
- Se o serviço Render estiver apontando para outro repositório, o hook vai redeployar esse outro código.
- Para fluxo 100% sem preocupação com "repo certo", deixe o Render conectado ao repositório onde você realmente altera o backend.
