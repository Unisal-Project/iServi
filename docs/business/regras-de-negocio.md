# iServi — Regras de Negócio e Contexto do Projeto

## 1. Objetivo

O iServi é um sistema de gerenciamento de pedidos, comandas, mesas, produtos, estoque, pagamentos e impressão de pedidos para estabelecimentos.

Este documento deve ser usado como referência por desenvolvedores e agentes de IA antes de criar ou alterar funcionalidades do projeto.

A implementação deve preservar as regras descritas aqui, salvo quando houver decisão explícita de mudança de escopo.

---

## 2. Como interpretar esta referência

Este documento reúne as regras da V1. Consulte a [arquitetura](../architecture/overview.md) para a estrutura técnica e [divergências](divergencias.md) para diferenças entre regras, contratos e implementação que precisam de decisão da equipe.

## 3. Perfis de acesso

O cliente usa o QR da mesa sem conta própria. Pode consultar o cardápio e a comanda, criar pedidos com atendimento aberto, pedir a conta e chamar o garçom. A regra de cancelamento pelo cliente está na seção 14 e depende de revisão quanto à exposição do fluxo.

O funcionário opera mesas, pedidos e pagamentos. O administrador do restaurante também pode gerenciar catálogo, estoque, mesas e configurações, cancelar pedidos, reabrir contas e consultar indicadores financeiros. O administrador da plataforma (Nupify) tem exclusividade sobre a gestão de usuários do restaurante e presta suporte operacional e administrativo, com visão de pedidos e atendimentos sem valores de venda, pagamentos ou indicadores financeiros. Veja a [matriz de permissões da API](../backend/authentication.md) para o acesso efetivo por rota.

## 4. Modelo conceitual principal

O centro do sistema é o atendimento/comanda, e não o pedido.

```text
Mesa
  ↓
Atendimento
  ↓
Pedido 1
Pedido 2
Pedido 3
  ↓
Itens
  ↓
Pagamento
  ↓
Fechamento
```

Uma mesma mesa pode ter vários atendimentos ao longo do tempo, mas somente um atendimento ativo por vez.

---

## 5. Mesas e QR Code

Cada mesa tem um QR com token único e persistente. O token identifica a mesa. O estado da mesa é derivado do atendimento e pode ser disponível, ocupado, conta solicitada ou aguardando pagamento. Uma mesa admite no máximo um atendimento ativo. Consulte o [contrato operacional](mesas-e-atendimentos.md) para URLs, estados e verificação.

## 6. Atendimento / Comanda

Status da V1:

```text
OPEN
CLOSING_REQUESTED
AWAITING_PAYMENT
CLOSED
CANCELLED
```

### OPEN

- aceita pedidos;
- cliente pode fazer novos pedidos;
- funcionário pode operar normalmente.

### CLOSING_REQUESTED

- cliente solicitou a conta;
- funcionário deve realizar fechamento/pagamento;
- não deve ser tratado como atendimento encerrado.

### AWAITING_PAYMENT

- conta aguardando recebimento;
- atendimento ainda não está encerrado e a mesa não está livre;
- novos pedidos não são permitidos.

### CLOSED

- atendimento finalizado;
- não aceita novos pedidos;
- representa histórico;
- mesa volta a ficar livre.

### CANCELLED

- atendimento cancelado administrativamente;
- não aceita novos pedidos.

---

## 7. Produtos

Cada produto possui:

- categoria;
- nome;
- descrição;
- preço atual;
- quantidade em estoque;
- `track_stock` (controlar estoque);
- `available`;
- `active`.

### `active`

Indica se o produto faz parte do catálogo do estabelecimento.

`active = false` significa que o produto foi descontinuado ou removido do cardápio.

Produtos ativos precisam de uma categoria principal. Produtos inativos podem ter `category_id = NULL` depois da exclusão da categoria; criar, editar ou reativar um produto exige categoria válida. A exclusão simples de categoria com apenas inativos desvincula esses produtos e preserva os registros. Com produtos ativos, é necessário escolher entre mover para outra categoria ou excluir a categoria e retirar seus produtos do cardápio (`active=false`, categoria nula), após confirmação. Os produtos que tinham essa categoria apenas como adicional continuam no cardápio e perdem só a associação. Pedidos, itens vendidos e relatórios são preservados.

### `available`

Indica disponibilidade operacional atual.

Um produto pode continuar cadastrado e ativo, mas estar temporariamente indisponível.

