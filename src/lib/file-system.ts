import { toast } from '@/components/ui/use-toast';

interface FileSystemFileHandle {
  getFile(): Promise<File>;
  kind: 'file';
  name: string;
  createWritable(): Promise<FileSystemWritableFileStream>;
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: any): Promise<void>;
  seek(position: number): Promise<void>;
  truncate(size: number): Promise<void>;
}

interface FileSystemDirectoryHandle {
  kind: 'directory';
  name: string;
  getFileHandle(name: string): Promise<FileSystemFileHandle>;
  getDirectoryHandle(name: string): Promise<FileSystemDirectoryHandle>;
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
}

interface FileSystemHandle {
  kind: 'file' | 'directory';
  name: string;
}

interface ShowOpenFilePickerOptions {
  multiple?: boolean;
  types?: Array<{
    description: string;
    accept: Record<string, string[]>;
  }>;
}

interface ShowDirectoryPickerOptions {
  mode?: 'read' | 'readwrite';
  startIn?: FileSystemHandle;
}

interface ShowSaveFilePickerOptions {
  suggestedName?: string;
  types?: Array<{
    description: string;
    accept: Record<string, string[]>;
  }>;
}

declare global {
  interface Window {
    showOpenFilePicker: (options?: ShowOpenFilePickerOptions) => Promise<FileSystemFileHandle[]>;
    showDirectoryPicker: (options?: ShowDirectoryPickerOptions) => Promise<FileSystemDirectoryHandle>;
    showSaveFilePicker: (options?: ShowSaveFilePickerOptions) => Promise<FileSystemFileHandle>;
  }
}

export async function openFile(): Promise<File | null> {
  try {
    if (!('showOpenFilePicker' in window)) {
      throw new Error('File System Access API is not supported in this browser');
    }

    const [fileHandle] = await window.showOpenFilePicker({
      multiple: false,
      types: [
        {
          description: 'Documents',
          accept: {
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'text/plain': ['.txt'],
            'application/rtf': ['.rtf']
          }
        }
      ]
    });

    return await fileHandle.getFile();
  } catch (error) {
    console.error('Error opening file:', error);
    return null;
  }
}

export async function openDirectory(): Promise<FileSystemDirectoryHandle | null> {
  try {
    if (!('showDirectoryPicker' in window)) {
      throw new Error('File System Access API is not supported in this browser');
    }

    return await window.showDirectoryPicker({
      mode: 'readwrite'
    });
  } catch (error) {
    console.error('Error opening directory:', error);
    return null;
  }
}

export async function saveFile(file: File): Promise<boolean> {
  try {
    if (!('showSaveFilePicker' in window)) {
      throw new Error('File System Access API is not supported in this browser');
    }

    const fileHandle = await window.showSaveFilePicker({
      suggestedName: file.name,
      types: [
        {
          description: 'Documents',
          accept: {
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'text/plain': ['.txt'],
            'application/rtf': ['.rtf']
          }
        }
      ]
    });

    const writable = await fileHandle.createWritable();
    await writable.write(file);
    await writable.close();
    return true;
  } catch (error) {
    console.error('Error saving file:', error);
    return false;
  }
}

export async function listDirectoryContents(directoryHandle: FileSystemDirectoryHandle): Promise<Array<{ name: string; type: string }>> {
  const contents: Array<{ name: string; type: string }> = [];
  
  for await (const [name, handle] of directoryHandle.entries()) {
    contents.push({
      name,
      type: handle.kind,
    });
  }

  return contents;
}

export async function verifyPermission(handle: FileSystemFileHandle | FileSystemDirectoryHandle, mode: 'read' | 'readwrite'): Promise<boolean> {
  const options: { mode: 'read' | 'readwrite' } = { mode };
  
  // @ts-ignore
  if ((await handle.queryPermission?.(options)) === 'granted') {
    return true;
  }

  // @ts-ignore
  if ((await handle.requestPermission?.(options)) === 'granted') {
    return true;
  }

  return false;
} 