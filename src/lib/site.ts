import { db } from './db';

export interface SiteConfig {
  brand: string;
  brandEn: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  icp: string;
  wechat: string;
  whatsapp: string;
  facebook: string;
  youtube: string;
  instagram: string;
  linkedin: string;
}

const DEFAULTS: SiteConfig = {
  brand: 'AudioCenter',
  brandEn: 'AudioCenter Pro Audio',
  tagline: '为声音而生，为舞台而造',
  phone: '400-888-0000',
  email: 'info@audiocenter.example',
  address: '广州市高新技术开发区音响大道88号',
  icp: '粤ICP备0000000号',
  wechat: 'AudioCenter_Official',
  whatsapp: '+86 138 0000 0000',
  facebook: 'https://facebook.com',
  youtube: 'https://youtube.com',
  instagram: 'https://instagram.com',
  linkedin: 'https://linkedin.com',
};

let cache: SiteConfig | null = null;
let cacheTs = 0;
const TTL = 60_000; // 1 minute

export async function getSiteConfig(): Promise<SiteConfig> {
  const now = Date.now();
  if (cache && now - cacheTs < TTL) return cache;
  try {
    const rows = await db.siteSetting.findMany();
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;
    cache = { ...DEFAULTS, ...map } as SiteConfig;
    cacheTs = now;
    return cache;
  } catch {
    return DEFAULTS;
  }
}

export function invalidateSiteConfig() {
  cache = null;
  cacheTs = 0;
}

// Menu helpers
export interface NavItem {
  label: string;
  url: string;
  order: number;
  children?: NavItem[];
}

export async function getMenu(slug: string): Promise<NavItem[]> {
  const menu = await db.menu.findUnique({
    where: { slug },
    include: {
      items: {
        where: { parentId: null },
        orderBy: { order: 'asc' },
        include: { children: { orderBy: { order: 'asc' } } },
      },
    },
  });
  if (!menu) return [];
  return menu.items.map((i) => ({
    label: i.label,
    url: i.url,
    order: i.order,
    children: i.children?.map((c) => ({ label: c.label, url: c.url, order: c.order })),
  }));
}
