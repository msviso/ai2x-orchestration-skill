# AI2X 產品展示說明書（範例模板）

> 本文件為產品展示用的示範內容，可直接複製到 doc template 中展示篇幅與敘事方式。若需實際對外發佈，請依照專案資訊調整數據、截圖與用詞。

---

## 1. 文件目的與讀者

### 1.1 文件目的
- 建立 AI2X 平台的產品敘事骨架，協助 BD / 產品 / 技術團隊於對外展示時快速取材。
- 描述從安裝、設定到展示腳本的完整流程，確保任何人依照文件即可重現 Demo。
- 界定評估成功與否的衡量指標，方便在展示後即時檢討並優化後續動作。

### 1.2 預期讀者
| 角色 | 需求 | 文件中提供的內容 |
| --- | --- | --- |
| 業務開發 | 快速理解賣點與客戶情境 | 章節 2、3、7 |
| 實施顧問 | 需要逐步部署指引 | 章節 5、6、8 |
| 客戶決策者 | 評估成本／風險／效益 | 章節 3、9、10 |
| 支援團隊 | 排除展示現場疑難 | 章節 8、11 |

---

## 2. 產品背景與市場脈絡

### 2.1 解決的痛點
1. **多螢幕協作成本高**：傳統展演需逐一設定每台顯示器，耗時又容易出錯。
2. **內容更新不即時**：行銷素材更換頻繁，缺乏集中控管導致訊息落差。
3. **缺乏互動式體驗**：單向播放影像難以吸引參觀者，無法回傳參與數據。

### 2.2 市場趨勢
- 企業展廳、智慧門市與大型活動對「多裝置編排」需求年增率估計 >18%（來源：內部訪談，2025 H2）。
- 低程式門檻的內容編排工具正在取代傳統 signage 系統，預計 2026 年滲透率可達 35%。

---

## 3. 核心價值主張

### 3.1 產品定位
AI2X 是一個 **多終端 AI 展示編排平台**，主打在「5 分鐘內交付可互動的展示場景」。

### 3.2 價值集中在三個面向
1. **內容佈局自動化**：透過模板器（Template Orchestrator）快速套用預設版面，省去重新拉版。
2. **AI 協作引擎**：結合 MCP（Model Control Plane）讓 AI agent 可以直接控制展示設備，支援語音／文字指令。
3. **營運監控**：即時回傳裝置狀態、播放成功率與訪客互動點擊，方便後台統計。

### 3.3 預設模板（範例）
| 模板代碼 | 目的 | 內容構成 | 互動元素 |
| --- | --- | --- | --- |
| `youtube.v2` | 多影片輪播展示 | Hero video + 子視窗資訊卡 | 支援語音換片、遙控切換 |
| `doc.showcase` | 產品說明文件 | 左側章節列表 + 右側內容區 | 支援關鍵字高亮、AI 摘要 |
| `stats.wall` | KPI / 數據牆 | 多圖表拼接、實時 API | 支援區塊放大、閾值警示 |

---

## 4. 系統組成與流程

### 4.1 組成模組
1. **Orchestration Core**：處理模板渲染、播放排程、裝置同步。
2. **AI Command Layer**：透過 MCP 端點接收 agent 指令，並轉譯成 Canvas Push job。
3. **Device Mesh**：AI2X Display Client（Electron / Web 端）負責接收 payload 並呈現。
4. **Telemetry Service**：收集播放事件、遙測資料，回傳儀表板。

### 4.2 邏輯流程（文字版）
```
使用者 ->（命令）-> AI Agent ->（MCP）-> AI2X Orchestrator
->（Canvas Job）-> Display Client ->（呈現/互動）-> Telemetry -> 儀表板
```

---

## 5. 部署前準備

1. **帳號與權限**
   - AI2X MCP token：kV6WlxUEri…（展示用；正式環境請重新發行）。
   - 顯示設備需登入 AI2X Display Client，版本 ≥ 0.4.2。
2. **網路需求**
   - 上傳：至少 5 Mbps，避免影片下載延遲。
   - 連線埠：確保 443/ wss 已開啟。
3. **素材檢查**
   - 影片格式：建議 MP4/H.264，解析度 1080p。
   - 文件：Markdown 或 HTML 皆可，由模板自動轉換。
4. **現場規劃**
   - 顯示器擺位：建議間距 ≥ 20 cm，避免熱干擾。
   - 音訊：若需聲音引導，準備藍牙喇叭或 HDMI audio。

---

## 6. 安裝與啟動流程（逐步）

### 6.1 安裝 AI2X Skill（以 OpenClaw 為例）
1. `npm install ai2x-skill -g`
2. 於 `skills/` 內設定 `skill.manifest.json`，確認 `youtube.v2` 與 `doc.showcase` 模板可用。
3. 執行 `openclaw skill apply ai2x-skill`，確認日誌中顯示 `Canvas capability detected`。

### 6.2 建立展示 Job
```bash
openclaw job create \
  --name ai2x-doc-demo \
  --skill ai2x-skill \
  --payload docs/product_showcase.json
```
- `product_showcase.json` 可參考 `examples/doc_showcase.sample.json`。
- 若需同步播放 YouTube，可在同一 job 內加入 `youtube.v2` 區塊。

