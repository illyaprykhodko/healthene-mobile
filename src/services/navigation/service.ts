import { createNavigationContainerRef, NavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList, NavigationService } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export const navigate: NavigationService['navigate'] = (name, params) => {
    if (navigationRef.isReady()) {
        navigationRef.navigate(name as keyof RootStackParamList, params as RootStackParamList);
    }
};

export const goBack: NavigationService['goBack'] = () => {
    if (navigationRef.isReady() && navigationRef.canGoBack()) {
        navigationRef.goBack();
    }
};

export const reset: NavigationService['reset'] = routes => {
    if (navigationRef.isReady()) {
        navigationRef.reset({
            index: 0,
            routes,
        });
    }
};
