import { InspectionStatus, SyncState } from "./constants";

export interface Inspection {
  id: string;
  vesselName: string;
  status: InspectionStatus;
  comments: string | null;
  photos: string[];
  location?: { lat: number; lng: number } | null;
  syncState: SyncState;
  updatedAt: number;
}

export interface InspectionUpdatePayload {
  id: string;
  status: InspectionStatus;
  comments: string | null;
  photos: string[];
  location?: { lat: number; lng: number } | null;
  updatedAt: number;
}

export interface InspectionCreatePayload {
  vesselName: string;
  status: InspectionStatus;
  comments: string | null;
  photos: string[];
  location?: { lat: number; lng: number } | null;
}

export interface InspectionApiRecord {
  id: number | string;
  vesselName: string;
  status: InspectionStatus;
  comments?: string | null;
  photos?: string[];
  location?: { lat: number; lng: number } | null;
  updatedAt?: number;
}
