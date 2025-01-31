// src/sagas/rootSaga.ts
import { all } from 'redux-saga/effects';
import pdfsSaga from './pdfsSaga';

export default function* rootSaga() {
  yield all([
    pdfsSaga(),
  ]);
}
