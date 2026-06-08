// outsource dependencies
import React, { useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { FlatList, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

// local dependencies
import Text from 'components/Text.tsx';
import Screen from 'components/Screen.tsx';
import { OFFSET } from 'constants/offset.ts';
import { ROUTES } from 'constants/routes.ts';
import { useTheme } from 'hooks/useTheme.ts';
import StackHeader from 'components/StackHeader';
import { useGetPlanInfoQuery } from 'store/api/planApi.ts';
import { PlayBtn, QuestionBtn } from 'components/LibraryButtons.tsx';
import { useGetCurrentLibraryElementsQuery } from 'store/api/questionApi.ts';
import { DESTINATIONS, VIDEO_LIBRARY_TYPE, QUESTION_TYPE } from 'constants/spec.ts';

export const AboutPlanScreen = () => {
    const theme = useTheme();
    const navigation = useNavigation<any>();
    const styles = React.useMemo(() => createStyles(theme), [theme]);
    const { data, isLoading } = useGetPlanInfoQuery();
    const { data: elements } = useGetCurrentLibraryElementsQuery([DESTINATIONS.ABOUT_PLAN]);

    // Video and Question data
    const patientVideos = useMemo(() => elements?.[0]?.patientVideos || [], [elements]);
    const video = useMemo(() => patientVideos?.[0]?.libraryItem, [patientVideos]);
    const question = useMemo(() => elements?.[0]?.patientQuestions?.[0], [elements]);

    const hasVideoOrQuestion = video || question;

    return <Screen initialized={!isLoading} style={styles.flex}>
        <StackHeader
            title="About Plan"
            onBack={() => navigation.goBack()}
            onOpenDrawer={() => navigation.openDrawer?.()}
        />
        <ScrollView contentContainerStyle={styles.container}>
            <Text color={theme.colors.primary} variant="h3">{data?.name ?? 'You don\'t have a plan'}</Text>

            {/* Video and Question buttons */}
            {hasVideoOrQuestion && (
                <View style={styles.btnContainer}>
                    {video && (
                        <PlayBtn
                            style={styles.btnOffset}
                            change={!patientVideos?.[0]?.alreadySeen}
                            disabled={patientVideos?.[0]?.alreadySeen}
                            navigationAttr={{
                                video,
                                id: patientVideos?.[0]?.id,
                                backLink: ROUTES.ABOUT_PLAN,
                                library: VIDEO_LIBRARY_TYPE.GENERAL_VIDEO,
                            }}
                        />
                    )}
                    {question && (
                        <QuestionBtn
                            style={styles.btnOffset}
                            change={!question?.alreadyAnswered}
                            disabled={question?.alreadyAnswered}
                            navigationAttr={{
                                backLink: ROUTES.ABOUT_PLAN,
                                question: { ...question, questionType: QUESTION_TYPE.GENERAL_QUESTION },
                            }}
                        />
                    )}
                </View>
            )}

            <View style={styles.marginVertical}>
                <Text color={theme.colors.primary} variant="h3">Goals:</Text>
                <Text style={styles.marginBottom} color={theme.colors.black}>{data?.goal ?? '-'}</Text>
                <Text color={theme.colors.primary} variant="h3">Summary:</Text>
                <Text color={theme.colors.black}>{data?.descriptionForPatient ?? '-'}</Text>
            </View>
            <FlatList
                scrollEnabled={false}
                data={data?.descriptionReferences}
                keyExtractor={item => item?.id.toString()}
                ListHeaderComponent={() => <Text color={theme.colors.primary} variant="h3">Plan References:</Text>}
                renderItem={({ item }) => <View style={styles.containerItem}>
                    <Pressable onPress={() => Linking.openURL(item.url)}>
                        <Text style={styles.underline} color={theme.colors.primary} variant="h5">{item.name}</Text>
                    </Pressable>
                    <Text>{item.description}</Text>
                </View>}
            />
        </ScrollView>
    </Screen>;
};

export default AboutPlanScreen;
const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: theme.colors.background
    },
    container: {
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.VERTICAL,
    },
    containerItem: {
        marginBottom: OFFSET.POINT
    },
    marginVertical: {
        marginVertical: OFFSET.POINT * 2,
    },
    marginBottom: {
        marginBottom: OFFSET.VERTICAL,
    },
    underline: {
        textDecorationLine: 'underline'
    },
    btnContainer: {
        flexDirection: 'row',
        paddingVertical: OFFSET.VERTICAL,
    },
    btnOffset: {
        marginRight: 10,
    },
});
