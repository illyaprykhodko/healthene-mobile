// outsource dependencies
import React, { memo } from 'react';
import { StyleSheet, View, Modal, TouchableOpacity } from 'react-native';
// local dependencies
import Text from 'components/Text';
import { COLORS } from 'constants/colors';
import { OFFSET } from 'constants/offset';

interface ConfirmationAlertProps {
    isOpen: boolean;
    title: string;
    message: string;
    applyTxt?: string;
    cancelTxt?: string;
    disabled?: boolean;
    onClose: () => void;
    onSubmit: () => void;
    hideCancelBtn?: boolean;
}

const ConfirmationAlert: React.FC<ConfirmationAlertProps> = memo(({
    isOpen,
    title,
    message,
    onClose,
    disabled,
    onSubmit,
    hideCancelBtn,
    applyTxt = 'OK',
    cancelTxt = 'Cancel',
}) => {
    if (!isOpen) { return null; }

    return (
        <Modal
            transparent
            visible={isOpen}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                activeOpacity={1}
                onPress={onClose}
                style={styles.overlay}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    style={styles.alertBox}
                >
                    <Text variant="h3" style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <View style={styles.actions}>
                        {!hideCancelBtn && (
                            <TouchableOpacity
                                onPress={onClose}
                                disabled={disabled}
                                style={[styles.btn, styles.cancelBtn]}
                            >
                                <Text style={styles.cancelBtnText}>{cancelTxt}</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            onPress={onSubmit}
                            disabled={disabled}
                            style={[
                                styles.btn,
                                styles.applyBtn,
                                hideCancelBtn && styles.applyBtnFull,
                            ]}
                        >
                            <Text style={styles.applyBtnText}>{applyTxt}</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
});

export default ConfirmationAlert;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    alertBox: {
        width: '85%',
        padding: OFFSET.HORIZONTAL * 1.5,
        borderRadius: 12,
        backgroundColor: COLORS.WHITE,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
        color: COLORS.BLACK,
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
        color: COLORS.DARK_GREY,
        lineHeight: 22,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    btn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 24,
        alignItems: 'center',
    },
    cancelBtn: {
        backgroundColor: '#EBB3D1',
        marginRight: 8,
    },
    cancelBtnText: {
        color: COLORS.BLACK,
        fontSize: 16,
        fontWeight: '600',
    },
    applyBtn: {
        backgroundColor: '#B8E6B3',
        marginLeft: 8,
    },
    applyBtnFull: {
        marginLeft: 0,
    },
    applyBtnText: {
        color: '#00788D',
        fontSize: 16,
        fontWeight: '600',
    },
});

