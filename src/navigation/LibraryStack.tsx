// outsource dependencies
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// local dependencies
import Header from 'components/Header';
import {
    VideoScreen,
    VideoListScreen,
    LibraryListScreen,
    VideoLibraryScreen,
    VideoCategoryScreen,
} from 'screens/privateScreens/Library';
import { ROUTES } from 'constants/routes';

const Stack = createNativeStackNavigator();

export const LibraryStack: React.FC = () => {
    const drawerNavigation = useNavigation<any>();

    const renderHeader = (title: string, isRootScreen = false) => (headerProps: any) => (
        <Header
            title={title}
            showHamburger
            isRootScreen={isRootScreen}
            navigation={headerProps.navigation}
            onHamburgerPress={() => drawerNavigation.openDrawer?.()}
        />
    );

    return (
        <Stack.Navigator initialRouteName={ROUTES.ROOT_VIDEO_LIBRARY}>
            <Stack.Screen
                component={LibraryListScreen}
                name={ROUTES.ROOT_VIDEO_LIBRARY}
                options={{ header: renderHeader('Library', true) }}
            />
            <Stack.Screen
                name={ROUTES.VIDEO_LIBRARY}
                component={VideoLibraryScreen}
                options={{ header: renderHeader('Videos') }}
            />
            <Stack.Screen
                name={ROUTES.VIDEO_CATEGORY}
                component={VideoCategoryScreen}
                options={{ header: renderHeader('Videos') }}
            />
            <Stack.Screen
                name={ROUTES.VIDEO_LIST}
                component={VideoListScreen}
                options={{ header: renderHeader('Videos') }}
            />
            <Stack.Screen
                name={ROUTES.VIDEO}
                component={VideoScreen}
                options={{ header: renderHeader('Video') }}
            />
        </Stack.Navigator>
    );
};

export default LibraryStack;
