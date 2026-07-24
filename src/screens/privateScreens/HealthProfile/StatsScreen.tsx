// outsource dependencies
import moment from 'moment';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { Pressable, StyleSheet, View, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import React, { memo, useState, useCallback, useEffect, useMemo } from 'react';

// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { useTheme } from 'hooks/useTheme';
import { Button } from 'components/Button';
import Checkbox from 'components/Checkbox';
import TextInput from 'components/TextInput';
import { Skeleton } from 'components/Skeleton';
import StackHeader from 'components/StackHeader';
import DatePickerSelector from 'components/DatePicker';
import OptionSelector from 'components/Selector/OptionSelector';

import { Habit } from 'types';
import { useAppDispatch } from 'store';
import { useGetSelfQuery, authApi } from 'store/api/authApi';
import {
    useGetHabitsQuery,
    useGetPatientHabitsQuery,
    useUpdatePatientStatsMutation,
    useUpdatePatientHabitsMutation,
} from 'store/api/healthProfileApi';

// import type { Habit } from 'types/healthProfile';
type DataType = { label: string; value: string };

const GENDER_OPTIONS: DataType[] = [
    { label: 'Male', value: 'MALE' },
    { label: 'Female', value: 'FEMALE' },
];

const PREFERRED_GENDER_OPTIONS: DataType[] = [
    { label: 'Male', value: 'MALE' },
    { label: 'Female', value: 'FEMALE' },
    { label: 'Other', value: 'OTHER' },
];

const StatsSkeleton: React.FC<{ borderColor: string }> = ({ borderColor }) => (
    <View style={styles.skeletonContainer}>
        {/* Form fields skeleton */}
        {Array.from({ length: 5 }).map((_, index) => (
            <View key={index} style={styles.skeletonField}>
                <Skeleton width="25%" height={12} borderRadius={4} style={styles.skeletonLabel} />
                <Skeleton width="100%" height={48} borderRadius={8} />
            </View>
        ))}

        <View style={{ marginTop: 10 }}>
            {Array.from({ length: 4 }).map((_, index) => (
                <View key={index} style={[styles.skeletonHabitRow, { borderBottomColor: borderColor }]}>
                    <View style={styles.skeletonCheckbox}>
                        <Skeleton width={20} height={20} borderRadius={4} />
                    </View>
                    <Skeleton width="70%" height={14} borderRadius={4} />
                </View>
            ))}
        </View>
    </View>
);

interface FormData {
    gender: string;
    birthday: string;
    heightFt: string;
    weightLb: string;
    heightInches: string;
    additionalInfo: string;
    preferredGender: string;
}

interface FormErrors {
    gender?: string;
    birthday?: string;
    heightFt?: string;
    weightLb?: string;
    heightInches?: string;
}

const DATE_FORMAT = 'YYYY-MM-DD';
const DATE_DISPLAY_FORMAT = 'MMMM DD, YYYY';

const validateForm = (values: FormData): FormErrors => {
    const errors: FormErrors = {};

    if (!values.heightFt) {
        errors.heightFt = 'Height feet is required';
    } else if (!Number.isInteger(Number(values.heightFt))) {
        errors.heightFt = 'Feet can\'t have decimals';
    } else if (Number(values.heightFt) <= 0) {
        errors.heightFt = 'Height feet should be more than 0';
    }

    if (values.heightInches && !Number.isInteger(Number(values.heightInches))) {
        errors.heightInches = 'Inches can\'t have decimals';
    } else if (Number(values.heightInches) < 0 || Number(values.heightInches) > 11) {
        errors.heightInches = 'Inches can\'t be less than 0 and greater than 11';
    }

    const decimal = String(values.weightLb).split('.')[1];
    if (!values.weightLb) {
        errors.weightLb = 'Weight is required';
    } else if (!Number(values.weightLb)) {
        errors.weightLb = 'Not a number';
    } else if (Number(values.weightLb) <= 0) {
        errors.weightLb = 'Weight should be more than 0';
    } else if (decimal?.length > 1) {
        errors.weightLb = 'Weight shouldn\'t have more 1 symbol after comma';
    }

    if (!values.gender) {
        errors.gender = 'Gender is required';
    }

    if (!values.birthday) {
        errors.birthday = 'Date of birth is required';
    } else {
        const parsed = moment(values.birthday, DATE_FORMAT, true);
        if (!parsed.isValid()) {
            errors.birthday = 'Date of birth is invalid';
        } else if (parsed.isAfter(moment(), 'day')) {
            errors.birthday = 'Date of birth can\'t be in the future';
        }
    }

    return errors;
};

const StatsScreen: React.FC = () => {
    const theme = useTheme();
    const dispatch = useAppDispatch();
    const navigation = useNavigation();

    const { data: user, isFetching: userFetching } = useGetSelfQuery();
    const { data: allHabits = [], isFetching: habitsFetching } = useGetHabitsQuery();
    const { data: patientHabits = [], isFetching: patientHabitsFetching } = useGetPatientHabitsQuery();

    const [updateStats, { isLoading: isUpdatingStats }] = useUpdatePatientStatsMutation();
    const [updateHabits, { isLoading: isUpdatingHabits }] = useUpdatePatientHabitsMutation();

    const initialized = !userFetching && !habitsFetching && !patientHabitsFetching;
    const isSubmitting = isUpdatingStats || isUpdatingHabits;

    const [formData, setFormData] = useState<FormData>({
        gender: '',
        birthday: '',
        weightLb: '',
        heightFt: '',
        heightInches: '',
        additionalInfo: '',
        preferredGender: '',
    });

    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [dateModalOpen, setDateModalOpen] = useState(false);
    const [selectedHabits, setSelectedHabits] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (user) {
            const userData = user as any;
            const birthdayMoment = userData.birthday ? moment(userData.birthday) : null;
            setFormData({
                gender: userData.gender ?? '',
                heightFt: userData.heightFt?.toString() ?? '',
                weightLb: userData.weightLb?.toString() ?? '',
                heightInches: userData.heightInches?.toString() ?? '',
                additionalInfo: userData.patientPreferredGender?.additionalInfo ?? '',
                preferredGender: userData.patientPreferredGender?.preferredGender ?? '',
                birthday: birthdayMoment?.isValid() ? birthdayMoment.format(DATE_FORMAT) : '',
            });
        }
    }, [user]);

    useEffect(() => {
        if (patientHabits.length > 0) {
            const habitIds = new Set(patientHabits.map(h => h.habit.id));
            setSelectedHabits(habitIds);
        }
    }, [patientHabits]);

    const errors = useMemo(() => validateForm(formData), [formData]);
    const isValid = Object.keys(errors).length === 0;

    const handleFieldChange = useCallback((field: keyof FormData) => (value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setTouched(prev => ({ ...prev, [field]: true }));
    }, []);

    const handleGenderSelect = useCallback((item: DataType) => {
        setFormData(prev => ({ ...prev, gender: item.value }));
        setTouched(prev => ({ ...prev, gender: true }));
    }, []);

    const handlePreferredGenderSelect = useCallback((item: DataType) => {
        setFormData(prev => ({ ...prev, preferredGender: item.value }));
        setTouched(prev => ({ ...prev, preferredGender: true }));
    }, []);

    const handleBirthdaySelect = useCallback((value: string) => {
        setFormData(prev => ({ ...prev, birthday: value }));
        setTouched(prev => ({ ...prev, birthday: true }));
    }, []);

    const handleHabitToggle = useCallback((habitId: number) => {
        setSelectedHabits(prev => {
            const next = new Set(prev);
            if (next.has(habitId)) {
                next.delete(habitId);
            } else {
                next.add(habitId);
            }
            return next;
        });
    }, []);

    const handleSubmit = useCallback(async () => {
        if (!isValid || isSubmitting) { return; }

        try {
            await updateStats({
                birthday: formData.birthday,
                weightLb: Number(formData.weightLb),
                heightFt: Number(formData.heightFt),
                gender: formData.gender as 'MALE' | 'FEMALE',
                heightInches: Number(formData.heightInches) || 0,
                patientPreferredGender: formData.preferredGender ? {
                    preferredGender: formData.preferredGender as 'MALE' | 'FEMALE' | 'OTHER',
                    additionalInfo: formData.preferredGender === 'OTHER' ? formData.additionalInfo : undefined,
                } : undefined,
            }).unwrap();
            Toast.show({
                type: 'success',
                text1: 'My Stats',
                text2: 'Your changes were saved successfully',
            });

            const habitsData = Array.from(selectedHabits).map(id => ({ entity: { id } }));
            await updateHabits(habitsData).unwrap();

            dispatch(authApi.util.invalidateTags(['Auth']));

            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', 'Failed to update information. Please try again.');
        }
    }, [formData, selectedHabits, isValid, isSubmitting, updateStats, updateHabits, dispatch, navigation]);

    const visibleHabits = useMemo(() => {
        return allHabits.filter((habit: Habit) => {
            if (habit.group === 'ALL') { return true; }
            return habit.group === formData.gender;
        });
    }, [allHabits, formData.gender]);

    if (!initialized) {
        return (
            <Screen initialized style={styles.container}>
                <StackHeader
                    title="My Stats"
                    onBack={() => navigation.goBack()}
                    onOpenDrawer={() => (navigation as any).openDrawer?.()}
                />
                <View style={styles.scrollContent}>
                    <StatsSkeleton borderColor={theme.colors.border} />
                </View>
                <View style={[styles.submitBtnContainer, { backgroundColor: theme.colors.background }]}>
                    <Skeleton width="100%" height={50} borderRadius={8} />
                </View>
            </Screen>
        );
    }

    return (
        <Screen initialized style={styles.container}>
            <StackHeader
                title="My Stats"
                onBack={() => navigation.goBack()}
                onOpenDrawer={() => (navigation as any).openDrawer?.()}
            />
            <View style={styles.scrollContent}>
                <KeyboardAwareScrollView contentContainerStyle={styles.wrapper}>
                    <View style={styles.offset}>
                        <View style={styles.row}>
                            <Text
                                variant="caption"
                                color={touched.birthday && errors.birthday ? theme.colors.error : theme.colors.text}
                            >
                                Age
                            </Text>
                            <Pressable
                                disabled={isSubmitting}
                                onPress={() => setDateModalOpen(true)}
                                style={[
                                    styles.dateField,
                                    { borderBottomColor: touched.birthday && errors.birthday ? theme.colors.error : theme.colors.border },
                                ]}
                            >
                                <Text color={formData.birthday ? theme.colors.text : theme.colors.grey}>
                                    {formData.birthday
                                        ? moment(formData.birthday, DATE_FORMAT).format(DATE_DISPLAY_FORMAT)
                                        : 'Select date of birth'}
                                </Text>
                            </Pressable>
                            {(touched.birthday && errors.birthday)
                                && <Text variant="caption" color={theme.colors.error} style={styles.dateError}>
                                    {errors.birthday}
                                </Text>
                            }
                        </View>

                        <View style={styles.row}>
                            <TextInput
                                name="heightFt"
                                textAlign="right"
                                label="Height (ft)"
                                disabled={isSubmitting}
                                value={formData.heightFt}
                                error={{ heightFt: errors.heightFt }}
                                touched={{ heightFt: touched.heightFt }}
                                onChangeText={handleFieldChange('heightFt')}
                            />
                        </View>

                        <View style={styles.row}>
                            <TextInput
                                textAlign="right"
                                name="heightInches"
                                label="Height (in)"
                                disabled={isSubmitting}
                                value={formData.heightInches}
                                error={{ heightInches: errors.heightInches }}
                                touched={{ heightInches: touched.heightInches }}
                                onChangeText={handleFieldChange('heightInches')}
                            />
                        </View>

                        <View style={styles.row}>
                            <TextInput
                                name="weightLb"
                                label="Weight (lb)"
                                textAlign="right"
                                disabled={isSubmitting}
                                value={formData.weightLb}
                                error={{ weightLb: errors.weightLb }}
                                touched={{ weightLb: touched.weightLb }}
                                onChangeText={handleFieldChange('weightLb')}
                            />
                        </View>

                        <View style={styles.row}>
                            <OptionSelector
                                label="Gender"
                                data={GENDER_OPTIONS}
                                value={formData.gender}
                                touched={touched.gender}
                                errorText={errors.gender}
                                onSelect={handleGenderSelect}
                            />
                        </View>

                        <View style={styles.row}>
                            <OptionSelector
                                label="Preferred Gender"
                                data={PREFERRED_GENDER_OPTIONS}
                                value={formData.preferredGender}
                                onSelect={handlePreferredGenderSelect}
                            />
                        </View>

                        {formData.preferredGender === 'OTHER' && (
                            <View style={styles.row}>
                                <TextInput
                                    label="Other"
                                    textAlign="right"
                                    name="additionalInfo"
                                    disabled={isSubmitting}
                                    value={formData.additionalInfo}
                                    onChangeText={handleFieldChange('additionalInfo')}
                                />
                            </View>
                        )}
                    </View>
                    {formData.gender && visibleHabits.length > 0 && (
                        <View style={styles.offset}>
                            <View style={styles.habitsSection}>
                                {visibleHabits.map((habit: Habit) => (
                                    <View
                                        key={habit.id}
                                        style={[styles.habitRow, { borderBottomColor: theme.colors.border }]}
                                    >
                                        <View style={styles.habitCheckbox}>
                                            <Checkbox
                                                value={selectedHabits.has(habit.id)}
                                                onChange={() => handleHabitToggle(habit.id)}
                                                editable={!isSubmitting}
                                            />
                                        </View>
                                        <Text style={[styles.habitName, { color: theme.colors.text }]}>
                                            {habit.name}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </KeyboardAwareScrollView>
            </View>
            <View style={[styles.submitBtnContainer, { backgroundColor: theme.colors.background }]}>
                <Button
                    variant="success"
                    disabled={!isValid}
                    onPress={handleSubmit}
                    title="SAVE INFORMATION"
                />
            </View>
            <DatePickerSelector
                modalOpened={dateModalOpen}
                onSelect={handleBirthdaySelect}
                currentDate={formData.birthday || null}
                onCancel={() => setDateModalOpen(false)}
            />
        </Screen>
    );
};

export default memo(StatsScreen);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingLeft: 0,
        paddingRight: 0,
    },
    scrollContent: {
        flex: 1,
    },
    wrapper: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    offset: {
        paddingLeft: 20,
        paddingRight: 20,
    },
    row: {
        marginBottom: 12,
    },
    dateField: {
        borderBottomWidth: 1,
        paddingTop: 8,
        paddingBottom: 12,
    },
    dateError: {
        marginTop: 4,
    },
    habitsSection: {
        marginTop: 20,
    },
    habitsSectionTitle: {
        fontSize: 16,
        marginBottom: 12,
    },
    habitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
    },
    habitCheckbox: {
        marginRight: 12,
    },
    habitName: {
        flex: 1,
        fontSize: 14,
    },
    submitBtnContainer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: 30,
    },
    // Skeleton styles
    skeletonContainer: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    skeletonField: {
        marginBottom: 20,
    },
    skeletonLabel: {
        marginBottom: 8,
    },
    skeletonHabitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    skeletonCheckbox: {
        marginRight: 12,
    },
});
