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
import { Button } from 'components/Button.tsx';
import TextInput from 'components/TextInput.tsx';
import { setUser } from 'store/slices/appSlice.ts';
import { useUpdateUserDataMutation } from 'store/api/settingsApi.ts';
import { OFFSET } from 'constants/offset.ts';

interface EmailFormProps {
    // props here
}

const EmailForm = (props: EmailFormProps) => {
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

    return <Formik
        onSubmit={onSubmit}
        initialValues={{ email: user?.email }}
        // validationSchema={validationSchema}
    >
        {({
            dirty,
            values,
            errors,
            touched,
            handleChange,
            handleSubmit,
        }) => <View style={{ marginVertical: OFFSET.VERTICAL }}>
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
        </View>
        }

    </Formik>;
};

export default EmailForm;
const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    container: {
        // style here
    },
});
