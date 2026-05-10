// ============================================
// OTIMIZADOR DE IMAGENS — sharp + webp
// ============================================
// Lê tudo de public/assets/, gera versões .webp
// otimizadas com tamanho máximo e qualidade reduzida.
//
// Uso: npm run optimize
// ============================================

import { readdir, stat, mkdir } from 'node:fs/promises';
import { join, parse } from 'node:path';
import sharp from 'sharp';

const ASSETS_DIR = new URL('../public/assets/', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');

// Perfis de otimização por padrão de nome
// (max width em px, quality 0-100 webp)
const PROFILES = [
  // Foto principal do Jackson — retrato vertical em estúdio
  { match: /foto.*jackson/i,        maxWidth: 800,  quality: 78 },
  // Van da Jackson's Painting — paisagem
  { match: /jacksons-painting-van/i, maxWidth: 1200, quality: 78 },
  // Screenshots de WhatsApp (testemunhos) — texto precisa ficar legível
  { match: /^feedback-/i,            maxWidth: 700,  quality: 80 },
  // Default — tudo que não casar
  { match: /.*/,                     maxWidth: 1200, quality: 78 }
];

const SOURCE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function pickProfile(filename) {
  return PROFILES.find(p => p.match.test(filename));
}

function fmtKB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function optimize() {
  console.log(`\n📁 Otimizando imagens em: ${ASSETS_DIR}\n`);

  const entries = await readdir(ASSETS_DIR);
  const candidates = entries.filter(name => {
    const ext = parse(name).ext.toLowerCase();
    return SOURCE_EXTS.has(ext) && ext !== '.webp';
  });

  if (candidates.length === 0) {
    console.log('Nada pra otimizar (nenhum jpg/jpeg/png encontrado).');
    return;
  }

  let totalIn = 0, totalOut = 0;

  for (const name of candidates) {
    const inPath = join(ASSETS_DIR, name);
    const { name: base } = parse(name);
    const outPath = join(ASSETS_DIR, `${base}.webp`);

    const profile = pickProfile(name);
    const inStat = await stat(inPath);
    totalIn += inStat.size;

    try {
      const meta = await sharp(inPath).metadata();
      const needsResize = meta.width && meta.width > profile.maxWidth;

      let pipeline = sharp(inPath).rotate(); // respeita EXIF
      if (needsResize) {
        pipeline = pipeline.resize({ width: profile.maxWidth, withoutEnlargement: true });
      }
      pipeline = pipeline.webp({ quality: profile.quality, effort: 5 });

      await pipeline.toFile(outPath);

      const outStat = await stat(outPath);
      totalOut += outStat.size;

      const reduction = (100 - (outStat.size / inStat.size) * 100).toFixed(0);
      const dims = needsResize ? `${meta.width}px → ${profile.maxWidth}px` : `${meta.width}px (mantido)`;
      console.log(`✓ ${name}`);
      console.log(`  ${fmtKB(inStat.size)} → ${fmtKB(outStat.size)} (-${reduction}%) · ${dims} · q${profile.quality}\n`);
    } catch (err) {
      console.error(`✗ ${name} — erro: ${err.message}\n`);
    }
  }

  console.log('━'.repeat(50));
  console.log(`Total entrada: ${fmtKB(totalIn)}`);
  console.log(`Total saída:   ${fmtKB(totalOut)}`);
  console.log(`Economia:      ${(100 - (totalOut / totalIn) * 100).toFixed(0)}%\n`);
  console.log('Pronto. Atualize as referências no HTML pra apontarem .webp');
}

optimize().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