### `track_stock`

Indica se o produto tem controle de estoque. Padrão `true` (produtos existentes continuam controlados).

Com `track_stock = false` (ex.: itens feitos sob demanda):

- o produto nunca esgota; a disponibilidade depende só de `available` e `active`;
- pedidos não debitam nem repõem estoque e não geram `stock_movements`;
- a quantidade por pedido fica limitada apenas pelos limites gerais do pedido (QR: até 99 por item e 100 itens por pedido).

Ligar o controle exige informar uma quantidade válida.

Limitação conhecida: trocar "Controlar estoque" com pedidos abertos não reconcilia retroativamente o estoque. Cancelamentos/edições seguem o modo atual do produto; evite essa troca até finalizar os pedidos envolvidos.

### Destaques

`products.featured` é um booleano, padrão false, escolhido pelo administrador. Destaque organiza a seção do cardápio; não altera preço, promoção, disponibilidade ou estoque.

### Fotos

Um produto aceita até três fotos. A primeira é a capa e as demais aparecem na galeria do detalhe no cardápio. O painel permite trocar a capa e remover fotos. Consulte [publicação de imagens](../deployment/production.md#fotos-e-miniaturas-após-o-deploy) para formatos, limites e miniaturas.

### Estoque zero

Quando o produto controla estoque e:

```text
stock_quantity = 0
```

o produto deve ser considerado indisponível para novos pedidos e aparece como "Esgotado" no cardápio.

O backend deve impedir a inclusão do produto sem estoque.

---

## 8. Preço dos produtos

`products.price` representa o preço atual.

`order_items.unit_price` representa o preço cobrado no momento da venda.

Nunca recalcular uma venda antiga usando `products.price`.

### Promoções

Produto e categoria podem ter promoção: tipo `PERCENT` (inteiro de 1 a 90) ou `AMOUNT` (valor em R$), mais `promo_active` (liga/desliga sem perder a configuração) e datas opcionais `promo_starts_at`/`promo_ends_at`.

A promoção vale quando está ligada e dentro da vigência: início vazio ou já passado, e fim vazio ou ainda não alcançado. Sem fim, vale até o administrador desligar.

O preço efetivo de um produto é calculado sempre pelo servidor, no momento do pedido:

- a promoção do produto, se vigente, vence a da categoria;
- senão vale a promoção da categoria PRINCIPAL; categorias adicionais nunca aplicam promoção;
- o cálculo é em centavos (percentual arredondado half-up) e o preço final mínimo é R$ 0,01;
- promoção de produto em R$ maior ou igual ao preço é recusada no cadastro;
- promoção de categoria em R$ maior ou igual ao preço de um produto é ignorada para aquele produto (ele fica com o preço cheio).

O preço cobrado (`order_items.unit_price`) é o preço efetivo, nos pedidos via QR Code, via funcionário/admin e na inclusão de itens novos ao editar um pedido. Itens que já estavam no pedido mantêm o preço da venda. O cliente nunca envia preço nem desconto.

Conta, fechamento e relatórios usam o `unit_price` gravado, por isso refletem a promoção sem cálculo adicional.

Exemplo:

```text
Produto vendido por R$20,00
Preço alterado depois para R$25,00
Venda antiga continua registrada como R$20,00
```

---

## 9. Criação de pedido

Um pedido pertence sempre a um atendimento.

Um atendimento pode possuir vários pedidos.

Fluxo obrigatório:

```text
receber pedido
    ↓
validar atendimento ativo
    ↓
validar produtos
    ↓
validar disponibilidade
    ↓
validar estoque
    ↓
criar order
    ↓
criar order_items
    ↓
debitar estoque
    ↓
registrar stock_movements
    ↓
criar print_job
```

A criação deve ocorrer dentro de uma transação.

Se qualquer etapa falhar, toda a operação deve sofrer rollback.

---

## 10. Estoque

O estoque é debitado no momento em que o pedido é confirmado/criado.

As regras desta seção e das seções 11 e 16 valem apenas para produtos com `track_stock = true` (ver seção 7).

Exemplo:

```text
estoque inicial: 20
pedido: 2 unidades

novo estoque: 18
```

Movimento:

```text
type = SALE
quantity = -2
```

A atualização do estoque deve ser segura contra concorrência.

O sistema nunca deve permitir:

```text
stock_quantity < 0
```

---

## 11. Histórico de estoque

Toda alteração significativa deve gerar `stock_movements`.

Tipos:

```text
ENTRY
EXIT
ADJUSTMENT
SALE
CANCELLATION
```

### ENTRY

Entrada normal de estoque.

### EXIT

Saída administrativa não associada diretamente a venda.

### SALE

Débito originado por pedido.

### ADJUSTMENT

Alteração manual ou diferença gerada por edição de pedido.

### CANCELLATION

Reposição decorrente de cancelamento.

Sempre que possível, o movimento deve guardar referência ao pedido e/ou item responsável.

---

## 12. Alteração de pedido

Funcionário ou administrador pode alterar um pedido quando necessário.

Ao alterar quantidade, não recalcular todo o estoque: movimentar apenas a diferença.

Exemplo:

```text
pedido tinha 2 unidades
foi alterado para 3

diferença = +1 item no pedido
estoque = -1
```

Movimento:

```text
type = ADJUSTMENT
quantity = -1
```

Outro exemplo:

```text
pedido tinha 3
foi alterado para 1

diferença = -2 itens no pedido
estoque = +2
```

Movimento:

```text
type = ADJUSTMENT
quantity = +2
```

Toda alteração que afete pedido e estoque deve usar transação.

---

## 13. Personalização de pedido

Na V1, personalizações simples podem ser armazenadas em:

```text
order_items.notes
```

Exemplo:

```text
sem cebola
sem tomate
adicionar gelo
```

A V1 não possui estrutura complexa de:

- ingredientes;
- grupos de adicionais;
- modificadores;
- combos;
- opções pagas.

Esses recursos ficam fora do escopo inicial.

---

## 14. Cancelamento pelo cliente

Regra definida para o cliente: cancelar somente até 5 minutos após a criação. **Divergência em aberto:** a API atual não registra uma rota pública de cancelamento de pedido. Consulte [divergências](divergencias.md).

Regra:

```text
agora <= order.created_at + 5 minutos
```

A validação dos 5 minutos pertence ao backend, não ao banco.

Ao cancelar:

1. verificar se pedido ainda não está cancelado;
2. alterar status para `CANCELLED`;
3. registrar `cancelled_at`;
4. registrar `cancellation_source = CUSTOMER`;
5. repor estoque;
6. registrar `CANCELLATION`;
7. manter histórico do pedido.

Pedido cancelado nunca deve ser excluído fisicamente.

---

## 15. Cancelamento e exclusão administrativa

Somente ADMIN cancela ou exclui pedidos pelo painel (`backend/src/shared/api-access.ts`). O motivo é opcional para o operador: a ação Excluir usa o padrão **"Excluído pelo administrador"**; o DTO recebe um motivo válido (3–500 caracteres). A devolução ao estoque é opcional e depende da confirmação de que os itens não foram usados. Funcionários não têm essa permissão.

Cancelamento preserva os registros históricos e grava `cancelled_at`, `cancelled_by`, `cancellation_source`, `cancellation_reason` e `restore_stock`. Não é uma exclusão física de itens vendidos.

---

## 16. Reposição de estoque no cancelamento

Nem todo cancelamento administrativo significa que o item pode voltar ao estoque.

Exemplo:

```text
café já preparado
pedido cancelado financeiramente
```

O café não retorna fisicamente ao estoque.

Por isso existe:

```text
restore_stock
```

### `restore_stock = true`

- repor quantidade;
- gerar `stock_movements` do tipo `CANCELLATION`.

### `restore_stock = false`

- não modificar estoque;
- registrar apenas o cancelamento financeiro/operacional.

Para cancelamento normal do cliente dentro dos 5 minutos, a regra padrão da V1 é restaurar estoque.

---

## 17. Idempotência de cancelamento

Um pedido já cancelado não pode ser cancelado novamente.

Nunca permitir:

```text
CANCELLED
  ↓
CANCELLED novamente
```

Isso evitaria duplicar a reposição de estoque.

A regra deve ser validada antes de qualquer movimentação.

---

## 18. Status de pedidos

Os únicos estados atuais são `PENDING` e `CANCELLED` (`backend/prisma/schema.prisma`, enum OrderStatus). Não existe fluxo de preparo ou entrega no sistema atual. O pedido pendente integra o consumo; o cancelado permanece no histórico e não integra o consumo cobrado. O fechamento pertence ao atendimento, não muda o pedido para um estado de preparo/entrega.

---

## 19. Conta e pagamentos

O cliente pode solicitar fechamento da conta.

Isso altera o atendimento para:

```text
CLOSING_REQUESTED
```

O pagamento pertence ao atendimento, não ao pedido individual.

Métodos da V1:

```text
CASH
PIX
CREDIT_CARD
DEBIT_CARD
```

Status:

```text
PENDING
PAID
CANCELLED
```

O contrato de confirmação integral registra método nulo. A diferença entre esse caminho e o fechamento discriminado está em [divergências](divergencias.md).

Um atendimento pode possuir mais de um pagamento.

Isso permite pagamento dividido.

Exemplo:

```text
total: R$100

PIX: R$50
CREDIT_CARD: R$50
```

---

## 20. Fechamento do atendimento

O administrador também edita nome, contato, endereço, horários, imagem de boas-vindas e virada operacional. O frontend remove o banner junto ao salvamento das configurações, enviando `removeBanner: true` no `PUT /settings`.

A taxa de serviço é configurável pelo administrador: de **0% a 20%**, com até duas casas decimais, padrão **10%**. O sistema possui um restaurante e uma configuração (`restaurant_settings`, id=1). Funcionários podem consultar a taxa, mas não alterá-la.

No fechamento com pagamentos discriminados, o backend consulta o percentual do banco dentro da transação. Calcula em centavos, arredondando a taxa, e exige que os pagamentos somem consumo + taxa. Taxa 0% ou isenção (`serviceFeeWaived`) cobram só o consumo. O valor efetivamente cobrado é gravado em `attendances.service_fee`; alterações futuras do percentual não mudam contas fechadas, histórico ou relatórios. Informações públicas do restaurante não incluem o percentual.

Antes do fechamento financeiro, validar:

- atendimento não está fechado;
- valor pago corresponde ao total exigido pelo contrato;
- pagamentos válidos estão registrados.

No fechamento financeiro:

```text
attendance.status = CLOSED
closed_at = agora
closed_by = funcionário/admin
```

A mesa passa a ser considerada livre. A transição manual em Mesas é um fluxo distinto, permitido para liberar conta sem pedidos ativos.

### Reabrir uma conta

A reabertura administrativa preserva o histórico: pagamentos PAID passam a CANCELLED (estorno lógico, não transferência financeira), o atendimento volta a OPEN e a mesa volta a ocupada. Os relatórios contabilizam somente pagamentos PAID. O fluxo segue lock mesa → atendimento (`prisma-admin-order.repository.ts`, reopen).

---

## 21. Histórico de vendas

Não criar tabela específica chamada `sales_history`.

O histórico deve ser obtido a partir de:

```text
attendances
orders
order_items
payments
```

Atendimentos fechados formam o histórico operacional.

Pagamentos `PAID` formam a base financeira. Pedidos também recebem `daily_number` único por `business_date`. A data operacional usa a virada configurada pelo restaurante, com padrão 05:00 e fuso padrão `America/Sao_Paulo`.

---

## 22. Faturamento

Não persistir tabelas redundantes como:

```text
daily_revenue
monthly_revenue
```

O faturamento deve ser calculado a partir de pagamentos com:

```text
status = PAID
```

usando `paid_at`.

Isso permite obter:

- faturamento diário;
- faturamento mensal;
- histórico;
- ticket médio;
- produtos mais vendidos;
- quantidade vendida.

Regra dos relatórios:

- receita (faturamento) = soma dos pagamentos `PAID` − taxa de serviço dos
  atendimentos fechados, ou seja, receita **líquida** da taxa;
- ticket médio = receita líquida ÷ pedidos concluídos;
- a taxa de serviço é exibida à parte ("Taxa de serviço arrecadada");
- a distribuição por forma de pagamento usa os valores pagos (com taxa);
  pagamentos sem forma registrada (ex.: fechamento pelo QR) aparecem como
  "Não informado" (`UNKNOWN`), nunca como dinheiro.

---

## 23. Impressão e ESP32

A criação de pedidos e a solicitação de conta geram trabalhos persistidos de impressão. O painel também envia impressão manual à ponte HTTP externa. O consumidor automático e o firmware ESP32 são desenho previsto, sem implementação confirmada neste repositório. Veja [a arquitetura](../architecture/overview.md#fronteiras-externas).

Tabela:

```text
print_jobs
```

Tipos:

```text
ORDER
BILL
```

Status:

```text
PENDING
SENT
PRINTED
FAILED
```

A impressão não deve depender de uma única tentativa síncrona.

Fluxo previsto para consumo da fila:

```text
pedido criado
    ↓
print_job PENDING
    ↓
dispositivo/processo busca trabalho
    ↓
imprime
    ↓
PRINTED
```

Em caso de erro:

```text
FAILED
```

O sistema pode tentar novamente.

A existência de `print_jobs` evita perder pedidos caso ESP32/impressora estejam temporariamente indisponíveis.

---

## 24. Transações obrigatórias

Usar transações do Prisma em operações que afetam múltiplas entidades.

Principalmente:

### Criação de pedido

```text
order
order_items
products.stock_quantity
stock_movements
print_jobs
```

### Alteração de pedido

```text
order_items
products.stock_quantity
stock_movements
```

### Cancelamento

```text
orders
products.stock_quantity
stock_movements
```

Se uma operação falhar:

```text
ROLLBACK
```

Nenhum estado parcial deve permanecer salvo.

---

## 25. Integridade e segurança de estoque

Antes de debitar estoque:

- validar quantidade solicitada;
- garantir que produto está ativo;
- garantir que produto está disponível;
- garantir que existe estoque suficiente.

A atualização deve ser atômica ou protegida por transação/condição adequada para evitar corrida entre pedidos simultâneos.

Exemplo que deve ser evitado:

```text
estoque = 2

Cliente A pede 2
Cliente B pede 2

resultado inválido:
estoque = -2
```

Somente uma operação deve conseguir consumir as duas unidades.

---

## 26. Regras de exclusão

Registros históricos importantes não devem ser apagados fisicamente durante a operação normal.

Preferir:

```text
active = false
status = CANCELLED
```

em vez de `DELETE`.

Especialmente para:

- produtos vendidos;
- pedidos;
- atendimentos;
- pagamentos;
- movimentos de estoque.

Isso preserva auditoria e relatórios.

---

## 27. Modelo persistido

A [visão de arquitetura](../architecture/overview.md#persistência) aponta para os schemas atuais. Mesa, atendimento, pedido, item, movimento de estoque, pagamento e impressão formam a trilha operacional. Catálogo, usuários, chamados, configurações, numeração diária e inscrições completam o modelo.

## 28. Relacionamentos principais

Uma mesa tem vários atendimentos históricos. Um atendimento tem vários pedidos e pagamentos. Pedidos têm itens que referenciam produtos; movimentos relacionam produto e, quando aplicável, pedido ou item. Produtos têm categoria principal e podem ter categorias adicionais. Trabalhos de impressão referenciam pedido ou atendimento, conforme o tipo.

## 29. Regras que NÃO devem ser inferidas automaticamente

Um agente de IA não deve adicionar sem decisão explícita:

- cadastro obrigatório de clientes;
- reservas de mesas;
- cupons;
- programa de fidelidade;
- múltiplos estabelecimentos;
- delivery;
- ingredientes complexos;
- adicionais pagos;
- combos;
- divisão individual da comanda por pessoa;
- integração com gateway de pagamento;
- fechamento automático do atendimento;
- exclusão automática de dados históricos.

Esses pontos não fazem parte da V1 atual.

---

## 30. Princípios para novas implementações

Antes de alterar banco ou regras:

1. verificar se a mudança pertence à V1;
2. preservar histórico de vendas;
3. preservar histórico de estoque;
4. não duplicar informações calculáveis;
5. usar transação quando houver múltiplas alterações relacionadas;
6. não permitir estoque negativo;
7. não permitir dois atendimentos ativos na mesma mesa;
8. não permitir pedido em atendimento fechado;
9. não recalcular venda antiga usando preço atual;
10. não apagar pedidos cancelados;
11. registrar autoria e motivo de ações administrativas relevantes;
12. manter responsabilidades de validação de negócio no Service/backend.

---

## 31. Fluxo operacional implementado

QR da mesa → boas-vindas e cardápio → criação de pedido e débito de estoque → operação pelo painel → solicitação de conta → registro de pagamento e fechamento → liberação da mesa e histórico. O preparo e a entrega são atividades do estabelecimento, sem estados correspondentes no sistema.

## 32. Fonte de verdade

Este documento representa as regras de negócio definidas para a primeira versão do iServi.

Em caso de divergência entre implementação gerada automaticamente e este documento, a implementação deve ser revisada de acordo com estas regras, salvo quando uma mudança posterior de requisito tiver sido explicitamente aprovada.
