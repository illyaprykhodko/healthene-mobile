// outsource dependencies
import React from 'react';
import { FlatList, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

// local dependencies
import Text from 'components/Text.tsx';
import Screen from 'components/Screen.tsx';
import { OFFSET } from 'constants/offset.ts';
import { useTheme } from 'hooks/useTheme.ts';
import { useGetPlanInfoQuery } from 'store/api/planApi.ts';

export const AboutPlanScreen = () => {
    const theme = useTheme();
    const styles = React.useMemo(() => createStyles(theme), [theme]);
    const { data, isLoading } = useGetPlanInfoQuery();

    return <ScrollView style={styles.flex}>
        <Screen initialized={!isLoading} style={styles.container}>
            <Text color={theme.colors.primary} variant="h3">{data?.name ?? 'You don\'t have a plan'}</Text>
            <View style={styles.marginVertical}>
                <Text color={theme.colors.primary} variant="h3">Goals:</Text>
                <Text style={styles.marginBottom} color={theme.colors.black}>{data?.goal ?? '-'}</Text>
                <Text color={theme.colors.primary} variant="h3">Summary:</Text>
                <Text color={theme.colors.black}>{data?.descriptionForPatient ?? '-'}</Text>
            </View>
            <FlatList
                scrollEnabled={false}
                data={data?.descriptionReferences}
                keyExtractor={item => item?.id.toString()}
                ListHeaderComponent={() => <Text color={theme.colors.primary} variant="h3">Plan References:</Text>}
                renderItem={({ item }) => <View style={styles.containerItem}>
                    <Pressable onPress={() => Linking.openURL(item.url)}>
                        <Text style={styles.underline} color={theme.colors.primary} variant="h5">{item.name}</Text>
                    </Pressable>
                    <Text>{item.description}</Text>
                </View>}
            />
        </Screen>
    </ScrollView>;
};

export default AboutPlanScreen;
const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
    flex: {
        flex: 1,
        backgroundColor: theme.colors.background
    },
    container: {
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.VERTICAL,
    },
    containerItem: {
        marginBottom: OFFSET.POINT
    },
    marginVertical: {
        marginVertical: OFFSET.POINT * 2,
    },
    marginBottom: {
        marginBottom: OFFSET.VERTICAL,
    },
    underline: {
        textDecorationLine: 'underline'
    },
});
