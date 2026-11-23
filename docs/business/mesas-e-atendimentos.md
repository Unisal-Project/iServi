# Mesas, QR Code e atendimentos

Este guia descreve o contrato operacional. As [regras de negócio](regras-de-negocio.md) reúnem os invariantes do domínio.

## Identificação da mesa

A mesa recebe um token aleatório único em `restaurant_tables.qr_token`. Alterações de nome, número e ativação preservam o token. O PNG é gerado a partir de `<FRONTEND_URL>/cliente?mesa=<token>`; prévia, download e impressão no painel usam `menuUrl`. Ao trocar o domínio ou o caminho, gere novamente os códigos físicos. Consulte [acesso pelo celular](../deployment/development.md#acesso-pelo-celular) e [homologação](../deployment/staging.md).

| Rota sob `/api/v1` | Contrato |
| --- | --- |
| `POST /tables` | ADMIN cadastra número e nome, com capacidade opcional e ativação. O backend gera o token |
| `GET /tables`, `GET /tables/:id` | Mesa com `menuUrl`, estado e `attendanceId` (string ou nulo) |
| `GET /tables/:id/qrcode` | PNG para usuário interno autenticado |
| `GET /tables/by-token/:token` | Identificação pública com `id`, `number` e `name`. Token desconhecido ou mesa inativa retorna 404 |
| `GET /tables/by-token/:token/bill` | Itens não cancelados e identificação e estado do atendimento ativo. Sem atendimento, retorna lista vazia |
| `POST /tables/by-token/:token/orders` | Valida mesa, itens, disponibilidade e estoque. Cria atendimento `OPEN` se necessário e grava o pedido. Retorna `paymentSession` |
| `POST /tables/by-token/:token/request-closing` | Solicita fechamento de atendimento aberto e devolve `paymentSession` se o corpo informar o `attendanceId` esperado |
| `POST /tables/by-token/:token/call-waiter` | Registra chamado para acompanhamento no painel |

Abrir a URL e consultar o cardápio não criam atendimento. O primeiro pedido válido pode abrir o atendimento na mesma transação. O token identifica a mesa e não prova presença física. A consulta e as ações públicas derivam a mesa do token. Se houver ID esperado no pedido de fechamento, ele é usado para detectar mudança de atendimento.

## Estado operacional

| Mesa na API | Atendimento ativo | Próxima ação padrão |
| --- | --- | --- |
| `available` | Nenhum | Iniciar atendimento ou receber o primeiro pedido |
| `occupied` | `OPEN` | Receber pedidos ou solicitar a conta |
| `closing_requested` | `CLOSING_REQUESTED` | Aguardar ou registrar pagamento |
| `awaiting_payment` | `AWAITING_PAYMENT` | Registrar pagamento ou liberar conta sem consumo |

`CLOSED` e `CANCELLED` são históricos. O índice `uq_attendances_one_active_per_table` inclui os três estados ativos. Mesa com histórico não pode ser excluída fisicamente. Desativar mesa com atendimento ativo também é bloqueado.

O painel opera a transição com `PATCH /tables/:id/status`. Para iniciar, envie `{"status":"occupied","attendanceId":null}`. Nas ações seguintes, envie o identificador atual e o próximo estado. O repositório bloqueia a mesa para validar o estado real em transação. Dados inválidos geram 400, mesa inexistente 404 e transição inválida ou atendimento desatualizado 409. Solicitar a conta grava o horário e enfileira trabalho `BILL`. A liberação manual por essa rota é bloqueada quando existem pedidos não cancelados.

## Pagamento e confirmação

A equipe registra pagamento e encerra a conta pelas rotas de atendimento. `POST /attendances/:attendanceId/close` usa pagamentos discriminados e a taxa configurada. `POST /attendances/:attendanceId/confirm-payment` é o contrato de confirmação integral de uma conta já solicitada, com método ausente e valor igual ao consumo. Consulte as [regras financeiras](regras-de-negocio.md#19-conta-e-pagamentos) e a [divergência entre os contratos](divergencias.md).

A confirmação é consultada pelo cliente com a credencial devolvida no pedido ou na solicitação de conta com corpo. A inscrição do navegador por Web Push é opcional e usa a mesma credencial. Após fechar e consultar a confirmação, o cliente pode encerrar a sessão local. Veja as [rotas do frontend](../frontend/routing.md) e a [configuração de Web Push](../deployment/staging.md#web-push).

## Verificação

Cadastre duas mesas e escaneie os códigos com o celular. Confirme a identificação em cada código, recarregue e faça um pedido de teste. Verifique que abrir o QR, por si só, não cria atendimento. Renomeie a mesa e teste o código anterior. Desative uma mesa sem atendimento ativo e confira que tanto seu token antigo quanto um token desconhecido são recusados. No painel, teste a sequência de estados e confira o bloqueio de liberação de uma conta com consumo. Use o [ambiente de integração](../testing/integration-tests.md) para validação de persistência.
