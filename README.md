# iServi

Sistema de atendimento por mesa para restaurantes. Clientes consultam o cardápio, fazem pedidos e solicitam a conta pelo QR Code da mesa. A equipe opera mesas, pedidos e pagamentos no painel. Administradores do restaurante gerenciam catálogo, estoque e promoções e acompanham vendas. O perfil Nupify presta suporte com acesso operacional e administrativo sem indicadores financeiros.

- **Frontend** com React, React Router, TypeScript, Vite e Sass.
- **Backend** com Fastify, TypeScript, Zod e Prisma.
- **Dados e execução** com MariaDB, Valkey e Docker Compose. A publicação usa Nginx.

## Começar

Para executar tudo em containers, instale Docker com Compose. Para desenvolvimento no host e testes, use Node.js 22 e npm. Git é usado para obter o repositório. Os comandos abaixo partem da raiz.

```bash
cp -n .env.example .env
chmod 600 .env
docker compose up --build
```

Abra `http://localhost:5173`. A API atende em `http://localhost:3333/api/v1`. Se já houver um volume MariaDB, mantenha as credenciais cadastradas. Consulte [desenvolvimento local](docs/deployment/development.md) para executar no host, configurar o acesso pelo celular ou atualizar o backend em Docker.

## Comandos principais

| Comando | Uso |
| --- | --- |
| `npm run setup` | Instala as dependências do monorepo e gera o Prisma Client |
| `npm run dev` | Inicia frontend e backend no host com o banco já disponível |
| `npm run build` | Compila os dois módulos |
| `npm run lint` | Verifica o frontend com Oxlint |
| `npm run lint:backend` | Verifica a tipagem dos testes e a formatação do backend |
| `npm test` | Executa as suítes convencionais de backend e frontend |

Para integração com MariaDB, execute após o setup:

```bash
npm run db:test:up
npm run test:integration
npm run db:test:down
```

O [guia de testes](docs/testing/integration-tests.md) descreve o banco isolado e o CI. Para arquitetura, regras de negócio, permissões e publicação, consulte o [índice da documentação](docs/README.md).
