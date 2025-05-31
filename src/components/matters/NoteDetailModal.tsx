import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState, useEffect, useRef, useCallback } from 'react';
import { EditorContent, useEditor, BubbleMenu, FloatingMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';
import { common } from 'lowlight';
import Placeholder from '@tiptap/extension-placeholder';
import AudioRecorder from './AudioRecorder';
import { cn } from '@/lib/utils'; // For conditional classNames if available
import { supabase } from '@/lib/supabase';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  MoreVertical,
  Save,
  Mic,
  Upload,
  FileText,
  Sparkles,
  Brain,
  Lightbulb,
  Link2,
  Edit3,
  Clock,
  Pencil,
  CheckCircle2,
  Loader2,
  X,
  Maximize2,
  Minimize2,
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Redo2,
  Undo2,
  Type,
  TextCursorInput,
  PaintBucket,
  Highlighter,
  Link as LinkIcon,
  Image as ImageIcon,
  Trash2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Eraser,
  Asterisk,
  Underline as UnderlineIcon
} from "lucide-react";
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import debounce from 'lodash/debounce';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { Paperclip } from 'lucide-react';
import { GripVertical } from 'lucide-react';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import { Extension } from '@tiptap/core';
import { Editor, Range } from '@tiptap/core';
import { RawCommands } from '@tiptap/core';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import Heading from '@tiptap/extension-heading';
// TipTap and other imports will be added as features are implemented

interface NoteDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: any; // Replace with proper Note type
  onSave: (note: any) => void;
  matterId: string;
}

const lowlight = createLowlight(common);

// Attachment block extension
const Attachment = Node.create({
  name: 'attachment',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      name: { default: '' },
      type: { default: '' },
      pending: { default: true },
      url: { default: '' },
      id: { default: '' }, // for matching
    };
  },
  parseHTML() {
    return [
      { tag: 'div[data-type="attachment"]' },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    if (HTMLAttributes.pending) {
      return [
        'div',
        mergeAttributes(HTMLAttributes, { 'data-type': 'attachment', class: 'attachment-block', draggable: 'true' }),
        [
          'span',
          { class: 'inline-flex items-center gap-2 px-2 py-1 rounded bg-yellow-100 text-yellow-800 border border-yellow-300' },
          [ 'span', { innerHTML: '<svg class="inline w-4 h-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 6h6M9 12h6M9 18h6"/></svg>' }, '' ],
          [ 'span', { innerHTML: getFileIconSVG(HTMLAttributes.type) }, '' ],
          [ 'span', { contenteditable: 'true', 'data-rename-attachment': HTMLAttributes.id, spellcheck: 'false', class: 'editable-filename' }, HTMLAttributes.name ],
          [ 'span', { class: 'italic ml-2' }, '(pending upload)' ],
          [ 'button', { 'data-remove-attachment': HTMLAttributes.id, class: 'ml-2 text-red-500' }, '✕' ]
        ]
      ];
    } else {
      return [
        'div',
        mergeAttributes(HTMLAttributes, { 'data-type': 'attachment', class: 'attachment-block', draggable: 'true' }),
        [
          'span',
          { class: 'inline-flex items-center gap-2 px-2 py-1 rounded bg-green-100 text-green-800 border border-green-300' },
          [ 'span', { innerHTML: '<svg class="inline w-4 h-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 6h6M9 12h6M9 18h6"/></svg>' }, '' ],
          [ 'a', { href: HTMLAttributes.url, target: '_blank', rel: 'noopener noreferrer', class: 'underline', innerHTML: getFileIconSVG(HTMLAttributes.type) + ' ' + HTMLAttributes.name }, '' ]
        ]
      ];
    }
  },
  // @ts-ignore
  addCommands() {
    return {
      updateAttachmentAttrs: (id: any, attrs: any) => ({ commands, state }: any) => {
        const { doc } = state;
        let found = false;
        doc.descendants((node: any, pos: any) => {
          if (node.type.name === 'attachment' && node.attrs.id === id) {
            found = true;
            commands.command(({ tr }: any) => {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...attrs });
              return true;
            });
            return false;
          }
          return true;
        });
        return found;
      },
      removeAttachmentById: (id: any) => ({ commands, state }: any) => {
        const { doc } = state;
        let found = false;
        doc.descendants((node: any, pos: any) => {
          if (node.type.name === 'attachment' && node.attrs.id === id) {
            found = true;
            commands.deleteRange({ from: pos, to: pos + node.nodeSize });
            return false;
          }
          return true;
        });
        return found;
      },
    };
  },
});

