// outsource dependencies
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// local dependencies
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
    return (
        <Stack.Navigator
            initialRouteName={ROUTES.ABOUT_PLAN}
            screenOptions={{ headerShown: false }}
        >
            <Stack.Screen
                name={ROUTES.ABOUT_PLAN}
                component={AboutPlanScreen}
                options={{
                    title: 'About Plan',
                }}
            />
            <Stack.Screen
                name={ROUTES.VIDEO}
                component={VideoScreen}
                options={{
                    title: 'Video',
                }}
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
                options={{
                    title: 'Questions',
                }}
            />
            <Stack.Screen
                name={ROUTES.QUESTION_LIST}
                component={QuestionListScreen}
                options={{
                    title: 'Questions',
                }}
            />
        </Stack.Navigator>
    );
};

export default AboutPlanStack;
