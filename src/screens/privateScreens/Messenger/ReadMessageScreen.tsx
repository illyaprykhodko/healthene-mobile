// outsource dependencies
import React, { useCallback } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { Pressable, StyleSheet, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

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

const ReadMessageScreen = () => {
    const theme = useTheme();
    const dispatch = useDispatch();

    const message = useSelector((state: RootState) => state.messenger.reply);
    const { data, isLoading } = useGetMessageQuery(message?.id ? { id: message.id } : skipToken);

    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const goToWriteMessage = useCallback(() => navigation.navigate(ROUTES.WRITE_MESSAGE), [dispatch, navigation]);
    return <Screen initialized={!isLoading} style={styles.container}>
        <View style={styles.header}>
            <Text variant="h4" color={theme.colors.darkGrey}>{data?.subject}</Text>
            <Pressable onPress={goToWriteMessage}>
                <Icon name="reply" color={theme.colors.grey} size={24} />
            </Pressable>
        </View>
        {message?.id ? <MessageChain id={message?.id}/> : null}
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
        alignItems: 'center',
        justifyContent: 'space-between',
    }
});
