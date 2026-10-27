import type { SessionUser } from './types';

/**
 * DEMO MODE ONLY. These logins are used when the site is NOT connected to
 * Supabase (so you can click around locally). In LIVE mode they are ignored —
 * real logins are created in Supabase (see README.md, Part 4).
 */
export const DEMO_USERS: (SessionUser & { password: string })[] = [
  { email: 'owner@advibe.studio', password: 'owner2026', name: 'Adaeze O.', role: 'owner' },
  { email: 'ops@advibe.studio', password: 'ops2026', name: 'Tunde B.', role: 'ops' },
];
