// ============================================================
//  FitWithMaya – Site Configuration
//  Edit this file to change branding, colors, and social links
// ============================================================

export const SITE = {
  name: "FitWithMaya",
  tagline: "Stronger. Healthier. Happier.",
  subTagline: "Your personal fitness e-book library",
  logo: "🏋️", // emoji fallback; replace with an <img> path if desired
};

export const COLORS = {
  pink: "#FF8FC7",
  black: "#0D0D0F",
  charcoal: "#2B2B2F",
  white: "#F5F5F5",
  pinkGlow: "rgba(255, 143, 199, 0.18)",
};

export const SOCIAL = [
  { label: "Instagram", icon: "📸", url: "https://instagram.com/FitWithMaya" },
  { label: "TikTok",    icon: "🎵", url: "https://tiktok.com/@FitWithMaya" },
  { label: "YouTube",   icon: "▶️", url: "https://youtube.com/@FitWithMaya" },
  { label: "Facebook",  icon: "👤", url: "https://facebook.com/FitWithMaya" },
];

export const CATEGORIES = [
  "All",
  "Nutrition",
  "Workout",
  "Mindset",
  "Yoga",
  "Recipes",
  "Cardio",
  "Strength",
  "Wellness",
];

// Admin Configuration
// Set your admin email here or in .env as VITE_ADMIN_EMAIL
export const ADMIN_CONFIG = {
  emails: [
    (import.meta.env.VITE_ADMIN_EMAIL || "").toLowerCase().trim(),
    "admin@fitwithmaya.com",
    "maya@fitwithmaya.com",
    "abdulrafey12389@gmail.com",
  ].filter(Boolean),
};

export function checkIsAdmin(email) {
  if (!email) return false;
  const lower = email.toLowerCase().trim();
  const envAdmin = (import.meta.env.VITE_ADMIN_EMAIL || "").toLowerCase().trim();
  const allowed = [...ADMIN_CONFIG.emails, envAdmin].filter(Boolean);
  return allowed.includes(lower);
}

