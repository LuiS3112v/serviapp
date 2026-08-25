-- ============================================================
-- MESTROO — MIGRATION DE SEGURANÇA: RLS + REVOKE
-- ============================================================
--
-- CONTEXTO (confirmado antes de executar):
--
--   current_user  = postgres   (rolbypassrls = TRUE)
--   session_user  = postgres
--   tableowner    = postgres   (em todas as tabelas)
--   anon          = rolbypassrls FALSE, rolcanlogin FALSE
--   authenticated = rolbypassrls FALSE, rolcanlogin FALSE
--   service_role  = rolsuper   TRUE  (Supabase SDK interno)
--
-- EFEITO DESTA MIGRATION:
--
--   1. ENABLE ROW LEVEL SECURITY em todas as 32 tabelas do schema
--      public. Com RLS activo e sem policies, o comportamento padrão
--      do Postgres é DENY ALL para qualquer role que NÃO tenha
--      bypassrls — ou seja, anon e authenticated ficam bloqueados.
--
--   2. REVOKE de todos os privilégios de anon e authenticated em
--      todas as tabelas. Dupla protecção: mesmo que alguém desactive
--      RLS numa tabela por engano, os grants já não existem.
--
--   3. NÃO usa FORCE ROW LEVEL SECURITY — não é necessário porque
--      postgres (a role da conexão do backend) já tem bypassrls=TRUE.
--      FORCE RLS obrigaria o owner a passar também pelas policies,
--      o que quebraria queries internas do backend/TypeORM.
--
--   4. NÃO cria policies baseadas em auth.uid() — a aplicação usa
--      JWT próprio no NestJS, não Supabase Auth.
--
--   5. NÃO afecta service_role (rolsuper=TRUE — bypassa tudo),
--      postgres (bypassrls=TRUE), supabase_admin, pgbouncer, nem
--      qualquer role de sistema Supabase.
--
-- SEGURANÇA PÓS-MIGRATION:
--
--   • GET https://<project>.supabase.co/rest/v1/users       → 403
--   • GET https://<project>.supabase.co/rest/v1/wallets     → 403
--   • GET https://<project>.supabase.co/rest/v1/payments    → 403
--   • (qualquer tabela via PostgREST com anon key)           → 403
--
--   • Backend NestJS (postgres, bypassrls=TRUE)              → ✅ funciona
--   • TypeORM migrations                                     → ✅ funciona
--   • Supabase Dashboard / SQL Editor                        → ✅ funciona
--   • service_role SDK                                       → ✅ funciona
--
-- REVERSÃO (se algo correr mal):
--
--   Para reverter completamente:
--   ALTER TABLE public.<tabela> DISABLE ROW LEVEL SECURITY;
--   GRANT ALL ON public.<tabela> TO anon, authenticated;
--
-- ============================================================

BEGIN;

-- ── 1. ENABLE ROW LEVEL SECURITY ─────────────────────────────────────────────
--
-- Com RLS activo e sem policies, o Postgres usa a regra "default deny":
-- qualquer role sem bypassrls que tente aceder à tabela recebe 0 rows
-- em SELECT e "permission denied" em INSERT/UPDATE/DELETE.
--
-- postgres (bypassrls=TRUE) e service_role (rolsuper=TRUE) não são
-- afectados — continuam a ver e a escrever tudo normalmente.

ALTER TABLE public.chat_messages                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_certifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_employees              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_gallery_images         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_invitations            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_portfolio_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_services               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_verifications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_tokens                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_proofs                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_bank_accounts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_bank_accounts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_catalog               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_gallery_images        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_priced_services       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_verifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_timelines              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategory_service_dismissals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategory_service_proposals  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategory_services           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users                          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets                        ENABLE ROW LEVEL SECURITY;


-- ── 2. REVOKE de anon e authenticated ────────────────────────────────────────
--
-- Segunda camada de defesa: mesmo que RLS seja desactivado por engano
-- numa tabela futura, os grants de anon/authenticated já não existem.
--
-- REVOKE ALL é seguro aqui porque:
--   • anon e authenticated NÃO são a role usada pelo backend (postgres)
--   • anon e authenticated NÃO podem fazer login na BD directamente
--     (rolcanlogin = FALSE para ambos)
--   • Estes grants existiam por defeito do Supabase para suportar
--     acesso via PostgREST com Supabase Auth — como a aplicação usa
--     JWT próprio e não usa PostgREST, estes grants são desnecessários
--     e representam uma superfície de ataque sem utilidade.

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;

-- Revoga também privilégios de schema (previne USAGE no schema para
-- enumerar tabelas via PostgREST mesmo sem acesso às linhas).
REVOKE USAGE ON SCHEMA public FROM anon;
REVOKE USAGE ON SCHEMA public FROM authenticated;


-- ── 3. Confirmação (opcional — podes correr separadamente para verificar) ─────
--
-- Após executar, verifica com:
--
--   SELECT relname, relrowsecurity
--   FROM pg_class
--   JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
--   WHERE pg_namespace.nspname = 'public' AND pg_class.relkind = 'r'
--   ORDER BY relname;
--   -- Todas as linhas devem ter relrowsecurity = true
--
--   SELECT grantee, table_name, privilege_type
--   FROM information_schema.role_table_grants
--   WHERE table_schema = 'public'
--     AND grantee IN ('anon', 'authenticated')
--   ORDER BY table_name;
--   -- Deve devolver 0 rows

COMMIT;