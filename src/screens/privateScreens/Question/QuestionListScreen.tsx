// outsource dependencies
import React, { memo, useCallback } from 'react';
import Icon from '@react-native-vector-icons/fontawesome5';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import { ROUTES } from 'constants/routes';
import { COLORS } from 'constants/colors';
import { QUESTION_TYPE } from 'constants/spec';
import type { DiseaseQuestion } from 'types/question';

// Types for navigation
type QuestionListRouteParams = {
    QuestionList: {
        date: string;
        categoryId: number;
        categoryName: string;
        questions: DiseaseQuestion[];
    };
};

const QuestionListScreen: React.FC = () => {
    const theme = useTheme();
    const navigation = useNavigation<any>();
    const route = useRoute<RouteProp<QuestionListRouteParams, 'QuestionList'>>();

    const { questions = [], categoryName } = route.params || {};

    const handleQuestionPress = useCallback((question: DiseaseQuestion) => {
        navigation.navigate(ROUTES.QUESTION, {
            params: {
                backLink: ROUTES.QUESTION_CATEGORY,
                question: {
                    ...question,
                    questionType: QUESTION_TYPE.DISEASE_QUESTION,
                },
            },
        });
    }, [navigation]);

    const renderItem = useCallback(({ item }: { item: DiseaseQuestion }) => {
        const title = item.parent?.question?.title || item.question?.question || 'Question';

        return (
            <TouchableOpacity
                onPress={() => handleQuestionPress(item)}
                style={[
                    styles.item,
                    { borderBottomColor: theme.colors.border }
                ]}
            >
                <Text
                    variant="h4"
                    numberOfLines={1}
                    style={[
                        styles.itemTitle,
                        { color: theme.colors.text }
                    ]}
                >
                    {title}
                </Text>
                <Icon
                    size={20}
                    iconStyle="solid"
                    color={COLORS.GREY}
                    name="chevron-right"
                />
            </TouchableOpacity>
        );
    }, [handleQuestionPress, theme.colors.text]);

    return (
        <Screen initialized style={styles.container}>
            {questions.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text
                        variant="h3"
                        style={[
                            styles.emptyText,
                            { color: theme.colors.text }
                        ]}
                    >
                        No questions in this category
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={questions}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    keyExtractor={(item, index) => String(item.id || index)}
                />
            )}
        </Screen>
    );
};

export default memo(QuestionListScreen);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 20,
        paddingLeft: 0,
        paddingRight: 0,
    },
    listContainer: {
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
    },
    itemTitle: {
        flex: 1,
        marginRight: OFFSET.HORIZONTAL,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: OFFSET.HORIZONTAL,
    },
    emptyText: {
        fontSize: 18,
        textAlign: 'center',
    },
});
