# CLAUDE.md

Instruções para o assistente de código. Priorize sempre **performance**, **segurança** e **escalabilidade**.

---

## Princípios Gerais

- Prefira soluções simples, legíveis e fáceis de manter.
- Evite over-engineering. Só adicione complexidade quando houver necessidade clara de performance, segurança ou escala.
- Toda decisão técnica deve considerar impacto em latência, uso de recursos, superfície de ataque e capacidade de crescer.
- Documente decisões não óbvias (trade-offs de performance/segurança/escala).

---

## 0. Memória e Contexto de Sessões

Para não perder decisões, preferências e contexto ao longo do tempo, use uma pasta dedicada do Claude.

### Estrutura recomendada

```
.claude/
├── commands/
│   ├── compress.md       # Skill /compress — salva sessão + memória
│   └── resume.md         # Skill /resume — restaura contexto
├── memory/
│   ├── decisions.md      # Decisões técnicas tomadas e o porquê
│   ├── preferences.md    # Preferências do usuário / do projeto
│   ├── architecture.md   # Visão de arquitetura e restrições
│   └── lessons.md        # Lições aprendidas e armadilhas evitadas
├── sessions/
│   ├── YYYY-MM-DD-HHMM-tema.md   # Resumo de sessões importantes
│   └── ...
└── context/
    ├── current.md        # Contexto ativo da sessão atual
    └── open-questions.md # Perguntas em aberto / próximos passos
```

### Regras

- **Sempre** leia `.claude/memory/` e `.claude/context/current.md` no início de uma nova sessão relevante.
- Ao tomar uma decisão importante (stack, padrão, trade-off, convenção), registre em `.claude/memory/decisions.md` com data e justificativa breve.
- Ao final de sessões longas ou decisivas, atualize:
  - `sessions/YYYY-MM-DD-tema.md` com resumo do que foi feito e escolhido
  - `context/current.md` com o estado atual do projeto
  - `context/open-questions.md` com o que ficou pendente
- Não grave secrets, tokens, senhas ou dados sensíveis nesses arquivos.
- Mantenha os arquivos curtos e objetivos. Prefira bullets e links para PRs/commits em vez de textos longos.
- Se a pasta `.claude/` ainda não existir, crie-a na raiz do projeto na primeira necessidade.

### O que registrar

| Tipo | Onde | Exemplos |
|------|------|----------|
| Decisão técnica | `memory/decisions.md` | "Usar Redis para cache de sessão porque..." |
| Preferência | `memory/preferences.md` | "Preferir TypeScript strict", "evitar ORMs pesados" |
| Arquitetura | `memory/architecture.md` | Diagrama textual, boundaries, serviços |
| Lição | `memory/lessons.md` | "N+1 em X causou latência; sempre usar batch" |
| Sessão | `sessions/...` | O que foi implementado, o que ficou pendente |
| Contexto ativo | `context/current.md` | Branch atual, foco da sessão, restrições |

### Comportamento do assistente

1. No início de tarefas que dependem de histórico: consultar `.claude/` antes de reinventar decisões.
2. Ao concluir uma decisão relevante: propor (ou fazer) a atualização do arquivo de memória correspondente.
3. Nunca sobrescrever memórias existentes sem consolidar — sempre append ou edição cuidadosa.
4. Se o usuário pedir "lembra do que decidimos sobre X", procurar primeiro em `.claude/memory/`.

### Skills de sessão (recomendado)

Use as skills customizadas em `.claude/commands/`:

| Comando | Quando usar | O que faz |
|---------|-------------|-----------|
| **`/compress`** | Antes de `/compact`, `/clear` ou ao finalizar uma sessão importante | Salva log em `.claude/sessions/`, atualiza `memory/` e `context/` |
| **`/resume`** | No início de uma nova sessão ou ao voltar a um tema | Lê `memory/` + `context/` + últimos logs de `sessions/` e restaura o contexto |

Fluxo ideal:

```
Trabalho na sessão
    → /compress          (salva em disco)
    → /compact  (opcional, libera contexto)
    ...
Nova sessão / novo dia
    → /resume            (carrega memória + logs)
    → continua de onde parou
```

- `/compress` **não** substitui o `/compact` nativo — ele **persiste** o essencial em arquivos.
- `/resume` **não** substitui o `/resume` nativo de sessões JSONL — ele restaura o **conhecimento** do projeto (decisões, preferências, pendências).

---

## 1. Performance

### Princípios
- Meça antes de otimizar. Use profiling e métricas reais.
- Otimize o caminho crítico primeiro (hot paths).
- Prefira algoritmos e estruturas de dados com complexidade adequada ao volume esperado.
- Minimize alocações desnecessárias, cópias e I/O bloqueante.
- Cache com cuidado: invalidação correta > cache agressivo.

### Boas práticas
- Evite N+1 queries. Use batching, joins ou DataLoader quando aplicável.
- Prefira streaming / paginação para listas grandes.
- Use connection pooling e timeouts adequados em clientes de rede/DB.
- Evite processamento síncrono pesado em request handlers. Offload para workers/queues.
- Compressão e serialização eficientes (ex.: protobuf/msgpack quando JSON for gargalo).
- Lazy loading e code-splitting no frontend quando o bundle for relevante.
- Índices de banco alinhados com queries reais; evite índices desnecessários.
- Monitore: latência p50/p95/p99, throughput, uso de CPU/memória, GC pauses.

