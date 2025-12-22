// outsource dependencies
import React, { memo, useMemo, useCallback } from 'react';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { Modal, StyleSheet, TouchableOpacity, View, Platform, Image } from 'react-native';
// local dependencies
import Text from 'components/Text';
import { OFFSET } from 'constants/offset';
import { COLORS } from 'constants/colors';
import DefImage from 'components/DefImage';

interface ConfirmationReplaceModalProps {
    visible: boolean;
    prevItem: any;
    nextItem: any;
    onClose: () => void;
    onApply: (data: { prevItem: any; nextItem: any }) => void;
}

const ConfirmationReplaceModal: React.FC<ConfirmationReplaceModalProps> = memo(({
    visible,
    prevItem,
    nextItem,
    onClose,
    onApply,
}) => {
    const handleApply = useCallback(() => {
        onApply({ prevItem, nextItem });
        onClose();
    }, [prevItem, nextItem, onApply, onClose]);

    const { prevName, nextName, nextImage } = useMemo(() => {
        const prevName = prevItem?.name
            || prevItem?.recipe?.name
            || prevItem?.food?.name
            || '';
        const nextName = nextItem?.name
            || nextItem?.recipe?.name
            || nextItem?.food?.name
            || nextItem?.item?.name
            || '';
        const nextImage = nextItem?.coverImage?.url
            || nextItem?.recipe?.coverImage?.url
            || nextItem?.food?.coverImage?.url
            || nextItem?.item?.coverImage?.url
            || '';

        return { prevName, nextName, nextImage };
    }, [prevItem, nextItem]);

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.wrapper}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle} textAlign="center">
                        Replacement Options
                    </Text>
                    <TouchableOpacity style={styles.close} onPress={onClose}>
                        <Icon name="times" color={COLORS.BLACK} size={24} />
                    </TouchableOpacity>
                </View>
                <View style={styles.container}>
                    <View style={styles.logoWrap}>
                        {nextImage ? (
                            <DefImage src={nextImage} style={styles.logo} />
                        ) : null}
                        {nextName ? (
                            <Text style={styles.itemName}>{nextName}</Text>
                        ) : null}
                    </View>
                    <View style={styles.contentWrapper}>
                        <Text style={styles.title} textAlign="center">
                            Replace {prevName || 'this item'} with {nextName || 'selected item'}?
                        </Text>
                        <View style={styles.buttonsRow}>
                            <TouchableOpacity
                                onPress={handleApply}
                                style={styles.replaceBtn}
                            >
                                <Text style={styles.replaceBtnText}>REPLACE ITEM</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
});

export default ConfirmationReplaceModal;

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: Platform.OS === 'ios' ? 100 : 60,
        bottom: 0,
        elevation: 7,
        backgroundColor: COLORS.WHITE,
        zIndex: 999,
        flex: 1,
        justifyContent: 'flex-start',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E0EBF7',
        height: 56,
        position: 'relative',
    },
    headerTitle: {
        flex: 1,
        color: '#181818',
        fontSize: 15,
        fontWeight: '500',
        textAlign: 'center',
    },
    close: {
        position: 'absolute',
        right: 15,
        zIndex: 2,
    },
    container: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: OFFSET.HORIZONTAL * 1.5,
        paddingTop: OFFSET.VERTICAL * 2,
        paddingBottom: OFFSET.VERTICAL * 2,
        backgroundColor: COLORS.WHITE,
        justifyContent: 'space-between',
    },
    logoWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '75%',
        flexGrow: 1,
    },
    logo: {
        width: 80,
        height: 80,
        marginRight: 15,
    },
    itemName: {
        fontSize: 23,
        fontWeight: '600',
        color: COLORS.BLACK,
    },
    contentWrapper: {
        flexGrow: 2,
        justifyContent: 'space-between',
        width: '100%',
    },
    title: {
        fontSize: 32,
        fontWeight: '500',
        marginBottom: 24,
        color: COLORS.BLACK,
        textAlign: 'center',
        paddingHorizontal: OFFSET.HORIZONTAL * 1.5,
    },
    buttonsRow: {
        width: '100%',
    },
    replaceBtn: {
        width: '100%',
        backgroundColor: '#CAE1F9',
        marginBottom: 12,
        paddingTop: 21,
        paddingBottom: 21,
        borderRadius: 100,
        alignItems: 'center',
    },
    replaceBtnText: {
        color: '#567697',
        fontWeight: '500',
        fontSize: 20,
    },
});
