const fs = require('fs/promises');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads');

async function downloadPhoto(url, targetFilename) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`⚠️ Failed to download ${url}: ${response.status} ${response.statusText}`);
      return false;
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const targetPath = path.join(UPLOAD_DIR, targetFilename);
    await fs.writeFile(targetPath, buffer);
    return true;
  } catch (error) {
    console.error(`❌ Error downloading ${url}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔄 Starting Supabase photo localization to local public/uploads...');

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const itemsWithSupabasePhotos = await prisma.item.findMany({
    where: {
      photoUrl: {
        contains: 'supabase.co',
      },
    },
  });

  console.log(`📸 Found ${itemsWithSupabasePhotos.length} items with Supabase photos.`);

  let downloadedCount = 0;
  let updatedCount = 0;

  for (const item of itemsWithSupabasePhotos) {
    if (!item.photoUrl) continue;

    const originalUrl = item.photoUrl;
    const urlParts = originalUrl.split('/');
    const originalFilename = urlParts[urlParts.length - 1].split('?')[0];
    const localFilename = originalFilename || `item-${item.id}-${Date.now()}.jpg`;

    console.log(`⬇️ Downloading photo for Item #${item.id} (${item.title}): ${localFilename}...`);
    const success = await downloadPhoto(originalUrl, localFilename);

    if (success) {
      downloadedCount++;
      const localUrl = `/uploads/${localFilename}`;

      await prisma.item.update({
        where: { id: item.id },
        data: { photoUrl: localUrl },
      });

      updatedCount++;
      console.log(`✅ Item #${item.id} photo localized to: ${localUrl}`);
    }
  }

  console.log('\n==========================================');
  console.log(`🎉 Photo localization complete!`);
  console.log(`📥 Downloaded: ${downloadedCount}`);
  console.log(`🗄️ Database records updated: ${updatedCount}`);
  console.log('==========================================');
}

main()
  .catch((e) => {
    console.error('Fatal error during photo migration:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
