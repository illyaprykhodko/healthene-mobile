// outsource dependencies
import Icon from 'react-native-vector-icons/Ionicons';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
    BottomSheetModal,
    BottomSheetView,
    BottomSheetBackdrop,
    BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';

// local dependencies
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';

export interface SwipeablePanelProps {
    style?: ViewStyle;
    isActive: boolean;
    onClose: () => void;
    fullWidth?: boolean;
    openLarge?: boolean;
    onlyLarge?: boolean;
    children: React.ReactNode;
    closeIconStyle?: ViewStyle;
    closeRootStyle?: ViewStyle;
    showCloseButton?: boolean;
    closeOnTouchOutside?: boolean;
    enablePanDownToClose?: boolean;
    onPressCloseButton?: () => void;
    snapPoints?: (string | number)[];
}

export interface SwipeablePanelRef {
    close: () => void;
    expand: () => void;
    collapse: () => void;
}

export const SwipeablePanel = forwardRef<SwipeablePanelRef, SwipeablePanelProps>(
    (
        {
            style,
            onClose,
            isActive,
            children,
            closeIconStyle,
            closeRootStyle,
            onPressCloseButton,
            showCloseButton = true,
            closeOnTouchOutside = true,
            snapPoints = ['50%', '80%'],
            enablePanDownToClose = true,
        },
        ref
    ) => {
        const theme = useTheme();
        const bottomSheetRef = useRef<BottomSheetModal>(null);

        // Expose methods to parent component
        useImperativeHandle(ref, () => ({
            close: () => bottomSheetRef.current?.close(),
            expand: () => bottomSheetRef.current?.expand(),
            collapse: () => bottomSheetRef.current?.collapse(),
        }));

        // Handle sheet open/close based on isActive prop
        useEffect(() => {
            if (isActive) {
                bottomSheetRef.current?.present();
            } else {
                bottomSheetRef.current?.close();
            }
        }, [isActive]);

        // Render custom backdrop with tap to close
        const renderBackdrop = useCallback(
            (props: BottomSheetBackdropProps) => (
                <BottomSheetBackdrop
                    {...props}
                    opacity={0.5}
                    appearsOnIndex={0}
                    disappearsOnIndex={-1}
                    pressBehavior={closeOnTouchOutside ? 'close' : 'none'}
                />
            ),
            [closeOnTouchOutside]
        );

        const handleSheetChanges = useCallback(
            (index: number) => {
                if (index === -1) {
                    onClose();
                }
            },
            [onClose]
        );

        const handleClosePress = useCallback(() => {
            if (onPressCloseButton) {
                onPressCloseButton();
            } else {
                onClose();
            }
            bottomSheetRef.current?.close();
        }, [onClose, onPressCloseButton]);

        return (
            <BottomSheetModal
                ref={bottomSheetRef}
                snapPoints={snapPoints}
                onChange={handleSheetChanges}
                backdropComponent={renderBackdrop}
                enablePanDownToClose={enablePanDownToClose}
                backgroundStyle={[
                    styles.bottomSheetBackground,
                    { backgroundColor: theme.colors.surface },
                ]}
                handleIndicatorStyle={{
                    backgroundColor: theme.colors.grey,
                }}
            >
                <BottomSheetView style={[styles.contentContainer, style]}>
                    {showCloseButton && (
                        <TouchableOpacity
                            onPress={handleClosePress}
                            style={[styles.closeButton, closeRootStyle]}
                        >
                            <View
                                style={[
                                    styles.closeButtonIcon,
                                    { backgroundColor: theme.colors.darkGrey },
                                    closeIconStyle,
                                ]}
                            >
                                <Icon name="close" size={20} color={theme.colors.white} />
                            </View>
                        </TouchableOpacity>
                    )}
                    {children}
                </BottomSheetView>
            </BottomSheetModal>
        );
    }
);

SwipeablePanel.displayName = 'SwipeablePanel';

export default SwipeablePanel;

const styles = StyleSheet.create({
    bottomSheetBackground: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingBottom: OFFSET.VERTICAL,
    },
    closeButton: {
        position: 'absolute',
        top: OFFSET.VERTICAL / 2,
        right: OFFSET.HORIZONTAL,
        zIndex: 1000,
    },
    closeButtonIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

// interface SwipeablePanelProps {
//     style?: any;
//     isActive: boolean;
//     onClose: () => void;
//     // fullWidth?: boolean;
//     // openLarge?: boolean;
//     // onlyLarge?: boolean;
//     closeIconStyle?: any;
//     closeRootStyle?: any;
//     children: React.ReactNode;
//     showCloseButton?: boolean;
//     closeOnTouchOutside?: boolean;
//     onPressCloseButton?: () => void;
// }

// export const SwipeablePanel: React.FC<SwipeablePanelProps> = ({
//     style,
//     onClose,
//     isActive,
//     children,
//     closeIconStyle,
//     closeRootStyle,
//     onPressCloseButton,
//     showCloseButton = true,
//     closeOnTouchOutside = true,
// }) => {
//     const theme = useTheme();
//     if (!isActive) { return null; }

//     return (
//         <Modal
//             transparent
//             visible={isActive}
//             animationType="slide"
//             onRequestClose={onClose}
//         >
//             <View style={styles.overlay}>
//                 <TouchableOpacity
//                     activeOpacity={1}
//                     style={styles.overlayTouchable}
//                     onPress={closeOnTouchOutside ? onClose : undefined}
//                 />
//                 <View style={[styles.panel, { backgroundColor: theme.colors.surface }, style]}>
//                     {showCloseButton && (
//                         <TouchableOpacity
//                             onPress={onPressCloseButton || onClose}
//                             style={[styles.closeButton, closeIconStyle]}
//                         >
//                             <Text style={[styles.closeButtonText, { color: theme.colors.white }]}>×</Text>
//                         </TouchableOpacity>
//                     )}
//                     {children}
//                 </View>
//             </View>
//         </Modal>
//     );
// };

// const styles = StyleSheet.create({
//     overlay: {
//         flex: 1,
//         backgroundColor: 'rgba(0, 0, 0, 0.5)',
//         justifyContent: 'flex-end',
//     },
//     overlayTouchable: {
//         flex: 1,
//     },
//     panel: {
//         backgroundColor: COLORS.WHITE,
//         borderTopLeftRadius: 20,
//         borderTopRightRadius: 20,
//         maxHeight: '80%',
//         minHeight: '50%',
//     },
//     closeButton: {
//         position: 'absolute',
//         top: 10,
//         right: 10,
//         width: 30,
//         height: 30,
//         borderRadius: 15,
//         backgroundColor: '#A5A5A5',
//         justifyContent: 'center',
//         alignItems: 'center',
//         zIndex: 1,
//     },
//     closeButtonText: {
//         color: COLORS.WHITE,
//         fontSize: 18,
//         fontWeight: 'bold',
//     },
// });
