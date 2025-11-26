// outsource dependencies
import React from 'react';
import moment from 'moment';
import { useSelector } from 'react-redux';
import { Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

// local dependencies
import { RootState } from 'store';
import Text from 'components/Text.tsx';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import { MessageItem } from 'types/messenger.ts';
import ProfileImage from 'components/ProfileImage.tsx';
import { MessageEntity } from 'types/common/interfaces.ts';

// configure
interface MessageProps extends MessageItem {
  goToMessage: (message: MessageEntity) => void;
}

export const Message = ({ owner, collocutor, date, subject, messagesCount, lastMessage, attachmentCount, goToMessage, id }: MessageProps) => {
    const theme = useTheme();
    const user = useSelector((state: RootState) => state.app.user);
    const isIncoming = user?.id !== owner?.id;
    const companion = isIncoming ? owner : collocutor;
    const handlePress = () => goToMessage({ id, subject });

    return <Pressable style={[styles.container, { backgroundColor: lastMessage?.isRead ? theme.colors.white : theme.colors.lightGrey }]}>
        <View style={[styles.row, styles.alignItems]}>
            <View style={[styles.unreadDot, { backgroundColor: lastMessage?.isRead ? 'transparent' : theme.colors.primary }]} />
            <ProfileImage uri={owner?.coverImage?.url} />
        </View>
        <View style={styles.messageInfoContainer}>
            <View style={styles.row}>
                <View style={styles.shrink}>
                    <View style={styles.row}>
                        <View style={[
                            styles.badge,
                            {
                                borderColor: theme.colors.grey,
                                backgroundColor: theme.colors.lighterGrey,
                            }
                        ]}>
                            <Icon
                                color={theme.colors.grey}
                                name={isIncoming ? 'angle-double-left' : 'angle-double-right'}
                            />
                        </View>
                        <Text
                            variant="caption"
                            numberOfLines={1}
                            style={styles.shrink}
                        >
                            { isIncoming ? 'From:' : 'To:' }
                                &nbsp;
                            { companion?.name }
                        </Text>
                    </View>
                    <Text
                        numberOfLines={1}
                        style={styles.shrink}
                    >
                        { subject }
                            &nbsp;
                        { messagesCount }
                    </Text>
                    <Text numberOfLines={1} style={styles.shrink}>
                        {lastMessage?.text.replace(/<\/?[^>]+(>|$)/g, '')}
                    </Text>
                </View>
            </View>
        </View>
        <View style={styles.additionalInfoWrapper}>
            <Text color={theme.colors.grey}>
                { moment(date).format('DD MMM') }
            </Text>
            { attachmentCount ? <Icon name="paperclip" size={16} color={theme.colors.grey} /> : null }
        </View>
    </Pressable>;
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingVertical: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.POINT * 2
    },
    image: {
        width: '100%',
        height: '100%',
    },
    messageInfoContainer: {
        flex: 1,
        marginLeft: OFFSET.POINT * 2
    },
    badge: {
        borderWidth: 0.3,
        paddingHorizontal: OFFSET.POINT,
        paddingVertical: OFFSET.POINT / 2,
        marginRight: OFFSET.POINT
    },
    additionalInfoWrapper: {
        marginHorizontal: OFFSET.POINT,
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    unreadDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: OFFSET.POINT,
    },
    row: {
        flexDirection: 'row',
    },
    shrink: {
        flexShrink: 1
    },
    alignItems: {
        alignItems: 'center',
    }
});
