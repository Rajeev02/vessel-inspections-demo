import NetInfo from "@react-native-community/netinfo";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function assertOnline() {
  const state = await NetInfo.fetch();

  if (state.isInternetReachable === false || state.isConnected === false) {
    throw new ApiError("Device is offline");
  }
}

export async function mockDelay(ms = 350) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
