// outsource dependencies
import React, { memo, useState } from 'react';
import Icon from '@react-native-vector-icons/fontawesome5';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';

// local dependencies
import Text from 'components/Text';
import { useTheme } from 'hooks/useTheme';

interface Ingredient {
    id: number | string;
    nameWithUnit: string;
}

interface IngredientsViewProps {
    style?: object;
    expandTrigger?: boolean;
    ingredients: Ingredient[];
}

const IngredientsView: React.FC<IngredientsViewProps> = ({ ingredients, style, expandTrigger }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const theme = useTheme();
    const handleToggle = () => {
        setIsExpanded(prev => !prev);
    };

    if (!ingredients || ingredients.length === 0) {
        return null;
    }

    return (
        <View>
            <View style={styles.chevronWrapper}>
                <TouchableOpacity onPress={handleToggle} style={styles.rowCenter}>
                    <Text style={styles.chevronText} color={theme.colors.blue}>
                        View Ingredients:{' '}
                    </Text>
                    <Icon
                        size={12}
                        iconStyle="solid"
                        color={theme.colors.blue}
                        name={(isExpanded || expandTrigger) ? 'chevron-up' : 'chevron-down'}
                    />
                </TouchableOpacity>
            </View>
            <ScrollView style={style} nestedScrollEnabled>
                {(isExpanded || expandTrigger)
                    && ingredients.map(item => (
                        <View key={item.id} style={styles.unitButton}>
                            <View style={styles.rowCenter}>
                                <Text style={styles.bullet}>{'\u2022'}</Text>
                                <Text textAlign="left" style={styles.unitName}>
                                    {item?.nameWithUnit}
                                </Text>
                            </View>
                        </View>
                    ))}
            </ScrollView>
        </View>
    );
};

export default memo(IngredientsView);

const styles = StyleSheet.create({
    center: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    unitName: {
        textTransform: 'capitalize',
        fontSize: 12,
        fontWeight: '400',
    },
    unitButton: {
        paddingVertical: 3,
    },
    bullet: {
        fontSize: 14,
        color: 'black',
        marginRight: 5,
    },
    chevronWrapper: {
        width: '100%',
        marginLeft: 69,
    },
    chevronText: {
        fontSize: 12,
        fontWeight: '400',
    },
    rowCenter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
