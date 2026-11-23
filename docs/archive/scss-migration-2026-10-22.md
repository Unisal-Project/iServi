# Migração para Sass em 22/10/2026

Registro histórico. Para a estrutura e os comandos atuais, consulte o [design system](../frontend/design-system.md) e o [guia de testes](../testing/integration-tests.md). Os caminhos da tabela registram o estado na data da migração.

## Arquivos migrados

Caminhos relativos a `src/`:

| CSS original | Destino |
| --- | --- |
| `index.css` | `styles/main.scss`, `styles/base/*`, `styles/themes/*` e `styles/abstracts/*` |
| `styles/components.css` | `styles/components/_actions.scss`, `_forms.scss`, `_controls.scss`, `_cards.scss`, `_navigation.scss`, `_feedback.scss`, `_responsive.scss` |
| `components/domain/notifications/style.css` | `components/domain/notifications/style.scss` |
| `pages/admin/Categories/styles.css` | `pages/admin/Categories/styles.scss` |
| `pages/admin/Dashboard/styles.css` | `pages/admin/Dashboard/styles.scss` |
| `pages/admin/Order/styles.css` | `pages/admin/Order/styles.scss` |
| `pages/admin/Products/styles.css` | `pages/admin/Products/styles.scss` |
| `pages/admin/Table/styles.css` | `pages/admin/Table/styles.scss` |
| `pages/client/Cart/styles.css` | `pages/client/Cart/styles.scss` |
| `pages/client/ConfirmOrder/styles.css` | `pages/client/ConfirmOrder/styles.scss` |
| `pages/client/Home/styles.css` | `pages/client/Home/styles.scss` |
| `pages/client/Menu/styles.css` | `pages/client/Menu/styles.scss` |
| `pages/client/OrderSuccess/styles.css` | `pages/client/OrderSuccess/styles.scss` |
| `pages/client/OrderTracking/styles.css` | `pages/client/OrderTracking/styles.scss` |
| `pages/client/ProductDetail/styles.css` | `pages/client/ProductDetail/styles.scss` |
| `pages/client/TableBill/styles.css` | `pages/client/TableBill/styles.scss` |

## Dependências

- Desenvolvimento: `sass ^1.106.1`.
- Fontes locais: `@fontsource-variable/bricolage-grotesque`, `@fontsource-variable/manrope`
  e `@fontsource-variable/dm-sans`, todas `^5.3.0` (licença OFL-1.1).
- Atualizados os lockfiles npm da raiz e do frontend. O lockfile independente estava
  desatualizado em relação ao manifesto; sua sincronização também resolve as versões
  já declaradas de Vite e Lucide e suas dependências transitivas.
- Nenhuma biblioteca de componentes adicionada.

## Validação da migração — 22/10/2026

- TypeScript do frontend: `npm exec --workspace frontend -- tsc -b --pretty false`.
- Lint: `npm run lint`; aprovado com dois avisos anteriores em `useProductDetail.ts`
  (`react/set-state-in-effect` e `react-hooks/exhaustive-deps`).
- Testes: `npm test`; oito arquivos aprovados pelo runner. Não existe suíte própria
  do frontend. A integração com banco requer `RUN_TABLES_DB_TESTS=1` e não foi habilitada.
- Build: `npm run build`, incluindo backend e frontend. O primeiro build encontrou
  um Prisma Client local desatualizado; `npm run prisma:generate` resolveu a falha,
  sem editar schema, contratos ou código do backend e sem executar migrations.
- Compilação independente das 15 entradas SCSS (global, 13 páginas e notificações).
  A auditoria comparou a ordem de 896 seletores locais e 153 seletores compartilhados
  com o CSS anterior e preservou as declarações de layout e comportamento.
- Todas as 15 importações locais de estilo resolvidas; nenhum CSS antigo restante
  em `src/`, nenhuma cor hexadecimal fora dos temas e nenhuma referência a token indefinido.
- Duplicações: oito grupos de regras idênticas entre Cart, ConfirmOrder e ProductDetail
  (`.icon-button`, `.cart-button`, `.cart-button b`, `.bottom-navigation` e quatro regras
  de descendentes/estado). Mantidos para preservar a cascata e os pontos de importação;
  Menu também possui variantes de alguns desses seletores, com dimensões diferentes.
- Limitação visual: o `App.tsx` já renderizava apenas o título iServi, sem montar as
  páginas. Não houve validação em navegador dos fluxos, modais ou responsividade.
  A integração das telas e sua revisão visual continuam necessárias antes de liberar
  a nova identidade. Rotas, estado, serviços e regras de negócio foram preservados.
