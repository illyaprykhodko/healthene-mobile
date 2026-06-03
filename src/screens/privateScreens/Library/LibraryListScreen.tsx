// outsource dependencies
import React, { memo, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/fontawesome5';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { COLORS } from 'constants/colors';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import { ROUTES } from 'constants/routes';
import StackHeader from 'components/StackHeader';

const LibraryListScreen: React.FC = () => {
    const theme = useTheme();
    const navigation = useNavigation<any>();

    const handleNavigateToVideos = useCallback(() => {
        navigation.navigate(ROUTES.VIDEO_LIBRARY);
    }, [navigation]);

    return (
        <Screen initialized style={styles.container}>
            <StackHeader
                title="Library"
                onBack={() => navigation.goBack()}
                onOpenDrawer={() => navigation.openDrawer?.()}
            />
            <View style={styles.content}>
                <TouchableOpacity
                    style={[styles.item, { borderBottomColor: theme.colors.border }]}
                    onPress={handleNavigateToVideos}
                >
                    <Text variant="h4" style={{ color: theme.colors.text }}>
                    Videos
                    </Text>
                    <Icon
                        size={24}
                        iconStyle="solid"
                        color={COLORS.GREY}
                        name="chevron-right"
                    />
                </TouchableOpacity>
            </View>
        </Screen>
    );
};

export default memo(LibraryListScreen);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingTop: 20,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: OFFSET.VERTICAL,
        borderBottomWidth: 1,
    },
});
