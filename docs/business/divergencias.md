# Divergências para revisão

As observações abaixo descrevem o código atual e a diferença encontrada na auditoria. As [regras de negócio](regras-de-negocio.md) permanecem como referência para decisões de produto.

| Tema | Evidência observada | Decisão pendente |
| --- | --- | --- |
| Cancelamento pelo cliente | A regra prevê até cinco minutos e reposição de estoque. [Rotas por QR](../../backend/src/modules/tables/table.routers.ts) não expõem cancelamento. `POST /orders/:id/cancel` é ADMIN em [api-access.ts](../../backend/src/shared/api-access.ts). | Confirmar se e quando disponibilizar cancelamento autônomo. |
| Fechamento integral e discriminado | O [repositório de pagamentos](../../backend/src/modules/payments/repositories/prisma-payment.repository.ts) permite confirmar uma conta solicitada pelo subtotal, com método nulo. O outro endpoint aplica a taxa configurada ou isenção e exige formas de pagamento. | Definir se os dois contratos continuarão expostos e qual regra financeira cada um deve seguir. |
| Impressão e ESP32 | O banco recebe trabalhos `ORDER` e `BILL`. O [painel](../../frontend/src/services/print.service.ts) chama uma ponte HTTP na impressão manual. Não foi localizado consumidor automático nem firmware neste repositório. | Confirmar se a ponte e o consumo da fila vivem em outro projeto e quem opera o reenvio. |
| Autenticação do fluxo QR | O [checklist histórico](../archive/jwt-backend-checklist.md) propunha limitação por IP/token nas rotas públicas. O hook global as isenta de JWT e não há limitador genérico registrado para esse grupo. O chamado de garçom tem suas próprias regras de negócio. | Definir política de exposição e limitação do fluxo público. |
| Web Push em banco novo | O [SQL inicial](../../iservi_schema_v1.sql) não cria `push_subscriptions`. O [Compose de homologação](../../docker-compose.staging.yml) monta o incremental na inicialização. Os outros perfis precisam aplicá-lo para habilitar o recurso. | Decidir se as instalações devem provisionar essa tabela em todos os ambientes. |
| Origem pública de homologação | O hostname padrão é configurado no Compose e no modelo de ambiente. DNS, certificado e túnel são estado externo ao repositório. | Confirmar a origem com quem opera a homologação antes de imprimir novos QRs. |
