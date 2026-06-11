// outsource dependencies
import Icon from '@react-native-vector-icons/fontawesome5';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { memo, useState, useCallback, useEffect } from 'react';
import {
    View,
    Alert,
    FlatList,
    Platform,
    TextInput,
    StyleSheet,
    BackHandler,
    TouchableOpacity,
    KeyboardAvoidingView,
} from 'react-native';

// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { useAppSelector } from 'store';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import { COLORS } from 'constants/colors';
import { ROUTES } from 'constants/routes';
import { navigate as rootNavigate } from 'services/navigation';
import { QUESTION_TYPE, QUESTION_RESPONSE_TYPE } from 'constants/spec';
import {
    useAnswerFoodQuestionMutation,
    useAnswerDiseaseQuestionMutation,
    useAnswerGeneralQuestionMutation,
} from 'store/api/questionApi';
import type { ResponseItem } from 'types/question';

const QuestionScreen: React.FC = () => {
    const theme = useTheme();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    // Handle nested params structure (from different navigation sources)
    const routeParams = route.params?.params || route.params || {};
    const { backLink, question: questionData } = routeParams;
    const { date } = useAppSelector(state => state.dayOverview);
    const user = useAppSelector(state => state.app.user);

    const questionType = questionData?.questionType;
    const isGeneralQuestion = questionType === QUESTION_TYPE.GENERAL_QUESTION;

    const questionContent = isGeneralQuestion
        ? questionData?.libraryItem
        : questionData?.question;

    const responseType = questionContent?.response?.type;
    const responseItems = questionContent?.response?.responseItems || [];

    const isUserEnteredResponse = responseType === QUESTION_RESPONSE_TYPE.USER_ENTERED_RESPONSE;
    const isFinalMessage = responseType === QUESTION_RESPONSE_TYPE.FINAL_MESSAGE;

    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [description, setDescription] = useState('');

    const [answerDisease, { isLoading: isAnsweringDisease }] = useAnswerDiseaseQuestionMutation();
    const [answerFood, { isLoading: isAnsweringFood }] = useAnswerFoodQuestionMutation();
    const [answerGeneral, { isLoading: isAnsweringGeneral }] = useAnswerGeneralQuestionMutation();

    const isLoading = isAnsweringDisease || isAnsweringFood || isAnsweringGeneral;

    const isSubmitDisabled = isUserEnteredResponse
        ? !description.trim()
        : isFinalMessage
            ? false
            : !selectedId;

    const navigateToOrigin = useCallback(() => {
        const target = typeof backLink === 'string' && backLink
            ? backLink
            : ROUTES.MAIN;

        if (navigation?.canGoBack?.()) {
            navigation.goBack();
        }

        rootNavigate(target as any, date ? ({ date } as any) : undefined);
    }, [navigation, backLink, date]);

    useEffect(() => {
        const handleBackPress = () => {
            navigateToOrigin();
            return true;
        };

        const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
        return () => subscription.remove();
    }, [navigateToOrigin]);

    const handleCancel = useCallback(() => {
        navigateToOrigin();
    }, [navigateToOrigin]);

    const handleSubmit = useCallback(async () => {
        if (isSubmitDisabled || isLoading) { return; }

        try {
            let result: any = null;

            switch (questionType) {
                case QUESTION_TYPE.DISEASE_QUESTION: {
                    const data: any = {
                        id: questionData.id,
                        answeredDate: `${date}T00:00:00`,
                    };

                    if (isUserEnteredResponse) {
                        data.description = description;
                        data.responseItem = responseItems[0];
                    } else if (!isFinalMessage && selectedId) {
                        data.responseItem = { id: selectedId };
                    }

                    result = await answerDisease(data).unwrap();
                    break;
                }

                case QUESTION_TYPE.FOOD_QUESTION: {
                    const data: any = {
                        id: questionData.id,
                        answeredTime: `${date}T00:00:00`,
                        patientQuestionAnswer: {
                            patient: { id: user?.id },
                            question: { id: questionContent?.id },
                        },
                    };

                    if (isUserEnteredResponse) {
                        data.patientQuestionAnswer.description = description;
                    } else if (!isFinalMessage && selectedId) {
                        data.patientQuestionAnswer.responseItem = { id: selectedId };
                    }

                    result = await answerFood(data).unwrap();
                    break;
                }

                case QUESTION_TYPE.GENERAL_QUESTION: {
                    const data: any = {
                        id: questionData.id,
                        libraryItem: { id: questionContent?.id },
                        patientQuestionAnswer: {
                            patient: { id: user?.id },
                            question: { id: questionContent?.id },
                        },
                    };

                    if (isUserEnteredResponse) {
                        data.patientQuestionAnswer.description = description;
                    } else if (!isFinalMessage && selectedId) {
                        data.patientQuestionAnswer.responseItem = { id: selectedId };
                    }

                    result = await answerGeneral(data).unwrap();
                    break;
                }

                default:
                    console.error(`Unknown question type: ${questionType}`);
                    return;
            }

            const hasFollowUp = isGeneralQuestion
                ? result?.libraryItem
                : result?.question;

            if (hasFollowUp && !isFinalMessage) {
                // Navigate to next question by updating params
                navigation.setParams({
                    params: {
                        backLink,
                        question: { ...result, questionType },
                    },
                });
                setSelectedId(null);
                setDescription('');
                Alert.alert('Success', 'Answer saved');
            } else {
                // No more questions, navigate back to origin
                Alert.alert('Success', 'Answer saved');
                navigateToOrigin();
            }
        } catch (error: any) {
            if (error?.data?.errorCode === 'CANNOT_ANSWER_QUESTION_FOR_FUTURE_DATE') {
                Alert.alert(
                    'Health Question',
                    'You can not answer a future question - please wait until the day will come.'
                );
            } else {
                Alert.alert(
                    'Error',
                    error?.data?.message || 'Failed to save answer. Please try again.'
                );
            }
        }
    }, [
        date,
        user,
        backLink,
        isLoading,
        navigation,
        answerFood,
        selectedId,
        description,
        questionType,
        questionData,
        answerDisease,
        responseItems,
        answerGeneral,
        isFinalMessage,
        questionContent,
        isSubmitDisabled,
        navigateToOrigin,
        isGeneralQuestion,
        isUserEnteredResponse,
    ]);

    const handleSelectItem = useCallback((id: number) => {
        setSelectedId(id);
    }, []);

    const renderResponseItem = useCallback(({ item }: { item: ResponseItem }) => (
        <View style={[styles.itemWrapper, { borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity
                style={styles.item}
                onPress={() => handleSelectItem(item.id)}
                disabled={isLoading}
            >
                <Text
                    style={[styles.itemText, { color: theme.colors.text }]}
                    numberOfLines={3}
                >
                    {item.itemText}
                </Text>
                {item.id === selectedId && (
                    <Icon
                        size={24}
                        name="check"
                        iconStyle="solid"
                        color={COLORS.GREEN}
                        style={styles.checkIcon}
                    />
                )}
            </TouchableOpacity>
        </View>
    ), [selectedId, handleSelectItem, isLoading, theme.colors.text]);

    if (!questionContent) {
        return (
            <Screen initialized style={styles.container}>
                <View style={[styles.headerContainer, { backgroundColor: theme.colors.primary }]}>
                    <View style={[styles.headerWrapper, { backgroundColor: theme.colors.surface }]}>
                        <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
                            <Text variant="h5" color={COLORS.BLUE}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Health Question</Text>
                        <View style={styles.headerButton}>
                            <Text variant="h5" color="transparent">Cancel</Text>
                        </View>
                    </View>
                </View>
                <View style={[styles.questionContainer, { backgroundColor: theme.colors.muted }]}>
                    <Text style={styles.questionText}>No question data available</Text>
                </View>
            </Screen>
        );
    }

    return (
        <Screen initialized style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={[styles.headerContainer, { backgroundColor: theme.colors.primary }]}>
                    <View style={[styles.headerWrapper, { backgroundColor: theme.colors.surface }]}>
                        <TouchableOpacity
                            onPress={handleCancel}
                            style={styles.headerButton}
                            disabled={isLoading || isFinalMessage}
                        >
                            <Text
                                variant="h5"
                                color={isFinalMessage ? 'transparent' : COLORS.BLUE}
                            >
                                Cancel
                            </Text>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Health Question</Text>
                        <TouchableOpacity
                            onPress={handleSubmit}
                            style={styles.headerButton}
                            disabled={isSubmitDisabled || isLoading}
                        >
                            <Text
                                variant="h5"
                                color={isSubmitDisabled ? theme.colors.textMuted : COLORS.BLUE}
                            >
                                {isFinalMessage ? 'Done' : 'Submit'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={[styles.questionContainer, { backgroundColor: theme.colors.muted }]}>
                    <Text style={[styles.questionText, { color: theme.colors.text }]}>
                        {questionContent.question}
                    </Text>
                </View>

                <View style={styles.contentContainer}>
                    {isUserEnteredResponse ? (
                        <View style={styles.textareaContainer}>
                            <TextInput
                                multiline
                                maxLength={256}
                                numberOfLines={5}
                                value={description}
                                editable={!isLoading}
                                onChangeText={setDescription}
                                placeholderTextColor="#999999"
                                style={[styles.textarea, { color: theme.colors.text, backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                                placeholder={responseItems[0]?.itemText || 'Enter your answer...'}
                            />
                        </View>
                    ) : !isFinalMessage ? (
                        <FlatList
                            data={responseItems}
                            extraData={selectedId}
                            renderItem={renderResponseItem}
                            keyExtractor={item => String(item.id)}
                        />
                    ) : null}
                </View>
            </KeyboardAvoidingView>
        </Screen>
    );
};

export default memo(QuestionScreen);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingLeft: 0,
        paddingRight: 0,
    },
    headerContainer: {
        paddingTop: Platform.OS === 'ios' ? 50 : 10,
    },
    headerWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopRightRadius: 30,
        borderTopLeftRadius: 30,
        paddingVertical: 15,
        paddingHorizontal: 20,
    },
    headerButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    questionContainer: {
        paddingVertical: OFFSET.VERTICAL * 2,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    questionText: {
        fontSize: 18,
        fontWeight: '500',
        lineHeight: 26,
    },
    contentContainer: {
        flex: 1,
    },
    textareaContainer: {
        padding: OFFSET.HORIZONTAL,
    },
    textarea: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        minHeight: 120,
        fontSize: 16,
        textAlignVertical: 'top',
    },
    itemWrapper: {
        borderBottomWidth: 1,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: OFFSET.VERTICAL + 5,
        paddingHorizontal: OFFSET.HORIZONTAL,
        minHeight: 60,
    },
    itemText: {
        flex: 1,
        fontSize: 16,
        paddingRight: 10,
    },
    checkIcon: {
        marginLeft: 10,
    },
});
