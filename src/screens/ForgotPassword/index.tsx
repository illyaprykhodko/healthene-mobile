import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useForgotPasswordMutation } from '../../store/api/authApi';
import { RootState } from '../../store';
import { setEmail, setError, setSuccess, reset, setSubmitting } from '../../store/slices/forgotPasswordSlice';
import { Button } from 'components/Button';
// import { Text } from '../../components/Text';
// import { TextInput } from 'components/TextInput';
// import { Screen } from 'components/Screen';
// import { BackgroundImage } from 'components/BackgroundImage';
import { ROUTES } from '../../constants/routes';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../services/navigation/types';
import * as yup from 'yup';
import { Formik } from 'formik';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useTheme } from '../../hooks/useTheme';
import Text from 'components/Text';
import BackgroundImage from 'components/BackgroundImage';
import TextInput from 'components/TextInput';
import Screen from 'components/Screen';
import { IconButton } from 'components/IconButton';
// import { IconButton } from '@react-native-material/core';
// import  IconButton  from '@vector-icons/react-native-vector-icons';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const validationSchema = yup.object().shape({
    email: yup.string().required('Email address is required').email('Invalid email address'),
});

export const ForgotPasswordScreen: React.FC = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProp>();
    const theme = useTheme();
    const { email, isSubmitting, error, success } = useSelector((state: RootState) => state.forgotPassword);
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
                        await forgotPassword({ email: values.email }).unwrap();
                        dispatch(setEmail(values.email));
                        dispatch(setSuccess(true));
                    } catch (error: any) {
                        dispatch(setError(error.message || 'Failed to send reset email'));
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
                            value={values.email}
                            onChangeText={handleChange('email')}
                            error={touched.email && errors.email ? { [errors.email]: errors.email } : undefined}
                            disabled={isSubmitting}
                            color={theme.colors.primary}
                        />
                        <Button
                            title="RECOVERY PASSWORD"
                            onPress={handleSubmit}
                            loading={isSubmitting}
                            style={styles.button}
                            color={theme.colors.primary}
                        />
                    </View>
                )}
            </Formik>
        </View>
    ), [dispatch, forgotPassword, isSubmitting, theme.colors.primary]);

    const renderSuccess = useCallback(() => (
        <View style={styles.formContainer}>
            <View style={styles.row}>
                <View style={[styles.successIcon, { backgroundColor: theme.colors.success }]}>
                    <Icon name="check" color={theme.colors.white} size={26} />
                </View>
            </View>
            <Text
                textAlign="center"
                style={styles.text}
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
            <BackgroundImage style={styles.backgroundImage}>
                {/* <Button
          title="BACK TO LOGIN"
          icon="arrow-left"
          onPress={goToSignIn}
          style={styles.backIcon}
          variant="text"
          color={theme.colors.white}
        /> */}
                <IconButton
                    size={20}
                    icon="arrow-left"
                    onPress={goToSignIn}
                    style={styles.backIcon}
                    color={theme.colors.white}
                />
                {success ? renderSuccess() : renderForm()}
            </BackgroundImage>
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backgroundImage: {
        flex: 1,
    },
    backIcon: {
        maxWidth: 70,
        marginTop: 25,
        padding: 16,
        marginRight: 'auto',
    },
    //   backIcon: {
    //     // position: 'absolute',
    //     top: 25,
    //     left: 16,
    //     zIndex: 1,
    //   },
    formContainer: {
        flex: 1,
        padding: 32,
        justifyContent: 'center',
    },
    title: {
        marginBottom: 12,
    },
    inputWrapper: {
        marginTop: 32,
    },
    text: {
        marginTop: 32,
    },
    row: {
        alignItems: 'center',
        marginBottom: 32,
    },
    successIcon: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 46,
        height: 46,
        borderRadius: 23,
    },
    button: {
        marginTop: 30,
    },
});
