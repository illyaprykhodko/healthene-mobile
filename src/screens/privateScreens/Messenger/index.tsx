// outsource dependencies
import { useDispatch } from 'react-redux';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/fontawesome5';
import { SwipeListView } from 'react-native-swipe-list-view';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, RefreshControl } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeOut, LinearTransition, SlideInLeft } from 'react-native-reanimated';

// local dependencies
import Text from 'components/Text.tsx';
import Screen from 'components/Screen.tsx';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import { ROUTES } from 'constants/routes.ts';
import { Button } from 'components/Button.tsx';
import { MessageItem } from 'types/messenger.ts';
import { MessageService } from 'services/messages';
import { EmptyState } from 'components/EmptyState.tsx';
import { RootStackParamList } from 'services/navigation';
import { clearReplyMessage, setReplyMessage } from 'store/slices/messengerSlice.ts';
import { Message } from 'screens/privateScreens/Messenger/components/MessageItem.tsx';
import { useDeleteChainsMutation, useGetChainMessagesInfiniteQuery } from 'store/api/messengerApi.ts';

interface RowMap {
    [key: string]: { closeRow: () => void } | undefined;
}

const ITEM_HIDDEN_SIZE = 100;

const MessengerList = () => {
    const theme = useTheme();
    const dispatch = useDispatch();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const goToWriteMessage = () => navigation.navigate(ROUTES.WRITE_MESSAGE);
    const goToReadMessage = useCallback((item: MessageItem) => {
        dispatch(setReplyMessage(item));
        navigation.navigate(ROUTES.READ_MESSAGE);
    }, [dispatch, navigation]);
    const init = useCallback(() => dispatch(clearReplyMessage()), [dispatch]);

    // NOTE Native infinite query — RTK Query owns the `{ pages, pageParams }`
    // structure. Tag invalidation (`ListOfChain`) from `createChain` /
    // `replyToChain` / `deleteChains` automatically refetches every cached page
    // sequentially, so the new chain shows up on top without any manual cache
    // busting from the consumer side.
    const {
        data,
        refetch,
        isFetching,
        hasNextPage,
        fetchNextPage,
    } = useGetChainMessagesInfiniteQuery();
    const messages = useMemo(
        () => data?.pages.flatMap(p => p.content) ?? [],
        [data]
    );

    // Handle delete chain messages
    const [deleteChain] = useDeleteChainsMutation();
    const handleDelete = async (item: [{ id: number }]) => {
        const { value } = await MessageService.confirmation({
            uid: 'Address',
            title: 'Delete address',
            message: 'Are you sure you want to delete this address?',
        });

        if (!value) { return; }

        try {
            await deleteChain(item).unwrap();

            Toast.show({
                type: 'success',
                text1: 'Message deleted',
                text2: 'The message was successfully removed.',
            });
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Couldn’t delete message',
                text2: 'Please try again later.',
            });
        }
    };

    // Handle preloader
    const [initialized, setInitialized] = useState(false);
    useEffect(() => {
        if (data) {
            setInitialized(true);
        }
    }, [data]);

    // SwipeList handle
    const onRowOpen = (rowKey: string, rowMap: RowMap) => {
        setTimeout(() => {
            rowMap[rowKey] && rowMap[rowKey].closeRow();
        }, 3 * 1000);
    };

    const renderHiddenItem = ({ item }: {item: MessageItem}) => <Pressable
        onPress={() => handleDelete([{ id: item.id }])}
        style={[styles.button, { backgroundColor: theme.colors.red }]}
    >
        <Icon name="trash-alt" color={theme.colors.white} size={18} />
        <Text style={styles.listHiddenItemText} color={theme.colors.white}>Delete</Text>
    </Pressable>;

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

    // Lazy load handle
    const loadMore = useCallback(() => {
        if (!hasNextPage || isFetching) { return; }
        void fetchNextPage();
    }, [
        hasNextPage,
        isFetching,
        fetchNextPage,
    ]);

    return (
        <Screen initialized={initialized} init={init}>
            <SwipeListView
                useFlatList
                data={messages}
                disableRightSwipe
                onRowOpen={onRowOpen}
                initialNumToRender={10}
                onEndReached={loadMore}
                onEndReachedThreshold={0.6}
                rightOpenValue={-ITEM_HIDDEN_SIZE}
                renderHiddenItem={renderHiddenItem}
                contentContainerStyle={styles.flexGrow}
                keyExtractor={({ id }) => String(id)}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefreshControl} />}
                ItemSeparatorComponent={() => <View style={[styles.separator, { borderColor: theme.colors.grey }]} />}
                ListEmptyComponent={
                    <EmptyState
                        title="No Messages Yet!"
                        iconNode={
                            <Icon
                                size={120}
                                name="comments"
                                style={styles.emptyIcon}
                                color={theme.colors.grey}
                            />
                        }
                    />
                }
                renderItem={({ item, index }) => (
                    <Animated.View
                        // SlideInLeft keeps opacity at 1 throughout. FadeIn would let the SwipeListView's
                        // hidden red delete button bleed through during 0→1 opacity ramp on insert.
                        // First-batch stagger (cap at 10) gives a visible wave on initial render.
                        exiting={FadeOut.duration(220)}
                        layout={LinearTransition.springify().damping(20)}
                        entering={SlideInLeft.delay(Math.min(index, 10) * 100).springify().mass(1.5).damping(55)}
                    >
                        <Message key={item.id} {...item} goToReadMessage={() => goToReadMessage(item)} />
                    </Animated.View>
                )}
            />
            <Button
                variant="outline"
                style={styles.btn}
                title="NEW MESSAGE"
                onPress={goToWriteMessage}
            />
        </Screen>
    );
};

export default MessengerList;

const styles = StyleSheet.create({
    separator: {
        borderWidth: 1
    },
    listHiddenItem: {
        width: '100%',
        height: 90,
    },
    button: {
        flexGrow: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: ITEM_HIDDEN_SIZE,
        marginLeft: 'auto',
    },
    listHiddenItemText: {
        marginLeft: OFFSET.POINT
    },
    btn: {
        marginHorizontal: OFFSET.HORIZONTAL,
        marginBottom: OFFSET.VERTICAL,
        marginTop: OFFSET.POINT * 2,
    },
    flexGrow: {
        flexGrow: 1
    },
    emptyIcon: {
        marginBottom: OFFSET.VERTICAL,
    },
});
