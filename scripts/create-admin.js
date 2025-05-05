const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://ueqzjuclosoedybixqgs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminUser() {
  try {
    // Create the admin user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@legaltech.com',
      password: 'Admin123!',
      email_confirm: true,
      user_metadata: { role: 'admin' }
    });

    if (authError) throw authError;

    // Create the admin profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name: 'System Administrator',
        email: 'admin@legaltech.com',
        role: 'admin',
        specialization: 'Administrative Law',
        firm_name: 'LegalTech Platform',
        phone_number: '+1234567890',
        address: '123 Admin Street, Suite 100',
        bar_number: 'ADMIN-001',
        years_of_practice: 10
      });

    if (profileError) throw profileError;

    console.log('Admin user created successfully!');
    console.log('Login credentials:');
    console.log('Email: admin@legaltech.com');
    console.log('Password: Admin123!');
  } catch (error) {
    console.error('Error creating admin user:', error.message);
    process.exit(1);
  }
}

createAdminUser(); 