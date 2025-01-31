import React, { useState, useEffect } from 'react';
import { Citation, Pdf, Question } from './slices/pdfsState';
import { useDispatch, useSelector } from 'react-redux';
import { addPdfRequestAction, askQuestionRequestAction, clearPdfsRequestAction, clearQuestionsRequestAction, fetchPdfsRequestAction, fetchQuestionsRequestAction } from './sagas/pdfsActions';
import { selectErrorMessage, selectPdfs, selectQuestions, selectWhetherLoading, setError } from './slices/pdfsSlice';
import { v4 as uuidv4 } from 'uuid';
import './App.css';


const PdfDropdown = (props: {name: string, summary: string}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSummary = () => {
    setIsOpen(!isOpen);
  };

  // hello
  return (
    <li className="list-element">
      <button
        onClick={toggleSummary}
        className="to-expand-btn"
      >
        {props.name}
      </button>
      {isOpen && <p className={"to-expand-content"}>{props.summary}</p>}
    </li>
  );
}

const QuestionsElement = (props: {question: string, answer: string, citation: Citation[], listCitation: (citation: Citation[]) => JSX.Element}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenCitation, setIsOpenCitation] = useState(false);

  const toggleAnswer = () => {
    if (isOpen) {
      setIsOpen(false);
      setIsOpenCitation(false);
    } else {
      setIsOpen(true);
    }
  };

  const toggleCitation = () => {
    setIsOpenCitation(!isOpenCitation);
  };

  return (
    <li className="list-element">
      <button onClick={toggleAnswer} className="to-expand-btn">{props.question}</button>
      {isOpen && <div className="to-expand-div">
        <p className={"to-expand-content"}>{props.answer} <button className="to-expand-icon" onClick={toggleCitation}>i</button></p>
      </div>}
      {isOpenCitation && <div className="to-expand-div">
        {props.listCitation(props.citation)}
      </div>}
    </li>
  )
}

const App: React.FC = () => {
  type ItemToDisplay = "question" | "uploadPdf" | "nothing";
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [whatToShow, setWhatToShow] = useState<ItemToDisplay>("nothing");
  const [question, setQuestion] = useState<string>("");
  const [pdfNameToSearch, setPdfNameToSearch] = useState<string | null>(null);
  const [pdf, setPdf] = useState<File>();
  const [pdfName, setPdfName] = useState<string>("");

  const dispatch = useDispatch();
  const pdfs: Pdf[] = useSelector(selectPdfs);
  const questions: Question[] = useSelector(selectQuestions);
  const loading: boolean = useSelector(selectWhetherLoading);
  const error: string | null = useSelector(selectErrorMessage);

  useEffect(() => {
    dispatch(fetchPdfsRequestAction());
    dispatch(fetchQuestionsRequestAction());
  }, [dispatch]);

  useEffect(() => {
    if (loading === true) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [loading])

  useEffect(() => {
    if (error) {
      setIsError(true);
    } else {
      setIsError(false);
    }
  }, [error])

  const listPdfs = () => {
    return <ul className="pdfs-list">{
      pdfs.map((pdf: Pdf) => (
        <PdfDropdown key={uuidv4()} name={pdf.name} summary={pdf.summary}/>
      ))
    } </ul>
  }

  const listQuestions = () => {
    return <ul className="questions-list">{
      questions.map((curr: Question) => (
        <QuestionsElement key={uuidv4()} question={curr.question} answer={curr.answer} citation={curr.citation} listCitation={listCitation}/>
      ))
    }</ul>
  }

  const listCitation = (citation: Citation[]) => {
    return <ul>{
      citation.map((item: Citation) => (
          <li className="to-expand-citation" key={uuidv4()}>{item.pdfName} | page {item.pageNumber} | lines {item.lineFrom}-{item.lineTo}</li>
      ))
    }</ul>
  }

  const addPdf = () => {
    if (!pdf || !pdfName) {
      dispatch(setError('Please provide a pdf and pdf name'));
      return;
    }
    dispatch(addPdfRequestAction({pdf, pdfName}));
    setPdf(undefined);
    setPdfName("");
  }

  const askQuestion = () => {
    // pdfName must be valid if it is provided
    if (!question) {
      dispatch(setError('Please provide a question'));
      return;
    }
    if (pdfNameToSearch && !pdfs.find(pdf => pdf.name === pdfNameToSearch)) {
      dispatch(setError('If providing a pdfName to search in, it must be valid'));
      return;
    }
    dispatch(askQuestionRequestAction({question, pdfName: pdfNameToSearch}));
    setQuestion("");
    setPdfNameToSearch("");
  }

  return (
    <div className="App">
      <h1>QueryPDF</h1>
      <div className="operations">
        <button id="upload-btn" onClick={() => setWhatToShow("uploadPdf")}>Upload PDF</button>
        <button id="ask-btn" onClick={() => setWhatToShow("question")}>Ask Question</button>
        <button id="clear-btn" onClick={() => dispatch(clearPdfsRequestAction())}>Clear PDFs</button>
        <button id="clear-btn" onClick={() => dispatch(clearQuestionsRequestAction())}>Clear Questions</button>
      </div>
      {isLoading && <p className="loading-msg">Loading...</p>}
      {isError && <p className="error-msg">There was an error: {error}</p>}
      {!isLoading && !isError && whatToShow === "uploadPdf" && (
        <div className="upload-operations">
          <input className="upload-file-input" type="file" accept=".pdf" required onChange={(e) => setPdf(e.target.files?.[0])} />
          <input className="file-name-input" type="text" value={pdfName} required placeholder="file name..." onChange={e => setPdfName(e.target.value)}/>
          <button className="submit-upload-btn" onClick={addPdf}>Submit</button>
        </div>
      )}
      {!isLoading && !isError && whatToShow === "question" && (
        <div className="ask-operations">
          <textarea className="question-input" value={question} placeholder="Ask a question about the pdfs" onChange={e => setQuestion(e.target.value)}></textarea>
          <input className="file-name-input" type="text" value={pdfNameToSearch || ""} placeholder="pdf name to search in... (optional)" onChange={e => setPdfNameToSearch(e.target.value)}/>
          <button className="submit-question-btn" onClick={askQuestion}>Ask Question</button>
        </div>
      )}
      <h2>All Uploaded Files</h2>
      {listPdfs()}
      <h2>All Asked Questions</h2>
      {listQuestions()}
    </div>
  );
}

export default App;