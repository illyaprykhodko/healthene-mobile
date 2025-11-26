// outsource dependencies
import React from 'react';
import { StyleSheet, View } from 'react-native';

// local dependencies
import Text from 'components/Text.tsx';

interface MessageScreenProps {
  // props here
}

const MessageScreen = (props: MessageScreenProps) => {
    return <View style={styles.container}>
        <Text>HELLO</Text>
    </View>;
};

export default MessageScreen;

const styles = StyleSheet.create({
    container: {
    // style here
    },
});
