// outsource dependencies
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import DeviceInfo from 'react-native-device-info';

// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { config } from 'constants/index';
import { OFFSET } from 'constants/offset';
import { ROUTES } from 'constants/routes';
import { useTheme } from 'hooks/useTheme';
import { PlayBtn, QuestionBtn } from 'components/LibraryButtons';
import { useGetCurrentLibraryElementsQuery } from 'store/api/questionApi';
import { DESTINATIONS, VIDEO_LIBRARY_TYPE, QUESTION_TYPE } from 'constants/spec';

export const InfoScreen: React.FC = () => {
    const theme = useTheme();
    const { data: elements, isLoading } = useGetCurrentLibraryElementsQuery([DESTINATIONS.SOFTWARE_VERSION]);

    const patientVideos = useMemo(() => elements?.[0]?.patientVideos || [], [elements]);
    const video = useMemo(() => patientVideos?.[0]?.libraryItem, [patientVideos]);
    const question = useMemo(() => elements?.[0]?.patientQuestions?.[0], [elements]);

    const hasVideoOrQuestion = video || question;

    return (
        <Screen initialized={!isLoading} style={styles.container}>
            <Text variant="h4" textAlign="center" color={theme.colors.primary} style={styles.heading}>
                Information about {DeviceInfo.getApplicationName()} application
            </Text>
            {hasVideoOrQuestion && (
                <View style={styles.btnContainer}>
                    {video && (
                        <PlayBtn
                            style={styles.btnOffset}
                            change={!patientVideos?.[0]?.alreadySeen}
                            disabled={patientVideos?.[0]?.alreadySeen}
                            navigationAttr={{
                                video,
                                backLink: ROUTES.INFO,
                                id: patientVideos?.[0]?.id,
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
                                backLink: ROUTES.INFO,
                                question: { ...question, questionType: QUESTION_TYPE.GENERAL_QUESTION },
                            }}
                        />
                    )}
                </View>
            )}

            <View style={[styles.cardItem, { borderBottomColor: theme.colors.grey, backgroundColor: '#F2F2F7' }]}>
                <Text color={theme.colors.grey}>Version:</Text>
                <Text color={theme.colors.text}>{DeviceInfo.getVersion()}</Text>
            </View>

            <View style={[styles.cardItem, { borderBottomColor: theme.colors.grey, backgroundColor: '#F2F2F7' }]}>
                <Text color={theme.colors.grey}>Build Number:</Text>
                <Text color={theme.colors.text}>{DeviceInfo.getBuildNumber()}</Text>
            </View>

            <View style={[styles.cardItem, { borderBottomColor: theme.colors.grey, backgroundColor: '#F2F2F7' }]}>
                <Text color={theme.colors.grey}>Environment:</Text>
                <Text color={theme.colors.text}>{config.environment}</Text>
            </View>
        </Screen>
    );
};

export default InfoScreen;

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.VERTICAL,
    },
    heading: {
        marginTop: OFFSET.VERTICAL,
        marginBottom: OFFSET.VERTICAL,
    },
    btnContainer: {
        flexDirection: 'row',
        paddingVertical: OFFSET.VERTICAL,
    },
    btnOffset: {
        marginRight: 10,
    },
    cardItem: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
        borderBottomWidth: 1,
    },
});
