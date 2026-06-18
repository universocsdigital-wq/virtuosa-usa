import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
        xl: "2.5rem",
        "2xl": "2rem",
      },
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // ─── PALETA VIRTUOSA ──────────────────────────────────────────
      colors: {
        virtuosa: {
          // Backgrounds
          "warm-beige":      "#F7F1E8", // off-white da marca
          "cream":           "#F7F1E8", // fundo secundário
          "off-white":       "#F7F1E8", // fundo terciário
          "champagne":       "#E8D9C6", // champagne — sections alternadas

          // Brand cores
          "espresso":        "#2A1712", // espresso — overlays escuros
          "deep-brown":      "#3A2A24", // ink — texto principal
          "antique-gold":    "#C6A36A", // gold — acentos, CTAs
          "camel":           "#B38A62", // camel — elementos decorativos
          "light-brown":     "#6F5547", // muted — texto secundário com mais contraste
          "very-light-brown":"#D4C4B0", // texto terciário
          "medium-gray":     "#999999", // links, footer
        },
        // Aliases semânticos
        brand: {
          primary:   "#C6A36A", // Gold
          secondary: "#3A2A24", // Ink
          bg:        "#F7F1E8", // Off-white
          text:      "#3A2A24", // Ink
          muted:     "#6F5547", // Muted
        },
      },

      // ─── TIPOGRAFIA ───────────────────────────────────────────────
      fontFamily: {
        serif:    ["var(--font-playfair)", "Playfair Display", "Georgia", "serif"],
        sans:     ["var(--font-montserrat)", "Montserrat", "system-ui", "sans-serif"],
        display:  ["var(--font-playfair)", "Playfair Display", "Georgia", "serif"],
      },
      fontSize: {
        // Desktop
        "hero-xl":    ["4rem",    { lineHeight: "1.1", letterSpacing: "-0.02em" }], // 64px
        "hero-lg":    ["3.5rem",  { lineHeight: "1.1", letterSpacing: "-0.02em" }], // 56px
        "display":    ["3rem",    { lineHeight: "1.2", letterSpacing: "-0.01em" }], // 48px
        "title-xl":   ["2rem",    { lineHeight: "1.3" }],  // 32px
        "title":      ["1.75rem", { lineHeight: "1.3" }],  // 28px
        "subtitle":   ["1.5rem",  { lineHeight: "1.4" }],  // 24px
        "body-lg":    ["1rem",    { lineHeight: "1.6" }],  // 16px
        "body":       ["0.9375rem",{ lineHeight: "1.6" }], // 15px
        "body-sm":    ["0.875rem",{ lineHeight: "1.6" }],  // 14px
        "label":      ["0.8125rem",{ lineHeight: "1.4", letterSpacing: "0.08em" }], // 13px
        "caption":    ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.06em" }],  // 12px
      },

      // ─── ESPAÇAMENTO ──────────────────────────────────────────────
      spacing: {
        "section-desktop": "80px",
        "section-mobile":  "60px",
        "card":            "20px",
        "btn-x":           "32px",
        "btn-y":           "16px",
        "gap-cards":       "30px",
        "gap-mobile":      "20px",
      },

      // ─── BORDAS ───────────────────────────────────────────────────
      borderRadius: {
        "btn":   "4px",
        "card":  "2px",
        "none":  "0px",
        DEFAULT: "4px",
      },

      // ─── SOMBRAS ──────────────────────────────────────────────────
      boxShadow: {
        "card":        "0 2px 12px rgba(92, 61, 46, 0.08)",
        "card-hover":  "0 8px 32px rgba(92, 61, 46, 0.16)",
        "gold":        "0 4px 20px rgba(201, 169, 97, 0.25)",
        "nav":         "0 1px 0 rgba(92, 61, 46, 0.08)",
      },

      // ─── IMAGENS / ASPECT RATIO ───────────────────────────────────
      aspectRatio: {
        "hero":     "16 / 9",
        "category": "3 / 2",
        "product":  "4 / 5",
        "square":   "1 / 1",
      },

      // ─── TRANSIÇÕES ───────────────────────────────────────────────
      transitionDuration: {
        "smooth": "300ms",
        "fast":   "150ms",
      },
      transitionTimingFunction: {
        "premium": "cubic-bezier(0.4, 0, 0.2, 1)",
      },

      // ─── ANIMAÇÕES ────────────────────────────────────────────────
      keyframes: {
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "shimmer": {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "fade-up":         "fade-up 0.5s ease-out",
        "fade-in":         "fade-in 0.4s ease-out",
        "shimmer":         "shimmer 2s infinite linear",
        "accordion-down":  "accordion-down 0.2s ease-out",
        "accordion-up":    "accordion-up 0.2s ease-out",
      },

      // ─── BREAKPOINTS PERSONALIZADOS ───────────────────────────────
      screens: {
        xs: "390px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1400px",
      },

      // ─── MAX WIDTH ────────────────────────────────────────────────
      maxWidth: {
        "content": "1400px",
        "prose":   "680px",
        "narrow":  "480px",
      },

      // ─── Z-INDEX ──────────────────────────────────────────────────
      zIndex: {
        "nav":     "50",
        "overlay": "40",
        "modal":   "60",
        "toast":   "70",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
