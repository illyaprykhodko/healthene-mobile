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
import PrivateVideo from 'components/PrivateVideo';

interface PlayContainerProps {
    data: PatientFoodCategoryAttachment;
    onClose?: () => void;
}

export const PlayContainer = memo(({ data, onClose }: PlayContainerProps) => {
    const theme = useTheme();
    console.log('data', data);
    const embedUrl = data.attachment?.embedUrl;
    const isYoutube = embedUrl ? 'youtube' : 'attachment';
    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.content}>
                <Text variant="h4" style={{ color: theme.colors.text }}>
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
        justifyContent: 'space-between',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    closeButtonContainer: {
        paddingTop: OFFSET.VERTICAL,
        paddingBottom: OFFSET.VERTICAL,
    },
    closeButton: {
        width: '100%',
    },
});
