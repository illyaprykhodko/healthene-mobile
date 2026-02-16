// // outsource dependencies
// import * as yup from 'yup';
// import { Formik } from 'formik';
// import { useDispatch } from 'react-redux';
// import Toast from 'react-native-toast-message';
// import { StyleSheet, View } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import React, { useCallback, useMemo, useState } from 'react';
// import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// // local dependencies
// import { User } from 'types';
// import Screen from 'components/Screen.tsx';
// import { useTheme } from 'hooks/useTheme.ts';
// import { OFFSET } from 'constants/offset.ts';
// import { Stats } from 'types/healthProfile.ts';
// import { Button } from 'components/Button.tsx';
// import TextInput from 'components/TextInput.tsx';
// import { RootState, useAppSelector } from 'store';
// import { setUser } from 'store/slices/appSlice.ts';
// import { RootStackParamList } from 'services/navigation';
// import LoadingOverlay from 'components/LoadingOverlay.tsx';
// import OptionSelector from 'components/Selector/OptionSelector.tsx';
// import { useUpdateUserDataMutation } from 'store/api/settingsApi.ts';
// import { GENDERS, PREFERRED_GENDER, PREFERRED_GENDER_OPTIONS } from 'constants/spec.ts';

// const validationSchema = yup.object().shape({
//     gender: yup.string().required('Gender is required'),
//     heightFt: yup.string().required('Height (ft) is required'),
//     weightLb: yup.string().required('Weight (lb) is required'),
//     heightInches: yup.string().required('Height (in) is required'),
//     patientPreferredGender: yup.string().nullable(),
//     additionalInfo: yup.string().when('patientPreferredGender', {
//         is: PREFERRED_GENDER.OTHER,
//         then: schema => schema.required('Please specify preferred gender'),
//         otherwise: schema => schema.notRequired(),
//     }),
// });

// const ProfileStatsScreen = () => {
//     const dispatch = useDispatch();
//     const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
//     const theme = useTheme();
//     const styles = useMemo(() => createStyles(theme), [theme]);
//     const user = useAppSelector((state: RootState) => state.app.user);
//     const [updateUserData] = useUpdateUserDataMutation();
//     const [preloader, setPreloader] = useState<boolean>(false);
//     const handleSubmit = useCallback(async (data: Stats) => {
//         try {
//             setPreloader(true);
//             const {
//                 additionalInfo,
//                 patientPreferredGender,
//                 ...rest
//             } = data;

//             const prepareData: Partial<User> = {
//                 ...rest,
//             };

//             if (user?.patientPreferredGender) {
//                 if (data.patientPreferredGender === PREFERRED_GENDER.OTHER && data?.additionalInfo) {
//                     prepareData.patientPreferredGender = {
//                         additionalInfo: additionalInfo,
//                         preferredGender: patientPreferredGender,
//                     };
//                 } else {
//                     prepareData.patientPreferredGender = {
//                         ...user.patientPreferredGender,
//                         preferredGender: patientPreferredGender,
//                     };
//                 }
//             }
//             const submit = await updateUserData(prepareData).unwrap();
//             dispatch(setUser(submit));
//             Toast.show({
//                 type: 'success',
//                 text1: 'Profile updated',
//                 text2: 'Your health information has been saved successfully.',
//             });
//             navigation.goBack();
//         } catch (error: any) {
//             Toast.show({
//                 type: 'error',
//                 text1: 'Profile update failed',
//                 text2: 'We couldn’t save your health profile. Please try again.',
//             });
//         } finally {
//             setPreloader(false);
//         }
//     }, [user?.patientPreferredGender]);

//     return <>
//         <LoadingOverlay init={preloader} />
//         <Screen initialized={true} style={styles.container}>
//             <Formik<Stats>
//                 enableReinitialize
//                 onSubmit={handleSubmit}
//                 validationSchema={validationSchema}
//                 initialValues={{
//                     gender: user?.gender,
//                     heightFt: user?.heightFt ?? 0,
//                     weightLb: user?.weightLb ?? 0,
//                     heightInches: user?.heightInches ?? 0,
//                     additionalInfo: user?.patientPreferredGender.additionalInfo ?? '',
//                     patientPreferredGender: user?.patientPreferredGender.preferredGender ?? '',
//                 }}
//             >
//                 {({ values, errors, touched, handleChange, handleSubmit }) => {
//                     return <View>
//                         <TextInput
//                             name="heightFt"
//                             disabled={false}
//                             textAlign="left"
//                             touched={touched}
//                             label="Height (ft)"
//                             keyboardType="numeric"
//                             color={theme.colors.black}
//                             value={values.heightFt.toString()}
//                             onChangeText={handleChange('heightFt')}
//                             error={touched.heightFt && errors.heightFt ? { heightFt: errors.heightFt } : undefined}
//                         />
//                         <TextInput
//                             disabled={false}
//                             textAlign="left"
//                             touched={touched}
//                             name="heightInches"
//                             label="Height (in)"
//                             keyboardType="numeric"
//                             color={theme.colors.black}
//                             value={values.heightInches.toString()}
//                             onChangeText={handleChange('heightInches')}
//                             error={touched.heightInches && errors.heightInches ? { heightInches: errors.heightInches } : undefined}
//                         />
//                         <TextInput
//                             name="weightLb"
//                             disabled={false}
//                             textAlign="left"
//                             touched={touched}
//                             label="Weight (lb)"
//                             keyboardType="numeric"
//                             color={theme.colors.black}
//                             value={values.weightLb.toString()}
//                             onChangeText={handleChange('weightLb')}
//                             error={touched.weightLb && errors.weightLb ? { weightLb: errors.weightLb } : undefined}
//                         />
//                         <OptionSelector
//                             label="Gender"
//                             data={GENDERS}
//                             style={styles.select}
//                             value={values.gender}
//                             onSelect={data => handleChange('gender')(data?.value)}
//                         />
//                         <OptionSelector
//                             style={styles.select}
//                             label="Preffered Gender"
//                             data={PREFERRED_GENDER_OPTIONS}
//                             value={values.patientPreferredGender}
//                             onSelect={data => handleChange('patientPreferredGender')(data?.value)}
//                         />
//                         {values.patientPreferredGender === PREFERRED_GENDER.OTHER && <TextInput
//                             label="Other"
//                             disabled={false}
//                             textAlign="left"
//                             touched={touched}
//                             name="additionalInfo"
//                             color={theme.colors.black}
//                             value={values.additionalInfo ?? ''}
//                             onChangeText={handleChange('additionalInfo')}
//                             error={touched.additionalInfo && errors.additionalInfo ? { additionalInfo: errors.additionalInfo } : undefined}
//                         />}
//                         <Button
//                             variant="outline"
//                             onPress={handleSubmit}
//                             title="SAVE INFORMATION"
//                             style={styles.submitBtn}
//                         />
//                     </View>;
//                 }}
//             </Formik>
//         </Screen>
//     </>;
// };

// export default ProfileStatsScreen;

// const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
//     container: {
//         paddingHorizontal: OFFSET.HORIZONTAL,
//         paddingVertical: OFFSET.VERTICAL,
//         backgroundColor: theme.colors.background,
//     },
//     select: {
//         marginBottom: OFFSET.POINT * 4
//     },
//     submitBtn: {
//         marginVertical: OFFSET.VERTICAL,
//     }
// });

