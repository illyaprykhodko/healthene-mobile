// outsource dependencies
import * as yup from 'yup';
import { Formik } from 'formik';
import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/fontawesome5';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// local dependencies
import Text from 'components/Text';
import { config } from 'constants';
import Screen from 'components/Screen';
import { ROUTES } from 'constants/routes';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import { Button } from 'components/Button';
import TextInput from 'components/TextInput';
import { IconButton } from 'components/IconButton';
import BackgroundImage from 'components/BackgroundImage';
import { useForgotPasswordMutation } from 'store/api/authApi';
import { RootStackParamList } from 'services/navigation/types';
import { RootState, useAppDispatch, useAppSelector } from 'store';
import { setEmail, setError, setSuccess, reset, setSubmitting } from 'store/slices/forgotPasswordSlice';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const validationSchema = yup.object().shape({
    email: yup.string().required('Email address is required').email('Invalid email address'),
});

export const ForgotPasswordScreen: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigation = useNavigation<NavigationProp>();
    const theme = useTheme();
    const { email, success, error, isSubmitting } = useAppSelector(
        (state: RootState) => state.forgotPassword,
    );
    const [forgotPassword] = useForgotPasswordMutation();

    const goToSignIn = useCallback(() => {
        dispatch(reset());
        navigation.navigate(ROUTES.SIGN_IN);
    }, [dispatch, navigation]);

    const renderForm = useCallback(() => (
        <View style={styles.formContainer}>
            <Text
                variant="h3"
                textAlign="center"
                style={styles.title}
                color={theme.colors.primary}
            >
                Forgot your password?
            </Text>
            <Text
                textAlign="center"
                color={theme.colors.primary}
            >
                Please enter your email address below
                to receive your password reset instructions
            </Text>
            <Formik
                initialValues={{ email: '' }}
                validationSchema={validationSchema}
                onSubmit={async values => {
                    try {
                        dispatch(setSubmitting(true));
                        dispatch(setError(null));
                        await forgotPassword({
                            email: values.email,
                            resetUrl: `${config.publicSiteUrl}/change-password/`,
                        }).unwrap();
                        dispatch(setEmail(values.email));
                        dispatch(setSuccess(true));
                    } catch (submitError: any) {
                        dispatch(setError(
                            submitError?.data?.message
                                || submitError?.data?.errorCode
                                || 'Failed to send reset email',
                        ));
                    } finally {
                        dispatch(setSubmitting(false));
                    }
                }}
            >
                {({ values, errors, touched, handleChange, handleSubmit }) => (
                    <View style={styles.inputWrapper}>
                        <TextInput
                            name="email"
                            label="Email"
                            touched={touched}
                            value={values.email}
                            disabled={isSubmitting}
                            color={theme.colors.primary}
                            onChangeText={handleChange('email')}
                            error={touched.email && errors.email ? { email: errors.email } : undefined}
                        />
                        {error ? (
                            <Text
                                textAlign="center"
                                style={styles.errorText}
                                color={theme.colors.error}
                            >
                                {error}
                            </Text>
                        ) : null}
                        <Button
                            style={styles.button}
                            onPress={handleSubmit}
                            loading={isSubmitting}
                            disabled={isSubmitting}
                            title="RECOVERY PASSWORD"
                            color={theme.colors.primary}
                        />
                    </View>
                )}
            </Formik>
        </View>
    ), [dispatch, forgotPassword, isSubmitting, error, theme.colors.primary, theme.colors.error]);

    const renderSuccess = useCallback(() => (
        <View style={styles.formContainer}>
            <View style={styles.row}>
                <View style={[styles.successIcon, { backgroundColor: theme.colors.success }]}>
                    <Icon iconStyle="solid" name="check" color={theme.colors.white} size={26} />
                </View>
            </View>
            <Text
                textAlign="center"
                color={theme.colors.primary}
            >
        We have sent you email with instructions, please go to
                {` ${email} `}
        and check it.
            </Text>
            <Button
                title="BACK TO LOGIN"
                onPress={goToSignIn}
                style={styles.button}
                color={theme.colors.primary}
            />
        </View>
    ), [email, goToSignIn, theme.colors]);

    return (
        <Screen initialized={true} style={{ ...styles.container, backgroundColor: theme.colors.background }}>
            <View>
                <BackgroundImage>
                    <IconButton
                        size={20}
                        iconStyle="solid"
                        icon="arrow-left"
                        onPress={goToSignIn}
                        style={styles.backIcon}
                        color={theme.colors.white}
                    />
                </BackgroundImage>
            </View>
            {success ? renderSuccess() : renderForm()}
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backIcon: {
        maxWidth: 70,
        marginTop: 25,
        padding: 16,
        marginRight: 'auto',
        marginBottom: 'auto',
    },
    formContainer: {
        flex: 1,
        paddingVertical: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    title: {
        marginBottom: OFFSET.POINT * 3,
    },
    text: {
        marginTop: OFFSET.VERTICAL * 1.6,
    },
    inputWrapper: {
        marginTop: OFFSET.VERTICAL * 1.6,
    },
    row: {
        alignItems: 'center',
        marginBottom: OFFSET.VERTICAL * 1.6,
    },
    successIcon: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 46,
        height: 46,
        borderRadius: 23,
    },
    button: {
        marginTop: OFFSET.VERTICAL * 1.5,
    },
    errorText: {
        marginTop: OFFSET.VERTICAL,
    },
});

