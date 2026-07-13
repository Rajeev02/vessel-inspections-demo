import { Database } from "@nozbe/watermelondb";
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";

import { InspectionModel } from "./models/InspectionModel";
import { PhotoModel } from "./models/PhotoModel";
import { schema } from "./schema";
import { migrations } from "./migrations";

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  jsi: true,
});

export const database = new Database({
  adapter,
  modelClasses: [InspectionModel, PhotoModel],
});
