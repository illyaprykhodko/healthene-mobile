// outsource dependencies
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

// local dependencies
import Text from 'components/Text.tsx';
import { useTheme } from 'hooks/useTheme.ts';
import { Button } from 'components/Button.tsx';
import { OFFSET } from 'constants/offset.ts';

interface QuestionContainerProps {
    onClose?: () => void;
}

export const QuestionContainer = memo(({ onClose }: QuestionContainerProps) => {
    const theme = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.content}>
                <Text variant="h2" style={{ color: theme.colors.text }}>
                    QuestionContainer
                </Text>
            </View>
            {onClose && (
                <View style={styles.closeButtonContainer}>
                    <Button
                        title="Close"
                        variant="outline"
                        onPress={onClose}
                        style={styles.closeButton}
                    />
                </View>
            )}
        </View>
    );
});

QuestionContainer.displayName = 'QuestionContainer';

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonContainer: {
        paddingTop: OFFSET.VERTICAL,
        paddingBottom: OFFSET.VERTICAL,
    },
    closeButton: {
        width: '100%',
    },
});
