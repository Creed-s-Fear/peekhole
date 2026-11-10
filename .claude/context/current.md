# Contexto atual

_Atualizado em 2026-11-10._

- **Estado (2026-11-10):** o site está pronto em `site/` e foi testado no Edge, no desktop e no celular, em pré-lançamento e em modo live com um token real. Ver `site/README.md`.
  - Seções: age gate 18+, ticker animado, hero "Make It Rain Mondays" com pôster em formato de carta J♥, contagem regressiva até a próxima segunda às 22h (horário de Vice City), The Club, Lineup (4 dançarinas fictícias), House Rules, $PERK (stats ao vivo e gráfico), How to buy, The Night (roadmap), FAQ e rodapé com disclaimer.
  - O botão "Make it rain" dispara uma chuva de notas, moedas e corações em canvas.
  - Ao lançar, basta editar `site/js/config.js` (CA, socials e facts).
  - O QR deve apontar para `https://DOMINIO/?ref=poster`.
- Direção escolhida: o usuário pediu o site de destino do QR, com a moeda do PerkHole. Mantivemos a imersão no universo do jogo, mas com honestidade: não é oficial e não tem uso no jogo (ver decisions.md).
- Repositório git: ainda não inicializado.

## Histórico (até 2026-10-28)
- Ideia: o QR code do pôster "Make It Rain Mondays — Jack of Hearts" (J♥H), que aparece no trailer do GTA 6 à esquerda do Jason, deve abrir algo coerente com o universo do jogo.
- PerkHole = paródia do OnlyFans no GTA 6, segundo o usuário. O pôster fica num strip club.
- Objetivo: narrativa para uma memecoin. O QR abre o ponto de entrada da história do token.
- Foco: escolher a narrativa. Primeira rodada: moeda do clube, PerkHole da dançarina, ARG. Segunda rodada, mais ousada: $HIJACK (QR sequestrado), palco ao vivo (compras on-chain viram chuva de dinheiro), golpe no clube, a moça do pôster, Dia do Scan (revelação no lançamento), baralho de 52 cartas. Sugestão: $HIJACK + palco ao vivo + Dia do Scan.
- O usuário quer algo **realista**: o que um QR num pôster de strip club de verdade abriria. Proposta atual: landing do clube no estilo Linktree, com a "funny money" do clube on-chain ($RAIN).
- O usuário quer que pareça verdadeiro e lembrou que o QR não precisa abrir um site. Tipos de QR que a câmera do iPhone abre de forma nativa: SMS, vCard, evento de calendário e Wi-Fi (confirmado na doc da Apple). Outras opções: tel:, Solana Pay, Wallet pass, Telegram.
- A VIP line (telefone com menu de voz) foi descartada: o usuário achou difícil demais. Ele quer algo **simples**, só dados dentro do QR, sem servidor.
- Proposta anterior: o QR adiciona na agenda o evento "Make It Rain Mondays" (com a alternativa de um pin no mapa). O usuário questionou: o trailer mostra gameplay, então por que o QR abriria algo na vida real? Pediu que tudo faça sentido e seja verdadeiro.
- **Fatos verificados em 2026-10-28** (as fontes estão em sessions/ e na resposta):
  - O QR do pôster é real e funciona. Escaneado, abre o site oficial do GTA 6 da Rockstar. Aparece no "Extended Look", por volta de 17:31.
  - A marca no pôster é **Peekhole**, não PerkHole. Os fãs leem como paródia do OnlyFans, mas a Rockstar não confirmou.
  - Já existe uma memecoin "Peekhole" sendo divulgada no Reddit, e a imprensa a aponta como não oficial.
  - A Rockstar tem histórico de criar sites reais para marcas fictícias (Epsilon Program, Lifeinvader).
- Proposta atual: construir em cima do fato verdadeiro, com uma comunidade que cataloga os QRs escaneáveis do GTA 6, em vez de fingir ser o destino do QR.
- Precedente real: o Crazy Horse 3, de Las Vegas, aceitou bitcoin para "dance dollars" em 2022.
