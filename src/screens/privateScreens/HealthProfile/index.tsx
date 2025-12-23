// outsource dependencies
import React from 'react';
import { StyleSheet, View } from 'react-native';

// local dependencies
import Text from 'components/Text.tsx';

interface HealthProfileProps {
  // props here
}

const HealthProfile = (props: HealthProfileProps) => {
    return <View style={styles.container}>
        <Text>HELLo</Text>
    </View>;
};

export default HealthProfile;
const styles = StyleSheet.create({
    container: {
    // style here
    },
});
