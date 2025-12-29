// outsource dependencies
import { useSelector } from 'react-redux';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

// local dependencies
import { RootState } from 'store';
import Text from 'components/Text.tsx';
import Screen from 'components/Screen.tsx';
import { OFFSET } from 'constants/offset.ts';
import { useTheme } from 'hooks/useTheme.ts';
import ProfileImage from 'components/ProfileImage.tsx';
import { useGetPlanInfoQuery } from 'store/api/planApi.ts';
import LoadingOverlay from 'components/LoadingOverlay.tsx';
import StatsForm from 'screens/privateScreens/HealthProfile/components/StatsForm.tsx';

const HealthProfile = () => {
    const theme = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const user = useSelector((state: RootState) => state.app.user);
    const { data, isLoading } = useGetPlanInfoQuery();
    const [preloader, setPreloader] = useState<boolean>(false);
    return <>
        <LoadingOverlay init={preloader} />
        <Screen initialized={!isLoading} style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <ProfileImage style={styles.profileImg} uri={user?.coverImage?.url}/>
                <Text style={styles.marginVertical} textAlign="center">{user?.name}</Text>
                <Text style={styles.marginVertical} textAlign="center" color={theme.colors.grey}>Goal: &nbsp;
                    <Text color={theme.colors.black}>{data?.goal ?? '-'}</Text>
                </Text>
                <Text style={styles.physicianText} textAlign="center">Physician: &nbsp;
                    <Text color={theme.colors.black}>{user?.physician?.name ?? 'Unknown'}</Text>
                </Text>
                <StatsForm setPreloader={setPreloader} />
            </ScrollView>
        </Screen>
    </>;

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
    }
});
