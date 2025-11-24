// outsource dependencies
import Toast from 'react-native-toast-message';
import React, { useEffect, useState } from 'react';
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
import { useGetChainMessagesQuery } from 'store/api/messengerServiceApi.ts';
import { Message } from 'screens/privateScreens/Messenger/components/MessageItem.tsx';

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
            // NOTE Need check to fix redirect issue
            rowMap[rowKey] && rowMap[rowKey].closeRow();
        }, 3 * 1000);
    };

    const renderHiddenItem = ({ item }: {item: MessageItem}) => <Pressable
        // onPress={() => this.props.deleteItem([{ id: item.id }])}
        style={[styles.button, { backgroundColor: 'red' }]}
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
                text1: 'Update failed',
                text2: 'Something went wrong while updating your information. Please try again later.',
            });
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <Screen initialized={initialized}>
            <SwipeListView
                useFlatList
                disableRightSwipe
                onRowOpen={onRowOpen}
                initialNumToRender={10}
                data={messages?.data ?? []}
                rightOpenValue={-ITEM_HIDDEN_SIZE}
                renderHiddenItem={renderHiddenItem}
                contentContainerStyle={styles.flexGrow}
                keyExtractor={({ id }) => id.toString()}
                renderItem={({ item }) => <Message {...item } />}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefreshControl} />}
                ItemSeparatorComponent={() => <View style={[styles.separator, { borderColor: theme.colors.lighterGrey }]} />}
                ListFooterComponent={() => <View style={[styles.separator, { borderColor: theme.colors.lighterGrey }]} />}
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
