import {
  createTable,
  schemaMigrations,
} from "@nozbe/watermelondb/Schema/migrations";

export const migrations = schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        createTable({
          name: "photos",
          columns: [
            { name: "inspection_id", type: "string", isIndexed: true },
            { name: "uri", type: "string" },
            { name: "sync_state", type: "string" },
            { name: "created_at", type: "number" },
          ],
        }),
      ],
    },
  ],
});
