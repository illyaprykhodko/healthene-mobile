// outsource dependencies
import Svg, { Path } from 'react-native-svg';
import { View, StyleSheet } from 'react-native';
import React, { memo, PropsWithChildren } from 'react';

// local dependencies
import { COLORS } from 'constants/colors';

const styles = StyleSheet.create({
    container: {
        width: 180,
        height: 43,
        position: 'relative',
        justifyContent: 'center',
    },
    svgBackground: {
        top: 0,
        left: 0,
        position: 'absolute',
    },
    content: {
        zIndex: 1,
        paddingLeft: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    flatContainer: {
        width: 173,
        height: 31,
        position: 'relative',
        justifyContent: 'center',
    },
});

interface HighlightProps {
    color?: string;
}

export const Highlight = memo<PropsWithChildren<HighlightProps>>(({ color = COLORS.DARKER_PINK, children }) => (
    <View style={styles.container}>
        <Svg width="180" height="43" viewBox="0 0 180 43" style={styles.svgBackground}>
            <Path
                fill={color}
                fillOpacity="1"
                d="M6.64548 22.2308L2.58435 11.1099L145.462 1L151 6.05495V30.8242L145.462 39.9231L0 47L2.58435 30.8242L6.64548 22.2308Z"
            />
            <Path
                fill={color}
                fillOpacity="1"
                d="M133 19L142.396 0L150.67 4L151 9.05494V33.8242L142.396 38.5H133L142 25.5L133 19Z"
            />
        </Svg>
        <View style={styles.content}>
            {children}
        </View>
    </View>
));

interface FlatHighlightProps {
    color?: string;
}

export const FlatHighlight = memo<PropsWithChildren<FlatHighlightProps>>(({ color = COLORS.DARKER_PINK, children }) => (
    <View style={styles.flatContainer}>
        <Svg width="173" height="31" viewBox="0 0 173 31" fill="none" style={styles.svgBackground}>
            <Path
                fill={color}
                fillOpacity="0.3"
                d="M8.45193 8.91546L4.2791 0.411235L166.255 1.10332L172.327 5.18105L171.391 23.6025L164.784 30.0512L-8.72554e-05 26.955L3.53409 15.0732L8.45193 8.91546Z"
            />
            <Path
                fill={color}
                fillOpacity="0.15"
                d="M151.48 13.774L162.825 0.183294L172.031 3.63367L172.214 7.41211L171.278 25.8335L161.37 28.8166L150.743 28.2766L161.413 19.1254L151.48 13.774Z"
            />
        </Svg>
        <View style={styles.content}>
            {children}
        </View>
    </View>
));

export default Highlight;
