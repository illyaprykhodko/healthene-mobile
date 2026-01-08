
// outsource dependencies
import React from 'react';
import { View, StyleSheet } from 'react-native';

// local dependencies
import Text from 'components/Text';
import { OFFSET } from 'constants/offset';
import VeggieEmojiRail from './VeggieEmojiRail';

const GenerateShoppingListSkeleton: React.FC = () => {
    return (
        <View style={styles.container}>
            <Text variant="h3" style={styles.title}>
                Generating your shopping list…
            </Text>
            <VeggieEmojiRail count={7} gap={15} size={30} />
        </View>
    );
};

export default GenerateShoppingListSkeleton;
const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: OFFSET.HORIZONTAL,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: OFFSET.VERTICAL * 5,
    },
    title: {
        marginBottom: 20,
    },
});
