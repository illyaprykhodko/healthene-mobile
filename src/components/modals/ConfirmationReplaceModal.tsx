// outsource dependencies
import React, { memo, useCallback, useMemo } from 'react';
import {
    Modal,
    View,
    Platform,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
// local dependencies
import Text from 'components/Text';
import { useTheme } from 'hooks/useTheme';
import { Button } from 'components/Button';
import { OFFSET } from 'constants/offset';

interface ConfirmationReplaceModalProps {
    prevItem: any;
    nextItem: any;
    visible: boolean;
    onClose: () => void;
    onApply: ({ prevItem, nextItem }: { prevItem: any; nextItem: any }) => void;
}

const ConfirmationReplaceModal: React.FC<ConfirmationReplaceModalProps> = ({
    visible,
    onClose,
    onApply,
    prevItem,
    nextItem,
}) => {
    const theme = useTheme();

    const handleApply = useCallback(() => {
        onApply({ prevItem, nextItem });
        onClose();
    }, [prevItem, nextItem, onApply, onClose]);

    const { prevName, prevImage, nextName, nextImage } = useMemo(() => {
        const prevName = prevItem?.name || prevItem?.recipe?.name || prevItem?.food?.name || '';
        const prevImage = prevItem?.coverImage?.url || prevItem?.recipe?.coverImage?.url || prevItem?.food?.coverImage?.url || '';
        const nextName = nextItem?.name || nextItem?.recipe?.name || nextItem?.food?.name || '';
        const nextImage = nextItem?.coverImage?.url || nextItem?.recipe?.coverImage?.url || nextItem?.food?.coverImage?.url || '';

        return { prevName, prevImage, nextName, nextImage };
    }, [prevItem, nextItem]);

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.wrapper}>
                <View style={[styles.header, { backgroundColor: '#E0EBF7' }]}>
                    <Text style={[styles.headerTitle, { color: theme.colors.text }]} textAlign="center">
                        Replacement Options
                    </Text>
                    <TouchableOpacity style={styles.close} onPress={onClose}>
                        <Icon name="times" color={theme.colors.black} size={24} />
                    </TouchableOpacity>
                </View>
                <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                    <View style={styles.logoWrap}>
                        {nextImage ? (
                            <View style={styles.logo}>
                                {/* TODO: Replace with DefImage component */}
                                <View style={[styles.imagePlaceholder, { backgroundColor: theme.colors.lightGrey }]} />
                            </View>
                        ) : null}
                        {nextName ? (
                            <Text style={[styles.restaurantName, { color: theme.colors.text }]}>
                                {nextName}
                            </Text>
                        ) : null}
                    </View>
                    <View style={{ flexGrow: 2, justifyContent: 'space-between' }}>
                        <Text style={[styles.title, { color: theme.colors.text }]} textAlign="center">
                            Replace
                            {' '}
                            {prevName || 'this item'}
                            {' '}
                            with
                            {' '}
                            {nextName || 'selected item'}
                            ?
                        </Text>
                        <View style={styles.buttonsRow}>
                            <Button
                                title="REPLACE ITEM"
                                onPress={handleApply}
                                style={styles.replaceBtn}
                                textStyle={{ color: '#567697', fontWeight: '500', fontSize: 20 }}
                            />
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default memo(ConfirmationReplaceModal);

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: Platform.OS === 'ios' ? 100 : 60,
        bottom: 0,
        elevation: 7,
        backgroundColor: '#FFFFFF',
        zIndex: 999,
        flex: 1,
        justifyContent: 'flex-start',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        position: 'relative',
    },
    headerTitle: {
        flex: 1,
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
    imagePlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    restaurantName: {
        fontSize: 23,
        fontWeight: '600',
        fontFamily: 'Nunito Sans',
    },
    title: {
        fontSize: 32,
        fontWeight: '500',
        marginBottom: 24,
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
        borderWidth: 0,
        borderRadius: 100,
    },
});
