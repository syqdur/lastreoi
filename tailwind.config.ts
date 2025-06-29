import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  safelist: [
    // Theme colors for dynamic styling
    'border-pink-500', 'border-purple-500', 'border-blue-500', 'border-green-500',
    'bg-pink-500', 'bg-purple-500', 'bg-blue-500', 'bg-green-500',
    'bg-pink-50', 'bg-purple-50', 'bg-blue-50', 'bg-green-50',
    'bg-pink-500/10', 'bg-purple-500/10', 'bg-blue-500/10', 'bg-green-500/10',
    'bg-pink-500/20', 'bg-purple-500/20', 'bg-blue-500/20', 'bg-green-500/20',
    'ring-pink-500/20', 'ring-purple-500/20', 'ring-blue-500/20', 'ring-green-500/20',
    'shadow-pink-500/10', 'shadow-purple-500/10', 'shadow-blue-500/10', 'shadow-green-500/10',
    'text-pink-400', 'text-purple-400', 'text-blue-400', 'text-green-400',
    'text-pink-500', 'text-purple-500', 'text-blue-500', 'text-green-500',
    'text-pink-600', 'text-purple-600', 'text-blue-600', 'text-green-600',
    'hover:bg-pink-500/20', 'hover:bg-purple-500/20', 'hover:bg-blue-500/20', 'hover:bg-green-500/20',
    'hover:border-pink-500', 'hover:border-purple-500', 'hover:border-blue-500', 'hover:border-green-500',
    'from-pink-500/10', 'from-purple-500/10', 'from-blue-500/10', 'from-green-500/10',
    'to-rose-400/10', 'to-violet-400/10', 'to-cyan-400/10', 'to-emerald-400/10',
    // Background gradients
    'bg-gradient-to-br', 'from-pink-50', 'from-purple-50', 'from-blue-50', 'from-green-50',
    'via-white', 'to-rose-50', 'to-violet-50', 'to-cyan-50', 'to-emerald-50',
    // Background decorations
    'bg-pink-300', 'bg-purple-300', 'bg-blue-300', 'bg-green-300',
    'bg-rose-300', 'bg-violet-300', 'bg-cyan-300', 'bg-emerald-300',
    'bg-pink-200', 'bg-purple-200', 'bg-blue-200', 'bg-green-200',
    // Text gradients
    'from-pink-500', 'from-purple-500', 'from-blue-500', 'from-green-500',
    'via-rose-500', 'via-violet-500', 'via-cyan-500', 'via-emerald-500',
    'to-pink-600', 'to-purple-600', 'to-blue-600', 'to-green-600'
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "shimmer": "shimmer 2s infinite",
      },
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
