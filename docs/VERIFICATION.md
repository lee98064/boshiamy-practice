# 驗證紀錄

2026-09-28，本機 Node 22.22.2，production build，GitHub Pages 子路徑 `/boshiamy-practice/`。

| 項目                                 | 結果                       |
| ------------------------------------ | -------------------------- |
| TypeScript / vue-tsc                 | 通過                       |
| Vite production build / PWA 產物     | 通過                       |
| 字碼解析、判題、教材覆蓋單元測試     | 14 / 14 通過               |
| 桌機 Chromium                        | 13 / 13 通過               |
| 手機 Chromium                        | 13 / 13 通過               |
| 手機 WebKit                          | 13 / 13 通過               |
| Prettier                             | 通過                       |
| npm audit（production dependencies） | 0 vulnerabilities          |
| 桌機、390px、320px、手機橫向         | 無橫向溢出、未捕獲頁面例外 |

瀏覽器測試涵蓋六類路由、自動判題與換題／跳過／結果、有效字碼前綴不誤判、答對直接換題且輸入框與鍵盤位置不變、離頁暫停與重新開始時取消待執行判題、錯題持久化、IME composition 完成後才判題、查碼與反查、收藏複習、本機碼表匯入與失敗保留資料、螢幕鍵盤、安裝說明、manifest scope、圖示載入與離線重新整理。

字根方格驗證包含依題目預留格數、逐碼顯示、刪碼與更正、習字依 EEPD 預留四格、EE 不提前換題、切換作答工具保留內容、偏好持久化、跳過後繼續下一題，以及 320px 寬度的六碼匯入字碼無橫向溢出。

建議碼驗證：159 字涵蓋全部內建教材；確認「好」GZJ、「對」FEBA、「的」D 的查碼排序、預留格數與判題，不依碼長猜測。舊錯題和收藏使用現行建議碼；未核對字仍可用一般碼表練習；JSON 指定練習碼匯入後持久化且不冒充官方核對。

離線測試關閉每個測試專用的靜態伺服器，確認重新載入回應 `fromServiceWorker()`，並切到先前未開啟的查碼頁。Chromium 另切換 offline 模式；WebKit 使用真實停止來源，避開 Playwright 1.63 的 [離線模擬問題 #42775](https://github.com/microsoft/playwright/issues/42775)。

已人工查看 [桌機練習](screenshots/desktop.png)、[手機練習](screenshots/mobile.png) 與 [查碼](screenshots/lookup.png) 截圖。

GitHub Pages 首次部署已於 2026-09-28 通過 [Actions 驗證、建置與部署](https://github.com/lee98064/boshiamy-practice/actions/runs/36384159033)，並確認正式站首頁、JS、CSS、manifest 與 Service Worker 回傳 HTTP 200。後續版本的部署狀態以 GitHub Actions 為準。

尚未驗證：實體 iPhone 加入主畫面、瀏海安全邊、原生輸入法鍵盤與安裝後重新啟動。WebKit 模擬測試不代表這些實機流程已通過。
