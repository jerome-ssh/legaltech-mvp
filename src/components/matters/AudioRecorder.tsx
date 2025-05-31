import React, { useRef, useState } from 'react';
import { X, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AudioRecorderProps {
  onUpload?: (file: File) => void;
  onDelete?: (fileId: string) => void;
  uploadedFiles?: Array<{ id: string; url: string; name: string }>;
  onTranscript?: (text: string) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onTranscript }) => {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  const startRecording = async () => {
    setError(null);
    setTranscript('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunks.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.current.push(e.data);
        }
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        // Automatically transcribe after recording stops
        transcribeAudio(blob);
      };
      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      setError('Microphone access denied or not available.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    // Stop all tracks to release the microphone
    mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
  };

  const transcribeAudio = async (blob: Blob) => {
    setTranscribing(true);
    setError(null);
    setTranscript('');
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'audio.webm');
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Transcription failed');
      const data = await res.json();
      setTranscript(data.transcript || '');
      if (onTranscript && data.transcript) {
        onTranscript(data.transcript);
      }
    } catch (err: any) {
      setError(err.message || 'Transcription failed');
    } finally {
      setTranscribing(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {error && <span className="text-red-600 text-xs">{error}</span>}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 items-center">
          {!recording ? (
            <Button
              variant="outline"
              className="gap-1 px-3 py-1.5 rounded-md"
              onClick={startRecording}
            >
              <Mic className="w-4 h-4" /> Start Recording
            </Button>
          ) : (
            <Button
              variant="destructive"
              className="gap-1 px-3 py-1.5 rounded-md"
              onClick={stopRecording}
            >
              <Mic className="w-4 h-4" /> Stop Recording
            </Button>
          )}
        </div>
        {transcribing && (
          <div className="flex flex-col gap-2 mt-2">
            <span className="text-xs text-gray-500">Transcribing...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioRecorder; 