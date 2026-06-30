// outsource dependencies
import _ from 'lodash';
import React, { useState, useCallback, useRef } from 'react';
import {
    View,
    Alert,
    Platform,
    TextInput,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
} from 'react-native';
import Toast from 'react-native-toast-message';
import ImagePicker from 'react-native-image-crop-picker';
import { CodeScanner } from 'react-native-vision-camera-barcode-scanner';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import { useCameraDevice, useCameraPermission } from 'react-native-vision-camera';

// local dependencies
import { store } from 'store';
import Text from 'components/Text';
import Screen from 'components/Screen';
import { OFFSET } from 'constants/offset';
import { COLORS } from 'constants/colors';
import { ROUTES } from 'constants/routes';
import { Button } from 'components/Button';
import { useAppState } from 'hooks/useAppState';
import { MAX_FONT_SCALE } from 'constants/typography.ts';
import { uploadImageInitiate } from 'store/api/s3ServiceApi';
import ConfirmationAlert from 'components/ConfirmationAlert';
import {
    dayOverviewApi,
    useFilterBFPDFoodsMutation,
    useImportFoodDefaultMutation,
    useFilterFoodToCreateMutation,
    useCreateFoodToCreateMutation,
} from 'store/api/dayOverviewApi';

type DialogState = {
    title: string;
    message: string;
    okText?: string;
    visible: boolean;
    cancelText?: string;
    onClose: () => void;
    onSubmit: () => void;
    hideCancelBtn?: boolean;
};

const INITIAL_DIALOG: DialogState = {
    title: '',
    message: '',
    visible: false,
    onClose: () => {},
    onSubmit: () => {},
};

const recentlyScannedCodes = new Map<string, number>();

