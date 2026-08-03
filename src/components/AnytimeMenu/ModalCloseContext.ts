import React from 'react';

/**
 * Context exposing the AnytimeExercisesModal's "close everything" callback to
 * nested navigator screens. Internal navigation between screens uses standard
 * push/goBack; only the very top-level Close (X / DONE / NEXT ACTIVITY) needs
 * to dismiss the whole modal.
 */
export const ModalCloseContext = React.createContext<() => void>(() => {});
