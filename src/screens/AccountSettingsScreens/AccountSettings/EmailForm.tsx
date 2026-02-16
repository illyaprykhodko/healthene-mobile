// outsource dependencies
import * as yup from 'yup';
import {
    BottomSheetView,
    BottomSheetModal,
    BottomSheetBackdrop,
    BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Formik } from 'formik';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { StyleSheet, View } from 'react-native';
import React, { useRef, useCallback, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// local dependencies
import { User } from 'types';
import { RootState } from 'store';
import Text from 'components/Text.tsx';
import { filters } from 'services/filter';
import { useAuth } from 'hooks/useAuth.ts';
import { config } from '../../../constants';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import { Button } from 'components/Button.tsx';
import TextInput from 'components/TextInput.tsx';
import { useChangeEmailRequestMutation } from 'store/api/settingsApi.ts';

const validationSchema = yup.object().shape({
    email: yup.string().required('Email address is required').email('Invalid email address'),
});

interface EmailFormProps {
    onPreloader: React.Dispatch<React.SetStateAction<boolean>>;
}

const EmailForm = ({ onPreloader }: EmailFormProps) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const user = useSelector((state: RootState) => state.app.user);
    const { signOut } = useAuth();
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const pendingEmailData = useRef<Partial<User> | null>(null);
    const [sheetMode, setSheetMode] = useState<'confirm' | 'info'>('confirm');
    const [isRequesting, setIsRequesting] = useState(false);
    const [changeEmailRequest] = useChangeEmailRequestMutation();

    const renderBackdrop = useCallback(
        (props: BottomSheetBackdropProps) => (
            <BottomSheetBackdrop
                {...props}
                opacity={0.5}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                pressBehavior="none"
            />
        ),
        []
    );

    const handleConfirmYes = useCallback(async () => {
        const email = pendingEmailData.current?.email;
        if (!email) {
            return;
        }

        try {
            setIsRequesting(true);
            onPreloader(true);

            const verificationUrl = `${config.websiteUrl}/public/email-change/`;
            await changeEmailRequest({
                newEmail: email,
                verificationUrl,
            }).unwrap();

            // If request succeeds, switch to informational mode
            setSheetMode('info');
        } catch (error: any) {
            // If request fails, show error toast and stay in confirm mode
            Toast.show({
                type: 'error',
                text1: 'Email change failed',
                text2: String(filters.humanize(error?.data?.errorCode)) || 'Something went wrong while requesting email change. Please try again later.',
            });
        } finally {
            setIsRequesting(false);
            onPreloader(false);
        }
    }, [changeEmailRequest, onPreloader]);

    const handleConfirmNo = useCallback(() => {
        bottomSheetRef.current?.close();
        pendingEmailData.current = null;
    }, []);

    const handleInfoOk = useCallback(async () => {
        bottomSheetRef.current?.close();
        try {
            await signOut();
        } catch (error) {
            console.error('Logout error:', error);
        }
    }, [signOut]);

    const handleSheetDismiss = useCallback(() => {
        if (sheetMode === 'info') {
            // In info mode, closing the sheet logs the user out
            (async () => {
                try {
                    await signOut();
                } catch (error) {
                    console.error('Logout error:', error);
                }
            })();
        } else {
            // In confirm mode, dismiss behaves like "No"
            pendingEmailData.current = null;
        }
    }, [sheetMode, signOut]);

    const onSubmit = async (data: Partial<User>) => {
        if (!data.email) {
            return;
        }

        // Do NOT send request here; just store data and open confirmation sheet
        pendingEmailData.current = data;
        setSheetMode('confirm');
        bottomSheetRef.current?.present();
    };

    return <>
        <Formik
            onSubmit={onSubmit}
            validationSchema={validationSchema}
            initialValues={{ email: user?.email }}
        >
            {({
                dirty,
                values,
                errors,
                touched,
                handleChange,
                handleSubmit,
            }) => <View style={styles.container}>
                <TextInput
                    name="email"
                    disabled={false}
                    textAlign="left"
                    touched={touched}
                    value={values.email}
                    label="Email Address"
                    color={theme.colors.black}
                    onChangeText={handleChange('email')}
                    error={touched.email && errors.email ? { email: errors.email } : undefined}
                />
                <Button
                    disabled={!dirty}
                    variant="outline"
                    title="CHANGE EMAIL"
                    onPress={handleSubmit}
                />
            </View>}
        </Formik>
        <BottomSheetModal
            ref={bottomSheetRef}
            snapPoints={['40%']}
            enablePanDownToClose
            onDismiss={handleSheetDismiss}
            backdropComponent={renderBackdrop}
            backgroundStyle={[
                styles.bottomSheetBackground,
                { backgroundColor: theme.colors.surface },
            ]}
            handleIndicatorStyle={{
                backgroundColor: theme.colors.grey,
            }}
        >
            <BottomSheetView style={[styles.confirmationContainer, { paddingBottom: Platform.OS === 'android' ? insets.bottom + OFFSET.VERTICAL : 0 }]}>
                {sheetMode === 'confirm' ? (
                    <>
                        <Text variant="h3" style={styles.confirmationTitle}>
                            Confirm Email Change
                        </Text>
                        <Text style={styles.confirmationMessage}>
                            Are you sure you want to change your email address?
                        </Text>
                        <View style={styles.confirmationButtons}>
                            <Button
                                disabled={isRequesting}
                                title="No"
                                variant="outline"
                                onPress={handleConfirmNo}
                                style={styles.confirmationButton}
                            />
                            <Button
                                loading={isRequesting}
                                title="Yes"
                                variant="primary"
                                onPress={handleConfirmYes}
                                style={styles.confirmationButton}
                            />
                        </View>
                    </>
                ) : (
                    <>
                        <Text variant="h3" style={styles.confirmationTitle}>
                            Confirm your new email
                        </Text>
                        <Text style={styles.confirmationMessage}>
                            We’ve sent a confirmation link to your new email address. Please check your inbox and confirm the change to continue using the app.
                        </Text>
                        <View style={styles.infoButtonWrapper}>
                            <Button
                                title="OK"
                                variant="primary"
                                onPress={handleInfoOk}
                                style={styles.infoButton}
                            />
                        </View>
                    </>
                )}
            </BottomSheetView>
        </BottomSheetModal>
    </>;
};

export default EmailForm;
const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    container: {
        marginVertical: OFFSET.VERTICAL
    },
    bottomSheetBackground: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    confirmationContainer: {
        flex: 1,
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingBottom: OFFSET.VERTICAL,
    },
    confirmationTitle: {
        marginBottom: OFFSET.VERTICAL,
        textAlign: 'center',
    },
    confirmationMessage: {
        marginBottom: OFFSET.VERTICAL * 2,
        textAlign: 'center',
    },
    confirmationButtons: {
        flexDirection: 'row',
        gap: OFFSET.HORIZONTAL / 2,
    },
    confirmationButton: {
        flex: 1,
    },
    infoButtonWrapper: {
        marginTop: OFFSET.VERTICAL,
    },
    infoButton: {
        width: '100%',
    },
});
