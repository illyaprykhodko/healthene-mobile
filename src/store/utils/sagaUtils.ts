import { ActionCreator, AnyAction } from '@reduxjs/toolkit';

// Types
export interface SagaAction<T = void> extends AnyAction {
  type: string;
  payload?: T;
}

export interface TypedActionCreator<T = void> extends ActionCreator<SagaAction<T>> {
  type: string;
}

export const createSagaAction = <T = void>(type: string): TypedActionCreator<T> => {
    const actionCreator = (payload?: T): SagaAction<T> => ({ type, payload });
    actionCreator.type = type;
    return actionCreator;
};
