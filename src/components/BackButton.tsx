import React from 'react';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { StyleSheet, TouchableOpacity } from 'react-native';

// local dependencies
import Text from 'components/Text.tsx';
import { OFFSET } from 'constants/offset.ts';
import { Theme } from 'styles/theme/types.ts';

interface BuckButtonProps {
  theme: Theme
  navigation: any,
}

const BuckButton = ({ theme, navigation }: BuckButtonProps) => {
    return <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
    >
        <Icon name="chevron-left" size={16} color={theme.colors.white} />
        <Text style={[{ color: theme.colors.white }, styles.backText]}>Back</Text>
    </TouchableOpacity>;
};

const styles = StyleSheet.create({
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backText: {
        fontSize: 16,
        marginLeft: OFFSET.HORIZONTAL / 2,
        fontWeight: '600',
    },
});

export default BuckButton;
