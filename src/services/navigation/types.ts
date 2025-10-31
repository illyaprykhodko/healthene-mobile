// outsource dependencies
// import { ParamListBase } from '@react-navigation/native';
// // local dependencies
import { ROUTES } from 'constants/routes';
import { PhaseItem } from 'store/api/dayOverviewApi';

// export type RootStackParamList = {
//   // Public screens
//   [ROUTES.SIGN_IN]: undefined;
//   [ROUTES.SIGN_UP]: undefined;
//   [ROUTES.FORGOT_PASSWORD]: undefined;
  
//   // Private screens
//   [ROUTES.HOME]: undefined;
//   [ROUTES.PROFILE]: undefined;
//   [ROUTES.SETTINGS]: undefined;
// } & ParamListBase;

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
  [ROUTES.DAY_OVERVIEW]: undefined;
  
  // Example of a screen that requires params
  [ROUTES.SMART_SCALE]: {
    measurementPhaseItem: object;
  };
  [ROUTES.ALL_RECORDED_DATA]: {
    measurementType: string;
    title: string;
  };
  [ROUTES.MEASUREMENT_CHART]: {
    measurementType: string;
    measurementName: string;
    date: string;
  };
};

type RouteName = keyof RootStackParamList;
type ParamsOf<T extends RouteName> = RootStackParamList[T];

/** navigate requires params only when the route defines them */
type Navigate = <T extends RouteName>(
  ...args: undefined extends ParamsOf<T>
    ? [name: T, params?: ParamsOf<T>]
    : [name: T, params: ParamsOf<T>]
) => void;

export type NavigationService = {
  navigate: Navigate;
  goBack: () => void;
  reset: (routes: Array<{
    name: RouteName;
    params?: RootStackParamList[RouteName];
  }>) => void;
};

// export type NavigationService = {
//   navigate: <T extends keyof RootStackParamList>(
//     name: T,
//     params?: RootStackParamList[T]
//   ) => void;
//   goBack: () => void;
//   reset: (routes: Array<{
//     name: keyof RootStackParamList;
//     params?: RootStackParamList[keyof RootStackParamList]
//   }>) => void;
// };
