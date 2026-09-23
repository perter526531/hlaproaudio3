// Wire generated images into the home page blocks.
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

const IMG = {
  heroStage: '/uploads/gen/hero-stage.png',
  amplifier: '/uploads/gen/product-amplifier.png',
  subwoofer: '/uploads/gen/product-subwoofer.png',
  lineArray: '/uploads/gen/product-linearray.png',
};

async function main() {
  const home = await db.page.findFirst({ where: { slug: 'home' } });
  if (!home) { console.error('no home page'); process.exit(1); }
  const blocks = await db.block.findMany({ where: { pageId: home.id }, orderBy: { order: 'asc' } });
  for (const b of blocks) {
    const d = JSON.parse(b.data);
    let changed = false;
    if (b.type === 'hero') { d.background = IMG.heroStage; d.eyebrow = '为声音而生'; d.title = '为声音而生，为舞台而造'; d.subtitle = '专业音响系统，深受全球80多个国家场馆、艺术家和集成商信赖。'; changed = true; }
    if (b.type === 'products') {
      d.items[0].image = IMG.amplifier;
      d.items[1].image = IMG.subwoofer;
      d.items[2].image = IMG.lineArray;
      changed = true;
    }
    if (b.type === 'split') { d.image = IMG.heroStage; changed = true; }
    if (b.type === 'productCategories') {
      d.items[0].image = IMG.lineArray;
      d.items[1].image = IMG.amplifier;
      d.items[2].image = IMG.lineArray;
      d.items[3].image = IMG.subwoofer;
      changed = true;
    }
    if (changed) {
      await db.block.update({ where: { id: b.id }, data: { data: JSON.stringify(d) } });
      console.log('updated', b.type, b.id);
    }
  }
  console.log('done');
}
main().finally(() => db.$disconnect());
