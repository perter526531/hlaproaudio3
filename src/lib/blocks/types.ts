// Content block type definitions — single source of truth for public renderer + admin editor.
// Each block type has: id, label (admin), defaultData(), and is rendered on the public side
// by a corresponding component in src/components/blocks/*.

export type BlockType =
  | 'hero'
  | 'features'
  | 'stats'
  | 'productCategories'
  | 'products'
  | 'news'
  | 'cta'
  | 'text'
  | 'image'
  | 'gallery'
  | 'split'
  | 'contact'
  | 'form'
  | 'faq'
  | 'marquee'
  | 'logos';

export interface BlockTypeMeta {
  id: BlockType;
  label: string;
  description: string;
  fields: BlockField[]; // admin editor fields
}

export type BlockField =
  | { kind: 'text'; key: string; label: string; placeholder?: string; multiline?: boolean; help?: string }
  | { kind: 'number'; key: string; label: string; help?: string }
  | { kind: 'switch'; key: string; label: string; help?: string }
  | { kind: 'select'; key: string; label: string; options: { value: string; label: string }[] }
  | { kind: 'image'; key: string; label: string; help?: string }
  | { kind: 'list'; key: string; label: string; itemLabel: string; itemFields: BlockField[]; help?: string };

// ---------------------------------------------------------------------------
// Default data per block type. Must be a plain JSON-serializable object.
// ---------------------------------------------------------------------------

export const HeroData = {
  eyebrow: '为声音而生',
  title: '为声音而生，为舞台而造',
  subtitle:
    '专业音响系统，深受全球80多个国家场馆、艺术家和集成商信赖。',
  primaryCta: { label: '查看产品', href: '/products' },
  secondaryCta: { label: '联系我们', href: '/contact' },
  background: '',
  align: 'left' as 'left' | 'center',
  minHeight: 560,
};

export const FeaturesData = {
  title: '为什么选择 AudioCenter',
  subtitle: '从研发到服务，全链路为专业声音而生',
  columns: 3,
  items: [
    { icon: 'flask-conical', title: '研发创新', description: '内部研发团队，持续推动声学与电子技术创新。', image: '' },
    { icon: 'factory', title: '精密制造', description: '30,000平方米生产基地，100%出厂老化测试与Klippel测量。', image: '' },
    { icon: 'globe', title: '全球服务', description: '服务网络覆盖80+国家，快速响应。', image: '' },
  ],
};

export const StatsData = {
  title: '数据见证',
  items: [
    { value: '20+', label: '年声学创新' },
    { value: '80+', label: '服务国家' },
    { value: '50+', label: '研发工程师' },
    { value: '30,000m²', label: '生产基地' },
  ],
  background: 'dark',
};

export const ProductCategoriesData = {
  title: '应用领域',
  subtitle: '面向不同场景的专业扩声产品矩阵',
  items: [
    { title: '扬声器', description: '为各类场馆与应用打造的专业扬声器。', image: '', href: '/products?cat=speaker' },
    { title: '功放', description: '集成 DSP 的巡演级功放。', image: '', href: '/products?cat=amplifier' },
    { title: '调音台与处理器', description: '数字调音台与信号处理器。', image: '', href: '/products?cat=mixer' },
    { title: '无线与话筒', description: '无线系统与话筒。', image: '', href: '/products?cat=wireless' },
  ],
};

export const ProductsData = {
  title: '明星产品',
  subtitle: '舞台与固定安装信赖之选',
  badgeLabel: '推荐',
  columns: 3,
  items: [
    { name: 'DA-4.800 DSP 功放', desc: '4×2000W 数字功放，带DSP与Dante', image: '', featured: true, href: '' },
    { name: 'SB-218 低音炮', desc: '双18寸大功率低音炮', image: '', featured: true, href: '' },
    { name: 'VA-12 线阵列', desc: '12寸三分频高输出线阵列模块', image: '', featured: true, href: '' },
  ],
};

export const NewsData = {
  title: '新闻资讯',
  subtitle: '了解 AudioCenter 最新动态',
  limit: 3,
  showMore: true,
  moreLabel: '查看全部',
  moreHref: '/news',
};

export const CTAData = {
  title: '让我们一起打造下一套声音系统',
  subtitle:
    '告诉我们您的场馆、听众和预算，我们会为您推荐最合适的方案。',
  primaryCta: { label: '联系我们', href: '/contact' },
  secondaryCta: { label: '查看产品', href: '/products' },
  background: 'gradient',
  image: '',
};

