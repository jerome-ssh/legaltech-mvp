import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Set your AssemblyAI API key in .env.local as ASSEMBLYAI_API_KEY
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY || 'YOUR_ASSEMBLYAI_API_KEY';

async function uploadToAssemblyAI(filePath: string) {
  const fileStream = fs.createReadStream(filePath);
  const res = await fetch('https://api.assemblyai.com/v2/upload', {
    method: 'POST',
    headers: {
      authorization: ASSEMBLYAI_API_KEY,
    },
    body: fileStream as any, // node-fetch supports ReadableStream
  });
  const data = await res.json();
  return data.upload_url;
}

async function transcribeWithAssemblyAI(audioUrl: string) {
  const res = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: {
      authorization: ASSEMBLYAI_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ audio_url: audioUrl }),
  });
  const data = await res.json();
  return data.id;
}

async function pollTranscript(id: string) {
  while (true) {
    const res = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
      headers: { authorization: ASSEMBLYAI_API_KEY },
    });
    const data = await res.json();
    if (data.status === 'completed') return data.text;
    if (data.status === 'failed') throw new Error('Transcription failed');
    await new Promise((r) => setTimeout(r, 2000));
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { IncomingForm } = require('formidable');
  type FormidableFile = InstanceType<typeof IncomingForm.File>;
  const form = new IncomingForm({
    uploadDir: '/tmp',
    keepExtensions: true,
  });
  form.parse(req, async (err: any, fields: any, files: { audio?: FormidableFile | FormidableFile[] }) => {
    if (err) return res.status(500).json({ error: 'File upload error' });
    const file = files.audio;
    if (!file) return res.status(400).json({ error: 'No audio file' });
    const filePath = Array.isArray(file) ? file[0].filepath : file.filepath;
    try {
      const audioUrl = await uploadToAssemblyAI(filePath);
      const transcriptId = await transcribeWithAssemblyAI(audioUrl);
      const text = await pollTranscript(transcriptId);
      res.status(200).json({ transcript: text });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Transcription failed' });
    } finally {
      fs.unlink(filePath, () => {});
    }
  });
} 