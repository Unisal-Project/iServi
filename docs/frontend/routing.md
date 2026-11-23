# Navegação do frontend

O [AppRouter](../../frontend/src/routers/AppRouter.tsx) usa `BrowserRouter`, separa a sessão administrativa do cliente e reposiciona a rolagem entre telas. A seleção de pedido pode preservar a rolagem. Os layouts usam `Outlet` e fornecem o contexto visual.

## Entrada e painel

| URL | Tela |
| --- | --- |
| `/` | Login. Com `?mesa=…`, redireciona ao cardápio preservando a query |
| `/login` | Login com API |
| `/redefinir-senha` | Tela informativa de recuperação |
| `/admin`, `/admin/dashboard` | Redirecionamento inicial e dashboard |
| `/admin/pedidos/:orderId?` | Pedidos e seleção por ID |
| `/admin/mesas` | Operação de mesas |
| `/admin/cardapio`, `/admin/cardapio/produtos` | Visão inicial e lista de produtos |
| `/admin/cardapio/categorias`, `/admin/cardapio/categorias/todas` | Visão inicial e lista de categorias |
| `/admin/cardapio/promocoes` | Promoções |
| `/admin/ver-cardapio` | Prévia administrativa do cardápio real |
| `/admin/ver-cardapio/produto/:productId`, `/admin/ver-cardapio/carrinho`, `/admin/ver-cardapio/conta` | Navegação de prévia com carrinho isolado e sem envio de pedidos |
| `/admin/relatorios`, `/admin/configuracoes` | Relatórios e configurações |
| `/admin/usuarios` | Gestão de usuários, exclusiva da Nupify |

O guard de frontend verifica sessão e seção autorizada em `/admin/*`. O administrador abre o dashboard ao entrar. Suporte e funcionários abrem Mesas. O acesso direto a uma seção proibida redireciona para a primeira página permitida. A autorização de cada operação pertence à [API](../backend/authentication.md). O [router administrativo](../../frontend/src/routers/AdminRoutes.tsx) mantém estado compartilhado de mesas, pedidos e catálogo enquanto o painel está montado.

## Cliente

| URL | Tela |
| --- | --- |
| `/cliente` | Boas-vindas, destino do QR de mesa e do QR geral do cardápio |
| `/cardapio` | Cardápio consultado na API |
| `/produto/:productId` | Detalhes consultados por ID e galeria horizontal das fotos cadastradas |
| `/carrinho`, `/confirmar-pedido` | Carrinho local e revisão antes de enviar o pedido pela API |
| `/conta` | Consumo atual, pedido de fechamento e chamado de garçom |
| `/pagamento-confirmado`, `/atendimento-finalizado` | Confirmação associada à sessão de fechamento e encerramento da experiência do cliente |

O QR de mesa abre `/cliente?mesa=<token>`; **Explorar cardápio** preserva a query ao abrir `/cardapio`. O [router do cliente](../../frontend/src/routers/ClientRoutes.tsx) usa a query como vínculo com o [contexto da mesa](../../frontend/src/contexts/ClientTableContext.tsx), que consulta o backend. Carrinho, nome e sessão de pagamento usam chaves locais por mesa. O nome informado pelo cliente usa `sessionStorage`. O acesso sem token permite navegar no catálogo, com as ações de mesa condicionadas a um token válido. A rota de acompanhamento de preparo foi removida. Os arquivos de mock em Home e ConfirmOrder são amostras sem referência no fluxo atual. Consulte o [contrato das mesas](../business/mesas-e-atendimentos.md).

## Publicação e testes

URLs diretas precisam do fallback SPA para `index.html`, com API e uploads fora desse fallback. Veja a [configuração de Nginx](../deployment/production.md#como-o-proxy-funciona).

Os [testes do frontend](../../frontend/tests) usam, entre outros recursos, `MemoryRouter` e renderização em Node para verificar destinos e estado. Efeitos, gestos, foco, histórico e o QR no celular também precisam de verificação em navegador quando o fluxo correspondente for alterado.
