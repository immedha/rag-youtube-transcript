import { configureStore } from '@reduxjs/toolkit'
import pdfsReducer from './slices/pdfsSlice';
import createSagaMiddleware from 'redux-saga';
import rootSaga from './sagas/rootSaga';

const sagaMiddleware = createSagaMiddleware();
const middleware = [sagaMiddleware]

const store = configureStore({
  reducer: {
    pdfs: pdfsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['pdfs/addPdfsRequestAction'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.pdf'],
      },
    }).concat(middleware),
})

sagaMiddleware.run(rootSaga);

export type AppDispatch = typeof store.dispatch;

export default store