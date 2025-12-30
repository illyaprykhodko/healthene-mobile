// outsource dependencies
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// local dependencies
import { ROUTES } from 'constants/routes.ts';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import BackButton from 'components/BackButton.tsx';
import HealthProfile from 'screens/privateScreens/HealthProfile';
import ProfileStatsScreen from 'screens/privateScreens/HealthProfile/ProfileStatsScreen.tsx';

const Stack = createStackNavigator();
const HealthProfileStack = () => {
    const theme = useTheme();
    return (
        <Stack.Navigator
            initialRouteName={ROUTES.HEALTH_PROFILE}
            screenOptions={({ navigation }) => ({
                headerShown: true,
                gestureDirection: 'horizontal-inverted',
                headerLeft: () => <BackButton navigation={navigation} theme={theme} />,
                headerStyle: {
                    backgroundColor: theme.colors.primary,
                },
                headerTintColor: theme.colors.white,
                headerLeftContainerStyle: {
                    paddingLeft: OFFSET.HORIZONTAL,
                },
                headerTitleStyle: {
                    fontWeight: '600'
                },
            })}
        >
            <Stack.Screen options={{ title: 'My Health Profile' }} name={ROUTES.HEALTH_PROFILE} component={HealthProfile} />
            <Stack.Screen options={{ title: 'My Stats' }} name={ROUTES.PROFILE_STATS} component={ProfileStatsScreen} />
        </Stack.Navigator>
    );
};

export default HealthProfileStack;

