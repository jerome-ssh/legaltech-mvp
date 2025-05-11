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

async function testProfileFlow() {
    try {
        console.log('Starting profile flow test...');

        // 1. Get a test user from Clerk
        const users = await clerkClient.users.getUserList();
        const testUser = users[0]; // Get the first user for testing
        console.log('Test user found:', testUser.id);

        // 2. Check if profile exists in Supabase
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('clerk_id', testUser.id)
            .single();

        if (profileError && profileError.code !== 'PGRST116') {
            throw new Error(`Error checking profile: ${profileError.message}`);
        }

        console.log('Current profile state:', profile || 'No profile found');

        // 3. Simulate onboarding data
        const onboardingData = {
            barNumber: 'TEST-123',
            firmName: 'Test Firm',
            specialization: 'Test Law',
            yearsOfPractice: '5'
        };

        // 4. Update Clerk metadata
        await clerkClient.users.updateUser(testUser.id, {
            unsafeMetadata: {
                ...onboardingData,
                onboardingCompleted: true
            }
        });
        console.log('Clerk metadata updated');

        // 5. Update Supabase profile
        const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update({
                bar_number: onboardingData.barNumber,
                firm_name: onboardingData.firmName,
                specialization: onboardingData.specialization,
                years_of_practice: onboardingData.yearsOfPractice,
                onboarding_completed: true,
                updated_at: new Date().toISOString()
            })
            .eq('clerk_id', testUser.id)
            .select()
            .single();

        if (updateError) {
            throw new Error(`Error updating profile: ${updateError.message}`);
        }

        console.log('Profile updated successfully:', updatedProfile);

        // 6. Verify the data
        const { data: finalProfile, error: verifyError } = await supabase
            .from('profiles')
            .select('*')
            .eq('clerk_id', testUser.id)
            .single();

        if (verifyError) {
            throw new Error(`Error verifying profile: ${verifyError.message}`);
        }

        console.log('Final profile state:', finalProfile);

        // 7. Verify all fields match
        const fieldsMatch =
            finalProfile.bar_number === onboardingData.barNumber &&
            finalProfile.firm_name === onboardingData.firmName &&
            finalProfile.specialization === onboardingData.specialization &&
            finalProfile.years_of_practice === onboardingData.yearsOfPractice &&
            finalProfile.onboarding_completed === true;

        console.log('All fields match:', fieldsMatch ? '✅' : '❌');

    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

testProfileFlow(); 