// outsource dependencies
import React from 'react';
import moment from 'moment';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useNavigation, useTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// local dependencies
import { Overview } from './Overview';

const Stack = createNativeStackNavigator();

const DayOverviewStack: React.FC = () => {
    const currentDate = moment().format('ddd, MMM Do');
    const navigation = useNavigation();
    const theme = useTheme();
  
    return (
        <Stack.Navigator initialRouteName="DayOverviewOverview" screenOptions={{ headerShown: true }}>
            <Stack.Screen
                name="DayOverviewOverview"
                component={Overview}
                options={() => ({
                    title: currentDate,
                    headerStyle: {
                        backgroundColor: theme.colors.primary,
                    },
                    headerTintColor: '#FFFFFF',
                    headerTitleStyle: {
                        fontWeight: '600',
                    },
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}
                        >
                            <Icon name="arrow-left" size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                    ),
                    headerRight: () => (
                        <TouchableOpacity
                            onPress={() => (navigation as any).openDrawer?.()}
                            style={{ marginRight: 8 }}
                        >
                            <Icon name="bars" size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                    ),
                })}
            />
        </Stack.Navigator>
    );
};

export default DayOverviewStack;
