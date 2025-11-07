// outsource dependencies
import * as yup from 'yup';
import React, { useMemo } from 'react';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';
import { FieldArray, Formik, FormikErrors } from 'formik';
import EvilIcon from 'react-native-vector-icons/EvilIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { ScrollView, StyleSheet, View } from 'react-native';

// local dependencies
import { RootState } from 'store';
import { Address, User } from 'types';
import Text from 'components/Text.tsx';
import { filters } from 'services/filter';
import { OFFSET } from 'constants/offset.ts';
import { useTheme } from 'hooks/useTheme.ts';
import { Button } from 'components/Button.tsx';
import TextInput from 'components/TextInput.tsx';
import { setUser } from 'store/slices/appSlice.ts';
import { MessageService } from 'services/messages';
import { useUpdateUserDataMutation } from 'store/api/settingsApi.ts';

// configure
const emptyAddress = {
    city: '',
    zipCode: '',
    country: '',
    address1: '',
    address2: '',
    description: '',
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
                // state: yup
                //     .string()
                //     .when('country', {
                //         is: (country: string) => country === 'USA',
                //         then: (schema) => schema.required('State is required for USA'),
                //         otherwise: (schema) => schema.notRequired(),
                //     }),
                address1: yup
                    .string()
                    .required('Address line is required'),
                address2: yup.string().notRequired(),
                country: yup
                    .string()
                    .required('Country is required'),
                // zipCode: yup
                //     .string()
                //     .matches(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code')
                //     .required('ZIP code is required'),
            })
        )
        .min(1, 'At least one address is required'),
});

