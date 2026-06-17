// outsource dependencies
import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';

// local dependencies
import { SHOPPING_STATUS } from 'constants/spec';
import { useAppDispatch, useAppSelector } from 'store';
import { selectShopping, updateShoppingMeta } from 'store/slices/shoppingSlice';

const openParentDrawer = (navigation: any) => {
    const parentNav = navigation?.getParent?.();
    if (parentNav?.openDrawer) { parentNav.openDrawer(); return; }
    if (parentNav?.toggleDrawer) { parentNav.toggleDrawer(); return; }
    navigation?.openDrawer?.();
};

export const useShoppingDrawer = ({ guarded = false } = {}) => {
    const navigation = useNavigation<any>();
    const dispatch = useAppDispatch();
    const { status } = useAppSelector(selectShopping);

    return useCallback(() => {
        if (guarded && status === SHOPPING_STATUS.PENDING) {
            dispatch(updateShoppingMeta({
                isTryToOpenSideMenu: true,
                isFinalizeAlertOpen: true,
            }));
            return;
        }
        openParentDrawer(navigation);
    }, [navigation, dispatch, status, guarded]);
};
