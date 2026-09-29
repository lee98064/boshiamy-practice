import { expect, test, type Page } from '@playwright/test'
import { roots } from '../../src/data/roots'
import { readFileSync } from 'node:fs'

async function currentRoot(page: Page) {
  const id = await page.locator('.exercise-body').getAttribute('data-exercise-id')
  const root = roots.find((item) => item.id === id)
  expect(root).toBeDefined()
  return root!
}

import { startStaticServer } from './static-server'

test('root practice, wrong answer, hints and completion', async ({ page }) => {
  await page.goto('./#/practice/shape')
  await expect(page.locator('.exercise-body')).toBeVisible()
  await page.getByRole('button', { name: '鍵盤輸入', exact: true }).click()
  const answer = page.getByLabel('輸入字根答案', { exact: true })
  const firstRoot = await currentRoot(page)
  await answer.fill(firstRoot.code === 'x' ? 'z' : 'x')
  await expect(page.locator('#answer-feedback')).toContainText('再試一次')
  await page.getByRole('button', { name: '給我一點提示' }).click()
  await expect(page.locator('.hint-note')).toContainText(firstRoot.hint)
  await answer.fill(firstRoot.code.toUpperCase())
  await expect(page.locator('.exercise-body')).not.toHaveAttribute('data-exercise-id', firstRoot.id)
  for (let i = 1; i < 10; i++) {
    await page.getByRole('button', { name: '先跳過' }).click()
    await page.getByRole('button', { name: i === 9 ? '看結果' : '下一題', exact: true }).click()
  }
  await expect(page.getByRole('heading', { name: '手感，又多了一點。' })).toBeVisible()
  await page.getByRole('button', { name: '查看我的字本' }).click()
  await expect(page).toHaveURL(/#\/notebook/)
  await expect(page.locator('.note-card')).toHaveCount(10)
  await page.reload()
  await expect(page.locator('.note-card')).toHaveCount(10)
})

test('all seven route categories and complete word practice', async ({ page }) => {
  await page.goto('./#/practice/shape')
  for (const [category, glyph] of [
    ['音', '米'],
    ['義', '水'],
    ['單字', ''],
    ['詞語', '日'],
    ['成語', '一'],
    ['文章', '早'],
  ]) {
    await page
      .getByRole('group', { name: '練習分類' })
      .getByRole('button', { name: new RegExp(`^${category}`) })
      .click()
    if (['音', '義'].includes(category!))
      expect((await currentRoot(page)).category).toBe(category === '音' ? 'sound' : 'meaning')
    else if (category === '單字')
      await expect(page.getByTestId('practice-character')).toHaveAttribute(
        'aria-label',
        /^\p{Script=Han}$/u,
      )
    else await expect(page.getByTestId('practice-character')).toHaveText(glyph!)
  }
  await page.goto('./#/practice/words')
  await page.reload()
  await page.getByRole('button', { name: '鍵盤輸入', exact: true }).click()
  const answer = page.getByLabel('輸入字根答案', { exact: true })
  await answer.fill('do')
  await expect(page.getByTestId('practice-character')).toHaveText('月')
  await answer.fill('ue')
  await expect(page.locator('.completion-stats')).toContainText('100')
})

test('Chinese composition auto-checks only after selection is committed', async ({ page }) => {
  await page.goto('./#/practice/words')
  await page.getByRole('button', { name: '中文字', exact: true }).click()
  const answer = page.getByLabel('輸入中文字答案', { exact: true })
  await answer.dispatchEvent('compositionstart')
  await answer.fill('日')
  await answer.dispatchEvent('keydown', { key: 'Enter', isComposing: true })
  await expect(page.locator('#answer-feedback')).not.toContainText('答對了')
  await page.waitForTimeout(650)
  await expect(page.getByTestId('practice-character')).toHaveText('日')
  await answer.dispatchEvent('compositionend', { data: '日' })
  await expect(page.getByTestId('practice-character')).toHaveText('月')
})

test('lookup, reverse lookup, favorites and practice navigation', async ({ page }) => {
  await page.goto('./#/lookup?q=你好')
  await expect(page.locator('.dictionary-row')).toHaveCount(2)
  await page.getByRole('button', { name: '收藏 你', exact: true }).click()
  const query = page.getByRole('searchbox')
  await query.fill('snz')
  await expect(
    page
      .locator('.dictionary-row')
      .filter({ has: page.locator('.result-character', { hasText: '學' }) }),
  ).toBeVisible()
  await page.goto('./#/notebook')
  await page.getByRole('button', { name: /^已收藏/ }).click()
  await expect(page.locator('.note-card')).toContainText('你')
  await page.getByRole('button', { name: '練習收藏' }).click()
  await expect(page.getByTestId('practice-character')).toHaveText('你')
  await page.goto('./#/lookup?q=你好')
  await page.getByRole('button', { name: '練習這些字' }).click()
  await expect(page.getByTestId('practice-character')).toHaveText('你')
  await expect(page.locator('.article-text')).toContainText('你好')
})

test('local dictionary imports persist and invalid imports keep existing data', async ({
  page,
}) => {
  await page.goto('./#/settings')
  const file = page.getByLabel('選擇字碼表檔案')
  await file.setInputFiles({
    name: 'personal.cin',
    mimeType: 'text/plain',
    buffer: Buffer.from('%chardef begin\nzzzzzz 𠮷\n%chardef end'),
  })
  await expect(page.locator('.settings-panel [role="status"]')).toContainText('已匯入 1 個字元')
  await file.setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('[broken'),
  })
  await expect(page.locator('.settings-panel [role="status"]')).toContainText('JSON 格式不正確')
  await page.goto('./#/lookup?q=𠮷')
  await page.reload()
  await expect(page.locator('.dictionary-row')).toContainText('𠮷')
  await expect(page.locator('.code-group').first()).toHaveText('ZZZZZZ字碼')
  await expect(page.locator('.unverified-code')).toContainText('建議碼待核對')
  await page.getByRole('button', { name: '練習這些字' }).click()
  await expect(page.locator('.exercise-instruction .pill')).toHaveText('一般碼表')
  await expect(page.locator('.answer-slot')).toHaveCount(6)
  await page.setViewportSize({ width: 320, height: 740 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
  for (let i = 0; i < 6; i++)
    await page.getByRole('button', { name: '輸入 Z', exact: true }).click()
  await expect(page.getByRole('heading', { name: '手感，又多了一點。' })).toBeVisible()
  await page.goto('./#/settings')
  await file.setInputFiles({
    name: 'personal.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify([{ char: '𠮷', codes: ['z', ',zzzzz'], recommendedCodes: [',zzzzz'] }]),
    ),
  })
  await expect(page.locator('.settings-panel [role="status"]')).toContainText('已匯入 1 個字元')
  await page.goto('./#/lookup?q=𠮷')
  await page.reload()
  await expect(page.locator('.code-group').first()).toHaveText(',ZZZZZ指定碼')
  await page.getByRole('button', { name: '練習這些字' }).click()
  await expect(page.locator('.exercise-instruction .pill')).toHaveText('指定練習碼')
  await expect(page.locator('.answer-slot')).toHaveCount(6)
  await page.getByRole('button', { name: '輸入 Z', exact: true }).click()
  await page.waitForTimeout(300)
  await expect(page.getByTestId('practice-character')).toHaveText('𠮷')
  await page.getByRole('button', { name: '刪除一碼', exact: true }).click()
  await page.getByRole('button', { name: '輸入 ,', exact: true }).click()
  for (let i = 1; i < 6; i++)
    await page.getByRole('button', { name: '輸入 Z', exact: true }).click()
  await expect(page.getByRole('heading', { name: '手感，又多了一點。' })).toBeVisible()
})

