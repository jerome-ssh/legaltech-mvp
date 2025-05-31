import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Matter type specific prompts
const MATTER_TYPE_PROMPTS = {
  'litigation': `You are a legal document analyzer specializing in litigation documents. Analyze the provided document with focus on:
1. Case facts and allegations
2. Legal claims and causes of action
3. Evidence and supporting documentation
4. Procedural history and deadlines
5. Potential defenses and counterclaims
6. Damages and relief sought
7. Jurisdiction and venue
8. Statute of limitations
9. Discovery requirements
10. Settlement considerations`,

  'corporate': `You are a legal document analyzer specializing in corporate documents. Analyze the provided document with focus on:
1. Corporate structure and governance
2. Shareholder rights and obligations
3. Board and management responsibilities
4. Financial terms and conditions
5. Regulatory compliance requirements
6. Intellectual property rights
7. Confidentiality and non-disclosure
8. Termination and exit provisions
9. Dispute resolution mechanisms
10. Corporate governance best practices`,

  'real_estate': `You are a legal document analyzer specializing in real estate documents. Analyze the provided document with focus on:
1. Property description and boundaries
2. Title and ownership rights
3. Zoning and land use restrictions
4. Environmental considerations
5. Financial terms and payment schedules
6. Maintenance and repair obligations
7. Insurance requirements
8. Default and termination conditions
9. Dispute resolution procedures
10. Regulatory compliance`,

  'employment': `You are a legal document analyzer specializing in employment documents. Analyze the provided document with focus on:
1. Employment terms and conditions
2. Compensation and benefits
3. Confidentiality and non-compete clauses
4. Intellectual property rights
5. Termination conditions
6. Dispute resolution procedures
7. Regulatory compliance
8. Employee rights and obligations
9. Workplace policies
10. Post-employment restrictions`,

  'default': `You are a legal document analyzer. Analyze the provided document and extract key information in a structured format.`
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; documentId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get matter type and sub-type via join (using 'value' field)
    const { data: matter, error: matterError } = await supabase
      .from('matters')
      .select('type_id, sub_type_id, matter_types(value), matter_sub_types(value)')
      .eq('id', params.id)
      .single();

    if (matterError) {
      console.error('Matter lookup error:', matterError);
      return NextResponse.json({ error: 'Failed to fetch matter details' }, { status: 500 });
    }

    let matterType = 'default';
    if (matter && matter.matter_types) {
      if (Array.isArray(matter.matter_types) && matter.matter_types.length > 0 && 'value' in matter.matter_types[0]) {
        matterType = (matter.matter_types[0].value as string).toLowerCase();
      } else if (typeof matter.matter_types === 'object' && 'value' in matter.matter_types) {
        matterType = (matter.matter_types.value as string).toLowerCase();
      }
    }
    let matterSubType = '';
    if (matter && matter.matter_sub_types) {
      if (Array.isArray(matter.matter_sub_types) && matter.matter_sub_types.length > 0 && 'value' in matter.matter_sub_types[0]) {
        matterSubType = (matter.matter_sub_types[0].value as string).toLowerCase();
      } else if (typeof matter.matter_sub_types === 'object' && 'value' in matter.matter_sub_types) {
        matterSubType = (matter.matter_sub_types.value as string).toLowerCase();
      }
    }
    const systemPrompt = `${MATTER_TYPE_PROMPTS[matterType as keyof typeof MATTER_TYPE_PROMPTS] || MATTER_TYPE_PROMPTS.default}

This matter's sub-type is: ${matterSubType ? matterSubType : 'N/A'}. Please tailor your analysis to this sub-type context as well.`;

    // Get matter_document details
    const { data: matterDoc, error: matterDocError } = await supabase
      .from('matter_documents')
      .select(`
        *,
        documents (
          file_url
        )
      `)
      .eq('id', params.documentId)
      .single();

    if (matterDocError || !matterDoc || !matterDoc.documents?.file_url) {
      return NextResponse.json({ error: 'Document not found or missing file path' }, { status: 404 });
    }

    const fileUrl = matterDoc.documents.file_url;

    // Download file from Supabase Storage
    const { data: fileData, error: fileError } = await supabase
      .storage
      .from('matter-documents')
      .download(fileUrl);

    if (fileError || !fileData) {
      console.error('File download error:', fileError);
      return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
    }

    // Convert file to text
    const text = await fileData.text();

    // Analyze with OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Please analyze this ${matterType} document:\n\n${text}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No analysis content received from OpenAI');
    }

    const analysis = JSON.parse(content);

    // Update matter_documents with analysis results
    const { error: updateError } = await supabase
      .from('matter_documents')
      .update({
        status: 'active',
        metadata: {
          ...matterDoc.metadata,
          analysis: analysis,
          analyzed_at: new Date().toISOString(),
          analyzed_by: userId,
          matter_type: matterType
        },
        updated_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.documentId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update document with analysis' }, { status: 500 });
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Error in analyze:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 