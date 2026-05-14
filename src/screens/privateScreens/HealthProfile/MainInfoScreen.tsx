// outsource dependencies
import moment from 'moment';
import React, { memo, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, View, ScrollView } from 'react-native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';

// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { ROUTES } from 'constants/routes';
import { useTheme } from 'hooks/useTheme';
import DefImage from 'components/DefImage';
import ProfileRow from 'components/ProfileRow';
import ProfileCard from 'components/ProfileCard';
import { useGetSelfQuery } from 'store/api/authApi';
import {
    useGetPatientMedicationsQuery,
    useGetPatientMedicalProblemsQuery,
    useGetPatientMedicationAllergiesQuery,
} from 'store/api/healthProfileApi';

// Helper to humanize text
const humanize = (text: string | undefined | null): string => {
    if (!text) { return '-'; }
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

// Helper to round digits
const roundDigits = (value: number | undefined | null, digits: number): string => {
    if (value === undefined || value === null) { return '-'; }
    return value.toFixed(digits);
};

// Configure
const timeFormatInput = 'YYYY-MM-DD';
const timeFormatOutput = 'MMMM DD, YYYY';

const MainInfoScreen: React.FC = () => {
    const theme = useTheme();
    const navigation = useNavigation<DrawerNavigationProp<any>>();

    const { data: user, isFetching: userFetching } = useGetSelfQuery();
    const { data: medications = [], isFetching: medicationsFetching } = useGetPatientMedicationsQuery();
    const { data: medicalProblems = [], isFetching: problemsFetching } = useGetPatientMedicalProblemsQuery();
    const { data: medicationAllergies = [], isFetching: allergiesFetching } = useGetPatientMedicationAllergiesQuery();

    const initialized = !userFetching && !medicationsFetching && !problemsFetching && !allergiesFetching;

    const navigateToStats = useCallback(() => {
        navigation.navigate(ROUTES.HEALTH_PROFILE_STATS);
    }, [navigation]);

    const navigateToMedications = useCallback(() => {
        navigation.navigate(ROUTES.HEALTH_PROFILE_MEDICATIONS);
    }, [navigation]);

    const navigateToMedicalProblems = useCallback(() => {
        navigation.navigate(ROUTES.HEALTH_PROFILE_MEDICAL_PROBLEMS);
    }, [navigation]);

    const navigateToMedicationAllergies = useCallback(() => {
        navigation.navigate(ROUTES.HEALTH_PROFILE_MEDICATION_ALLERGIES);
    }, [navigation]);

    const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown' : 'Unknown';
    const goal = (user as any)?.plan?.goal;
    const physicianName = user?.physician?.name || 'Not Specified Yet';
    const heightFt = (user as any)?.heightFt ?? 0;
    const heightInches = (user as any)?.heightInches ?? 0;
    const weightLb = (user as any)?.weightLb;
    const gender = (user as any)?.gender;
    const bmi = (user as any)?.bmi;
    const preferredGender = (user as any)?.patientPreferredGender;
    const birthday = moment((user as any)?.birthday, timeFormatInput);

    const formatHeight = (): string => `${heightFt} ft  ${heightInches} in`;
    const formatWeight = (): string => (weightLb ? `${roundDigits(weightLb, 1)} lb` : '-');
    const formatGender = (): string => humanize(gender);
    const formatBmi = (): string => (bmi ? roundDigits(bmi, 0) : '-');
    const formatDOB = (): string => `${birthday.format(timeFormatOutput)} (age ${moment().diff(birthday, 'years')})`;

    const formatPreferredGender = (): string => {
        if (!preferredGender?.preferredGender) { return '-'; }
        if (preferredGender.preferredGender === 'OTHER') {
            return preferredGender.additionalInfo || '-';
        }
        return humanize(preferredGender.preferredGender);
    };

    return (
        <Screen initialized={initialized} style={styles.container}>
            <ScrollView contentContainerStyle={styles.wrapper}>
                <DefImage
                    style={styles.image}
                    src={user?.coverImage?.url}
                />
                <Text variant="bold" textAlign="center" style={styles.nameText}>
                    {userName}
                </Text>

                {goal && (
                    <Text style={styles.goalText} textAlign="center">
                        <Text variant="bold" color={theme.colors.darkGrey}>Goal: </Text>
                        <Text>{goal}</Text>
                    </Text>
                )}

                <Text style={styles.physicianText} textAlign="center">
                    <Text variant="bold" color={theme.colors.text}>Physician: </Text>
                    <Text>{physicianName}</Text>
                </Text>

                <ProfileCard title="My Stats" onEdit={navigateToStats}>
                    <ProfileRow label="Age" value={formatDOB()} />
                    <ProfileRow label="Height" value={formatHeight()} />
                    <ProfileRow label="Weight" value={formatWeight()} />
                    <ProfileRow label="Gender" value={formatGender()} />
                    {preferredGender?.preferredGender !== 'OTHER' && (
                        <ProfileRow label="Preferred Gender" value={formatPreferredGender()} />
                    )}
                    {preferredGender?.preferredGender === 'OTHER' && (
                        <ProfileRow label="Preferred Gender" value={formatPreferredGender()} />
                    )}
                    <ProfileRow label="My BMI (Calculated)" value={formatBmi()} hideDivider />
                </ProfileCard>

                <ProfileCard title="Medication Allergies" onEdit={navigateToMedicationAllergies}>
                    {medicationAllergies.length > 0 ? (
                        medicationAllergies.map((item, index) => (
                            <View
                                key={item.id}
                                style={[
                                    styles.problemItem,
                                    { borderBottomColor: index === medicationAllergies.length - 1 ? 'transparent' : theme.colors.border },
                                ]}
                            >
                                <Text color={theme.colors.darkGrey}>{item.medicalTerm?.name}</Text>
                            </View>
                        ))
                    ) : (
                        <Text textAlign="center" color={theme.colors.text} style={styles.emptyText}>
                            No known Medication Allergies
                        </Text>
                    )}
                </ProfileCard>

                <ProfileCard title="Medical Problems" onEdit={navigateToMedicalProblems}>
                    {medicalProblems.length > 0 ? (
                        medicalProblems.map((item, index) => (
                            <View
                                key={item.id}
                                style={[
                                    styles.problemItem,
                                    { borderBottomColor: index === medicalProblems.length - 1 ? 'transparent' : theme.colors.border },
                                ]}
                            >
                                <Text color={theme.colors.darkGrey}>{item.medicalTerm?.name}</Text>
                            </View>
                        ))
                    ) : (
                        <Text textAlign="center" color={theme.colors.text} style={styles.emptyText}>
                            No known Medical Problems
                        </Text>
                    )}
                </ProfileCard>

                <ProfileCard title="Medications" onEdit={navigateToMedications}>
                    {medications.length > 0 ? (
                        medications.map((item, index) => (
                            <View
                                key={item.id}
                                style={[
                                    styles.medicationItem,
                                    { borderBottomColor: index === medications.length - 1 ? 'transparent' : theme.colors.border },
                                ]}
                            >
                                <Text color={theme.colors.darkGrey}>{item.medication?.name}</Text>
                            </View>
                        ))
                    ) : (
                        <Text textAlign="center" color={theme.colors.text} style={styles.emptyText}>
                            No known Medications
                        </Text>
                    )}
                </ProfileCard>
            </ScrollView>
        </Screen>
    );
};

export default memo(MainInfoScreen);

const styles = StyleSheet.create({
    container: {
        paddingLeft: 0,
        paddingRight: 0,
    },
    wrapper: {
        paddingTop: 25,
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: 30,
    },
    image: {
        width: 65,
        height: 65,
        borderRadius: 32.5,
        alignSelf: 'center',
        marginBottom: 16,
    },
    nameText: {
        fontSize: 14,
        marginBottom: 16,
    },
    goalText: {
        marginBottom: 16,
    },
    physicianText: {
        marginBottom: 16,
        textDecorationLine: 'underline',
    },
    problemItem: {
        paddingVertical: 12,
        paddingHorizontal: 0,
        borderBottomWidth: 1,
    },
    medicationItem: {
        paddingVertical: 12,
        paddingHorizontal: 0,
        borderBottomWidth: 1,
    },
    emptyText: {
        paddingTop: 8,
    },
});
