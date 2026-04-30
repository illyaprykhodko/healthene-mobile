// outsource dependencies
import Toast from 'react-native-toast-message';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';

// local dependencies
import { OFFSET } from 'constants/offset.ts';
import LoadingOverlay from 'components/LoadingOverlay.tsx';
import { useGetMessagesChainInfiniteQuery } from 'store/api/messengerApi.ts';
import MessageChainItem from 'screens/privateScreens/Messenger/components/MessageChainItem.tsx';

interface MessageChainProps {
  id: number
}

const MessageChain = ({ id }: MessageChainProps) => {
    const [preloader, setPreloader] = useState<boolean>(false);
    const {
        data,
        refetch,
        isFetching,
        hasNextPage,
        fetchNextPage,
    } = useGetMessagesChainInfiniteQuery(
        { chainId: id },
        { refetchOnFocus: true }
    );
    const messages = useMemo(
        () => data?.pages.flatMap(p => p.content) ?? [],
        [data]
    );

    const loadMore = useCallback(() => {
        if (!hasNextPage || isFetching) { return; }
        void fetchNextPage();
    }, [
        isFetching,
        hasNextPage,
        fetchNextPage,
    ]);

    // Refresh control
    const [refreshing, setRefreshing] = useState(false);
    const handleRefreshControl = async () => {
        try {
            setRefreshing(true);
            await refetch();
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

    return <>
        <LoadingOverlay init={preloader} />
        <FlatList
            data={messages}
            onEndReached={loadMore}
            style={styles.container}
            onEndReachedThreshold={0.6}
            showsVerticalScrollIndicator={false}
            keyExtractor={({ id }) => String(id)}
            contentContainerStyle={styles.flexGrow}
            renderItem={({ item }) => <MessageChainItem onPreloader={setPreloader} key={item.id} {...item} />}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefreshControl} />}
        />
    </>;
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
