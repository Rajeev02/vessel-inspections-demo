# Vessel Inspections App - Architecture Document

## 1. Application Structure

### Folder Organization
The application follows a feature-driven modular architecture. The structure is designed to separate concerns, making the codebase highly maintainable and scalable as the application grows.

```text
src/
├── api/             # API clients, endpoints, and mock handlers
├── app/             # Expo Router files for navigation and screens
├── components/      # Reusable UI components (buttons, headers, layouts)
├── constants/       # Global constants, theme colors, and configuration
├── database/        # WatermelonDB models, schemas, and repositories
├── features/        # Feature-specific logic (inspections slice, sagas, types)
├── hooks/           # Custom React hooks
├── store/           # Redux store configuration
└── utils/           # Helper functions
```

### Feature Boundaries
By keeping feature-specific logic self-contained within the `src/features/` directory (e.g., placing Redux slices, sagas, and types for inspections in `src/features/inspections/`), we reduce cross-module dependencies. This makes it easier to test, refactor, or extract features in the future.

## 2. State Management

### Redux Store Design
We utilize **Redux Toolkit** for centralized global state management. The store is designed to hold only the necessary transient application state (like UI loading states, currently selected filters, and error notifications), while persistent domain data is primarily handled by the local database.

### Redux-Saga Strategy
**Redux-Saga** is employed to handle complex asynchronous workflows, particularly the synchronization process. Sagas listen for actions like `SYNC_REQUESTED` or `UPDATE_INSPECTION` and orchestrate the flow of side effects. This keeps our components pure and moves the complex logic of "saving locally -> checking network -> attempting API call -> handling failure" into easily testable generator functions.

## 3. Offline Strategy

### Local Persistence Approach
The app relies on **WatermelonDB** (backed by SQLite) as the single source of truth for offline-first capabilities. WatermelonDB is highly optimized for React Native, lazy-loading data so the UI remains fast even with thousands of records. When a user creates or updates an inspection, the changes are instantly written to the local database, allowing the UI to update immediately without waiting for a network response.

### Synchronization Workflow
1. **Local Update**: User actions (updating status, adding comments, attaching photos) immediately mutate the local database record and flag it as `pendingSync`.
2. **Network Detection**: We utilize `@react-native-community/netinfo` to listen for connectivity changes.
3. **Background Syncing**: A Redux Saga triggers the sync process when connectivity is restored or when the app is brought to the foreground.
4. **Resolution**: The saga reads all records flagged as `pendingSync`, attempts to push them to the API via `axios`, and upon success, removes the flag. Failed syncs remain in the queue for the next retry.

## 4. Error Handling

### Failure Scenarios & Recovery Mechanisms
*   **API/Network Failures**: Handled globally via Axios interceptors and locally via try-catch blocks in Sagas. If an update fails due to a network drop, the record remains locally marked as `pendingSync` and will be retried automatically.
*   **Malformed Responses**: We anticipate schema changes by using optional chaining in the UI and safely catching parsing errors in the API client, preventing hard crashes.
*   **Media Upload Failures**: Handled gracefully by keeping the photo data stored locally. If the image is too large or the connection drops during upload, the user is notified, and the app will attempt a resumable upload (if backend supported) or a full retry later.

## 5. Trade-offs

### Decisions Made & Alternatives Considered
*   **WatermelonDB vs. AsyncStorage**: *Decision*: WatermelonDB. *Reasoning*: While AsyncStorage is simpler, it is not scalable for complex relational data (like Inspections -> Photos -> Comments) and lacks querying capabilities. WatermelonDB provides robust SQLite querying and observable data streams.
*   **Redux-Saga vs. React Query / RTK Query**: *Decision*: Redux-Saga. *Reasoning*: While React Query is excellent for server-state management, Redux-Saga provides finer control over complex, multi-step offline synchronization workflows and background task orchestration, which is the core requirement of this application.
*   **Expo vs. Bare React Native**: *Decision*: Expo. *Reasoning*: Expo significantly accelerates development, provides high-quality maintained modules (like `expo-sqlite`, `expo-file-system`), and handles complex native setups out of the box, allowing more focus on the business logic and offline architecture.