test('mobile keyboard, safe area, install instructions and no horizontal overflow', async ({
  page,
}, testInfo) => {
  await page.goto('./#/practice/shape')
  const firstRoot = await currentRoot(page)
  await page
    .getByRole('button', { name: `輸入 ${firstRoot.code.toUpperCase()}`, exact: true })
    .click()
  await expect(page.locator('.exercise-body')).not.toHaveAttribute('data-exercise-id', firstRoot.id)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
    'content',
    /viewport-fit=cover/,
  )
  await page.getByRole('button', { name: '安裝與使用說明' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('dialog')).toContainText('加入主畫面')
  await page.getByRole('button', { name: '關閉安裝說明' }).click()
  await page.getByRole('button', { name: '重新開始本回合' }).click()
  await page.getByRole('button', { name: '先跳過' }).click()
  await expect(page.getByRole('button', { name: '輸入 O', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: '下一題', exact: true }).click()
  await expect(page.locator('.exercise-body')).toBeVisible()
  await page.getByRole('button', { name: '重新開始本回合' }).click()
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-practice.png`,
    fullPage: true,
  })
})

test('PWA works offline including a route never previously opened', async ({
  page,
  context,
  browserName,
}) => {
  const basePath = process.env.E2E_BASE_PATH || '/boshiamy-practice/'
  // Playwright #42775: setOffline kills WebKit requests before SW handling.
  // Use a real stopped origin on WebKit; Chromium also exercises setOffline.
  const origin = await startStaticServer(basePath)
  try {
    await page.goto(`${origin.url}#/practice/shape`)
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready
      if (!navigator.serviceWorker.controller)
        await new Promise<void>((resolve) =>
          navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), {
            once: true,
          }),
        )
    })
    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href')
    const manifestUrl = new URL(manifestHref!, page.url()).href
    const manifest = await (await page.request.get(manifestUrl)).json()
    expect(manifest.display).toBe('standalone')
    expect(manifest.scope).toBe(basePath)
    for (const icon of manifest.icons)
      expect((await page.request.get(new URL(icon.src, manifestUrl).href)).ok()).toBe(true)
    await origin.stop()
    if (browserName !== 'webkit') await context.setOffline(true)
    const response = await page.reload()
    expect(response?.fromServiceWorker()).toBe(true)
    await expect(page.locator('.exercise-body')).toBeVisible()
    await page.goto(`${origin.url}#/lookup?q=學`)
    await expect(page.locator('.dictionary-row')).toContainText('學')
    await page.goto(`${origin.url}#/roots`)
    await expect(page.locator('.root-key-row')).toHaveCount(26)
    expect(
      await page.evaluate(async () => {
        const cached = await fetch(new URL('reference/root-chart.png', document.baseURI).href)
        return cached.ok
      }),
    ).toBe(true)
    await page.goto(`${origin.url}#/practice/single`)
    await expect(page.getByTestId('practice-character')).toHaveAttribute(
      'aria-label',
      /^\p{Script=Han}$/u,
    )
  } finally {
    await context.setOffline(false)
    await origin.stop()
  }
})

