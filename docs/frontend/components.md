# Componentes iServi

Componentes React em TypeScript organizados por domínio do design system:

- `components/ui/buttons`: ações, ícones e quantidade.
- `components/ui/inputs`: campos de texto, textarea e select.
- `components/ui/forms`: checkbox, radio, switch e dropdown.
- `components/ui/navigation`: abas, categorias, breadcrumb e paginação.
- `components/ui/cards`: indicadores estatísticos.
- `components/ui/status`: etiquetas de status.
- `components/ui/feedback`: modal, toast, alerta, tooltip e carregamento.
- `components/ui/icons`: ícones com comportamento próprio.
- `components/layout`: navegação, cabeçalhos e barras compartilhadas.
- `components/domain/cards`: cartões de produto, pedido e mesa.
- `components/domain/restaurant`: carrinho, elementos do restaurante e status de mesas.
- `components/domain/notifications`: notificações do atendimento.

Use o ponto único de importação:

```tsx
import { Button, ProductCard, Badge } from "@/components";
```

Os componentes utilizam os tokens e estilos de `src/styles/main.scss`. Importe essa entrada uma única vez, antes de renderizá-los. As regras compartilhadas ficam em `src/styles/components/`; os estilos específicos permanecem junto às páginas e componentes.

```tsx
import "./styles/main.scss";
```


## Onde alterar cada parte

Os caminhos abaixo são relativos a `frontend/src`.

| Alteração desejada | Ponto de partida |
| --- | --- |
| Entrada, login e divisão entre admin e cliente | `routers/AppRouter.tsx` |
| Login e recuperação de acesso | `pages/admin/Login/index.tsx` |
| Aparência do login e cadastro | `pages/admin/Login/styles.scss` |
| Rotas administrativas e estados compartilhados | `routers/AdminRoutes.tsx` |
| Endereços de navegação | `routers/paths.ts` |
| Contexto CSS de login, administrativo e cliente | `hooks/useDocumentClass.ts` e estilos de cada tela/layout |
| Rotas, mesa e pedidos do cliente | `routers/ClientRoutes.tsx` |
| Itens e ações da barra inferior do cliente | `components/layout/ClientTabBar.tsx` |
| Marcação compartilhada da navegação inferior | `components/layout/BottomNavigation.tsx` |
| Estado e ações de uma página | Diretório `hooks` próximo da página, quando existente |
| Comunicação com o backend | `services/` |
| Cores, fontes, espaçamentos e demais tokens | `styles/themes/`, `styles/base/_tokens.scss`, `styles/abstracts/` |

O fluxo de dados costuma ser página → hook ou contexto → service → cliente HTTP. Componentes recebem dados e callbacks. Services não renderizam nem navegam. Use `@/` entre áreas, imports relativos dentro da funcionalidade e `import type` para tipos. Estilos locais ficam próximos ao componente ou página. `public/` serve arquivos como o manifest e o service worker por URL, enquanto `assets/` contém imagens importadas pelos módulos.

`useDocumentClass` adiciona uma classe ao elemento `html` enquanto a tela está montada. Cada contexto visual deve ter uma única instância responsável pela classe. Veja o [mapa de rotas](routing.md) e o [design system](design-system.md).

## Admin no celular

Até 820px, o botão ☰ de `AdminSidebar` fica alinhado ao título no cabeçalho fixo, sem faixa vazia acima da página. Ele abre uma gaveta lateral à esquerda, com os itens de navegação e "Ver cardápio"; o bloco do usuário com Configurações/Sair fica no rodapé da gaveta. As regras compartilhadas ficam em `layouts/adminWorkspace.scss`; buscas de cabeçalho ocupam a linha seguinte no celular. Acima desse limite, permanece a sidebar fixa do desktop.

A gaveta desliza e o fundo escurecido faz fade em 220ms, respeitando `prefers-reduced-motion` sem transição. O X de "Fechar menu" tem alvo mínimo de 44px e fica encostado na borda direita do painel. Fundo, X, Esc e escolha de navegação fecham a gaveta; foco e Tab ficam dentro dela enquanto aberta e o foco volta ao ☰ ao fechar. A rolagem do body é travada e restaurada; fechada, a gaveta fica `inert`, sem receber foco ou leitura assistiva. O botão informa `aria-expanded` e `aria-controls`.

Na tela de Mesas, a busca principal acompanha o cabeçalho fixo. A segunda busca é ocultada no celular e os filtros de status permitem rolagem horizontal. Os ajustes específicos ficam em `pages/admin/Table/styles.scss`.

Os detalhes da mesa consultam os pedidos do atendimento e oferecem ligação para Pedidos. A liberação e o recebimento seguem o [contrato de mesa e atendimento](../business/mesas-e-atendimentos.md).
