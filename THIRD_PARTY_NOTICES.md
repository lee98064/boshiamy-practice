# 第三方資料與授權

## 嘸蝦米字碼資料

`src/data/dictionary.json` 由 chinese-opendesktop/cin-tables 的 `boshiamy.cin` 轉換而來，保留單字、多種字碼與原始對應關係，合併重複項目，按碼長排序。這個排序不代表官方建議碼。

- 來源：https://github.com/chinese-opendesktop/cin-tables/blob/master/boshiamy.cin
- 取得日期：2026-09-28
- 資料版本：`liu57a_ersu`（舊版，並非目前官方 J / X2 完整字庫）
- 原檔 SHA-256：`d5d2fb887e170e76db2df8cd5fde5f7934bbb6b51cb084cbabde5d6f189fae15`
- 轉換後：13,563 個單一字元（含符號）。

原始檔頭聲明，原樣保留：

```text
#嘸蝦米 liu57a_ersu
#社群網址: http://input.foruto.com/boshiamy/ 蝦米族樂園
#商業公司: http://www.liu.com.tw/
#copyright (c) 行易有限公司
#格式轉換(無附加限制): 趙惟倫 <bluebat@member.fsf.org>, 2007
#授權方式: Free for non-commercial use
```

本專案依使用者指定，供免費、非商業學習。資料保留原有的非商業限制，不以程式碼授權取代，也不宣稱此碼表為不受限制的開源資料。商業用途應另取得權利人的適當授權或移除本資料。最新字碼與版本差異請以 [行易官方查碼](https://boshiamy.com/liuquery.php) 為準。

嘸蝦米為行易有限公司之商標；本專案是非官方練習工具，與行易有限公司無隸屬關係。

## 建議碼核對

`src/data/recommended-codes.json` 另行記錄 159 個字的核對結果，包含全部內建教材用字與查碼範例。2026-09-28 逐批查閱 [行易官方查碼](https://boshiamy.com/liuquery.php)，僅採「繁體」欄中明示「建議碼」的字碼。這是有限教材範圍的事實對照，並非完整官方碼表，也不擴張原資料的使用授權。查詢時把這些已核對字碼排在其他碼之前；未核對的字不推測建議碼。方法與範圍見 [核對紀錄](docs/RECOMMENDED_CODES.md)。

## 教材

形、音、義的分類與字根對應參考 [行易字根易學篇](https://boshiamy.com/tutorial_beginner.php?page=2)；解說文字為本專案另行撰寫，未複製官方字根圖檔。詞語與成語為常見中文詞彙；三篇練習短文為本專案原創。

## 軟體

Vue / Vue Router / Vite / Vitest：MIT。Lucide 圖示：ISC。Vite PWA / Workbox、Playwright：依各套件附帶授權。完整依賴版本記錄於 package-lock.json，各套件授權保留於 node_modules。
