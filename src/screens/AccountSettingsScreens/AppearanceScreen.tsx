// outsource dependencies
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import FeatherIcon from '@react-native-vector-icons/feather';

// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { OFFSET } from 'constants/offset';
import { useTheme } from 'hooks/useTheme';
import { useHaptic } from 'hooks/useHaptic';
import { ThemeMode, useThemeContext } from 'providers/ThemeProvider';

type FeatherIconName = React.ComponentProps<typeof FeatherIcon>['name'];

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: FeatherIconName; description: string }[] = [
    { mode: 'light', label: 'Light', icon: 'sun', description: 'Always use light appearance' },
    { mode: 'dark', label: 'Dark', icon: 'moon', description: 'Always use dark appearance' },
    { mode: 'system', label: 'System', icon: 'smartphone', description: 'Follow device settings' },
];

const AppearanceScreen: React.FC = () => {
    const theme = useTheme();
    const haptics = useHaptic();
    const { themeMode, setThemeMode } = useThemeContext();

    return (
        <Screen initialized>
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
                    <Text
                        variant="h5"
                        style={styles.sectionTitle}
                        color={theme.colors.textSecondary}
                    >
                        COLOR SCHEME
                    </Text>
                    {THEME_OPTIONS.map((option, index) => {
                        const active = themeMode === option.mode;
                        const isLast = index === THEME_OPTIONS.length - 1;
                        return (
                            <Pressable
                                key={option.mode}
                                onPress={() => {
                                    haptics.selection();
                                    setThemeMode(option.mode);
                                }}
                                style={[
                                    styles.row,
                                    !isLast && { borderBottomColor: theme.colors.border, borderBottomWidth: 1 },
                                ]}
                            >
                                <View style={[styles.iconWrap, { backgroundColor: active ? theme.colors.primary : theme.colors.surfaceAlt }]}>
                                    <FeatherIcon
                                        size={18}
                                        name={option.icon}
                                        color={active ? theme.colors.white : theme.colors.textSecondary}
                                    />
                                </View>
                                <View style={styles.labelWrap}>
                                    <Text variant="body" color={theme.colors.text}>{option.label}</Text>
                                    <Text variant="h5" color={theme.colors.textSecondary} style={styles.description}>
                                        {option.description}
                                    </Text>
                                </View>
                                <FeatherIcon
                                    size={22}
                                    name={active ? 'check-circle' : 'circle'}
                                    color={active ? theme.colors.primary : theme.colors.border}
                                />
                            </Pressable>
                        );
                    })}
                </View>
            </View>
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: OFFSET.VERTICAL,
    },
    section: {
        borderRadius: 12,
        overflow: 'hidden',
        marginHorizontal: OFFSET.HORIZONTAL,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.5,
        paddingTop: OFFSET.VERTICAL,
        paddingBottom: OFFSET.VERTICAL / 2,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.VERTICAL,
    },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: OFFSET.HORIZONTAL,
    },
    labelWrap: {
        flex: 1,
    },
    description: {
        fontSize: 12,
        marginTop: 2,
    },
});

export default AppearanceScreen;
