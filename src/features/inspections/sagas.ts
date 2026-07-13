import NetInfo from "@react-native-community/netinfo";
import { eventChannel } from "redux-saga";
import {
  all,
  call,
  fork,
  put,
  take,
  takeEvery,
  takeLatest,
} from "redux-saga/effects";
import * as Notifications from "expo-notifications";

import { getInspections, updateInspection, createInspection } from "@/api/inspectionApi";
import { ApiError } from "@/api/client";
import { inspectionRepository } from "@/database/repositories/InspectionRepository";
import { Inspection } from "@/features/inspections/types";

import { inspectionsActions, SaveInspectionAction, CreateInspectionAction } from "./slice";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error";
}

function createConnectivityChannel() {
  return eventChannel<boolean>((emit) => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      emit(state.isInternetReachable !== false && state.isConnected !== false);
    });

    return unsubscribe;
  });
}

function* watchConnectivity() {
  const channel: ReturnType<typeof createConnectivityChannel> = yield call(
    createConnectivityChannel,
  );

  while (true) {
    const isOnline: boolean = yield take(channel);
    yield put(inspectionsActions.connectivityChanged(isOnline));

    if (isOnline) {
      yield put(inspectionsActions.syncRequested());
      yield put(inspectionsActions.refreshRequested());
    }
  }
}

function* watchLocalInspections() {
  const channel = eventChannel<Inspection[]>((emit) => {
    const subscription = inspectionRepository.observeAll(emit);

    return () => subscription.unsubscribe();
  });

  while (true) {
    const inspections: Inspection[] = yield take(channel);
    yield put(inspectionsActions.localItemsChanged(inspections));
  }
}

function* loadInspections() {
  try {
    const local: Inspection[] = yield call([inspectionRepository, "getAll"]);
    yield put(inspectionsActions.localItemsChanged(local));
    yield put(inspectionsActions.refreshRequested());
    yield put(inspectionsActions.syncRequested());
  } catch (error) {
    yield put(inspectionsActions.refreshFailed(getErrorMessage(error)));
  }
}

function* refreshInspections() {
  try {
    const remote: Awaited<ReturnType<typeof getInspections>> =
      yield call(getInspections);
    yield call([inspectionRepository, "upsertRemote"], remote);
  } catch (error) {
    yield put(inspectionsActions.refreshFailed(getErrorMessage(error)));
  }
}

function* saveInspection(action: { payload: SaveInspectionAction }) {
  try {
    yield call([inspectionRepository, "updateLocal"], action.payload);
    yield put(inspectionsActions.syncRequested());
  } catch (error) {
    yield put(inspectionsActions.saveFailed(getErrorMessage(error)));
  }
}

function* createInspectionSaga(action: { payload: CreateInspectionAction }) {
  try {
    yield call([inspectionRepository, "createLocal"], action.payload);
    yield put(inspectionsActions.syncRequested());
  } catch (error) {
    yield put(inspectionsActions.createFailed(getErrorMessage(error)));
  }
}

function* syncPendingInspections(): Generator<any, void, any> {
  try {
    const pending: Inspection[] = yield call([
      inspectionRepository,
      "getPendingSync",
    ]);

    let successCount = 0;
    let failCount = 0;

    for (const inspection of pending) {
      try {
        let remote;
        try {
          remote = yield call(
            updateInspection,
            {
              id: inspection.id,
              status: inspection.status,
              comments: inspection.comments,
              photos: inspection.photos,
              updatedAt: inspection.updatedAt,
            },
          );
        } catch (apiError: any) {
          if (apiError instanceof ApiError && apiError.status === 404) {
            remote = yield call(
              createInspection,
              {
                id: inspection.id,
                vesselName: inspection.vesselName,
                status: inspection.status,
                comments: inspection.comments,
                photos: inspection.photos,
              },
            );
          } else {
            throw apiError;
          }
        }

        yield call(
          [inspectionRepository, "markSynced"],
          inspection.id,
          remote.updatedAt ?? Date.now(),
        );
        successCount++;
      } catch {
        yield call([inspectionRepository, "markFailed"], inspection.id);
        failCount++;
      }
    }

    if (successCount > 0 || failCount > 0) {
      let body = "";
      let title = "Sync Complete";
      
      if (successCount > 0 && failCount > 0) {
        title = "Sync Partially Complete";
        body = `Successfully synced ${successCount} inspection(s), ${failCount} failed.`;
      } else if (successCount > 0) {
        body = `Successfully synced ${successCount} inspection(s).`;
      } else {
        title = "Sync Failed";
        body = `Failed to sync ${failCount} inspection(s).`;
      }

      const { status } = yield call([Notifications, 'getPermissionsAsync']);
      
      if (status === 'granted') {
        yield call([Notifications, 'scheduleNotificationAsync'], {
          content: {
            title,
            body,
          },
          trigger: null,
        });
      }
    }

    yield put(inspectionsActions.syncFinished({ syncedAt: Date.now() }));
  } catch (error) {
    yield put(inspectionsActions.syncFailed(getErrorMessage(error)));
  }
}

export function* inspectionsSaga() {
  yield all([
    fork(watchLocalInspections),
    fork(watchConnectivity),
    takeLatest(inspectionsActions.loadRequested.type, loadInspections),
    takeLatest(inspectionsActions.refreshRequested.type, refreshInspections),
    takeEvery(inspectionsActions.saveRequested, saveInspection),
    takeEvery(inspectionsActions.createRequested, createInspectionSaga),
    takeLatest(inspectionsActions.syncRequested.type, syncPendingInspections),

  ]);
}
