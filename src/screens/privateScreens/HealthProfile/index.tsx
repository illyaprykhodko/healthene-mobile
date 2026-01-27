// outsource dependencies
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { ScrollView, StyleSheet } from 'react-native';

// local dependencies
import { RootState } from 'store';
import Text from 'components/Text.tsx';
import Screen from 'components/Screen.tsx';
import { OFFSET } from 'constants/offset.ts';
import { useTheme } from 'hooks/useTheme.ts';
import { MedicalEntity } from 'types/healthProfile';
import ProfileImage from 'components/ProfileImage.tsx';
import { useGetPlanInfoQuery } from 'store/api/planApi.ts';
import Stats from 'screens/privateScreens/HealthProfile/components/Stats.tsx';
import Habits from 'screens/privateScreens/HealthProfile/components/Habits.tsx';
import { useGetMedicationAllergiesQuery, useGetMedicalProblemsQuery } from 'store/api/healthProfileApi.ts';
import HealthProfileListSection, { HealthProfileSectionType } from 'screens/privateScreens/HealthProfile/components/HealthProfileListSection.tsx';

const HealthProfile = () => {
    const theme = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const user = useSelector((state: RootState) => state.app.user);
    const { data, isLoading } = useGetPlanInfoQuery();
    const { data: medicalProblems } = useGetMedicalProblemsQuery();
    const { data: medicationAllergies } = useGetMedicationAllergiesQuery();
    
    return <Screen initialized={!isLoading} style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <ProfileImage style={styles.profileImg} uri={user?.coverImage?.url}/>
            <Text style={styles.marginVertical} textAlign="center">{user?.name}</Text>
            <Text style={styles.marginVertical} textAlign="center" color={theme.colors.grey}>Goal: &nbsp;
                <Text color={theme.colors.black}>{data?.goal ?? '-'}</Text>
            </Text>
            <Text style={styles.physicianText} textAlign="center">Physician: &nbsp;
                <Text color={theme.colors.black}>{user?.physician?.name ?? 'Unknown'}</Text>
            </Text>
            <Stats />
            <Habits />
            <HealthProfileListSection
                title="Medication Allergies"
                onAddPress={() => undefined}
                data={medicationAllergies ?? []}
                emptyText="No known Medication Allergies"
                type={'medicationAllergy' as HealthProfileSectionType}
            />
            <HealthProfileListSection
                title="Medical Problems"
                data={medicalProblems ?? []}
                onAddPress={() => undefined}
                emptyText="No known Medical Problems"
                type={'medicalProblem' as HealthProfileSectionType}
            />
            <HealthProfileListSection
                title="Medications"
                data={[] as MedicalEntity[]}
                onAddPress={() => undefined}
                emptyText="No known Medications"
                type={'medication' as HealthProfileSectionType}
            />
        </ScrollView>
    </Screen>;
};

export default HealthProfile;
const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
    scrollView: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    container: {
        flex: 1,
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.VERTICAL,
    },
    profileImg: {
        alignSelf: 'center',
        borderWidth: 1,
    },
    marginVertical: {
        marginVertical: OFFSET.POINT,
    },
    physicianText: {
        marginVertical: OFFSET.POINT,
        textDecorationLine: 'underline',
    },
});
