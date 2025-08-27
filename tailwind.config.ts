import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Swiftly Brand Colors
        primary: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d6ff',
          300: '#a4b8ff',
          400: '#7b91ff',
          500: '#5b6bff', // Main primary color
          600: '#4a4aff',
          700: '#3d3dff',
          800: '#3333cc',
          900: '#2a2a99',
          950: '#1a1a66',
        },
        secondary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9', // Main secondary color
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        accent: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef', // Main accent color
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
          950: '#4a044e',
        },
        
        // Swiftly Specific Colors (from your design)
        swiftly: {
          'dark-blue': '#111C59',
          'dark-navy': '#0F1626',
          'medium-gray': '#4F5F73',
          'light-gray': '#ADB3BD',
          'light-bg': '#F8FAFC',
        },
        
        // Semantic Colors
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e', // Main success color
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Main warning color
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444', // Main error color
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        
        // Neutral Colors
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
        
        // Background Colors
        background: {
          primary: '#ffffff',
          secondary: '#f8fafc',
          tertiary: '#f1f5f9',
          dark: '#0f172a',
          'dark-secondary': '#1e293b',
        },
        
        // Text Colors
        text: {
          primary: '#0f172a',
          secondary: '#475569',
          tertiary: '#64748b',
          muted: '#94a3b8',
          inverse: '#ffffff',
          'inverse-muted': '#cbd5e1',
        },
        
        // Border Colors
        border: {
          primary: '#e2e8f0',
          secondary: '#cbd5e1',
          tertiary: '#94a3b8',
          accent: '#3b82f6',
          success: '#22c55e',
          warning: '#f59e0b',
          error: '#ef4444',
        },
        
        // Legacy colors for backward compatibility
        'accent-blue': '#3B82F6',
        'accent-cyan': '#06B6D4',
        'accent-purple': '#8B5CF6',
        'charcoal': '#1F2937',
      },
      
      fontFamily: {
        sans: ['Libre Franklin', 'system-ui', 'sans-serif'],
        display: ['Libre Franklin', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        'libre-franklin': ['Libre Franklin', 'system-ui', 'sans-serif'],
      },
      
      // Global Typography Rules to Prevent Text Clipping
      // These ensure proper line-height for all text elements
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5rem' }],      // 12px with 24px line-height
        'sm': ['0.875rem', { lineHeight: '1.625rem' }],   // 14px with 26px line-height
        'base': ['1rem', { lineHeight: '1.75rem' }],      // 16px with 28px line-height
        'lg': ['1.125rem', { lineHeight: '1.875rem' }],   // 18px with 30px line-height
        'xl': ['1.25rem', { lineHeight: '2rem' }],        // 20px with 32px line-height
        '2xl': ['1.5rem', { lineHeight: '2.25rem' }],     // 24px with 36px line-height
        '3xl': ['1.875rem', { lineHeight: '2.5rem' }],    // 30px with 40px line-height
        '4xl': ['2.25rem', { lineHeight: '2.75rem' }],    // 36px with 44px line-height
        '5xl': ['3rem', { lineHeight: '3.5rem' }],        // 48px with 56px line-height
        '6xl': ['3.75rem', { lineHeight: '4rem' }],       // 60px with 64px line-height
        '7xl': ['4.5rem', { lineHeight: '4.5rem' }],      // 72px with 72px line-height
        '8xl': ['6rem', { lineHeight: '6rem' }],          // 96px with 96px line-height
        '9xl': ['8rem', { lineHeight: '8rem' }],          // 128px with 128px line-height
      },
      
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-out': 'slideOut 0.3s ease-in',
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-out': 'fadeOut 0.3s ease-in',
        'scale-in': 'scaleIn 0.2s ease-out',
        'scale-out': 'scaleOut 0.2s ease-in',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
      },
      
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)' },
          '100%': { boxShadow: '0 0 30px rgba(59, 130, 246, 0.8)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideOut: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      
      // Extended spacing for consistent design system
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        'text-xs': '0.25rem',    // 4px padding for small text
        'text-sm': '0.375rem',   // 6px padding for small text
        'text-base': '0.5rem',   // 8px padding for base text
        'text-lg': '0.625rem',   // 10px padding for large text
        'text-xl': '0.75rem',    // 12px padding for xl text
        'text-2xl': '1rem',      // 16px padding for 2xl text
        'text-3xl': '1.25rem',   // 20px padding for 3xl text
        'text-4xl': '1.5rem',    // 24px padding for 4xl text
        'text-5xl': '2rem',      // 32px padding for 5xl text
      },
      
      // Extended border radius for modern design
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      
      // Extended shadows for depth
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'strong': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 2px 10px -2px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-lg': '0 0 40px rgba(59, 130, 246, 0.4)',
      },
      
      // Extended z-index for layering
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      
      // Custom Typography Utilities for Consistent Text Rendering
      // Custom line-height utilities that ensure no text clipping
      lineHeight: {
        'heading': '1.2',        // Tight for headings
        'body': '1.6',           // Comfortable for body text
        'loose': '1.8',          // Very loose for readability
        'tight': '1.4',          // Slightly tight but safe
      },
    },
  },
  plugins: [],
}

export default config
