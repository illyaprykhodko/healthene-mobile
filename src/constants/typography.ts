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
