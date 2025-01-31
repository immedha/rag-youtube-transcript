import { createAction } from '@reduxjs/toolkit';

export const fetchPdfsRequestAction = createAction('pdfs/fetchPdfsRequestAction');

export const fetchQuestionsRequestAction = createAction('pdfs/fetchQuestionsRequestAction');

export interface addPdfRequestActionPayload {
  pdf: File;
  pdfName: string;
}

export interface addPdfRequestActionFormat {
  payload: addPdfRequestActionPayload
  type: string
}

export const addPdfRequestAction = createAction<addPdfRequestActionPayload>('pdfs/addPdfRequestAction');

export const clearPdfsRequestAction = createAction('pdfs/clearPdfsRequestAction');
export const clearQuestionsRequestAction = createAction('pdfs/clearQuestionsRequestAction');

export interface askQuestionRequestActionPayload {
  question: string;
  pdfName: string | null;
}

export interface askQuestionRequestActionFormat {
  payload: askQuestionRequestActionPayload
  type: string
}

export const askQuestionRequestAction = createAction<askQuestionRequestActionPayload>('pdfs/askQuestionRequestAction');
