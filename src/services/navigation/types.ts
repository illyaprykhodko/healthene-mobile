import { ROUTES } from '../../constants/routes';
import { ParamListBase } from '@react-navigation/native';

export type RootStackParamList = {
  // Public screens
  [ROUTES.SIGN_IN]: undefined;
  [ROUTES.SIGN_UP]: undefined;
  [ROUTES.FORGOT_PASSWORD]: undefined;
  [ROUTES.TERMS_AND_CONDITIONS]: undefined;

  // Private screens
  [ROUTES.HOME]: undefined;
  [ROUTES.PROFILE]: undefined;
  [ROUTES.SETTINGS]: undefined;
} & ParamListBase;

export type NavigationService = {
  navigate: <T extends keyof RootStackParamList>(
    name: T,
    params?: RootStackParamList[T]
  ) => void;
  goBack: () => void;
  reset: (routes: Array<{
    name: keyof RootStackParamList;
    params?: RootStackParamList[keyof RootStackParamList]
  }>) => void;
};
