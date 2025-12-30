// outsource dependencies
import React, { memo, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/fontawesome5';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// local dependencies
import Text from 'components/Text.tsx';
import { filters } from 'services/filter';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import { ROUTES } from 'constants/routes.ts';
import { RootState, useAppSelector } from 'store';
import { PREFERRED_GENDER } from 'constants/spec.ts';
import { RootStackParamList } from 'services/navigation';
import Separator from 'components/FlatListSeparator.tsx';

const EMPTY_VALUE = '-';
export const Stats = () => {
    const theme = useTheme();
    const styles = useMemo(() => createStyles(), []);
    const user = useAppSelector((state: RootState) => state.app.user);
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const goToForm = () => navigation.navigate(ROUTES.PROFILE_STATS);
    const stats = [
        { label: 'Height', value: `${user?.heightFt ?? EMPTY_VALUE} ft ${user?.heightInches ?? EMPTY_VALUE} in` },
        { label: 'Weight', value: `${user?.weightLb ?? EMPTY_VALUE} lb` },
        { label: 'Gender', value: `${user?.gender}` },
        { label: 'Preferred Gender', value: `${
            user?.patientPreferredGender.preferredGender === PREFERRED_GENDER.OTHER
                ? user?.patientPreferredGender.additionalInfo
                : user?.patientPreferredGender.preferredGender
        }` },
        { label: 'My BMI (Calculated)', value: user?.bmi ? filters.roundDigitsAfterComma(user.bmi, 0) : EMPTY_VALUE },
    ];
    return <FlatList
        data={stats}
        scrollEnabled={false}
        ItemSeparatorComponent={Separator}
        ListFooterComponent={<Separator />}
        keyExtractor={(_, index) => index.toString()}
        ListHeaderComponent={
            <View style={styles.titleContainer}>
                <Text color={theme.colors.primary} style={styles.title}>My Stats</Text>
                <Pressable onPress={goToForm}>
                    <Icon iconStyle="solid" name="edit" size={24} color={theme.colors.grey} />
                </Pressable>
            </View>
        }
        renderItem={({ item }) => <View style={styles.itemContainer}>
            <Text color={theme.colors.grey}>{item.label}</Text>
            <Text>{item.value}</Text>
        </View>}
    />;
};

export default memo(Stats);
const createStyles = () => StyleSheet.create({
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: OFFSET.VERTICAL,
    },
    titleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        marginVertical: OFFSET.VERTICAL,
    },
});
