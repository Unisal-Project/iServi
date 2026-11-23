# Frontend do iServi

Aplicação React para o painel e para o cliente. O Vite usa este diretório como raiz da aplicação e lê o ambiente na raiz do monorepo. O painel filtra navegação e rotas pelo perfil autenticado. O funcionário usa Mesas e Pedidos, e o suporte Nupify fica sem dashboard e relatórios financeiros.

| Comando na raiz do monorepo | Uso |
| --- | --- |
| `npm run dev:frontend` | Inicia o Vite |
| `npm run build:frontend` | Verifica TypeScript e gera o bundle |
| `npm run test:frontend` | Executa os testes do frontend |

Consulte o [mapa de navegação](../docs/frontend/routing.md), a [organização dos componentes](../docs/frontend/components.md) e o [design system](../docs/frontend/design-system.md).
