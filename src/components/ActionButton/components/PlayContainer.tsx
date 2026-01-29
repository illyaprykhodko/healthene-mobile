// outsource dependencies
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

// local dependencies
import Text from 'components/Text.tsx';
import { useTheme } from 'hooks/useTheme.ts';
import { Button } from 'components/Button.tsx';
import { OFFSET } from 'constants/offset.ts';
import YoutubeVideo from 'components/YoutubeVideo';
import { PatientFoodCategoryAttachment } from 'types/overview.ts';

interface PlayContainerProps {
    data: PatientFoodCategoryAttachment;
    onClose?: () => void;
}

export const PlayContainer = memo(({ data, onClose }: PlayContainerProps) => {
    const theme = useTheme();
    const embedUrl = data.attachment?.embedUrl;
    const isYoutube = embedUrl ? 'youtube' : 'attachment';
    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.content}>
                <Text variant="h3" color={theme.colors.text} style={styles.title}>
                    {data.attachment?.title}
                </Text>
                {isYoutube === 'youtube' && embedUrl ? <YoutubeVideo url={embedUrl} /> : null}
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

PlayContainer.displayName = 'PlayContainer';

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    title: {
        marginBottom: OFFSET.VERTICAL,
    },
    content: {
        justifyContent: 'center',
    },
    closeButtonContainer: {
        marginTop: 'auto',
        paddingTop: OFFSET.VERTICAL,
        paddingBottom: OFFSET.VERTICAL,
    },
    closeButton: {
        width: '100%',
    },
});
