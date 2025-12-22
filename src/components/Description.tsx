// outsource dependencies
import Icon from '@react-native-vector-icons/ionicons';
import React, { useState, useCallback, memo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ViewStyle, Modal, ScrollView } from 'react-native';

// local dependencies
import { OFFSET } from 'constants/offset';
import { useTheme } from 'hooks/useTheme';
import YoutubeVideo from './YoutubeVideo';
import { PrivateVideo } from './PrivateVideo';
import HTMLView, { RenderNodeProps } from './HTMLView';

interface VideoAttachment {
    status?: string;
    embedUrl?: string;
    id: string | number;
}

interface DescriptionProps {
    style?: ViewStyle;
    isActive: boolean;
    description: string;
    onClose: () => void;
    video?: VideoAttachment | null;
}

const Description: React.FC<DescriptionProps> = memo(
    ({ style, video, onClose, isActive, description }) => {
        const theme = useTheme();
        const [showDescription, setShowDescription] = useState(false);
        const isVideoEnabled = Boolean(video);
        const toggleText = useCallback(() => {
            setShowDescription(prevState => !prevState);
        }, []);

        const renderNode = useCallback((props: RenderNodeProps) => {
            const { node, defaultRenderer, parent } = props;

            if (node.data === '\n') {
                return <View key={Math.random()} />;
            }

            if (node.name === 'li') {
                const renderedChildren = defaultRenderer(node.children, parent);

                return (
                    <View key={Math.random()} style={styles.htmlViewTextContainer}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={htmlStyles.li}>{renderedChildren}</Text>
                    </View>
                );
            }

            return undefined;
        }, []);

        const renderContent = useCallback(() => {
            if (isVideoEnabled) {
                if (showDescription) {
                    return (
                        <HTMLView
                            value={description}
                            // renderNode={renderNode}
                            stylesheet={htmlStyles}
                        />
                    );
                }

                if (video?.embedUrl) {
                    return <YoutubeVideo url={video.embedUrl} height={250} />;
                }

                if (video) {
                    return <PrivateVideo video={video} height={250} />;
                }

                return null;
            }

            return (
                <HTMLView
                    value={description}
                    // renderNode={renderNode}
                    stylesheet={htmlStyles}
                />
            );
        }, [isVideoEnabled, showDescription, video, description]);

        const renderActionButton = useCallback(() => {
            if (isVideoEnabled) {
                return (
                    <TouchableOpacity onPress={toggleText} style={styles.actionButton}>
                        <Text style={[styles.helpLink, { color: theme.colors.blue }]}>
                            {showDescription ? 'Back to Video' : 'Show Description'}
                        </Text>
                    </TouchableOpacity>
                );
            }

            return (
                <TouchableOpacity onPress={onClose} style={styles.actionButton}>
                    <Text style={[styles.helpLink, { color: theme.colors.blue }]}>
                        Close
                    </Text>
                </TouchableOpacity>
            );
        }, [isVideoEnabled, showDescription, toggleText, onClose, theme]);

        return (
            <Modal
                transparent
                visible={isActive}
                animationType="slide"
                onRequestClose={onClose}
                // presentationStyle="pageSheet"
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }, style]}>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.closeButton}
                        >
                            <View style={[styles.closeButtonIcon, { backgroundColor: theme.colors.darkGrey }]}>
                                <Icon name="close" size={20} color={theme.colors.white} />
                            </View>
                        </TouchableOpacity>

                        <ScrollView
                            style={styles.scrollView}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={true}
                        >
                            <View style={styles.content}>
                                {renderContent()}
                                {renderActionButton()}
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        );
    }
);

Description.displayName = 'Description';

export default Description;

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
        minHeight: '55%',
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingBottom: OFFSET.VERTICAL * 2,
    },
    content: {
        paddingTop: OFFSET.VERTICAL * 3,
    },
    htmlViewTextContainer: {
        width: '90%',
        flexDirection: 'row',
        paddingRight: 4,
        marginVertical: 2,
    },
    bullet: {
        marginRight: 8,
        marginTop: 5,
        fontSize: 16,
    },
    helpLink: {
        fontSize: 16,
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
    actionButton: {
        marginLeft: 'auto',
        marginTop: OFFSET.VERTICAL,
        marginRight: OFFSET.HORIZONTAL,
        marginBottom: OFFSET.VERTICAL * 2,
    },
});

const htmlStyles = StyleSheet.create({
    p: {
        fontSize: 16,
        marginBottom: 10,
        color: '#333',
        lineHeight: 24,
    },
    strong: {
        fontWeight: 'bold',
    },
    b: {
        fontWeight: 'bold',
    },
    em: {
        fontStyle: 'italic',
    },
    ins: {
        textDecorationLine: 'underline',
    },
    u: {
        textDecorationLine: 'underline',
    },
    li: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        marginVertical: 5,
        paddingRight: OFFSET.VERTICAL * 2,
        lineHeight: 24,
    },
    ul: {
        marginLeft: 15,
        marginVertical: 5,
    },
});
