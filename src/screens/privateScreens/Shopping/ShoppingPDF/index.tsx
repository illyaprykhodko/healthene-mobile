// outsource dependencies
import moment from 'moment';
import RNBlobUtil from 'react-native-blob-util';
import Icon from '@react-native-vector-icons/fontawesome5';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { memo, useCallback, useState, useEffect } from 'react';
import { StyleSheet, View, Platform, Alert, ActivityIndicator } from 'react-native';
// local dependencies
import { config } from 'constants';
import Text from 'components/Text';
import Screen from 'components/Screen';
import { COLORS } from 'constants/colors';
import { OFFSET } from 'constants/offset';
import { Button } from 'components/Button';
import { sessionManager } from 'store/api/baseApi';

const ShoppingPDF: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    const [isDownloading, setIsDownloading] = useState(false);
    const [token, setToken] = useState<string | null>(null);

    const { startDate, endDate } = route.params?.date || {};

    // Get token from session storage
    useEffect(() => {
        const getToken = async () => {
            const session = await sessionManager.get();
            setToken(session?.accessToken || null);
        };
        getToken();
    }, []);

    const handleDownload = useCallback(async () => {
        if (!startDate || !endDate) {
            Alert.alert('Error', 'Invalid date range');
            return;
        }

        setIsDownloading(true);

        try {
            const url = `${config.serviceUrl}/${config.apiPath}/patient-service/patients/shopping-list/print?startDate=${startDate}&endDate=${endDate}`;
            const fileName = `shopping-list-${moment().format('YYYY-MM-DD-HH-mm-ss')}.pdf`;

            const { dirs } = RNBlobUtil.fs;
            const downloadDir = Platform.OS === 'ios' ? dirs.DocumentDir : dirs.DCIMDir;
            const filePath = `${downloadDir}/${fileName}`;

            const options = {
                fileCache: true,
                path: filePath,
                addAndroidDownloads: {
                    description: 'Downloading shopping list...',
                    useDownloadManager: true,
                    title: 'Downloading file',
                    mime: 'application/pdf',
                    mediaScannable: true,
                    notification: true,
                    path: filePath,
                },
            };

            const response = await RNBlobUtil.config(options).fetch('GET', url, {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/pdf',
                'user-platform': Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
            });

            const info = response.info();
            const contentType = info.headers?.['Content-Type'] || info.headers?.['content-type'] || '';

            if (info.status !== 200 || !contentType.includes('pdf')) {
                try {
                    const errorContent = await RNBlobUtil.fs.readFile(response.path(), 'utf8');
                    console.error('API Error Content:', errorContent);
                    Alert.alert(
                        'Error',
                        `Server returned: ${errorContent.substring(0, 200)}`
                    );
                } catch {
                    Alert.alert('Error', `Server returned status ${info.status}`);
                }
                await RNBlobUtil.fs.unlink(response.path());
                return;
            }

            if (Platform.OS === 'ios') {
                RNBlobUtil.ios.openDocument(response.path());
            } else {
                RNBlobUtil.android.actionViewIntent(response.path(), 'application/pdf');
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
                <Icon name="file-pdf" color={COLORS.DARK_GREY} size={150} style={styles.icon} />

                <View style={styles.metaInfoBlock}>
                    <Text style={styles.metaInfoTitle}>
                        File type: <Text style={styles.metaInfoDescription}>pdf</Text>
                    </Text>
                    <Text style={styles.metaInfoTitle}>
                        Author: <Text style={styles.metaInfoDescription}>Healthene</Text>
                    </Text>
                    <Text style={styles.metaInfoTitle}>
                        Date: <Text style={styles.metaInfoDescription}>{moment().format('llll')}</Text>
                    </Text>
                </View>

                {isDownloading ? (
                    <View style={styles.loading}>
                        <ActivityIndicator size="large" color={COLORS.THEME_COLOR} />
                        <Text style={styles.loadingText}>Opening PDF...</Text>
                    </View>
                ) : (
                    <Button
                        title="DOWNLOAD"
                        variant="primary"
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
        alignItems: 'center',
        paddingHorizontal: OFFSET.HORIZONTAL * 2,
    },
    icon: {
        marginTop: 'auto' as any,
        marginBottom: 30,
    },
    metaInfoBlock: {
        marginHorizontal: 5,
        marginBottom: OFFSET.VERTICAL * 3,
        alignItems: 'center',
    },
    metaInfoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    metaInfoDescription: {
        fontSize: 18,
        fontWeight: 'normal',
    },
    loading: {
        alignItems: 'center',
        marginBottom: OFFSET.VERTICAL * 2,
    },
    loadingText: {
        marginTop: 16,
        color: COLORS.GREY,
    },
    downloadBtn: {
        width: '80%',
        marginBottom: 'auto' as any,
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
        borderRadius: 30,
        backgroundColor: '#EBB3D1',
    },
    backBtnText: {
        color: COLORS.BLACK,
        fontSize: 24,
        fontWeight: 'bold',
    },
});
