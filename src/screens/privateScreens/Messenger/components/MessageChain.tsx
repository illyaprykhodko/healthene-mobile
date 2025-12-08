// outsource dependencies
import Toast from 'react-native-toast-message';
import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';

// local dependencies
import { OFFSET } from 'constants/offset.ts';
import { useGetMessagesChainQuery } from 'store/api/messengerApi.ts';
import MessageChainItem from 'screens/privateScreens/Messenger/components/MessageChainItem.tsx';

interface MessageChainProps {
  id: number
}

const MessageChain = ({ id }: MessageChainProps) => {
    // Handle message chain
    const [page, setPage] = useState<number>(1);
    const { data: messageChain, refetch } = useGetMessagesChainQuery({ chainId: id, params: { page, size: 10 } });

    // Lazy load handle
    const loadMore = useCallback(() => {
        if (messageChain && messageChain.page < messageChain.totalPages) {
            setPage(messageChain.page + 1);
        }
    }, [messageChain, setPage]);

    // Refresh control
    const [refreshing, setRefreshing] = useState(false);
    const handleRefreshControl = async () => {
        try {
            setRefreshing(true);
            await refetch();
            setPage(0);
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Couldn’t refresh messages',
                text2: 'Something went wrong while updating messages. Please try again later.',
            });
        } finally {
            setRefreshing(false);
        }
    };

    return <FlatList
        onEndReached={loadMore}
        style={styles.container}
        onEndReachedThreshold={0.6}
        data={messageChain?.data ?? []}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.flexGrow}
        renderItem={({ item }) => <MessageChainItem key={item.id} {...item} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefreshControl} />}
    />;
};

export default MessageChain;

const styles = StyleSheet.create({
    container: {
        marginVertical: OFFSET.VERTICAL
    },
    flexGrow: {
        flexGrow: 1
    }
});