const UPCScan: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const isFocused = useIsFocused();
    const appState = useAppState();

    const entityType = route.params?.entityType || 'FOOD';
    const substanceType = route.params?.substanceType;
    const onApply = route.params?.onApply;
    const date = route.params?.date;

    const [isProcessing, setIsProcessing] = useState(false);
    const [scannedUpc, setScannedUpc] = useState('');
    const [manualUpc, setManualUpc] = useState('');
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [isCameraSuspended, setIsCameraSuspended] = useState(false);
    const [dialog, setDialog] = useState<DialogState>(INITIAL_DIALOG);
    const processingRef = useRef(false);

    const device = useCameraDevice('back');
    const { hasPermission, requestPermission } = useCameraPermission();
    const isActive = isFocused && appState === 'active' && !isProcessing && !isCameraSuspended;

    const [filterFoodToCreate] = useFilterFoodToCreateMutation();
    const [filterBFPDFoods] = useFilterBFPDFoodsMutation();
    const [importFoodDefault] = useImportFoodDefaultMutation();
    const [createFoodToCreate] = useCreateFoodToCreateMutation();

    const showDialog = useCallback((config: Omit<DialogState, 'visible'>): Promise<boolean> => {
        return new Promise(resolve => {
            setDialog({
                ...config,
                visible: true,
                onSubmit: () => {
                    setDialog(INITIAL_DIALOG);
                    resolve(true);
                },
                onClose: () => {
                    setDialog(INITIAL_DIALOG);
                    resolve(false);
                },
            });
        });
    }, []);

    const suspendCamera = useCallback(async () => {
        setIsCameraSuspended(true);
        await new Promise<void>(resolve => setTimeout(resolve, 1000));
    }, []);

    const resumeCamera = useCallback(() => {
        setIsCameraSuspended(false);
    }, []);

    const capturePhotos = useCallback(async (min: number, max: number): Promise<any[]> => {
        await suspendCamera();
        const photos: any[] = [];
        try {
            for (let i = 0; i < max; i++) {
                try {
                    const image = await ImagePicker.openCamera({
                        width: 1920,
                        height: 1080,
                        cropping: false,
                        mediaType: 'photo',
                        includeBase64: true,
                    });
                    if (!image) { break; }
                    photos.push(image);

                    if (photos.length >= min) {
                        const shouldContinue = await showDialog({
                            okText: 'Yes',
                            cancelText: 'No',
                            onClose: () => {},
                            onSubmit: () => {},
                            title: 'Product Setup Process',
                            message: 'Would you like to continue adding photos?',
                        });
                        if (!shouldContinue) { break; }
                    }
                } catch (pickerError: any) {
                    if (pickerError?.code === 'E_PICKER_CANCELLED') { break; }
                    Toast.show({
                        type: 'error',
                        text1: 'Camera error',
                        text2: pickerError?.message || 'Failed to open camera',
                    });
                    break;
                }
            }
        } finally {
            resumeCamera();
        }
        return photos;
    }, [showDialog, suspendCamera, resumeCamera]);

    const uploadPhoto = useCallback(async (photo: any) => {
        try {
            const body = new FormData();
            const uri = Platform.OS === 'android'
                ? photo.path
                : `data:image/jpeg;base64,${photo.data}`;
            const fileName = (photo.filename || '').replace(/[^\d|A-Z|a-z]/g, '_').replace(/_+/g, '_')
                || `image_${Math.floor(Math.random() * 10000)}`;

            body.append('file', { uri, name: fileName, type: 'image/jpeg' } as any);

            const result = await store.dispatch(
                uploadImageInitiate({
                    body,
                    params: {
                        x: 1,
                        y: 1,
                        width: photo.width || 1920,
                        height: photo.height || 1080,
                    },
                })
            );
            const imageData = (result as any)?.data;
            if (imageData?.url) {
                return { ...imageData, url: imageData.url.replace(/\.$/, '') };
            }
            return null;
        } catch {
            return null;
        }
    }, []);

    const handleFoodNotInExtendedDB = useCallback(async (upcValue: string) => {
        const wantPhotos = await showDialog({
            okText: 'Yes',
            cancelText: 'No',
            onClose: () => {},
            onSubmit: () => {},
            title: 'We couldn\'t find this product.',
            message: 'Would you like to provide more details by adding a few photos (between 2 and 10)?',
        });

        if (!wantPhotos) { return; }

        const photos = await capturePhotos(2, 10);

        if (photos.length >= 2) {
            const name = await new Promise<string>(resolve => {
                Alert.prompt(
                    'Enter name',
                    'Please enter name below',
                    [
                        { text: 'Cancel', onPress: () => resolve('new'), style: 'cancel' },
                        { text: 'Submit', onPress: (value?: string) => resolve(value || 'new') },
                    ],
                    'plain-text',
                    '',
                );
            });

            const uploadedPhotos = await Promise.all(photos.map(uploadPhoto));
            const validPhotos = uploadedPhotos.filter(Boolean);

            if (validPhotos.length >= 2) {
                await createFoodToCreate({
                    upc: upcValue,
                    images: validPhotos,
                    name: name.slice(0, 50),
                }).unwrap();

                Toast.show({
                    type: 'success',
                    text1: 'Photos uploaded',
                    text2: 'Thank you! Your photos were successfully uploaded.',
                });
            }
        } else if (photos.length > 0) {
            Toast.show({
                type: 'error',
                text1: 'Not enough photos',
                text2: 'Please provide at least 2 photos.',
            });
        }
    }, [showDialog, capturePhotos, uploadPhoto, createFoodToCreate]);

    const handleUpcLookup = useCallback(async (upcValue: string) => {
        if (processingRef.current) { return; }

        const now = Date.now();
        const lastScan = recentlyScannedCodes.get(upcValue);
        if (lastScan && (now - lastScan) < 5000) { return; }
        recentlyScannedCodes.set(upcValue, now);

        processingRef.current = true;
        setIsProcessing(true);
        setScannedUpc(upcValue);

        try {
            const foodsResult = await store.dispatch(
                dayOverviewApi.endpoints.getFoods.initiate({
                    page: 0,
                    size: 10,
                    filter: { upc: upcValue },
                })
            );
            const foodItem = _.first((foodsResult as any)?.data?.content);

            const foodToCreateResult = await filterFoodToCreate({ upc: upcValue }).unwrap();
            const processedItem = _.first(foodToCreateResult?.content);

            if (foodItem) {
                navigation.navigate(ROUTES.EDIT_FOOD, {
                    date,
                    onApply,
                    entityType,
                    substanceType,
                    item: foodItem,
                });
                return;
            }

            if (processedItem) {
                await showDialog({
                    okText: 'OK',
                    onClose: () => {},
                    onSubmit: () => {},
                    title: 'In process',
                    hideCancelBtn: true,
                    message: 'This code has already been scanned and is currently being reviewed by our team. It will be available in the app soon.',
                });
                return;
            }

            const wantExtended = await showDialog({
                okText: 'Yes',
                cancelText: 'No',
                onClose: () => {},
                onSubmit: () => {},
                title: 'Food not found',
                message: 'Would you like to search this item in extended database?',
            });

            if (!wantExtended) { return; }

            const bfpdResult = await filterBFPDFoods({ upc: upcValue }).unwrap();
            const bfpdItem = _.first(bfpdResult?.content) as any;

            if (bfpdItem) {
                const wantImport = await showDialog({
                    okText: 'OK',
                    onClose: () => {},
                    onSubmit: () => {},
                    cancelText: 'Cancel',
                    title: 'Import food',
                    message: 'Would you like to import this food into the system?',
                });

                if (wantImport) {
                    try {
                        await importFoodDefault({ originId: bfpdItem.originId }).unwrap();
                        Toast.show({
                            type: 'success',
                            text1: 'Import Success',
                            text2: 'Thank you! Your item was successfully imported.',
                        });
                    } catch {
                        await handleFoodNotInExtendedDB(upcValue);
                    }
                }
            } else {
                await handleFoodNotInExtendedDB(upcValue);
            }
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error?.message || 'Failed to look up UPC code',
            });
        } finally {
            processingRef.current = false;
            setIsProcessing(false);
        }
    }, [
        date,
        onApply,
        entityType,
        navigation,
        showDialog,
        substanceType,
        filterBFPDFoods,
        importFoodDefault,
        filterFoodToCreate,
        handleFoodNotInExtendedDB,
    ]);

    const handleManualSearch = useCallback(() => {
        if (manualUpc.trim()) {
            handleUpcLookup(manualUpc.trim());
        }
    }, [manualUpc, handleUpcLookup]);

    React.useEffect(() => {
        if (!hasPermission) {
            requestPermission();
        }
    }, [hasPermission, requestPermission]);

    if (!hasPermission) {
        return (
            <Screen initialized style={styles.container}>
                <View style={styles.permissionContainer}>
                    <Text variant="h3" style={styles.permissionTitle}>
                        Camera Permission Required
                    </Text>
                    <Text style={styles.permissionText}>
                        Please allow camera access to scan UPC barcodes.
                    </Text>
                    <Button
                        variant="primary"
                        title="Grant Permission"
                        onPress={requestPermission}
                        style={styles.permissionButton}
                    />
                </View>
            </Screen>
        );
    }

    if (showManualEntry) {
        return (
            <Screen initialized style={styles.container}>
                <KeyboardAvoidingView
                    style={styles.manualEntryContainer}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={styles.manualContent}>
                        <View style={styles.questionCircle}>
                            <Text style={styles.questionMark}>?</Text>
                        </View>
                        <Text variant="h3" style={styles.manualTitle}>
                            UPC Code Not Recognized
                        </Text>
                        <Text style={styles.manualSubtitle}>
                            Try to enter the UPC code manually in the input below
                        </Text>
                        <TextInput
                            autoFocus
                            value={manualUpc}
                            keyboardType="numeric"
                            style={styles.manualInput}
                            onChangeText={setManualUpc}
                            placeholder="Enter UPC code"
                            placeholderTextColor={COLORS.GREY}
                            maxFontSizeMultiplier={MAX_FONT_SCALE}
                        />
                        <View style={styles.manualButtons}>
                            <Button
                                title="CANCEL"
                                variant="secondary"
                                style={styles.manualBtn}
                                onPress={() => setShowManualEntry(false)}
                            />
                            <Button
                                title="SEARCH"
                                variant="primary"
                                style={styles.manualBtn}
                                onPress={handleManualSearch}
                                disabled={!manualUpc.trim() || isProcessing}
                            />
                        </View>
                    </View>
                </KeyboardAvoidingView>
                {isProcessing && (
                    <View style={styles.overlay}>
                        <ActivityIndicator size="large" color={COLORS.BLUE} />
                    </View>
                )}
                <ConfirmationAlert
                    title={dialog.title}
                    isOpen={dialog.visible}
                    message={dialog.message}
                    applyTxt={dialog.okText}
                    onClose={dialog.onClose}
                    onSubmit={dialog.onSubmit}
                    cancelTxt={dialog.cancelText}
                    hideCancelBtn={dialog.hideCancelBtn}
                />
            </Screen>
        );
    }

    return (
        <Screen initialized style={styles.container}>
            <View style={styles.cameraContainer}>
                {device && !isCameraSuspended ? (
                    <CodeScanner
                        isActive={isActive}
                        style={StyleSheet.absoluteFill}
                        barcodeFormats={['ean-13', 'ean-8', 'upc-a', 'upc-e', 'code-128', 'code-39']}
                        onBarcodeScanned={barcodes => {
                            if (isProcessing || processingRef.current) { return; }
                            const code = barcodes[0];
                            if (!code?.rawValue || code.format === 'qr-code') { return; }
                            handleUpcLookup(code.rawValue);
                        }}
                        onError={error => {
                            Toast.show({
                                type: 'error',
                                text2: error.message,
                                text1: 'Scanner error',
                            });
                        }}
                    />
                ) : (
                    <View style={styles.noCameraContainer}>
                        <Text style={styles.noCameraText}>
                            {isCameraSuspended ? 'Camera paused for photo capture...' : 'No camera available'}
                        </Text>
                    </View>
                )}

                <View style={styles.scanOverlay}>
                    <Text style={styles.scanTitle}>
                        {isProcessing
                            ? 'In Process...'
                            : scannedUpc
                                ? `Scanned: ${scannedUpc}`
                                : 'Center UPC Code in the frame'}
                    </Text>

                    {isProcessing ? (
                        <ActivityIndicator size="large" color={COLORS.WHITE} style={styles.spinner} />
                    ) : (
                        <View style={styles.scanFrame} />
                    )}
                </View>
            </View>

            {/* <View style={styles.bottomActions}>
                <Button
                    title="Enter Code Manually"
                    variant="secondary"
                    onPress={() => setShowManualEntry(true)}
                    style={styles.manualEntryButton}
                />
            </View> */}

            <ConfirmationAlert
                title={dialog.title}
                isOpen={dialog.visible}
                message={dialog.message}
                applyTxt={dialog.okText}
                onClose={dialog.onClose}
                onSubmit={dialog.onSubmit}
                cancelTxt={dialog.cancelText}
                hideCancelBtn={dialog.hideCancelBtn}
            />
        </Screen>
    );
};

