---
description: Restaura o contexto do projeto a partir de .claude/ (memória, contexto ativo e últimos logs de sessão)
argument-hint: [tema opcional]
---

Restaure o conhecimento do projeto antes de continuar o trabalho. Este comando só lê; não altere nenhum arquivo.

1. Leia todos os arquivos de `.claude/memory/`.
2. Leia `.claude/context/current.md` e `.claude/context/open-questions.md`.
3. Liste `.claude/sessions/` e leia os 3 logs mais recentes (o nome começa pela data). Se um tema foi informado ($ARGUMENTS), leia também os logs que o mencionam no nome ou no conteúdo.
4. Responda com um resumo curto:
   - Estado atual e foco
   - Decisões e preferências que afetam o próximo passo
   - Pendências e perguntas em aberto
   - Próximo passo sugerido

Se não houver nada além dos templates, diga isso e pergunte qual é o foco da sessão.