// Audio block extension
const AudioBlock = Node.create({
  name: 'audioBlock',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      name: { default: '' },
      pending: { default: true },
      url: { default: '' },
      id: { default: '' },
    };
  },
  parseHTML() {
    return [
      { tag: 'div[data-type="audio-block"]' },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    if (HTMLAttributes.pending) {
      return [
        'div',
        mergeAttributes(HTMLAttributes, { 'data-type': 'audio-block', class: 'audio-block', draggable: 'true' }),
        [
          'span',
          { class: 'inline-flex items-center gap-2 px-2 py-1 rounded bg-yellow-100 text-yellow-800 border border-yellow-300' },
          [ 'span', { innerHTML: '<svg class="inline w-4 h-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 6h6M9 12h6M9 18h6"/></svg>' }, '' ],
          [ 'span', { innerHTML: getFileIconSVG('audio/webm') }, '' ],
          [ 'span', { contenteditable: 'true', 'data-rename-audio': HTMLAttributes.id, spellcheck: 'false', class: 'editable-filename' }, HTMLAttributes.name ],
          [ 'span', { class: 'italic ml-2' }, '(pending upload)' ],
          [ 'button', { 'data-remove-audio': HTMLAttributes.id, class: 'ml-2 text-red-500' }, '✕' ]
        ]
      ];
    } else {
      return [
        'div',
        mergeAttributes(HTMLAttributes, { 'data-type': 'audio-block', class: 'audio-block', draggable: 'true' }),
        [
          'span',
          { class: 'inline-flex items-center gap-2 px-2 py-1 rounded bg-green-100 text-green-800 border border-green-300' },
          [ 'span', { innerHTML: '<svg class="inline w-4 h-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 6h6M9 12h6M9 18h6"/></svg>' }, '' ],
          [ 'audio', { controls: true, src: HTMLAttributes.url, style: 'vertical-align: middle; max-width: 200px;' }, '' ],
          [ 'span', {}, HTMLAttributes.name ]
        ]
      ];
    }
  },
  // @ts-ignore
  addCommands() {
    return {
      updateAudioAttrs: (id: any, attrs: any) => ({ commands, state }: any) => {
        const { doc } = state;
        let found = false;
        doc.descendants((node: any, pos: any) => {
          if (node.type.name === 'audioBlock' && node.attrs.id === id) {
            found = true;
            commands.command(({ tr }: any) => {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...attrs });
              return true;
            });
            return false;
          }
          return true;
        });
        return found;
      },
      removeAudioById: (id: any) => ({ commands, state }: any) => {
        const { doc } = state;
        let found = false;
        doc.descendants((node: any, pos: any) => {
          if (node.type.name === 'audioBlock' && node.attrs.id === id) {
            found = true;
            commands.deleteRange({ from: pos, to: pos + node.nodeSize });
            return false;
          }
          return true;
        });
        return found;
      },
    };
  },
});

// Custom Font Size Extension
const CustomFontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize,
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {}
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              }
            },
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ commands }: { commands: any }) => {
        return commands.setMark('textStyle', { fontSize });
      },
      unsetFontSize: () => ({ commands }: { commands: any }) => {
        return commands.setMark('textStyle', { fontSize: null });
      },
    } as Partial<RawCommands>;
  },
});

// Google Docs style toolbar
const GOOGLE_FONTS = [
  { label: 'Arial', value: 'arial' },
  { label: 'Times New Roman', value: 'times-new-roman' },
  { label: 'Roboto', value: 'roboto' },
  { label: 'Georgia', value: 'georgia' },
  { label: 'Courier New', value: 'courier-new' },
];
const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 24, 36, 48, 72];
const STYLES = [
  { label: 'Normal text', value: 'paragraph' },
  { label: 'Heading 1', value: 'heading1' },
  { label: 'Heading 2', value: 'heading2' },
  { label: 'Heading 3', value: 'heading3' },
  { label: 'Heading 4', value: 'heading4' },
  { label: 'Heading 5', value: 'heading5' },
  { label: 'Heading 6', value: 'heading6' },
];

