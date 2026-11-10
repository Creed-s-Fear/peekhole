// Peekhole site configuration — the only file you need to edit at launch.
// Everything here is PUBLIC (served to every visitor). Never put keys or secrets here.

export const CONFIG = Object.freeze({
  token: {
    // DexScreener chain id. Keep "solana" unless you launch elsewhere.
    chain: 'solana',

    // Paste the token mint address at launch. Empty string = pre-launch mode
    // (ticker says PRE-LAUNCH, buy buttons stay disabled, no API calls are made).
    contractAddress: '',

    // Shown under the chart. Only list facts that are verifiably true on-chain.
    // e.g. add ['Mint authority', 'Revoked'] only after you've checked it on Solscan.
    facts: [
      ['Chain', 'Solana'],
      ['Supply', '1,000,000,000'],
      ['Buy / sell tax', '0%'],
    ],
  },

  // External links. {ca} is replaced with the contract address. Must be https.
  links: {
    swap: 'https://jup.ag/swap/SOL-{ca}',
    chart: 'https://dexscreener.com/solana/{ca}',
    explorer: 'https://solscan.io/token/{ca}',
  },

  // Leave empty to hide the icon.
  socials: {
    x: '',
    telegram: '',
  },

  // Lineup images, in card order (Cherry, Roxy, Nina, Luck). A card with an empty photo shows
  // its built-in illustration. Files must live under assets/ (webp/avif/jpg/png), ~800x880 webp.
  // Only use images you own or have a licence for: no real people without consent, no Rockstar art.
  // Optional `position` ("X% Y%") picks which part of the image stays in frame when cropped.
  lineup: [
    {
      photo: 'assets/lineup/photo-2.webp',
      alt: 'Mirror selfie of Cherry Vice in a dressing room: dark curls, red devil horns and a red and black corset.',
      position: '48% 20%',
    },
    {
      photo: 'assets/lineup/photo-4.webp',
      alt: 'Roxy Keys on a beach boardwalk: long blonde hair, white crop top, denim shorts and an iced coffee.',
      position: '50% 8%',
    },
    {
      photo: 'assets/lineup/photo-3.webp',
      alt: 'Neon Nina sitting on the edge of a bathtub at night, curly hair, city lights behind her.',
      position: '58% 50%',
    },
    {
      photo: 'assets/lineup/photo-1.webp',
      alt: 'Mirror selfie of Lady Luck: black hair in two buns with a magenta-streaked fringe, dark lipstick, a choker and tattoos.',
    },
  ],

  // true = cards without a photo show an animated 3D bust instead of the illustration.
  lineup3d: false,

  // "Make It Rain Mondays" countdown. Vice City is Miami-coded, so Eastern time.
  event: {
    weekday: 1, // 0 = Sunday, 1 = Monday
    hour: 22, // 10 PM
    durationHours: 4,
    timeZone: 'America/New_York',
  },

  // Market data refresh. DexScreener allows ~300 req/min per IP; 30 s is very safe.
  // Values below 15 s are clamped up.
  refreshMs: 30_000,
});