test('partial codes wait and complete answers advance without Enter', async ({ page }) => {
  await page.goto('./#/practice/article?text=學習')
  await expect(page.getByTestId('practice-character')).toHaveText('學')
  await page.getByRole('button', { name: '鍵盤輸入', exact: true }).click()
  const answer = page.getByLabel('輸入字根答案', { exact: true })
  await answer.fill('sn')
  // Let the automatic check settle: an incomplete, valid prefix must not count as wrong.
  await page.waitForTimeout(650)
  await expect(page.getByTestId('practice-character')).toHaveText('學')
  await expect(answer).toHaveAttribute('aria-invalid', 'false')
  await answer.fill('snz')
  await expect(page.getByTestId('practice-character')).toHaveText('習')
  await expect(answer).toBeFocused()
  await answer.fill('eepd')
  await expect(page.locator('.completion-stats')).toContainText('100')
})

test('pending answer checks pause off-page and cannot leak into a restarted lesson', async ({
  page,
}) => {
  await page.goto('./#/practice/shape')
  await expect(page.locator('.exercise-body')).toBeVisible()
  await page.clock.install()
  await page.clock.pauseAt(new Date())
  await page.getByRole('button', { name: '鍵盤輸入', exact: true }).click()
  const answer = page.getByLabel('輸入字根答案', { exact: true })
  const firstRoot = await currentRoot(page)
  await answer.fill(firstRoot.code)
  await page
    .getByRole('link', { name: /字碼查詢|查碼/ })
    .filter({ visible: true })
    .click()
  await expect(page.getByRole('searchbox')).toBeVisible()
  await page.clock.runFor(1500)
  await page.goBack()
  await expect(page.locator('.exercise-body')).toHaveAttribute('data-exercise-id', firstRoot.id)
  await page.clock.runFor(250)
  await expect(page.locator('.exercise-body')).not.toHaveAttribute('data-exercise-id', firstRoot.id)
  await answer.fill((await currentRoot(page)).code)
  await page.getByRole('button', { name: '重新開始本回合' }).click()
  await page.clock.runFor(1500)
  await expect(page.locator('.exercise-body')).toBeVisible()
  await expect(page.locator('.session-summary')).toContainText('0 / 10 題')
})

