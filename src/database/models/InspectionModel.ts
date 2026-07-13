import { Model } from "@nozbe/watermelondb";
import { field, date, children } from "@nozbe/watermelondb/decorators";

export class InspectionModel extends Model {
  static table = "inspections";

  @field("vessel_name")
  declare vesselName: string;

  @field("status")
  declare status: string;

  @field("comments") declare comments: string | null;
  @field("photo_uri") declare photoUri: string | null;
  @field("lat") declare lat: number | null;
  @field("lng") declare lng: number | null;
  @field("sync_state") declare syncState: string;
  @date("updated_at") declare updatedAt: Date;

  @children("photos") declare photos: any;
}
