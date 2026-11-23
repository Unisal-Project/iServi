# Contribuição e GitFlow

A política registrada pela equipe usa `main` para versões estáveis e `develop` para integração. O [workflow do CI](../.github/workflows/ci.yml) valida pushes e pull requests nessas branches. Consulte os [testes](testing/integration-tests.md) antes de integrar e as [regras de negócio](business/regras-de-negocio.md) antes de propor alterações de domínio.

## Preparação e branches

Clone o endereço fornecido pelo projeto. Na primeira configuração, execute `git flow init` com `main` como branch de produção e `develop` como branch de desenvolvimento. O GitFlow é configurado localmente, com branches compartilhadas no remoto.

| Branch | Origem | Finalidade |
| --- | --- | --- |
| `feature/<nome>` | `develop` atualizada | Implementar e validar uma mudança. Integra de volta em `develop` |
| `release/<versao>` | `develop` com o escopo da versão concluído | Estabilizar com testes, ajustes e correções. Integra em `main` e `develop` |
| `hotfix/<descricao>` | `main` atualizada | Corrigir problema crítico da versão estável. Integra em `main` e `develop` |

Evite desenvolvimento direto em `main` ou `develop`. Use nomes curtos, como `feature/login-usuario`. Para colaborar, publique a feature com `git push -u origin feature/login-usuario`. O colega pode obtê-la com `git fetch origin` e `git switch --track origin/feature/login-usuario`. Sincronize a branch compartilhada e resolva conflitos antes da integração.

## Ciclo de trabalho

1. Atualize a base e crie a branch com `git flow feature start <nome>`, `git flow release start <versao>` ou `git flow hotfix start <nome>`.
2. Faça commits, valide a mudança e integre conforme o fluxo aprovado no repositório. No fluxo local original, use `git flow feature finish <nome>`, `git flow release finish <versao>` ou `git flow hotfix finish <nome>`.
3. Publique a base integrada conforme as permissões do remoto. Release e hotfix também publicam a tag correspondente. Remova a feature remota após confirmar a integração e alinhar com quem colaborou nela.

## Commits

Use Conventional Commits no formato `tipo(escopo): descrição`, com escopo opcional. Escreva uma descrição objetiva no presente ou imperativo, sem ponto final. Tipos adotados são `feat`, `fix`, `chore`, `refactor`, `style`, `perf`, `docs` e `test`.

```text
feat(api): adicionar endpoint de autenticação
fix(auth): corrigir validação de usuário
docs: atualizar instruções de desenvolvimento
```
