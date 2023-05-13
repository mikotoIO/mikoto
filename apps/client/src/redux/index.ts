import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import { spaceReducer } from './mikoto';

export const store = configureStore({
  reducer: {
    spaces: spaceReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useMikotoDispatch: () => AppDispatch = useDispatch;
export const useMikotoSelector: TypedUseSelectorHook<RootState> = useSelector;
