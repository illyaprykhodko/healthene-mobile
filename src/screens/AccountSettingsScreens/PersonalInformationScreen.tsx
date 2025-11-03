// outsource dependencies
import React from 'react';
import { Formik } from 'formik';
import { RootState } from 'store';
import { useSelector } from 'react-redux';
import { StyleSheet, View } from 'react-native';

// local dependencies
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import TextInput from 'components/TextInput.tsx';

export const PersonalInformationScreen = () => {
    const theme = useTheme();
    const user = useSelector((state: RootState) => state.app.user);
    console.log('USER', user);
    return <View style={styles.container}>
        <Formik
            initialValues={{
                lastName: user?.lastName,
                firstName: user?.firstName,
                middleName: user?.middleName,
            }}
            onSubmit={async data => {
                console.log('data', data);
            }}>
            {({ values, errors, touched, handleChange, handleSubmit }) => (
                <View>
                    <TextInput
                        name="firstName"
                        disabled={false}
                        label="First Name"
                        value={values.firstName}
                        onChangeText={handleChange('firstName')}
                        inputStyle={{ ...styles.inputStyle, color: theme.colors.black }}
                        error={touched.firstName && errors.firstName ? { [errors.firstName]: errors.firstName } : undefined}
                    />
                    <TextInput
                        name="middleName"
                        disabled={false}
                        label="Middle Name"
                        value={values.middleName}
                        onChangeText={handleChange('middleName')}
                        inputStyle={{ ...styles.inputStyle, color: theme.colors.black }}
                        error={touched.middleName && errors.middleName ? { [errors.middleName]: errors.middleName } : undefined}
                    />
                    <TextInput
                        name="lastName"
                        disabled={false}
                        label="Last Name"
                        value={values.lastName}
                        onChangeText={handleChange('lastName')}
                        inputStyle={{ ...styles.inputStyle, color: theme.colors.black }}
                        error={touched.lastName && errors.lastName ? { [errors.lastName]: errors.lastName } : undefined}
                    />
                </View>
            )}
        </Formik>
    </View>;
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.VERTICAL,
    },
    inputStyle: {
        textAlign: 'left',
    }
});
