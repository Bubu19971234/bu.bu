-- =============================================================================
-- LOCAL/DEV SEED ONLY — fake data. Applied by `supabase db reset` on the local
-- stack. Never run against production.
--
-- Accounts (password for all: Password123!):
--   adult.player@example.test   adult player, public profile
--   minor.player@example.test   15-year-old player, pending guardian invite
--   guardian@example.test       adult, can accept the minor's invite
--   moderator@example.test      platform admin
-- =============================================================================

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token,
  email_change_token_new, email_change)
select '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
  extensions.crypt('Password123!', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
from (values
  ('11111111-1111-4111-8111-111111111111'::uuid, 'adult.player@example.test'),
  ('22222222-2222-4222-8222-222222222222'::uuid, 'minor.player@example.test'),
  ('33333333-3333-4333-8333-333333333333'::uuid, 'guardian@example.test'),
  ('44444444-4444-4444-8444-444444444444'::uuid, 'moderator@example.test')
) as u(id, email)
on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text, jsonb_build_object('sub', u.id::text, 'email', u.email), 'email', now(), now(), now()
from auth.users u where u.email like '%@example.test'
on conflict do nothing;

insert into public.platform_staff (user_id, role) values ('44444444-4444-4444-8444-444444444444', 'admin')
on conflict do nothing;

-- Player profiles are created through the same RPC the app uses, acting as each user.
do $$
begin
  perform set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
  perform public.player_onboard('Marco Esempio', (current_date - interval '20 years')::date, 181::smallint, 'right', 'CM',
    array['AM','DM'], 'ASD Prototipo', 8::smallint);
  update public.player_profiles set visibility = 'public' where user_id = '11111111-1111-4111-8111-111111111111';

  perform set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
  perform public.player_onboard('Luca Giovane', (current_date - interval '15 years')::date, 170::smallint, 'left', 'LW',
    array['ST'], 'ASD Prototipo U17', 11::smallint);
  perform public.guardian_request_create('guardian@example.test', 'parent');

  perform set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
  perform public.account_set_date_of_birth((current_date - interval '45 years')::date);
  perform set_config('request.jwt.claims', '', true);
end $$;
