// outsource dependencies
import { View, StyleSheet } from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { FormikErrors, FieldArrayRenderProps } from 'formik';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { FormikHandlers, FormikTouched, FormikHelpers } from 'formik/dist/types';

// local dependencies
import Text from 'components/Text.tsx';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import { Address, Country, State } from 'types';
import TextInput from 'components/TextInput.tsx';
import { MessageService } from 'services/messages';
import { Dropdown } from 'components/Dropdown.tsx';
import { useFilterStateMutation } from 'store/api/settingsApi.ts';

interface AddressFormProps {
    index: number,
    address: Address,
    countryData: Country[] | undefined,
    addressErrors?: FormikErrors<Address>[],
    onChange: FormikHandlers['handleChange'];
    onRemove: FieldArrayRenderProps['remove'],
    touched?: FormikTouched<{addresses: Address[]}>;
    setFieldValue: FormikHelpers<{ addresses: Address[] }>['setFieldValue'];
    setFieldTouched: FormikHelpers<{ addresses: Address[] }>['setFieldTouched'];
}

export const AddressForm = memo(({
    index,
    address,
    touched,
    onRemove,
    onChange,
    countryData,
    addressErrors,
    setFieldValue,
    setFieldTouched
} : AddressFormProps) => {
    const theme = useTheme();
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

    const countryError = addressErrors?.[index]?.country as string;
    const stateError = addressErrors?.[index]?.state as string;

    // handle state
    const [filterState] = useFilterStateMutation();
    const [states, setStates] = useState<State[] | []>([]);

    const handleGetStates = useCallback(async (countryId: number) => {
        try {
            const result = await filterState({ country: countryId }).unwrap();
            if (result.length > 0) {
                setStates(result);
                // NOTE: set id for validation
                setFieldValue(`addresses[${index}].state`, {
                    id: null
                });
            } else {
                setStates([]);
                setFieldValue(`addresses[${index}].state`, null);
            }
        } catch (error) {
            console.error('Error fetching states:', error);
        }
    }, [setFieldTouched, setFieldValue, index]);

    const handleCountry = useCallback((country: Country) => {
        handleGetStates(country.id);
        setFieldTouched(`addresses[${index}].country`, true);
        setFieldValue(`addresses[${index}].country`, country);
    }, [setFieldValue, setFieldTouched, handleGetStates]);

    const handleState = useCallback((state: State) => {
        setFieldValue(`addresses[${index}].state`, state);
        setFieldTouched(`addresses[${index}].state.id`, false);
    }, [setFieldValue, setFieldTouched]);

    useEffect(() => {
        if (address.country.id) {
            handleGetStates(address.country?.id);
        }
    }, [address.country, handleGetStates]);

    const removeAddress = useCallback(() => {
        MessageService.confirmation(
            {
                uid: 'Address',
                title: 'Delete address',
                message: 'Are you sure you want to delete this address?'
            }
        ).then(({ value }) => {
            if (value) { onRemove(index); }
        });
    }, [onRemove, index]);

    return <View style={{ ...styles.container, borderRadius: theme.borderRadius.md, borderColor: theme.colors.grey }}>
        <View style={[styles.wrapper, styles.addressHeader]}>
            <Text variant="h4" color={theme.colors.primary}>{`Address ${index + 1}`}</Text>
            <FeatherIcon size={24} name="trash" onPress={removeAddress} color={theme.colors.darkGrey} />
        </View>
        <TextInput
            disabled={false}
            textAlign="left"
            label="Description"
            name={descriptionName}
            color={theme.colors.black}
            value={address.description}
            onChangeText={onChange(descriptionName)}
            onBlur={() => setFieldTouched(descriptionName, true)}
            touched={{ [descriptionName]: touched?.addresses?.[index]?.description ?? false }}
            error={descriptionError
                ? { [descriptionName]: descriptionError }
                : undefined
            }
        />
        <View style={styles.wrapper}>
            <TextInput
                disabled={false}
                textAlign="left"
                name={address1Name}
                label="Address Line"
                value={address.address1}
                color={theme.colors.black}
                onChangeText={onChange(address1Name)}
                onBlur={() => setFieldTouched(address1Name, true)}
                touched={{ [address1Name]: touched?.addresses?.[index]?.address1 ?? false }}
                error={address1Error
                    ? { [address1Name]: address1Error }
                    : undefined
                }
            />
            <View style={styles.wrapper}>
                <TextInput
                    disabled={false}
                    textAlign="left"
                    name={address2Name}
                    label="Address Line 2"
                    value={address.address2}
                    color={theme.colors.black}
                    onChangeText={onChange(address2Name)}
                    onBlur={() => setFieldTouched(address2Name, true)}
                    touched={{ [address2Name]: touched?.addresses?.[index]?.address2 ?? false }}
                    error={address2Error
                        ? { [address2Name]: address2Error }
                        : undefined
                    }
                />
            </View>
            <View style={styles.wrapper}>
                <TextInput
                    label="City"
                    name={cityName}
                    disabled={false}
                    textAlign="left"
                    value={address.city}
                    color={theme.colors.black}
                    onChangeText={onChange(cityName)}
                    onBlur={() => setFieldTouched(cityName, true)}
                    touched={{ [cityName]: touched?.addresses?.[index]?.city ?? false }}
                    error={cityError
                        ? { [cityName]: cityError }
                        : undefined
                    }
                />
            </View>
            <View style={styles.wrapper}>
                <TextInput
                    label="ZIP Code"
                    disabled={false}
                    textAlign="left"
                    name={zipCodeName}
                    value={address.zipCode}
                    color={theme.colors.black}
                    onChangeText={onChange(zipCodeName)}
                    onBlur={() => setFieldTouched(zipCodeName, true)}
                    touched={{ [zipCodeName]: touched?.addresses?.[index]?.zipCode ?? false }}
                    error={zipCodeError
                        ? { [zipCodeName]: zipCodeError }
                        : undefined
                    }
                />
            </View>
            <View style={styles.wrapper}>
                <Dropdown
                    isSearch
                    position="top"
                    label="Country"
                    labelField="name"
                    valueField="name"
                    data={countryData ?? []}
                    onSelect={handleCountry}
                    errorText={countryError}
                    value={address.country.name}
                    touched={touched?.addresses?.[index]?.country?.id}
                />
            </View>
            {states.length
                ? <View style={styles.wrapper}>
                    <Dropdown
                        isSearch
                        label="State"
                        data={states}
                        position="top"
                        labelField="name"
                        valueField="name"
                        errorText={stateError}
                        onSelect={handleState}
                        value={address.state.name}
                        touched={touched?.addresses?.[index]?.state?.id}
                    />
                </View>
                : null
            }
        </View>
    </View>;
});

const styles = StyleSheet.create({
    container: {
        borderWidth: 1,
        padding: OFFSET.POINT * 2,
        marginVertical: OFFSET.VERTICAL,
        marginHorizontal: OFFSET.POINT * 2
    },
    wrapper: {
        paddingVertical: OFFSET.POINT * 2
    },
    addressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: OFFSET.VERTICAL,
    }
});
