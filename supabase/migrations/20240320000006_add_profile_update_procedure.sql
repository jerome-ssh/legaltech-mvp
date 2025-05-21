-- Create a function to update profile and related data in a transaction
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
  p_professional_ids JSONB DEFAULT '[]'::JSONB,
  p_law_firm_associations JSONB DEFAULT '[]'::JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile_id UUID;
  v_role_id UUID;
  v_profile JSONB;
  v_professional_id JSONB;
  v_law_firm_association JSONB;
BEGIN
  -- Start transaction
  BEGIN
    -- Get role_id
    SELECT id INTO v_role_id
    FROM roles
    WHERE name = p_role;

    IF v_role_id IS NULL THEN
      RAISE EXCEPTION 'Role not found: %', p_role;
    END IF;

    -- Update or insert profile
    INSERT INTO profiles (
      id,
      user_id,
      clerk_id,
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
      role_id,
      onboarding_completed,
      created_at,
      updated_at
    )
    VALUES (
      p_user_id,
      p_user_id,
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
      v_role_id,
      p_onboarding_completed,
      NOW(),
      NOW()
    )
    ON CONFLICT (clerk_id) DO UPDATE
    SET
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
      role_id = EXCLUDED.role_id,
      onboarding_completed = EXCLUDED.onboarding_completed,
      updated_at = NOW()
    RETURNING to_jsonb(profiles.*) INTO v_profile;

    -- Handle professional IDs
    IF p_professional_ids IS NOT NULL AND jsonb_array_length(p_professional_ids) > 0 THEN
      -- Delete existing professional IDs
      DELETE FROM professional_ids
      WHERE profile_id = p_user_id;

      -- Insert new professional IDs
      FOR v_professional_id IN SELECT * FROM jsonb_array_elements(p_professional_ids)
      LOOP
        -- Validate required fields
        IF v_professional_id->>'country' IS NULL THEN
          RAISE EXCEPTION 'Country is required for professional ID';
        END IF;

        -- US-specific validation
        IF v_professional_id->>'country' = 'United States' THEN
          IF v_professional_id->>'state' IS NULL THEN
            RAISE EXCEPTION 'State is required for US jurisdiction';
          END IF;
          IF v_professional_id->>'professional_id' IS NULL AND (v_professional_id->>'no_id')::BOOLEAN = FALSE THEN
            RAISE EXCEPTION 'Bar number is required for US jurisdiction unless no_id is true';
          END IF;
        END IF;

        -- Validate year issued if provided
        IF v_professional_id->>'year_issued' IS NOT NULL THEN
          IF (v_professional_id->>'year_issued')::INTEGER < 1900 OR 
             (v_professional_id->>'year_issued')::INTEGER > EXTRACT(YEAR FROM CURRENT_DATE) THEN
            RAISE EXCEPTION 'Invalid year issued';
          END IF;
        END IF;

        -- Insert the professional ID
        INSERT INTO professional_ids (
          profile_id,
          country,
          state,
          professional_id,
          year_issued,
          no_id,
          document_url,
          document_name,
          issuing_authority,
          issue_date,
          expiration_date,
          status,
          verification_notes,
          created_at,
          updated_at
        )
        VALUES (
          p_user_id,
          v_professional_id->>'country',
          v_professional_id->>'state',
          v_professional_id->>'professional_id',
          (v_professional_id->>'year_issued')::INTEGER,
          (v_professional_id->>'no_id')::BOOLEAN,
          v_professional_id->>'document_url',
          v_professional_id->>'document_name',
          v_professional_id->>'issuing_authority',
          (v_professional_id->>'issue_date')::DATE,
          (v_professional_id->>'expiration_date')::DATE,
          COALESCE(v_professional_id->>'status', 'active'),
          v_professional_id->>'verification_notes',
          NOW(),
          NOW()
        );
      END LOOP;
    END IF;

    -- Handle law firm associations
    IF p_law_firm_associations IS NOT NULL AND jsonb_array_length(p_law_firm_associations) > 0 THEN
      -- Delete existing associations
      DELETE FROM law_firm_associations
      WHERE profile_id = p_user_id;

      -- Insert new associations
      FOR v_law_firm_association IN SELECT * FROM jsonb_array_elements(p_law_firm_associations)
      LOOP
        -- Validate required fields
        IF v_law_firm_association->>'law_firm_id' IS NULL THEN
          RAISE EXCEPTION 'Law firm ID is required for association';
        END IF;

        IF v_law_firm_association->>'role' IS NULL THEN
          RAISE EXCEPTION 'Role is required for law firm association';
        END IF;

        IF v_law_firm_association->>'start_date' IS NULL THEN
          RAISE EXCEPTION 'Start date is required for law firm association';
        END IF;

        -- Validate dates
        IF v_law_firm_association->>'end_date' IS NOT NULL AND
           (v_law_firm_association->>'end_date')::DATE < (v_law_firm_association->>'start_date')::DATE THEN
          RAISE EXCEPTION 'End date must be after start date';
        END IF;

        -- Insert the association
        INSERT INTO law_firm_associations (
          profile_id,
          law_firm_id,
          role,
          start_date,
          end_date,
          is_primary,
          status,
          created_at,
          updated_at
        )
        VALUES (
          p_user_id,
          (v_law_firm_association->>'law_firm_id')::UUID,
          v_law_firm_association->>'role',
          (v_law_firm_association->>'start_date')::DATE,
          (v_law_firm_association->>'end_date')::DATE,
          (v_law_firm_association->>'is_primary')::BOOLEAN,
          COALESCE(v_law_firm_association->>'status', 'active'),
          NOW(),
          NOW()
        );
      END LOOP;
    END IF;

    -- Return the updated profile
    RETURN v_profile;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Failed to update profile: %', SQLERRM;
  END;
END;
$$; 