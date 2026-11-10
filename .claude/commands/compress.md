---
description: Salva o essencial da sessão em .claude/ (log, memória e contexto) antes de /compact, /clear ou ao encerrar
argument-hint: [tema-da-sessao]
---

Persista o conhecimento desta sessão em disco, seguindo a seção "0. Memória e Contexto de Sessões" do CLAUDE.md.

Tema: $ARGUMENTS (se vazio, deduza um tema curto em kebab-case a partir da conversa).

1. Leia os arquivos atuais de `.claude/memory/` e `.claude/context/` antes de escrever. Nunca sobrescreva sem consolidar.
2. Crie `.claude/sessions/YYYY-MM-DD-HHMM-<tema>.md` (data e hora locais) com:
   - Objetivo da sessão
   - O que foi feito (arquivos, PRs, commits relevantes)
   - Decisões tomadas e por quê
   - O que ficou pendente
3. Atualize `.claude/memory/` só com o que for durável:
   - `decisions.md`: novas decisões técnicas, com data e justificativa breve (append)
   - `preferences.md`, `architecture.md`, `lessons.md`: só se surgiu algo novo
   - Entrada antiga que ficou obsoleta: edite ou marque como substituída, não duplique
4. Reescreva `.claude/context/current.md` com o estado atual (branch, foco, restrições, próximo passo).
5. Atualize `.claude/context/open-questions.md`: remova o que foi resolvido, adicione o que ficou em aberto.
6. Nunca grave secrets, tokens, senhas ou dados pessoais. Use bullets curtos e links em vez de textos longos.
7. No fim, diga em poucas linhas o que foi gravado em cada arquivo.