test('correct answers switch directly with stable controls and no success prompt', async ({
  page,
}) => {
  await page.goto('./#/practice/shape?key=o')
  await expect(page.locator('.exercise-body')).toBeVisible()
  await page.clock.install()
  await page.clock.pauseAt(new Date())
  const answer = page.getByTestId('code-answer-slots')
  const keyboard = page.locator('.keyboard-wrap')
  for (let i = 0; i < 3; i++) {
    const root = await currentRoot(page)
    await page.getByRole('button', { name: '輸入 O', exact: true }).click()
    const inputBefore = await answer.boundingBox()
    const keyboardBefore = await keyboard.boundingBox()
    await page.clock.runFor(250)
    await expect(page.locator('.exercise-body')).not.toHaveAttribute('data-exercise-id', root.id)
    await expect(answer.locator('.answer-slot')).toHaveText([''])
    await expect(page.locator('#practice-answer')).toHaveCount(0)
    await expect(page.locator('.hint-note')).toHaveCount(0)
    await expect(page.locator('#answer-feedback')).not.toContainText('答對了')
    await expect(page.getByRole('button', { name: '檢查', exact: true })).toBeVisible()
    expect(await answer.boundingBox()).toEqual(inputBefore)
    expect(await keyboard.boundingBox()).toEqual(keyboardBefore)
  }
  await expect(page.locator('.session-summary')).toContainText('3 / 5 題')
})

