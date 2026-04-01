import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
  	extend: {
  		colors: {
  			primary: {
  				'50': '#EEF2FF',
  				'100': '#E0E7FF',
  				'200': '#C7D2FE',
  				'300': '#A5B4FC',
  				'400': '#818CF8',
  				'500': '#6366F1',
  				'600': '#4F46E5',
  				'700': '#4338CA',
  				'800': '#3730A3',
  				'900': '#312E81',
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				'50': '#FAF5FF',
  				'100': '#F3E8FF',
  				'200': '#E9D5FF',
  				'300': '#D8B4FE',
  				'400': '#C084FC',
  				'500': '#A855F7',
  				'600': '#9333EA',
  				'700': '#7E22CE',
  				'800': '#6B21A8',
  				'900': '#581C87',
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			success: {
  				'50': '#ECFDF5',
  				'100': '#D1FAE5',
  				'200': '#A7F3D0',
  				'300': '#6EE7B7',
  				'400': '#34D399',
  				'500': '#10B981',
  				'600': '#059669',
  				'700': '#047857',
  				'800': '#065F46',
  				'900': '#064E3B'
  			},
  			warning: {
  				'50': '#FFFBEB',
  				'100': '#FEF3C7',
  				'200': '#FDE68A',
  				'300': '#FCD34D',
  				'400': '#FBBF24',
  				'500': '#F59E0B',
  				'600': '#D97706',
  				'700': '#B45309',
  				'800': '#92400E',
  				'900': '#78350F'
  			},
  			error: {
  				'50': '#FEF2F2',
  				'100': '#FEE2E2',
  				'200': '#FECACA',
  				'300': '#FCA5A5',
  				'400': '#F87171',
  				'500': '#EF4444',
  				'600': '#DC2626',
  				'700': '#B91C1C',
  				'800': '#991B1B',
  				'900': '#7F1D1D'
  			},
  			neutral: {
  				'50': '#F8FAFC',
  				'100': '#F1F5F9',
  				'200': '#E2E8F0',
  				'300': '#CBD5E1',
  				'400': '#94A3B8',
  				'500': '#64748B',
  				'600': '#475569',
  				'700': '#334155',
  				'800': '#1E293B',
  				'900': '#0F172A'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			/* Design System v2 — Chalk & Stone */
  			ds: {
  				bg: 'hsl(var(--ds-bg))',
  				surface: 'hsl(var(--ds-surface))',
  				'surface-2': 'hsl(var(--ds-surface-2))',
  				'surface-elevated': 'hsl(var(--ds-surface-elevated))',
  				text: 'hsl(var(--ds-text))',
  				'text-muted': 'hsl(var(--ds-text-muted))',
  				'text-faint': 'hsl(var(--ds-text-faint))',
  				accent: 'hsl(var(--ds-accent))',
  				'accent-hover': 'hsl(var(--ds-accent-hover))',
  				border: 'hsl(var(--ds-border))',
  				'border-subtle': 'hsl(var(--ds-border-subtle))',
  			}
  		},
  		fontFamily: {
  			sans: [
  				'Inter',
  				'system-ui',
  				'-apple-system',
  				'sans-serif'
  			],
  			mono: [
  				'JetBrains Mono',
  				'Menlo',
  				'monospace'
  			]
  		},
  		fontSize: {
  			xs: [
  				'0.75rem',
  				{
  					lineHeight: '1rem'
  				}
  			],
  			sm: [
  				'0.875rem',
  				{
  					lineHeight: '1.25rem'
  				}
  			],
  			base: [
  				'1rem',
  				{
  					lineHeight: '1.5rem'
  				}
  			],
  			lg: [
  				'1.125rem',
  				{
  					lineHeight: '1.75rem'
  				}
  			],
  			xl: [
  				'1.25rem',
  				{
  					lineHeight: '1.75rem'
  				}
  			],
  			'2xl': [
  				'1.5rem',
  				{
  					lineHeight: '2rem'
  				}
  			],
  			'3xl': [
  				'1.875rem',
  				{
  					lineHeight: '2.25rem'
  				}
  			],
  			'4xl': [
  				'2.25rem',
  				{
  					lineHeight: '2.5rem'
  				}
  			]
  		},
  		spacing: {
  			'18': '4.5rem',
  			'22': '5.5rem'
  		},
  		borderRadius: {
  			xl: '1rem',
  			'2xl': '1.5rem',
  			'3xl': '2rem',
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		boxShadow: {
  			soft: '0 2px 15px -3px hsl(var(--shadow-color) / 0.15), 0 10px 20px -2px hsl(var(--shadow-color) / 0.08)',
  			medium: '0 4px 20px -2px hsl(var(--shadow-color) / 0.2), 0 12px 30px -4px hsl(var(--shadow-color) / 0.15)',
  			hard: '0 10px 40px -5px hsl(var(--shadow-color) / 0.3), 0 20px 50px -10px hsl(var(--shadow-color) / 0.25)',
  			glow: '0 0 20px hsl(var(--premium-glow) / 0.4)',
  			'glow-lg': '0 0 40px hsl(var(--premium-glow) / 0.6)'
  		},
  		backgroundImage: {
  			'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
  			'gradient-hero': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  			'gradient-card': 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
  			'gradient-accent': 'linear-gradient(45deg, #FA8BFF 0%, #2BD2FF 100%)'
  		},
  		animation: {
  			'fade-in': 'fadeIn 0.2s ease-in-out',
  			'fade-out': 'fadeOut 0.2s ease-in-out',
  			'slide-up': 'slideUp 0.3s ease-out',
  			'slide-down': 'slideDown 0.3s ease-out',
  			'slide-left': 'slideLeft 0.3s ease-out',
  			'slide-right': 'slideRight 0.3s ease-out',
  			'scale-in': 'scaleIn 0.2s ease-out',
  			'bounce-subtle': 'bounceSubtle 0.5s ease-in-out',
  			shimmer: 'shimmer 2s infinite',
  			'pulse-glow': 'pulseGlow 2s infinite'
  		},
  		keyframes: {
  			fadeIn: {
  				'0%': {
  					opacity: '0'
  				},
  				'100%': {
  					opacity: '1'
  				}
  			},
  			fadeOut: {
  				'0%': {
  					opacity: '1'
  				},
  				'100%': {
  					opacity: '0'
  				}
  			},
  			slideUp: {
  				'0%': {
  					transform: 'translateY(10px)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateY(0)',
  					opacity: '1'
  				}
  			},
  			slideDown: {
  				'0%': {
  					transform: 'translateY(-10px)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateY(0)',
  					opacity: '1'
  				}
  			},
  			slideLeft: {
  				'0%': {
  					transform: 'translateX(10px)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateX(0)',
  					opacity: '1'
  				}
  			},
  			slideRight: {
  				'0%': {
  					transform: 'translateX(-10px)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateX(0)',
  					opacity: '1'
  				}
  			},
  			scaleIn: {
  				'0%': {
  					transform: 'scale(0.95)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'scale(1)',
  					opacity: '1'
  				}
  			},
  			bounceSubtle: {
  				'0%, 100%': {
  					transform: 'translateY(0)'
  				},
  				'50%': {
  					transform: 'translateY(-5px)'
  				}
  			},
  			shimmer: {
  				'0%': {
  					backgroundPosition: '-1000px 0'
  				},
  				'100%': {
  					backgroundPosition: '1000px 0'
  				}
  			},
  			pulseGlow: {
  				'0%, 100%': {
  					boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
  				},
  				'50%': {
  					boxShadow: '0 0 40px rgba(99, 102, 241, 0.8)'
  				}
  			}
  		},
  		backdropBlur: {
  			xs: '2px'
  		}
  	}
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}
export default config