export const AddressScreen = () => {
    const theme = useTheme();
    const dispatch = useDispatch();
    const [updateUserData] = useUpdateUserDataMutation();
    const user = useSelector((state: RootState) => state.app.user);
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

    return <Formik
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
            setFieldTouched
        }) => {
            const addressErrors = errors.addresses as FormikErrors<Address>[] | undefined;
            return <View style={styles.flexGrow}>
                <FieldArray name="addresses">
                    {({ push, remove }) => {
                        const addAddress = () => push(emptyAddress);
                        return <>
                            { (values?.addresses || []).length ? (<View style={{ paddingHorizontal: OFFSET.HORIZONTAL, flex: 1 }}>
                                <ScrollView showsVerticalScrollIndicator={false} style={styles.flexGrow}>
                                    {values?.addresses.map((address, index) => {
                                        const descriptionName = `addresses[${index}].description`;
                                        const descriptionError = addressErrors?.[index]?.description;

                                        const address1Name = `addresses[${index}].address1`;
                                        const address1Error = addressErrors?.[index]?.address1;

                                        const address2Name = `addresses[${index}].address2`;
                                        const address2Error = addressErrors?.[index]?.address2;

                                        const cityName = `addresses[${index}].city`;
                                        const cityError = addressErrors?.[index]?.city;

                                        const zipCodeName = `addresses[${index}].zipCode`;
                                        const zipCodeError = addressErrors?.[index]?.zipCode;

                                        const removeAddress = () => {
                                            MessageService.confirmation(
                                                {
                                                    uid: 'Address',
                                                    title: 'Delete address',
                                                    message: 'Are you sure you want to delete this address?'
                                                }
                                            ).then(({ value }) => {
                                                if (value) { remove(index); }
                                            });
                                        };


                                        return <View key={index} style={[
                                            styles.addressContainer,
                                            {
                                                borderColor: theme.colors.grey,
                                                borderRadius: theme.borderRadius.md
                                            }
                                        ]}>
                                            <View style={[styles.wrapper, styles.addressHeader]}>
                                                <Text color={theme.colors.primary}>{`Address ${index + 1}`}</Text>
                                                <FeatherIcon size={24} name="trash" onPress={removeAddress} color={theme.colors.darkGrey} />
                                            </View>
                                            <TextInput
                                                disabled={false}
                                                label="Description"
                                                name={descriptionName}
                                                value={address.description}
                                                onChangeText={handleChange(descriptionName)}
                                                onBlur={() => setFieldTouched(descriptionName, true)}
                                                inputStyle={{ ...styles.inputStyle, color: theme.colors.black }}
                                                touched={{ [descriptionName]: touched?.addresses?.[index]?.description ?? false }}
                                                error={(touched.addresses?.[index]?.description && descriptionError)
                                                    ? { [descriptionName]: descriptionError }
                                                    : undefined
                                                }
                                            />
                                            <View style={styles.wrapper}>
                                                <TextInput
                                                    disabled={false}
                                                    name={address1Name}
                                                    label="Address Line"
                                                    value={address.address1}
                                                    onChangeText={handleChange(address1Name)}
                                                    onBlur={() => setFieldTouched(address1Name, true)}
                                                    inputStyle={{ ...styles.inputStyle, color: theme.colors.black }}
                                                    touched={{ [address1Name]: touched?.addresses?.[index]?.address1 ?? false }}
                                                    error={(touched.addresses?.[index]?.address1 && address1Error)
                                                        ? { [address1Name]: address1Error }
                                                        : undefined
                                                    }
                                                />
                                            </View>
                                            <View style={styles.wrapper}>
                                                <TextInput
                                                    disabled={false}
                                                    name={address2Name}
                                                    label="Address Line 2"
                                                    value={address.address1}
                                                    onChangeText={handleChange(address2Name)}
                                                    onBlur={() => setFieldTouched(address2Name, true)}
                                                    inputStyle={{ ...styles.inputStyle, color: theme.colors.black }}
                                                    touched={{ [address2Name]: touched?.addresses?.[index]?.address2 ?? false }}
                                                    error={(touched.addresses?.[index]?.address2 && address2Error)
                                                        ? { [address2Name]: address2Error }
                                                        : undefined
                                                    }
                                                />
                                            </View>
                                            <View style={styles.wrapper}>
                                                <TextInput
                                                    label="City"
                                                    disabled={false}
                                                    name={cityName}
                                                    value={address.city}
                                                    onChangeText={handleChange(cityName)}
                                                    onBlur={() => setFieldTouched(cityName, true)}
                                                    inputStyle={{ ...styles.inputStyle, color: theme.colors.black }}
                                                    touched={{ [cityName]: touched?.addresses?.[index]?.city ?? false }}
                                                    error={(touched.addresses?.[index]?.city && cityError)
                                                        ? { [cityName]: cityError }
                                                        : undefined
                                                    }
                                                />
                                            </View>
                                            <View style={styles.wrapper}>
                                                <TextInput
                                                    label="ZIP Code"
                                                    disabled={false}
                                                    name={zipCodeName}
                                                    value={address.zipCode}
                                                    onChangeText={handleChange(zipCodeName)}
                                                    onBlur={() => setFieldTouched(zipCodeName, true)}
                                                    inputStyle={{ ...styles.inputStyle, color: theme.colors.black }}
                                                    touched={{ [zipCodeName]: touched?.addresses?.[index]?.zipCode ?? false }}
                                                    error={(touched.addresses?.[index]?.zipCode && zipCodeError)
                                                        ? { [zipCodeName]: zipCodeError }
                                                        : undefined
                                                    }
                                                />
                                            </View>
                                        </View>;
                                    })}
                                </ScrollView>
                                <View style={styles.buttonContainer}>
                                    <Button
                                        variant="outline"
                                        title="Add Address"
                                        onPress={addAddress}
                                    />
                                    <Button
                                        disabled={!dirty}
                                        variant="outline"
                                        onPress={handleSubmit}
                                        title="Update Information"
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
    </Formik>;
};

const styles = StyleSheet.create({
    flexGrow: {
        flexGrow: 1,
    },
    addressContainer: {
        marginTop: OFFSET.POINT * 2,
        borderWidth: 1,
        padding: OFFSET.POINT * 2
    },
    addressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    inputStyle: {
        textAlign: 'left',
    },
    wrapper: {
        paddingVertical: OFFSET.POINT * 4
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
        width: '100%',
        gap: OFFSET.POINT * 4,
        paddingTop: OFFSET.POINT * 2,
        paddingBottom: OFFSET.POINT * 8,
    },
});
