jest.mock("@nozbe/watermelondb/adapters/sqlite", () => {
  return jest.fn().mockImplementation(() => ({
    schema: {},
    migrations: {},
  }));
});
jest.mock("@nozbe/watermelondb", () => {
  return {
    Database: jest.fn().mockImplementation(() => ({
      get: jest.fn().mockReturnValue({}),
    })),
    Model: class {},
    tableSchema: jest.fn(),
    appSchema: jest.fn(),
  };
});
