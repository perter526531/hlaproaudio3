 
// Seed the database with a complete starter site for AudioCenter pro-audio CMS.
// Run: bun run scripts/seed.ts
import { PrismaClient } from '@prisma/client';
import { defaultDataFor } from '../src/lib/blocks/types';

const db = new PrismaClient();

// 内置品牌图片（随仓库分发，public/uploads/gen/）
// 种子数据直接引用这些路径，部署后立即可见，无需重新上传
const IMG = {
  heroStage: '/uploads/gen/hero-stage.png',
  amplifier: '/uploads/gen/product-amplifier.png',
  subwoofer: '/uploads/gen/product-subwoofer.png',
  lineArray: '/uploads/gen/product-linearray.png',
  mixer: '/uploads/gen/product-mixer.png',
  mic: '/uploads/gen/product-mic.png',
};

async function main() {
  // ---- Site settings ----
  const settings: Record<string, string> = {
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
  for (const [k, v] of Object.entries(settings)) {
    await db.siteSetting.upsert({
      where: { key: k },
      update: { value: v },
      create: { key: k, value: v },
    });
  }

  // ---- Menus ----
  const mainMenu = await db.menu.upsert({
    where: { slug: 'main' },
    update: {},
    create: { slug: 'main', title: '主导航' },
  });
  await db.menuItem.deleteMany({ where: { menuId: mainMenu.id } });
  const mainItems = [
    { label: '首页', url: '/', order: 0 },
    { label: '关于我们', url: '/about', order: 1 },
    { label: '产品中心', url: '/products', order: 2 },
    { label: '解决方案', url: '/solutions', order: 3 },
    { label: '新闻资讯', url: '/news', order: 4 },
    { label: '联系我们', url: '/contact', order: 5 },
  ];
  for (const it of mainItems) {
    await db.menuItem.create({ data: { ...it, menuId: mainMenu.id } });
  }

  const footerMenu = await db.menu.upsert({
    where: { slug: 'footer' },
    update: {},
    create: { slug: 'footer', title: '页脚导航' },
  });
  await db.menuItem.deleteMany({ where: { menuId: footerMenu.id } });
  const footerItems = [
    { label: '首页', url: '/', order: 0 },
    { label: '关于我们', url: '/about', order: 1 },
    { label: '产品中心', url: '/products', order: 2 },
    { label: '解决方案', url: '/solutions', order: 3 },
    { label: '新闻资讯', url: '/news', order: 4 },
    { label: '联系我们', url: '/contact', order: 5 },
  ];
  for (const it of footerItems) {
    await db.menuItem.create({ data: { ...it, menuId: footerMenu.id } });
  }

  // ---- Helper to create a page with blocks ----
  async function page(slug: string, title: string, opts: { isHome?: boolean; subtitle?: string; navOrder?: number; blocks: { type: any; title?: string; data?: any }[] }) {
    await db.page.deleteMany({ where: { slug } });
    const p = await db.page.create({
      data: {
        slug,
        title,
        subtitle: opts.subtitle ?? null,
        isHome: opts.isHome ?? false,
        navOrder: opts.navOrder ?? 0,
        status: 'published',
        showInNav: slug !== 'home',
      },
    });
    let order = 0;
    for (const b of opts.blocks) {
      const data = b.data ?? defaultDataFor(b.type);
      await db.block.create({
        data: {
          pageId: p.id,
          type: b.type,
          title: b.title ?? null,
          order: order++,
          data: JSON.stringify(data),
        },
      });
    }
    return p;
  }

  // ---- HOME PAGE ----
  await page('home', '首页', {
    isHome: true,
    navOrder: 0,
    blocks: [
      {
        type: 'hero',
        title: 'Hero',
        data: {
          ...defaultDataFor('hero'),
          eyebrow: '为声音而生',
          title: '为声音而生，为舞台而造',
          subtitle: '专业音响系统，深受全球80多个国家场馆、艺术家和集成商信赖。',
          primaryCta: { label: '查看产品', href: '/products' },
          secondaryCta: { label: '联系我们', href: '/contact' },
          background: IMG.heroStage,
          align: 'left',
          minHeight: 560,
        },
      },
      { type: 'marquee', title: '特性滚动', data: defaultDataFor('marquee') },
      { type: 'features', title: '为什么选择我们' },
      { type: 'stats', title: '数据见证' },
      {
        type: 'productCategories',
        title: '应用领域',
        data: {
          ...defaultDataFor('productCategories'),
          items: [
            { title: '扬声器', description: '为各类场馆与应用打造的专业扬声器。', image: IMG.lineArray, href: '/products?cat=speaker' },
            { title: '功放', description: '集成 DSP 的巡演级功放。', image: IMG.amplifier, href: '/products?cat=amplifier' },
            { title: '调音台与处理器', description: '数字调音台与信号处理器。', image: IMG.mixer, href: '/products?cat=mixer' },
            { title: '无线与话筒', description: '无线系统与话筒。', image: IMG.mic, href: '/products?cat=wireless' },
          ],
        },
      },
      {
        type: 'products',
        title: '明星产品',
        data: {
          ...defaultDataFor('products'),
          items: [
            { name: 'DA-4.800 DSP 功放', desc: '4×2000W 数字功放，带DSP与Dante', image: IMG.amplifier, featured: true, href: '' },
            { name: 'SB-218 低音炮', desc: '双18寸大功率低音炮', image: IMG.subwoofer, featured: true, href: '' },
            { name: 'VA-12 线阵列', desc: '12寸三分频高输出线阵列模块', image: IMG.lineArray, featured: true, href: '' },
          ],
        },
      },
      {
        type: 'split',
        title: '研发实力',
        data: {
          ...defaultDataFor('split'),
          title: '研发实力',
          subtitle: '50余位工程师组成的研发团队',
          body: '覆盖声学、电子、软件与结构设计，为产品线持续创新提供动力。我们的 R&D 实验室配备 Klippel 分析仪、AP 音频测试仪与混响室，对每一代产品进行全维度的声学验证。',
          image: IMG.heroStage,
          imagePosition: 'right',
          cta: { label: '了解更多', href: '/about' },
        },
      },
      { type: 'cta', title: '底部CTA' },
      { type: 'logos', title: '合作伙伴', data: { ...defaultDataFor('logos'), title: '合作伙伴', items: [
        { name: 'Partner A', image: '' },
        { name: 'Partner B', image: '' },
        { name: 'Partner C', image: '' },
        { name: 'Partner D', image: '' },
        { name: 'Partner E', image: '' },
        { name: 'Partner F', image: '' },
      ] } },
    ],
  });

  // ---- ABOUT PAGE ----
  await page('about', '关于我们', {
    navOrder: 1,
    subtitle: 'About Us',
    blocks: [
      {
        type: 'hero',
        title: 'Banner',
        data: {
          ...defaultDataFor('hero'),
          eyebrow: '关于 AudioCenter',
          title: '为声音而生，为舞台而造',
          subtitle: '专业音响系统领先制造商，致力于为全球用户提供卓越的声音体验。',
          primaryCta: { label: '联系我们', href: '/contact' },
          secondaryCta: { label: '', href: '' },
          background: '',
          align: 'center',
          minHeight: 420,
        },
      },
      { type: 'features', title: '核心优势' },
      { type: 'stats', title: '数据' },
      { type: 'split', title: '品牌故事' },
      { type: 'faq', title: '常见问题' },
      { type: 'cta', title: 'CTA' },
    ],
  });

  // ---- PRODUCTS PAGE ----
  await page('products', '产品中心', {
    navOrder: 2,
    subtitle: 'Products',
    blocks: [
      {
        type: 'hero',
        title: 'Banner',
        data: {
          ...defaultDataFor('hero'),
          eyebrow: '产品中心',
          title: '面向每一个场景的专业扩声',
          subtitle: '扬声器 · 功放 · 调音台与处理器 · 无线与话筒',
          primaryCta: { label: '在线咨询', href: '/contact' },
          secondaryCta: { label: '', href: '' },
          background: IMG.lineArray,
          align: 'center',
          minHeight: 380,
        },
      },
      {
        type: 'productCategories',
        title: '应用领域',
        data: {
          ...defaultDataFor('productCategories'),
          items: [
            { title: '扬声器', description: '为各类场馆与应用打造的专业扬声器。', image: IMG.lineArray, href: '/products?cat=speaker' },
            { title: '功放', description: '集成 DSP 的巡演级功放。', image: IMG.amplifier, href: '/products?cat=amplifier' },
            { title: '调音台与处理器', description: '数字调音台与信号处理器。', image: IMG.mixer, href: '/products?cat=mixer' },
            { title: '无线与话筒', description: '无线系统与话筒。', image: IMG.mic, href: '/products?cat=wireless' },
          ],
        },
      },
      {
        type: 'products',
        title: '明星产品',
        data: {
          ...defaultDataFor('products'),
          items: [
            { name: 'DA-4.800 DSP 功放', desc: '4×2000W 数字功放，带DSP与Dante', image: IMG.amplifier, featured: true, href: '' },
            { name: 'SB-218 低音炮', desc: '双18寸大功率低音炮', image: IMG.subwoofer, featured: true, href: '' },
            { name: 'VA-12 线阵列', desc: '12寸三分频高输出线阵列模块', image: IMG.lineArray, featured: true, href: '' },
          ],
        },
      },
      { type: 'cta', title: 'CTA' },
    ],
  });

  // ---- SOLUTIONS PAGE ----
  await page('solutions', '解决方案', {
    navOrder: 3,
    subtitle: 'Solutions',
    blocks: [
      {
        type: 'hero',
        title: 'Banner',
        data: {
          ...defaultDataFor('hero'),
          eyebrow: '解决方案',
          title: '面向场馆与应用的扩声方案',
          subtitle: '从剧院到体育场，从会议室到流动演出，为每一个场景定制声音。',
          primaryCta: { label: '获取方案', href: '/contact' },
          secondaryCta: { label: '', href: '' },
          background: '',
          align: 'center',
          minHeight: 380,
        },
      },
      {
        type: 'features',
        title: '方案领域',
        data: {
          ...defaultDataFor('features'),
          title: '应用领域',
          subtitle: '为不同场景而生的扩声方案',
          columns: 3,
          items: [
            { icon: 'theater', title: '剧院与剧场', description: '高保真主扩与线阵列方案，满足剧场级声学指标。', image: '' },
            { icon: 'users', title: '会议室与多功能厅', description: '智能化会议扩声与数字话筒系统。', image: '' },
            { icon: 'music', title: '流动演出', description: '巡演级便携系统，快速部署与拆装。', image: '' },
            { icon: 'building-2', title: '体育场馆', description: '大动态、远投递的场馆扩声系统。', image: '' },
            { icon: 'church', title: '宗教场所', description: '清晰语音与音乐兼得的扩声方案。', image: '' },
            { icon: 'graduation-cap', title: '教育与礼堂', description: '教室、报告厅与礼堂多用途扩声。', image: '' },
          ],
        },
      },
      { type: 'cta', title: 'CTA' },
    ],
  });

  // ---- NEWS PAGE ----
  await page('news', '新闻资讯', {
    navOrder: 4,
    subtitle: 'News',
    blocks: [
      {
        type: 'hero',
        title: 'Banner',
        data: {
          ...defaultDataFor('hero'),
          eyebrow: '新闻资讯',
          title: '了解 AudioCenter 最新动态',
          subtitle: '新品发布、企业新闻、展会资讯',
          primaryCta: { label: '', href: '' },
          secondaryCta: { label: '', href: '' },
          background: '',
          align: 'center',
          minHeight: 320,
        },
      },
      {
        type: 'news',
        title: '最新动态',
        data: { ...defaultDataFor('news'), title: '最新动态', limit: 6, showMore: false },
      },
    ],
  });

  // ---- CONTACT PAGE ----
  await page('contact', '联系我们', {
    navOrder: 5,
    subtitle: 'Contact',
    blocks: [
      {
        type: 'hero',
        title: 'Banner',
        data: {
          ...defaultDataFor('hero'),
          eyebrow: '联系我们',
          title: '我们期待与您合作',
          subtitle: '无论您是场馆方、集成商还是艺术家，我们都乐意为您服务。',
          primaryCta: { label: '', href: '' },
          secondaryCta: { label: '', href: '' },
          background: '',
          align: 'center',
          minHeight: 320,
        },
      },
      { type: 'contact', title: '联系信息' },
      {
        type: 'form',
        title: '在线咨询',
        data: { ...defaultDataFor('form'), title: '在线咨询', subtitle: '提交您的需求，工程师将在 24 小时内回复', formSlug: 'inquiry' },
      },
    ],
  });

  // ---- FORMS ----
  await db.form.deleteMany({});
  await db.form.create({
    data: {
      slug: 'inquiry',
      title: '在线咨询',
      description: '提交您的需求，我们会尽快联系您',
      submitLabel: '提交咨询',
      successMsg: '感谢您的咨询，我们的工程师将在 24 小时内与您联系！',
      status: 'published',
      fields: {
        create: [
          { label: '姓名', name: 'name', type: 'text', required: true, order: 0, config: JSON.stringify({ placeholder: '请输入您的姓名' }) },
          { label: '公司', name: 'company', type: 'text', required: false, order: 1, config: JSON.stringify({ placeholder: '请输入公司名称' }) },
          { label: '电话', name: 'phone', type: 'phone', required: true, order: 2, config: JSON.stringify({ placeholder: '请输入手机号码' }) },
          { label: '邮箱', name: 'email', type: 'email', required: false, order: 3, config: JSON.stringify({ placeholder: '请输入电子邮箱' }) },
          { label: '应用场景', name: 'scene', type: 'select', required: false, order: 4, config: JSON.stringify({ options: ['剧院', '会议室', '流动演出', '体育场馆', '其他'] }) },
          { label: '需求描述', name: 'message', type: 'textarea', required: false, order: 5, config: JSON.stringify({ placeholder: '请描述您的场馆、听众规模与预算', rows: 4 }) },
          { label: '同意接收跟进', name: 'consent', type: 'consent', required: false, order: 6, config: JSON.stringify({ text: '我同意 AudioCenter 工程师与我联系' }) },
        ],
      },
    },
  });

  await db.form.create({
    data: {
      slug: 'contact',
      title: '快速联系',
      description: '简单留下您的联系方式',
      submitLabel: '提交',
      successMsg: '收到，我们会尽快与您联系！',
      status: 'published',
      fields: {
        create: [
          { label: '姓名', name: 'name', type: 'text', required: true, order: 0, config: JSON.stringify({ placeholder: '您的姓名' }) },
          { label: '电话', name: 'phone', type: 'phone', required: true, order: 1, config: JSON.stringify({ placeholder: '您的电话' }) },
          { label: '留言', name: 'message', type: 'textarea', required: false, order: 2, config: JSON.stringify({ placeholder: '简短留言', rows: 3 }) },
        ],
      },
    },
  });

  // ---- News articles ----
  await db.newsArticle.deleteMany({});
  const newsSeed = [
    { slug: 'getshow-2025', title: 'GETSHOW 2025 广州展圆满落幕', excerpt: 'AudioCenter 携全新 VA 系列线阵列亮相 GETSHOW 2025，受到国内外集成商热烈反响。', category: '展会资讯', body: 'GETSHOW 2025（广州国际演艺设备及智能演出展）于 5 月 8 日至 11 日在广州举行。AudioCenter 展位现场展示了全新 VA 系列线阵列、DA-4.800 DSP 功放及 SU-9100 系列数字会议系统。展会期间，来自国内外剧院、场馆及集成商代表到访展位，现场气氛热烈。' },
    { slug: 'va-series-launch', title: 'VA 系列线阵列全球首发', excerpt: '面向中大型场馆的 12 寸三分频高输出线阵列 VA-12 正式发布。', category: '新品发布', body: 'VA-12 是 AudioCenter 历时三年研发的全新旗舰线阵列模块，采用 12 寸三分频设计，单只最大声压级可达 145dB。配套 flybar 与吊挂件满足快速部署需求。' },
    { slug: 'stadium-case-2024', title: '某市体育场扩声系统交付', excerpt: 'AudioCenter 为某市体育场提供全套扩声系统，覆盖 5 万座席。', category: '案例分享', body: '项目采用 24 只 VA-12 线阵列作主扩，配套 SB-218 低音炮与 DA-4.800 DSP 功放，全场 SPL 均匀度 ±3dB，达到 J 高标准。' },
    { slug: 'rd-lab-2024', title: '声学实验室升级 Klippel 分析仪', excerpt: 'R&D 实验室完成新一轮仪器升级，进一步提升研发能力。', category: '企业新闻', body: '本次升级的 Klippel R&D 系统能够对扬声器进行全维度的非线性、共振与指向性分析，为产品研发提供更精确的数据支撑。' },
    { slug: 'global-partner-2024', title: '与欧洲分销商签订战略合作', excerpt: 'AudioCenter 正式签约欧洲顶级分销商，加速全球布局。', category: '企业新闻', body: '本次合作将使 AudioCenter 产品覆盖 12 个新增欧洲国家，进一步深化全球化服务网络。' },
    { slug: 'training-2024', title: '工程师技术培训在京举办', excerpt: '面向集成商的系统调试与方案设计培训会圆满结束。', category: '企业新闻', body: '本次培训涵盖系统设计、DSP 调试与现场声学测量，参与工程师获得 AudioCenter 认证证书。' },
  ];
  for (const n of newsSeed) {
    await db.newsArticle.create({
      data: {
        slug: n.slug,
        title: n.title,
        excerpt: n.excerpt,
        body: n.body,
        category: n.category,
        cover: '',
        status: 'published',
        publishedAt: new Date(2025, 4, 7, 10, 0, 0),
      },
    });
  }

  // ---- Image library（把内置品牌图注册到 Image 表） ──────
  await db.image.deleteMany({});
  const imageSeed = [
    { url: IMG.heroStage,     filename: 'hero-stage.png',           alt: '舞台演出场景',     tags: '品牌,首页' },
    { url: IMG.amplifier,     filename: 'product-amplifier.png',     alt: 'DA-4.800 DSP 功放',  tags: '产品,功放' },
    { url: IMG.subwoofer,     filename: 'product-subwoofer.png',     alt: 'SB-218 低音炮',     tags: '产品,低音炮' },
    { url: IMG.lineArray,     filename: 'product-linearray.png',     alt: 'VA-12 线阵列',       tags: '产品,线阵列' },
    { url: IMG.mixer,         filename: 'product-mixer.png',         alt: '数字调音台',         tags: '产品,调音台' },
    { url: IMG.mic,           filename: 'product-mic.png',           alt: '无线话筒',           tags: '产品,话筒' },
  ];
  for (const img of imageSeed) {
    await db.image.create({
      data: {
        url: img.url,
        filename: img.filename,
        alt: img.alt,
        tags: img.tags,
        source: 'upload',
        mimeType: 'image/png',
      },
    });
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
