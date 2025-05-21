-- Create or replace the profile update procedure
create or replace function update_profile_with_related(
  p_clerk_user_id text,
  p_email text,
  p_phone_number text,
  p_first_name text,
  p_last_name text,
  p_firm_name text,
  p_specialization text,
  p_years_of_practice integer,
  p_avatar_url text,
  p_address text,
  p_home_address text,
  p_gender text,
  p_role text,
  p_onboarding_completed boolean,
  p_professional_ids jsonb
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_supabase_user_id uuid;
  v_profile_id uuid;
  v_professional_id jsonb;
begin
  -- Get or create user mapping
  select supabase_user_id into v_supabase_user_id
  from user_mappings
  where clerk_user_id = p_clerk_user_id;

  if v_supabase_user_id is null then
    -- Create new mapping
    insert into user_mappings (clerk_user_id)
    values (p_clerk_user_id)
    returning supabase_user_id into v_supabase_user_id;
  end if;

  -- Get or create profile
  select id into v_profile_id
  from profiles
  where user_id = v_supabase_user_id;

  if v_profile_id is null then
    -- Create new profile
    insert into profiles (
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
      onboarding_completed
    )
    values (
      v_supabase_user_id,
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
      p_onboarding_completed
    )
    returning id into v_profile_id;
  else
    -- Update existing profile
    update profiles
    set
      email = p_email,
      phone_number = p_phone_number,
      first_name = p_first_name,
      last_name = p_last_name,
      firm_name = p_firm_name,
      specialization = p_specialization,
      years_of_practice = p_years_of_practice,
      avatar_url = p_avatar_url,
      address = p_address,
      home_address = p_home_address,
      gender = p_gender,
      role = p_role,
      onboarding_completed = p_onboarding_completed,
      updated_at = now()
    where id = v_profile_id;
  end if;

  -- Handle professional IDs
  if p_professional_ids is not null then
    -- Delete existing professional IDs
    delete from professional_ids
    where profile_id = v_profile_id;

    -- Insert new professional IDs
    for v_professional_id in select * from jsonb_array_elements(p_professional_ids)
    loop
      insert into professional_ids (
        profile_id,
        country,
        state,
        professional_id,
        year_issued,
        document_url
      )
      values (
        v_profile_id,
        v_professional_id->>'country',
        v_professional_id->>'state',
        v_professional_id->>'professional_id',
        (v_professional_id->>'year_issued')::integer,
        v_professional_id->>'document_url'
      );
    end loop;
  end if;

  -- Return the updated profile with related data
  return (
    select jsonb_build_object(
      'profile', row_to_json(p.*),
      'professional_ids', (
        select jsonb_agg(row_to_json(pi.*))
        from professional_ids pi
        where pi.profile_id = p.id
      )
    )
    from profiles p
    where p.id = v_profile_id
  );
end;
$$; 