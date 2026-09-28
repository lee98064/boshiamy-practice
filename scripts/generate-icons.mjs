import sharp from 'sharp'
import { readFile, mkdir } from 'node:fs/promises'
const icon = await readFile(new URL('../public/favicon.svg', import.meta.url))
await mkdir(new URL('../public/icons/', import.meta.url), { recursive: true })
for (const size of [192, 512, 180]) {
  const name = size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`
  await sharp(icon)
    .resize(size, size)
    .png()
    .toFile(new URL(`../public/icons/${name}`, import.meta.url).pathname)
}
// An opaque full-bleed background with the symbol inside the maskable safe zone.
await sharp({ create: { width: 512, height: 512, channels: 4, background: '#3659e3' } })
  .composite([{ input: await sharp(icon).resize(390, 390).png().toBuffer(), gravity: 'center' }])
  .png()
  .toFile(new URL('../public/icons/maskable-512.png', import.meta.url).pathname)
