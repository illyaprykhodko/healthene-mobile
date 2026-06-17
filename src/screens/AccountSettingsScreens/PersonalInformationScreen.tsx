// outsource dependencies
import * as yup from 'yup';
import { Formik } from 'formik';
import { RootState } from 'store';
import moment from 'moment/moment';
import Toast from 'react-native-toast-message';
import React, { useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import EntypoIcon from '@react-native-vector-icons/entypo';
import { BottomSheetBackdrop, BottomSheetModal } from '@gorhom/bottom-sheet';
import { Pressable, ScrollView, StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native';

// local dependencies
import { User } from 'types';
import Text from 'components/Text.tsx';
import { filters } from 'services/filter';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import { Button } from 'components/Button.tsx';
import TextInput from 'components/TextInput.tsx';
import { setUser } from 'store/slices/appSlice.ts';
import ProfileImage from 'components/ProfileImage.tsx';
import DatePickerSelector from 'components/DatePicker.tsx';
import OptionSelector from 'components/Selector/OptionSelector.tsx';
import LoadingOverlay from 'components/LoadingOverlay.tsx';
import { getPicture, takePicture } from 'services/image-picker';
import { PREFIXES, SUFFIXES, GENDERS } from 'constants/spec.ts';
import { useUpdateUserDataMutation } from 'store/api/settingsApi.ts';

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
    // Birthday Bottom Sheet
    const [dateModalOpen, setDateModalOpen] = useState(false);

    // User Image Bottom Sheet
    const [isLoading, setIsLoading] = useState(false);
    const userImgSheetRef = useRef<BottomSheetModal>(null);
    const openUserImgBottomSheet = () => {
        userImgSheetRef.current?.present();
    };

    const handleSubmit = async (data: Partial<User>) => {
        try {
            setIsLoading(true);
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
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <>
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
                            setIsLoading(true);
                            const url = await getPicture();
                            if (url) {
                                handleChange('coverImage.url')(url);
                            }
                            setIsLoading(false);
                        };
                        const uploadCameraImage = async () => {
                            userImgSheetRef.current?.close();
                            setIsLoading(true);
                            const url = await takePicture();
                            if (url) {
                                handleChange('coverImage.url')(url);
                            }
                            setIsLoading(false);
                        };
                        return (
                            <>
                                <LoadingOverlay init={isLoading} />
                                <KeyboardAvoidingView
                                    style={styles.flex}
                                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                                    keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 100}
                                >
                                    <ScrollView style={styles.flex}>
                                        <View style={styles.imageContainer}>
                                            <Pressable style={styles.userImg} onPress={openUserImgBottomSheet}>
                                                <ProfileImage uri={values?.coverImage?.url} width={65} height={65} />
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
                                            textAlign="left"
                                            touched={touched}
                                            label="First Name"
                                            value={values.firstName}
                                            color={theme.colors.text}
                                            onChangeText={handleChange('firstName')}
                                            error={touched.firstName && errors.firstName ? { firstName: errors.firstName } : undefined}
                                        />
                                        <TextInput
                                            name="middleName"
                                            disabled={false}
                                            textAlign="left"
                                            label="Middle Name"
                                            value={values.middleName}
                                            color={theme.colors.text}
                                            onChangeText={handleChange('middleName')}
                                        />
                                        <TextInput
                                            name="lastName"
                                            disabled={false}
                                            textAlign="left"
                                            label="Last Name"
                                            touched={touched}
                                            value={values.lastName}
                                            color={theme.colors.text}
                                            onChangeText={handleChange('lastName')}
                                            error={touched.lastName && errors.lastName ? { lastName: errors.lastName } : undefined}
                                        />
                                        <OptionSelector
                                            label="Prefix"
                                            data={PREFIXES}
                                            value={values.prefix}
                                            onSelect={data => handleChange('prefix')(data?.value)}
                                        />
                                        <View style={styles.paddingVertical}>
                                            <OptionSelector
                                                label="Suffix"
                                                data={SUFFIXES}
                                                value={values.suffix}
                                                onSelect={data => handleChange('suffix')(data?.value)}
                                            />
                                        </View>
                                        <View style={styles.paddingVertical}>
                                            <Text
                                                variant="caption"
                                                color={touched?.birthday && errors?.birthday ? theme.colors.error : theme.colors.text}
                                            >
                                            Date of Birth
                                            </Text>
                                            <Pressable
                                                onPress={() => setDateModalOpen(true)}
                                                style={[
                                                    styles.currentItem,
                                                    { borderBottomColor: touched?.birthday && errors?.birthday ? theme.colors.error : theme.colors.border }
                                                ]}
                                            >
                                                <Text
                                                    color={values.birthday ? theme.colors.text : theme.colors.textSecondary}
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
                                            <OptionSelector
                                                label="Gender"
                                                data={GENDERS}
                                                value={values.gender}
                                                onSelect={data => handleChange('gender')(data?.value)}
                                            />
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
                                    ref={userImgSheetRef}
                                    enablePanDownToClose
                                    snapPoints={['25%']}
                                    enableDynamicSizing={false}
                                    backgroundStyle={{ backgroundColor: theme.colors.surface }}
                                    handleIndicatorStyle={{ backgroundColor: theme.colors.border }}
                                    backdropComponent={backdropProps => (
                                        // show overlay
                                        (<BottomSheetBackdrop
                                            {...backdropProps}
                                            opacity={0.5}
                                            appearsOnIndex={0}
                                            disappearsOnIndex={-1}
                                        />)
                                    )}>
                                    <View style={styles.userImgModal}>
                                        <Pressable onPress={() => uploadCameraImage()} style={styles.userImgOption}>
                                            <EntypoIcon style={styles.marginRight} size={20} name="camera" color={theme.colors.text} />
                                            <Text color={theme.colors.text}>Take a Photo</Text>
                                        </Pressable>
                                        <Pressable onPress={() => uploadImage()} style={styles.userImgOption}>
                                            <EntypoIcon style={styles.marginRight} size={20} name="image-inverted" color={theme.colors.text} />
                                            <Text color={theme.colors.text}>Choose Photo</Text>
                                        </Pressable>
                                    </View>
                                </BottomSheetModal>
                            </>
                        );
                    }}
                </Formik>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.VERTICAL,
    },
    flex: {
        flex: 1,
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
    currentItem: {
        borderBottomWidth: 1,
        paddingTop: OFFSET.POINT * 2,
        paddingBottom: OFFSET.POINT * 4,
    },
    paddingVertical: {
        paddingTop: OFFSET.POINT,
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
