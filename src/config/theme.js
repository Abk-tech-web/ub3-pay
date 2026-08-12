// Brand tokens derived from the Ub3 Pay mark: brushed-silver "U" breaking
// free of a chain, resolving into a violet "B3" still partly chained —
// liberation-from-custodial-banking as the visual thesis.
export const colors = {
  bg: '#0A0A0C',
  bgElevated: '#141417',
  bgCard: '#1B1B20',
  chrome: '#E7E8EA',
  chromeDim: '#9A9BA3',
  violet: '#8B5CF6',
  violetDeep: '#5B21B6',
  violetSoft: '#C4B5FD',
  success: '#34D399',
  danger: '#F87171',
  warning: '#FBBF24',
  textPrimary: '#F5F5F7',
  textSecondary: '#8E8E96',
  border: '#26262C',
};

export const gradients = {
  chromeToViolet: [colors.chrome, colors.violet],
  cardGlow: [colors.bgCard, colors.bgElevated],
};

export const typography = {
  display: 'SpaceGrotesk-Bold',     // confident display face — headlines, balances
  body: 'Inter-Regular',             // workhorse body face
  mono: 'RobotoMono-Medium',         // addresses, amounts, hashes
};

export const spacing = (n) => n * 4;

export const radii = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
};