export const TextData = {
  title: '标题',
  body: '在这里输入正文内容。支持多段落。',
  align: 'left' as 'left' | 'center',
};

export const ImageBlockData = {
  src: '',
  alt: '',
  caption: '',
  width: 'full' as 'full' | 'content' | 'narrow',
};

export const GalleryData = {
  title: '画廊',
  columns: 4,
  images: [{ src: '', alt: '', caption: '' }],
};

export const SplitData = {
  title: '研发实力',
  subtitle: '50余位工程师组成的研发团队',
  body:
    '覆盖声学、电子、软件与结构设计，为产品线持续创新提供动力。',
  image: '',
  imagePosition: 'right' as 'left' | 'right',
  cta: { label: '了解更多', href: '/about' },
};

export const ContactData = {
  title: '联系我们',
  phone: '400-888-0000',
  email: 'info@audiocenter.example',
  address: '广州市高新技术开发区音响大道88号',
  hours: '周一至周五 9:00 - 18:00',
  wechat: 'AudioCenter_Official',
  whatsapp: '+86 138 0000 0000',
  mapEmbed: '',
};

export const FormBlockData = {
  title: '在线咨询',
  subtitle: '提交您的需求，工程师将在 24 小时内回复',
  formSlug: 'inquiry',
};

export const FaqData = {
  title: '常见问题',
  items: [
    { q: '产品是否提供保修？', a: '所有 AudioCenter 产品提供 2 年原厂保修。' },
    { q: '是否支持定制方案？', a: '可按场馆规模与预算提供定制化扩声方案。' },
  ],
};

export const MarqueeData = {
  items: [' TOUR-GRADE ', ' Dante-Ready ', ' DSP-Integrated ', ' 80+ Countries '],
  speed: 'normal' as 'slow' | 'normal' | 'fast',
};

export const LogosData = {
  title: '合作伙伴',
  items: [{ name: 'Partner', image: '' }],
};

// ---------------------------------------------------------------------------
// Registry: list of block type metadata used by the admin editor.
// ---------------------------------------------------------------------------

