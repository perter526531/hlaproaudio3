import Link from 'next/link';
import { Phone, Mail, MapPin, Facebook, Youtube, Instagram, Linkedin } from 'lucide-react';
import type { SiteConfig, NavItem } from '@/lib/site';

export function SiteFooter({ config, items }: { config: SiteConfig; items: NavItem[] }) {
  return (
    <footer className="mt-auto bg-neutral-950 text-neutral-300">
      <div className="container-page py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
                {config.brand.charAt(0)}
              </span>
              <span className="text-lg font-bold text-white">{config.brand}</span>
            </div>
            <p className="mt-4 text-sm text-neutral-400 max-w-md leading-relaxed">
              {config.brand} 专业音响。专业音响系统领先制造商，致力于为全球用户提供卓越的声音体验。
            </p>
            <div className="mt-6 flex gap-3">
              <SocialLink href={config.facebook} label="Facebook"><Facebook className="h-4 w-4" /></SocialLink>
              <SocialLink href={config.youtube} label="YouTube"><Youtube className="h-4 w-4" /></SocialLink>
              <SocialLink href={config.instagram} label="Instagram"><Instagram className="h-4 w-4" /></SocialLink>
              <SocialLink href={config.linkedin} label="LinkedIn"><Linkedin className="h-4 w-4" /></SocialLink>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">快速导航</h3>
            <ul className="space-y-2 text-sm">
              {items.map((it) => (
                <li key={it.url}>
                  <Link href={it.url} className="text-neutral-400 hover:text-white transition-colors">
                    {it.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">联系我们</h3>
            <ul className="space-y-3 text-sm text-neutral-400">
              <li className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <a href={`tel:${config.phone}`} className="hover:text-white">{config.phone}</a>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <a href={`mailto:${config.email}`} className="hover:text-white break-all">{config.email}</a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <span>{config.address}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
          <span>© {new Date().getFullYear()} {config.brand}. 版权所有</span>
          <span>{config.icp}</span>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-white/5 hover:bg-primary hover:text-primary-foreground transition-colors"
    >
      {children}
    </a>
  );
}
