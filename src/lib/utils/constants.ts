// Color palette constants from coolors.co
export const THEME_COLORS = {
  jet: {
    DEFAULT: '#31312E',
    50: '#f7f7f6',
    100: '#e8e8e6',
    200: '#d7d7d4',
    300: '#afafaa',
    400: '#87877f',
    500: '#31312e',
    600: '#282826',
    700: '#1e1e1c',
    800: '#141413',
    900: '#0a0a09',
  },
  isabelline: {
    DEFAULT: '#FBF7F3',
    50: '#fefdfd',
    100: '#fdfcfa',
    200: '#fdfaf8',
    300: '#fcf9f6',
    400: '#fbf7f3',
    500: '#fbf7f3',
    600: '#e2c6a9',
    700: '#ca945f',
    800: '#946331',
    900: '#4a3119',
  },
  white: {
    DEFAULT: '#FFFFFF',
    50: '#ffffff',
    100: '#ffffff',
    200: '#ffffff',
    300: '#ffffff',
    400: '#cccccc',
    500: '#ffffff',
    600: '#999999',
    700: '#666666',
    800: '#333333',
    900: '#000000',
  },
  asparagus: {
    DEFAULT: '#729A4B',
    50: '#e3ecd9',
    100: '#c7dab4',
    200: '#abc78e',
    300: '#8fb569',
    400: '#729a4b',
    500: '#729a4b',
    600: '#5c7b3d',
    700: '#455c2d',
    800: '#2e3e1e',
    900: '#171f0f',
  },
  champagne: {
    DEFAULT: '#EDDCD2',
    50: '#fcf8f6',
    100: '#f8f1ed',
    200: '#f5ebe5',
    300: '#f1e4dc',
    400: '#eddcd2',
    500: '#eddcd2',
    600: '#d4ab93',
    700: '#ba7953',
    800: '#804f33',
    900: '#40281a',
  },
} as const;

// Extended array format from coolors.co
export const EXTENDED_PALETTE = [
  {
    name: "Jet",
    hex: "31312E",
    rgb: [49, 49, 46],
    cmyk: [0, 0, 6, 81],
    hsb: [60, 6, 19],
    hsl: [60, 3, 19],
    lab: [20, -1, 2]
  },
  {
    name: "Isabelline",
    hex: "FBF7F3",
    rgb: [251, 247, 243],
    cmyk: [0, 2, 3, 2],
    hsb: [30, 3, 98],
    hsl: [30, 50, 97],
    lab: [97, 1, 2]
  },
  {
    name: "White",
    hex: "FFFFFF",
    rgb: [255, 255, 255],
    cmyk: [0, 0, 0, 0],
    hsb: [0, 0, 100],
    hsl: [0, 0, 100],
    lab: [100, 0, 0]
  },
  {
    name: "Asparagus",
    hex: "729A4B",
    rgb: [114, 154, 75],
    cmyk: [26, 0, 51, 40],
    hsb: [90, 51, 60],
    hsl: [90, 34, 45],
    lab: [59, -28, 37]
  },
  {
    name: "Champagne pink",
    hex: "EDDCD2",
    rgb: [237, 220, 210],
    cmyk: [0, 7, 11, 7],
    hsb: [22, 11, 93],
    hsl: [22, 43, 88],
    lab: [89, 4, 7]
  }
] as const;

// Simple formats
export const CSV_COLORS = "31312E,FBF7F3,FFFFFF,729A4B,EDDCD2";
export const HEX_COLORS = ["#31312E", "#FBF7F3", "#FFFFFF", "#729A4B", "#EDDCD2"];
export const COLOR_ARRAY = ["31312E", "FBF7F3", "FFFFFF", "729A4B", "EDDCD2"];
export const COLOR_OBJECT = {
  "Jet": "31312E",
  "Isabelline": "FBF7F3", 
  "White": "FFFFFF",
  "Asparagus": "729A4B",
  "Champagne pink": "EDDCD2"
};

// Semantic color mappings
export const SEMANTIC_COLORS = {
  primary: THEME_COLORS.asparagus,
  secondary: THEME_COLORS.champagne,
  neutral: THEME_COLORS.jet,
  background: THEME_COLORS.isabelline,
  surface: THEME_COLORS.white,
} as const;

// Theme configuration
export const THEME_CONFIG = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['Fira Code', 'SF Mono', 'monospace'],
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    DEFAULT: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    full: '9999px',
  },
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.25rem',
    xl: '1.5rem',
    '2xl': '2rem',
    '3xl': '3rem',
  },
  shadows: {
    soft: '0 2px 15px -3px rgba(114, 154, 75, 0.07), 0 10px 20px -2px rgba(114, 154, 75, 0.04)',
    elevated: '0 10px 25px -5px rgba(49, 49, 46, 0.1), 0 10px 10px -5px rgba(49, 49, 46, 0.04)',
  },
} as const;

// Utility function to get color with opacity
export function getColorWithOpacity(color: string, opacity: number): string {
  // Remove # if present
  const hex = color.replace('#', '');
  
  // Parse hex to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// Utility function to get HSL values for CSS variables
export function hexToHSL(hex: string): string {
  // Remove # if present
  const cleanHex = hex.replace('#', '');
  
  // Parse hex to RGB
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