export const BLOCK_TYPES: BlockTypeMeta[] = [
  {
    id: 'hero',
    label: '主视觉横幅',
    description: '页面顶部的大幅横幅，含标题、副标题与按钮',
    fields: [
      { kind: 'text', key: 'eyebrow', label: '小标题' },
      { kind: 'text', key: 'title', label: '主标题', multiline: true },
      { kind: 'text', key: 'subtitle', label: '副标题', multiline: true },
      { kind: 'text', key: 'primaryCta.label', label: '主按钮文字' },
      { kind: 'text', key: 'primaryCta.href', label: '主按钮链接' },
      { kind: 'text', key: 'secondaryCta.label', label: '次按钮文字' },
      { kind: 'text', key: 'secondaryCta.href', label: '次按钮链接' },
      { kind: 'image', key: 'background', label: '背景图（可选）' },
      { kind: 'select', key: 'align', label: '对齐', options: [{ value: 'left', label: '左对齐' }, { value: 'center', label: '居中' }] },
      { kind: 'number', key: 'minHeight', label: '最小高度(px)' },
    ],
  },
  {
    id: 'features',
    label: '特性卡片',
    description: '多列特性介绍卡片',
    fields: [
      { kind: 'text', key: 'title', label: '标题' },
      { kind: 'text', key: 'subtitle', label: '副标题' },
      { kind: 'number', key: 'columns', label: '列数' },
      {
        kind: 'list', key: 'items', label: '特性项', itemLabel: 'item',
        itemFields: [
          { kind: 'text', key: 'icon', label: '图标名 (lucide)', help: '如 flask-conical / factory / globe' },
          { kind: 'text', key: 'title', label: '标题' },
          { kind: 'text', key: 'description', label: '描述', multiline: true },
          { kind: 'image', key: 'image', label: '图片（可选，覆盖图标）' },
        ],
      },
    ],
  },
  {
    id: 'stats',
    label: '数据见证',
    description: '关键数字指标展示',
    fields: [
      { kind: 'text', key: 'title', label: '标题' },
      { kind: 'select', key: 'background', label: '背景', options: [{ value: 'dark', label: '深色' }, { value: 'light', label: '浅色' }, { value: 'gradient', label: '渐变' }] },
      {
        kind: 'list', key: 'items', label: '指标项', itemLabel: 'item',
        itemFields: [
          { kind: 'text', key: 'value', label: '数值' },
          { kind: 'text', key: 'label', label: '说明' },
        ],
      },
    ],
  },
  {
    id: 'productCategories',
    label: '产品类目',
    description: '产品应用领域分类网格',
    fields: [
      { kind: 'text', key: 'title', label: '标题' },
      { kind: 'text', key: 'subtitle', label: '副标题' },
      {
        kind: 'list', key: 'items', label: '类目', itemLabel: 'item',
        itemFields: [
          { kind: 'text', key: 'title', label: '标题' },
          { kind: 'text', key: 'description', label: '描述', multiline: true },
          { kind: 'text', key: 'href', label: '链接' },
          { kind: 'image', key: 'image', label: '图片' },
        ],
      },
    ],
  },
  {
    id: 'products',
    label: '产品卡片',
    description: '明星产品展示卡片',
    fields: [
      { kind: 'text', key: 'title', label: '标题' },
      { kind: 'text', key: 'subtitle', label: '副标题' },
      { kind: 'text', key: 'badgeLabel', label: '推荐徽标文字' },
      { kind: 'number', key: 'columns', label: '列数' },
      {
        kind: 'list', key: 'items', label: '产品', itemLabel: 'item',
        itemFields: [
          { kind: 'text', key: 'name', label: '名称' },
          { kind: 'text', key: 'desc', label: '描述', multiline: true },
          { kind: 'image', key: 'image', label: '图片' },
          { kind: 'switch', key: 'featured', label: '推荐' },
          { kind: 'text', key: 'href', label: '详情链接' },
        ],
      },
    ],
  },
  {
    id: 'news',
    label: '新闻列表',
    description: '动态从新闻页拉取最新条目',
    fields: [
      { kind: 'text', key: 'title', label: '标题' },
      { kind: 'text', key: 'subtitle', label: '副标题' },
      { kind: 'number', key: 'limit', label: '显示条数' },
      { kind: 'switch', key: 'showMore', label: '显示“查看更多”' },
      { kind: 'text', key: 'moreLabel', label: '按钮文字' },
      { kind: 'text', key: 'moreHref', label: '按钮链接' },
    ],
  },
  {
    id: 'cta',
    label: '行动召唤',
    description: '突出引导用户行动的横条',
    fields: [
      { kind: 'text', key: 'title', label: '标题' },
      { kind: 'text', key: 'subtitle', label: '副标题', multiline: true },
      { kind: 'text', key: 'primaryCta.label', label: '主按钮文字' },
      { kind: 'text', key: 'primaryCta.href', label: '主按钮链接' },
      { kind: 'text', key: 'secondaryCta.label', label: '次按钮文字' },
      { kind: 'text', key: 'secondaryCta.href', label: '次按钮链接' },
      { kind: 'select', key: 'background', label: '背景', options: [{ value: 'gradient', label: '渐变' }, { value: 'dark', label: '深色' }, { value: 'light', label: '浅色' }] },
      { kind: 'image', key: 'image', label: '背景图（可选）' },
    ],
  },
  {
    id: 'text',
    label: '富文本段落',
    description: '标题+正文段落',
    fields: [
      { kind: 'text', key: 'title', label: '标题' },
      { kind: 'text', key: 'body', label: '正文', multiline: true },
      { kind: 'select', key: 'align', label: '对齐', options: [{ value: 'left', label: '左对齐' }, { value: 'center', label: '居中' }] },
    ],
  },
  {
    id: 'image',
    label: '单图',
    description: '单张图片，含说明',
    fields: [
      { kind: 'image', key: 'src', label: '图片' },
      { kind: 'text', key: 'alt', label: '替代文字' },
      { kind: 'text', key: 'caption', label: '图注' },
      { kind: 'select', key: 'width', label: '宽度', options: [{ value: 'full', label: '通栏' }, { value: 'content', label: '内容宽度' }, { value: 'narrow', label: '窄' }] },
    ],
  },
  {
    id: 'gallery',
    label: '图片画廊',
    description: '多张图片网格',
    fields: [
      { kind: 'text', key: 'title', label: '标题' },
      { kind: 'number', key: 'columns', label: '列数' },
      {
        kind: 'list', key: 'images', label: '图片', itemLabel: 'image',
        itemFields: [
          { kind: 'image', key: 'src', label: '图片' },
          { kind: 'text', key: 'alt', label: '替代文字' },
          { kind: 'text', key: 'caption', label: '图注' },
        ],
      },
    ],
  },
  {
    id: 'split',
    label: '图文左右分栏',
    description: '左右图文对照',
    fields: [
      { kind: 'text', key: 'title', label: '标题' },
      { kind: 'text', key: 'subtitle', label: '副标题' },
      { kind: 'text', key: 'body', label: '正文', multiline: true },
      { kind: 'image', key: 'image', label: '图片' },
      { kind: 'select', key: 'imagePosition', label: '图片位置', options: [{ value: 'left', label: '左侧' }, { value: 'right', label: '右侧' }] },
      { kind: 'text', key: 'cta.label', label: '按钮文字' },
      { kind: 'text', key: 'cta.href', label: '按钮链接' },
    ],
  },
  {
    id: 'contact',
    label: '联系信息',
    description: '电话/邮箱/地址等联系卡片',
    fields: [
      { kind: 'text', key: 'title', label: '标题' },
      { kind: 'text', key: 'phone', label: '电话' },
      { kind: 'text', key: 'email', label: '邮箱' },
      { kind: 'text', key: 'address', label: '地址', multiline: true },
      { kind: 'text', key: 'hours', label: '工作时间' },
      { kind: 'text', key: 'wechat', label: '微信' },
      { kind: 'text', key: 'whatsapp', label: 'WhatsApp' },
      { kind: 'text', key: 'mapEmbed', label: '地图嵌入代码（可选）', multiline: true },
    ],
  },
  {
    id: 'form',
    label: '表单',
    description: '嵌入一个已创建的表单',
    fields: [
      { kind: 'text', key: 'title', label: '标题' },
      { kind: 'text', key: 'subtitle', label: '副标题' },
      { kind: 'text', key: 'formSlug', label: '表单 slug', help: '需在“表单管理”中先创建，如 inquiry / contact' },
    ],
  },
  {
    id: 'faq',
    label: '常见问题',
    description: '可折叠问答列表',
    fields: [
      { kind: 'text', key: 'title', label: '标题' },
      {
        kind: 'list', key: 'items', label: '问答', itemLabel: 'item',
        itemFields: [
          { kind: 'text', key: 'q', label: '问题' },
          { kind: 'text', key: 'a', label: '答案', multiline: true },
        ],
      },
    ],
  },
  {
    id: 'marquee',
    label: '滚动横幅',
    description: '横向滚动文字条',
    fields: [
      {
        kind: 'list', key: 'items', label: '词条', itemLabel: 'item',
        itemFields: [{ kind: 'text', key: 'text', label: '文字' }],
      },
      { kind: 'select', key: 'speed', label: '速度', options: [{ value: 'slow', label: '慢' }, { value: 'normal', label: '正常' }, { value: 'fast', label: '快' }] },
    ],
  },
  {
    id: 'logos',
    label: '合作伙伴 Logo',
    description: '客户/伙伴 Logo 列表',
    fields: [
      { kind: 'text', key: 'title', label: '标题' },
      {
        kind: 'list', key: 'items', label: 'Logo', itemLabel: 'item',
        itemFields: [
          { kind: 'text', key: 'name', label: '名称' },
          { kind: 'image', key: 'image', label: 'Logo' },
        ],
      },
    ],
  },
];

