import { renderToPng } from '../src/render/render-server';
import { PosterLayout } from '../src/components/PosterLayout';
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const sampleData = {
  title: '赛博玄学馆 · 掌相解读',
  sections: [
    {
      heading: '性格特质',
      content:
        '你的智慧线深长清晰，表明你具有敏锐的洞察力和丰富的想象力。感情线走向平稳，显示出你在感情中理性而深情。',
    },
    {
      heading: '事业运势',
      content:
        '命运线从掌根直达中指根部，事业运势强劲。近期将迎来重要的转折点，把握机会可事半功倍。',
    },
    {
      heading: '健康提示',
      content: '生命线弧度饱满，精力充沛。注意劳逸结合，保持良好的作息习惯。',
    },
  ],
  footer: '赛博玄学馆 · CyberOracle',
};

async function main() {
  console.log('Generating poster preview...');

  const element = PosterLayout(sampleData);

  const buffer = await renderToPng(element as any, { width: 1080 });

  const outputPath = resolve(__dirname, '../preview-output.png');
  writeFileSync(outputPath, buffer);

  console.log(`Poster saved to: ${outputPath}`);
  console.log(`Size: ${(buffer.length / 1024).toFixed(1)} KB`);
}

main().catch((err) => {
  console.error('Failed to generate poster:', err);
  process.exit(1);
});
