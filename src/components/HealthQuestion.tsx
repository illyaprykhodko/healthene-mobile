// outsource dependencies
import { useNavigation } from '@react-navigation/native';
import React, { memo, useCallback, useMemo } from 'react';
import Icon from '@react-native-vector-icons/fontawesome5';
import { View, StyleSheet, TouchableOpacity } from 'react-native';

// local dependencies
import Text from 'components/Text';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import { COLORS } from 'constants/colors';
import { ROUTES } from 'constants/routes';
import { QUESTION_TYPE } from 'constants/spec';
import { useGetDiseaseQuestionsQuery } from 'store/api/questionApi';
import type { QuestionCategory, DiseaseQuestion } from 'types/question';

interface HealthQuestionProps {
    date: string;
    isFutureDate?: boolean;
}

export const HealthQuestion: React.FC<HealthQuestionProps> = memo(({
    date,
    isFutureDate = false,
}) => {
    const theme = useTheme();
    const navigation = useNavigation<any>();

    const { data: questions = [], isLoading } = useGetDiseaseQuestionsQuery(date, {
        skip: !date,
    });

    const questionCount = useMemo(() => {
        return questions.reduce((sum: number, category: QuestionCategory) => {
            return sum + (category.questions?.length || 0);
        }, 0);
    }, [questions]);

    const hasQuestions = useMemo(() => {
        return questions.some((category: QuestionCategory) =>
            category.questions?.some((q: DiseaseQuestion) => q.question)
        );
    }, [questions]);

    const handlePress = useCallback(() => {
        if (isFutureDate || !hasQuestions) { return; }

        const firstCategory = questions.find((c: QuestionCategory) =>
            c.questions && c.questions.length > 0
        );
        const firstQuestion = firstCategory?.questions?.[0];

        if (firstQuestion) {
            navigation.navigate(ROUTES.QUESTION, {
                params: {
                    backLink: 'DayOverview',
                    question: {
                        ...firstQuestion,
                        questionType: QUESTION_TYPE.DISEASE_QUESTION,
                    },
                },
            });
        }
    }, [questions, navigation, isFutureDate, hasQuestions]);

    // Don't render if no questions or loading
    if (isLoading || !hasQuestions) {
        return null;
    }

    const iconBgColor = isFutureDate
        ? COLORS.LIGHT_GREY
        : COLORS.LIGHT_BLUE;
    const iconColor = isFutureDate
        ? COLORS.WHITE
        : COLORS.BLUE;

    return (
        <View style={[styles.container, isFutureDate && styles.opacityFuture]}>
            <TouchableOpacity
                onPress={handlePress}
                disabled={isFutureDate}
                style={styles.touchable}
            >
                <View
                    style={[
                        styles.iconWrapper,
                        { backgroundColor: iconBgColor },
                    ]}
                >
                    <Icon
                        size={18}
                        name="question"
                        iconStyle="solid"
                        color={iconColor}
                    />
                    {questionCount > 0 && (
                        <View style={styles.indicator}>
                            <Text
                                color={COLORS.WHITE}
                                style={styles.indicatorText}
                            >
                                {questionCount > 99 ? '99+' : questionCount}
                            </Text>
                        </View>
                    )}
                </View>
                <Text variant="h4" numberOfLines={1} style={styles.title}>
                    Health Question
                </Text>
            </TouchableOpacity>
        </View>
    );
});

export default HealthQuestion;

const styles = StyleSheet.create({
    container: {
        marginTop: 10,
        marginLeft: 10,
    },
    touchable: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: OFFSET.VERTICAL,
        paddingRight: OFFSET.HORIZONTAL,
    },
    iconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: OFFSET.HORIZONTAL,
        marginLeft: OFFSET.POINT,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    indicator: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 20,
        height: 20,
        position: 'absolute',
        top: -5,
        right: -10,
        borderRadius: 10,
        backgroundColor: '#f55353',
    },
    indicatorText: {
        fontSize: 11,
        fontWeight: '600',
    },
    title: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    opacityFuture: {
        opacity: 0.4,
    },
});
