// outsource dependencies
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// local dependencies
import BackBtn from 'components/BackBtn';
import { ROUTES } from 'constants/routes';
import { useTheme } from 'hooks/useTheme';
import { Hamburger } from 'components/Hamburger';
import InfoScreen from 'screens/privateScreens/InfoScreen';
import { VideoScreen } from 'screens/privateScreens/Library';
import {
    QuestionScreen,
    QuestionListScreen,
    QuestionCategoryScreen,
} from 'screens/privateScreens/Question';

const Stack = createNativeStackNavigator();

const InfoStack: React.FC = () => {
    const theme = useTheme();
    const drawerNavigation = useNavigation<any>();

    return (
        <Stack.Navigator
            initialRouteName={ROUTES.INFO}
            screenOptions={({ navigation }) => ({
                headerStyle: {
                    backgroundColor: theme.colors.headerBg,
                },
                headerTintColor: theme.colors.headerText,
                headerTitleStyle: {
                    fontSize: 18,
                    fontWeight: '600',
                },
                headerTitleAlign: 'center',
                headerLeft: () => <BackBtn onPress={() => navigation.goBack()} color={theme.colors.white} />,
                headerRight: () => <Hamburger onPress={() => drawerNavigation.openDrawer?.()} />,
            })}
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
