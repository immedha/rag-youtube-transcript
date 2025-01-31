import { createSlice } from "@reduxjs/toolkit";
import { PdfsSliceState } from "./pdfsState";

const initialState: PdfsSliceState = {
  pdfs: [],
  questions: [],
  loading: false,
  error: null,
}

const pdfsSlice = createSlice({
  name: 'pdfs',
  initialState,
  reducers: {
    fetchPdfsSuccess(state, action) {
      state.pdfs = action.payload;
      state.loading = false;
    },
    fetchQuestionsSuccess(state, action) {
      state.questions = action.payload;
      state.loading = false;
    },
    addPdfSuccess(state, action) {
      state.pdfs.push(action.payload);
      state.loading = false;
    },
    askQuestionSuccess(state, action) {
      state.questions.push(action.payload);
      state.loading = false;
    },
    clearPdfsSuccess(state) {
      state.pdfs = [];
      state.loading = false;
    },
    clearQuestionsSuccess(state) {
      state.questions = [];
      state.loading = false;
    },
    setError(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    setLoadingTrue(state) {
      state.loading = true;
    }
  }
});

export interface OverallState {
  pdfs: PdfsSliceState;
}

export const selectPdfs = (state: OverallState) => state.pdfs.pdfs;
export const selectQuestions = (state: OverallState) => state.pdfs.questions;
export const selectWhetherLoading = (state: OverallState) => state.pdfs.loading;
export const selectErrorMessage = (state: OverallState) => state.pdfs.error;

export const { fetchPdfsSuccess, clearQuestionsSuccess, askQuestionSuccess, clearPdfsSuccess, addPdfSuccess, setError, setLoadingTrue, fetchQuestionsSuccess } = pdfsSlice.actions;
export default pdfsSlice.reducer;