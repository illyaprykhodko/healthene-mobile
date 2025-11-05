// outsource dependencies
import * as yup from 'yup';
import { Formik } from 'formik';
import { RootState } from 'store';
import moment from 'moment/moment';
import Toast from 'react-native-toast-message';
import React, { useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import EntypoIcon from 'react-native-vector-icons/Entypo';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { BottomSheetBackdrop, BottomSheetModal } from '@gorhom/bottom-sheet';
import { Image, Pressable, ScrollView, StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native';

// local dependencies
import { User } from 'types';
import Text from 'components/Text.tsx';
import { filters } from 'services/filter';
import Select from 'components/Select.tsx';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import { Button } from 'components/Button.tsx';
import TextInput from 'components/TextInput.tsx';
import { setUser } from 'store/slices/appSlice.ts';
import DatePickerSelector from 'components/DatePicker.tsx';
import { getPicture, takePicture } from 'services/image-picker';
import { PREFIXES, SUFFIXES, GENDERS } from 'constants/spec.ts';
import { useUpdateUserDataMutation } from 'store/api/settingsApi.ts';

const SELECTS = {
    GENDER: 'GENDER',
    PREFIXES: 'PREFIXES',
    SUFFIXES: 'SUFFIXES',
    DATE_OF_BIRTH: 'DATE_OF_BIRTH',
} as const;
type SelectsValue = keyof typeof SELECTS;

const validationSchema = yup.object().shape({
    firstName: yup.string()
        .required('First name is required'),
    lastName: yup.string()
        .required('Last name is required'),
    birthday: yup.string()
        .required('Birthday is required'),
    gender: yup.string()
        .required('Gender is required'),
});

export const PersonalInformationScreen = () => {
    const theme = useTheme();
    const dispatch = useDispatch();
    const [updateUserData] = useUpdateUserDataMutation();
    const user = useSelector((state: RootState) => state.app.user);

    // Field Bottom Sheet
    const [dateModalOpen, setDateModalOpen] = useState(false);
    const [select, setSelect] = useState<SelectsValue | null>(null);
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const openBottomSheet = (select: SelectsValue) => {
        setSelect(select);
        bottomSheetRef.current?.present();
    };

    // User Image Bottom Sheet
    const [isImgLoading, setIsImgLoading] = useState(false);
    const userImgSheetRef = useRef<BottomSheetModal>(null);
    const openUserImgBottomSheet = () => {
        userImgSheetRef.current?.present();
    };

    const handleSubmit = async (data: Partial<User>) => {
        try {
            const submit = await updateUserData(data).unwrap();
            dispatch(setUser(submit));
            Toast.show({
                type: 'success',
                text1: 'Profile updated',
                text2: 'Your personal information has been successfully updated.',
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
        <View style={styles.container}>
            <Formik
                onSubmit={handleSubmit}
                validationSchema={validationSchema}
                initialValues={{
                    prefix: user?.prefix,
                    suffix: user?.suffix,
                    gender: user?.gender,
                    birthday: user?.birthday,
                    lastName: user?.lastName,
                    firstName: user?.firstName,
                    middleName: user?.middleName,
                    coverImage: user?.coverImage
                }}
            >
                {({ values, errors, touched, handleChange, handleSubmit, dirty }) => {
                    const uploadImage = async () => {
                        userImgSheetRef.current?.close();
                        setIsImgLoading(true);
                        const url = await getPicture();
                        if (url) {
                            handleChange('coverImage.url')(url);
                        }
                        setIsImgLoading(false);
                    };
                    const uploadCameraImage = async () => {
                        userImgSheetRef.current?.close();
                        setIsImgLoading(true);
                        const url = await takePicture();
                        if (url) {
                            handleChange('coverImage.url')(url);
                        }
                        setIsImgLoading(false);
                    };
                    return <>
                        <KeyboardAvoidingView
                            style={styles.flex}
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 100}
                        >
                            <ScrollView style={styles.flex}>
                                <View style={styles.imageContainer}>
                                    <Pressable style={styles.userImg} onPress={openUserImgBottomSheet}>
                                        {values?.coverImage?.url
                                            ? <Image source={{ uri: values?.coverImage.url }} width={65} height={65} />
                                            : <FeatherIcon size={65} name="user"/>
                                        }
                                    </Pressable>
                                    <View style={styles.flexShrink}>
                                        <Text color={theme.colors.primary}>Profile Picture</Text>
                                        <Text variant="caption" color={theme.colors.grey}>
                                        This photo is used for your profile and appears in places where you check in.
                                        </Text>
                                    </View>
                                </View>
                                <TextInput
                                    name="firstName"
                                    disabled={false}
                                    touched={touched}
                                    label="First Name"
                                    value={values.firstName}
                                    onChangeText={handleChange('firstName')}
                                    inputStyle={{ ...styles.inputStyle, color: theme.colors.black }}
                                    error={touched.firstName && errors.firstName ? { firstName: errors.firstName } : undefined}
                                />
                                <TextInput
                                    name="middleName"
                                    disabled={false}
                                    label="Middle Name"
                                    value={values.middleName}
                                    onChangeText={handleChange('middleName')}
                                    inputStyle={{ ...styles.inputStyle, color: theme.colors.black }}
                                />
                                <TextInput
                                    name="lastName"
                                    disabled={false}
                                    label="Last Name"
                                    touched={touched}
                                    value={values.lastName}
                                    onChangeText={handleChange('lastName')}
                                    inputStyle={{ ...styles.inputStyle, color: theme.colors.black }}
                                    error={touched.lastName && errors.lastName ? { lastName: errors.lastName } : undefined}
                                />
                                <View>
                                    <Text variant="caption">Prefix</Text>
                                    <Pressable
                                        onPress={() => openBottomSheet(SELECTS.PREFIXES)}
                                        style={[styles.currentItem, { borderBottomColor: theme.colors.grey }]}
                                    >
                                        <Text
                                            color={values.prefix ? theme.colors.black : theme.colors.grey}
                                        >
                                            {values.prefix ? values.prefix : 'Select prefix'}
                                        </Text>
                                    </Pressable>
                                </View>
                                <View style={styles.paddingVertical}>
                                    <Text variant="caption">Suffix</Text>
                                    <Pressable
                                        onPress={() => openBottomSheet(SELECTS.SUFFIXES)}
                                        style={[styles.currentItem, { borderBottomColor: theme.colors.grey }]}
                                    >
                                        <Text
                                            color={values.suffix ? theme.colors.black : theme.colors.grey}
                                        >
                                            {values.suffix ? values.suffix : 'Select suffix'}
                                        </Text>
                                    </Pressable>
                                </View>
                                <View style={styles.paddingVertical}>
                                    <Text
                                        variant="caption"
                                        color={touched?.birthday && errors?.birthday ? theme.colors.error : theme.colors.black}
                                    >
                                    Date of Birth
                                    </Text>
                                    <Pressable
                                        onPress={() => setDateModalOpen(true)}
                                        style={[
                                            styles.currentItem,
                                            { borderBottomColor: touched?.birthday && errors?.birthday ? theme.colors.error : theme.colors.grey }
                                        ]}
                                    >
                                        <Text
                                            color={values.birthday ? theme.colors.black : theme.colors.grey}
                                        >
                                            {values.birthday ? moment(values.birthday).format('YYYY-MM-DD') : 'Select birthday'}
                                        </Text>
                                    </Pressable>
                                </View>
                                <DatePickerSelector
                                    modalOpened={dateModalOpen}
                                    onCancel={() => setDateModalOpen(false)}
                                    onSelect={(value: string) => handleChange('birthday')(value)}
                                    currentDate={values?.birthday ? values.birthday.toString() : new Date().toString()}
                                />
                                <View style={styles.paddingVertical}>
                                    <Text
                                        variant="caption"
                                        color={touched?.gender && errors?.gender ? theme.colors.error : theme.colors.black}
                                    >
                                    Gender
                                    </Text>
                                    <Pressable
                                        onPress={() => openBottomSheet(SELECTS.GENDER)}
                                        style={[
                                            styles.currentItem,
                                            { borderBottomColor: touched?.gender && errors?.gender ? theme.colors.error : theme.colors.grey }
                                        ]}
                                    >
                                        <Text
                                            color={values.gender ? theme.colors.black : theme.colors.grey}
                                        >
                                            {values.gender ? filters.humanize(values.gender) : 'Select gender'}
                                        </Text>
                                    </Pressable>
                                </View>
                            </ScrollView>
                        </KeyboardAvoidingView>
                        <Button
                            disabled={!dirty}
                            variant="outline"
                            onPress={handleSubmit}
                            title="Update Information"
                            style={styles.updateBtn}
                        />
                        <BottomSheetModal
                            ref={bottomSheetRef}
                            enablePanDownToClose
                            snapPoints={['35%']}
                            enableDynamicSizing={false}
                            backdropComponent={backdropProps => (
                                // show overlay
                                <BottomSheetBackdrop
                                    {...backdropProps}
                                    opacity={0.5}
                                    appearsOnIndex={0}
                                    disappearsOnIndex={-1}
                                />
                            )}>
                            {(() => {
                                switch (select) {
                                    case SELECTS.PREFIXES:
                                        return (
                                            <Select
                                                data={PREFIXES}
                                                currentValue={user?.prefix}
                                                onSelect={value => handleChange('prefix')(value)}
                                            />
                                        );
                                    case SELECTS.SUFFIXES:
                                        return (
                                            <Select
                                                data={SUFFIXES}
                                                currentValue={user?.suffix}
                                                onSelect={value => handleChange('suffix')(value)}
                                            />
                                        );
                                    case SELECTS.GENDER:
                                        return (
                                            <Select
                                                data={GENDERS}
                                                currentValue={user?.gender}
                                                onSelect={value => {
                                                    handleChange('gender')(value);
                                                }}
                                            />
                                        );
                                    default:
                                        return null;
                                }
                            })()}
                        </BottomSheetModal>
                        <BottomSheetModal
                            ref={userImgSheetRef}
                            enablePanDownToClose
                            snapPoints={['25%']}
                            enableDynamicSizing={false}
                            backdropComponent={backdropProps => (
                                // show overlay
                                <BottomSheetBackdrop
                                    {...backdropProps}
                                    opacity={0.5}
                                    appearsOnIndex={0}
                                    disappearsOnIndex={-1}
                                />
                            )}>
                            <View style={styles.userImgModal}>
                                <Pressable onPress={() => uploadCameraImage()} style={styles.userImgOption}>
                                    <EntypoIcon style={styles.marginRight} size={20} name="camera" />
                                    <Text>Take a Photo</Text>
                                </Pressable>
                                <Pressable onPress={() => uploadImage()} style={styles.userImgOption}>
                                    <EntypoIcon style={styles.marginRight} size={20} name="image-inverted" />
                                    <Text>Choose Photo</Text>
                                </Pressable>
                            </View>
                        </BottomSheetModal>
                    </>;
                }}
            </Formik>
        </View>
    </>;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.VERTICAL,
    },
    flex: {
        flex: 1
    },
    flexShrink: {
        flexShrink: 1
    },
    imageContainer: {
        flexDirection: 'row',
        marginBottom: OFFSET.POINT * 4,
    },
    userImg: {
        marginRight: OFFSET.POINT * 2,
        borderWidth: 1,
        borderRadius: 65/2,
        overflow: 'hidden',
    },
    inputStyle: {
        textAlign: 'left',
    },
    currentItem: {
        borderBottomWidth: 1,
        paddingTop: OFFSET.POINT * 2,
        paddingBottom: OFFSET.POINT * 4,
    },
    paddingVertical: {
        paddingTop: OFFSET.POINT * 4,
    },
    updateBtn: {
        marginTop: 'auto'
    },
    userImgModal: {
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    userImgOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: OFFSET.VERTICAL
    },
    marginRight: {
        marginRight: OFFSET.POINT * 4
    }
});
