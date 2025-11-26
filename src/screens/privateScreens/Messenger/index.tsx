// outsource dependencies
import Toast from 'react-native-toast-message';
import React, { useCallback, useEffect, useState } from 'react';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { SwipeListView } from 'react-native-swipe-list-view';
import { Pressable, StyleSheet, View, RefreshControl } from 'react-native';

// local dependencies
import Text from 'components/Text.tsx';
import Screen from 'components/Screen.tsx';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import { Button } from 'components/Button.tsx';
import { MessageItem } from 'types/messenger.ts';
import { MessageService } from 'services/messages';
import { Message } from 'screens/privateScreens/Messenger/components/MessageItem.tsx';
import { useGetChainMessagesQuery, useDeleteChainsMutation } from 'store/api/messengerApi.ts';

interface RowMap {
    [key: string]: { closeRow: () => void } | undefined;
}

const ITEM_HIDDEN_SIZE = 100;

const MessengerList = () => {
    const theme = useTheme();
    const [page, setPage] = useState(0);
    const { data: messages, refetch } = useGetChainMessagesQuery({
        params: { page },
    });

    // Handle delete chain messages
    const [deleteChain] = useDeleteChainsMutation();
    const handleDelete = async (item: [{id: number}]) => {
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
        if (messages) {
            setInitialized(true);
        }
    }, [messages]);

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

    // Lazy load handle
    const loadMore = useCallback(() => {
        if (messages && messages.page < messages.totalPages) {
            setPage(messages.page + 1);
        }
    }, [messages, setPage]);

    return (
        <Screen initialized={initialized}>
            <SwipeListView
                useFlatList
                disableRightSwipe
                onRowOpen={onRowOpen}
                initialNumToRender={10}
                onEndReached={loadMore}
                onEndReachedThreshold={0.6}
                data={messages?.data ?? []}
                rightOpenValue={-ITEM_HIDDEN_SIZE}
                renderHiddenItem={renderHiddenItem}
                contentContainerStyle={styles.flexGrow}
                keyExtractor={({ id }) => id.toString()}
                renderItem={({ item }) => <Message {...item } />}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefreshControl} />}
                ItemSeparatorComponent={() => <View style={[styles.separator, { borderColor: theme.colors.lighterGrey }]} />}
            />
            <Button
                variant="outline"
                title="NEW MESSAGE"
                // onPress={handleLogout}
                style={styles.btn}
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
    },
    flexGrow: {
        flexGrow: 1
    }
});
