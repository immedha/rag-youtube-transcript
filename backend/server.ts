import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { ChatOpenAI } from "@langchain/openai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Citation, Pdf, Question } from '../frontend/src/slices/pdfsState';
const { ChromaClient } = require("chromadb");
const {OpenAIEmbeddingFunction} = require('chromadb');

require('dotenv').config();
const PORT = process.env.PORT || 5000;

// Middleware
const express = require("express");
const app = express();
app.use(express.json());  // For parsing application/json
app.use(cors());
app.use(express.urlencoded({ extended: true }));
const multer = require('multer');
const upload = multer({ dest: "uploads/" });

app.use(function(req: Request, res: Response, next: NextFunction) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


interface Metadata {
  pdfName: string;
  src: string;
  pageNumber: number;
  linesFrom: number;
  linesTo: number;
}

const PROMPT = (contextText: string, question: string) => `
    Answer the question based only on the following context:

    ${contextText}

    ---
    Answer the question based on the above context: ${question}`;

const client = new ChromaClient();
const embeddingFunction = new OpenAIEmbeddingFunction({
  openai_api_key: process.env.OPENAI_API_KEY,
})
let allPdfs: Pdf[] = [];
let allQuestions: Question[] = [];

app.get('/api/get-pdfs', async (req: Request, res: Response) => {
  try {
    res.json({ allPdfs });
  } catch (error) {
    res.status(500).send(error);
  }
})

app.get('/api/get-questions', async (req: Request, res: Response) => {
  try {
    res.json({ allQuestions });
  } catch (error) {
    res.status(500).send(error);
  }
})

app.get('/api/reset-db', async (req: Request, res: Response) => {
  try {
    await client.deleteCollection({
      name: "pdf-rag-collection",
      embeddingFunction,
    });
    allPdfs = [];
    res.json({ success: 'true' });
  } catch (error) {
    res.status(500).send(error);
  }
})

app.get('/api/reset-questions', async (req: Request, res: Response) => {
  try {
    allQuestions = [];
    res.json({ success: 'true' });
  } catch (error) {
    res.status(500).send(error);
  }
})

// API Endpoint
app.post('/api/add-pdf', upload.single("file"), async (req: any, res: any) => {
  const file = req.file;
  const { pdfName } = req.body;
  if (!file) {
    return res.status(400).send('File is required in the body');
  }
  if (!pdfName) {
    return res.status(400).send('pdfName is required in the body');
  }
  try {
    // load docs
    const loader: PDFLoader = new PDFLoader(file.path);
    const docs = await loader.load();

    const splitter: RecursiveCharacterTextSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 300,
      chunkOverlap: 100,
    });

    const chunks = await splitter.splitDocuments(docs);
    const collection = await client.getOrCreateCollection({
      name: "pdf-rag-collection",
      embeddingFunction,
    });

    const docsPageContent: string[] = chunks.map((doc: any) => doc.pageContent);
    const docsIds: string[] = []
    for (let i = 0; i < chunks.length; i++) {
      docsIds.push("doc-" + pdfName + "-" + i);
    }

    let docsMetadata: Metadata[] = [];
    for (const chunk of chunks) {
      docsMetadata.push({
        pdfName: pdfName,
        src: chunk.metadata.source,
        pageNumber: chunk.metadata.loc.pageNumber,
        linesFrom: chunk.metadata.loc.lines.from,
        linesTo: chunk.metadata.loc.lines.to,
      });
    }
    await collection.add({
      ids: docsIds,
      metadatas: docsMetadata,
      documents: docsPageContent,
    });
    allPdfs.push({name: pdfName, summary: ""});
    res.json({ addPdf: pdfName});
  } catch (error) {
    res.status(500).send(error);
  }
});

app.post('/api/summarize-pdf', async (req: Request, res: Response) => {
  const { pdfName } = req.body;
  if (!pdfName) {
    return res.status(400).send('pdfName to summarize is required in the body');
  }
  const question: string = "summarize the pdf";
  try {
    const collection = await client.getCollection({
      name: "pdf-rag-collection",
      embeddingFunction,
    });
    const result = await collection.query({
      queryTexts: [question],
      nResults: 5,
      where: {"pdfName": pdfName},
    });

    const contextText: string = result["documents"][0].join("\n\n---\n\n");
    const model = new ChatOpenAI({temperature: 0, model: "gpt-4-turbo"});
    const answer = await model.invoke(PROMPT(contextText, question));
    // add summary
    allPdfs.map((pdf) => {
      if (pdf.name === pdfName) {
        pdf.summary = answer.content as string;
      }
    });
    return res.json({ answer: answer.content as string});
  } catch (error) {
    return res.status(500).send(error);
  }
})

app.post('/api/ask-question', async (req: Request, res: Response) => {
  const { question, pdfName } = req.body;
  if (!question) {
      return res.status(400).send('question is required in the body');
  }

  try {
    const collection = await client.getCollection({
      name: "pdf-rag-collection",
      embeddingFunction,
    });
    let queryObj: any = {
      queryTexts: [question],
      nResults: 5,
    }
    if (pdfName) {
      if (!allPdfs.find(pdf => pdf.name === pdfName)) {
        return res.status(400).send('pdfName is not valid');
      }
      queryObj["where"] = {"pdfName": pdfName};
    }
    const result = await collection.query(queryObj);

    const idsOfDocsUsedToGetAnswer = result["ids"][0]
    const docDataUsedToGetAnswer = await collection.get({
      ids: idsOfDocsUsedToGetAnswer,
      include: ["metadatas"],
    })
    let docsData: Citation[] = [];
    for (const doc of docDataUsedToGetAnswer["metadatas"]) {
      docsData.push({
        pdfName: doc.pdfName,
        pageNumber: doc.pageNumber,
        lineFrom: doc.linesFrom,
        lineTo: doc.linesTo,
      });
    }

    const contextText: string = result["documents"][0].join("\n\n---\n\n");
    const model = new ChatOpenAI({temperature: 0, model: "gpt-4-turbo"});
    const answer = await model.invoke(PROMPT(contextText, question));
    allQuestions.push({question, answer: answer.content as string, citation: docsData});
    return res.json({ answer: answer.content, citation: docsData });
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
