// outsource dependencies
import React, { memo, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/fontawesome5';
import {
    View,
    ViewStyle,
    StyleProp,
    StyleSheet,
} from 'react-native';

// local dependencies
import Text from 'components/Text';
import { COLORS } from 'constants/colors';
import { ROUTES } from 'constants/routes';
import type { QuestionType } from 'types/question';
import { PressableScale } from 'components/PressableScale';

export interface PlayBtnProps {
    size?: number;
    change?: boolean;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    navigationAttr: {
        id: number;
        video: any;
        backLink: string;
        library: string;
    };
}

export interface QuestionBtnProps {
    size?: number;
    change?: boolean;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    navigationAttr: {
        backLink: string;
        question: {
            id: number;
            questionType: QuestionType;
            question?: any;
            libraryItem?: any;
            alreadyAnswered?: boolean;
        };
    };
}

export const PlayBtn: React.FC<PlayBtnProps> = memo(({
    size = 12,
    style = null,
    change = true,
    navigationAttr,
    disabled = false,
}) => {
    const navigation = useNavigation<any>();

    const handlePress = useCallback(() => {
        navigation.navigate(ROUTES.VIDEO, navigationAttr);
    }, [navigation, navigationAttr]);

    return (
        <PressableScale
            haptic="light"
            disabled={disabled}
            onPress={handlePress}
            style={[styles.btn, style]}
        >
            <View
                style={[
                    styles.iconWrapper,
                    { backgroundColor: change ? COLORS.RED : COLORS.GREY },
                ]}
            >
                <Icon
                    iconStyle="solid"
                    name="play"
                    size={size}
                    color="#FFFFFF"
                    style={styles.icon}
                />
            </View>
            <Text style={styles.label}>Video</Text>
        </PressableScale>
    );
});

export const QuestionBtn: React.FC<QuestionBtnProps> = memo(({
    size = 12,
    style = null,
    change = true,
    navigationAttr,
    disabled = false,
}) => {
    const navigation = useNavigation<any>();

    const handlePress = useCallback(() => {
        navigation.navigate(ROUTES.QUESTION, { params: navigationAttr });
    }, [navigation, navigationAttr]);

    return (
        <PressableScale
            haptic="light"
            disabled={disabled}
            onPress={handlePress}
            style={[styles.btn, style]}
        >
            <View
                style={[
                    styles.iconWrapper,
                    { backgroundColor: change ? COLORS.BLUE : COLORS.GREY },
                ]}
            >
                <Icon
                    size={size}
                    name="question"
                    color="#FFFFFF"
                    iconStyle="solid"
                    style={styles.icon}
                />
            </View>
            <Text style={styles.label}>Question</Text>
        </PressableScale>
    );
});

export default {
    PlayBtn,
    QuestionBtn,
};

const styles = StyleSheet.create({
    btn: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        marginLeft: 0,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 20,
        borderColor: COLORS.GREY,
    },
    iconWrapper: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        width: 30,
        height: 30,
        borderRadius: 15,
        marginRight: 5,
    },
    icon: {
        position: 'absolute',
        zIndex: 99,
    },
    label: {
        fontWeight: '600',
    },
});
