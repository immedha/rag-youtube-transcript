import express, { Request, Response } from 'express';
import cors from 'cors';
import { ChatOpenAI } from "@langchain/openai";
const app = express();
const PORT = process.env.PORT || 5000;
import { YoutubeLoader } from '@langchain/community/document_loaders/web/youtube';
import { OpenAIEmbeddings } from "@langchain/openai";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
require('dotenv').config();

// Middleware
app.use(cors());
app.use(express.json());  // For parsing application/json

let vectorStore: Chroma;

// API Endpoint
app.post('/api/createdb', async (req: Request, res: Response) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).send('URL is required in the body');
    }
    const loader = YoutubeLoader.createFromUrl(url, {
    language: "en",
    addVideoInfo: true,
    });
    const docs = await loader.load();
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 300,
        chunkOverlap: 100,
      });
    const chunks = await splitter.splitDocuments(docs);

    const embeddings = new OpenAIEmbeddings({
        apiKey: process.env.OPENAI_API_KEY,
      });

    vectorStore = new Chroma(embeddings, {
      collectionName: "a-test-collection",
      url: "http://localhost:8000", // Optional, will default to this value
    });

    await vectorStore.addDocuments(chunks);

    res.json({ success: 'true' });
});

app.post('/api/askquestion', async (req: Request, res: Response) => {
  const { question } = req.body;
  if (!question) {
      return res.status(400).send('question is required in the body');
  }
  try {
    const result = await vectorStore.similaritySearch(question, 3);

    const contextText: string = result.map(a => a.pageContent).join("\n\n---\n\n");

    const prompt = `
    Answer the question based only on the following context:

    ${contextText}

    ---

    Answer the question based on the above context: ${question}`;

    const model = new ChatOpenAI();
    const answer = await model.invoke(prompt);
    return res.json({ answer: answer.content });
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