export default UPCScan;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingLeft: 0,
        paddingRight: 0,
    },
    cameraContainer: {
        flex: 1,
    },
    scanOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanTitle: {
        top: '10%',
        fontSize: 18,
        fontWeight: '500',
        color: COLORS.WHITE,
        textAlign: 'center',
        textShadowRadius: 3,
        position: 'absolute',
        paddingHorizontal: 20,
        textShadowColor: 'rgba(0, 0, 0, 0.7)',
        textShadowOffset: { width: 1, height: 1 },
    },
    scanFrame: {
        width: 250,
        height: 250,
        borderWidth: 4,
        borderColor: COLORS.WHITE,
    },
    spinner: {
        marginTop: 20,
    },
    bottomActions: {
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.VERTICAL,
        backgroundColor: COLORS.BLACK,
    },
    manualEntryButton: {
        borderColor: COLORS.WHITE,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#DADADA99',
    },
    permissionContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: OFFSET.HORIZONTAL * 2,
    },
    permissionTitle: {
        textAlign: 'center',
        marginBottom: OFFSET.VERTICAL,
    },
    permissionText: {
        fontSize: 16,
        textAlign: 'center',
        color: COLORS.DARK_GREY,
        marginBottom: OFFSET.VERTICAL * 2,
    },
    permissionButton: {
        minWidth: 200,
    },
    noCameraContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.BLACK,
    },
    noCameraText: {
        fontSize: 18,
        color: COLORS.WHITE,
    },
    manualEntryContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    manualContent: {
        alignItems: 'center',
        paddingHorizontal: OFFSET.HORIZONTAL * 2,
    },
    questionCircle: {
        width: 145,
        height: 145,
        borderRadius: 72.5,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: OFFSET.VERTICAL,
        backgroundColor: COLORS.LIGHT_GREY,
    },
    questionMark: {
        fontSize: 80,
        fontWeight: '300',
        color: COLORS.DARK_GREY,
    },
    manualTitle: {
        maxWidth: 200,
        textAlign: 'center',
        marginBottom: OFFSET.VERTICAL,
    },
    manualSubtitle: {
        fontSize: 15,
        maxWidth: 200,
        textAlign: 'center',
        color: COLORS.DARK_GREY,
        marginBottom: OFFSET.VERTICAL,
    },
    manualInput: {
        fontSize: 18,
        width: '100%',
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 12,
        textAlign: 'center',
        color: COLORS.BLACK,
        paddingHorizontal: 16,
        borderColor: COLORS.GREY,
        backgroundColor: COLORS.WHITE,
        marginBottom: OFFSET.VERTICAL,
    },
    manualButtons: {
        gap: 16,
        width: '100%',
        flexDirection: 'row',
    },
    manualBtn: {
        flex: 1,
    },
});
