// outsource dependencies
import React, { useCallback } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { useSelector, useDispatch } from 'react-redux';
import Icon from '@react-native-vector-icons/fontawesome5';
import { Pressable, StyleSheet, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';

// local dependencies
import { RootState } from 'store';
import Text from 'components/Text.tsx';
import Screen from 'components/Screen.tsx';
import { useTheme } from 'hooks/useTheme.ts';
import { ROUTES } from 'constants/routes.ts';
import { OFFSET } from 'constants/offset.ts';
import { RootStackParamList } from 'services/navigation';
import { useGetMessageQuery } from 'store/api/messengerApi.ts';
import MessageChain from 'screens/privateScreens/Messenger/components/MessageChain.tsx';

type ReadMessageRoute = RouteProp<RootStackParamList, typeof ROUTES.READ_MESSAGE>;

const ReadMessageScreen = () => {
    const theme = useTheme();
    const dispatch = useDispatch();

    // NOTE Route params take precedence so the screen can be opened directly
    // from a deep link / push notification without the messenger list having
    // primed `state.messenger.reply` first.
    const route = useRoute<ReadMessageRoute>();
    const replyMessage = useSelector((state: RootState) => state.messenger.reply);
    const chainId = route.params?.id ?? route.params?.chainId ?? replyMessage?.id;
    const { data, isLoading } = useGetMessageQuery(chainId ? { id: chainId } : skipToken);

    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const goToWriteMessage = useCallback(() => navigation.navigate(ROUTES.WRITE_MESSAGE), [dispatch, navigation]);
    return <Screen initialized={!isLoading} style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.subject} variant="h4" color={theme.colors.darkGrey}>{data?.subject}</Text>
            <Pressable onPress={goToWriteMessage} hitSlop={8}>
                <Icon iconStyle="solid" name="reply" color={theme.colors.grey} size={24} />
            </Pressable>
        </View>
        {chainId ? <MessageChain id={chainId}/> : null}
    </Screen>;
};

export default ReadMessageScreen;

const styles = StyleSheet.create({
    container: {
        paddingVertical: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    subject: {
        flex: 1,
        marginRight: OFFSET.HORIZONTAL,
    },
});
