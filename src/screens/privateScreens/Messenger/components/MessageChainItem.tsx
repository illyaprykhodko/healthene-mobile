// outsource dependencies
import Animated, {
    withTiming,
    useSharedValue,
    useDerivedValue,
    useAnimatedStyle
} from 'react-native-reanimated';
import moment from 'moment/moment';
import { useSelector } from 'react-redux';
import React, { memo, useState } from 'react';
import Icon from '@react-native-vector-icons/fontawesome5';
import { Pressable, StyleSheet, View } from 'react-native';
import HTMLView, { HTMLViewNode, HTMLViewNodeRenderer } from 'react-native-htmlview';

// local dependencies
import { RootState } from 'store';
import Text from 'components/Text.tsx';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import { MessageChain } from 'types/messenger.ts';
import ProfileImage from 'components/ProfileImage.tsx';
import Attachments from 'screens/privateScreens/Messenger/components/Attachments.tsx';

// configure
// eslint-disable-next-line max-params
const renderNode = (node: HTMLViewNode, index: number, _: HTMLViewNode[], parent: HTMLViewNode, defaultRenderer:HTMLViewNodeRenderer) => {
    if (node.name === 'p') {
        return (
            <View key={index}>
                {defaultRenderer(node.children, parent)}
            </View>
        );
    }
};

interface MessageChainItemProps extends MessageChain{
    onPreloader: (preloader: boolean) => void;
}

const MessageChainItem = memo(({ sender, date, text, attachments, onPreloader }: MessageChainItemProps) => {
    const theme = useTheme();
    const user = useSelector((state: RootState) => state.app.user);
    const [isExpanded, setExpanded] = useState(false);
    const expandedTrigger = () => setExpanded(prev => !prev);
    const contentHeight = useSharedValue(0);
    const derivedHeight = useDerivedValue(() =>
        withTiming(contentHeight.value * Number(isExpanded), {
            duration: 600
        })
    );
    const animatedStyle = useAnimatedStyle(() => ({
        height: derivedHeight.value,
    }));

    return <Pressable
        onPress={expandedTrigger}
        style={[styles.itemContainer, { borderColor: theme.colors.grey }]}
    >
        <View style={styles.row}>
            <ProfileImage uri={sender?.coverImage?.url}/>
            <View style={styles.senderInfo}>
                <Text>{sender?.id === user?.id ? 'You' : sender?.name}</Text>
                {
                    date
                        ? <Text color={theme.colors.grey}>{moment(date).fromNow()}</Text>
                        : null
                }
            </View>
            <Icon iconStyle="solid" name={isExpanded ? 'chevron-up' : 'chevron-down'} color={theme.colors.black} size={16} style={styles.chevronIcon}/>
        </View>
        <Animated.View style={[styles.animatedView, animatedStyle]}>
            <View
                style={styles.wrapper}
                onLayout={e => contentHeight.value = e.nativeEvent.layout.height}
            >
                <HTMLView
                    value={text}
                    renderNode={renderNode}
                />
                {
                    attachments.length
                        ? <View>
                            <View style={styles.row}>
                                <Icon iconStyle="solid" name="paperclip" size={20} color={theme.colors.darkGrey} style={styles.attachmentsTitleIcon} />
                                <Text color={theme.colors.darkGrey} variant="bold">
                                    {`Attachments Files (${attachments.length})`}
                                </Text>
                            </View>
                            {attachments.map(item => <Attachments onPreloader={onPreloader} key={item?.id} {...item}/>)}
                        </View>
                        : null
                }
            </View>
        </Animated.View>
    </Pressable>;
});

export default MessageChainItem;

const styles = StyleSheet.create({
    itemContainer: {
        paddingVertical: OFFSET.POINT * 2,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    row: {
        marginTop: OFFSET.POINT * 2,
        flexDirection: 'row',
        alignItems: 'center'
    },
    senderInfo: {
        marginHorizontal: OFFSET.POINT * 3,
    },
    chevronIcon: {
        marginLeft: 'auto',
        marginRight: OFFSET.POINT * 3,
    },
    animatedView: {
        width: '100%',
        overflow: 'hidden',
    },
    wrapper: {
        position: 'absolute',
        width: '100%',
        paddingVertical: OFFSET.VERTICAL
    },
    attachmentsTitleIcon: {
        marginRight: OFFSET.POINT * 2
    }
});
