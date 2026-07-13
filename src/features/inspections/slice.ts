import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";

import { SyncState, InspectionStatus } from "./constants";
import { Inspection } from "./types";

export interface SaveInspectionAction {
  id: string;
  status: InspectionStatus;
  comments: string;
  photos: string[];
  location?: { lat: number; lng: number } | null;
}

export interface CreateInspectionAction {
  vesselName: string;
  status: InspectionStatus;
  comments: string;
  photos: string[];
  location?: { lat: number; lng: number } | null;
}

interface InspectionsState {
  items: Inspection[];
  selectedId: string | null;
  isLoading: boolean;
  isSyncing: boolean;
  isOnline: boolean;
  error: string | null;
  lastSyncedAt: number | null;
}

const initialState: InspectionsState = {
  items: [],
  selectedId: null,
  isLoading: false,
  isSyncing: false,
  isOnline: true,
  error: null,
  lastSyncedAt: null,
};

interface InspectionsRootState {
  inspections: InspectionsState;
}

export const inspectionsSlice = createSlice({
  name: "inspections",
  initialState,
  reducers: {
    loadRequested(state) {
      state.isLoading = true;
      state.error = null;
    },
    localItemsChanged(state, action: PayloadAction<Inspection[]>) {
      state.items = action.payload;
      state.isLoading = false;
    },
    refreshRequested(state) {
      state.error = null;
    },
    refreshFailed(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.isLoading = false;
    },
    saveRequested(state, _action: PayloadAction<SaveInspectionAction>) {
      state.error = null;
    },
    saveFailed(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
    createRequested(state, _action: PayloadAction<CreateInspectionAction>) {
      state.error = null;
    },
    createFailed(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
    syncRequested(state) {
      state.isSyncing = true;
      state.error = null;
    },
    syncFinished(state, action: PayloadAction<{ syncedAt: number }>) {
      state.isSyncing = false;
      state.lastSyncedAt = action.payload.syncedAt;
    },
    syncFailed(state, action: PayloadAction<string>) {
      state.isSyncing = false;
      state.error = action.payload;
    },
    connectivityChanged(state, action: PayloadAction<boolean>) {
      state.isOnline = action.payload;
    },
    selectInspection(state, action: PayloadAction<string | null>) {
      state.selectedId = action.payload;
    },
  },
});

export const inspectionsActions = inspectionsSlice.actions;

export function selectInspections(state: InspectionsRootState) {
  return state.inspections.items;
}

export function selectSelectedInspection(state: InspectionsRootState) {
  return state.inspections.items.find(
    (inspection) => inspection.id === state.inspections.selectedId,
  );
}

export const selectInspectionsStatus = createSelector(
  [
    (state: InspectionsRootState) => state.inspections.isLoading,
    (state: InspectionsRootState) => state.inspections.error,
  ],
  (isLoading, error) => ({ isLoading, error }),
);

export const selectSyncSummary = createSelector(
  [
    selectInspections,
    (state: InspectionsRootState) => state.inspections.isSyncing,
    (state: InspectionsRootState) => state.inspections.isOnline,
    (state: InspectionsRootState) => state.inspections.lastSyncedAt,
  ],
  (items, isSyncing, isOnline, lastSyncedAt) => {
    const pending = items.filter(
      (inspection) => inspection.syncState === SyncState.PENDING,
    ).length;
    const failed = items.filter(
      (inspection) => inspection.syncState === SyncState.FAILED,
    ).length;

    return {
      pending,
      failed,
      isSyncing,
      isOnline,
      lastSyncedAt,
    };
  },
);

export default inspectionsSlice.reducer;