test('web keyboard reserves code slots, supports corrections and preserves text when switching tools', async ({
  page,
}, testInfo) => {
  await page.goto('./#/practice/article?text=學習')
  await expect(page.getByTestId('practice-character')).toHaveText('學')
  await page.clock.install()
  await page.clock.pauseAt(new Date())
  const slots = page.locator('.answer-slot')
  const key = (letter: string) => page.getByRole('button', { name: `輸入 ${letter}`, exact: true })
  await expect(slots).toHaveText(['', '', ''])
  await expect(page.locator('#practice-answer')).toHaveCount(0)
  await key('S').click()
  await key('X').click()
  await page.clock.runFor(250)
  await expect(slots).toHaveText(['S', 'X', ''])
  await expect(page.locator('#answer-feedback')).toContainText('再試一次')
  await page.getByRole('button', { name: '刪除一碼', exact: true }).click()
  await expect(slots).toHaveText(['S', '', ''])
  await key('N').click()
  await page.clock.runFor(250)
  await expect(page.locator('#answer-feedback')).not.toContainText('再試一次')
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-code-slots.png`,
    fullPage: true,
  })
  await key('Z').click()
  await page.clock.runFor(250)
  await expect(page.getByTestId('practice-character')).toHaveText('習')
  await expect(slots).toHaveText(['', '', '', ''])
  await key('E').click()
  await page.getByRole('button', { name: '鍵盤輸入', exact: true }).click()
  const answer = page.getByLabel('輸入字根答案', { exact: true })
  await expect(answer).toHaveValue('e')
  await expect(answer).toBeFocused()
  await expect(slots).toHaveCount(0)
  await expect(page.locator('.virtual-keyboard')).toHaveCount(0)
  await page.getByRole('button', { name: '網頁鍵盤', exact: true }).click()
  await expect(slots).toHaveText(['E', '', '', ''])
  await expect(page.locator('#practice-answer')).toHaveCount(0)
  // EE is a shortcut: wait for EEPD, keeping the four recommended-code slots.
  await key('E').click()
  await page.clock.runFor(250)
  await expect(page.getByTestId('practice-character')).toHaveText('習')
  await expect(slots).toHaveText(['E', 'E', '', ''])
  await expect(page.locator('#answer-feedback')).not.toContainText('再試一次')
  await key('P').click()
  await expect(slots).toHaveText(['E', 'E', 'P', ''])
  await key('D').click()
  await page.clock.runFor(250)
  await expect(page.getByRole('heading', { name: '手感，又多了一點。' })).toBeVisible()
  await page.goto('./#/practice/words')
  await page.getByRole('button', { name: '鍵盤輸入', exact: true }).click()
  await page.reload()
  await expect(page.getByLabel('輸入字根答案', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '鍵盤輸入', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('recommended codes control lookup, slots and checking without accepting shortcuts', async ({
  page,
}) => {
  await page.goto('./#/lookup?q=好對的')
  await expect(page.locator('.dictionary-row .code-group:first-of-type')).toHaveText([
    'GZJ建議碼',
    'FEBA建議碼',
    'D建議碼',
  ])
  await page.getByRole('button', { name: '練習這些字' }).click()
  await page.clock.install()
  await page.clock.pauseAt(new Date())
  const key = (letter: string) => page.getByRole('button', { name: `輸入 ${letter}`, exact: true })
  await expect(page.locator('.exercise-instruction .pill')).toHaveText('建議碼')
  await expect(page.locator('.answer-slot')).toHaveCount(3)
  await key('G').click()
  await key('Z').click()
  await page.clock.runFor(300)
  await expect(page.getByTestId('practice-character')).toHaveText('好')
  await expect(page.locator('.answer-slot')).toHaveText(['G', 'Z', ''])
  await expect(page.locator('#answer-feedback')).not.toContainText('再試一次')
  await key('J').click()
  await page.clock.runFor(300)
  await expect(page.getByTestId('practice-character')).toHaveText('對')
  await expect(page.locator('.answer-slot')).toHaveCount(4)
  await key('A').click()
  await page.clock.runFor(300)
  await expect(page.getByTestId('practice-character')).toHaveText('對')
  await expect(page.locator('#answer-feedback')).toContainText('本題請使用建議碼')
  await page.getByRole('button', { name: '刪除一碼', exact: true }).click()
  for (const letter of 'FEBA') await key(letter).click()
  await page.clock.runFor(300)
  await expect(page.getByTestId('practice-character')).toHaveText('的')
  await expect(page.locator('.answer-slot')).toHaveCount(1)
  await key('D').click()
  await page.clock.runFor(300)
  await expect(page.getByRole('heading', { name: '手感，又多了一點。' })).toBeVisible()
})

test('saved mistakes and favorites use current recommended codes', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'boshiamy-practice:v1',
      JSON.stringify({
        version: 1,
        favorites: ['好'],
        mistakes: [
          {
            id: 'char-好',
            glyph: '好',
            codes: ['gz', 'gzj'],
            isRoot: false,
            hint: '舊提示',
            explanation: '舊字碼',
          },
        ],
      }),
    )
  })
  await page.goto('./#/notebook')
  await expect(page.locator('.note-card .note-code')).toHaveText('GZJ')
  await expect(page.locator('.note-card small')).toHaveText('建議碼')
  await page.getByRole('button', { name: '再練一次', exact: true }).click()
  await expect(page.getByTestId('practice-character')).toHaveText('好')
  await expect(page.locator('.answer-slot')).toHaveCount(3)
  await page.getByRole('button', { name: '鍵盤輸入', exact: true }).click()
  const answer = page.getByLabel('輸入字根答案', { exact: true })
  await answer.fill('gz')
  await page.waitForTimeout(300)
  await expect(page.getByTestId('practice-character')).toHaveText('好')
  await answer.fill('gzj')
  await expect(page.getByRole('heading', { name: '手感，又多了一點。' })).toBeVisible()
  await page.getByRole('button', { name: '查看我的字本' }).click()
  await page.getByRole('button', { name: /^已收藏/ }).click()
  await expect(page.locator('.note-card .note-code')).toHaveText('GZJ')
  await page.getByRole('button', { name: '練習收藏' }).click()
  await expect(page.locator('.exercise-instruction .pill')).toHaveText('建議碼')
  await answer.fill('gz')
  await page.waitForTimeout(300)
  await expect(page.getByTestId('practice-character')).toHaveText('好')
})

test('expanded root library, filtered routes, image variants and larger non-repeating rounds', async ({
  page,
}, testInfo) => {
  await page.goto('./#/roots')
  await expect(page.locator('.root-key-row')).toHaveCount(26)
  await expect(page.locator('.root-tile')).toHaveCount(roots.length)
  await page.screenshot({ path: `test-results/${testInfo.project.name}-root-library.png` })
  const vRow = page.getByRole('region', { name: 'V 鍵字根', exact: true })
  await vRow.getByRole('link', { name: '形', exact: true }).click()
  await expect(page).toHaveURL(/#\/practice\/shape\?key=v/)
  await expect(page.locator('.practice-character svg')).toBeVisible()
  await expect(page.getByRole('button', { name: '中文字', exact: true })).toBeDisabled()
  await expect(page.locator('.session-summary')).toContainText('0 / 1 題')
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-root-variant.png`,
    fullPage: true,
  })
  await page.getByRole('button', { name: '輸入 V', exact: true }).click()
  await expect(page.getByRole('heading', { name: '手感，又多了一點。' })).toBeVisible()
  await page.getByLabel('字根鍵位', { exact: true }).selectOption('')
  await page.getByLabel('每回合題數', { exact: true }).selectOption('50')
  await expect(page.locator('.session-summary')).toContainText('0 / 50 題')
  const seen = new Set<string>()
  for (let i = 0; i < 50; i++) {
    const id = (await currentRoot(page)).id
    expect(seen.has(id)).toBe(false)
    seen.add(id)
    await page.getByRole('button', { name: '先跳過', exact: true }).click()
    await page.getByRole('button', { name: i === 49 ? '看結果' : '下一題', exact: true }).click()
  }
  await expect(page.getByRole('heading', { name: '手感，又多了一點。' })).toBeVisible()
  await page.getByRole('button', { name: '再練一回合', exact: true }).click()
  expect(seen.has((await currentRoot(page)).id)).toBe(false)
  await page.getByLabel('字根鍵位', { exact: true }).selectOption('c')
  await expect(page.getByRole('heading', { name: '這個分類沒有此鍵位的字根。' })).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('字根鍵位', { exact: true })).toHaveValue('c')
  await expect(page.getByLabel('每回合題數', { exact: true })).toHaveValue('50')
})

