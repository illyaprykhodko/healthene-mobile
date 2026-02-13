// outsource dependencies
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// local dependencies
import Text from 'components/Text';
import BackBtn from 'components/BackBtn';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import { ROUTES } from 'constants/routes';
import { Hamburger } from 'components/Hamburger';

export interface HeaderProps {
    // Center content
    title?: string;
    centerComponent?: React.ReactNode; // Overrides title (for TimeSwitcher)

    // Left side
    showBackButton?: boolean; // default: true
    onBackPress?: () => void;
    backLabel?: string; // default: "Back"
    isRootScreen?: boolean; // If true, back navigates to Main screen

    // Right side
    showHamburger?: boolean; // default: false
    onHamburgerPress?: () => void;

    // Navigation (for auto goBack/openDrawer)
    navigation?: any;
}

const Header: React.FC<HeaderProps> = ({
    title,
    centerComponent,
    showBackButton = true,
    onBackPress,
    backLabel = 'Back',
    isRootScreen = false,
    showHamburger = false,
    onHamburgerPress,
    navigation,
}) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    const handleBackPress = () => {
        if (onBackPress) {
            onBackPress();
        } else if (isRootScreen && navigation) {
            // Navigate to Main screen from root of nested stack
            const parent = navigation.getParent?.();
            if (parent) {
                parent.navigate(ROUTES.MAIN);
            } else {
                navigation.navigate(ROUTES.MAIN);
            }
        } else if (navigation?.goBack) {
            navigation.goBack();
        }
    };

    const handleHamburgerPress = () => {
        if (onHamburgerPress) {
            onHamburgerPress();
        } else if (navigation?.openDrawer) {
            navigation.openDrawer();
        }
    };

    return (
        <View
            style={[
                {
                    paddingTop: insets.top,
                    backgroundColor: theme.colors.primary,
                },
            ]}
        >
            <View style={styles.container}>
                <View style={[styles.side, styles.sideLeft]}>
                    {showBackButton && (
                        <BackBtn
                            label={backLabel}
                            onPress={handleBackPress}
                            color={theme.colors.white}
                        />
                    )}
                </View>

                <View style={styles.center}>
                    {centerComponent ? (
                        centerComponent
                    ) : title ? (
                        <Text variant="h3" color={theme.colors.white}>
                            {title}
                        </Text>
                    ) : null}
                </View>

                <View style={[styles.side, styles.sideRight]}>
                    {showHamburger && (
                        <Hamburger onPress={handleHamburgerPress} />
                    )}
                </View>
            </View>
        </View>
    );
};

export default Header;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.VERTICAL,
    },
    side: {
        minWidth: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sideLeft: {
        alignItems: 'flex-start',
    },
    sideRight: {
        alignItems: 'flex-end',
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
