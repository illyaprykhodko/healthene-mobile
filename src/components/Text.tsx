// outsource dependencies
import React from 'react';
import { StyleSheet, Text as UIText, TextStyle } from 'react-native';
// local dependencies
import { useTheme } from 'hooks/useTheme';
import { useFontScale } from 'hooks/useFontScale';
import { useBoldTextEnabled } from 'hooks/useBoldTextEnabled';
import { BOLD_FONT_MAP, MAX_FONT_SCALE, OUTFIT_WEIGHT_RANK, WEIGHT_TO_OUTFIT } from 'constants/typography.ts';

// export type TextVariant = 'common' | 'bold' | 'caption';
export type TextVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'body'
  | 'bold'
  | 'small'
  | 'common'
  | 'caption'
  | 'semiBold';

interface TextProps {
    color?: string;
    variant?: TextVariant;
    numberOfLines?: number;
    children?: React.ReactNode;
    allowFontScaling?: boolean;
    maxFontSizeMultiplier?: number;
    style?: TextStyle | TextStyle[];
    textAlign?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

const allowedAlign = ['auto', 'left', 'right', 'center', 'justify'];

const Text: React.FC<TextProps> = ({
    style,
    color,
    children,
    textAlign,
    numberOfLines,
    variant = 'common',
    allowFontScaling = true,
    maxFontSizeMultiplier = MAX_FONT_SCALE,
    ...attr
}) => {
    const theme = useTheme();
    // `fontScale` re-renders on OS text-size change — including when the app returns to the
    // foreground after the user changed the setting in Settings (iOS delivers the live event
    // unreliably while backgrounded, so we re-read on AppState 'active'). `boldText` reflects
    // the iOS "Bold Text" setting (false on Android).
    const fontScale = useFontScale();
    const boldText = useBoldTextEnabled();
    const allStyles: TextStyle[] = [textStyles[variant] || textStyles.common];
    if (textAlign && allowedAlign.includes(textAlign)) {
        allStyles.push({ textAlign });
    }
    allStyles.push({ color: color || theme.colors.text });
    if (style) {
        if (Array.isArray(style)) { allStyles.push(...style); } else { allStyles.push(style); }
    }
    const flat = StyleSheet.flatten(allStyles);
    // RN 0.84 / iOS 26 SDK changed CoreText to apply `fontWeight` ON TOP of an explicit
    // `fontFamily` (synth-bold / weight-axis interpolation), so weight must be expressed via the
    // Outfit fontFamily, not `fontWeight`. But many styles encode weight only as `fontWeight`
    // (e.g. `fontWeight: '700'`); simply deleting it dropped the intended boldness and rendered
    // Outfit-Regular. Instead, map the requested weight onto the matching Outfit face — but only
    // UPGRADE to a heavier face (never lighter than the variant/caller chose) and only for Outfit
    // families (leave e.g. Nunito Sans untouched) — then drop `fontWeight` for deterministic
    // rendering.
    if (flat.fontWeight != null) {
        const targetFamily = WEIGHT_TO_OUTFIT[String(flat.fontWeight)];
        const currentFamily = typeof flat.fontFamily === 'string' ? flat.fontFamily : undefined;
        const isOutfitFamily = !currentFamily || currentFamily.startsWith('Outfit-');
        if (targetFamily && isOutfitFamily) {
            const currentRank = OUTFIT_WEIGHT_RANK[currentFamily ?? 'Outfit-Regular'] ?? 400;
            if (OUTFIT_WEIGHT_RANK[targetFamily] > currentRank) {
                flat.fontFamily = targetFamily;
            }
        }
        delete flat.fontWeight;
    }
    // iOS "Bold Text" accessibility setting: our weight is encoded via fontFamily (fontWeight
    // is stripped above), so bump the family one step heavier when it's on. No-op when off, or
    // for families not in the map. Android `boldText` is always false.
    if (boldText && flat.fontFamily) {
        flat.fontFamily = BOLD_FONT_MAP[flat.fontFamily] ?? flat.fontFamily;
    }
    // Accessibility text scaling: RN multiplies `fontSize` by the OS font scale (capped by
    // `maxFontSizeMultiplier`) but leaves an explicit `lineHeight` untouched, so large text
    // clips/overlaps. Scale `lineHeight` by the same effective multiplier to keep spacing
    // proportional. At the default OS size (fontScale === 1) this is a no-op, so the current
    // design renders pixel-identical.
    if (flat.lineHeight != null) {
        const effectiveScale = allowFontScaling ? Math.min(fontScale, maxFontSizeMultiplier) : 1;
        flat.lineHeight = flat.lineHeight * effectiveScale;
    }
    // iOS keeps a stale intrinsic-width measurement when the font size of an already-mounted
    // text changes in place (esp. with numberOfLines / width-constrained single lines), so the
    // label truncates ("Healthene®" -> "Health…") until a restart. Re-keying on the scale/bold
    // value remounts the native text node, forcing a fresh measure — same result as a cold start.
    // The key is stable across normal renders (changes only when the OS settings change).
    return (
        <UIText
            key={`${boldText ? 'b' : 'n'}-${fontScale}`}
            style={flat}
            numberOfLines={numberOfLines}
            allowFontScaling={allowFontScaling}
            maxFontSizeMultiplier={maxFontSizeMultiplier}
            {...attr}
        >
            {children}
        </UIText>
    );
};

export default Text;

const textStyles: Record<TextVariant, TextStyle> = {
    common: {
        fontSize: 16,
        fontFamily: 'Outfit-Regular',
    },
    bold: {
        fontSize: 16,
        fontFamily: 'Outfit-Bold',
    },
    semiBold: {
        fontSize: 16,
        fontFamily: 'Outfit-SemiBold',
    },
    h1: {
        fontSize: 32,
        lineHeight: 40,
        fontFamily: 'Outfit-Bold',
        letterSpacing: -0.5,
    },
    h2: {
        fontSize: 24,
        lineHeight: 32,
        fontFamily: 'Outfit-Bold',
        letterSpacing: -0.25,
    },
    h3: {
        fontSize: 20,
        lineHeight: 28,
        letterSpacing: 0.15,
        fontFamily: 'Outfit-Medium',
    },
    h4: {
        fontSize: 18,
        lineHeight: 24,
        fontFamily: 'Outfit-Regular',
        letterSpacing: 0.15,
    },
    h5: {
        fontSize: 16,
        lineHeight: 22,
        fontFamily: 'Outfit-Regular',
        letterSpacing: 0.44,
    },
    h6: {
        fontSize: 14,
        lineHeight: 20,
        fontFamily: 'Outfit-Regular',
        letterSpacing: 0.44,
    },
    body: {
        fontSize: 16,
        lineHeight: 24,
        fontFamily: 'Outfit-Regular',
        letterSpacing: 0.5,
    },
    caption: {
        fontSize: 12,
        lineHeight: 16,
        fontFamily: 'Outfit-Regular',
        letterSpacing: 0.4,
    },
    small: {
        fontSize: 10,
        lineHeight: 14,
        fontFamily: 'Outfit-Regular',
        letterSpacing: 0.4,
    },
};
