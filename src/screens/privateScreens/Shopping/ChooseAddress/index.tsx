// outsource dependencies
import * as yup from 'yup';
import { Formik, FormikHelpers } from 'formik';
import React, { memo, useCallback } from 'react';
import Icon from '@react-native-vector-icons/fontisto';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { COLORS } from 'constants/colors';
import { OFFSET } from 'constants/offset';
import { ROUTES } from 'constants/routes';
import { useTheme } from 'hooks/useTheme';
import { filters } from 'services/filter';
import { Button } from 'components/Button';
import DefImage from 'components/DefImage';
import TextInput from 'components/TextInput';
import StackHeader from 'components/StackHeader';
import { LOCATION_TYPES } from '../ChooseGroceryStore';
import { useAppDispatch, useAppSelector } from 'store';
import { useShoppingDrawer } from '../useShoppingDrawer';
import { selectSelectedStore, setSelectedStore } from 'store/slices/shoppingSlice';

interface Address {
    id?: number;
    address: string;
    city: string;
    state: string;
    storeLocationType: string;
}

interface AddressFormValues {
    city: string;
    state: string;
    address: string;
    storeLocationType: string;
}

// // Humanize location type string
// const humanize = (str: string) => {
//     if (!str) { return ''; }
//     return str.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
// };

// Address form component for OTHER location type
const AddressForm: React.FC<{
    values: AddressFormValues;
    errors: Record<string, string>;
    touched: Record<string, boolean>;
    disabled: boolean;
    handleChange: (field: string) => (text: string) => void;
    setFieldTouched: (field: string, touched: boolean) => void;
}> = ({ values, errors, touched, disabled, handleChange, setFieldTouched }): React.ReactElement => (
    <View style={styles.formContainer}>
        <TextInput
            // multiline
            name="address"
            error={errors}
            label="Address"
            textAlign="left"
            touched={touched}
            disabled={disabled}
            value={values.address}
            onChangeText={handleChange('address')}
            onBlur={() => setFieldTouched('address', true)}
        />
        <View style={styles.formField}>
            <TextInput
                name="city"
                label="City"
                error={errors}
                textAlign="left"
                multiline={false}
                touched={touched}
                disabled={disabled}
                value={values.city}
                onChangeText={handleChange('city')}
                onBlur={() => setFieldTouched('city', true)}
            />
        </View>
        <View style={styles.formField}>
            <TextInput
                name="state"
                label="State"
                error={errors}
                textAlign="left"
                touched={touched}
                multiline={false}
                disabled={disabled}
                value={values.state}
                onChangeText={handleChange('state')}
                onBlur={() => setFieldTouched('state', true)}
            />
        </View>
    </View>
);

const AddressItem: React.FC<{
    item: Address;
    isSelected: boolean;
    onSelect: (item: Address) => void;
}> = ({ item, isSelected, onSelect }) => (
    <TouchableOpacity
        onPress={() => onSelect(item)}
        style={[styles.addressItem, isSelected && styles.addressItemSelected]}
    >
        <View style={styles.addressInfo}>
            <Text variant="h5" style={styles.locationText}>
                {filters.humanize(item.storeLocationType)}
            </Text>
        </View>
        <Icon
            name={isSelected ? 'radio-btn-active' : 'radio-btn-passive'}
            color={isSelected ? COLORS.BLACK : COLORS.GREY}
            size={24}
        />
    </TouchableOpacity>
);

