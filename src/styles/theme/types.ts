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
  brandTeal?: string;
  brandInfo?: string;

  primary: string;
  secondary: string;
  background: string;
  surface: string;
  surfaceAlt?: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  aqua: string;
  // App-specific extensions
  successAlt?: string; // original green #96E072
  muted?: string; // disabled background #EEEEEE
  textMuted?: string; // disabled text #888888
  successAltText?: string; // CTA text color '#4E733C'
  finishPillBg?: string;
  finishPillText?: string;
  // Anytime icons palette
  anytimeFoodBg?: string;
  anytimeFoodFg?: string;
  anytimeDrinkBg?: string;
  anytimeDrinkFg?: string;
  anytimeSupplementBg?: string;
  anytimeSupplementFg?: string;
  anytimeMeasurementBg?: string;
  anytimeMeasurementFg?: string;
  anytimeActivityBg?: string;
  anytimeActivityFg?: string;
  anytimeMonoBg?: string;
  anytimeMonoFg?: string;
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
    xl?: number;
  };
  dark: boolean;
}
