import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; documentId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current document version
    const { data: currentDoc, error: currentDocError } = await supabase
      .from('matter_documents')
      .select('*')
      .eq('id', params.documentId)
      .single();

    if (currentDocError || !currentDoc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Parse form data for new version
    const formData = await request.formData();
    const file = formData.get('file');
    const originalName = formData.get('name') as string;
    const changeNotes = formData.get('changeNotes') as string;

    if (!file || !originalName || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'Invalid file data' }, { status: 400 });
    }

    // Convert file to Uint8Array
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Generate new file path
    const timestamp = Date.now();
    const safeFileName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${params.id}/${timestamp}_${safeFileName}`;

    // Upload new version
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('matter-documents')
      .upload(filePath, uint8Array, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload new version' }, { status: 500 });
    }

    // Create new version record
    const { data: newVersion, error: versionError } = await supabase
      .from('matter_documents')
      .insert({
        matter_id: params.id,
        document_id: currentDoc.document_id,
        name: originalName,
        type: file.type,
        size: file.size,
        status: 'pending_review',
        category: currentDoc.category,
        version: currentDoc.version + 1,
        metadata: {
          ...currentDoc.metadata,
          version_history: [
            ...(currentDoc.metadata?.version_history || []),
            {
              version: currentDoc.version,
              file_path: currentDoc.documents?.file_url,
              changed_at: new Date().toISOString(),
              changed_by: userId,
              change_notes: changeNotes
            }
          ],
          current_version: currentDoc.version + 1,
          last_modified: new Date().toISOString()
        },
        created_by: userId,
        updated_by: userId
      })
      .select()
      .single();

    if (versionError) {
      console.error('Version creation error:', versionError);
      await supabase.storage.from('matter-documents').remove([filePath]);
      return NextResponse.json({ error: 'Failed to create new version' }, { status: 500 });
    }

    // Archive old version
    const { error: archiveError } = await supabase
      .from('matter_documents')
      .update({ status: 'archived' })
      .eq('id', params.documentId);

    if (archiveError) {
      console.error('Archive error:', archiveError);
      // Don't fail the request if archiving fails
    }

    return NextResponse.json({ version: newVersion });
  } catch (error) {
    console.error('Error in version:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 