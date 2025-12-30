// outsource dependencies
import React, { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

// local dependencies
import { useTheme } from 'hooks/useTheme.ts';
import { useGetHabitsQuery, useGetPatientHabitsQuery } from 'store/api/healthProfileApi.ts';
import { MaterialIndicator } from 'react-native-indicators';
import { OFFSET } from 'constants/offset.ts';
import Text from 'components/Text.tsx';

interface HabitsProps {
  // props here
}

export const Habits = (props: HabitsProps) => {
    const theme = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const { data: habits, isLoading: isHabitsLoading } = useGetHabitsQuery();
    const { data: patientHabits, isLoading: isPatientHabitsLoading } = useGetPatientHabitsQuery();
    if (isHabitsLoading && isPatientHabitsLoading) {
        return (<MaterialIndicator style={styles.indicator} color={theme.colors.primary} size={60} />);
    }

    console.log('habits', habits);
    return <FlatList
        data={patientHabits}
        scrollEnabled={false}
        keyExtractor={item => item?.id.toString()}
        renderItem={({ item }) => <Text>{item.name}</Text>}
    />;
};

export default Habits;
const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
    container: {
    // style here
    },
    indicator: {
        marginVertical: OFFSET.VERTICAL,
    }
});
