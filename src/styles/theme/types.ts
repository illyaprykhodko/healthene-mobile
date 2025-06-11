export interface ThemeColors {
  red: string;
  pink: string;
  darkerPink: string;
  green: string;
  purple: string;
  yellow: string;
  orange: string;
  lightGrey: string;
  lighterGrey: string;
  grey: string;
  darkGrey: string;
  darkerGrey: string;
  white: string;
  black: string;
  blue: string;
  darkBlue: string;
  brown: string;
  transparent: string;
  cerulean300: string;

  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  info: string;
}

export interface ThemeTypography {
  fontFamily: {
    regular: string;
    medium: string;
    bold: string;
  };
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
  letterSpacing: {
    tight: number;
    normal: number;
    wide: number;
  };
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

export interface Theme {
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
  };
  dark: boolean;
}
