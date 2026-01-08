// outsource dependencies
import RNBlobUtil from 'react-native-blob-util';
import React, { memo, useCallback, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StyleSheet, View, Platform, Share, Alert, ActivityIndicator } from 'react-native';
// local dependencies
import { config } from 'constants';
import Text from 'components/Text';
import Screen from 'components/Screen';
import { useAppSelector } from 'store';
import { COLORS } from 'constants/colors';
import { OFFSET } from 'constants/offset';
import { Button } from 'components/Button';

const ShoppingPDF: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    const [isDownloading, setIsDownloading] = useState(false);
    const token = useAppSelector(state => state.app?.accessToken);

    const { startDate, endDate } = route.params?.date || {};

    const handleDownload = useCallback(async () => {
        if (!startDate || !endDate) {
            Alert.alert('Error', 'Invalid date range');
            return;
        }

        setIsDownloading(true);

        try {
            const url = `${config.serviceUrl}/${config.apiPath}/patient-service/patients/shopping-list/pdf?startDate=${startDate}&endDate=${endDate}`;
            const fileName = `shopping-list-${startDate}-${endDate}.pdf`;

            const { dirs } = RNBlobUtil.fs;
            const downloadDir = Platform.OS === 'ios' ? dirs.DocumentDir : dirs.DownloadDir;
            const filePath = `${downloadDir}/${fileName}`;

            const response = await RNBlobUtil.config({
                fileCache: true,
                path: filePath,
                addAndroidDownloads: {
                    title: fileName,
                    notification: true,
                    mediaScannable: true,
                    mime: 'application/pdf',
                    useDownloadManager: true,
                    description: 'Downloading shopping list...',
                },
            }).fetch('GET', url, {
                Authorization: `Bearer ${token}`,
            });

            if (Platform.OS === 'ios') {
                // Share the file on iOS
                await Share.share({
                    url: `file://${response.path()}`,
                });
            } else {
                Alert.alert('Success', 'Shopping list downloaded successfully');
            }
        } catch (error) {
            console.error('Download error:', error);
            Alert.alert('Error', 'Failed to download shopping list');
        } finally {
            setIsDownloading(false);
        }
    }, [startDate, endDate, token]);

    return (
        <Screen initialized style={styles.container}>
            <View style={styles.content}>
                <Text variant="h2" textAlign="center" style={styles.title}>
                    Download Shopping List
                </Text>
                <Text textAlign="center" color={COLORS.GREY} style={styles.subtitle}>
                    {startDate && endDate
                        ? `For the period: ${startDate} to ${endDate}`
                        : 'Download your shopping list as PDF'
                    }
                </Text>

                {isDownloading ? (
                    <View style={styles.loading}>
                        <ActivityIndicator size="large" color={COLORS.THEME_COLOR} />
                        <Text style={styles.loadingText}>Downloading...</Text>
                    </View>
                ) : (
                    <Button
                        variant="primary"
                        title="Download PDF"
                        onPress={handleDownload}
                        style={styles.downloadBtn}
                        textStyle={styles.downloadBtnText}
                    />
                )}
            </View>

            <View style={styles.buttonControl}>
                <Button
                    title="Back"
                    variant="secondary"
                    style={styles.backBtn}
                    disabled={isDownloading}
                    textStyle={styles.backBtnText}
                    onPress={() => navigation.goBack()}
                />
            </View>
        </Screen>
    );
};

export default memo(ShoppingPDF);

const styles = StyleSheet.create({
    container: {
        paddingLeft: 0,
        paddingRight: 0,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: OFFSET.HORIZONTAL * 2,
    },
    title: {
        marginBottom: 16,
    },
    subtitle: {
        marginBottom: 32,
    },
    loading: {
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        color: COLORS.GREY,
    },
    downloadBtn: {
        width: '80%',
        backgroundColor: COLORS.THEME_COLOR,
    },
    downloadBtnText: {
        color: COLORS.WHITE,
        fontSize: 18,
        fontWeight: 'bold',
    },
    buttonControl: {
        flexDirection: 'row',
        paddingVertical: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.HORIZONTAL,
        borderTopWidth: 1,
        borderTopColor: COLORS.LIGHT_GREY,
    },
    backBtn: {
        flex: 1,
        backgroundColor: '#EBB3D1',
    },
    backBtnText: {
        color: COLORS.BLACK,
        fontSize: 24,
        fontWeight: 'bold',
    },
});
