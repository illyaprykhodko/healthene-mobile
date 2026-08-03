// outsource dependencies
import dayjs from 'services/date';
import Icon from '@react-native-vector-icons/feather';
import React, { memo, useCallback, useMemo } from 'react';
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
        init({ date: dayjs(date).add(1, 'day').format('YYYY-MM-DD') });
    }, [date, init]);

    const handleLeftBtn = useCallback(() => {
        init({ date: dayjs(date).subtract(1, 'day').format('YYYY-MM-DD') });
    }, [date, init]);

    const endOfWeek = dayjs().endOf('week');
    const startOfWeek = dayjs().startOf('week');

    const disabledRightBtn = useMemo(() => {
        const d = dayjs(date, 'YYYY-MM-DD');
        return !endOfWeek.isAfter(d, 'day') || endOfWeek.isSame(d, 'day');
    }, [date]);

    const disabledLeftBtn = useMemo(() => {
        const d = dayjs(date, 'YYYY-MM-DD');
        return startOfWeek.isSame(d, 'day');
    }, [date]);

    const theme = useTheme();
    return (
        <View style={styles.header}>
            <TouchableOpacity
                onPress={handleLeftBtn}
                disabled={disabled || isHideLeftBtn}
                style={isHideLeftBtn && styles.invisibleBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Icon
                    size={18}
                    name="chevron-left"
                    color={theme.colors.white}
                />
            </TouchableOpacity>
            <Text
                variant="h4"
                color={theme.colors.white}
                style={styles.headerTitle}
            >
                {dayjs(date).format('ddd, MMM D')}
            </Text>
            <TouchableOpacity
                onPress={handleRightBtn}
                disabled={disabled || isHideRightBtn}
                style={isHideRightBtn && styles.invisibleBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Icon
                    size={18}
                    name="chevron-right"
                    color={theme.colors.white}
                />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    invisibleBtn: {
        opacity: 0,
    },
    headerTitle: {
        fontWeight: 'bold',
        paddingHorizontal: 12,
    }
});

export const TimeSwitcher = memo(TimeSwitcherComponent);
export default TimeSwitcher;
