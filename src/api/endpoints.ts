export const endpoints = {
  inspections: "/inspections",
  inspection: (id: string) => `/inspection/${id}`,
  updateInspection: "/inspection/update",
} as const;
