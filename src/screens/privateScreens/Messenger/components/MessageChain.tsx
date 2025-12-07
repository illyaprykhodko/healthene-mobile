// outsource dependencies
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { FlatList, StyleSheet } from 'react-native';

// local dependencies
import { RootState } from 'store';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import { useGetMessagesChainQuery } from 'store/api/messengerApi.ts';
import MessageChainItem from 'screens/privateScreens/Messenger/components/MessageChainItem.tsx';

interface MessageChainProps {
  id: number
}

const MessageChain = ({ id }: MessageChainProps) => {
    const theme = useTheme();
    const user = useSelector((state: RootState) => state.app.user);

    // Handle message chain
    const [page, setPage] = useState<number>(0);
    const { data: messageChain } = useGetMessagesChainQuery({ chainId: id, params: { page: 0, size: 10 } });

    console.log('DATA', messageChain);
    return <FlatList
        style={styles.container}
        data={messageChain?.data ?? []}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <MessageChainItem key={item.id} {...item} />}
    />;
};

export default MessageChain;

const styles = StyleSheet.create({
    container: {
        marginVertical: OFFSET.VERTICAL
    },
});
