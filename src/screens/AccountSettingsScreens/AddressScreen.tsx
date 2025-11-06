// outsource dependencies
import * as yup from 'yup';
import React, { useMemo } from 'react';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';
import { FieldArray, Formik, FormikErrors } from 'formik';
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
import { useUpdateUserDataMutation } from 'store/api/settingsApi.ts';

interface AddressScreenProps {
  // props here
}

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

export const AddressScreen = (props: AddressScreenProps) => {
    const theme = useTheme();
    const dispatch = useDispatch();
    const [updateUserData] = useUpdateUserDataMutation();
    const user = useSelector((state: RootState) => state.app.user);

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

    console.log('USER', user);
    const initialValues = useMemo(() => ({ addresses: user?.addresses ?? [] }), [user]);
    return <ScrollView style={styles.flex}>
        <Formik
            onSubmit={onSubmit}
            validationSchema={validationSchema}
            initialValues={initialValues}
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
                return <>
                    <FieldArray name="addresses">
                        {({ push }) => (
                            <>
                                {(values?.addresses || []).map((address, index) => {
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

                                    return <View key={index} style={[styles.addressContainer, {
                                        borderColor: theme.colors.grey,
                                        borderRadius: theme.borderRadius.md
                                    }]}>
                                        <View style={styles.wrapper}>
                                            <Text color={theme.colors.primary}>{`Address ${index + 1}`}</Text>
                                        </View>
                                        <TextInput
                                            disabled={false}
                                            label="Description"
                                            name={descriptionName}
                                            value={address.description}
                                            onChangeText={handleChange(descriptionName)}
                                            onBlur={() => setFieldTouched(descriptionName, true)}
                                            inputStyle={{ ...styles.inputStyle, color: theme.colors.black }}
                                            touched={{ [descriptionName]: touched?.addresses?.[index].description ?? false }}
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
                                                touched={{ [address1Name]: touched?.addresses?.[index].address1 ?? false }}
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
                                                touched={{ [address2Name]: touched?.addresses?.[index].address2 ?? false }}
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
                                                touched={{ [cityName]: touched?.addresses?.[index].city ?? false }}
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
                                                touched={{ [zipCodeName]: touched?.addresses?.[index].zipCode ?? false }}
                                                error={(touched.addresses?.[index]?.zipCode && zipCodeError)
                                                    ? { [zipCodeName]: zipCodeError }
                                                    : undefined
                                                }
                                            />
                                        </View>
                                    </View>;
                                })}
                            </>
                        )}
                    </FieldArray>
                    <Button
                        disabled={!dirty}
                        variant="outline"
                        onPress={handleSubmit}
                        title="Update Information"
                        // style={styles.updateBtn}
                    />
                </>;
            }}
        </Formik>
    </ScrollView>;
};

const styles = StyleSheet.create({
    flex: {
        flex: 1
    },
    addressContainer: {
        margin: OFFSET.POINT * 2,
        borderWidth: 1,
        padding: OFFSET.POINT * 2
    },
    inputStyle: {
        textAlign: 'left',
    },
    wrapper: {
        paddingVertical: OFFSET.POINT * 4
    }
});
