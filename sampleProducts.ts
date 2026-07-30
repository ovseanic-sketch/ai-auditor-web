export interface SampleProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  dataUrl: string;
}

// Generate realistic SVG product graphics as base64/data URLs
function createSampleSvg(
  bgColor1: string,
  bgColor2: string,
  titleText: string,
  svgContent: string
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgColor1}"/>
        <stop offset="100%" stop-color="${bgColor2}"/>
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="25" stdDeviation="20" flood-color="#000000" flood-opacity="0.35"/>
      </filter>
      <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <!-- Complex background with clutter to test background removal -->
    <rect width="800" height="800" fill="url(#bg)"/>
    <circle cx="150" cy="180" r="120" fill="rgba(255,255,255,0.08)"/>
    <circle cx="680" cy="620" r="180" fill="rgba(0,0,0,0.12)"/>
    <path d="M -100 650 L 900 450 L 900 850 L -100 850 Z" fill="rgba(0,0,0,0.18)"/>
    <!-- Distracting background pattern line -->
    <line x1="0" y1="250" x2="800" y2="250" stroke="rgba(255,255,255,0.15)" stroke-width="3" stroke-dasharray="10 15"/>
    <text x="400" y="70" font-family="system-ui, sans-serif" font-size="20" font-weight="600" fill="rgba(255,255,255,0.6)" text-anchor="middle" letter-spacing="3">${titleText.toUpperCase()} (SAMPLE PHOTO)</text>
    
    <!-- Product Graphic -->
    <g filter="url(#shadow)">
      ${svgContent}
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const SAMPLE_PRODUCTS: SampleProduct[] = [
  {
    id: "sneaker-runner",
    name: "Urban Pro Running Sneaker",
    category: "Footwear & Apparel",
    description: "Modern athletic sneaker photo with textured background clutter.",
    dataUrl: createSampleSvg(
      "#2c3e50",
      "#0f172a",
      "Footwear Sample",
      `<g transform="translate(180, 220)">
        <!-- Shoe Sole -->
        <path d="M 40 280 C 120 300 320 300 420 250 C 440 240 450 200 420 200 C 320 200 280 230 180 220 C 100 210 50 240 40 280 Z" fill="#e2e8f0" />
        <path d="M 45 285 C 125 305 325 305 425 255" stroke="#3b82f6" stroke-width="12" stroke-linecap="round"/>
        <!-- Shoe Body -->
        <path d="M 70 240 C 90 150 180 120 240 160 C 290 190 350 190 400 210 C 420 220 410 245 380 250 C 280 260 140 260 70 240 Z" fill="#ef4444" />
        <!-- Shoe Collar & Laces -->
        <path d="M 120 180 C 140 120 200 110 240 160" fill="#1e293b"/>
        <line x1="160" y1="160" x2="210" y2="185" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/>
        <line x1="180" y1="145" x2="230" y2="170" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/>
        <line x1="200" y1="130" x2="250" y2="155" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/>
        <!-- Swoosh/Branding -->
        <path d="M 160 210 Q 250 250 340 180 Q 240 220 160 210 Z" fill="#ffffff"/>
      </g>`
    ),
  },
  {
    id: "luxury-watch",
    name: "Chronograph Automatic Watch",
    category: "Jewelry & Watches",
    description: "Stainless steel timepiece on a dark moody backdrop.",
    dataUrl: createSampleSvg(
      "#1e1b4b",
      "#311042",
      "Luxury Watch Sample",
      `<g transform="translate(250, 150)">
        <!-- Watch Strap -->
        <rect x="110" y="20" width="80" height="460" rx="15" fill="#475569" />
        <rect x="120" y="20" width="60" height="460" fill="none" stroke="#94a3b8" stroke-width="3" stroke-dasharray="12 8"/>
        <!-- Watch Body Case -->
        <circle cx="150" cy="250" r="120" fill="#cbd5e1" stroke="#94a3b8" stroke-width="8"/>
        <circle cx="150" cy="250" r="105" fill="#0f172a"/>
        <circle cx="150" cy="250" r="95" fill="none" stroke="#fbbf24" stroke-width="2"/>
        <!-- Dial ticks -->
        <circle cx="150" cy="250" r="85" fill="none" stroke="#38bdf8" stroke-width="4" stroke-dasharray="2 18"/>
        <!-- Dial hands -->
        <line x1="150" y1="250" x2="150" y2="180" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/>
        <line x1="150" y1="250" x2="200" y2="250" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
        <line x1="150" y1="250" x2="110" y2="290" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
        <circle cx="150" cy="250" r="8" fill="#fbbf24"/>
      </g>`
    ),
  },
  {
    id: "serum-bottle",
    name: "Botanical Glow Facial Serum",
    category: "Cosmetics & Skincare",
    description: "Frosted glass dropper bottle photo with soft warm shadows.",
    dataUrl: createSampleSvg(
      "#78350f",
      "#451a03",
      "Cosmetics Sample",
      `<g transform="translate(280, 140)">
        <!-- Glass Bottle -->
        <rect x="60" y="160" width="120" height="260" rx="20" fill="#fef3c7" opacity="0.9" stroke="#d97706" stroke-width="4"/>
        <!-- Liquid level -->
        <rect x="68" y="220" width="104" height="190" rx="12" fill="#f59e0b" opacity="0.8"/>
        <!-- Label -->
        <rect x="65" y="240" width="110" height="120" fill="#ffffff" rx="4"/>
        <text x="120" y="275" font-family="serif" font-size="14" font-weight="bold" fill="#78350f" text-anchor="middle">BOTANICAL</text>
        <text x="120" y="295" font-family="sans-serif" font-size="11" fill="#b45309" text-anchor="middle">GLOW SERUM</text>
        <line x1="85" y1="310" x2="155" y2="310" stroke="#f59e0b" stroke-width="2"/>
        <text x="120" y="335" font-family="sans-serif" font-size="9" fill="#92400e" text-anchor="middle">30ml / 1.0 fl oz</text>
        <!-- Cap & Dropper -->
        <rect x="90" y="120" width="60" height="40" fill="#1c1917" rx="4"/>
        <path d="M 105 120 C 105 70 135 70 135 120 Z" fill="#44403c"/>
        <rect x="100" y="50" width="40" height="30" rx="15" fill="#262626"/>
      </g>`
    ),
  },
  {
    id: "wireless-headphones",
    name: "Aura Noise-Canceling Headphones",
    category: "Electronics",
    description: "Sleek matte-black over-ear headphones photo.",
    dataUrl: createSampleSvg(
      "#111827",
      "#1f2937",
      "Electronics Sample",
      `<g transform="translate(200, 180)">
        <!-- Headband -->
        <path d="M 80 200 C 80 40 320 40 320 200" fill="none" stroke="#374151" stroke-width="32" stroke-linecap="round"/>
        <path d="M 100 180 C 100 70 300 70 300 180" fill="none" stroke="#6b7280" stroke-width="12" stroke-linecap="round"/>
        <!-- Left Ear Cup -->
        <g transform="translate(40, 180)">
          <rect x="0" y="0" width="70" height="130" rx="35" fill="#111827" stroke="#60a5fa" stroke-width="6"/>
          <rect x="15" y="15" width="40" height="100" rx="20" fill="#1f2937"/>
          <circle cx="35" cy="65" r="15" fill="#3b82f6"/>
        </g>
        <!-- Right Ear Cup -->
        <g transform="translate(290, 180)">
          <rect x="0" y="0" width="70" height="130" rx="35" fill="#111827" stroke="#60a5fa" stroke-width="6"/>
          <rect x="15" y="15" width="40" height="100" rx="20" fill="#1f2937"/>
          <circle cx="35" cy="65" r="15" fill="#3b82f6"/>
        </g>
      </g>`
    ),
  },
  {
    id: "ceramic-mug",
    name: "Handcrafted Ceramic Mug",
    category: "Home & Kitchen",
    description: "Rustic artisan ceramic coffee mug photo.",
    dataUrl: createSampleSvg(
      "#064e3b",
      "#022c22",
      "Home & Living Sample",
      `<g transform="translate(240, 200)">
        <!-- Handle -->
        <path d="M 240 70 C 330 70 330 230 240 230" fill="none" stroke="#d97706" stroke-width="36" stroke-linecap="round"/>
        <!-- Body -->
        <path d="M 60 40 L 240 40 C 250 180 230 260 210 280 C 190 295 110 295 90 280 C 70 260 50 180 60 40 Z" fill="#fef3c7"/>
        <!-- Glaze dip design -->
        <path d="M 60 40 L 240 40 C 248 120 235 140 200 130 C 160 120 130 160 90 140 C 65 125 53 90 60 40 Z" fill="#b45309"/>
        <!-- Steam effect -->
        <path d="M 110 10 Q 120 -20 110 -50" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="6" stroke-linecap="round"/>
        <path d="M 150 20 Q 160 -10 150 -40" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="6" stroke-linecap="round"/>
        <path d="M 190 10 Q 200 -20 190 -50" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="6" stroke-linecap="round"/>
      </g>`
    ),
  },
];
