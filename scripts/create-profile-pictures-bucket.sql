-- Create a storage bucket for profile pictures
insert into storage.buckets (id, name, public)
values ('profile-pictures', 'profile-pictures', true);

-- Set up storage policies
create policy "Profile pictures are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'profile-pictures' );

create policy "Users can upload their own profile picture"
  on storage.objects for insert
  with check (
    bucket_id = 'profile-pictures' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own profile picture"
  on storage.objects for update
  using (
    bucket_id = 'profile-pictures' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own profile picture"
  on storage.objects for delete
  using (
    bucket_id = 'profile-pictures' AND
    auth.uid()::text = (storage.foldername(name))[1]
  ); 