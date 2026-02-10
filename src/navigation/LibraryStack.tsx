// outsource dependencies
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// local dependencies
import BackBtn from 'components/BackBtn';
import { ROUTES } from 'constants/routes';
import { useTheme } from 'hooks/useTheme';
import { Hamburger } from 'components/Hamburger';
import {
    VideoScreen,
    VideoListScreen,
    LibraryListScreen,
    VideoLibraryScreen,
    VideoCategoryScreen,
} from 'screens/privateScreens/Library';

const Stack = createNativeStackNavigator();

export const LibraryStack: React.FC = () => {
    const theme = useTheme();
    const drawerNavigation = useNavigation<any>();

    return (
        <Stack.Navigator
            initialRouteName={ROUTES.ROOT_VIDEO_LIBRARY}
            screenOptions={({ navigation }) => ({
                title: 'Videos',
                headerStyle: {
                    backgroundColor: theme.colors.primary,
                },
                headerTintColor: theme.colors.white,
                headerTitleStyle: {
                    fontSize: 18,
                    fontWeight: '600',
                },
                headerTitleAlign: 'center',
                headerRight: () => (
                    <Hamburger onPress={() => drawerNavigation.openDrawer?.()} />
                ),
                headerLeft: () => (
                    <BackBtn onPress={() => navigation.goBack()} color={theme.colors.white} />
                ),
            })}
        >
            <Stack.Screen
                name={ROUTES.ROOT_VIDEO_LIBRARY}
                component={LibraryListScreen}
                options={{
                    title: 'Library',
                }}
            />
            <Stack.Screen
                name={ROUTES.VIDEO_LIBRARY}
                component={VideoLibraryScreen}
                options={{
                    title: 'Videos',
                }}
            />
            <Stack.Screen
                name={ROUTES.VIDEO_CATEGORY}
                component={VideoCategoryScreen}
                options={{
                    title: 'Videos',
                }}
            />
            <Stack.Screen
                name={ROUTES.VIDEO_LIST}
                component={VideoListScreen}
                options={{
                    title: 'Videos',
                }}
            />
            <Stack.Screen
                name={ROUTES.VIDEO}
                component={VideoScreen}
                options={{
                    title: 'Video',
                }}
            />
        </Stack.Navigator>
    );
};

export default LibraryStack;
