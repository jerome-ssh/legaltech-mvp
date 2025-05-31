import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, FilePlus2Icon, Sparkles, Lightbulb, FileText, Download, Trash2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import NoteDetailModal from './NoteDetailModal';
import { useUser } from '@clerk/nextjs';
import { toast } from '@/components/ui/use-toast';

// Dynamically import a rich text editor (e.g., React Quill or similar)
const ReactQuill = dynamic(() => import('react-quill').then(mod => mod.default), { ssr: false }) as any;
import 'react-quill/dist/quill.snow.css';

interface MatterNotesProps {
  matterId: string;
}

interface Note {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  title: string;
}

const MAX_PASTE_LENGTH = 50000;

export default function MatterNotes({ matterId }: MatterNotesProps) {
  const { user } = useUser();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorValue, setEditorValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [showDownloadPrompt, setShowDownloadPrompt] = useState(false);
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [selectedNoteForAction, setSelectedNoteForAction] = useState<Note | null>(null);

  useEffect(() => {
    fetchNotes();
    // Fetch the Supabase profile ID for the current Clerk user
    const fetchProfileId = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('clerk_id', user.id)
        .single();
      if (!error && data) setProfileId(data.id);
    };
    fetchProfileId();
  }, [user]);

  const fetchNotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("matter_notes")
        .select("id, content, author_id, created_at, title")
        .eq("matter_id", matterId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setNotes(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Open modal for new note
  const handleAddNote = () => {
    setSelectedNote(null);
    setModalOpen(true);
  };

  // Open modal for editing/viewing a note
  const handleOpenNote = (note: Note) => {
    setSelectedNote(note);
    setModalOpen(true);
  };

  // After save, close modal and refresh notes
  const handleSaveNote = () => {
    setModalOpen(false);
    setSelectedNote(null);
    fetchNotes();
  };

  const handleAISummarize = async () => {
    setAiLoading(true);
    setAiSummary('');
    try {
      const res = await fetch(`/api/matters/${matterId}/notes/ai-summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editorValue })
      });
      if (!res.ok) throw new Error('AI summarization failed');
      const data = await res.json();
      setAiSummary(data.summary || '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAISuggest = async () => {
    setAiLoading(true);
    setAiSuggestion('');
    try {
      const res = await fetch(`/api/matters/${matterId}/notes/ai-suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editorValue })
      });
      if (!res.ok) throw new Error('AI suggestion failed');
      const data = await res.json();
      setAiSuggestion(data.suggestion || '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleDownloadPDF = async (note: Note, matterId: string) => {
    setSelectedNoteForAction(note);
    setShowDownloadPrompt(true);
  };

  const confirmDownload = async () => {
    if (!selectedNoteForAction) return;
    try {
      const res = await fetch(`/api/matters/${matterId}/notes/${selectedNoteForAction.id}/export-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedNoteForAction.title,
          content: selectedNoteForAction.content,
          metadata: {
            matterId,
            createdAt: selectedNoteForAction.created_at,
            author: selectedNoteForAction.author_id || 'Unknown',
          }
        }),
      });
      if (!res.ok) throw new Error('Failed to export PDF');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedNoteForAction.title || 'note'}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message || 'Failed to export PDF');
    } finally {
      setShowDownloadPrompt(false);
      setSelectedNoteForAction(null);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      setSelectedNoteForAction(note);
      setShowDeletePrompt(true);
    }
  };

  const confirmDelete = async () => {
    if (!selectedNoteForAction) return;
    try {
      const res = await fetch(`/api/matters/${matterId}/notes/${selectedNoteForAction.id}`, {
        method: 'DELETE',
      });
      
      // Only show error if the response is not ok and not 404 (404 means note was already deleted)
      if (!res.ok && res.status !== 404) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete note');
      }
      
      // Update the UI by removing the deleted note
      setNotes(prevNotes => prevNotes.filter(note => note.id !== selectedNoteForAction.id));
      
      toast({
        title: "Success",
        description: "Note deleted successfully",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to delete note',
        variant: "destructive"
      });
    } finally {
      setShowDeletePrompt(false);
      setSelectedNoteForAction(null);
    }
  };

  // Custom paste handler for ReactQuill
  const handleQuillPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData?.getData('text/plain') || '';
    if (text.length > MAX_PASTE_LENGTH) {
      e.preventDefault();
      toast({
        title: 'Paste too large',
        description: `You tried to paste ${text.length} characters. Limit is ${MAX_PASTE_LENGTH}.`,
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Matter Notes</h3>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          onClick={handleAddNote}
        >
          Add Note
        </button>
      </div>
      {loading ? (
        <div className="py-4">Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : notes.length === 0 ? (
        <div className="text-gray-500">No notes found.</div>
      ) : (
        <ul className="space-y-4">
          {notes.map((note) => (
            <li key={note.id} className="border-b pb-2 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <button
                    className="font-semibold text-blue-700 hover:underline text-left cursor-pointer bg-transparent border-none p-0"
                    onClick={() => handleOpenNote(note)}
                    style={{ fontSize: '1.1em' }}
                  >
                    {note.title}
                  </button>
                  <span className="text-xs text-gray-500">{new Date(note.created_at).toLocaleString()}</span>
                </div>
                <div className="prose prose-sm max-w-none mt-1">
                  {note.content.replace(/<[^>]*>/g, '').split(' ').slice(0, 3).join(' ')}...
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="ml-4 flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 text-gray-600 border border-gray-200"
                  title="Download as PDF"
                  onClick={() => handleDownloadPDF(note, matterId)}
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  className="flex items-center gap-1 px-2 py-1 rounded hover:bg-red-100 text-red-600 border border-red-200"
                  title="Delete Note"
                  onClick={() => handleDeleteNote(note.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {(modalOpen) && (
        <NoteDetailModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          note={selectedNote}
          onSave={handleSaveNote}
          matterId={matterId}
        />
      )}
      {showDownloadPrompt && selectedNoteForAction && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Download Note</h3>
            <p className="mb-4">Do you want to download note "{selectedNoteForAction.title}" as PDF?</p>
            <div className="flex justify-end mt-4">
              <button onClick={() => setShowDownloadPrompt(false)} className="mr-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
              <button onClick={confirmDownload} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Download</button>
            </div>
          </div>
        </div>
      )}
      {showDeletePrompt && selectedNoteForAction && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Delete Note</h3>
            <p className="mb-4">Are you sure you want to delete note "{selectedNoteForAction.title}"?</p>
            <div className="flex justify-end mt-4">
              <button onClick={() => setShowDeletePrompt(false)} className="mr-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 