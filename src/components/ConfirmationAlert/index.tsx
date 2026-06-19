// outsource dependencies
import React, { memo } from 'react';
import { StyleSheet, View, Modal, TouchableOpacity, Platform } from 'react-native';
// local dependencies
import Text from 'components/Text';
import { COLORS } from 'constants/colors';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';

interface ConfirmationAlertProps {
    title: string;
    isOpen: boolean;
    message?: string;
    applyTxt?: string;
    cancelTxt?: string;
    disabled?: boolean;
    onClose: () => void;
    onSubmit: () => void;
    hideCancelBtn?: boolean;
    variant?: 'default' | 'legacy';
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
    variant = 'default',
    cancelTxt = 'Cancel',
}) => {
    const theme = useTheme();
    if (!isOpen) { return null; }
    const isLegacy = variant === 'legacy';

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
                style={[styles.overlay, isLegacy && styles.overlayLegacy]}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    style={[
                        styles.alertBox,
                        isLegacy && styles.alertBoxLegacy,
                        { backgroundColor: theme.colors.surface },
                    ]}
                >
                    <Text
                        variant="h3"
                        color={theme.colors.text}
                        style={isLegacy ? { ...styles.title, ...styles.titleLegacy } : styles.title}
                    >
                        {title}
                    </Text>
                    {message && <Text
                        color={theme.colors.textSecondary}
                        style={isLegacy ? {...styles.message, ...styles.messageLegacy} : styles.message}
                    >
                        {message}
                    </Text>}

                    <View style={[styles.actions, isLegacy && styles.actionsLegacy]}>
                        {!hideCancelBtn && (
                            <TouchableOpacity
                                onPress={onClose}
                                disabled={disabled}
                                style={[
                                    styles.btn,
                                    styles.cancelBtn,
                                    isLegacy && styles.btnLegacy,
                                    isLegacy && styles.cancelBtnLegacy,
                                ]}
                            >
                                <Text
                                    style={isLegacy
                                        ? { ...styles.cancelBtnText, ...styles.btnTextLegacy }
                                        : styles.cancelBtnText}
                                >
                                    {cancelTxt}
                                </Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            onPress={onSubmit}
                            disabled={disabled}
                            style={[
                                styles.btn,
                                styles.applyBtn,
                                isLegacy && styles.btnLegacy,
                                isLegacy && styles.applyBtnLegacy,
                                hideCancelBtn && styles.applyBtnFull,
                            ]}
                        >
                            <Text
                                style={isLegacy
                                    ? { ...styles.applyBtnText, ...styles.btnTextLegacy }
                                    : styles.applyBtnText}
                            >
                                {applyTxt}
                            </Text>
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
    overlayLegacy: {
        backgroundColor: '#00000090',
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
    alertBoxLegacy: {
        width: Platform.OS === 'ios' ? '75%' : '80%',
        padding: 20,
        borderRadius: 6,
        marginBottom: 150,
        alignItems: 'center',
        shadowOpacity: 0.2,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    titleLegacy: {
        fontSize: 20,
        marginBottom: 10,
    },
    messageLegacy: {
        fontSize: 18,
        marginBottom: 20,
        lineHeight: 24,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionsLegacy: {
        width: '100%',
    },
    btn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 24,
        alignItems: 'center',
    },
    btnLegacy: {
        paddingVertical: 2,
        borderWidth: 3,
        borderRadius: 30,
        marginHorizontal: 10,
        borderColor: COLORS.THEME_COLOR,
    },
    cancelBtn: {
        backgroundColor: '#EBB3D1',
        marginRight: 8,
    },
    cancelBtnLegacy: {
        marginRight: 10,
        marginLeft: 0,
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
    applyBtnLegacy: {
        marginLeft: 10,
        marginRight: 0,
    },
    applyBtnFull: {
        marginLeft: 0,
    },
    applyBtnText: {
        color: '#00788D',
        fontSize: 16,
        fontWeight: '600',
    },
    btnTextLegacy: {
        fontSize: 20,
        fontWeight: 'bold',
    },
});
