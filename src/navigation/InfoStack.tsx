// outsource dependencies
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// local dependencies
import { ROUTES } from 'constants/routes';
import InfoScreen from 'screens/privateScreens/InfoScreen';
import { VideoScreen } from 'screens/privateScreens/Library';
import {
    QuestionScreen,
    QuestionListScreen,
    QuestionCategoryScreen,
} from 'screens/privateScreens/Question';

const Stack = createNativeStackNavigator();

const InfoStack: React.FC = () => {
    return (
        <Stack.Navigator
            initialRouteName={ROUTES.INFO}
            screenOptions={{ headerShown: false }}
        >
            <Stack.Screen
                name={ROUTES.INFO}
                component={InfoScreen}
                options={{
                    title: 'Info',
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

export default InfoStack;
