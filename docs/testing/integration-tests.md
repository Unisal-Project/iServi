# Testes e integração contínua

## Suítes

| Comando | Abrangência |
| --- | --- |
| `npm test` | Suítes convencionais de backend e frontend |
| `npm run test:backend` | Node Test Runner, testes de domínio e rotas Fastify com fakes |
| `npm run test:frontend` | Node Test Runner, Vite em testes de módulos, renderização React e testes de estado |
| `npm run test:integration` | Requisições Fastify Inject contra a aplicação e MariaDB isolado |

Os comandos são executados na raiz. O executor do frontend limpa `VITE_API_URL` e `VITE_PRINT_URL` para que a configuração local não modifique os testes.

## Isolamento de ambientes

O iServi possui configurações Docker, destinadas a diferentes ambientes:

| Arquivo | Ambiente |
|---|---|
| `docker-compose.yml` | Desenvolvimento |
| `docker-compose.production.yml` | Produção |
| `docker-compose.production.yml` + `docker-compose.staging.yml` | Staging |
| `docker-compose.test.yml` | Testes |

O ambiente de testes possui um banco de dados exclusivo, evitando alterações nos dados de desenvolvimento e produção.

### Configuração do banco de testes

- Imagem: MariaDB 11.4
- Host: 127.0.0.1
- Porta: 3308
- Banco de dados: iservi_test
- Armazenamento: temporário (tmpfs)

Os dados armazenados no ambiente de testes são descartados ao encerrar o container.
O Compose lê `TEST_MARIADB_ROOT_PASSWORD` e `TEST_MARIADB_PASSWORD` do
`.env` da raiz. O [executor](../../backend/tests/helpers/integration-env.mjs) monta a URL com usuário, host, porta e banco fixos. Ele usa somente a senha de testes e configura `RUN_TABLES_DB_TESTS=1` e `RUN_WAITER_DB_TESTS=1` para os cenários optativos. A [proteção de banco](../../backend/tests/integration/helpers/database.ts) impede operação contra uma URL fora do banco isolado. Os testes unitários recebem uma URL
inoperante e deixam os casos de MariaDB para `npm run test:integration`.

## Estrutura dos testes

```text
backend/
├── src/
│   ├── app.ts
│   └── server.ts
├── tests/
│   ├── helpers/
│   │   ├── integration-env.mjs
│   │   └── unit-env.mjs
│   ├── integration/
│   │   ├── helpers/
│   │   │   ├── app.ts
│   │   │   ├── auth.ts
│   │   │   ├── database.ts
│   │   │   └── fixtures.ts
│   │   ├── health.integration.test.ts
│   │   ├── attendance.integration.test.ts
│   │   ├── orders.integration.test.ts
│   │   ├── closing-request.integration.test.ts
│   │   ├── payments.integration.test.ts
│   │   └── scale.integration.test.ts
│   ├── qr-flow.integration.test.ts
│   ├── tables.integration.test.ts
│   └── waiter-calls.test.ts
```

## Arquitetura dos testes

A configuração da aplicação foi separada da inicialização do servidor para permitir a execução dos testes sem a necessidade de abrir uma porta HTTP.

O arquivo `app.ts` disponibiliza a função `buildApp()`, utilizada tanto pelo servidor quanto pelos testes de integração.

As requisições são realizadas por meio do `app.inject()` do Fastify.

```text
Integration Test
       |
  Fastify Inject
       |
     Routes
       |
   Controllers
       |
    Services
       |
  Repositories
       |
     Prisma
       |
    MariaDB
```

## Helpers e fixtures

Os helpers centralizam operações reutilizáveis durante a execução dos testes.

| Arquivo | Responsabilidade |
|---|---|
| `app.ts` | Inicialização da aplicação de testes |
| `auth.ts` | Criação de usuários autenticados |
| `database.ts` | Gerenciamento da conexão e limpeza dos registros |
| `fixtures.ts` | Criação dos dados necessários aos cenários |
| `integration-env.mjs` | Carregamento e validação do ambiente |

