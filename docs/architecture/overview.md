# Arquitetura do iServi

O iServi é um monorepo com um único [manifesto npm](../../package.json) e um único [lockfile](../../package-lock.json). Cliente e equipe usam o mesmo frontend. O backend concentra autorização, cálculo financeiro e validação das operações.

```text
React e Vite → HTTP /api/v1 → Fastify → Prisma → MariaDB
                                 │
                                 ├─ Valkey para limites da autenticação
                                 ├─ armazenamento local de imagens
                                 └─ Web Push opcional na confirmação de pagamento
```

Em produção e homologação, o Nginx serve a SPA e encaminha a API e as imagens na mesma origem. Em desenvolvimento, o navegador acessa Vite e Fastify separadamente.

## Backend

[app.ts](../../backend/src/app.ts) registra plugins e módulos. [server.ts](../../backend/src/server.ts) inicia a escuta HTTP. A separação permite exercitar a aplicação com Fastify Inject em testes.

- As rotas aplicam a política de acesso e encaminham para controllers ou handlers. Zod valida os dados de entrada.
- Controllers adaptam HTTP para chamadas de domínio. Serviços coordenam regras e operações. Repositórios persistem dados e executam transações, inclusive bloqueios necessários ao fluxo de mesas e estoque. Alguns serviços, como o fluxo por QR, coordenam a transação diretamente.
- Os módulos implementados estão em [backend/src/modules](../../backend/src/modules). Movimentações de estoque são compartilhadas pelo módulo de pedidos. As regras de acesso ficam em [api-access.ts](../../backend/src/shared/api-access.ts).

## Persistência

O [schema SQL inicial](../../iservi_schema_v1.sql) define tabelas, restrições, índices e views do MariaDB. O [schema do Prisma](../../backend/prisma/schema.prisma) mapeia essas estruturas. A instalação usa SQL e os incrementais em [backend/prisma/sql](../../backend/prisma/sql). `prisma:generate` gera o client TypeScript, sem aplicar SQL.

O atendimento conecta uma mesa a vários pedidos e pagamentos. Os itens guardam o preço comercializado e se relacionam a produtos. O catálogo tem categoria principal e associações adicionais. Também existem registros de movimentos de estoque, chamados de garçom, trabalhos de impressão, contador diário, configuração do restaurante e inscrições Web Push. Veja as [regras de negócio](../business/regras-de-negocio.md) para garantias e histórico financeiro.

## Fronteiras externas

- O painel envia a impressão manual a uma ponte HTTP externa via [print.service.ts](../../frontend/src/services/print.service.ts). O banco registra trabalhos `ORDER` e `BILL`; a implementação de um consumidor automático da fila ou firmware ESP32 está fora do código deste repositório.
- O fluxo de Web Push usa o [service worker](../../frontend/public/sw.js) e as rotas de [notificações](../../backend/src/modules/notifications/notifications.routes.ts). A confirmação de pagamento também pode ser consultada pelo cliente com a credencial da sessão de fechamento.
- Backups, proxy, TLS e incrementais de banco estão no [guia de produção](../deployment/production.md).
