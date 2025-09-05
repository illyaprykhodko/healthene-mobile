// outsource dependencies
import React from 'react';
import moment from 'moment';
import { TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// local dependencies
import Item from './Item';
import Edit from './Edit';
import UPCScan from './UPCScan';
import { Overview } from './Overview';
import { useTheme } from 'hooks/useTheme';
import AddReplaceItem from './AddReplaceItem';
import { ExerciseCategories, ExerciseDetails, ExerciseEdit } from './Exercise';

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
            <Stack.Screen
                name="Item"
                component={Item}
                options={{ title: 'Item Details' }}
            />
            <Stack.Screen
                name="Edit"
                component={Edit}
                options={({ route, navigation }) => ({
                    title: 'Edit',
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => navigation.navigate('Overview')}>
                            <Icon name="arrow-left" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    ),
                })}
            />
            <Stack.Screen
                name="AddReplaceItem"
                component={AddReplaceItem}
                options={{ title: 'Select Item' }}
            />
            <Stack.Screen
                name="UPCScan"
                component={UPCScan}
                options={{ title: 'Scan UPC Code' }}
            />
            <Stack.Screen name="ExerciseCategories" component={ExerciseCategories} options={{ title: 'Exercise' }} />
            <Stack.Screen name="ExerciseDetails" component={ExerciseDetails} options={{ title: 'Exercise Details' }} />
            <Stack.Screen name="EditExercise" component={ExerciseEdit} options={{ title: 'Edit Exercise' }} />
        </Stack.Navigator>
    );
};

export default DayOverviewStack;