const ChooseAddress: React.FC = () => {
    const navigation = useNavigation<any>();
    const dispatch = useAppDispatch();
    const theme = useTheme();

    const selectedStore = useAppSelector(selectSelectedStore);
    const addresses = selectedStore?.addresses || [];
    const isOther = selectedStore?.storeLocationType === LOCATION_TYPES.OTHER;

    const otherAddress = addresses.find((addr: Address) => addr.storeLocationType === LOCATION_TYPES.OTHER);
    const initialValues: AddressFormValues = {
        address: otherAddress?.address || '',
        city: otherAddress?.city || '',
        state: otherAddress?.state || '',
        storeLocationType: LOCATION_TYPES.OTHER,
    };

    const validationSchema = isOther
        ? yup.object().shape({
            city: yup.string().required('Please Fill Out'),
            state: yup.string().required('Please Fill Out'),
            address: yup.string().required('Please Fill Out'),
        })
        : null;

    const openDrawer = useShoppingDrawer();

    const handleGoBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    const handleSelectAddress = useCallback((item: Address) => {
        dispatch(setSelectedStore({
            ...selectedStore,
            storeLocationType: item.storeLocationType,
        }));
    }, [selectedStore, dispatch]);

    const handleFormSubmit = useCallback(async (
        formData: AddressFormValues,
        { resetForm }: FormikHelpers<AddressFormValues>
    ) => {
        const updatedAddresses = selectedStore?.addresses?.map((addr: Address) => {
            return addr.storeLocationType === formData.storeLocationType
                ? { ...addr, ...formData }
                : addr;
        }) || [];

        const hasOtherAddress = updatedAddresses.some(
            (addr: Address) => addr.storeLocationType === LOCATION_TYPES.OTHER
        );
        if (!hasOtherAddress && formData.storeLocationType === LOCATION_TYPES.OTHER) {
            updatedAddresses.push({
                ...formData,
                storeLocationType: LOCATION_TYPES.OTHER,
            });
        }

        const updatedItem = {
            ...selectedStore,
            addresses: updatedAddresses,
            storeLocationType: formData.storeLocationType,
        };

        dispatch(setSelectedStore(updatedItem));
        navigation.navigate(ROUTES.CONFIRM_SHOPPING, { selectedItem: updatedItem });
        // resetForm();
    }, [selectedStore, dispatch, navigation]);

    const handleNextBtn = useCallback((handleSubmit: () => void) => {
        if (!selectedStore?.storeLocationType) { return; }

        if (isOther) {
            handleSubmit();
            return;
        }

        // For NEAREST_TO_MY_HOME or other non-OTHER types, navigate directly with current store data
        navigation.navigate(ROUTES.CONFIRM_SHOPPING, {
            selectedItem: selectedStore,
        });
    }, [selectedStore, isOther, navigation]);

    return (
        <Formik
            enableReinitialize
            onSubmit={handleFormSubmit}
            initialValues={initialValues}
            validationSchema={validationSchema}
        >
            {({
                values,
                errors,
                touched,
                handleChange,
                handleSubmit,
                setFieldTouched,
            }) => (
                <Screen initialized style={styles.container}>
                    <StackHeader
                        title="Shopping List"
                        onBack={handleGoBack}
                        onOpenDrawer={openDrawer}
                    />
                    <View style={[styles.title, { backgroundColor: theme.colors.muted }]}>
                        <Text variant="h2">Choose Grocery Store</Text>
                    </View>
                    <View style={styles.storeHeader}>
                        {selectedStore?.groceryStore?.image?.url && (
                            <DefImage
                                style={styles.storeImage}
                                src={selectedStore.groceryStore.image.url}
                            />
                        )}
                        <Text variant="h3" style={styles.storeName}>
                            {selectedStore?.groceryStore?.name}
                        </Text>
                    </View>

                    <KeyboardAwareScrollView style={styles.scrollContainer}>
                        <ScrollView>
                            <View>
                                {addresses.map((item: Address) => (
                                    <AddressItem
                                        item={item}
                                        onSelect={handleSelectAddress}
                                        key={item.id || item.storeLocationType}
                                        isSelected={selectedStore?.storeLocationType === item.storeLocationType}
                                    />
                                ))}
                            </View>
                            <View style={styles.form}>
                                {isOther && (
                                    <AddressForm
                                        values={values}
                                        disabled={false}
                                        setFieldTouched={setFieldTouched}
                                        errors={errors as Record<string, string>}
                                        touched={touched as Record<string, boolean>}
                                        handleChange={(field: string) => (text: string) => handleChange(field)(text)}
                                    />
                                )}
                            </View>
                        </ScrollView>
                    </KeyboardAwareScrollView>

                    <View style={styles.buttonControl}>
                        <Button
                            title="Back"
                            variant="secondary"
                            onPress={handleGoBack}
                            style={styles.backBtn}
                            textStyle={styles.backBtnText}
                        />
                        <Button
                            title="Next"
                            variant="primary"
                            style={styles.nextBtn}
                            textStyle={styles.nextBtnText}
                            onPress={() => handleNextBtn(handleSubmit)}
                            disabled={!selectedStore?.storeLocationType}
                        />
                    </View>
                </Screen>
            )}
        </Formik>
    );
};

export default memo(ChooseAddress);

const styles = StyleSheet.create({
    container: {
        paddingLeft: 0,
        paddingRight: 0,
    },
    title: {
        padding: 20,
    },
    storeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    storeImage: {
        width: 50,
        height: 30,
        marginLeft: 10,
    },
    storeName: {
        padding: 20,
    },
    scrollContainer: {
        flex: 1,
    },
    addressItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: COLORS.LIGHT_GREY,
    },
    addressItemSelected: {
        backgroundColor: '#E0FFD1',
    },
    addressInfo: {
        flex: 1,
    },
    locationText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    form: {
        flexGrow: 1,
        marginTop: 30,
    },
    formContainer: {
        padding: 20,
        flexGrow: 2,
    },
    formField: {
        marginTop: 10,
    },
    buttonControl: {
        flexDirection: 'row',
        width: '100%',
        paddingVertical: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.HORIZONTAL,
        borderTopWidth: 1,
        borderTopColor: COLORS.LIGHT_GREY,
    },
    backBtn: {
        flex: 1,
        marginRight: 8,
        backgroundColor: '#EBB3D1',
        borderColor: COLORS.BLACK,
        borderRadius: 30,
    },
    backBtnText: {
        color: COLORS.BLACK,
        fontSize: 24,
        fontWeight: 'bold',
    },
    nextBtn: {
        flex: 1,
        marginLeft: 8,
        backgroundColor: '#B8E6B3',
        borderColor: '#00788D',
        borderRadius: 30,
    },
    nextBtnText: {
        color: '#00788D',
        fontSize: 24,
        fontWeight: 'bold',
    },
});
