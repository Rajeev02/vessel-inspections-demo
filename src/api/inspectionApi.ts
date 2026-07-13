import { ApiError, assertOnline, mockDelay } from "./client";
import { InspectionStatus } from "@/features/inspections/constants";
import {
  InspectionApiRecord,
  InspectionUpdatePayload,
} from "@/features/inspections/types";

const now = Date.now();

let mockInspections: InspectionApiRecord[] = [
  {
    id: 1,
    vesselName: "MV Cargo One",
    status: InspectionStatus.PENDING,
    comments: "Awaiting inspector assignment.",
    photos: [],
    updatedAt: now - 60_000,
  },
  {
    id: 2,
    vesselName: "MV Cargo Two",
    status: InspectionStatus.COMPLETED,
    comments: "Hull and safety checks completed.",
    photos: [],
    updatedAt: now - 120_000,
  },
  {
    id: 3,
    vesselName: "MV Northern Star",
    status: InspectionStatus.IN_PROGRESS,
    comments: null,
    photos: [],
    updatedAt: now - 180_000,
  },
];

function validateInspection(record: InspectionApiRecord) {
  if (
    record == null ||
    record.id == null ||
    typeof record.vesselName !== "string" ||
    !Object.values(InspectionStatus).includes(record.status)
  ) {
    throw new ApiError("Malformed inspection response", 502);
  }
}

export async function getInspections() {
  await assertOnline();
  await mockDelay();

  mockInspections.forEach(validateInspection);

  return mockInspections;
}

export async function getInspection(id: string) {
  await assertOnline();
  await mockDelay();

  const inspection = mockInspections.find((item) => String(item.id) === id);

  if (!inspection) {
    throw new ApiError("Inspection not found", 404);
  }

  validateInspection(inspection);

  return inspection;
}

export async function updateInspection(payload: InspectionUpdatePayload) {
  await assertOnline();
  await mockDelay(500);

  if (!Object.values(InspectionStatus).includes(payload.status)) {
    throw new ApiError("Invalid inspection status", 400);
  }

  const existingIndex = mockInspections.findIndex(
    (item) => String(item.id) === payload.id,
  );

  if (existingIndex === -1) {
    throw new ApiError("Inspection not found", 404);
  }

  const updated: InspectionApiRecord = {
    ...mockInspections[existingIndex],
    status: payload.status,
    comments: payload.comments,
    photos: payload.photos,
    updatedAt: payload.updatedAt ?? Date.now(),
  };

  validateInspection(updated);
  mockInspections = mockInspections.map((item, index) =>
    index === existingIndex ? updated : item,
  );

  return updated;
}

export async function createInspection(payload: Omit<InspectionUpdatePayload, "updatedAt"> & { vesselName: string }) {
  await assertOnline();
  await mockDelay(500);

  if (!Object.values(InspectionStatus).includes(payload.status)) {
    throw new ApiError("Invalid inspection status", 400);
  }

  const created: InspectionApiRecord = {
    id: payload.id,
    vesselName: payload.vesselName,
    status: payload.status,
    comments: payload.comments,
    photos: payload.photos,
    updatedAt: Date.now(),
  };

  validateInspection(created);
  mockInspections = [created, ...mockInspections];

  return created;
}
