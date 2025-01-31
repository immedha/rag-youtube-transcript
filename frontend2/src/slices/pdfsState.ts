export interface Pdf {
  name: string,
  summary: string,
}

export interface Citation {
  pdfName: string;
  pageNumber: number;
  lineFrom: number;
  lineTo: number;
}

export interface Question {
  question: string,
  answer: string,
  citation: Citation[]
}

export interface PdfsSliceState {
  pdfs: Pdf[];
  questions: Question[];
  loading: boolean;
  error: any;
}