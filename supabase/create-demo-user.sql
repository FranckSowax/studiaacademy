-- ============================================
-- CRÉATION D'UN COMPTE DÉMO
-- ============================================
-- Exécutez ce script dans Supabase SQL Editor
-- Dashboard > SQL Editor > New Query

-- Compte démo:
-- Email: demo@studia-academy.com
-- Mot de passe: Demo2024!

-- ============================================
-- 1. CRÉER L'UTILISATEUR DANS AUTH.USERS
-- ============================================

-- Générer un UUID pour l'utilisateur
DO $$
DECLARE
    demo_user_id UUID := gen_random_uuid();
BEGIN
    -- Supprimer l'utilisateur démo existant s'il existe
    DELETE FROM auth.users WHERE email = 'demo@studia-academy.com';

    -- Créer l'utilisateur dans auth.users
    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        invited_at,
        confirmation_token,
        confirmation_sent_at,
        recovery_token,
        recovery_sent_at,
        email_change_token_new,
        email_change,
        email_change_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        phone,
        phone_confirmed_at,
        phone_change,
        phone_change_token,
        phone_change_sent_at,
        email_change_token_current,
        email_change_confirm_status,
        banned_until,
        reauthentication_token,
        reauthentication_sent_at,
        is_sso_user,
        deleted_at
    ) VALUES (
        demo_user_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'demo@studia-academy.com',
        crypt('Demo2024!', gen_salt('bf')),
        NOW(), -- Email confirmé immédiatement
        NULL,
        '',
        NULL,
        '',
        NULL,
        '',
        '',
        NULL,
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "Utilisateur Démo", "avatar_url": ""}',
        FALSE,
        NOW(),
        NOW(),
        NULL,
        NULL,
        '',
        '',
        NULL,
        '',
        0,
        NULL,
        '',
        NULL,
        FALSE,
        NULL
    );

    -- Créer l'identité dans auth.identities
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        demo_user_id,
        jsonb_build_object(
            'sub', demo_user_id::text,
            'email', 'demo@studia-academy.com',
            'email_verified', true,
            'phone_verified', false
        ),
        'email',
        demo_user_id::text,
        NOW(),
        NOW(),
        NOW()
    );

    -- Le trigger handle_new_user devrait créer automatiquement:
    -- - Le profil
    -- - Le wallet avec 50 crédits
    -- - Les paramètres utilisateur
    -- - La notification de bienvenue

    RAISE NOTICE 'Compte démo créé avec succès!';
    RAISE NOTICE 'Email: demo@studia-academy.com';
    RAISE NOTICE 'Mot de passe: Demo2024!';
    RAISE NOTICE 'User ID: %', demo_user_id;

END $$;

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Vérifier que l'utilisateur a été créé
SELECT
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users
WHERE email = 'demo@studia-academy.com';

-- Vérifier le profil
SELECT * FROM public.profiles
WHERE email = 'demo@studia-academy.com';

-- Vérifier le wallet
SELECT w.* FROM public.wallets w
JOIN public.profiles p ON w.user_id = p.id
WHERE p.email = 'demo@studia-academy.com';

-- ============================================
-- INFORMATIONS DE CONNEXION
-- ============================================
--
-- Email: demo@studia-academy.com
-- Mot de passe: Demo2024!
--
-- L'email est pré-validé, vous pouvez vous connecter directement.
-- ============================================
