# Backend do iServi

API Fastify disponível sob `/api/v1`. A autorização distingue `PLATFORM_ADMIN`, `ADMIN` e `EMPLOYEE`. Execute os scripts na raiz do monorepo.

| Comando | Uso |
| --- | --- |
| `npm run dev:backend` | Inicia a API com recarga de código |
| `npm run build:backend` | Compila em `backend/dist` |
| `npm run start:backend` | Executa a versão compilada |

Consulte a [arquitetura](../docs/architecture/overview.md), a [referência de autenticação e permissões](../docs/backend/authentication.md) e a [configuração de desenvolvimento](../docs/deployment/development.md).
