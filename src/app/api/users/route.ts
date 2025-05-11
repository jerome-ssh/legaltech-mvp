import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import bcrypt from 'bcrypt';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Input validation schema
const userSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  role: z.enum(['attorney', 'admin', 'user', 'manager']),
  phone_number: z.string().min(10, 'Phone number must be at least 10 characters'),
  bar_number: z.string().min(1, 'Bar number is required'),
  firm_name: z.string().min(1, 'Firm name is required'),
  specialization: z.string().min(1, 'Specialization is required'),
  years_of_practice: z.string().optional(),
  avatar_url: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received request body:', body);
    
    // Validate input
    const validationResult = userSchema.safeParse(body);
    if (!validationResult.success) {
      console.log('Validation failed:', validationResult.error.errors);
      return new Response(
        JSON.stringify({ error: validationResult.error.errors[0].message }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    const { 
      email, 
      password, 
      first_name, 
      last_name, 
      role, 
      phone_number, 
      bar_number, 
      firm_name, 
      specialization, 
      years_of_practice, 
      avatar_url 
    } = validationResult.data;

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing user:', checkError);
      return new Response(
        JSON.stringify({ error: 'Error checking user existence' }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'User with this email already exists' }),
        { 
          status: 409,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    // Hash the password with a strong salt
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user in Supabase
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          encrypted_password: hashedPassword,
          first_name,
          last_name,
          role,
          phone_number,
          bar_number,
          firm_name,
          specialization,
          years_of_practice,
          avatar_url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to create user' }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    // Return success response without sensitive data
    const { encrypted_password, ...userWithoutPassword } = data;
    return new Response(
      JSON.stringify({ 
        message: 'User created successfully', 
        user: userWithoutPassword 
      }),
      { 
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

  } catch (error) {
    console.error('Error in user creation:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role, phone_number, avatar_url, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch users' }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ users: data }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in fetching users:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
} 