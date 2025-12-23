// outsource dependencies
import { Formik } from 'formik';
import React, { useEffect } from 'react';
import Toast from 'react-native-toast-message';
import { ScrollView, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

// local dependencies
import { User } from 'types';
import { RootState } from 'store';
import { filters } from 'services/filter';
import { useTheme } from 'hooks/useTheme.ts';
import { Button } from 'components/Button.tsx';
import TextInput from 'components/TextInput.tsx';
import { setUser } from 'store/slices/appSlice.ts';
import { useUpdateUserDataMutation } from 'store/api/settingsApi.ts';


interface AccountInformationFormProps {
    onPreloader: React.Dispatch<React.SetStateAction<boolean>>;
}

const AccountInformationForm = ({ onPreloader }: AccountInformationFormProps) => {
    const theme = useTheme();
    const dispatch = useDispatch();
    const user = useSelector((state: RootState) => state.app.user);
    const [updateUserData, { isLoading }] = useUpdateUserDataMutation();
    useEffect(() => {
        onPreloader(isLoading);
    }, [isLoading, onPreloader]);

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

    return <>
        <Formik
            onSubmit={onSubmit}
            initialValues={{
                cellPhone: user?.cellPhone,
                homePhone: user?.homePhone,
                workPhone: user?.workPhone,
            }}
        >
            {({
                dirty,
                values,
                errors,
                touched,
                handleChange,
                handleSubmit,
            }) => <>
                <ScrollView style={styles.flex}>
                    <TextInput
                        name="cellPhone"
                        disabled={false}
                        textAlign="left"
                        touched={touched}
                        label="Cell Phone"
                        value={values.cellPhone}
                        color={theme.colors.black}
                        onChangeText={handleChange('cellPhone')}
                        error={touched.cellPhone && errors.cellPhone ? { cellPhone: errors.cellPhone } : undefined}
                    />
                    <TextInput
                        name="homePhone"
                        disabled={false}
                        textAlign="left"
                        touched={touched}
                        label="Home Phone"
                        value={values.homePhone}
                        color={theme.colors.black}
                        onChangeText={handleChange('homePhone')}
                        error={touched.homePhone && errors.homePhone ? { homePhone: errors.homePhone } : undefined}
                    />
                    <TextInput
                        name="workPhone"
                        disabled={false}
                        textAlign="left"
                        touched={touched}
                        label="Work Phone"
                        value={values.workPhone}
                        color={theme.colors.black}
                        onChangeText={handleChange('workPhone')}
                        error={touched.workPhone && errors.workPhone ? { workPhone: errors.workPhone } : undefined}
                    />
                    <Button
                        disabled={!dirty}
                        variant="outline"
                        onPress={handleSubmit}
                        title="EDIT INFORMATION"
                    />
                </ScrollView>
            </>
            }
        </Formik>
    </>;
};

export default AccountInformationForm;
const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
});
