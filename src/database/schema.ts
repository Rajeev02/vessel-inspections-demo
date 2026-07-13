import { appSchema, tableSchema } from "@nozbe/watermelondb";

export const schema = appSchema({
  version: 2,

  tables: [
    tableSchema({
      name: "inspections",

      columns: [
        { name: "vessel_name", type: "string" },

        { name: "status", type: "string" },

        {
          name: "comments",
          type: "string",
          isOptional: true,
        },

        {
          name: "photo_uri",
          type: "string",
          isOptional: true,
        },

        {
          name: "lat",
          type: "number",
          isOptional: true,
        },

        {
          name: "lng",
          type: "number",
          isOptional: true,
        },

        {
          name: "sync_state",
          type: "string",
        },

        {
          name: "updated_at",
          type: "number",
        },
      ],
    }),
    tableSchema({
      name: "photos",
      columns: [
        { name: "inspection_id", type: "string", isIndexed: true },
        { name: "uri", type: "string" },
        { name: "sync_state", type: "string" },
        { name: "created_at", type: "number" },
      ],
    }),
  ],
});
