import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import { memberReducer, spaceReducer } from './mikoto';

export const store = configureStore({
  reducer: {
    spaces: spaceReducer,
    members: memberReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useMikotoDispatch: () => AppDispatch = useDispatch;
export const useMikotoSelector: TypedUseSelectorHook<RootState> = useSelector;
