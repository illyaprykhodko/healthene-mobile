// outsource dependencies
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// local dependencies
import Header from 'components/Header';
import { ROUTES } from 'constants/routes';
import { VideoScreen } from 'screens/privateScreens/Library';
import AboutPlanScreen from 'screens/privateScreens/AboutPlanScreen';
import {
    QuestionScreen,
    QuestionListScreen,
    QuestionCategoryScreen,
} from 'screens/privateScreens/Question';

const Stack = createNativeStackNavigator();

const AboutPlanStack: React.FC = () => {
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
        <Stack.Navigator initialRouteName={ROUTES.ABOUT_PLAN}>
            <Stack.Screen
                name={ROUTES.ABOUT_PLAN}
                component={AboutPlanScreen}
                options={{ header: renderHeader('About Plan', true) }}
            />
            <Stack.Screen
                name={ROUTES.VIDEO}
                component={VideoScreen}
                options={{ header: renderHeader('Video') }}
            />
            <Stack.Screen
                name={ROUTES.QUESTION}
                component={QuestionScreen}
                options={{
                    headerShown: false,
                    gestureEnabled: false,
                }}
            />
            <Stack.Screen
                name={ROUTES.QUESTION_CATEGORY}
                component={QuestionCategoryScreen}
                options={{ header: renderHeader('Questions') }}
            />
            <Stack.Screen
                name={ROUTES.QUESTION_LIST}
                component={QuestionListScreen}
                options={{ header: renderHeader('Questions') }}
            />
        </Stack.Navigator>
    );
};

export default AboutPlanStack;
