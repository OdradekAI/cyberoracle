import type { z } from 'zod';
import type {
  PalmReadingResultSchema,
  FaceReadingResultSchema,
  DailyFortuneResultSchema,
} from '../schemas';

const palmFallback: z.infer<typeof PalmReadingResultSchema> = {
  meta: {
    title: '手相解读指南',
    subtitle: '今天的星象有点遮蔽，先收下这段轻柔的话',
  },
  overview: {
    heading: '暂时的遮蔽',
    body: '今天的能量场略有遮蔽，星辰建议你先放下手中事物，深呼吸三次，再回来与自己对话。如果方便，请重新拍一张光线好一点的照片，让我看得更清楚一些。',
  },
  mainLines: [
    {
      name: '心',
      icon: 'heart',
      body: '心是最先要听的声音。今天它如果说累了，那就是真的累了。其它都可以晚一点。',
    },
    {
      name: '脑',
      icon: 'brain',
      body: '想得多没关系，但今天先不做长期决定。把它们写在纸上，明天再看会更清楚。',
    },
    { name: '身', icon: 'leaf', body: '身体是最准的占卜师。今天它说要慢，那就慢一点。' },
  ],
  auxiliary: [
    {
      icon: 'signpost',
      label: '方向感今日略弱',
      body: '不必急着确定下一步。模糊本身有时也是一种状态，让它自己沉淀就好。',
    },
    {
      icon: 'wave',
      label: '能量正在回升',
      body: '不是每一次都需要看清全貌。有时候，先走一小步就够了。',
    },
  ],
  temperament: {
    heading: '今日气质',
    body: '今天你适合做轻量的事——整理桌面、给一杯水、写两句话。让节奏慢下来，能量自然会回来。',
  },
  summary: {
    heading: '综合提醒',
    body: '这是一份临时的"心境速写"。如果你愿意，重新上传一张更清晰的照片，我会再看一次。',
    illustration: 'cloud',
  },
  disclaimer: {
    label: '阅读提示',
    body: '本次解读为兜底文案。完整解读需要清晰的照片，建议在自然光下重新拍摄。',
  },
};

const faceFallback: z.infer<typeof FaceReadingResultSchema> = {
  meta: {
    title: '面相解读指南',
    subtitle: '今天的星象有点遮蔽，先收下这段轻柔的话',
  },
  overview: {
    heading: '暂时的遮蔽',
    body: '今天的能量场略有遮蔽，星辰建议你先放下手中事物，深呼吸三次，再回来与自己对话。如果方便，请重新拍一张光线好一点的照片，让我看得更清楚一些。',
  },
  mainLines: [
    { name: '眉眼', icon: 'eye', body: '眼神里藏着今天的节奏。如果觉得模糊，先不急着看清。' },
    { name: '鼻子', icon: 'nose', body: '呼吸是今天最好的占卜。深吸一口气，慢一点再决定。' },
    { name: '嘴部', icon: 'mouth', body: '嘴角的弧度不必勉强。今天适合少说多听，给自己留点安静。' },
  ],
  auxiliary: [
    {
      icon: 'signpost',
      label: '今日能量略低',
      body: '不必急着确定方向。模糊本身也是一种状态，让它自己沉淀。',
    },
    {
      icon: 'wave',
      label: '能量正在回升',
      body: '不是每一次都需要看清全貌。有时候，先走一小步就够了。',
    },
  ],
  temperament: {
    heading: '今日气质',
    body: '今天你适合做轻量的事——整理桌面、喝一杯水、写两句话。让节奏慢下来，能量自然会回来。',
  },
  summary: {
    heading: '综合提醒',
    body: '这是一份临时的"心境速写"。如果你愿意，重新上传一张更清晰的照片，我会再看一次。',
    illustration: 'cloud',
  },
  disclaimer: {
    label: '阅读提示',
    body: '本次解读为兜底文案。完整解读需要清晰的照片，建议在自然光下重新拍摄。',
  },
};

const dailyFallback: z.infer<typeof DailyFortuneResultSchema> = {
  title: '今日心境速写',
  date: new Date()
    .toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
    .replace(/\//g, '年')
    .replace(/月/, '月')
    .replace(/日/, '日'),
  ganzhi: '',
  solarTerm: '',
  ratings: { overall: 3, work: 3, relationship: 4, creative: 4, rest: 4 },
  lucky: { color: '雾灰', direction: '东北', number: 5, moment: '午后三点前后' },
  advice: {
    do: '适合做轻量的事——整理桌面、喝一杯水、写两句话。让节奏慢下来。',
    avoid: '不必急着做大的决定。今天的状态更适合观察和感受，而非行动。',
  },
  oneLine: '今天的星辰有点遮蔽——不是看不见，是让你先闭上眼，感受一下风的方向。',
};

const companionLines: Record<string, string[]> = {
  morning: [
    '早上好，今天交给我们一起看吧。',
    '你来了——今天的光线我先看了一眼。',
    '早安，桌上的水杯还没动呢。',
    '今天比昨天亮了一点，你看出来了吗？',
    '我醒得比你早，给你留了好心情。',
  ],
  idle: [
    '我在的。',
    '桌角那杯水比刚才少了一些。',
    '今天的光线很好，我多看了一会儿。',
    '嘘，我没在偷看你，只是路过。',
    '时间走得比想象中快。',
  ],
  tap: [
    '你怎么戳我脸……',
    '又来了——你今天点我第三次了。',
    '嗯？想说什么？',
    '这样会让我分心的。',
    '我以为你不会再来了。',
  ],
  celebrate: ['看完了，希望你喜欢。', '这一份是写给今天的你的。', '我尽力了，希望对你有用。'],
  sad: ['这次我没看清，再来一张？', '让我再试一次吧，刚才有点恍惚。', '抱歉——是我今天状态不太好。'],
};

export function getPalmFallback(): z.infer<typeof PalmReadingResultSchema> {
  return palmFallback;
}

export function getFaceFallback(): z.infer<typeof FaceReadingResultSchema> {
  return faceFallback;
}

export function getDailyFallback(): z.infer<typeof DailyFortuneResultSchema> {
  return dailyFallback;
}

export function getCompanionLine(
  category: 'morning' | 'idle' | 'tap' | 'celebrate' | 'sad',
): string {
  const pool = companionLines[category];
  if (!pool || pool.length === 0) {
    return '我在的。';
  }
  return pool[Math.floor(Math.random() * pool.length)]!;
}
