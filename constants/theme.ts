export const Colors = {
  primary: '#f97316',
  primaryDark: '#ea580c',
  background: '#fff8f0',
  surface: '#ffffff',
  surfaceAlt: '#fef3e2',
  border: '#fed7aa',
  textPrimary: '#7c2d12',
  textSecondary: '#9a3412',
  textMuted: '#6b7280',
  danger: '#ef4444',
  warning: '#f97316',
  success: '#22c55e',
  tabActive: '#f97316',
  tabInactive: '#9ca3af',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const Typography = {
  heading: { fontSize: 20, fontWeight: '700' as const, color: '#7c2d12' },
  subheading: { fontSize: 16, fontWeight: '600' as const, color: '#7c2d12' },
  body: { fontSize: 14, color: '#6b7280' },
  caption: { fontSize: 12, color: '#6b7280' },
  label: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#9a3412',
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
} as const;
