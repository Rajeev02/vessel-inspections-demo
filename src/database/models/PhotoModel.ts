import { Model } from "@nozbe/watermelondb";
import { field, relation, date } from "@nozbe/watermelondb/decorators";

export class PhotoModel extends Model {
  static table = "photos";

  @field("inspection_id") declare inspectionId: string;
  @field("uri") declare uri: string;
  @field("sync_state") declare syncState: string;
  @date("created_at") declare createdAt: Date;

  @relation("inspections", "inspection_id") declare inspection: any;
}
