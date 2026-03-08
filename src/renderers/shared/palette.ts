// Light and dark color themes for all SVG renderers
export const themes = {
  dark: {
    sky: '#0d1117',
    skyGradientEnd: '#161b22',
    ground: '#21262d',
    building: ['#1f6feb', '#238636', '#8b949e', '#f78166', '#a371f7'],
    window: '#e6edf3',
    windowLit: '#ffd33d',
    road: '#30363d',
    roadLine: '#484f58',
    text: '#c9d1d9',
    textMuted: '#8b949e',
    accent: '#58a6ff',
    cardBg: '#0d1117',
    cardBorder: '#30363d',
  },
  light: {
    sky: '#ffffff',
    skyGradientEnd: '#f6f8fa',
    ground: '#d0d7de',
    building: ['#0969da', '#1a7f37', '#656d76', '#cf222e', '#8250df'],
    window: '#24292f',
    windowLit: '#bf8700',
    road: '#d0d7de',
    roadLine: '#afb8c1',
    text: '#24292f',
    textMuted: '#656d76',
    accent: '#0969da',
    cardBg: '#ffffff',
    cardBorder: '#d0d7de',
  },
} as const;

export type Theme = (typeof themes)[keyof typeof themes];
