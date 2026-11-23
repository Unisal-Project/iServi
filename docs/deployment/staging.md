# Homologação do iServi

O padrão configurado é `https://staging.iservi.com.br`. Confirme o domínio e o túnel ativos antes de compartilhar a URL. O Named Tunnel encaminha o tráfego HTTPS da Cloudflare para o Nginx pela rede Docker do projeto `iservi-staging`. O Nginx serve o React compilado e encaminha `/api/v1/` e `/uploads/` ao Fastify na mesma origem pública. O acesso direto ao Nginx pelo host continua disponível em `http://127.0.0.1:8080`.

| Ambiente | Configuração | Uso |
|---|---|---|
| Desenvolvimento | `docker-compose.yml` | Vite e backend com recarga de código. |
| Testes | `docker-compose.test.yml` | MariaDB temporário em `127.0.0.1:3308`. |
| Staging | Compose de produção com `docker-compose.staging.yml` | Dados, credenciais e rede próprios para homologação. |
| Produção | `docker-compose.production.yml` | Publicação com a seção `PRODUCTION_*` do `.env`. Veja o [guia de produção](production.md). |

## Preparar o host compartilhado

Use um host que possa permanecer ligado, com Docker Engine, Docker Compose com suporte a `!override` (2.24.4 ou posterior), Node.js com npm, OpenSSL e curl. Reserve a porta TCP 8080 no loopback e permita a saída TCP/UDP na porta 7844 para a Cloudflare. Os demais desenvolvedores usam a URL compartilhada. Mantenha o token somente no host que publica a instância, pois conectores do mesmo túnel podem receber tráfego para seus respectivos bancos. [Conectividade e réplicas na Cloudflare](https://developers.cloudflare.com/tunnel/configuration/)

Na raiz do repositório, prepare o arquivo privado e preencha a seção `STAGING_*`.

```bash
cp -n .env.example .env
chmod 600 .env
```

Em instalações novas, gere senhas independentes com `openssl rand -hex 32` para `STAGING_MARIADB_ROOT_PASSWORD` e `STAGING_MARIADB_PASSWORD`. Use `openssl rand -base64 48` para `STAGING_JWT_SECRET`. Em `STAGING_DATABASE_URL`, use `mysql://iservi:<senha-codificada>@database:3306/iservi` com a senha de `STAGING_MARIADB_PASSWORD`. Para volumes existentes, mantenha as credenciais já cadastradas no banco.

Defina `STAGING_FRONTEND_URL=https://staging.iservi.com.br` ou a origem HTTPS escolhida, sem caminho ou barra final. Use o mesmo hostname na rota Cloudflare. Variáveis exportadas no shell têm precedência sobre o `.env` para o Compose.

## Criar o Named Tunnel na Cloudflare

1. Confirme que `iservi.com.br` está registrado e que a zona está ativa na conta Cloudflare. Se necessário, registre o domínio, adicione a zona à conta e configure no registrador os nameservers indicados pela Cloudflare. Também é possível usar outro hostname de uma zona ativa sob seu controle.
2. No painel Cloudflare, em **Networking → Tunnels**, crie um túnel gerenciado remotamente chamado `iservi-staging`. Selecione Docker e copie somente o token do conector para `STAGING_CLOUDFLARE_TUNNEL_TOKEN` no `.env` do host.
3. Em **Routes → Add route → Published application**, publique `staging.iservi.com.br` com serviço HTTP `nginx:80` (URL completa `http://nginx:80`), sem filtro de caminho. Confira o CNAME com proxy para `<UUID>.cfargotunnel.com` na zona DNS e o certificado HTTPS ativo para o hostname. A rota pública expõe a aplicação para quem conhece a URL.
4. Mantenha o token no `.env` privado. Em caso de rotação no painel, atualize o valor e execute `npm run staging:tunnel` para recriar o conector com a nova configuração.

[Configuração oficial do Cloudflare Tunnel](https://developers.cloudflare.com/tunnel/get-started/)

## Web Push

Gere um par VAPID exclusivo de staging com `npm exec -- web-push generate-vapid-keys`. Preencha `STAGING_VAPID_PUBLIC_KEY`, `STAGING_VAPID_PRIVATE_KEY` e `STAGING_VAPID_SUBJECT` com o contato no formato `mailto:` ou uma URL HTTPS. Mantenha o mesmo par entre atualizações. Inscrições do navegador são vinculadas à origem. Quem se inscreveu no endereço temporário deve habilitar notificações no domínio fixo.

Em um volume novo de staging, o Compose monta o incremental de inscrições junto do SQL inicial. Em um volume existente, aplique o SQL incremental idempotente após disponibilizar o banco:

```bash
docker compose -p iservi-staging --env-file .env \
  -f docker-compose.production.yml -f docker-compose.staging.yml \
  exec -T database sh -c 'MYSQL_PWD="$MARIADB_ROOT_PASSWORD" mariadb -uroot "$MARIADB_DATABASE" < /docker-entrypoint-initdb.d/002-push-subscriptions.sql'
```

## Subir e validar

```bash
npm run staging:config
npm run staging:build
npm run staging:up
curl -fsS http://127.0.0.1:8080/api/v1/health
npm run staging:tunnel
npm run staging:ps
curl -fsS https://staging.iservi.com.br/api/v1/health
curl -fsSI https://staging.iservi.com.br/sw.js
```

O comando do túnel inicia o conector em segundo plano no projeto de staging. Após confirmar o acesso pelo hostname fixo, encerre o processo do Quick Tunnel antigo, se ainda estiver em execução. Para uma instância de homologação local, use apenas `staging:up` e defina `STAGING_FRONTEND_URL=http://127.0.0.1:8080` no seu próprio checkout.

Na URL HTTPS, baixe novamente o QR Code de uma mesa existente e escaneie-o no celular. Confira que o endereço abre `/cliente?mesa=…` no domínio configurado e identifica a mesma mesa. O QR Code novo incorpora o token já salvo. Substitua impressões e imagens baixadas com a URL antiga.

No mesmo domínio, confirme no navegador que `/sw.js` está ativo. Abra o atendimento pelo QR Code em um navegador com suporte a Web Push, habilite as notificações e conclua o pagamento em outro dispositivo. Confirme que o navegador inscrito recebe a notificação com a página em segundo plano.

## Atualizar e encerrar

Para publicar código, execute `npm run staging:build` e `npm run staging:up`. Depois de mudar `STAGING_FRONTEND_URL` ou `STAGING_VAPID_*`, execute `npm run staging:up` para aplicar as variáveis e `npm run staging:restart -- nginx` para o Nginx resolver novamente o endereço interno do backend. Se o Nginx tiver sido recriado, reinicie também o conector com `npm run staging:restart -- cloudflared` no host compartilhado.

Use `npm run staging:logs -- --tail=100 database backend nginx cloudflared` para diagnosticar falhas. Se a URL pública falhar e a saúde local estiver OK, confira DNS, certificado, rota publicada e estado do conector no painel. Se o Compose recusar `!override`, verifique sua versão. Use `staging:config` para validar a interpolação sem imprimir os valores.

`npm run staging:down` encerra também o conector e preserva os volumes `iservi-staging_mariadb_data` e `iservi-staging_product_uploads`. Execute-o sem `--volumes` para manter os dados. O hostname volta a servir a aplicação quando o mesmo túnel reconecta.