### 6.3 啟動展示
1. 打開所有 Display Client，登入同一 workspace。
2. 在儀表板中選擇剛建立的 job，點擊 `Push to Displays`。
3. 確認每台設備收到 payload 後，開始依腳本講解。

---

## 7. 展示腳本（可依場合調整）

### 7.1 開場（0:00-1:30）
- 介紹 AI2X 操作介面，強調「一個指令啟動多螢幕」。
- 示範語音下達：「Nova，請推送產品說明模板」。

### 7.2 文件導覽（1:30-6:00）
1. **章節巡覽**：從左側目錄點選「產品概述 → 功能亮點」。
2. **動態重點**：啟用 AI 摘要，畫面右上角浮出 bullet key takeaways。
3. **互動提問**：邀請觀眾輸入關鍵字，由系統自動捲動至對應段落。

### 7.3 視覺切換（6:00-8:00）
- 切換至 `youtube.v2` 模板播放概念影片。
- 利用遙控器或語音指令更換影片，示範 content swap 的低延遲。

### 7.4 成果量化（8:00-10:00）
- 切回 `doc.showcase` 顯示 KPI 區塊，說明部署後的轉換率提升案例。
- 即時帶出 `stats.wall`（若場地允許）展示 live data。

### 7.5 收尾 CTA（10:00-11:00）
- 顯示報價與導入時程，提供 QR Code 讓觀眾掃描索取試用。

---

## 8. 操作面板與參數說明

### 8.1 `doc.showcase` Payload 範例
```json
{
  "template": "doc.showcase",
  "data": {
    "title": "AI2X 多終端展示平台",
    "sections": [
      {
        "id": "overview",
        "label": "產品概述",
        "body": "<p>AI2X 將 AI 協作與多屏編排整合...</p>"
      },
      {
        "id": "value",
        "label": "價值主張",
        "body": "<ul><li>5 分鐘上線</li><li>AI 控制</li></ul>"
      }
    ],
    "highlights": [
      { "icon": "zap", "title": "5 min setup", "desc": "模板化佈署" },
      { "icon": "shield", "title": "Secure", "desc": "全程加密" }
    ],
    "cta": {
      "label": "預約客製展示",
      "link": "https://ai2x.link/demo"
    }
  }
}
```

### 8.2 參數補充
- `sections.body` 支援 Markdown，系統會自動轉 HTML。
- `highlights` 可放 3-6 組，超過 6 組會啟用輪播。
- `cta.link` 若為 `mailto:` 亦可，現場可直接彈出郵件草稿。

---

## 9. 安全與權限控管

1. **Token 管理**：展示環境使用的 token 請設定最小權限，避免誤觸生產資源。
2. **內容審核**：所有展示文件需於前一日經 PM / 法務複核，避免洩露未公開資訊。
3. **裝置註銷**：活動結束立刻將裝置從 workspace 移除，防止後續誤推播。
4. **資料留存**：Telemetry log 保留 30 天供分析，超期自動清除。

---

## 10. 成效衡量（Sample KPI）
| 指標 | 定義 | 目標值（示例） | 資料來源 |
| --- | --- | --- | --- |
| Demo 啟動時間 | 從登入到畫面就緒 | ≤ 5 分鐘 | 操作紀錄 |
| 模板切換成功率 | 無錯誤切換次數 / 總切換 | ≥ 98% | Telemetry |
| 觀眾互動率 | 互動次數 / 參與人數 | ≥ 45% | 表單 + QR 追蹤 |
| 後續洽談轉換 | 展示後進入提案階段的客戶數 | ≥ 30% | CRM |

---

## 11. 常見問題（FAQ）
1. **Q：沒有網路時可以展示嗎？**  
   A：可先把素材打包成離線包，在 Local mode 下播放；但互動與 Telemetry 會暫停。
2. **Q：支援幾台螢幕？**  
   A：單一 workspace 測試過 24 台並行，建議 16 台內可保持流暢。
3. **Q：語音指令可客製語言嗎？**  
   A：目前提供中/英語料庫，可透過 MCP 注入自訂詞彙（需 1-2 天訓練）。
4. **Q：能否嵌入即時資料？**  
   A：可，提供 REST / WebSocket 資料源，模板會自動刷新。

---

## 12. 附錄

### 12.1 版控建議
- 每次修改展示內容請以 `docs/showcase/YYYYMMDD.md` 命名，方便回溯。
- 若需多語系，可用 `docs/showcase/zh-TW.md`, `docs/showcase/en-US.md`。

### 12.2 測試清單（可複製到 Notion 或 Sheet）
1. Display Client 全數登入成功。
2. `doc.showcase` 章節載入無缺字/排版錯亂。
3. 語音指令回應延遲 < 1.5 秒。
4. Telemetry Dashboard 可看到新會話。
5. 結束後清除 demo token。

### 12.3 聯絡窗口（示例）
- 產品：Nova（nova@ai2x.io）
- 技術：Orion（orion@ai2x.io）
- 行銷：Echo（echo@ai2x.io）

---

> **提示**：若要把此文件放入正式模板，可在每章節前加入目錄導覽、插圖或客戶 logo，並以不同層級的段落樣式區分主線敘事與附錄，讓展示看起來更「厚重」且專業。
