# 蝦米練習室

Vue 3 + TypeScript + Vue Router 的嘸蝦米練習與查碼 PWA，適合桌機與手機，供免費、非商業學習使用。

## 開始開發

需要 Node.js 22.12 以上（建議 Node 22 LTS）。

```sh
npm ci
npm run dev
```

開啟終端機顯示的網址。開發模式不啟用 Service Worker；離線功能請使用 production build 測試：

```sh
npm run build
npm run preview
```

## 已實作

- **六類練習**：形 8 題、音 12 題、義 12 題、10 組詞語、8 組成語、3 篇原創短文，以及自訂文章。字根每回合可選 5 / 10 / 20 題，不足時輪替。
- **兩種輸入方式**：直接輸入英文字根，或使用已安裝的輸入法輸入中文字；處理 IME composition，選字中的 Enter 不會提早判題。輸入停頓約 220ms 後自動判題，正確時直接進入下一題，不顯示答對提示或自動展開字根說明；有效的未完成字碼不會誤算答錯，最後一題自動顯示結果。網站只比對送出的中文字，無法辨認使用的系統輸入法。
- **字根方格**：網頁鍵盤依題目主要字碼預先留格，一格顯示一碼，不喚起手機系統鍵盤。另一組較長的有效字碼會調整格數。切換「鍵盤輸入」改用一般輸入框，保留已輸入字根；「中文字」模式使用系統輸入法。作答工具偏好會儲存在本機。
- **練習流程**：提示、跳過、首次正確率、計時、完成結果、每日目標。離開練習頁或瀏覽器分頁不可見時暫停計時；返回頁面保留目前回合。
- **雙向查碼**：13,563 個字元（含符號）；中文字查所有收錄字碼、英文碼精確及前綴反查、複製、收藏與查詢文字直接練習。反查列表不模擬官方候選字排序。
- **我的字本**：錯題、收藏與最近 100 回合紀錄；錯題由使用者確認熟悉後移除。最多保留最近 10,000 次完成題目紀錄。
- **本機資料**：紀錄儲存在 localStorage；個人 CIN / JSON 碼表儲存在 IndexedDB。碼表不會上傳，匯入上限 5 MB，支援 UTF-8 單字碼表。提供紀錄 JSON 匯出，尚未提供紀錄還原介面。
- **PWA**：應用外框、所有路由分塊、字碼與圖示預快取；離線使用；新版本由使用者選擇更新，避免打斷練習。

字根與完整字碼不同，例如「口」字根為 `O`，完整取碼為 `OO`。形／音／義頁面清楚標示「字根聯想」，其餘為完整字碼逐字練習。完整碼與已收錄的簡碼均接受。

## 路由與程式結構

Vue Router 使用 `createWebHashHistory(import.meta.env.BASE_URL)`，支援 GitHub Pages 子路徑、重新整理與直接連結。

| 路徑                 | 頁面                     |
| -------------------- | ------------------------ |
| `#/practice/shape`   | 形字根練習               |
| `#/practice/sound`   | 音字根練習               |
| `#/practice/meaning` | 義字根練習               |
| `#/practice/words`   | 詞語                     |
| `#/practice/idioms`  | 成語                     |
| `#/practice/article` | 文章                     |
| `#/lookup?q=學習`    | 字碼查詢，可分享查詢內容 |
| `#/notebook`         | 錯題、收藏、練習紀錄     |
| `#/settings`         | 偏好與碼表管理           |

```text
src/
  App.vue                     # 共用外框與 RouterView
  router/index.ts             # 路由設定、按頁載入
  views/                      # 四個獨立路由頁面
  components/layout/          # 桌機與手機導覽
  components/                 # 螢幕鍵盤、安裝說明
  composables/usePractice.ts   # 純練習狀態、判題、計時
  composables/usePracticePage.ts # 練習頁與路由協調
  composables/useData.ts       # 收藏、錯題、紀錄、資料讀寫
  composables/usePwa.ts        # 安裝更新與連線狀態
  lib/                        # 字碼解析、查詢、儲存
  data/                       # 教材與公開碼表
```

練習頁透過 `KeepAlive` 保留未完成的回合；其他頁面按需載入。查碼內容放在 URL query，瀏覽器上一頁／下一頁可正常運作。

## GitHub Pages

1. 將專案放入 GitHub repository 的 `main` 分支。
2. Repository → **Settings → Pages → Build and deployment → Source** 選 **GitHub Actions**。
3. 推送 `main`，或手動執行 **Verify and deploy GitHub Pages** workflow。

`.github/workflows/deploy.yml` 在 PR 執行單元測試、型別檢查、子路徑 build 與桌機／手機 Chromium 與 WebKit 瀏覽器測試，PR 不部署。`main` 通過驗證後，從 `configure-pages` 取得實際 `base_path`，再次建置並部署。支援 repository Pages、`username.github.io` 根路徑與自訂網域。

本地模擬 repository 子路徑（build 與 preview 的 base 必須相同）：

```sh
BASE_PATH=/boshiamy-practice/ npm run build
BASE_PATH=/boshiamy-practice/ npm run preview
```

## 手機與 iOS

- `viewport-fit=cover`，頂部、底部、左右使用 `env(safe-area-inset-*)`。
- 使用 `dvh`、底部導覽留白、不禁用縮放。中文字輸入欄至少 16px，避免 iOS 聚焦放大。
- `display: standalone`、Apple web-app meta、180px Apple Touch Icon，以及 192 / 512 / maskable PNG。
- **隱藏 iPhone 網址列**：Safari → 分享 → 加入主畫面 → 從圖示開啟；一般 Safari 分頁不能由網站強制隱藏網址列。
- 首次連線載入並完成快取後才可離線。刪除網站資料會清除紀錄，瀏覽器亦可能回收儲存空間。
- PWA 安裝需 HTTPS 或 localhost。瀏覽器模擬無法取代實體 iPhone standalone、系統鍵盤和旋轉驗收。

## 驗證與維護

```sh
npm run test
npm run build
BASE_PATH=/boshiamy-practice/ npm run build
npx playwright install chromium webkit
npm run test:e2e
npm run format:check
```

瀏覽器測試預設使用 `/boshiamy-practice/` 的 production build；可用 `E2E_BASE_PATH=/` 驗證根路徑。第一次安裝瀏覽器後不需重複安裝。

修改圖示後：`node scripts/generate-icons.mjs`。碼表轉換工具：`node scripts/convert-dictionary.mjs /path/to/boshiamy.cin`。

## 資料與設計來源

字碼採用 `chinese-opendesktop/cin-tables` 的舊版 `liu57a_ersu`，來源標示 **Free for non-commercial use**。這不是目前官方 J / X2 完整字庫；版本差異以官方查碼為準。原始聲明、指紋與教材來源見 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

介面依 `frontend-design` 設計。已於 2026-09-28 比對上游，確認 2026-09-03 有新版並採用；未改動全域 skill。決策與版面規劃見 [docs/PLAN.md](docs/PLAN.md)。

WebKit 離線測試會關閉獨立測試伺服器，避開 Playwright 1.63 的 [setOffline 問題 #42775](https://github.com/microsoft/playwright/issues/42775)；測試仍會確認重新載入的回應來自 Service Worker。
