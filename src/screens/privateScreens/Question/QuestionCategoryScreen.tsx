// outsource dependencies
import React, { memo, useCallback, useMemo } from 'react';
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
import { Skeleton } from 'components/Skeleton';
import type { QuestionCategory } from 'types/question';
import { useGetDiseaseQuestionsQuery } from 'store/api/questionApi';

// Types for navigation
type QuestionCategoryRouteParams = {
    QuestionCategory: {
        date: string;
    };
};

const CategorySkeleton: React.FC = () => (
    <View style={styles.skeletonContainer}>
        {Array.from({ length: 5 }).map((_, index) => (
            <View key={index} style={styles.skeletonItem}>
                <Skeleton width="70%" height={20} borderRadius={4} />
                <Skeleton width={24} height={24} borderRadius={4} />
            </View>
        ))}
    </View>
);

const QuestionCategoryScreen: React.FC = () => {
    const theme = useTheme();
    const navigation = useNavigation<any>();
    const route = useRoute<RouteProp<QuestionCategoryRouteParams, 'QuestionCategory'>>();

    const { date } = route.params || {};

    const { data: questions = [], isLoading, isFetching } = useGetDiseaseQuestionsQuery(date, {
        skip: !date,
    });

    // Filter categories that have questions
    const categoriesWithQuestions = useMemo(() => {
        return questions.filter(category =>
            category.questions && category.questions.length > 0
        );
    }, [questions]);

    const handleCategoryPress = useCallback((category: QuestionCategory) => {
        navigation.navigate(ROUTES.QUESTION_LIST, {
            date,
            categoryId: category.libraryCategory.id,
            questions: category.questions,
            categoryName: category.libraryCategory.name,
        });
    }, [navigation, date]);

    const renderItem = useCallback(({ item }: { item: QuestionCategory }) => {
        const questionsCount = item.questions?.length || 0;

        return (
            <TouchableOpacity
                style={styles.item}
                onPress={() => handleCategoryPress(item)}
            >
                <Text
                    variant="h4"
                    numberOfLines={1}
                    style={[styles.itemTitle, { color: theme.colors.text }]}
                >
                    {item.libraryCategory.name}
                    {questionsCount > 0 && ` (${questionsCount})`}
                </Text>
                <Icon
                    size={20}
                    iconStyle="solid"
                    color={COLORS.GREY}
                    name="chevron-right"
                />
            </TouchableOpacity>
        );
    }, [handleCategoryPress, theme.colors.text]);

    if (isLoading) {
        return (
            <Screen initialized style={styles.container}>
                <CategorySkeleton />
            </Screen>
        );
    }

    return (
        <Screen initialized={!isFetching} style={styles.container}>
            {categoriesWithQuestions.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text
                        variant="h3"
                        style={[styles.emptyText, { color: theme.colors.text }]}
                    >
                        No questions found ...
                    </Text>
                </View>
            ) : (
                <FlatList
                    renderItem={renderItem}
                    data={categoriesWithQuestions}
                    contentContainerStyle={styles.listContainer}
                    keyExtractor={item => String(item.libraryCategory.id)}
                />
            )}
        </Screen>
    );
};

export default memo(QuestionCategoryScreen);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingLeft: 0,
        paddingRight: 0,
    },
    listContainer: {
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    item: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
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
    // Skeleton styles
    skeletonContainer: {
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingTop: OFFSET.VERTICAL,
    },
    skeletonItem: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
});
