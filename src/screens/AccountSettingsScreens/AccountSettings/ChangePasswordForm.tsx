// outsource dependencies
import React from 'react';
import { Formik } from 'formik';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

// local dependencies
import { User } from 'types';
import { RootState } from 'store';
import { filters } from 'services/filter';
import { useTheme } from 'hooks/useTheme.ts';
import { setUser } from 'store/slices/appSlice.ts';
import { useUpdateUserDataMutation } from 'store/api/settingsApi.ts';

interface ChangePasswordFormProps {
    // props here
}

const ChangePasswordForm = (props: ChangePasswordFormProps) => {
    const theme = useTheme();
    const dispatch = useDispatch();
    const user = useSelector((state: RootState) => state.app.user);
    const [updateUserData] = useUpdateUserDataMutation();

    const onSubmit = async (data: Partial<User>) => {
        try {
            const submit = await updateUserData(data).unwrap();
            dispatch(setUser(submit));
            Toast.show({
                type: 'success',
                text1: 'Addresses updated',
                text2: 'Your address information has been updated successfully.',
            });
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Update failed',
                text2: String(filters.humanize(error?.data?.errorCode)) || 'Something went wrong while updating your information. Please try again later.',
            });
        }
    };

    return <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 100}
    >
        <Formik
            initialValues={{}}
            onSubmit={onSubmit}
            // initialValues={initialValues}
            // validationSchema={validationSchema}
        >
            {({
                dirty,
                values,
                errors,
                touched,
                handleChange,
                handleSubmit,
            }) => <View></View>}
        </Formik>

    </KeyboardAvoidingView>;
};

export default ChangePasswordForm;
const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    container: {
        // style here
    },
});
