// outsource dependencies
import React, { memo } from 'react';
import {
    Modal,
    View,
    Platform,
    Dimensions,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
// local dependencies
import Text from 'components/Text';
import { useTheme } from 'hooks/useTheme';

interface ReplaceItemModalProps {
    visible: boolean;
    onClose: () => void;
    onApply: () => void;
    videoUrl?: string; // Optional video about rescue foods
}

const ReplaceItemModal: React.FC<ReplaceItemModalProps> = ({
    visible,
    onClose,
    onApply,
    videoUrl,
}) => {
    const theme = useTheme();

    const handleApply = () => {
        onApply();
        onClose();
    };

    return (
        <Modal
            transparent
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <ScrollView contentContainerStyle={styles.container} style={{ backgroundColor: theme.colors.background }}>
                <View style={styles.closeButton}>
                    <TouchableOpacity onPress={onClose}>
                        <Icon name="times" color="#2978A0" size={20} />
                    </TouchableOpacity>
                </View>
                <View style={styles.main}>
                    <View style={styles.iconContainer}>
                        <Icon name="utensils" size={60} color="#2978A0" />
                    </View>

                    <Text textAlign="center" style={[styles.title1, { color: theme.colors.text }]}>
                        Would you like to use
                    </Text>
                    <Text style={[styles.title2, { color: theme.colors.text }]} textAlign="center">
                        <Text style={styles.innerTitle2}>Additional Food Options</Text>
                        ?
                    </Text>
                    <Text textAlign="center" style={[styles.title3, { color: theme.colors.text }]}>
                        Click to learn more.
                    </Text>

                    {/* Video placeholder - can be replaced with actual video component */}
                    {videoUrl && (
                        <View style={[styles.videoContainer, { backgroundColor: theme.colors.primary }]}>
                            <Text style={[styles.videoPlaceholder, { color: theme.colors.white }]}>
                                Video about Additional Food Options
                            </Text>
                        </View>
                    )}
                </View>
                <View style={styles.buttons}>
                    <TouchableOpacity
                        style={[styles.button, styles.cancelButton]}
                        onPress={onClose}
                    >
                        <Text style={styles.cancelButtonText}>No</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, styles.okButton]}
                        onPress={handleApply}
                    >
                        <Text style={styles.okButtonText}>Yes</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </Modal>
    );
};

export default memo(ReplaceItemModal);

const screenHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        paddingHorizontal: 10,
        // paddingTop: Platform.OS === 'ios' ? 25 : 0,
        paddingVertical: 25
    },
    main: {
        flexGrow: 1,
        borderRadius: 5,
    },
    closeButton: {
        marginLeft: 'auto',
        padding: 20,
        flexDirection: 'row-reverse',
    },
    iconContainer: {
        alignItems: 'center',
        marginVertical: 30,
    },
    buttons: {
        flexDirection: 'row',
        marginHorizontal: 10,
        // marginTop: screenHeight / 6,
        gap: 10,
        // marginBottom: 0,
    },
    button: {
        flex: 1,
        borderWidth: 2,
        borderRadius: 10,
        paddingVertical: 17,
        alignItems: 'center',
    },
    cancelButton: {
        borderColor: 'transparent',
        backgroundColor: '#F7DBDC',
    },
    cancelButtonText: {
        color: '#7A3A3C',
        fontSize: 18,
        fontWeight: '600',
    },
    okButton: {
        borderColor: 'transparent',
        backgroundColor: '#BCE8A6',
    },
    okButtonText: {
        color: '#4E733C',
        fontSize: 18,
        fontWeight: '600',
    },
    videoContainer: {
        height: screenHeight / 4,
        marginHorizontal: 15,
        marginVertical: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoPlaceholder: {
        fontSize: 16,
        fontWeight: '500',
    },
    title1: {
        fontSize: Platform.OS === 'ios' ? 28 : 22,
        marginTop: Platform.OS === 'ios' ? 35 : 20,
        fontWeight: '400',
    },
    title2: {
        fontSize: Platform.OS === 'ios' ? 28 : 22,
        fontWeight: '700',
    },
    innerTitle2: {
        fontSize: Platform.OS === 'ios' ? 28 : 22,
        color: '#2978A0',
        fontWeight: '700',
    },
    title3: {
        fontSize: Platform.OS === 'ios' ? 28 : 22,
        marginTop: Platform.OS === 'ios' ? 35 : 20,
        marginBottom: 15,
        fontWeight: '400',
    },
});