test('single-character random practice supports whole dictionary, verified codes and durable preferences', async ({
  page,
}, testInfo) => {
  await page.goto('./#/practice/single')
  await expect(page.getByLabel('單字抽題範圍', { exact: true })).toHaveValue('all')
  const count = await page.locator('.pool-description strong').innerText()
  expect(Number(count.replace(/,/g, ''))).toBeGreaterThan(10000)
  await page.getByLabel('每回合題數', { exact: true }).selectOption('5')
  const seen = new Set<string>()
  for (let i = 0; i < 5; i++) {
    const glyph = await page.getByTestId('practice-character').getAttribute('aria-label')
    expect(glyph).toMatch(/^\p{Script=Han}$/u)
    expect(seen.has(glyph!)).toBe(false)
    seen.add(glyph!)
    await page.getByRole('button', { name: '先跳過', exact: true }).click()
    await page.getByRole('button', { name: i === 4 ? '看結果' : '下一題', exact: true }).click()
  }
  await page.getByRole('button', { name: '再練一回合', exact: true }).click()
  expect(seen.has((await page.getByTestId('practice-character').getAttribute('aria-label'))!)).toBe(
    false,
  )
  await page.getByLabel('單字抽題範圍', { exact: true }).selectOption('recommended')
  await expect(page.locator('.pool-description strong')).toHaveText('159')
  await page.getByRole('button', { name: '鍵盤輸入', exact: true }).click()
  const recommendations = JSON.parse(
    readFileSync(new URL('../../src/data/recommended-codes.json', import.meta.url), 'utf8'),
  ) as Record<string, string[]>
  for (let i = 0; i < 5; i++) {
    const glyph = (await page.getByTestId('practice-character').getAttribute('aria-label'))!
    await expect(page.locator('.exercise-instruction .pill')).toHaveText('建議碼')
    await page.getByLabel('輸入字根答案', { exact: true }).fill(recommendations[glyph]![0]!)
    if (i < 4)
      await expect(page.getByTestId('practice-character')).not.toHaveAttribute('aria-label', glyph)
  }
  await expect(page.getByRole('heading', { name: '手感，又多了一點。' })).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('每回合題數', { exact: true })).toHaveValue('5')
  await expect(page.getByLabel('單字抽題範圍', { exact: true })).toHaveValue('recommended')
  await page.setViewportSize({ width: 320, height: 740 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-single-practice.png`,
    fullPage: true,
  })
})
