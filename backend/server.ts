import express, { Request, Response } from 'express';
import cors from 'cors';
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

    const vectorStore = new Chroma(embeddings, {
        collectionName: "a-test-collection",
        url: "http://localhost:8000", // Optional, will default to this value
      });

      await vectorStore.addDocuments(chunks);

    res.json({ success: 'true' });
});

// TODO:
// 1. Figure out why creating chromadb isn't working and where it is being stored
// 2. Add API endpoint which takes a question as request.body; gets relevant embeddings from chromadb, calls OpenAI with question and embeddings; returns response
//      - figure out how to access chromadb in new endpoint

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
