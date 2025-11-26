// outsource dependencies
import React from 'react';
import moment from 'moment';
import { useSelector } from 'react-redux';
import { Image, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import FeatherIcon from 'react-native-vector-icons/Feather';

// local dependencies
import { RootState } from 'store';
import Text from 'components/Text.tsx';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import { MessageItem } from 'types/messenger.ts';

// configure
const IMAGE_SIZE = 48;
interface MessageProps extends MessageItem{
     // props here
}

export const Message = ({ owner, collocutor, date, subject, messagesCount, lastMessage, attachmentCount }: MessageProps) => {
    const theme = useTheme();
    const user = useSelector((state: RootState) => state.app.user);
    const isIncoming = user?.id !== owner?.id;
    const companion = isIncoming ? owner : collocutor;

    return <View style={[styles.container, { backgroundColor: lastMessage?.isRead ? theme.colors.white : theme.colors.lightGrey }]}>
        <View style={[styles.row, styles.alignItems]}>
            <View style={[styles.unreadDot, { backgroundColor: lastMessage?.isRead ? 'transparent' : theme.colors.primary }]} />
            {owner?.coverImage?.url
                ? <View style={styles.imageContainer}>
                    <Image source={{ uri: owner?.coverImage.url }} style={styles.image} />
                </View>
                : <FeatherIcon size={48} name="user" />
            }
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
    </View>;
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingVertical: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.POINT * 2
    },
    imageContainer: {
        width: IMAGE_SIZE,
        height: IMAGE_SIZE,
        borderRadius: IMAGE_SIZE / 2,
        overflow: 'hidden',
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

