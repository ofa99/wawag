# Points System Fix - Complete Walkthrough

## 問題總結
會員掃描 QR Code 後，點數無法增加。經過調查發現有多個問題：

## 修復過程

### 1. Cloudflare 部署失敗
**問題**: 使用 `firebase-admin` (Node.js SDK) 在 Edge Runtime 環境中無法運行。

**解決方案**: 
- 建立 `lib/serviceAccountAuth.js` 使用 `jose` 庫簽署 JWT，取得 Google OAuth2 Access Token
- 擴充 `lib/firestoreRest.js` 支援交易操作 (beginTransaction, commit, rollback)
- 將 `claim-code`, `admin/update-points`, `transferPoints` 三個 API 改用 REST API + Service Account 驗證

### 2. 資料庫欄位名稱錯誤
**問題**: API 查詢時使用 `code` 欄位，但資料庫實際欄位名稱是 `codeId`。

**解決方案**: 
- 使用檢查腳本 `scripts/inspect_db.js` 確認資料庫結構
- 修正查詢條件從 `field: { fieldPath: "code" }` 改為 `field: { fieldPath: "codeId" }`

### 3. 前後端參數不一致
**問題**: 
- 前端 (`scan/page.jsx`) 發送的 payload 使用 `codeId` 作為 key
- 後端 (`claim-code/route.js`) 期望接收 `code` 作為 key

**解決方案**:
- 修改後端接收參數為 `const { codeId: requestedCode, uid } = await request.json()`
- 使用 `requestedCode` 避免與後續從資料庫取得的文件 ID (`codeId`) 衝突
- 更新所有使用該變數的地方

## 修改的檔案

### 新增檔案
- `lib/serviceAccountAuth.js` - Service Account JWT 簽署與 Token 取得
- `scripts/inspect_db.js` - 資料庫檢查工具

### 修改檔案
- `lib/firestoreRest.js` - 新增交易支援
- `app/api/claim-code/route.js` - 改用 REST API，修正欄位名稱與參數
- `app/api/admin/update-points/route.js` - 改用 REST API
- `app/api/transferPoints/route.js` - 改用 REST API

## 驗證步驟
1. ✅ Cloudflare 部署成功（無 Node.js 相依性）
2. ✅ 掃描 QR Code 可正確查詢代碼
3. ✅ 點數正確增加到使用者帳戶
4. ✅ 交易記錄正確建立
5. ✅ 代碼標記為已使用

## 技術重點
- **Edge Runtime 相容性**: 使用純 JavaScript + Fetch API 實作，無 Node.js 相依
- **Service Account 驗證**: 透過 JWT 簽署取得管理員權限
- **交易一致性**: 使用 Firestore REST API 的交易機制確保資料一致性
- **變數命名**: 避免 `codeId` 重複宣告，使用 `requestedCode` 區分輸入與文件 ID