### Anti-padrões
- Otimização prematura sem evidência.
- Carregar datasets inteiros na memória sem necessidade.
- Loops aninhados O(n²) ou piores em dados que crescem.
- Logging excessivo em hot paths.
- Serialização/deserialização repetida do mesmo dado.

---

## 2. Segurança

### Princípios
- Defense in depth. Não confie em uma única camada.
- Least privilege em tudo (usuários, serviços, tokens, containers).
- Fail secure: em caso de erro, negue acesso / rejeite input.
- Nunca confie em input do cliente. Valide e sanitize sempre.
- Segredos nunca no código, logs ou repositório.

### Boas práticas
- Validação de entrada no boundary (schema, tipos, ranges, allowlists).
- Prepared statements / query builders parametrizados (nunca concatenar SQL).
- Escape/output encoding adequado ao contexto (HTML, JS, URL, CSS).
- Autenticação forte (password hashing moderno: Argon2/bcrypt; MFA quando possível).
- Autorização explícita em cada endpoint/ação (RBAC/ABAC).
- Tokens com expiração curta, refresh rotativo e scopes mínimos.
- HTTPS/TLS obrigatório em trânsito. HSTS quando aplicável.
- Headers de segurança: CSP, X-Content-Type-Options, X-Frame-Options, etc.
- Rate limiting e proteção contra brute-force / enumeration.
- Secrets em vault / secret manager / variáveis de ambiente injetadas em runtime.
- Dependências atualizadas; scanner de vulnerabilidades (SCA) no CI.
- Logs sem dados sensíveis (PII, tokens, senhas).
- CSRF protection em fluxos state-changing baseados em cookie.
- Content Security Policy rigorosa no frontend.

### Anti-padrões
- Hardcoded secrets, API keys ou credenciais.
- Desabilitar validação de certificado TLS.
- `eval`, `exec` ou interpretação de código a partir de input.
- Expor stack traces detalhados em produção.
- Confiar apenas em validação client-side.
- Permissões excessivas em IAM/roles de serviço.
- Logging de request/response bodies completos com dados sensíveis.

---

## 3. Escalabilidade

### Princípios
- Projete para crescimento horizontal sempre que possível.
- Stateless preferencialmente (estado em stores externos: DB, cache, object storage).
- Isolamento de falhas (circuit breakers, bulkheads, timeouts).
- Capacidade de degradar gracefully sob carga.
- Observabilidade como requisito de primeira classe.

### Boas práticas
- Serviços e handlers stateless. Sessão e estado em Redis/DB/etc.
- Filas (SQS, RabbitMQ, Kafka, etc.) para desacoplar e absorver picos.
- Idempotência em operações críticas (especialmente com retries e filas).
- Partitioning / sharding quando volume de dados exigir.
- Cache distribuído com estratégia de invalidação clara (TTL + event-driven quando possível).
- Connection limits e backpressure em todos os clientes externos.
- Autoscaling baseado em métricas reais (CPU, fila, latência, RPS).
- Database: connection pooling, read replicas, migrations online, queries eficientes.
- Feature flags para rollout gradual e kill switches.
- Health checks (liveness + readiness) e graceful shutdown.
- Circuit breakers e retries com exponential backoff + jitter.
- Design de APIs versionadas e backward-compatible quando possível.
- Monitoramento de filas, saturação de recursos e error budgets.

### Anti-padrões
- Estado em memória local de instância (exceto cache local com invalidação).
- Processamento síncrono de tarefas longas no request path.
- Dependência forte de um único nó ou região sem fallback.
- Queries sem limite / sem paginação em endpoints públicos.
- Ausência de timeouts em chamadas externas.
- Migrations que lockam tabelas grandes em produção sem estratégia.

---

## Checklist Rápido (antes de merge / deploy)

**Performance**
- [ ] Hot paths medidos ou justificados
- [ ] Sem N+1 ou queries óbvias ineficientes
- [ ] Paginação / streaming onde volume pode crescer
- [ ] Timeouts e pooling configurados

**Segurança**
- [ ] Input validado no boundary
- [ ] Sem secrets no código/logs
- [ ] AuthN + AuthZ em todos os endpoints sensíveis
- [ ] Dependências sem CVEs críticas conhecidas
- [ ] Rate limiting em endpoints públicos/autenticados sensíveis

**Escalabilidade**
- [ ] Handlers/serviços preferencialmente stateless
- [ ] Operações longas/assíncronas fora do request path
- [ ] Idempotência onde há retry/fila
- [ ] Health checks e graceful shutdown
- [ ] Observabilidade mínima (métricas, logs estruturados, traces quando relevante)

---

## Estilo de Código e Decisões

- Prefira clareza e previsibilidade a “mágica”.
- Quando houver trade-off (ex.: mais segurança vs. mais latência), documente a escolha.
- Em caso de dúvida entre duas abordagens, escolha a que escala melhor e reduz superfície de ataque, desde que a performance permaneça aceitável.
- Testes: cubra caminhos críticos de segurança e cenários de carga quando o risco justificar.

---

## Resposta Esperada do Assistente

Ao sugerir ou escrever código:
1. Explique brevemente como a solução atende performance, segurança e/ou escalabilidade.
2. Aponte riscos residuais se existirem.
3. Prefira padrões comprovados em produção em vez de soluções experimentais sem justificativa.
4. Se a mudança impactar significativamente um dos três pilares, deixe isso explícito.
