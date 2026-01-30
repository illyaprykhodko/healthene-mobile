// outsource dependencies
import {
    BottomSheetModal,
    BottomSheetView,
    BottomSheetBackdrop,
    BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import Icon from '@react-native-vector-icons/fontawesome5';
import React, { memo, useRef, useCallback, useState } from 'react';
import { StyleSheet, Pressable, View, ViewStyle } from 'react-native';

// local dependencies
import Text from 'components/Text.tsx';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import { PlayContainer } from './components/PlayContainer.tsx';
import { QuestionContainer } from './components/QuestionContainer.tsx';
import { PatientFoodCategoryAttachment, PatientFoodCategoryQuestion } from 'types/overview.ts';

type ModalType = 'play' | 'question';

interface ActionButtonProps {
    type: ModalType;
    style?: ViewStyle;
    disabled?: boolean;
    data: PatientFoodCategoryAttachment | PatientFoodCategoryQuestion;
}

export const ActionButton = memo(({ type, disabled = false, style, data }: ActionButtonProps) => {
    const theme = useTheme();
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const [modalType, setModalType] = useState<ModalType | null>(null);

    const openModal = useCallback(() => {
        setModalType(type);
        bottomSheetRef.current?.present();
    }, [type]);

    const closeModal = useCallback(() => {
        bottomSheetRef.current?.close();
        setModalType(null);
    }, []);

    const renderBackdrop = useCallback(
        (props: BottomSheetBackdropProps) => (
            <BottomSheetBackdrop
                {...props}
                opacity={0.5}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                pressBehavior="close"
            />
        ),
        []
    );

    const getIconName = () => {
        return type === 'play' ? 'play' : 'question';
    };

    const getLabel = () => {
        return type === 'play' ? 'Video' : 'Question';
    };

    const getButtonColor = () => {
        return type === 'play' ? theme.colors.red : theme.colors.blue;
    };

    const renderModalContent = () => {
        if (modalType === 'play') {
            return <PlayContainer data={data as PatientFoodCategoryAttachment} onClose={closeModal} />;
        }
        if (modalType === 'question') {
            return <QuestionContainer data={data as PatientFoodCategoryQuestion} onClose={closeModal} />;
        }
        return null;
    };

    const pressableStyle = [
        styles.pressable,
        {
            borderRadius: theme.borderRadius.xl,
            borderColor: theme.colors.border,
        },
        style,
    ];

    return (
        <>
            <Pressable
                onPress={openModal}
                disabled={disabled}
                style={pressableStyle}
            >
                <View
                    style={[
                        styles.button,
                        {
                            backgroundColor: getButtonColor(),
                            borderRadius: theme.borderRadius.xl,
                        },
                    ]}
                >
                    <Icon iconStyle="solid" name={getIconName()} size={16} color={theme.colors.white} />
                </View>
                <Text>{getLabel()}</Text>
            </Pressable>
            <BottomSheetModal
                ref={bottomSheetRef}
                enablePanDownToClose
                enableDynamicSizing={false}
                backdropComponent={renderBackdrop}
                snapPoints={[type === 'play' ? '100%' : '95%']}
                backgroundStyle={[
                    styles.bottomSheetBackground,
                    { backgroundColor: theme.colors.surface },
                ]}
                handleIndicatorStyle={{
                    backgroundColor: theme.colors.grey,
                }}
            >
                <BottomSheetView style={[styles.contentContainer, type === 'play' && styles.playWrapper]}>
                    {renderModalContent()}
                </BottomSheetView>
            </BottomSheetModal>
        </>
    );
});

ActionButton.displayName = 'ActionButton';

const styles = StyleSheet.create({
    pressable: {
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: OFFSET.POINT,
        paddingHorizontal: OFFSET.POINT * 2,
    },
    button: {
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 30,
        minHeight: 30,
        marginRight: OFFSET.POINT,
    },
    bottomSheetBackground: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    contentContainer: {
        flex: 1,
        width: '100%',
        minHeight: '100%',
        paddingBottom: OFFSET.VERTICAL,
    },
    playWrapper: {
        paddingTop: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
});
