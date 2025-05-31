import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/rtf'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file');
    const originalName = formData.get('name') as string;

    if (!file || !originalName || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'Invalid file data' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Supported types: PDF, DOC, DOCX, TXT, RTF' 
      }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
      }, { status: 400 });
    }

    // Convert file to Uint8Array for Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Generate a unique file name
    const timestamp = Date.now();
    const safeFileName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${params.id}/${timestamp}_${safeFileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('matter-documents')
      .upload(filePath, uint8Array, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('matter-documents')
      .getPublicUrl(filePath);

    // Create document record in documents table
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        title: originalName,
        file_url: filePath,
        status: 'draft',
        uploaded_by: userId
      })
      .select()
      .single();

    if (docError) {
      console.error('Document creation error:', docError);
      await supabase.storage.from('matter-documents').remove([filePath]);
      return NextResponse.json({ error: 'Failed to create document record' }, { status: 500 });
    }

    // Create matter_documents record
    const { data: matterDoc, error: matterDocError } = await supabase
      .from('matter_documents')
      .insert({
        matter_id: params.id,
        document_id: document.id,
        name: originalName,
        type: file.type,
        size: file.size,
        status: 'pending_review',
        category: 'uncategorized',
        version: 1,
        metadata: {
          author: userId,
          last_modified: new Date().toISOString(),
          original_name: originalName,
          mime_type: file.type
        },
        created_by: userId,
        updated_by: userId
      })
      .select()
      .single();

    if (matterDocError) {
      console.error('Matter document creation error:', matterDocError);
      // Clean up: delete the document and storage file
      await supabase.from('documents').delete().eq('id', document.id);
      await supabase.storage.from('matter-documents').remove([filePath]);
      return NextResponse.json({ error: 'Failed to create matter document record' }, { status: 500 });
    }

    return NextResponse.json({ document: matterDoc });
  } catch (error) {
    console.error('Error in upload-document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 