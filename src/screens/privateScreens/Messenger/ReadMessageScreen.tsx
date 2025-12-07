// outsource dependencies
import React from 'react';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { Pressable, StyleSheet, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';

// local dependencies
import Text from 'components/Text.tsx';
import Screen from 'components/Screen.tsx';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import { RootStackParamList } from 'services/navigation';
import { useGetMessageQuery } from 'store/api/messengerApi.ts';
import MessageChain from 'screens/privateScreens/Messenger/components/MessageChain.tsx';

type ReadMessageScreenProp = RouteProp<RootStackParamList, 'ReadMessagesScreen'>;

const ReadMessageScreen = () => {
    const theme = useTheme();
    const route = useRoute<ReadMessageScreenProp>();
    const messageId = route.params.id;
    const { data, isLoading } = useGetMessageQuery({ id: messageId });
    return <Screen initialized={!isLoading} style={styles.container}>
        <View style={styles.header}>
            <Text variant="h4" color={theme.colors.darkGrey}>{data?.subject}</Text>
            <Pressable>
                <Icon name="reply" color={theme.colors.grey} size={24} />
            </Pressable>
        </View>
        <MessageChain id={messageId} />
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
