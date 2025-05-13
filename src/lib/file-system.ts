import { toast } from '@/components/ui/use-toast';

interface FileHandle {
  kind: 'file';
  name: string;
  getFile(): Promise<File>;
}

interface DirectoryHandle {
  kind: 'directory';
  name: string;
  getFileHandle(name: string): Promise<FileHandle>;
  getDirectoryHandle(name: string): Promise<DirectoryHandle>;
  entries(): AsyncIterableIterator<[string, FileHandle | DirectoryHandle]>;
}

export async function requestFileAccess(): Promise<FileHandle | null> {
  try {
    if (!('showOpenFilePicker' in window)) {
      toast({
        title: 'Not Supported',
        description: 'File system access is not supported in your browser.',
        variant: 'destructive',
      });
      return null;
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
          },
        },
      ],
    });

    return fileHandle;
  } catch (error) {
    console.error('Failed to request file access:', error);
    toast({
      title: 'Error',
      description: 'Failed to access file. Please try again.',
      variant: 'destructive',
    });
    return null;
  }
}

export async function requestDirectoryAccess(): Promise<DirectoryHandle | null> {
  try {
    if (!('showDirectoryPicker' in window)) {
      toast({
        title: 'Not Supported',
        description: 'Directory access is not supported in your browser.',
        variant: 'destructive',
      });
      return null;
    }

    const directoryHandle = await window.showDirectoryPicker();
    return directoryHandle;
  } catch (error) {
    console.error('Failed to request directory access:', error);
    toast({
      title: 'Error',
      description: 'Failed to access directory. Please try again.',
      variant: 'destructive',
    });
    return null;
  }
}

export async function saveFile(file: File): Promise<void> {
  try {
    if (!('showSaveFilePicker' in window)) {
      toast({
        title: 'Not Supported',
        description: 'File saving is not supported in your browser.',
        variant: 'destructive',
      });
      return;
    }

    const handle = await window.showSaveFilePicker({
      suggestedName: file.name,
      types: [
        {
          description: 'Documents',
          accept: {
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
          },
        },
      ],
    });

    const writable = await handle.createWritable();
    await writable.write(file);
    await writable.close();

    toast({
      title: 'Success',
      description: 'File saved successfully.',
    });
  } catch (error) {
    console.error('Failed to save file:', error);
    toast({
      title: 'Error',
      description: 'Failed to save file. Please try again.',
      variant: 'destructive',
    });
  }
}

export async function listDirectoryContents(directoryHandle: DirectoryHandle): Promise<Array<{ name: string; type: string }>> {
  const contents: Array<{ name: string; type: string }> = [];
  
  for await (const [name, handle] of directoryHandle.entries()) {
    contents.push({
      name,
      type: handle.kind,
    });
  }

  return contents;
}

export async function verifyPermission(handle: FileHandle | DirectoryHandle, mode: 'read' | 'readwrite'): Promise<boolean> {
  const options: { mode: 'read' | 'readwrite' } = { mode };
  
  if ((await handle.queryPermission(options)) === 'granted') {
    return true;
  }

  if ((await handle.requestPermission(options)) === 'granted') {
    return true;
  }

  return false;
} 