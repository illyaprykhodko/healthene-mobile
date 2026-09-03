// outsource dependencies
import { LinkingOptions } from '@react-navigation/native';
// local dependencies
import { PRIVATE, ROUTES } from 'constants/routes';

export const linking: LinkingOptions<any> = {
    prefixes: [
        'healthene://',
        'https://app.healthene.com',
        'https://clinic-healthene.intelliceed.com',
        'https://clinic-dev-healthene.intelliceed.com',
        'https://clinic-staging-healthene.intelliceed.com',
    ],
    config: {
        screens: {
            [PRIVATE]: {
                screens: {
                    [ROUTES.DRAWER]: {
                        screens: {
                            [ROUTES.DAILY_PLAN]: {
                                screens: {
                                    [ROUTES.WEIGHT_MEASUREMENT]: {
                                        path: 'public/app-redirect/measurements/weight',
                                    },
                                },
                            },
                            // NOTE Target the drawer-level `Shopping` screen rather than a
                            // child route — the inner stack picks its `initialRouteName`
                            // dynamically (list vs preferences) once the shopping status
                            // query resolves, so child routes do not exist yet on arrival.
                            [ROUTES.SHOPPING]: {
                                path: 'public/app-redirect/shopping/list',
                            },
                            [ROUTES.MESSENGER]: {
                                screens: {
                                    [ROUTES.READ_MESSAGE]: {
                                        path: 'public/app-redirect/messages/thread/:id',
                                        parse: {
                                            id: (id: string) => Number(id),
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
};
