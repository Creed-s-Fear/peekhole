# Peekhole — site estático

Site de uma página: HTML, CSS e JS puros, sem build e sem servidor.

## Lançamento

1. Em `js/config.js`, cole o endereço do token em `contractAddress`.
2. Revise `facts`: só liste o que puder ser verificado on-chain.
3. Preencha `socials.x` e `socials.telegram`.

Sem endereço, o site fica em modo pré-lançamento: os botões de compra ficam desativados e nenhuma chamada de API é feita.

O ticker `$PEEK` está escrito direto no HTML. Para trocá-lo, faça uma busca e substituição em `index.html`.

## Testar localmente

```
cd site
python -m http.server 8080
```

Abra http://localhost:8080. Abrir o arquivo direto (`file://`) não funciona, porque módulos ES exigem HTTP.

## Deploy

Use Cloudflare Pages ou Netlify e publique a pasta `site/`. Os dois hosts leem o arquivo `_headers` (CSP, HSTS e outros headers de segurança). Na Vercel, esses headers precisam ser recriados em `vercel.json`.

## QR code

Aponte o QR para `https://SEU-DOMINIO/?ref=poster`. Quem chega por ele vê a mensagem "You scanned the Make It Rain Mondays poster", e o parâmetro é removido da URL logo em seguida.

## 3D

- **Hero** (`js/scene3d.js`, em three.js): carta J♥ em 3D (clicar ou tocar vira a carta e mostra o verso Peekhole), moedas $PEEK girando, notas e corações. Todas as texturas são desenhadas em `<canvas>`, sem nenhuma imagem externa.
- **Cards**: efeito de inclinação 3D com brilho seguindo o mouse (só em dispositivos com mouse). O título "MONDAYS" tem relevo feito com drop-shadow.
- **three.js 0.170.0** fica em `js/vendor/`. Foi baixado com `npm pack`, que confere o hash de integridade do registry; o sha256 do arquivo é `08fd7545…c39e7`. A licença MIT está ao lado. Ele não vem de CDN, então a CSP continua `'self'` e não há risco de supply chain em tempo de execução.
- **Performance**:
  - o three.js (~170 KB gzip) só é baixado depois do age gate, quando o navegador fica ocioso;
  - o render pausa fora da tela ou com a aba oculta, e o DPR fica limitado a 1,75 (1,5 no celular);
  - com "reduzir movimento" ativado, a cena vira um quadro estático;
  - com "economia de dados" ativada, ou se o WebGL falhar ou perder o contexto, o pôster em CSS volta automaticamente.

## Retratos do lineup

Os retratos estão em `assets/lineup/*.svg`: quatro personagens originais em ilustração vetorial, com contorno grosso, sombra chapada e retícula. Cada SVG tem entre 9 e 18 KB e não faz nenhuma requisição externa.

Eles são gerados por `tools/lineup-portraits.mjs`. Para mudar cores, cabelo, roupa ou fundo, edite esse script e rode:

```
node tools/lineup-portraits.mjs
```

## Dados de mercado

O preço vem da API pública da DexScreener (`/tokens/v1/{chain}/{CA}`), chamada direto do navegador:

- atualiza a cada 30 s e para quando a aba fica em segundo plano;
- em caso de erro, tenta de novo com backoff exponencial (máximo de 5 min);
- o gráfico é o embed da DexScreener do pool com mais liquidez.

Nenhum número é inventado. Antes do lançamento, os campos mostram "—".
