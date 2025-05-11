import { createClient } from '@supabase/supabase-js';
import { clerkClient } from '@clerk/clerk-sdk-node';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

async function verifySignupFlow() {
    try {
        console.log('Starting signup flow verification...');

        // 1. Get the most recent user from Clerk
        const users = await clerkClient.users.getUserList({
            limit: 1,
            orderBy: '-created_at'
        });

        if (!users.length) {
            throw new Error('No users found in Clerk');
        }

        const latestUser = users[0];
        console.log('\nLatest user in Clerk:', {
            id: latestUser.id,
            email: latestUser.emailAddresses[0]?.emailAddress,
            firstName: latestUser.firstName,
            lastName: latestUser.lastName,
            phoneNumber: latestUser.phoneNumbers[0]?.phoneNumber,
            createdAt: latestUser.createdAt
        });

        // 2. Check if profile exists in Supabase
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('clerk_id', latestUser.id)
            .single();

        if (profileError) {
            if (profileError.code === 'PGRST116') {
                console.error('❌ No profile found in Supabase for this user');
                return;
            }
            throw new Error(`Error checking profile: ${profileError.message}`);
        }

        console.log('\nProfile in Supabase:', {
            id: profile.id,
            clerk_id: profile.clerk_id,
            email: profile.email,
            full_name: profile.full_name,
            phone_number: profile.phone_number,
            created_at: profile.created_at
        });

        // 3. Verify data consistency
        const emailMatches = profile.email === latestUser.emailAddresses[0]?.emailAddress;
        const nameMatches = profile.full_name === `${latestUser.firstName} ${latestUser.lastName}`.trim();
        const phoneMatches = profile.phone_number === latestUser.phoneNumbers[0]?.phoneNumber;

        console.log('\nData Consistency Check:');
        console.log('Email matches:', emailMatches ? '✅' : '❌');
        console.log('Name matches:', nameMatches ? '✅' : '❌');
        console.log('Phone matches:', phoneMatches ? '✅' : '❌');

        // 4. Check if profile was created with correct initial state
        const hasCorrectInitialState =
            profile.onboarding_completed === false &&
            profile.role === 'attorney' &&
            !profile.bar_number &&
            !profile.firm_name &&
            !profile.specialization &&
            !profile.years_of_practice;

        console.log('\nInitial State Check:');
        console.log('Profile has correct initial state:', hasCorrectInitialState ? '✅' : '❌');
        console.log('Onboarding not completed:', profile.onboarding_completed === false ? '✅' : '❌');
        console.log('Role set to attorney:', profile.role === 'attorney' ? '✅' : '❌');
        console.log('Professional fields empty:',
            (!profile.bar_number && !profile.firm_name && !profile.specialization && !profile.years_of_practice) ? '✅' : '❌'
        );

    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

verifySignupFlow(); 