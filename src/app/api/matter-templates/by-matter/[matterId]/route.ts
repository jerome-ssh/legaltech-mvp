import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// GET /api/matter-templates/by-matter/[matterId] - Fetch the template for a given matter by its ID
export async function GET(
  request: Request,
  { params }: { params: { matterId: string } }
) {
  try {
    console.log('[TEMPLATE API] Incoming request for matterId:', params.matterId);
    const { userId } = auth();
    console.log('[TEMPLATE API] Auth userId:', userId);
    if (!userId) {
      console.log('[TEMPLATE API] Unauthorized: No userId');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's profile_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();
    console.log('[TEMPLATE API] Profile lookup:', { profile, profileError });

    if (profileError) {
      console.log('[TEMPLATE API] Profile not found');
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get the matter and all relevant fields, including client_id
    const { data: matter, error: matterError } = await supabase
      .from('matters')
      .select('id, type_id, sub_type_id, profile_id, client_id, jurisdiction, estimated_value, applied_template_id')
      .eq('id', params.matterId)
      .single();
    console.log('[TEMPLATE API] Matter lookup:', { matter, matterError });

    if (matterError || !matter) {
      console.log('[TEMPLATE API] Matter not found');
      return NextResponse.json({ error: 'Matter not found' }, { status: 404 });
    }
    if (matter.profile_id !== profile.id) {
      console.log('[TEMPLATE API] Unauthorized: profile_id mismatch', { matterProfile: matter.profile_id, userProfile: profile.id });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch client_type_id from the clients table using client_id
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('client_type_id')
      .eq('id', matter.client_id)
      .single();
    
    console.log('[TEMPLATE API] Client lookup:', { client, clientError });
    
    if (clientError) {
      console.log('[TEMPLATE API] Client not found');
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const client_type_id = client.client_type_id;

    // If a template has already been applied, return info
    if (matter.applied_template_id) {
      console.log('[TEMPLATE API] Template already applied:', matter.applied_template_id);
      return NextResponse.json({ 
        applied_template_id: matter.applied_template_id,
        message: 'Template already applied to this matter'
      });
    }

    // Get all templates that match the matter's type and sub-type
    const { data: templates, error: templatesError } = await supabase
      .from('matter_task_templates')
      .select('*')
      .eq('matter_type_id', matter.type_id)
      .eq('sub_type_id', matter.sub_type_id);

    console.log('[TEMPLATE API] Templates lookup:', { 
      templates, 
      templatesError,
      filters: {
        matter_type_id: matter.type_id,
        sub_type_id: matter.sub_type_id
      }
    });

    // 1. Check for a user-custom template for this matter
    const { data: customTemplate, error: customTemplateError } = await supabase
      .from('matter_task_templates')
      .select('*, tasks: matter_task_template_items(*)')
      .eq('id', matter.applied_template_id)
      .single();
    console.log('[TEMPLATE API] Custom template lookup:', { customTemplate, customTemplateError });
    if (customTemplate && !customTemplateError) {
      console.log('[TEMPLATE API] Returning custom template');
      return NextResponse.json({ template: customTemplate, isCustom: true });
    }

    // 2. Try to find a template matching type and subtype
    let { data: template, error: templateError } = await supabase
      .from('matter_task_templates')
      .select('*, tasks: matter_task_template_items(*)')
      .eq('matter_type_id', matter.type_id)
      .eq('sub_type_id', matter.sub_type_id)
      .single();
    console.log('[TEMPLATE API] Type+subtype match:', { template, templateError });

    // If not found, fallback to type only
    if (!template || templateError) {
      ({ data: template, error: templateError } = await supabase
        .from('matter_task_templates')
        .select('*, tasks: matter_task_template_items(*)')
        .eq('matter_type_id', matter.type_id)
        .single());
      console.log('[TEMPLATE API] Type only fallback:', { template, templateError });
    }

    // If still not found, just return the first available template
    if (!template || templateError) {
      ({ data: template, error: templateError } = await supabase
        .from('matter_task_templates')
        .select('*, tasks: matter_task_template_items(*)')
        .limit(1)
        .single());
      console.log('[TEMPLATE API] First available template fallback:', { template, templateError });
    }

    if (!template || templateError) {
      console.log('[TEMPLATE API] No template found for this matter');
      return NextResponse.json({ error: 'No template found for this matter' }, { status: 404 });
    }

    console.log('[TEMPLATE API] Returning template:', template.id);
    return NextResponse.json({ template });
  } catch (error) {
    console.error('[TEMPLATE API] Error fetching template for matter:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 