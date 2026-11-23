# Desenvolvimento local

O arquivo privado `.env` da raiz é compartilhado pelo backend, Prisma, Vite e Compose. Use o [.env.example](../../.env.example) como modelo. As chaves `DEV_*` configuram o Compose. `DATABASE_URL` e `VALKEY_URL` são usadas quando o backend roda no host. O frontend usa `VITE_API_URL` e `VITE_PRINT_URL` do mesmo arquivo. Reinicie o processo ou recrie o container após alterar as variáveis que ele recebe.

## Containers ou processos no host

Para iniciar todos os containers, siga a [instalação na raiz](../../README.md). O Compose usa o banco de desenvolvimento `orderflow`. O MariaDB importa o [schema SQL inicial](../../iservi_schema_v1.sql) em volumes novos e o serviço `database-init` reaplica o SQL em volumes existentes durante a inicialização.

Para rodar Node e Vite no host, comece com o ambiente configurado e execute:

```bash
npm run setup
npm run db:up
docker compose run --rm database-init
npm run dev
```

Use `docker compose logs database-init` para investigar a inicialização feita pelo Compose e `curl -fsS http://localhost:3333/api/v1/health` para verificar a API. Sem Valkey disponível, a autenticação usa o limite em memória do processo.

O Compose monta o código do frontend e o Vite pode refletir mudanças imediatamente. Para aplicar alterações do backend executando Compose sem Watch, reconstrua o serviço:

```bash
docker compose up -d --build --no-deps backend
```

Esse passo é apropriado quando o banco já está atualizado. Em uma versão que exige SQL novo, siga as instruções de atualização do banco antes de recriar a API.

## Acesso pelo celular

Defina `FRONTEND_URL` como a origem acessível pelo aparelho, por exemplo `http://<IP-do-computador>:5173`, e recrie ou reinicie o backend. Abra o frontend por esse IP e permita acesso à porta 3333 na rede de desenvolvimento. Sem `VITE_API_URL`, o frontend usa o protocolo e hostname da página na porta 3333 com o prefixo `/api/v1`. Uma configuração explícita deve incluir esse prefixo. `localhost` no QR aponta para o aparelho que o escaneia.

Se o build local retornar `EACCES` em `dist/assets` por arquivos do container, confira a propriedade de `frontend/dist`. Para validar o Vite em outra pasta depois de verificar TypeScript, execute na raiz:

```bash
npm exec -- tsc -b frontend
(cd frontend && npm exec -- vite build --outDir /tmp/iservi-frontend-build)
```
