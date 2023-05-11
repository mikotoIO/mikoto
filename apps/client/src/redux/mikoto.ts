import { CaseReducerActions, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction, Reducer } from '@reduxjs/toolkit';
import { Draft } from 'immer';
import { Space } from 'mikotojs';

export type DeltaReducers<T extends { id: string }> = {
  initialize(
    state: Record<string, T>,
    action: PayloadAction<T[]>,
  ): Record<string, T>;
  create(state: Record<string, T>, action: PayloadAction<T>): void;
  update(state: Record<string, T>, action: PayloadAction<T>): void;
  delete(state: Record<string, T>, action: PayloadAction<string>): void;
};

function createDeltaReducers<T extends { id: string }>() {
  return {
    initialize(
      _: Record<string, T>,
      action: PayloadAction<T[]>,
    ): Record<string, T> {
      const init: Record<string, T> = {};
      action.payload.forEach((space) => {
        init[space.id] = space;
      });
      return init;
    },
    create(state: Record<string, T>, action: PayloadAction<T>): void {
      state[action.payload.id] = action.payload;
    },
    update(state: Record<string, T>, action: PayloadAction<T>): void {
      state[action.payload.id] = action.payload;
    },
    delete(state: Record<string, T>, action: PayloadAction<string>): void {
      delete state[action.payload];
    },
  };
}

const spaceSlice = createSlice({
  name: 'space',
  initialState: {} as Record<string, Space>,
  reducers: {
    ...createDeltaReducers<Space>(),
  },
});

export const spaceActions = spaceSlice.actions;
export const spaceReducer = spaceSlice.reducer;

export type DeltaReducerActions<T extends { id: string }> = CaseReducerActions<
  DeltaReducers<T>,
  string
>;
