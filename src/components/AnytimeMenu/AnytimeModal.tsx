// outsource dependencies
import React, { useState } from 'react';
import {
    View,
    Modal,
    StyleSheet,
    Dimensions,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import moment from 'moment';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
// local dependencies
import { Badge } from './Badge';
import Text from 'components/Text';
import { COLORS } from 'constants/colors';
import { ROUTES } from 'constants/routes';
import { useTheme } from 'hooks/useTheme';
import { PHASE_ITEM_STATUS } from 'constants/spec';
import { AnytimeListItem } from './AnytimeListItem';
import { GlassSurface } from 'components/GlassSurface';
import { MeasurementInputModal } from './MeasurementInputModal';
import {
    FoodIcon,
    DrinkIcon,
    CloseIcon,
    ActivityIcon,
    SupplementIcon,
    MeasurementIcon,
} from './AnytimeIcons';
import { useUpdatePhaseItemMutation } from 'store/api/dayOverviewApi';
import type { AnytimeItem, AnytimeModalProps, AnytimeMeasurementItem } from 'types/anytime';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const getIconComponent = (icon: string, size: number = 24) => {
    switch (icon) {
        case 'utensils':
            return <FoodIcon size={size} />;
        case 'glass-martini':
            return <DrinkIcon size={size} />;
        case 'capsules':
            return <SupplementIcon size={16} />;
        case 'ruler':
            return <MeasurementIcon size={size} />;
        case 'running':
            return <ActivityIcon size={size} />;
        default:
            return <FoodIcon size={size} />;
    }
};

export const AnytimeModal: React.FC<AnytimeModalProps> = ({
    date,
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
    const navigation = useNavigation<any>();
    const [updatePhaseItem] = useUpdatePhaseItemMutation();
    const [selectedMeasurement, setSelectedMeasurement] = useState<AnytimeMeasurementItem | null>(null);

    const pendingItems = items.filter(item =>
        item.status === PHASE_ITEM_STATUS.PENDING || item.status === PHASE_ITEM_STATUS.INCOMPLETE);
    const completedItems = items.filter(item => item.status === PHASE_ITEM_STATUS.DONE);

    const toApiAnytimeItem = (item: AnytimeItem) => {
        // Backend contract for drinks in phase items is FOOD + substanceType DRINK.
        if (item.type === 'DRINK') {
            return {
                ...item,
                type: 'FOOD',
                substanceType: 'DRINK',
            };
        }
        return item;
    };

    const handleUpdateItem = async (data: AnytimeItem) => {
        if (disabled || !data.phaseId) { return; }
        // const preparedData = {
        //     ...data,
        //     type: data.type === 'DRINK' ? 'FOOD' : data.type,
        // };
        try {
            const payload: any = toApiAnytimeItem(data);
            await updatePhaseItem({
                id: data.id,
                // data: preparedData,
                data: payload,
                phaseId: data.phaseId,
            }).unwrap();
        } catch (error) {
            console.error('Failed to update anytime item:', error);
        }
    };

    const handleMeasurementPress = (item: AnytimeItem) => {
        if (item.type === 'MEASUREMENT' && item.status !== 'DONE') {
            if (item.measurement?.type === 'WEIGHT') {
                onClose();
                navigation.navigate(ROUTES.WEIGHT_MEASUREMENT, {
                    measurementPhaseItem: item,
                    date: date || moment().format('YYYY-MM-DD'),
                });
                return;
            }
            setSelectedMeasurement(item as AnytimeMeasurementItem);
        }
    };

    const closeMeasurementModal = () => {
        setSelectedMeasurement(null);
    };

    // Calculate modal style based on mode
    const getModalStyle = () => {
        const baseStyle = styles.modal;
        
        if (fullScreen) {
            return [baseStyle, { paddingBottom: insets.bottom }];
            // Align to below DayOverview header (menu + TimeSwitcher), full height to bottom
            // return [baseStyle, { top: headerHeight }];
        }
        
        // Partial mode
        const calculatedMaxHeight = maxHeight || SCREEN_HEIGHT * 0.8;
        return [
            baseStyle,
            {
                bottom: 0,
                top: undefined,
                borderTopWidth: 1,
                height: calculatedMaxHeight,
                borderTopColor: theme.colors.border,
                
            }
        ];
    };

    if (!visible) { return null; }

    return (
        <Modal transparent visible statusBarTranslucent animationType="none" onRequestClose={onClose}>
            <Animated.View
                entering={FadeIn.duration(900)}
                exiting={FadeOut.duration(180)}
                style={[styles.overlay, { top: insets.top + 50 }]}
            >
                <GlassSurface
                    tint="dark"
                    intensity={18}
                    style={StyleSheet.absoluteFill}
                />
                <TouchableOpacity
                    onPress={onClose}
                    activeOpacity={1}
                    style={StyleSheet.absoluteFill}
                />

                <Animated.View
                    style={[getModalStyle(), { backgroundColor: theme.colors.surface }]}
                    entering={SlideInDown.springify().mass(1).damping(30)}
                    exiting={SlideOutDown.duration(220)}
                >
                    <View style={[styles.header, { backgroundColor: theme.colors.surfaceAlt, borderBottomColor: theme.colors.border }]}>
                        <View style={styles.headerLeft}>
                            {/* <View style={styles.badgeContainer}> */}
                            <Badge count={pendingItems.length} bgColor={theme.colors.aqua} showZero>
                                {getIconComponent(icon, 24)}
                            </Badge>
                            {/* </View> */}
                            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                                {title}
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={onClose}
                            disabled={disabled}
                            style={styles.closeButton}
                        >
                            <CloseIcon size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        {icon === 'ruler' ? (
                            <ScrollView style={styles.scrollView}>
                                {pendingItems.map(item => (
                                    <AnytimeListItem
                                        item={item}
                                        disabled={disabled}
                                        key={`pending-${item.id}`}
                                        isFutureDate={isFutureDate}
                                        onUpdateItem={handleUpdateItem}
                                        onPress={() => handleMeasurementPress(item)}
                                    />
                                ))}
                                {completedItems.map(item => (
                                    <AnytimeListItem
                                        item={item}
                                        disabled={disabled}
                                        isFutureDate={isFutureDate}
                                        key={`completed-${item.id}`}
                                        onUpdateItem={handleUpdateItem}
                                        onPress={() => handleMeasurementPress(item)}
                                    />
                                ))}
                            </ScrollView>
                        ) : icon === 'running' ? (
                            <View style={styles.emptyState}>
                                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                                Exercise functionality will be implemented separately
                                </Text>
                            </View>
                        ) : items.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No items found</Text>
                            </View>
                        ) : (
                            <ScrollView style={styles.scrollView}>
                                {pendingItems.map(item => (
                                    <AnytimeListItem
                                        item={item}
                                        disabled={disabled}
                                        key={`pending-${item.id}`}
                                        isFutureDate={isFutureDate}
                                        onUpdateItem={handleUpdateItem}
                                    />
                                ))}
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
                </Animated.View>
                {selectedMeasurement && (
                    <MeasurementInputModal
                        disabled={disabled}
                        item={selectedMeasurement}
                        visible={!!selectedMeasurement}
                        onClose={closeMeasurementModal}
                    />
                )}
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
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
        paddingVertical: 20,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        backgroundColor: '#E0EBF7',
        justifyContent: 'space-between',
        borderBottomColor: COLORS.LIGHTER_GREY,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        marginLeft: 16,
        color: '#181818',
        fontWeight: '700',
    },
    closeButton: {
        // padding: 8,
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
        paddingVertical: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#808080',
        textAlign: 'center',
    },
});
