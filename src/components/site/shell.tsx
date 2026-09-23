import { getSiteConfig, getMenu } from '@/lib/site';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';

export async function SiteShell({ children }: { children: React.ReactNode }) {
  const [config, mainMenu, footerMenu] = await Promise.all([
    getSiteConfig(),
    getMenu('main'),
    getMenu('footer'),
  ]);
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader brand={config.brand} tagline={config.tagline} items={mainMenu} />
      <main className="flex-1">{children}</main>
      <SiteFooter config={config} items={footerMenu} />
    </div>
  );
}
