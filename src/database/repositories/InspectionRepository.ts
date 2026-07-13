import { Q } from "@nozbe/watermelondb";

import { database } from "../database";
import { InspectionModel } from "../models/InspectionModel";
import { SyncState, InspectionStatus } from "@/features/inspections/constants";
import {
  Inspection,
  InspectionApiRecord,
  InspectionUpdatePayload,
} from "@/features/inspections/types";

const tableName = "inspections";

function collection() {
  return database.get<InspectionModel>(tableName);
}

function parsePhotos(photoUriStr: string | null): string[] {
  if (!photoUriStr) return [];
  try {
    const parsed = JSON.parse(photoUriStr);
    return Array.isArray(parsed) ? parsed : [photoUriStr];
  } catch {
    return [photoUriStr];
  }
}

function toInspection(model: InspectionModel): Inspection {
  return {
    id: model.id,
    vesselName: model.vesselName,
    status: model.status as InspectionStatus,
    comments: model.comments,
    photos: parsePhotos(model.photoUri),
    location:
      model.lat != null && model.lng != null
        ? { lat: model.lat, lng: model.lng }
        : null,
    syncState: model.syncState as SyncState,
    updatedAt: model.updatedAt.getTime(),
  };
}

function normalizeRemote(record: InspectionApiRecord): Inspection {
  return {
    id: String(record.id),
    vesselName: record.vesselName,
    status: record.status,
    comments: record.comments ?? null,
    photos: record.photos ?? [],
    location: null,
    syncState: SyncState.SYNCED,
    updatedAt: record.updatedAt ?? Date.now(),
  };
}

async function findOrNull(id: string) {
  try {
    return await collection().find(id);
  } catch {
    return null;
  }
}

export const inspectionRepository = {
  observeAll(onChange: (inspections: Inspection[]) => void) {
    return collection()
      .query(Q.sortBy("updated_at", Q.desc))
      .observeWithColumns([
        "status",
        "comments",
        "photo_uri",
        "sync_state",
        "updated_at",
      ])
      .subscribe((records) => {
        onChange(records.map(toInspection));
      });
  },

  async getAll() {
    const records = await collection()
      .query(Q.sortBy("updated_at", Q.desc))
      .fetch();

    return records.map(toInspection);
  },

  async getById(id: string) {
    const record = await collection().find(id);

    return toInspection(record);
  },

  async upsertRemote(records: InspectionApiRecord[]) {
    const normalized = records.map(normalizeRemote);

    await database.write(async () => {
      const operations = [];

      for (const inspection of normalized) {
        const existing = await findOrNull(inspection.id);

        if (!existing) {
          operations.push(
            collection().prepareCreate((record) => {
              record._raw.id = inspection.id;
              record.vesselName = inspection.vesselName;
              record.status = inspection.status;
              record.comments = inspection.comments;
              record.photoUri = inspection.photos?.length ? JSON.stringify(inspection.photos) : null;
              record.lat = inspection.location?.lat ?? null;
              record.lng = inspection.location?.lng ?? null;
              record.syncState = SyncState.SYNCED;
              record.updatedAt = new Date(inspection.updatedAt);
            }),
          );
          continue;
        }

        if (existing.syncState !== SyncState.SYNCED) {
          continue;
        }

        operations.push(
          existing.prepareUpdate((record) => {
            record.vesselName = inspection.vesselName;
            record.status = inspection.status;
            record.comments = inspection.comments;
            record.photoUri = inspection.photos?.length ? JSON.stringify(inspection.photos) : null;
            record.lat = inspection.location?.lat ?? null;
            record.lng = inspection.location?.lng ?? null;
            record.syncState = SyncState.SYNCED;
            record.updatedAt = new Date(inspection.updatedAt);
          }),
        );
      }

      await database.batch(...operations);
    });
  },

  async updateLocal(payload: Omit<InspectionUpdatePayload, "updatedAt">) {
    const updatedAt = Date.now();
    const record = await collection().find(payload.id);

    await database.write(async () => {
      await record.update((inspection) => {
        inspection.status = payload.status;
        inspection.comments = payload.comments;
        inspection.photoUri = payload.photos?.length ? JSON.stringify(payload.photos) : null;
        inspection.lat = payload.location?.lat ?? inspection.lat;
        inspection.lng = payload.location?.lng ?? inspection.lng;
        inspection.syncState = SyncState.PENDING;
        inspection.updatedAt = new Date(updatedAt);
      });
    });

    return toInspection(record);
  },

  async createLocal(payload: import("@/features/inspections/types").InspectionCreatePayload) {
    let record: InspectionModel;

    await database.write(async () => {
      record = await collection().create((inspection) => {
        inspection.vesselName = payload.vesselName;
        inspection.status = payload.status;
        inspection.comments = payload.comments;
        inspection.photoUri = payload.photos?.length ? JSON.stringify(payload.photos) : null;
        inspection.lat = payload.location?.lat ?? null;
        inspection.lng = payload.location?.lng ?? null;
        inspection.syncState = SyncState.PENDING;
        inspection.updatedAt = new Date();
      });
    });

    return toInspection(record!);
  },

  async getPendingSync() {
    const records = await collection()
      .query(
        Q.where("sync_state", Q.oneOf([SyncState.PENDING, SyncState.FAILED])),
      )
      .fetch();

    return records.map(toInspection);
  },

  async markSynced(id: string, remoteUpdatedAt = Date.now()) {
    const record = await collection().find(id);

    await database.write(async () => {
      await record.update((inspection) => {
        inspection.syncState = SyncState.SYNCED;
        inspection.updatedAt = new Date(remoteUpdatedAt);
      });
    });

    return toInspection(record);
  },

  async markFailed(id: string) {
    const record = await collection().find(id);

    await database.write(async () => {
      await record.update((inspection) => {
        inspection.syncState = SyncState.FAILED;
      });
    });

    return toInspection(record);
  },
};
