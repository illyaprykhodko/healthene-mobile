// outsource dependencies
import React from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// local dependencies
import { Badge } from './Badge';
import Text from 'components/Text';
import { COLORS } from 'constants/colors';
import { useTheme } from 'hooks/useTheme';
import { PHASE_ITEM_STATUS } from 'constants/spec';
import { AnytimeListItem } from './AnytimeListItem';
import type { AnytimeItem, AnytimeModalProps } from 'types/anytime';
import { useUpdatePhaseItemMutation } from 'store/api/dayOverviewApi';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const getIconComponent = (icon: string, color: string) => {
    const iconProps = {
        size: 24,
        color,
    };

    switch (icon) {
        case 'utensils':
            return <Icon name="utensils" {...iconProps} />;
        case 'glass-martini':
            return <Icon name="glass-martini" {...iconProps} />;
        case 'capsules':
            return <Icon name="capsules" {...iconProps} />;
        case 'ruler':
            return <Icon name="ruler" {...iconProps} />;
        case 'running':
            return <Icon name="running" {...iconProps} />;
        default:
            return <Icon name="circle" {...iconProps} />;
    }
};

export const AnytimeModal: React.FC<AnytimeModalProps> = ({
    icon,
    items,
    title,
    onClose,
    visible,
    maxHeight,
    disabled = false,
    fullScreen = true,
    isFutureDate = false,
}) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const [updatePhaseItem] = useUpdatePhaseItemMutation();

    const pendingItems = items.filter(item => item.status === PHASE_ITEM_STATUS.PENDING);
    const completedItems = items.filter(item => item.status === PHASE_ITEM_STATUS.DONE);

    const handleUpdateItem = async (item: AnytimeItem) => {
        if (disabled || !item.phaseId) { return; }

        const newStatus = item.status === PHASE_ITEM_STATUS.PENDING ? PHASE_ITEM_STATUS.DONE : PHASE_ITEM_STATUS.PENDING;
    
        try {
            await updatePhaseItem({
                id: item.id,
                phaseId: item.phaseId,
                data: {
                    ...item,
                    status: newStatus,
                },
            }).unwrap();
        } catch (error) {
            console.error('Failed to update anytime item:', error);
        }
    };

    // Calculate modal style based on mode
    const getModalStyle = () => {
        const baseStyle = styles.modal;
        
        if (fullScreen) {
            return [baseStyle, { top: insets.top, paddingBottom: insets.bottom }];
        }
        
        // Partial mode
        const calculatedMaxHeight = maxHeight || SCREEN_HEIGHT * 0.8;
        return [
            baseStyle,
            {
                bottom: 0,
                top: undefined,
                borderTopWidth: 1,
                maxHeight: calculatedMaxHeight,
                borderTopColor: theme.colors.border,
            }
        ];
    };

    if (!visible) { return null; }

    return (
        <View style={styles.overlay}>
            <TouchableOpacity
                onPress={onClose}
                activeOpacity={1}
                style={StyleSheet.absoluteFill}
            />
      
            <View style={[getModalStyle(), { backgroundColor: theme.colors.surface }]}>
                <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
                    <View style={styles.headerLeft}>
                        <Badge count={pendingItems.length}>
                            {getIconComponent(icon, theme.colors.blue)}
                        </Badge>
                        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                            {title}
                        </Text>
                    </View>
          
                    <TouchableOpacity
                        onPress={onClose}
                        disabled={disabled}
                        style={styles.closeButton}
                    >
                        <Icon name="times" size={20} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    {items.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No items found
                            </Text>
                        </View>
                    ) : (
                        <ScrollView style={styles.scrollView}>
                            {/* Pending items */}
                            {pendingItems.map(item => (
                                <AnytimeListItem
                                    item={item}
                                    disabled={disabled}
                                    key={`pending-${item.id}`}
                                    isFutureDate={isFutureDate}
                                    onUpdateItem={handleUpdateItem}
                                />
                            ))}
              
                            {/* Completed items */}
                            {completedItems.map(item => (
                                <AnytimeListItem
                                    item={item}
                                    disabled={disabled}
                                    isFutureDate={isFutureDate}
                                    key={`completed-${item.id}`}
                                    onUpdateItem={handleUpdateItem}
                                />
                            ))}
                        </ScrollView>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 999,
    },
    modal: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: COLORS.WHITE,
        elevation: 7,
        shadowColor: COLORS.BLACK,
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
        backgroundColor: '#E0EBF7',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.LIGHTER_GREY,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerTitle: {
        marginLeft: 16,
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.BLACK,
    },
    closeButton: {
        padding: 8,
        borderRadius: 20,
    },
    content: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#808080',
        textAlign: 'center',
    },
});
