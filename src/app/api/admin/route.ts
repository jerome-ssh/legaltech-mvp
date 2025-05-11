import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Create a service role client for server-side operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, data } = body;

        switch (action) {
            case 'createUser': {
                if (!data?.email || !data?.password || !data?.userId) {
                    return NextResponse.json({ 
                        error: 'Missing required fields: email, password, and userId are required' 
                    }, { status: 400 });
                }

                const { email, password, userId } = data;

                try {
                    // First check if user exists
                    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
                    
                    if (listError) {
                        console.error('Error checking existing users:', listError);
                        return NextResponse.json({ 
                            error: `Failed to check existing users: ${listError.message}` 
                        }, { status: 400 });
                    }

                    const existingUser = existingUsers?.users?.find(u => u.email === email);
                    
                    if (existingUser) {
                        console.log('User already exists:', existingUser.id);
                        
                        // Check if profile exists
                        const { data: profile, error: profileError } = await supabaseAdmin
                            .from('profiles')
                            .select('*')
                            .eq('user_id', existingUser.id)
                            .single();

                        if (profileError && profileError.code !== 'PGRST116') {
                            console.error('Error checking profile:', profileError);
                            return NextResponse.json({ 
                                error: `Failed to check profile: ${profileError.message}` 
                            }, { status: 400 });
                        }

                        // If no profile exists, create one
                        if (!profile) {
                            console.log('Creating profile for existing user...');
                            const { error: createProfileError } = await supabaseAdmin
                                .from('profiles')
                                .insert({
                                    id: existingUser.id,
                                    user_id: existingUser.id,
                                    clerk_id: userId,
                                    email: email,
                                    full_name: 'Test User',
                                    created_at: new Date().toISOString(),
                                    updated_at: new Date().toISOString()
                                });

                            if (createProfileError) {
                                console.error('Error creating profile:', createProfileError);
                                return NextResponse.json({ 
                                    error: `Failed to create profile: ${createProfileError.message}` 
                                }, { status: 400 });
                            }
                        }

                        // Update the user's password
                        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                            existingUser.id,
                            { password: password }
                        );

                        if (updateError) {
                            console.error('Error updating user password:', updateError);
                            return NextResponse.json({ 
                                error: `Failed to update user password: ${updateError.message}` 
                            }, { status: 400 });
                        }

                        return NextResponse.json({ 
                            data: existingUser,
                            message: 'User already exists, updated password and verified profile'
                        }, { status: 200 });
                    }

                    // If user doesn't exist, create new user
                    console.log('Creating new user with email:', email);
                    try {
                        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                            email,
                            password,
                            email_confirm: true,
                            user_metadata: {
                                clerk_id: userId
                            }
                        });

                        if (authError) {
                            // If the error is about user already existing, handle it gracefully
                            if (authError.message.includes('already registered')) {
                                console.log('User already exists, attempting to get user...');
                                // Get fresh list of users to handle race condition
                                const { data: freshUsers, error: freshListError } = await supabaseAdmin.auth.admin.listUsers();
                                
                                if (freshListError) {
                                    console.error('Error getting fresh user list:', freshListError);
                                    return NextResponse.json({ 
                                        error: `Failed to get fresh user list: ${freshListError.message}` 
                                    }, { status: 400 });
                                }

                                const freshExistingUser = freshUsers?.users?.find(u => u.email === email);
                                
                                if (!freshExistingUser) {
                                    console.error('User not found after already registered error');
                                    return NextResponse.json({ 
                                        error: 'User not found after already registered error' 
                                    }, { status: 400 });
                                }

                                // Check and create profile for the existing user
                                const { data: profile, error: profileError } = await supabaseAdmin
                                    .from('profiles')
                                    .select('*')
                                    .eq('user_id', freshExistingUser.id)
                                    .single();

                                if (profileError && profileError.code !== 'PGRST116') {
                                    console.error('Error checking profile:', profileError);
                                    return NextResponse.json({ 
                                        error: `Failed to check profile: ${profileError.message}` 
                                    }, { status: 400 });
                                }

                                if (!profile) {
                                    console.log('Creating profile for existing user...');
                                    const { error: createProfileError } = await supabaseAdmin
                                        .from('profiles')
                                        .insert({
                                            id: freshExistingUser.id,
                                            user_id: freshExistingUser.id,
                                            clerk_id: userId,
                                            email: email,
                                            full_name: 'Test User',
                                            created_at: new Date().toISOString(),
                                            updated_at: new Date().toISOString()
                                        });

                                    if (createProfileError) {
                                        console.error('Error creating profile:', createProfileError);
                                        return NextResponse.json({ 
                                            error: `Failed to create profile: ${createProfileError.message}` 
                                        }, { status: 400 });
                                    }
                                }

                                // Update the user's password
                                const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                                    freshExistingUser.id,
                                    { password: password }
                                );

                                if (updateError) {
                                    console.error('Error updating user password:', updateError);
                                    return NextResponse.json({ 
                                        error: `Failed to update user password: ${updateError.message}` 
                                    }, { status: 400 });
                                }

                                return NextResponse.json({ 
                                    data: freshExistingUser,
                                    message: 'User already exists, updated password and verified profile'
                                }, { status: 200 });
                            }

                            console.error('Error creating user:', authError);
                            return NextResponse.json({ 
                                error: `Failed to create user: ${authError.message}` 
                            }, { status: 400 });
                        }

                        if (!authData?.user) {
                            console.error('No user data returned after creation');
                            return NextResponse.json({ 
                                error: 'Failed to create user: No user data returned' 
                            }, { status: 400 });
                        }

                        console.log('User created successfully:', authData.user.id);
                        
                        // Create profile for the user
                        const { error: profileError } = await supabaseAdmin
                            .from('profiles')
                            .insert({
                                id: authData.user.id,
                                user_id: authData.user.id,
                                clerk_id: userId,
                                email: email,
                                full_name: 'Test User',
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString()
                            });

                        if (profileError) {
                            console.error('Error creating profile:', profileError);
                            return NextResponse.json({ 
                                error: `Failed to create profile: ${profileError.message}` 
                            }, { status: 400 });
                        }

                        return NextResponse.json({ 
                            data: authData.user,
                            message: 'User created successfully with profile'
                        }, { status: 200 });
                    } catch (error: any) {
                        console.error('Error in user creation:', error);
                        return NextResponse.json({ 
                            error: `Error in user creation: ${error.message}` 
                        }, { status: 400 });
                    }
                } catch (error: any) {
                    console.error('Unexpected error in createUser:', error);
                    return NextResponse.json({ 
                        error: `Unexpected error: ${error.message}` 
                    }, { status: 500 });
                }
            }

            case 'createProfile':
                const { profileData } = data;
                if (!profileData) {
                    return NextResponse.json({ 
                        error: 'Missing required field: profileData' 
                    }, { status: 400 });
                }

                const { error: profileError } = await supabaseAdmin
                    .from('profiles')
                    .insert(profileData);

                if (profileError) {
                    console.error('Error creating profile:', profileError);
                    return NextResponse.json({ 
                        error: `Failed to create profile: ${profileError.message}` 
                    }, { status: 400 });
                }

                return NextResponse.json({ success: true });

            case 'createDocument':
                const { documentData } = data;
                if (!documentData) {
                    return NextResponse.json({ 
                        error: 'Missing required field: documentData' 
                    }, { status: 400 });
                }

                const { data: docData, error: docError } = await supabaseAdmin
                    .from('documents')
                    .insert(documentData)
                    .select()
                    .single();

                if (docError) {
                    console.error('Error creating document:', docError);
                    return NextResponse.json({ 
                        error: `Failed to create document: ${docError.message}` 
                    }, { status: 400 });
                }

                return NextResponse.json({ data: docData });

            case 'createPermission':
                const { permissionData } = data;
                if (!permissionData) {
                    return NextResponse.json({ 
                        error: 'Missing required field: permissionData' 
                    }, { status: 400 });
                }

                const { error: permError } = await supabaseAdmin
                    .from('document_permissions')
                    .insert(permissionData);

                if (permError) {
                    console.error('Error creating permission:', permError);
                    return NextResponse.json({ 
                        error: `Failed to create permission: ${permError.message}` 
                    }, { status: 400 });
                }

                return NextResponse.json({ success: true });

            case 'signIn':
                const { signInEmail, signInPassword } = data;
                if (!signInEmail || !signInPassword) {
                    return NextResponse.json({ 
                        error: 'Missing required fields: email and password are required' 
                    }, { status: 400 });
                }

                console.log('Attempting to sign in user:', signInEmail);
                // First check if user exists
                const { data: signInUser, error: signInUserError } = await supabaseAdmin.auth.admin.listUsers();
                if (signInUserError) {
                    console.error('Error checking user for sign in:', signInUserError);
                    return NextResponse.json({ 
                        error: `Failed to check user: ${signInUserError.message}` 
                    }, { status: 400 });
                }

                const existingSignInUser = signInUser?.users?.find(u => u.email === signInEmail);
                if (!existingSignInUser) {
                    console.error('User not found for sign in:', signInEmail);
                    return NextResponse.json({ 
                        error: 'User not found. Please create the user first.' 
                    }, { status: 400 });
                }

                console.log('User found, attempting sign in');
                // Create a new client for sign in
                const signInClient = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                    {
                        auth: {
                            autoRefreshToken: false,
                            persistSession: false
                        }
                    }
                );

                // Try to sign in
                const { data: signInData, error: signInError } = await signInClient.auth.signInWithPassword({
                    email: signInEmail,
                    password: signInPassword
                });

                if (signInError) {
                    console.error('Error signing in:', signInError);
                    // If sign in fails, try to reset the password
                    console.log('Sign in failed, attempting password reset');
                    const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(
                        existingSignInUser.id,
                        { password: signInPassword }
                    );

                    if (resetError) {
                        console.error('Error resetting password:', resetError);
                        return NextResponse.json({ 
                            error: `Failed to reset password: ${resetError.message}` 
                        }, { status: 400 });
                    }

                    console.log('Password reset successful, attempting sign in again');
                    // Try signing in again after password reset
                    const { data: retrySignInData, error: retrySignInError } = await signInClient.auth.signInWithPassword({
                        email: signInEmail,
                        password: signInPassword
                    });

                    if (retrySignInError) {
                        console.error('Error signing in after password reset:', retrySignInError);
                        return NextResponse.json({ 
                            error: `Failed to sign in after password reset: ${retrySignInError.message}` 
                        }, { status: 400 });
                    }

                    console.log('Sign in successful after password reset');
                    return NextResponse.json({ data: retrySignInData });
                }

                console.log('Sign in successful');
                return NextResponse.json({ data: signInData });

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
} 