// outsource dependencies
import React, { memo } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
// local dependencies
import Text from './Text';
import { useTheme } from 'hooks/useTheme';

interface ApproveButtonsProps {
    disabled?: boolean;
    handleBack: () => void;
    handleSave: () => void;
}

const ApproveButtons: React.FC<ApproveButtonsProps> = ({ handleBack, handleSave, disabled }) => {
    const theme = useTheme();
    return (
        <View style={styles.buttons}>
            <View style={styles.button}>
                <TouchableOpacity
                    onPress={handleBack}
                    style={[styles.cancelButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                    activeOpacity={0.7}
                >
                    <Text style={styles.cancelText} color={theme.colors.textSecondary}>CANCEL</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.button}>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={disabled}
                    style={[styles.saveButton, disabled && styles.saveButtonDisabled]}
                    activeOpacity={0.7}
                >
                    <Text style={styles.saveText}>SAVE</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default memo(ApproveButtons);

const styles = StyleSheet.create({
    buttons: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    button: {
        flexDirection: 'column',
        flex: 1,
    },
    cancelButton: {
        height: 45,
        width: 115,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#8A95A3',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelText: {
        color: '#8A95A3',
        fontSize: 15,
        fontWeight: '700',
    },
    saveButton: {
        height: 75,
        width: 170,
        borderRadius: 45,
        backgroundColor: '#87CA67',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'flex-end',
    },
    saveButtonDisabled: {
        backgroundColor: '#C0C0C0',
    },
    saveText: {
        color: '#ffffff',
        fontWeight: '700',
        textTransform: 'uppercase',
        textAlign: 'center',
        fontSize: 20,
    },
});

