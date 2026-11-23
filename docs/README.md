# Documentação do iServi

Comece pelo [README da raiz](../README.md) para instalar e executar o projeto.

## Arquitetura e domínio

- [Visão de arquitetura](architecture/overview.md) — componentes, persistência e integrações externas.
- [Regras de negócio](business/regras-de-negocio.md) — referência central sobre catálogo, estoque, pedidos, atendimento, pagamento e histórico.
- [Mesas, QR Code e atendimentos](business/mesas-e-atendimentos.md) — contrato das rotas, estados da mesa e validação operacional.
- [Divergências para revisão](business/divergencias.md) — diferenças entre requisitos, contratos e implementação que precisam de decisão.

## Frontend e backend

- [Frontend](../frontend/README.md) e [backend](../backend/README.md) — comandos específicos de cada módulo.
- [Navegação](frontend/routing.md) — rotas de cliente, painel e prévia.
- [Componentes](frontend/components.md) — organização da UI, pontos de entrada e comportamento responsivo.
- [Design system](frontend/design-system.md) — tokens Sass, tipografia e extensão de temas.
- [Autenticação e permissões](backend/authentication.md) — contratos de sessão, papéis e acesso às rotas.

## Execução e contribuição

- [Desenvolvimento local](deployment/development.md) — ambiente, containers e acesso pelo celular.
- [Testes e CI](testing/integration-tests.md) — suítes, banco isolado, cobertura e workflow.
- [Homologação](deployment/staging.md) — Cloudflare Tunnel, QR Code e ativação de Web Push.
- [Produção](deployment/production.md) — proxy, backups, atualização de banco, imagens e HTTPS.
- [Contribuição e GitFlow](contributing.md) — branches, commits e integração.

## Arquivo histórico

- [Checklist de JWT](archive/jwt-backend-checklist.md) — planejamento anterior à autenticação global.
- [Migração para Sass](archive/scss-migration-2026-10-22.md) — mapeamento de estilos e validações da migração.
- [Diagnóstico da rede Docker/npm](archive/docker-npm-network-2026-11-17.md) — evidências e comandos de reprodução de um incidente local.
