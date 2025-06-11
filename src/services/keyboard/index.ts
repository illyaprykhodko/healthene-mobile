// outside dependencies
import { Keyboard } from 'react-native';
import { useCallback, useEffect } from 'react';
// local dependencies
import { setKeyboardState } from '../../store/slices/appSlice';
import { useAppDispatch, useAppSelector, store } from '../../store';

export const useKeyboard = () => {
    const dispatch = useAppDispatch();
    const isOpen = useAppSelector(state => state.app.keyboard);

    const onKeyboardShow = useCallback(() => {
        dispatch(setKeyboardState(true));
    }, [dispatch]);

    const onKeyboardHide = useCallback(() => {
        dispatch(setKeyboardState(false));
    }, [dispatch]);

    useEffect(() => {
        const showSubscription = Keyboard.addListener('keyboardDidShow', onKeyboardShow);
        const hideSubscription = Keyboard.addListener('keyboardDidHide', onKeyboardHide);

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, [onKeyboardShow, onKeyboardHide]);

    const hideKeyboard = useCallback(() => {
        Keyboard.dismiss();
    }, []);

    return {
        isOpen,
        hideKeyboard,
    };
};

class KeyboardService {
    static get isOpen (): boolean {
        return store.getState().app.keyboard;
    }

    static hideKeyboard (): void {
        Keyboard.dismiss();
    }
}

export default KeyboardService;
