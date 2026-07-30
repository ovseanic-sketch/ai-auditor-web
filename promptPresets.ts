export interface PromptPreset {
  id: string;
  category: "E-Commerce" | "Studio & Scenes" | "Photo Cleanup" | "Creative Lighting";
  title: string;
  prompt: string;
  icon: string;
  badge?: string;
}

export const PROMPT_PRESETS: PromptPreset[] = [
  {
    id: "amazon-white",
    category: "E-Commerce",
    title: "Pure White Amazon/Shopify Backdrop",
    prompt: "Remove the background completely and place the main product on a seamless pure white (#FFFFFF) studio background. Add a subtle, realistic contact shadow under the product base.",
    icon: "ShoppingBag",
    badge: "Most Popular",
  },
  {
    id: "studio-gray",
    category: "E-Commerce",
    title: "Neutral Light Gray Studio",
    prompt: "Isolate the product from the original background. Place it on a clean neutral light gray studio backdrop with gentle softbox gradient lighting and a natural ground drop shadow.",
    icon: "Layers",
  },
  {
    id: "obsidian-luxury",
    category: "E-Commerce",
    title: "Dark Obsidian Luxury Showcase",
    prompt: "Place the product on a polished black glass surface with subtle reflective mirror ground, against a dark moody obsidian studio background with dramatic rim lighting.",
    icon: "Sparkles",
    badge: "Luxury",
  },
  {
    id: "marble-pedestal",
    category: "Studio & Scenes",
    title: "Polished White Marble Pedestal",
    prompt: "Place the main product centered on a cylindrical polished white marble podium with delicate gray veins, in a bright modern studio setting with soft warm directional light.",
    icon: "Box",
  },
  {
    id: "oak-wood",
    category: "Studio & Scenes",
    title: "Warm Oak Wood Tabletop",
    prompt: "Place the product on a natural warm oak wood tabletop. Background should have a gentle, warm out-of-focus bokeh blur with soft daylight filtering from the side.",
    icon: "Trees",
  },
  {
    id: "sunlit-plant",
    category: "Studio & Scenes",
    title: "Sunlit Shelf with Plant Shadows",
    prompt: "Set the product on a minimalist pastel wooden shelf with artistic window leaf shadows and soft natural morning sunlight casting across the scene.",
    icon: "Sun",
  },
  {
    id: "dust-scratch-cleanup",
    category: "Photo Cleanup",
    title: "Remove Dust, Scratches & Glare",
    prompt: "Clean up the product surface by removing dust particles, fingerprints, minor scratches, and harsh reflection glare while preserving fine material textures and original product logos.",
    icon: "Sparkle",
    badge: "Retouch",
  },
  {
    id: "color-contrast-boost",
    category: "Photo Cleanup",
    title: "Studio Color & Contrast Polish",
    prompt: "Enhance product contrast, sharpen edge details, boost color accuracy, and equalize studio lighting across the entire product surface to make it look magazine-ready.",
    icon: "Wand2",
  },
  {
    id: "isolate-subject",
    category: "Photo Cleanup",
    title: "Isolate Product & Remove Clutter",
    prompt: "Remove all background clutter, secondary objects, wires, and distractions. Isolate only the primary product item with clean, crisp, sharp edges.",
    icon: "Scissors",
  },
  {
    id: "neon-cyber-glow",
    category: "Creative Lighting",
    title: "Cyberpunk Dual Neon Glow",
    prompt: "Place the product on a dark reflective surface with vibrant cyan and magenta dual-tone rim lighting, giving it a high-tech modern cyberpunk commercial feel.",
    icon: "Zap",
  },
];
