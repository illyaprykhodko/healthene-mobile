// outsource dependencies
import React from 'react';
import { BlurView } from '@react-native-community/blur';
import { Platform, StyleProp, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';

// Liquid-glass tint vocabulary. Mirrors Apple HIG materials at a high level so call sites
// don't reason about platform-specific blur types directly.
export type GlassTint = 'extraLight' | 'light' | 'regular' | 'prominent' | 'dark';

// Maps semantic tint -> iOS BlurView `blurType`. Values match @react-native-community/blur API.
const TINT_TO_IOS_BLUR_TYPE: Record<GlassTint, 'xlight' | 'light' | 'regular' | 'prominent' | 'dark'> = {
    dark: 'dark',
    light: 'light',
    regular: 'regular',
    extraLight: 'xlight',
    prominent: 'prominent',
};

// Android can't do real-time blur cheaply, and iOS users with "Reduce Transparency" on
// also need a solid color. Same palette used for both so app feels consistent.
const TINT_TO_FALLBACK_COLOR: Record<GlassTint, string> = {
    dark: 'rgba(0, 0, 0, 0.55)',
    light: 'rgba(255, 255, 255, 0.85)',
    regular: 'rgba(245, 245, 247, 0.82)',
    prominent: 'rgba(255, 255, 255, 0.92)',
    extraLight: 'rgba(255, 255, 255, 0.92)',
};

interface GlassSurfaceProps extends ViewProps {
    tint?: GlassTint;
    /** Blur strength on iOS, 0-100. Ignored on Android. */
    intensity?: number;
    /** Override the Android / reduce-transparency fallback color. */
    fallbackColor?: string;
    style?: StyleProp<ViewStyle>;
}

export const GlassSurface: React.FC<GlassSurfaceProps> = ({
    style,
    children,
    fallbackColor,
    tint = 'light',
    intensity = 20,
    ...rest
}) => {
    const resolvedFallback = fallbackColor ?? TINT_TO_FALLBACK_COLOR[tint];

    if (Platform.OS === 'ios') {
        return (
            <BlurView
                blurAmount={intensity}
                style={[styles.surface, style]}
                blurType={TINT_TO_IOS_BLUR_TYPE[tint]}
                reducedTransparencyFallbackColor={resolvedFallback}
                {...rest}
            >
                {children}
            </BlurView>
        );
    }

    return (
        <View
            style={[styles.surface, { backgroundColor: resolvedFallback }, style]}
            {...rest}
        >
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    surface: {
        overflow: 'hidden',
    },
});
