import { createNavigationContainerRef, NavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList, NavigationService } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

type RootNavigateFn = (
    name: keyof RootStackParamList,
    params?: RootStackParamList[keyof RootStackParamList],
) => void;

export const navigate: NavigationService['navigate'] = ((name, params) => {
    if (navigationRef.isReady()) {
        (navigationRef.navigate as RootNavigateFn)(name, params);
    }
}) as NavigationService['navigate'];

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
