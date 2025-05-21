-- Drop existing functions to avoid ambiguity
DROP FUNCTION IF EXISTS update_profile_with_related(uuid, text, text, text, text, text, text, integer, text, text, text, text, text, boolean, jsonb);
DROP FUNCTION IF EXISTS update_profile_with_related(uuid, text, text, text, text, text, text, integer, text, text, text, text, text, boolean, jsonb, jsonb);

-- Create the new function
CREATE OR REPLACE FUNCTION update_profile_with_related(
    p_user_id UUID,
    p_email TEXT,
    p_phone_number TEXT,
    p_first_name TEXT,
    p_last_name TEXT,
    p_firm_name TEXT,
    p_specialization TEXT,
    p_years_of_practice INTEGER,
    p_avatar_url TEXT,
    p_address TEXT,
    p_home_address TEXT,
    p_gender TEXT,
    p_role TEXT,
    p_onboarding_completed BOOLEAN,
    p_professional_ids JSONB DEFAULT '[]'::JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id UUID;
    v_profile JSONB;
    v_professional_id JSONB;
BEGIN
    -- Start transaction
    BEGIN
        -- Upsert profile
        INSERT INTO profiles (
            user_id,
            email,
            phone_number,
            first_name,
            last_name,
            firm_name,
            specialization,
            years_of_practice,
            avatar_url,
            address,
            home_address,
            gender,
            role,
            onboarding_completed,
            updated_at
        )
        VALUES (
            p_user_id,
            p_email,
            p_phone_number,
            p_first_name,
            p_last_name,
            p_firm_name,
            p_specialization,
            p_years_of_practice,
            p_avatar_url,
            p_address,
            p_home_address,
            p_gender,
            p_role,
            p_onboarding_completed,
            NOW()
        )
        ON CONFLICT (user_id) DO UPDATE SET
            email = EXCLUDED.email,
            phone_number = EXCLUDED.phone_number,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            firm_name = EXCLUDED.firm_name,
            specialization = EXCLUDED.specialization,
            years_of_practice = EXCLUDED.years_of_practice,
            avatar_url = EXCLUDED.avatar_url,
            address = EXCLUDED.address,
            home_address = EXCLUDED.home_address,
            gender = EXCLUDED.gender,
            role = EXCLUDED.role,
            onboarding_completed = EXCLUDED.onboarding_completed,
            updated_at = NOW()
        RETURNING id INTO v_profile_id;

        -- Delete existing professional IDs
        DELETE FROM professional_ids WHERE profile_id = v_profile_id;

        -- Insert new professional IDs
        IF p_professional_ids IS NOT NULL AND jsonb_array_length(p_professional_ids) > 0 THEN
            FOR v_professional_id IN SELECT * FROM jsonb_array_elements(p_professional_ids)
            LOOP
                INSERT INTO professional_ids (
                    profile_id,
                    country,
                    state,
                    professional_id,
                    year_issued,
                    no_id,
                    created_at,
                    updated_at
                )
                VALUES (
                    v_profile_id,
                    v_professional_id->>'country',
                    v_professional_id->>'state',
                    v_professional_id->>'professional_id',
                    (v_professional_id->>'year_issued')::INTEGER,
                    (v_professional_id->>'no_id')::BOOLEAN,
                    NOW(),
                    NOW()
                );
            END LOOP;
        END IF;

        -- Get the updated profile with related data
        SELECT jsonb_build_object(
            'id', p.id,
            'user_id', p.user_id,
            'email', p.email,
            'phone_number', p.phone_number,
            'first_name', p.first_name,
            'last_name', p.last_name,
            'firm_name', p.firm_name,
            'specialization', p.specialization,
            'years_of_practice', p.years_of_practice,
            'avatar_url', p.avatar_url,
            'address', p.address,
            'home_address', p.home_address,
            'gender', p.gender,
            'role', p.role,
            'onboarding_completed', p.onboarding_completed,
            'professional_ids', COALESCE(
                (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'id', pi.id,
                            'country', pi.country,
                            'state', pi.state,
                            'professional_id', pi.professional_id,
                            'year_issued', pi.year_issued,
                            'no_id', pi.no_id
                        )
                    )
                    FROM professional_ids pi
                    WHERE pi.profile_id = p.id
                ),
                '[]'::jsonb
            )
        )
        INTO v_profile
        FROM profiles p
        WHERE p.id = v_profile_id;

        RETURN v_profile;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE EXCEPTION 'Failed to update profile: %', SQLERRM;
    END;
END;
$$; 