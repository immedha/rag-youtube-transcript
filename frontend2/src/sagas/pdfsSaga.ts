import { call, put, takeEvery, all } from 'redux-saga/effects';
import axios from 'axios';
import { addPdfRequestAction, addPdfRequestActionFormat, askQuestionRequestAction, askQuestionRequestActionFormat, clearPdfsRequestAction, clearQuestionsRequestAction, fetchPdfsRequestAction, fetchQuestionsRequestAction } from './pdfsActions';
import { Citation, Pdf, Question } from '../slices/pdfsState';
import { addPdfSuccess, askQuestionSuccess, clearPdfsSuccess, clearQuestionsSuccess, fetchPdfsSuccess, fetchQuestionsSuccess, setError, setLoadingTrue } from '../slices/pdfsSlice';

function* fetchPdfsRequest() {
  yield put(setLoadingTrue());
  const response: Pdf[] = yield call(getPdfs);
  try {
    yield put(fetchPdfsSuccess(response));
  } catch (error) {
    yield put(setError('failed to fetch all pdfs'));
  }
}

function* fetchQuestionsRequest() {
  yield put(setLoadingTrue());
  const response: Question[] = yield call(getQuestions);
  try {
    console.log('tetst');
    yield put(fetchQuestionsSuccess(response));
  } catch (error) {
    yield put(setError('failed to fetch all questions'));
  }
}
//hello world
function* addPdfRequest(action: addPdfRequestActionFormat) {
  yield put(setLoadingTrue());
  const {pdf, pdfName} = action.payload;
  if (!pdf) {
    yield put(setError('Please provide a pdf file'));
  }
  try {

    const result: {name: string, summary: string} = yield call(addPdf, pdf, pdfName);
    yield put(addPdfSuccess(result));
  } catch (error) {
    yield put(setError('failed to add pdf'));
  }
}

function* clearPdfsRequest() {
  yield put(setLoadingTrue());
  try {
    yield call(resetDb);
    yield put(clearPdfsSuccess());
  } catch (error) {
    yield put(setError('failed to clear pdfs'));
  }
}

function* clearQuestionsRequest() {
  yield put(setLoadingTrue());
  try {
    yield call(resetQuestions);
    yield put(clearQuestionsSuccess());
  } catch (error) {
    yield put(setError('failed to clear questions'));
  }
}

function* askQuestionRequest(action: askQuestionRequestActionFormat) {
  yield put(setLoadingTrue());
  const {question, pdfName} = action.payload;
  try {
    const response: {question: string, answer: string, citation: Citation[]} = yield call(askQuestion, question, pdfName);
    yield put(askQuestionSuccess(response));
  } catch (error) {
    yield put(setError('failed to ask question'));
  }
}

const askQuestion = async (question: string, pdfName: string | null) => {
  try {
    let dataBody: any = {question};
    if (pdfName) {
      dataBody["pdfName"] = pdfName;
    }

    const response = await axios.post('http://localhost:5000/api/ask-question', dataBody);
    const addPdfName = pdfName ? ` for pdf ${pdfName}` : '';
    return {question: question + addPdfName, ...response.data};
  } catch (error) {
    throw new Error('' + error)
  }
}


export default function* pdfsSaga() {
  yield all([
    takeEvery(fetchPdfsRequestAction.type, fetchPdfsRequest),
    takeEvery(fetchQuestionsRequestAction.type, fetchQuestionsRequest),
    takeEvery(addPdfRequestAction.type, addPdfRequest),
    takeEvery(clearPdfsRequestAction.type, clearPdfsRequest),
    takeEvery(askQuestionRequestAction.type, askQuestionRequest),
    takeEvery(clearQuestionsRequestAction.type, clearQuestionsRequest),
  ]);
}

const getPdfs = async () => {
  try {
    const res = await axios.get('http://localhost:5000/api/get-pdfs');
    return res.data.allPdfs;
  } catch (err) {
    throw new Error('' + err)
  }
}

const getQuestions = async () => {
  try {
    const res = await axios.get('http://localhost:5000/api/get-questions');
    return res.data.allQuestions;
  } catch (err) {
    throw new Error('' + err)
  }
}

const addPdf = async (pdf: File, pdfName: string) => {
  if (!pdf) {
    throw new Error('Please provide a pdf file');
  }
  const formData = new FormData();
  formData.append('file', pdf);
  formData.append('pdfName', pdfName);
  try {
    const addPdfResponse = await axios.post('http://localhost:5000/api/add-pdf', formData);
    const askQuestionResponse = await axios.post('http://localhost:5000/api/summarize-pdf', {pdfName});
    return {name: addPdfResponse.data.addPdf, summary: askQuestionResponse.data.answer};
  } catch (error) {
    throw new Error('' + error)
  }
}

const resetDb = async () => {
  try {
    await axios.get('http://localhost:5000/api/reset-db');
  } catch (error) {
    throw new Error('' + error)
  }
}

const resetQuestions = async () => {
  try {
    await axios.get('http://localhost:5000/api/reset-questions');
  } catch (error) {
    throw new Error('' + error)
  }
}