Os testes seguem o padrão AAA (Arrange, Act, Assert).

- **Arrange:** preparação dos dados necessários.
- **Act:** execução da operação ou requisição HTTP.
- **Assert:** validação da resposta e dos dados persistidos.

Após a execução, os registros criados pelos testes são removidos.

## Cobertura dos testes

### Health Check

- Disponibilidade da aplicação.
- Inicialização dos plugins e rotas.

### Atendimento

- Abertura de atendimento.
- Consulta de atendimento.
- Prevenção de atendimentos duplicados.
- Validação de mesas.
- Validação de dados.
- Autenticação.

### Pedidos

- Criação, consulta e edição de pedidos.
- Cancelamento com e sem reposição de estoque.
- Controle e movimentação de estoque.
- Validação de disponibilidade dos produtos.
- Integridade das transações.
- Pedidos realizados via QR Code.
- Geração de registros de impressão.

### Solicitação de conta

- Solicitação pelo cliente e pelo painel administrativo.
- Atualização do status do atendimento.
- Geração de impressão da conta.
- Prevenção de solicitações duplicadas.
- Bloqueio de novos pedidos.
- Requisições simultâneas.
- Chamados de garçom e persistência do atendimento.

### Pagamentos e fechamento

- Fechamento do atendimento.
- Cálculo e isenção da taxa de serviço.
- Múltiplas formas de pagamento.
- Cálculo de troco.
- Validação dos valores pagos.
- Prevenção de pagamentos duplicados.
- Liberação da mesa.
- Reabertura de atendimento.
- Concorrência de operações.

## Executando os testes

### Pré-requisitos

- Node.js 22.
- npm.
- Docker.
- Docker Compose.

Todos os comandos devem ser executados na raiz do projeto. Se o `.env` ainda não existir, crie-o com `cp -n .env.example .env`.

### Instalar as dependências

```bash
npm ci
```

### Gerar o Prisma Client

```bash
npm run prisma:generate
```

### Inicializar o banco de testes

```bash
npm run db:test:up
```

### Executar os testes de integração

```bash
npm run test:integration
```

### Visualizar os logs do banco

```bash
npm run db:test:logs
```

### Encerrar o ambiente de testes

```bash
npm run db:test:down
```

## Comandos de validação

| Comando | Finalidade |
|---|---|
| `npm run build:backend` | Compilar o backend |
| `npm run lint:backend` | Validar tipagem e formatação |
| `npm run test:backend` | Executar a suíte convencional do backend |
| `npm run test:integration` | Executar os testes de integração |
| `npm run db:test:up` | Inicializar o banco de testes |
| `npm run db:test:down` | Encerrar o banco de testes |
| `npm run db:test:logs` | Visualizar os logs do banco |

## Integração contínua (CI)

Os testes de integração fazem parte do pipeline do GitHub Actions.

O job de integração é responsável por:

1. Configurar o Node.js.
2. Instalar as dependências.
3. Gerar o Prisma Client.
4. Inicializar o banco de testes.
5. Executar os testes de integração.
6. Exibir os logs do banco em caso de falha.
7. Encerrar o ambiente de testes.

O [workflow](../../.github/workflows/ci.yml) é acionado em pushes e pull requests em `develop` e `main`. Jobs separados validam build, lint e testes convencionais e auditam dependências de produção e desenvolvimento.

## Boas práticas

- Utilizar exclusivamente o banco de testes.
- Manter os testes independentes.
- Evitar dependências entre cenários.
- Reutilizar helpers e fixtures.
- Remover os registros criados durante os testes.
- Validar respostas HTTP e persistência.
- Testar cenários de sucesso e de erro.
- Verificar a integridade das transações.
- Executar as validações antes de abrir um Pull Request.