function GoogleDocsToolbar({ editor }: { editor: any }) {
  return (
    <div className="flex flex-wrap items-center gap-1 bg-white/90 rounded-xl shadow px-2 py-1 mb-2 border border-gray-200 sticky top-0 z-20 backdrop-blur-lg transition-all">
      {/* Undo/Redo */}
      <button onClick={() => editor.chain().focus().undo().run()} title="Undo" className="p-1 rounded hover:bg-gray-100"><Undo2 className="w-4 h-4" /></button>
      <button onClick={() => editor.chain().focus().redo().run()} title="Redo" className="p-1 rounded hover:bg-gray-100"><Redo2 className="w-4 h-4" /></button>
      <span className="mx-1 border-l h-5 border-gray-200" />
      {/* Styles dropdown */}
      <select
        className="text-sm rounded px-2 py-1 border border-gray-200 bg-white"
        value={editor.isActive('heading', { level: 1 }) ? 'heading1' : 
               editor.isActive('heading', { level: 2 }) ? 'heading2' : 
               editor.isActive('heading', { level: 3 }) ? 'heading3' :
               editor.isActive('heading', { level: 4 }) ? 'heading4' :
               editor.isActive('heading', { level: 5 }) ? 'heading5' :
               editor.isActive('heading', { level: 6 }) ? 'heading6' : 'paragraph'}
        onChange={e => {
          const v = e.target.value;
          if (v === 'paragraph') {
            editor.chain().focus().setParagraph().run();
          } else {
            const level = parseInt(v.replace('heading', ''));
            editor.chain().focus().toggleHeading({ level }).run();
          }
        }}
      >
        {STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
      {/* Font family */}
      <select
        className="text-sm rounded px-2 py-1 border border-gray-200 bg-white"
        value={editor.getAttributes('textStyle').fontFamily || ''}
        onChange={e => editor.chain().focus().setFontFamily(e.target.value).run()}
      >
        <option value="">Default</option>
        {GOOGLE_FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
      </select>
      {/* Font size */}
      <select
        className="text-sm rounded px-2 py-1 border border-gray-200 bg-white"
        value={editor.getAttributes('textStyle').fontSize || ''}
        onChange={e => {
          const size = e.target.value;
          if (size === '') {
            editor.chain().focus().unsetFontSize().run();
          } else {
            editor.chain().focus().setFontSize(size + 'px').run();
          }
        }}
      >
        <option value="">Default</option>
        {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      {/* Bold, Italic, Underline, Strikethrough */}
      <button onClick={() => editor.chain().focus().toggleBold().run()} title="Bold (Ctrl+B)" className={editor.isActive('bold') ? 'bg-blue-100 text-blue-700 shadow px-2 py-1 rounded' : 'hover:bg-gray-100 px-2 py-1 rounded'}><Bold className="w-4 h-4" /></button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic (Ctrl+I)" className={editor.isActive('italic') ? 'bg-blue-100 text-blue-700 shadow px-2 py-1 rounded' : 'hover:bg-gray-100 px-2 py-1 rounded'}><Italic className="w-4 h-4" /></button>
      <button onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline (Ctrl+U)" className={editor.isActive('underline') ? 'bg-blue-100 text-blue-700 shadow px-2 py-1 rounded' : 'hover:bg-gray-100 px-2 py-1 rounded'}><UnderlineIcon className="w-4 h-4" /></button>
      <button onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough" className={editor.isActive('strike') ? 'bg-blue-100 text-blue-700 shadow px-2 py-1 rounded' : 'hover:bg-gray-100 px-2 py-1 rounded'}><Strikethrough className="w-4 h-4" /></button>
      <span className="mx-1 border-l h-5 border-gray-200" />
      {/* Text color */}
      <input
        type="color"
        title="Text color"
        className="w-6 h-6 p-0 border border-gray-200 rounded"
        value={editor.getAttributes('textStyle').color || '#000000'}
        onChange={e => editor.chain().focus().setColor(e.target.value).run()}
      />
      {/* Highlight */}
      <input
        type="color"
        title="Highlight"
        className="w-6 h-6 p-0 border border-gray-200 rounded"
        value={editor.getAttributes('highlight').color || '#ffff00'}
        onChange={e => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()}
      />
      <span className="mx-1 border-l h-5 border-gray-200" />
      {/* Link */}
      <button onClick={() => editor.chain().focus().toggleLink({ href: prompt('Enter link:') || '' }).run()} title="Insert link" className={editor.isActive('link') ? 'bg-blue-100 text-blue-700 shadow px-2 py-1 rounded' : 'hover:bg-gray-100 px-2 py-1 rounded'}><LinkIcon className="w-4 h-4" /></button>
      {/* Image */}
      <button onClick={() => {
        const url = prompt('Enter image URL:');
        if (url) editor.chain().focus().setImage({ src: url }).run();
      }} title="Insert image" className="p-1 rounded hover:bg-gray-100"><ImageIcon className="w-4 h-4" /></button>
      <span className="mx-1 border-l h-5 border-gray-200" />
      {/* Align */}
      <button onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Align left" className={editor.isActive({ textAlign: 'left' }) ? 'bg-blue-100 text-blue-700 shadow p-1 rounded' : 'p-1 rounded hover:bg-gray-100'}><AlignLeft className="w-4 h-4" /></button>
      <button onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Align center" className={editor.isActive({ textAlign: 'center' }) ? 'bg-blue-100 text-blue-700 shadow p-1 rounded' : 'p-1 rounded hover:bg-gray-100'}><AlignCenter className="w-4 h-4" /></button>
      <button onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Align right" className={editor.isActive({ textAlign: 'right' }) ? 'bg-blue-100 text-blue-700 shadow p-1 rounded' : 'p-1 rounded hover:bg-gray-100'}><AlignRight className="w-4 h-4" /></button>
      <button onClick={() => editor.chain().focus().setTextAlign('justify').run()} title="Justify" className={editor.isActive({ textAlign: 'justify' }) ? 'bg-blue-100 text-blue-700 shadow p-1 rounded' : 'p-1 rounded hover:bg-gray-100'}><AlignJustify className="w-4 h-4" /></button>
      <span className="mx-1 border-l h-5 border-gray-200" />
      {/* Lists */}
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bulleted list" className={editor.isActive('bulletList') ? 'bg-blue-100 text-blue-700 shadow px-2 py-1 rounded' : 'hover:bg-gray-100 px-2 py-1 rounded'}><List className="w-4 h-4" /></button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list" className={editor.isActive('orderedList') ? 'bg-blue-100 text-blue-700 shadow px-2 py-1 rounded' : 'hover:bg-gray-100 px-2 py-1 rounded'}><ListOrdered className="w-4 h-4" /></button>
      {/* Indent/Outdent (stub, disabled) */}
      <button title="Decrease indent" className="p-1 rounded hover:bg-gray-100" disabled><ChevronLeft className="w-4 h-4" /></button>
      <button title="Increase indent" className="p-1 rounded hover:bg-gray-100" disabled><ChevronRight className="w-4 h-4" /></button>
      <span className="mx-1 border-l h-5 border-gray-200" />
      {/* Clear formatting */}
      <button onClick={() => editor.chain().focus().unsetAllMarks().run()} title="Clear formatting" className="p-1 rounded hover:bg-gray-100"><Eraser className="w-4 h-4" /></button>
    </div>
  );
}

// Helper to get SVG icon for file type
const getFileIconSVG = (type: string) => {
  if (type.startsWith('image/')) return '<svg class="inline w-4 h-4 text-blue-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';
  if (type.startsWith('audio/')) return '<svg class="inline w-4 h-4 text-purple-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 19V6l12-2v13"/><circle cx="6" cy="18" r="3"/></svg>';
  if (type === 'application/pdf') return '<svg class="inline w-4 h-4 text-red-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 2h9l6 6v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><polyline points="14 2 14 8 20 8"/></svg>';
  if (type.includes('word')) return '<svg class="inline w-4 h-4 text-blue-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><text x="12" y="16" text-anchor="middle" font-size="10" fill="currentColor">W</text></svg>';
  if (type.includes('excel')) return '<svg class="inline w-4 h-4 text-green-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><text x="12" y="16" text-anchor="middle" font-size="10" fill="currentColor">X</text></svg>';
  return '<svg class="inline w-4 h-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>';
};

// --- Error boundary for editor ---
import React from 'react';

function EditorErrorBoundary({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<Error | null>(null);
  if (error) {
    return <div className="p-6 text-red-600 bg-red-50 rounded-xl">Editor crashed: {error.message}</div>;
  }
  // @ts-ignore
  return React.cloneElement(children, { onError: setError });
}

const MAX_PASTE_LENGTH = 50000;

// Add a threshold for large content
const LARGE_CONTENT_LENGTH = 5000;

// Helper for localStorage key
const getNoteDraftKey = (noteId: string | undefined, matterId: string) => `note-draft-${matterId}-${noteId || 'new'}`;

export default function NoteDetailModal({ open, onOpenChange, note, onSave, matterId }: NoteDetailModalProps) {
  const { user } = useUser();
  const { toast } = useToast ? useToast() : { toast: (args: any) => alert(args.title + (args.description ? ': ' + args.description : '')) };
  // State for title, content, attachments, audio, AI, versioning, etc.
  const [title, setTitle] = useState(note?.title || '');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [pendingAttachments, setPendingAttachments] = useState<{ file: File; id: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [audioFiles, setAudioFiles] = useState<any[]>([]);
  const [pendingAudioFiles, setPendingAudioFiles] = useState<{ file: File; id: string }[]>([]);
  const [audioUploading, setAudioUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null); // 'summarize', 'suggest', 'keypoints', 'ask', or null
  const [aiResult, setAiResult] = useState<string>('');
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const aiResultRef = useRef<HTMLDivElement>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [versionLoading, setVersionLoading] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState<string | null>(null);
  const isEditMode = !!note;
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [reminderDate, setReminderDate] = useState<Date | null>(null);
  const [reminderPending, setReminderPending] = useState<Date | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const lastSavedContent = useRef(note?.content || '');
  const lastSavedTitle = useRef(note?.title || '');
  const [fullscreen, setFullscreen] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);

  // Auto-save when modal closes
  const prevOpenRef = useRef(open);
  useEffect(() => {
    if (prevOpenRef.current && !open && hasUnsavedChanges) {
      handleSave();
    }
    prevOpenRef.current = open;
  }, [open]);

  // TipTap editor instance
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: { depth: 100, newGroupDelay: 500 },
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
          HTMLAttributes: {
            class: 'font-bold',
          },
        },
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc pl-4',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal pl-4',
          },
        },
      }),
      Heading.configure({
        levels: [1, 2, 3, 4, 5, 6],
        HTMLAttributes: {
          class: 'font-bold',
        },
      }),
      Highlight,
      Underline,
      Link,
      TaskList,
      TaskItem,
      CodeBlockLowlight.configure({ lowlight }),
      Placeholder.configure({ placeholder: 'Write your findings, arguments, or annotations here...' }),
      Attachment,
      AudioBlock,
      TextStyle,
      Color,
      FontFamily,
      CustomFontSize,
      TextAlign.configure({ types: ['heading', 'paragraph', 'bulletList', 'orderedList'] }),
      Image,
    ],
    content: note?.content || '',
    onUpdate: ({ editor }) => {
      try {
        setHasUnsavedChanges(true);
        // Check if content is large
        const html = editor.getHTML();
        if (html.length > LARGE_CONTENT_LENGTH) {
          setIsScrollable(true);
          setFullscreen(true);
        } else {
          setIsScrollable(false);
        }
      } catch (err: any) {
        toast({
          title: 'Editor Error',
          description: err.message || 'An error occurred in the editor.',
          variant: 'destructive',
        });
      }
    },
    editorProps: {
      handlePaste(view, event, slice) {
        const text = event.clipboardData?.getData('text/plain') || '';
        if (text.length > MAX_PASTE_LENGTH) {
          event.preventDefault();
          toast({
            title: 'Paste too large',
            description: `You tried to paste ${text.length} characters. Limit is ${MAX_PASTE_LENGTH}.`,
            variant: 'destructive',
          });
          return true;
        }
        return false;
      },
    },
  });

  // Update title handler with auto-save
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (newTitle !== lastSavedTitle.current) {
      setHasUnsavedChanges(true);
    }
  };

  useEffect(() => {
    if (editor && note?.content) {
      editor.commands.setContent(note.content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note?.content, editor]);

  // Fetch attachments when modal opens or note changes
  useEffect(() => {
    if (!note?.id) return;
    const fetchAttachments = async () => {
      const res = await fetch(`/api/matters/${note.id}/notes/attachments`);
      const data = await res.json();
      setAttachments(data.attachments || []);
    };
    fetchAttachments();
  }, [note?.id, open]);

  // Fetch audio files when modal opens or note changes
  useEffect(() => {
    if (!note?.id) return;
    const fetchAudio = async () => {
      const res = await fetch(`/api/matters/${note.id}/notes/audio`);
      const data = await res.json();
      setAudioFiles(data.audio || []);
    };
    fetchAudio();
  }, [note?.id, open]);

  // Fetch versions when modal opens or note changes
  useEffect(() => {
    if (!note?.id) return;
    const fetchVersions = async () => {
      setVersionLoading(true);
      const res = await fetch(`/api/matters/${note.id}/notes/versions`);
      const data = await res.json();
      setVersions(data.versions || []);
      setVersionLoading(false);
    };
    fetchVersions();
  }, [note?.id, open]);

  // Handle file selection (add to pending)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    const newPending: { file: File; id: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      newPending.push({ file, id });
      editor?.chain().focus().insertContent({
        type: 'attachment',
        attrs: { name: file.name, type: file.type, pending: true, id }
      }).run();
    }
    setPendingAttachments((prev) => [...newPending, ...prev]);
    toast({
      title: "File(s) added",
      description: "File(s) will be uploaded when you save the note.",
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle delete attachment
  const handleDeleteAttachment = async (attachmentId: string) => {
    const res = await fetch(`/api/matters/${note.id}/notes/attachments`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attachmentId }),
    });
    if (res.ok) {
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    }
  };

  // Handle audio upload
  const handleAudioUpload = async (file: File) => {
    setAudioUploading(true);
    const formData = new FormData();
    formData.append('audio', file);
    const res = await fetch(`/api/matters/${note.id}/notes/audio`, {
      method: 'POST',
      body: formData,
    });
    setAudioUploading(false);
    if (res.ok) {
      const data = await res.json();
      setAudioFiles((prev) => [data.audio, ...prev]);
    }
  };

  // Handle delete audio
  const handleDeleteAudio = async (audioId: string) => {
    if (!note?.id) return;

    try {
      const res = await fetch(`/api/matters/${note.id}/notes/audio`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioId }),
      });

      if (!res.ok) throw new Error('Failed to delete voice note');
      
      setAudioFiles((prev) => prev.filter((a) => a.id !== audioId));
      
      toast({
        title: "Success",
        description: "Voice note deleted successfully",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to delete voice note',
        variant: "destructive"
      });
    }
  };

  // Helper to get SVG icon for file type
  const getFileIconSVG = (type: string) => {
    if (type.startsWith('image/')) return '<svg class="inline w-4 h-4 text-blue-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';
    if (type.startsWith('audio/')) return '<svg class="inline w-4 h-4 text-purple-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 19V6l12-2v13"/><circle cx="6" cy="18" r="3"/></svg>';
    if (type === 'application/pdf') return '<svg class="inline w-4 h-4 text-red-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 2h9l6 6v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><polyline points="14 2 14 8 20 8"/></svg>';
    if (type.includes('word')) return '<svg class="inline w-4 h-4 text-blue-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><text x="12" y="16" text-anchor="middle" font-size="10" fill="currentColor">W</text></svg>';
    if (type.includes('excel')) return '<svg class="inline w-4 h-4 text-green-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><text x="12" y="16" text-anchor="middle" font-size="10" fill="currentColor">X</text></svg>';
    return '<svg class="inline w-4 h-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>';
  };

  // Helper to get file icon
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('audio/')) return '🎤';
    if (type === 'application/pdf') return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('excel')) return '📊';
    return '📎';
  };

  // Helper to format file size
  const formatSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Handle AI actions
  const handleAI = async (type: 'summarize' | 'suggest' | 'keypoints' | 'ask' | 'redraft') => {
    if (!note?.id) {
      toast({
        title: "Error",
        description: "Please save the note before using AI features",
        variant: "destructive"
      });
      return;
    }

    setAiLoading(type);
    setAiError(null);
    setAiResult('');
    
    try {
      const endpoint = `/api/matters/${note.id}/notes/ai-${type}`;
      const body: any = { content: editor?.getHTML() };
      if (type === 'ask') body.prompt = aiPrompt;
      if (type === 'redraft') {
        // For redraft, we need to get the selected text or current paragraph
        const selectedText = editor?.state.selection.content().content.firstChild?.textContent;
        if (!selectedText) {
          toast({
            title: "Error",
            description: "Please select the text you want to redraft",
            variant: "destructive"
          });
          setAiLoading(null);
          return;
        }
        body.selectedText = selectedText;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('AI request failed');
      
      const data = await res.json();
      setAiResult(data.summary || data.suggestion || data.keypoints || data.answer || data.redraft || 'No result');
      
      // For redraft, replace the selected text with the new version
      if (type === 'redraft' && data.redraft) {
        editor?.chain().focus().deleteSelection().insertContent(data.redraft).run();
      }
      
      toast({
        title: "Success",
        description: `AI ${type} completed successfully`,
      });
    } catch (err: any) {
      setAiError(err.message);
      toast({
        title: "Error",
        description: err.message || 'AI request failed',
        variant: "destructive"
      });
    } finally {
      setAiLoading(null);
    }
  };

  const handleCopyAIResult = () => {
    if (aiResultRef.current) {
      const text = aiResultRef.current.innerText;
      navigator.clipboard.writeText(text);
    }
  };

  // Restore a version
  const handleRestoreVersion = useCallback(async (version: any) => {
    setRestoring(version.id);
    // Optionally, show a confirmation dialog
    setShowRestoreConfirm(version.id);
  }, []);

  const confirmRestoreVersion = async (version: any) => {
    // Set the editor and title to the version's content
    setTitle(version.title);
    editor?.commands.setContent(version.content);
    setShowRestoreConfirm(null);
    setRestoring(null);
  };

  // Manual save handler (update to upload pending attachments after note is saved)
  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for the note",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const noteData = {
        title,
        content: editor?.getHTML() || '',
        updated_at: new Date().toISOString(),
      };

      if (isEditMode && note?.id) {
        const res = await fetch(`/api/matters/${matterId}/notes/${note.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(noteData),
        });
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to update note');
        }
        const data = await res.json();
        note = data.note;
        lastSavedContent.current = noteData.content;
        lastSavedTitle.current = noteData.title;
        setHasUnsavedChanges(false);
        clearDraft(); // Clear draft after save
      } else {
        const res = await fetch(`/api/matters/${matterId}/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(noteData),
        });
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to create note');
        }
        const data = await res.json();
        note = data.note;
        lastSavedContent.current = noteData.content;
        lastSavedTitle.current = noteData.title;
        setHasUnsavedChanges(false);
        clearDraft(); // Clear draft after save
      }

      // Upload pending audio files
      if (pendingAudioFiles.length > 0 && note?.id) {
        for (const { file, id } of pendingAudioFiles) {
          const formData = new FormData();
          formData.append('audio', file);
          const res = await fetch(`/api/matters/${note.id}/notes/audio`, {
            method: 'POST',
            body: formData,
          });
          if (!res.ok) {
            toast({
              title: "Error",
              description: "Failed to upload a voice note.",
              variant: "destructive"
            });
          } else {
            const data = await res.json();
            setAudioFiles((prev) => [data.audio, ...prev]);
            // @ts-ignore
            editor?.commands.updateAudioAttrs(id, { pending: false, url: data.audio.url });
          }
        }
        setPendingAudioFiles([]); // Clear after upload
      }

      // Upload pending attachments
      if (pendingAttachments.length > 0 && note?.id) {
        for (const { file, id } of pendingAttachments) {
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch(`/api/matters/${note.id}/notes/attachments`, {
            method: 'POST',
            body: formData,
          });
          if (!res.ok) {
            toast({
              title: "Error",
              description: "Failed to upload an attachment.",
              variant: "destructive"
            });
          } else {
            const data = await res.json();
            setAttachments((prev) => [data.attachment, ...prev]);
            // @ts-ignore
            editor?.commands.updateAttachmentAttrs(id, { pending: false, url: data.attachment.url });
          }
        }
        setPendingAttachments([]); // Clear after upload
      }

      toast({
        title: "Success",
        description: "Note saved successfully",
      });
      onSave({ ...note, ...noteData });
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save note');
      toast({
        title: "Error",
        description: err.message || 'Failed to save note',
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Clause Redraft handler (placeholder)
  const handleClauseRedraft = async () => {
    toast({
      title: 'Not Implemented',
      description: 'Clause Redraft is coming soon!'
    });
  };

  // Handle voice note recording (now just adds to pending)
  const handleVoiceNote = async (file: File) => {
    const id = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setPendingAudioFiles((prev) => [{ file, id }, ...prev]);
    editor?.chain().focus().insertContent({
      type: 'audioBlock',
      attrs: { name: file.name, pending: true, id }
    }).run();
    toast({
      title: "Voice note added",
      description: "Voice note will be uploaded when you save the note.",
    });
  };

  // Handle PDF export
  const handleExportPDF = async () => {
    if (!note?.id) {
      toast({
        title: "Error",
        description: "Please save the note before exporting",
        variant: "destructive"
      });
      return;
    }

    try {
      // Show loading state
      toast({
        title: "Exporting",
        description: "Generating PDF...",
      });

      const res = await fetch(`/api/matters/${matterId}/notes/${note.id}/export-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content: editor?.getHTML(),
          metadata: {
            matterId,
            createdAt: note.created_at,
            updatedAt: note.updated_at,
            author: user?.fullName || 'Unknown',
          }
        }),
      });

      if (!res.ok) throw new Error('Failed to export PDF');
      
      // Get the PDF blob
      const blob = await res.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'note'}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "PDF exported successfully",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to export PDF',
        variant: "destructive"
      });
    }
  };

  // Handle reminder setting
  const handleSetReminder = async (date: Date | null) => {
    if (!date) return;
    
    if (!note?.id) {
      toast({
        title: "Error",
        description: "Please save the note before setting reminders",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create a schedule event for the reminder
      const scheduleData = {
        title: `Reminder: ${title}`,
        description: `Reminder for note: ${title}\n\nContent: ${editor?.getHTML()}`,
        type: 'other',
        status: 'scheduled',
        participants: [user?.fullName || ''],
        location: '',
        start_time: date.toISOString(),
        end_time: new Date(date.getTime() + 30 * 60000).toISOString(), // 30 minutes duration
        reminder: '15m', // 15 minutes before
        reminder_type: ['email', 'push'],
        metadata: {
          matter_id: matterId,
          matter_title: title,
          note_id: note.id,
          type: 'note_reminder'
        }
      };

      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData),
      });

      if (!res.ok) throw new Error('Failed to set reminder');
      
      toast({
        title: "Success",
        description: `Reminder set for ${format(date, 'PPP')}`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to set reminder',
        variant: "destructive"
      });
    }
  };

  // Handler to remove pending attachment block
  const handleRemovePendingAttachment = (id: string) => {
    setPendingAttachments((prev) => prev.filter((item) => item.id !== id));
    // @ts-ignore
    editor?.commands.removeAttachmentById(id);
  };

  // Handler to remove pending audio block
  const handleRemovePendingAudio = (id: string) => {
    setPendingAudioFiles((prev) => prev.filter((item) => item.id !== id));
    // @ts-ignore
    editor?.commands.removeAudioById(id);
  };

  // Listen for click events on the editor to handle remove button clicks
  useEffect(() => {
    const el = document.querySelector('.tiptap') as HTMLElement;
    if (!el) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.hasAttribute('data-remove-attachment')) {
        const id = target.getAttribute('data-remove-attachment');
        if (id) handleRemovePendingAttachment(id);
      }
      if (target && target.hasAttribute('data-remove-audio')) {
        const id = target.getAttribute('data-remove-audio');
        if (id) handleRemovePendingAudio(id);
      }
    };
    const renameHandler = (e: FocusEvent | KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      let id = target.getAttribute('data-rename-attachment');
      let type: 'attachment' | 'audioBlock' = 'attachment';
      if (!id) {
        id = target.getAttribute('data-rename-audio');
        type = 'audioBlock';
      }
      if (!id) return;
      const newName = target.innerText.trim();
      if (!newName) return;
      // Update the block in the editor
      if (type === 'attachment') {
        // @ts-ignore
        editor?.commands.updateAttachmentAttrs(id, { name: newName });
        setPendingAttachments((prev) => prev.map(item => item.id === id ? { ...item, file: new File([item.file], newName, { type: item.file.type }) } : item));
      } else {
        // @ts-ignore
        editor?.commands.updateAudioAttrs(id, { name: newName });
        setPendingAudioFiles((prev) => prev.map(item => item.id === id ? { ...item, file: new File([item.file], newName, { type: item.file.type }) } : item));
      }
    };
    el.addEventListener('blur', renameHandler, true);
    el.addEventListener('click', handler);
    return () => {
      el.removeEventListener('click', handler);
      el.removeEventListener('blur', renameHandler, true);
    };
  }, [editor]);

  // --- Drag-and-drop support ---
  const editorContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = editorContainerRef.current;
    if (!el) return;
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      el.classList.add('ring-2', 'ring-purple-400');
    };
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      el.classList.remove('ring-2', 'ring-purple-400');
    };
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      el.classList.remove('ring-2', 'ring-purple-400');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        const id = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setPendingAttachments((prev) => [{ file, id }, ...prev]);
        editor?.chain().focus().insertContent({
          type: 'attachment',
          attrs: { name: file.name, type: file.type, pending: true, id }
        }).run();
        toast({
          title: "File added",
          description: "File will be uploaded when you save the note.",
        });
      }
    };
    el.addEventListener('dragover', handleDragOver);
    el.addEventListener('dragleave', handleDragLeave);
    el.addEventListener('drop', handleDrop);
    return () => {
      el.removeEventListener('dragover', handleDragOver);
      el.removeEventListener('dragleave', handleDragLeave);
      el.removeEventListener('drop', handleDrop);
    };
  }, [editorContainerRef, editor]);

  // --- Smooth drag-and-drop animations and custom drag preview ---
  // Add CSS for smooth transitions and custom drag preview
  // (Add this to a <style jsx global> block or your global CSS)
  //
  // .tiptap [draggable="true"] {
  //   transition: box-shadow 0.2s, transform 0.2s;
  //   cursor: grab;
  // }
  // .tiptap .dragging-block {
  //   opacity: 0.5;
  //   box-shadow: 0 4px 16px rgba(80,80,120,0.15);
  //   background: #f3f4f6;
  //   border-radius: 0.75rem;
  //   z-index: 100;
  //   position: relative;
  // }
  // .tiptap .drag-preview {
  //   position: fixed;
  //   pointer-events: none;
  //   opacity: 0.7;
  //   z-index: 9999;
  //   transform: scale(1.05);
  //   box-shadow: 0 8px 32px rgba(80,80,120,0.18);
  // }

  // --- Custom drag preview logic ---
  const dragPreviewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = document.querySelector('.tiptap') as HTMLElement;
    if (!el) return;
    let dragBlock: HTMLElement | null = null;
    let preview: HTMLElement | null = null;
    const handleDragStart = (e: DragEvent) => {
      const target = (e.target as HTMLElement)?.closest('[draggable="true"]');
      if (target) {
        const block = target as HTMLElement;
        dragBlock = block;
        dragBlock.classList.add('dragging-block');
        // Create a custom preview
        preview = block.cloneNode(true) as HTMLElement;
        preview.classList.add('drag-preview');
        preview.style.width = `${block.offsetWidth}px`;
        preview.style.height = `${block.offsetHeight}px`;
        document.body.appendChild(preview);
        const move = (ev: DragEvent) => {
          if (preview && ev.clientX && ev.clientY) {
            preview.style.left = `${ev.clientX + 10}px`;
            preview.style.top = `${ev.clientY + 10}px`;
          }
        };
        document.addEventListener('dragover', move);
        e.dataTransfer?.setDragImage(preview, 0, 0);
        e.dataTransfer!.effectAllowed = 'move';
        e.dataTransfer!.dropEffect = 'move';
        // Remove preview on dragend
        target.addEventListener('dragend', () => {
          dragBlock?.classList.remove('dragging-block');
          if (preview) {
            document.body.removeChild(preview);
            preview = null;
          }
          document.removeEventListener('dragover', move);
        }, { once: true });
      }
    };
    el.addEventListener('dragstart', handleDragStart);
    return () => {
      el.removeEventListener('dragstart', handleDragStart);
    };
  }, []);

  // --- Set Reminder button logic ---
  const handleReminderDateChange = (date: Date | null) => {
    setReminderPending(date);
  };

  const handleSetReminderClick = () => {
    if (reminderPending) {
      setReminderDate(reminderPending);
      handleSetReminder(reminderPending);
      setReminderPending(null);
    }
  };

  // Load draft from localStorage on open
  useEffect(() => {
    if (open) {
      const draftKey = getNoteDraftKey(note?.id, matterId);
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          if (parsed.title) setTitle(parsed.title);
          if (parsed.content && editor) editor.commands.setContent(parsed.content);
        } catch {}
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, note?.id, matterId, editor]);

  // Save draft to localStorage on change
  useEffect(() => {
    if (!open) return;
    const draftKey = getNoteDraftKey(note?.id, matterId);
    const draft = {
      title,
      content: editor?.getHTML() || '',
    };
    localStorage.setItem(draftKey, JSON.stringify(draft));
  }, [title, editor, open, note?.id, matterId]);

  // Clear draft on save or delete
  const clearDraft = () => {
    const draftKey = getNoteDraftKey(note?.id, matterId);
    localStorage.removeItem(draftKey);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm${fullscreen ? ' !p-0' : ''}`}
      style={fullscreen ? { padding: 0 } : {}}>
      <Card className={`w-full ${fullscreen ? 'h-screen max-w-full rounded-none border-0 shadow-none' : 'max-w-6xl'} shadow-2xl rounded-3xl overflow-hidden border border-gray-200 bg-white`}
        style={fullscreen ? { minHeight: '100vh' } : {}}>
        {/* Top Bar */}
        <div className="flex items-center justify-between border-b px-6 py-5 bg-white/80 backdrop-blur">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-200" onClick={() => onOpenChange(false)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Untitled Note"
              className="font-semibold text-2xl bg-transparent outline-none placeholder:text-gray-400 w-64"
              maxLength={120}
              disabled={saving}
            />
            <div className="flex items-center gap-2 text-sm text-gray-600 ml-4">
              <Link2 className="w-4 h-4" />
              <select className="bg-gray-100 rounded-md px-2 py-1 focus:ring-2 focus:ring-purple-300">
                <option>Linked to: {matterId}</option>
                <option>No Link</option>
              </select>
            </div>
            {/* Auto-save status indicator */}
            <div className="flex items-center gap-1 text-sm text-gray-500 ml-4">
              {saving ? 'Saving...' : 'Saved'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-gray-200"
              onClick={() => setFullscreen(f => !f)}
              title={fullscreen ? 'Exit Fullscreen' : 'Expand to Fullscreen'}
            >
              {fullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </Button>
            <Button className={cn(
              "gap-2 px-4 py-2 rounded-xl text-white transition",
              hasUnsavedChanges ? "bg-purple-600 hover:bg-purple-700" : "bg-gray-400 cursor-not-allowed"
            )}
              onClick={handleSave}
              disabled={saving || !hasUnsavedChanges}
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button className="gap-2 px-4 py-2 rounded-xl text-purple-600 border border-purple-600 hover:bg-purple-50 transition" onClick={() => editor?.commands.focus()}>
              <Pencil className="w-4 h-4" /> Edit
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-200">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>
        {/* Editor Area */}
        <CardContent className="p-0 bg-white">
          <div className="p-6">
            <EditorErrorBoundary>
              <div
                className={`border-2 border-purple-400 rounded-xl min-h-[400px] h-[400px] bg-white text-gray-800 font-sans text-base leading-relaxed shadow-sm prose max-w-none focus-within:ring-2 focus-within:ring-purple-400 transition-all flex flex-col${isScrollable ? ' overflow-y-auto max-h-[70vh]' : ''}${fullscreen ? ' resize-y min-h-[300px] max-h-[90vh]' : ''}`}
                onClick={() => editor?.commands.focus()}
                style={{ cursor: 'text' }}
              >
                {/* Formatting Toolbar and Editor */}
                {editor && (
                  <>
                    <div className="px-6 pt-6 pb-2">
                      <GoogleDocsToolbar editor={editor} />
                    </div>
                    <div className="flex-1 flex flex-col">
                      <EditorContent
                        ref={editorContainerRef}
                        editor={editor}
                        className={cn(
                          `flex-1 w-full bg-transparent outline-none border-none px-6 pb-6 pt-2 tiptap`,
                          fullscreen ? 'resize-y overflow-auto min-h-[300px] max-h-[80vh]' : 'min-h-[300px]'
                        )}
                        style={{ boxShadow: 'none', border: 'none', background: 'transparent' }}
                      />
                    </div>
                  </>
                )}
              </div>
            </EditorErrorBoundary>
          </div>
        </CardContent>
        {/* Smart AI / Utility Bar */}
        <div className="border-t bg-gray-50 px-6 py-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            {/* AI Actions */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="gap-1 px-3 py-1.5 rounded-md" onClick={() => handleAI('summarize')} disabled={!!aiLoading}>
                <Brain className="w-4 h-4" /> Summarize
              </Button>
              <Button variant="outline" className="gap-1 px-3 py-1.5 rounded-md" onClick={() => handleAI('suggest')} disabled={!!aiLoading}>
                <Lightbulb className="w-4 h-4" /> AI Suggest
              </Button>
              <Button variant="outline" className="gap-1 px-3 py-1.5 rounded-md" onClick={() => handleAI('keypoints')} disabled={!!aiLoading}>
                <Sparkles className="w-4 h-4" /> Extract Key Points
              </Button>
              <Button variant="outline" className="gap-1 px-3 py-1.5 rounded-md" onClick={() => handleAI('redraft')} disabled={!!aiLoading}>
                <Edit3 className="w-4 h-4" /> Clause Redraft
              </Button>
            </div>
            {/* File Tools */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="gap-1 px-3 py-1.5 rounded-md" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4" /> Upload File
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
                multiple
              />
              <Button variant="outline" className="gap-1 px-3 py-1.5 rounded-md" onClick={handleExportPDF}>
                <FileText className="w-4 h-4" /> Export PDF
              </Button>
              <div className="flex items-center gap-2">
                <DatePicker
                  selected={reminderPending}
                  onChange={handleReminderDateChange}
                  placeholderText="Set Reminder"
                  className="w-[200px] bg-white/80 text-black placeholder:text-gray-500 border border-gray-300 rounded h-10 px-3 py-2 text-sm"
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="yyyy/MM/dd, h:mm aa"
                  minDate={new Date()}
                />
                <Button
                  className="ml-2 bg-purple-500 text-white hover:bg-purple-600"
                  onClick={handleSetReminderClick}
                  disabled={!reminderPending}
                  variant="outline"
                >
                  Set Reminder
                </Button>
              </div>
            </div>
            {/* Voice Notes */}
            <div className="flex flex-wrap gap-2 justify-end">
              <AudioRecorder 
                onUpload={handleVoiceNote} 
                onDelete={handleDeleteAudio}
                uploadedFiles={audioFiles}
                onTranscript={(text: string) => {
                  if (editor && text) {
                    editor.chain().focus().insertContent(text).run();
                  }
                  toast({
                    title: 'Transcript Inserted',
                    description: 'The speech-to-text transcript was added to your note.',
                  });
                }}
              />
            </div>
          </div>
        </div>
        <style jsx global>{`
          .tiptap .ProseMirror {
            min-height: 300px;
            height: 100%;
            width: 100%;
            border: none !important;
            outline: none !important;
            box-shadow: none !important;
            background: transparent !important;
            padding: 0 !important;
            resize: none;
          }
          
          .tiptap h1 {
            font-size: 2.5em;
            margin-top: 0.67em;
            margin-bottom: 0.67em;
            font-weight: 700;
          }
          
          .tiptap h2 {
            font-size: 2em;
            margin-top: 0.83em;
            margin-bottom: 0.83em;
            font-weight: 700;
          }
          
          .tiptap h3 {
            font-size: 1.75em;
            margin-top: 1em;
            margin-bottom: 1em;
            font-weight: 700;
          }
          
          .tiptap h4 {
            font-size: 1.5em;
            margin-top: 1.33em;
            margin-bottom: 1.33em;
            font-weight: 600;
          }
          
          .tiptap h5 {
            font-size: 1.25em;
            margin-top: 1.67em;
            margin-bottom: 1.67em;
            font-weight: 600;
          }
          
          .tiptap h6 {
            font-size: 1em;
            margin-top: 2.33em;
            margin-bottom: 2.33em;
            font-weight: 600;
          }

          .tiptap .ProseMirror h1,
          .tiptap .ProseMirror h2,
          .tiptap .ProseMirror h3,
          .tiptap .ProseMirror h4,
          .tiptap .ProseMirror h5,
          .tiptap .ProseMirror h6 {
            display: block;
            line-height: 1.2;
          }
        `}</style>
      </Card>
    </div>
  );
} 