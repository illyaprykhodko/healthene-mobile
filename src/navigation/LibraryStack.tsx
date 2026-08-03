// outsource dependencies
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// local dependencies
import { ROUTES } from 'constants/routes';
import {
    VideoScreen,
    VideoListScreen,
    LibraryListScreen,
    VideoLibraryScreen,
    VideoCategoryScreen,
} from 'screens/privateScreens/Library';

const Stack = createNativeStackNavigator();

export const LibraryStack: React.FC = () => {
    return (
        <Stack.Navigator
            initialRouteName={ROUTES.ROOT_VIDEO_LIBRARY}
            screenOptions={{ headerShown: false }}
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
