import { AdminSessionProvider } from '@/components/admin/session-provider';

export const metadata = { title: '管理后台' };
export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminSessionProvider>{children}</AdminSessionProvider>;
}
