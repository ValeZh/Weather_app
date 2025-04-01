import { configureStore } from '@reduxjs/toolkit'
// Or from '@reduxjs/toolkit/query/react'
import { setupListeners } from '@reduxjs/toolkit/query'
import {weatherApi} from './services/api/api'
import { locationApi } from './services/api/locationApi';
export const store = configureStore({
  reducer: {
    // Add the generated reducer as a specific top-level slice
    [locationApi.reducerPath]: locationApi.reducer,
    [weatherApi.reducerPath]: weatherApi.reducer,
  },
  // Adding the api middleware enables caching, invalidation, polling,
  // and other useful features of `rtk-query`.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(locationApi.middleware,weatherApi.middleware),
})

// optional, but required for refetchOnFocus/refetchOnReconnect behaviors
// see `setupListeners` docs - takes an optional callback as the 2nd arg for customization
setupListeners(store.dispatch)