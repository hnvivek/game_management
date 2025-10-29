import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
    darkMode: "class",
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'var(--background)',
  			foreground: 'var(--foreground)',
  			card: {
  				DEFAULT: 'var(--card)',
  				foreground: 'var(--card-foreground)'
  			},
  			popover: {
  				DEFAULT: 'var(--popover)',
  				foreground: 'var(--popover-foreground)'
  			},
  			primary: {
  				DEFAULT: 'var(--primary)',
  				foreground: 'var(--primary-foreground)',
  				50: 'var(--primary-50)',
  				100: 'var(--primary-100)',
  				200: 'var(--primary-200)',
  				300: 'var(--primary-300)',
  				400: 'var(--primary-400)',
  				500: 'var(--primary-500)',
  				600: 'var(--primary-600)',
  				700: 'var(--primary-700)',
  				800: 'var(--primary-800)',
  				900: 'var(--primary-900)',
  			},
  			secondary: {
  				DEFAULT: 'var(--secondary)',
  				foreground: 'var(--secondary-foreground)'
  			},
  			muted: {
  				DEFAULT: 'var(--muted)',
  				foreground: 'var(--muted-foreground)'
  			},
  			accent: {
  				DEFAULT: 'var(--accent)',
  				foreground: 'var(--accent-foreground)'
  			},
  			destructive: {
  				DEFAULT: 'var(--destructive)',
  				foreground: 'var(--destructive-foreground)'
  			},
  			success: {
  				DEFAULT: 'var(--success)',
  				foreground: 'var(--success-foreground)',
  				50: 'var(--success-50)',
  				100: 'var(--success-100)',
  				200: 'var(--success-200)',
  				500: 'var(--success-500)',
  				600: 'var(--success-600)',
  				700: 'var(--success-700)',
  			},
  			warning: {
  				DEFAULT: 'var(--warning)',
  				foreground: 'var(--warning-foreground)',
  				50: 'var(--warning-50)',
  				100: 'var(--warning-100)',
  				200: 'var(--warning-200)',
  				300: 'var(--warning-300)',
  				400: 'var(--warning-400)',
  				500: 'var(--warning-500)',
  				600: 'var(--warning-600)',
  				700: 'var(--warning-700)',
  			},
  			gray: {
  				50: 'var(--gray-50)',
  				100: 'var(--gray-100)',
  				200: 'var(--gray-200)',
  				300: 'var(--gray-300)',
  				400: 'var(--gray-400)',
  				500: 'var(--gray-500)',
  				600: 'var(--gray-600)',
  				700: 'var(--gray-700)',
  				800: 'var(--gray-800)',
  				900: 'var(--gray-900)',
  			},
  			emerald: {
  				50: 'var(--emerald-50)',
  				100: 'var(--emerald-100)',
  				500: 'var(--emerald-500)',
  				600: 'var(--emerald-600)',
  				700: 'var(--emerald-700)',
  				800: 'var(--emerald-800)',
  			},
  			amber: {
  				50: 'var(--amber-50)',
  				500: 'var(--amber-500)',
  				600: 'var(--amber-600)',
  				700: 'var(--amber-700)',
  			},
  			orange: {
  				50: 'var(--orange-50)',
  				100: 'var(--orange-100)',
  				200: 'var(--orange-200)',
  				400: 'var(--orange-400)',
  				500: 'var(--orange-500)',
  				600: 'var(--orange-600)',
  				700: 'var(--orange-700)',
  			},
  			red: {
  				50: 'var(--red-50)',
  				100: 'var(--red-100)',
  				200: 'var(--red-200)',
  				500: 'var(--red-500)',
  				600: 'var(--red-600)',
  				700: 'var(--red-700)',
  			},
  			purple: {
  				50: 'var(--purple-50)',
  				100: 'var(--purple-100)',
  				600: 'var(--purple-600)',
  				700: 'var(--purple-700)',
  			},
  			blue: {
  				50: 'var(--blue-50)',
  				100: 'var(--blue-100)',
  				200: 'var(--blue-200)',
  				500: 'var(--blue-500)',
  				600: 'var(--blue-600)',
  				700: 'var(--blue-700)',
  			},
  			border: 'var(--border)',
  			input: 'var(--input)',
  			ring: 'var(--ring)',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			none: '0',
  			sm: 'calc(var(--radius) - 4px)',
  			base: 'calc(var(--radius) - 2px)',
  			md: 'var(--radius)',
  			lg: 'calc(var(--radius) + 2px)',
  			xl: 'calc(var(--radius) + 4px)',
  			'2xl': 'calc(var(--radius) + 8px)',
  			full: '9999px',
  		},
  		// Custom design tokens for consistent spacing and sizing
  		spacing: {
  			'18': '4.5rem',
  			'88': '22rem',
  			'128': '32rem',
  		},
  		// Container max widths
  		maxWidth: {
  			'2xl': '42rem',
  			'3xl': '48rem',
  			'4xl': '56rem',
  			'5xl': '64rem',
  			'6xl': '72rem',
  			'7xl': '80rem',
  		},
  		fontSize: {
  			'xs': ['0.75rem', { lineHeight: '1rem' }],
  			'sm': ['0.875rem', { lineHeight: '1.25rem' }],
  			'base': ['1rem', { lineHeight: '1.5rem' }],
  			'lg': ['1.125rem', { lineHeight: '1.75rem' }],
  			'xl': ['1.25rem', { lineHeight: '1.75rem' }],
  			'2xl': ['1.5rem', { lineHeight: '2rem' }],
  			'3xl': ['1.875rem', { lineHeight: '2.25rem' }],
  			'4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  			'5xl': ['3rem', { lineHeight: '1' }],
  			'6xl': ['3.75rem', { lineHeight: '1' }],
  		},
  		// Consistent button sizes
  		padding: {
  			'btn-sm': '0.5rem 1rem',
  			'btn-md': '0.75rem 1.5rem',
  			'btn-lg': '1rem 2rem',
  		},
  		// Consistent shadow depths
  		boxShadow: {
  			'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  			'sm': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  			'base': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  			'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  			'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  			'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  			'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  			'card-hover': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  			'nav': '0 1px 3px 0 rgb(0 0 0 / 0.1)',
  		},
  		// Transition utilities
  		transitionDuration: {
  			DEFAULT: '150ms',
  			'400': '400ms',
  		},
  		// Animation keyframes
  		keyframes: {
  			'fade-in': {
  				'0%': { opacity: '0' },
  				'100%': { opacity: '1' },
  			},
  			'slide-in-from-top': {
  				'0%': { transform: 'translateY(-100%)' },
  				'100%': { transform: 'translateY(0)' },
  			},
  			'slide-in-from-bottom': {
  				'0%': { transform: 'translateY(100%)' },
  				'100%': { transform: 'translateY(0)' },
  			},
  		},
  		animation: {
  			'fade-in': 'fade-in 0.5s ease-in-out',
  			'slide-in-from-top': 'slide-in-from-top 0.3s ease-out',
  			'slide-in-from-bottom': 'slide-in-from-bottom 0.3s ease-out',
  		},
  		// Grid utilities
  		gridTemplateColumns: {
  			'13': 'repeat(13, minmax(0, 1fr))',
  			'14': 'repeat(14, minmax(0, 1fr))',
  			'15': 'repeat(15, minmax(0, 1fr))',
  			'16': 'repeat(16, minmax(0, 1fr))',
  		}
  	}
  },
  plugins: [tailwindcssAnimate],
};
export default config;
