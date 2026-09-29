import type { Category } from '../types'

export const categories: { id: Category; name: string; label: string; description: string }[] = [
  {
    id: 'shape',
    name: '形',
    label: '看形狀，找字根',
    description: '把熟悉的輪廓，連到一個英文字母。',
  },
  {
    id: 'sound',
    name: '音',
    label: '念出來，記下來',
    description: '從字根的發音，找到鍵盤上的位置。',
  },
  {
    id: 'meaning',
    name: '義',
    label: '懂意思，就記得',
    description: '用英文與數字，連起字根的意思。',
  },
  {
    id: 'single',
    name: '單字',
    label: '隨機抽字，練習拆碼',
    description: '從字碼表抽出中文字，每回合不重複。',
  },
  {
    id: 'words',
    name: '詞語',
    label: '把字，連成生活',
    description: '從常見的雙字詞開始，逐字練習取碼。',
  },
  {
    id: 'idioms',
    name: '成語',
    label: '四個字，一份手感',
    description: '熟悉的成語，也能練出流暢的節奏。',
  },
  {
    id: 'article',
    name: '文章',
    label: '讓手指，跟上心裡的話',
    description: '慢慢打一段文字，找到自己的速度。',
  },
]

export { roots } from './roots'

export const wordSets = {
  words: ['日月', '山水', '朋友', '生活', '學習', '文字', '時間', '初心', '自在', '森林'],
  idioms: [
    '一心一意',
    '日新月異',
    '水到渠成',
    '熟能生巧',
    '循序漸進',
    '持之以恆',
    '海闊天空',
    '心平氣和',
  ],
}
export const articles = [
  {
    id: 'morning',
    title: '窗邊的早晨',
    text: '早晨的光落在窗邊。我泡了一杯茶，打開書本，讓心慢慢安靜下來。每天練習一點，就會比昨天更熟悉。',
  },
  {
    id: 'walk',
    title: '散步的時候',
    text: '走出家門，沿著小路慢慢向前。風穿過樹葉，陽光照在水面上。有時候，放慢腳步，就能看見生活的美好。',
  },
  {
    id: 'practice',
    title: '寫給練習中的你',
    text: '不必急著追上別人的速度。先看清楚一個字，再找到它的字根。一次一次練習，陌生的鍵位也會成為熟悉的朋友。',
  },
]
