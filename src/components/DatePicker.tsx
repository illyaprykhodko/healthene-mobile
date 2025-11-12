// outsource dependencies
import React from 'react';
import moment from 'moment';
import DatePicker from 'react-native-date-picker';

interface DatePickerProps {
    onCancel: () => void;
    modalOpened: boolean;
    currentDate?: string | null;
    onSelect: (date: string) => void;
}

const DatePickerSelector = ({ currentDate, onSelect, modalOpened, onCancel }: DatePickerProps) => {
    const handleConfirm = (date: Date) => {
        onSelect(moment(date).format('YYYY-MM-DD'));
        onCancel();
    };
    return <DatePicker
        modal
        locale="en"
        mode="date"
        open={modalOpened}
        onCancel={onCancel}
        onConfirm={handleConfirm}
        date={currentDate ? new Date(currentDate) : new Date()}
    />;
};

export default DatePickerSelector;
