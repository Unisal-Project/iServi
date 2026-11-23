# Autenticação e permissões da API

A API usa o prefixo `/api/v1`. O [hook global](../../backend/src/shared/api-access.ts) autentica requisições protegidas e autoriza por método e rota. Rotas protegidas novas precisam entrar na política para serem acessíveis. Um token ausente, inválido ou revogado resulta em 401. Uma sessão válida sem a permissão necessária resulta em 403.

## Matriz de acesso

| Área | Nupify (`PLATFORM_ADMIN`) | Restaurante (`ADMIN`) | Funcionário (`EMPLOYEE`) |
| --- | --- | --- | --- |
| Painel e indicadores financeiros | Bloqueado | Permitido | Bloqueado |
| Relatório de vendas (`GET /reports/sales`) | Bloqueado | Permitido | Bloqueado |
| Catálogo, estoque e promoções | Gestão | Gestão | Leitura pública de catálogo |
| Mesas | Gestão e operação, sem QR ou token | Gestão, operação e QR | Operação e QR |
| Pedidos | Consulta com itens e estado, sem valores de venda ou dados de pagamento | Operação completa | Criação, edição e consulta operacional |
| Atendimentos | Consulta de estado, abertura e solicitação de conta | Operação completa | Consulta, abertura, solicitação e fechamento |
| Totais da conta, pagamentos e alterações financeiras | Bloqueados | Permitidos | Permitidos para operar a conta |
| Cancelar pedido ou atendimento e reabrir conta | Bloqueado | Permitido | Bloqueado |
| Configurações do restaurante | Gestão | Gestão | Somente dados necessários à operação |
| Gestão de usuários | Consulta contas, cria funcionários e gerencia contas `ADMIN` e `EMPLOYEE` | Bloqueada | Bloqueada |
| Próprio perfil e logout | Permitido | Permitido | Permitido na API |
| Navegação do painel | Mesas, pedidos, cardápio, usuários e configurações | Painel do restaurante, incluindo finanças | Mesas e pedidos |

O cliente continua sem conta própria. Saúde, login, leitura de catálogo e informações públicas do restaurante permanecem acessíveis sem JWT. Identificação, pedido, conta e chamado usam o token da mesa. As rotas de confirmação e inscrição de pagamento usam a credencial do cliente. O fluxo está descrito em [Mesas e atendimentos](../business/mesas-e-atendimentos.md).

## Sessão

- `POST /auth/login` valida e-mail e senha com bcrypt e devolve `user` e `accessToken`, com validade de oito horas. Envie o token em `Authorization: Bearer <accessToken>`.
- [authenticate.ts](../../backend/src/shared/authenticate.ts) confere assinatura, usuário ativo e versão `tv`, e usa o papel atual do banco. Mudança de papel, desativação, senha nova e logout invalidam as sessões anteriores. Tokens antigos sem `tv` são lidos como versão zero.
- `PATCH /auth/me`, `PATCH /auth/password` e `POST /auth/me/avatar` cuidam do perfil próprio. A recuperação pública de senha é informativa. A troca de senha autenticada exige a senha atual.
- `POST /auth/register` exige `PLATFORM_ADMIN` e cria `EMPLOYEE`. O painel de usuários mantém a sessão do operador ao cadastrar a conta. O hash de senha fica fora das respostas.

## Isolamento dos dados financeiros

No `GET /orders`, a projeção de suporte omite preços históricos, taxa cobrada, métodos e valores de pagamento. O bloqueio de endpoints complementares impede acessar esses campos via pedidos por atendimento ou totais, ou inferir valores pela validação de pagamentos. A API também omite `menuUrl` das respostas de mesa para suporte e bloqueia o PNG, pois o QR daria acesso ao consumo na API pública. Vitrine e preços vigentes do catálogo são públicos. Um QR físico obtido independentemente continua concedendo exatamente o acesso previsto para o cliente.

`GET /settings/operation` retorna a virada operacional e, para ADMIN e EMPLOYEE, o percentual necessário ao fechamento. A taxa configurada é um parâmetro administrativo e não contém valores cobrados ou receita. As configurações completas ficam restritas à gestão.

A Nupify tem exclusividade sobre `GET /users`, `GET /users/:id`, `PATCH /users/:id`, `DELETE /users/:id` e o cadastro administrativo. Pode editar nome, e-mail, senha, papel e situação de contas do restaurante. A troca de papel aceita `ADMIN` ou `EMPLOYEE`. Contas `PLATFORM_ADMIN` são provisionadas e administradas fora desses endpoints. As restrições financeiras continuam aplicadas à sessão Nupify, embora a gestão de credenciais permita provisionar contas com permissões distintas.

## Provisionamento seguro

Aplique a [migração de perfil](../../backend/prisma/sql/user-platform-role.sql) ao banco existente e gere o Prisma Client antes de implantar o backend atualizado. O SQL só amplia o enum. Nenhuma conta é promovida automaticamente.

Um operador autorizado, com acesso administrativo ao banco, deve provisionar uma conta dedicada com e-mail individual, credencial forte e hash bcrypt, usando o perfil `PLATFORM_ADMIN` diretamente no banco. Gere, armazene e entregue a credencial por canal privado. Caso seja necessário atribuir o perfil a uma conta dedicada já existente, confirme sua identidade e incremente `token_version` na mesma atualização para revogar sessões prévias. Depois de provisionada, a Nupify pode cadastrar um funcionário e atribuir a ele o papel ADMIN. Os DTOs públicos e administrativos não aceitam o perfil Nupify em cadastro ou mudança de papel.

## Limites operacionais

O modelo tem um restaurante por instalação. Usuários e registros operacionais não têm chave de estabelecimento no schema, então o RBAC segmenta funções da mesma instalação. Uma implantação para vários restaurantes precisa de instâncias e bancos isolados ou de um projeto explícito de multiestabelecimento.

O [limitador](../../backend/src/modules/auth/auth-rate-limit.ts) usa Valkey quando disponível e memória por processo como fallback. Antes do bcrypt, login limita a 30 tentativas por minuto por IP e a cinco por 15 minutos por combinação de IP e e-mail. Login bem-sucedido limpa o contador da combinação. Cadastro, perfil, senha e avatar usam cinco requisições por minuto por IP e rota, com a chave `mf:v1:ratelimit:<rota>:<ip>`.