export function defaultDataFor(type: BlockType): Record<string, any> {
  switch (type) {
    case 'hero': return JSON.parse(JSON.stringify(HeroData));
    case 'features': return JSON.parse(JSON.stringify(FeaturesData));
    case 'stats': return JSON.parse(JSON.stringify(StatsData));
    case 'productCategories': return JSON.parse(JSON.stringify(ProductCategoriesData));
    case 'products': return JSON.parse(JSON.stringify(ProductsData));
    case 'news': return JSON.parse(JSON.stringify(NewsData));
    case 'cta': return JSON.parse(JSON.stringify(CTAData));
    case 'text': return JSON.parse(JSON.stringify(TextData));
    case 'image': return JSON.parse(JSON.stringify(ImageBlockData));
    case 'gallery': return JSON.parse(JSON.stringify(GalleryData));
    case 'split': return JSON.parse(JSON.stringify(SplitData));
    case 'contact': return JSON.parse(JSON.stringify(ContactData));
    case 'form': return JSON.parse(JSON.stringify(FormBlockData));
    case 'faq': return JSON.parse(JSON.stringify(FaqData));
    case 'marquee': return JSON.parse(JSON.stringify(MarqueeData));
    case 'logos': return JSON.parse(JSON.stringify(LogosData));
    default: return {};
  }
}

export function getBlockTypeMeta(type: string): BlockTypeMeta | undefined {
  return BLOCK_TYPES.find((b) => b.id === type);
}
