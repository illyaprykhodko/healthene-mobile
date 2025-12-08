// outsource dependencies
import Animated, {
    withTiming,
    useSharedValue,
    useDerivedValue,
    useAnimatedStyle
} from 'react-native-reanimated';
import moment from 'moment/moment';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { Pressable, StyleSheet, View } from 'react-native';
import HTMLView, { HTMLViewNode, HTMLViewNodeRenderer } from 'react-native-htmlview';

// local dependencies
import { RootState } from 'store';
import Text from 'components/Text.tsx';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import { MessageChain } from 'types/messenger.ts';
import ProfileImage from 'components/ProfileImage.tsx';

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

}

const MessageChainItem = ({ sender, date, text }: MessageChainItemProps) => {
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
        <View style={styles.sender}>
            <ProfileImage uri={sender?.coverImage?.url}/>
            <View style={styles.senderInfo}>
                <Text>{sender?.id === user?.id ? 'You' : sender?.name}</Text>
                {
                    date
                        ? <Text color={theme.colors.grey}>
                            {moment(date).fromNow()}
                        </Text>
                        : null
                }
            </View>
            <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} color={theme.colors.black} size={16}
                style={styles.chevronIcon}/>
        </View>
        <Animated.View style={[styles.animatedView, animatedStyle]}>
            <View style={styles.wrapper} onLayout={e => {
                contentHeight.value = e.nativeEvent.layout.height;
            }}>
                <HTMLView
                    value={text}
                    renderNode={renderNode}
                />
            </View>
        </Animated.View>
    </Pressable>;
};

export default MessageChainItem;

const styles = StyleSheet.create({
    itemContainer: {
        paddingVertical: OFFSET.POINT * 2,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    sender: {
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
});
