// outsource dependencies
import { useDispatch } from 'react-redux';
import Toast from 'react-native-toast-message';
import React, { useEffect, useMemo, useRef } from 'react';
import { FlatList, ListRenderItemInfo, StyleSheet, View } from 'react-native';
import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';

// local dependencies
import Text from 'components/Text.tsx';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import { Habit } from 'types/healthProfile.ts';
import Checkbox from 'components/Checkbox.tsx';
import { GENDERS_TYPE } from 'constants/spec.ts';
import { RootState, useAppSelector } from 'store';
import Separator from 'components/FlatListSeparator.tsx';
import { setSelectedHabits, toggleHabit } from 'store/slices/healthProfileSlice.ts';
import ListHeader from 'screens/privateScreens/HealthProfile/components/ListHeader.tsx';
import { useGetHabitsQuery, useGetPatientHabitsQuery, useUpdatePatientHabitsMutation } from 'store/api/healthProfileApi.ts';

export const Habits = () => {
    const theme = useTheme();
    const dispatch = useDispatch();
    const styles = useMemo(() => createStyles(), []);
    const { data: habits } = useGetHabitsQuery();
    const { data: patientHabits } = useGetPatientHabitsQuery();
    const [updatePatientHabits] = useUpdatePatientHabitsMutation();
    const modalSheetRef = useRef<BottomSheetModal>(null);
    const openModalSheet = () => modalSheetRef.current?.present();
    const user = useAppSelector((state: RootState) => state.app.user);
    const { selectedHabits } = useAppSelector((state: RootState) => state.healthProfile);

    useEffect(() => {
        if (!habits || !patientHabits) { return; }

        const mappedSelectedHabits = patientHabits
            .map(ph => habits.find(h => h.id === ph.habit?.id))
            .filter(Boolean) as Habit[];

        dispatch(setSelectedHabits(mappedSelectedHabits));
    }, [patientHabits, habits, dispatch]);

    // actions
    const handleHabits = (habit: Habit) => dispatch(toggleHabit(habit));
    const prepareData = (data: Habit[]) => data.filter(habit => habit.group !== 'FEMALE');

    // update habits
    const buildPayload = () => {
        if (!patientHabits) { return []; }

        return selectedHabits.map(habit => {
            const patientHabit = patientHabits.find(
                ph => ph.habit.id === habit.id
            );

            return {
                id: patientHabit?.id ?? null,
                entity: { id: habit.id },
            };
        });
    };
    const handleSheetDismiss = async () => {
        try {
            const payload = buildPayload();

            if (!payload.length) { return; }

            await updatePatientHabits(payload).unwrap();

            Toast.show({
                type: 'success',
                text1: 'Habits updated',
                text2: 'Your preferences have been saved.',
            });
        } catch (e) {
            Toast.show({
                type: 'error',
                text1: 'Update failed',
                text2: 'Please try again later.',
            });
        }
    };
    
    return <>
        <FlatList
            data={patientHabits}
            scrollEnabled={false}
            ItemSeparatorComponent={Separator}
            keyExtractor={item => item?.id.toString()}
            ListFooterComponent={patientHabits?.length ? <Separator /> : null}
            ListHeaderComponent={<ListHeader onAction={openModalSheet} title="Habits" />}
            renderItem={({ item }) => <Text style={styles.paddingVertical}>{item?.habit?.name}</Text>}
            ListEmptyComponent={<Text textAlign="center" color={theme.colors.grey} style={styles.paddingVertical}>No habits found</Text>}
        />
        <BottomSheetModal
            ref={modalSheetRef}
            snapPoints={['90%']}
            enablePanDownToClose
            enableDynamicSizing={false}
            onDismiss={handleSheetDismiss}
            backdropComponent={backdropProps => (
                <BottomSheetBackdrop
                    {...backdropProps}
                    opacity={0.5}
                    appearsOnIndex={0}
                    disappearsOnIndex={-1}
                />
            )}>
            <BottomSheetFlatList
                ItemSeparatorComponent={Separator}
                contentContainerStyle={styles.paddingVertical}
                keyExtractor={(item: Habit) => String(item.id)}
                data={user?.gender !== GENDERS_TYPE.FEMALE ? prepareData(habits ?? []) : habits}
                renderItem={({ item }: ListRenderItemInfo<Habit>) => {
                    return <View style={styles.itemContainer}>
                        <Text>{item.name}</Text>
                        <Checkbox
                            size={8}
                            isDayOverview={false}
                            onChange={() => handleHabits(item)}
                            value={selectedHabits.some(habit => habit.id === item.id)}
                        />
                    </View>;
                }}
            />
        </BottomSheetModal>
    </>;
};

export default Habits;
const createStyles = () => StyleSheet.create({
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    paddingVertical: {
        paddingVertical: OFFSET.VERTICAL,
    }
});
