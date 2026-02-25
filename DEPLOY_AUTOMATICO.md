# Deploy automático para `www.templesale.com`

Este repositório agora possui:

- `.github/workflows/ci.yml`
  - valida `npm run lint` e `npm run build`
- `.github/workflows/deploy-vercel.yml`
  - faz deploy automático para produção na Vercel em cada push na `main`

## O que você precisa configurar 1 vez

No GitHub do projeto (`Settings > Secrets and variables > Actions > New repository secret`), crie:

1. `VERCEL_TOKEN`
2. `VERCEL_ORG_ID`
3. `VERCEL_PROJECT_ID`

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

## Fluxo esperado depois

1. Você altera local.
2. Faz commit + push para `main`.
3. GitHub Actions valida e publica automático no `www.templesale.com`.

Sem push para `main`, nada sobe para produção.
