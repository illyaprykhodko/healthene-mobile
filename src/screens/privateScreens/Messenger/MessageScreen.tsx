// outsource dependencies
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

// local dependencies
import Text from 'components/Text.tsx';
import Screen from 'components/Screen.tsx';
import { OFFSET } from 'constants/offset.ts';

interface MessageScreenProps {
  // props here
}

const MessageScreen = (props: MessageScreenProps) => {
    return <Screen initialized={true} style={styles.container}>
        <ScrollView>
            <View>
                
            </View>
        </ScrollView>
    </Screen>;
};

export default MessageScreen;

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.VERTICAL,
    },
});
