// outsource dependencies
import * as yup from 'yup';
import Toast from 'react-native-toast-message';
import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FieldArray, Formik, FormikErrors } from 'formik';
import EvilIcon from 'react-native-vector-icons/EvilIcons';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

// local dependencies
import { RootState } from 'store';
import Text from 'components/Text.tsx';
import { filters } from 'services/filter';
import { AddressForm } from './AddressForm';
import { OFFSET } from 'constants/offset.ts';
import { useTheme } from 'hooks/useTheme.ts';
import { Button } from 'components/Button.tsx';
import { setUser } from 'store/slices/appSlice.ts';
import { Address, Country, State, User } from 'types';
import { useUpdateUserDataMutation, useFilterCountryMutation } from 'store/api/settingsApi.ts';

// configure
const emptyAddress = {
    city: '',
    zipCode: '',
    address1: '',
    address2: '',
    description: '',
    country: {
        id: null,
        name: '',
        code: '',
    },
};
const validationSchema = yup.object().shape({
    addresses: yup
        .array()
        .of(
            yup.object().shape({
                description: yup
                    .string()
                    .trim()
                    .required('Description is required'),
                city: yup
                    .string()
                    .trim()
                    .required('City is required'),
                address1: yup
                    .string()
                    .required('Address line is required'),
                address2: yup.string().notRequired(),
                country: yup
                    .mixed<Country>()
                    .nullable()
                    .test('country-selected', 'Country is required', value => {
                        return !!value && !!value.id;
                    }),
                state: yup
                    .mixed<State>()
                    .nullable()
                    .test('state-required-if-exists', 'State is required', value => {
                        if (value === undefined || value === null) {
                            return true;
                        }
                        return !!value.id;
                    }),
                zipCode: yup
                    .string()
                    .required('ZIP Code is required')
                    .min(5, 'ZIP Code should have at least 5 symbols')
                    .max(9, 'ZIP Code should have at most 9 symbols'),
            })
        )
        .min(1, 'At least one address is required'),
});

export const AddressScreen = () => {
    const theme = useTheme();
    const dispatch = useDispatch();
    const user = useSelector((state: RootState) => state.app.user);
    const [updateUserData] = useUpdateUserDataMutation();

    // handle country & state filters
    const [filterCountry, { data: countryData }] = useFilterCountryMutation();
    useEffect(() => {
        filterCountry({});
    }, [filterCountry]);

    const initialValues = useMemo(() => ({ addresses: user?.addresses ?? [] }), [user]);
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
            onSubmit={onSubmit}
            initialValues={initialValues}
            validationSchema={validationSchema}
        >
            {({
                dirty,
                values,
                errors,
                touched,
                handleChange,
                handleSubmit,
                setFieldValue,
                setFieldTouched
            }) => {
                const addressErrors = errors.addresses as FormikErrors<Address>[] | undefined;
                return <View style={styles.flexGrow}>
                    <FieldArray name="addresses">
                        {({ push, remove }) => {
                            const addAddress = () => push(emptyAddress);
                            return <>
                                { (values?.addresses || []).length ? (<View style={styles.formArrayContainer}>
                                    <ScrollView showsVerticalScrollIndicator={false} style={styles.flexGrow}>
                                        {values?.addresses.map((address, index) => {
                                            return <AddressForm
                                                key={index}
                                                index={index}
                                                address={address}
                                                touched={touched}
                                                onRemove={remove}
                                                onChange={handleChange}
                                                addressErrors={addressErrors}
                                                setFieldValue={setFieldValue}
                                                setFieldTouched={setFieldTouched}
                                                countryData={(countryData || []).filter(country => country.id !== address.country.id)}
                                            />;
                                        })}
                                    </ScrollView>

                                    <View style={styles.buttonContainer}>
                                        <Button
                                            variant="outline"
                                            style={styles.btn}
                                            title="Add Address"
                                            onPress={addAddress}
                                        />
                                        <Button
                                            title="Update"
                                            variant="outline"
                                            disabled={!dirty}
                                            style={styles.btn}
                                            onPress={handleSubmit}
                                        />
                                    </View>
                                </View>)
                                    : (
                                        <View style={styles.emptyScreenContainer}>
                                            <View style={styles.emptyScreenWrapper}>
                                                <EvilIcon size={100} name="location" color={theme.colors.grey} />
                                                <Text variant="h4" textAlign="center" style={{ marginBottom: OFFSET.VERTICAL }}>No address added yet!</Text>
                                                <Text variant="h5" textAlign="center" color={theme.colors.grey} style={{ marginBottom: OFFSET.VERTICAL }}>
                                                Through your address information, we can provide a better service in purchases
                                                </Text>
                                            </View>
                                            <Button
                                                variant="outline"
                                                title="Add Address"
                                                onPress={addAddress}
                                                style={styles.addAddressBtn}
                                            />
                                        </View>
                                    )}
                            </>;
                        }}
                    </FieldArray>
                </View>;
            }}
        </Formik>
    </KeyboardAvoidingView>;
};

const styles = StyleSheet.create({
    flexGrow: {
        flexGrow: 1,
    },
    flex: {
        flex: 1,
    },
    formArrayContainer: {
        flex: 1,
        paddingVertical: OFFSET.POINT
    },
    emptyScreenContainer: {
        flex: 1,
        paddingVertical: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    emptyScreenWrapper: {
        marginTop: OFFSET.VERTICAL * 4,
        alignItems: 'center',
    },
    addAddressBtn: {
        marginTop: 'auto',
        marginBottom: OFFSET.POINT * 3,
    },
    buttonContainer: {
        margin: 'auto',
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: OFFSET.POINT * 4,
        paddingTop: OFFSET.POINT * 2,
        paddingBottom: OFFSET.POINT * 4,
        marginHorizontal: OFFSET.POINT * 2,
    },
    btn: {
        flex: 1,
        width: '45%'
    },
});
