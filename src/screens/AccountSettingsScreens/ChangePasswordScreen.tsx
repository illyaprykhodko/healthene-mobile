// outsource dependencies
import React from 'react';
import * as yup from 'yup';
import { Formik } from 'formik';
import { StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';

// local dependencies
import { ChangePassword } from 'types';
import { filters } from 'services/filter';
import Screen from 'components/Screen.tsx';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import { Button } from 'components/Button.tsx';
import TextInput from 'components/TextInput.tsx';
import { isBadCredentialsError } from 'services/auth/errors';
import { useChangePasswordMutation } from 'store/api/settingsApi.ts';

// validation
const getValidation = (text: string) => yup.string()
    .required(`${text} is required`)
    .min(8, 'Password should be at least 8 characters in a length');

const validationSchema = yup
    .object({
        newPassword: getValidation('New password'),
        currentPassword: getValidation('Current password'),
        checkPassword: getValidation('this field').oneOf([yup.ref('newPassword')], 'Passwords must match'),
    });

const ChangePasswordScreen = () => {
    const theme = useTheme();
    const navigation = useNavigation();
    const [updatePassword, { isLoading }] = useChangePasswordMutation();

    const onSubmit = async (data: ChangePassword) => {
        try {
            await updatePassword({
                newPassword: data.newPassword,
                currentPassword: data.currentPassword,
            }).unwrap();
            Toast.show({
                type: 'success',
                text1: 'Password updated',
                text2: 'Your password has been changed successfully.',
            });
            if (navigation.canGoBack()) {
                navigation.goBack();
            }
        } catch (error: any) {
            const badCredentials = isBadCredentialsError(error);
            Toast.show({
                type: 'error',
                text1: badCredentials ? 'Incorrect Current Password' : 'Password update failed',
                text2: badCredentials
                    ? 'The current password you entered is incorrect. Please try again.'
                    : String(filters.humanize(error?.data?.errorCode)) || 'Something went wrong while changing your password. Please try again later.',
            });
        }
    };

    return <Screen initialized={true} style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Formik
            onSubmit={onSubmit}
            validationSchema={validationSchema}
            initialValues={{
                newPassword: '',
                checkPassword: '',
                currentPassword: '',
            }}
        >
            {({
                values,
                errors,
                touched,
                handleChange,
                handleSubmit,
            }) => <>
                <TextInput
                    secureTextEntry
                    textAlign="left"
                    touched={touched}
                    disabled={isLoading}
                    name="currentPassword"
                    label="Current Password"
                    color={theme.colors.black}
                    value={values.currentPassword}
                    onChangeText={handleChange('currentPassword')}
                    error={touched.currentPassword && errors.currentPassword ? { currentPassword: errors.currentPassword } : undefined}
                />
                <TextInput
                    textAlign="left"
                    secureTextEntry
                    touched={touched}
                    name="newPassword"
                    disabled={isLoading}
                    label="New Password"
                    color={theme.colors.black}
                    value={values.newPassword}
                    onChangeText={handleChange('newPassword')}
                    error={touched.newPassword && errors.newPassword ? { newPassword: errors.newPassword } : undefined}
                />
                <TextInput
                    textAlign="left"
                    secureTextEntry
                    touched={touched}
                    disabled={isLoading}
                    name="checkPassword"
                    color={theme.colors.black}
                    label="Confirm New Password"
                    value={values.checkPassword}
                    onChangeText={handleChange('checkPassword')}
                    error={touched.checkPassword && errors.checkPassword ? { checkPassword: errors.checkPassword } : undefined}
                />
                <Button
                    variant="outline"
                    loading={isLoading}
                    disabled={isLoading}
                    onPress={handleSubmit}
                    title="CHANGE PASSWORD"
                    style={styles.submitBtn}
                />
            </>}
        </Formik>
    </Screen>;
};

export default ChangePasswordScreen;
const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingVertical: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    submitBtn: {
        marginTop: 'auto',
        marginBottom: OFFSET.VERTICAL,
    }
});
