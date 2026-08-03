// Accessibility / Dynamic Type policy.
//
// The app's design sizes (see `components/Text` variants + theme) are the source of
// visual consistency and must NOT change at the default OS text size. When a patient
// increases the system text size (iOS Dynamic Type / Android Font size), text scales
// up but is capped here so the layout does not break.
//
// `MAX_FONT_SCALE` is the global ceiling passed as `maxFontSizeMultiplier`. Compact
// surfaces (badges, chips, tab labels, counters) use a tighter cap to avoid clipping
// inside fixed-size boxes.
export const MAX_FONT_SCALE = 1.3;

export const MAX_FONT_SCALE_COMPACT = 1.15;

// Weight encoded via fontFamily.
//
// `components/Text` strips `fontWeight` (the iOS 26 SDK double-applies it on top of an explicit
// fontFamily), so styles that express weight only via `fontWeight: '500'|'600'|'700'` would
// render Outfit-Regular instead of the intended bold. `WEIGHT_TO_OUTFIT` maps a requested weight
// onto the matching Outfit face; `OUTFIT_WEIGHT_RANK` lets Text upgrade only to a HEAVIER face
// (never lighter than the variant already chose). All faces are bundled on both platforms.
export const WEIGHT_TO_OUTFIT: Record<string, string> = {
    100: 'Outfit-Thin',
    200: 'Outfit-ExtraLight',
    300: 'Outfit-Light',
    400: 'Outfit-Regular',
    normal: 'Outfit-Regular',
    500: 'Outfit-Medium',
    600: 'Outfit-SemiBold',
    700: 'Outfit-Bold',
    bold: 'Outfit-Bold',
    800: 'Outfit-ExtraBold',
    900: 'Outfit-Black',
};

export const OUTFIT_WEIGHT_RANK: Record<string, number> = {
    'Outfit-Thin': 100,
    'Outfit-ExtraLight': 200,
    'Outfit-Light': 300,
    'Outfit-Regular': 400,
    'Outfit-Medium': 500,
    'Outfit-SemiBold': 600,
    'Outfit-Bold': 700,
    'Outfit-ExtraBold': 800,
    'Outfit-Black': 900,
};

// iOS "Bold Text" accessibility support.
//
// Our design system encodes weight via the Outfit `fontFamily` (not `fontWeight`, which
// `components/Text` strips for deterministic rendering). The OS Bold Text setting therefore
// has no effect on our custom-font text. When it is enabled we bump each family one step
// heavier using this map. All target families are bundled on both platforms (iOS
// `Info.plist` UIAppFonts + Android `assets/fonts`). Families not listed fall back to
// themselves (no change). iOS-only: Android has no system Bold Text setting.
export const BOLD_FONT_MAP: Record<string, string> = {
    'Outfit-Thin': 'Outfit-Light',
    'Outfit-ExtraLight': 'Outfit-Light',
    'Outfit-Light': 'Outfit-Regular',
    'Outfit-Regular': 'Outfit-SemiBold',
    'Outfit-Medium': 'Outfit-Bold',
    'Outfit-SemiBold': 'Outfit-Bold',
    'Outfit-Bold': 'Outfit-ExtraBold',
    'Outfit-ExtraBold': 'Outfit-Black',
    'Outfit-Black': 'Outfit-Black',
};
