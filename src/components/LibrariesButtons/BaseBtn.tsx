// outsource dependencies
import React, { memo, useCallback } from 'react';
import Icon from '@react-native-vector-icons/fontawesome5';
import { StyleSheet, TouchableOpacity, View, StyleProp, ViewStyle } from 'react-native';

// local dependencies
import Text from 'components/Text.tsx';
import { useTheme } from 'hooks/useTheme.ts';

// Route constants
const VIDEO = 'VIDEO';
const QUESTION = 'QUESTION';

type NavigationAttr = Record<string, any>;

interface BaseBtnProps {
  size?: number;
  route: string;
  color: string;
  label: string;
  change?: boolean;
  disabled?: boolean;
  wrapParams?: boolean;
  icon: 'play' | 'question';
  style?: StyleProp<ViewStyle>;
  navigationAttr: NavigationAttr;
}

const BaseActionBtn = memo(({
    icon,
    style,
    route,
    color,
    label,
    size = 12,
    change = true,
    navigationAttr,
    disabled = false,
    wrapParams = false,
}: BaseBtnProps) => {
    const theme = useTheme();

    const goTo = useCallback(() => {
        // RootNavigation.navigate(
        //     route,
        //     wrapParams ? { params: navigationAttr } : navigationAttr
        // );
    }, [route, navigationAttr, wrapParams]);

    return (
        <TouchableOpacity
            onPress={goTo}
            disabled={disabled}
            style={[
                styles.buttonContainer,
                {
                    borderColor: theme.colors.border,
                    paddingVertical: theme.spacing.xs,
                    borderRadius: theme.borderRadius.xl,
                    paddingHorizontal: theme.spacing.sm,
                },
                style,
            ]}
        >
            <View
                style={[
                    styles.iconBtn,
                    {
                        marginRight: theme.spacing.xs,
                        borderRadius: theme.borderRadius.xl,
                        backgroundColor: change ? color : theme.colors.grey,
                    },
                ]}
            >
                <Icon iconStyle="solid" name={icon} size={size} color={theme.colors.white} style={styles.icon} />
            </View>
            <Text variant="common">{label}</Text>
        </TouchableOpacity>
    );
});

BaseActionBtn.displayName = 'BaseActionBtn';

const styles = StyleSheet.create({
    buttonContainer: {
        marginLeft: 'auto',
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
    },
    iconBtn: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 30,
        height: 30,
    },
    icon: {
        position: 'absolute',
        zIndex: 99,
    },
});

interface ActionBtnProps {
  size?: number;
  change?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  navigationAttr: Record<string, any>;
}

export const PlayBtn = memo((props: ActionBtnProps) => {
    const theme = useTheme();
    return <BaseActionBtn
        {...props}
        icon="play"
        route={VIDEO}
        label="Video"
        color={theme.colors.red}
    />;
});

PlayBtn.displayName = 'PlayBtn';

export const QuestionBtn = memo((props: ActionBtnProps) => {
    const theme = useTheme();
    return <BaseActionBtn
        {...props}
        wrapParams
        icon="question"
        label="Question"
        route={QUESTION}
        color={theme.colors.blue}
    />;
});

QuestionBtn.displayName = 'QuestionBtn';
