// outsource dependencies
import moment from 'moment';
import React, { memo, useCallback, useMemo } from 'react';
import FeatherIcon from '@react-native-vector-icons/feather';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
// local dependencies
import Text from 'components/Text';
import { useTheme } from 'hooks/useTheme';

export interface TimeSwitcherProps {
    date: string; // YYYY-MM-DD
    disabled?: boolean;
    isHideLeftBtn?: boolean;
    isHideRightBtn?: boolean;
    init: (params: { date: string }) => void;
}

const TimeSwitcherComponent: React.FC<TimeSwitcherProps> = ({
    date,
    init,
    disabled = false,
    isHideLeftBtn = false,
    isHideRightBtn = false,
}) => {
    const handleRightBtn = useCallback(() => {
        init({ date: moment(date).add(1, 'day').format('YYYY-MM-DD') });
    }, [date, init]);

    const handleLeftBtn = useCallback(() => {
        init({ date: moment(date).subtract(1, 'day').format('YYYY-MM-DD') });
    }, [date, init]);

    const endOfWeek = moment().endOf('week');
    const startOfWeek = moment().startOf('week');

    const disabledRightBtn = useMemo(() => {
        const d = moment(date, 'YYYY-MM-DD');
        return !endOfWeek.isAfter(d, 'day') || endOfWeek.isSame(d, 'day');
    }, [date]);

    const disabledLeftBtn = useMemo(() => {
        const d = moment(date, 'YYYY-MM-DD');
        return startOfWeek.isSame(d, 'day');
    }, [date]);

    const theme = useTheme();
    return (
        <View style={styles.header}>
            <TouchableOpacity
                onPress={handleLeftBtn}
                disabled={disabled || isHideLeftBtn || disabledLeftBtn}
            >
                <FeatherIcon
                    size={18}
                    name="chevron-left"
                    color={theme.colors.white}
                    style={[styles.touchableArea, (isHideLeftBtn || disabledLeftBtn) && styles.invisibleBtn]}
                />
            </TouchableOpacity>
            <Text
                variant="h4"
                color={theme.colors.white}
                style={styles.headerTitle}
            >
                {moment(date).format('ddd, MMM D')}
            </Text>
            <TouchableOpacity
                onPress={handleRightBtn}
                disabled={disabled || isHideRightBtn || disabledRightBtn}
            >
                <FeatherIcon
                    size={18}
                    name="chevron-right"
                    color={theme.colors.white}
                    style={[styles.touchableArea, (isHideRightBtn || disabledRightBtn) && styles.invisibleBtn]}
                />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    invisibleBtn: {
        display: 'none',
    },
    headerTitle: {
        fontWeight: 'bold',
        paddingHorizontal: 12,
    },
    touchableArea: {
        paddingVertical: 15,
        paddingHorizontal: 10,
    },
});

export const TimeSwitcher = memo(TimeSwitcherComponent);
export default TimeSwitcher;

