# Hướng dẫn Setup Blockchain (Sepolia Testnet)

Tính năng bảo mật đề thi bằng blockchain dùng **Ethereum Sepolia Testnet** — miễn phí, không cần tiền thật.

---

## Tổng quan

Khi giảng viên publish đề thi (DRAFT → READY):
1. Backend tính **SHA-256 hash** toàn bộ nội dung đề (câu hỏi + đáp án + điểm)
2. Hash được **ghi lên smart contract** trên Sepolia
3. `contentHash` và `blockchainTxHash` được lưu vào bảng `Exam`
4. Bất kỳ lúc nào cũng có thể **verify**: hash lại đề hiện tại → so sánh với hash trên chain

---

## Bước 1: Cài công cụ

```bash
npm install -g @remix-project/remixd   # nếu muốn dùng Remix IDE local
```

Hoặc dùng trực tiếp **Remix IDE** online: https://remix.ethereum.org

---

## Bước 2: Tạo ví Metamask

1. Cài extension [Metamask](https://metamask.io/download/)
2. Tạo ví mới → lưu lại **seed phrase** (12 từ)
3. Thêm mạng **Sepolia**: Settings → Networks → Add Network → Sepolia Test Network
4. Copy **private key** của account: Account Details → Show Private Key

> ⚠️ **QUAN TRỌNG**: Private key chỉ dùng cho testnet. Không bao giờ dùng ví này trên mainnet.

---

## Bước 3: Lấy ETH test miễn phí (Faucet)

Truy cập một trong các faucet sau, paste địa chỉ ví vào và nhận ETH test:

- https://sepoliafaucet.com
- https://faucet.sepolia.dev
- https://www.alchemy.com/faucets/ethereum-sepolia

Cần khoảng **0.1 ETH Sepolia** để chạy nhiều lần.

---

## Bước 4: Deploy Smart Contract

### Smart Contract (Solidity)

Tạo file `ExamHashRegistry.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * ExamHashRegistry
 * Smart contract lưu hash nội dung đề thi để đảm bảo tính toàn vẹn.
 * Mỗi examId chỉ được ghi hash một lần (immutable sau khi ghi).
 */
contract ExamHashRegistry {
    struct HashRecord {
        string  contentHash;
        uint256 storedAt;
        address storedBy;
    }

    mapping(string => HashRecord) private _records;

    event HashStored(
        string indexed examId,
        string  contentHash,
        uint256 storedAt,
        address storedBy
    );

    /**
     * Ghi hash của đề thi lên blockchain.
     * Chỉ ghi được một lần — không cho phép ghi đè.
     */
    function storeHash(string calldata examId, string calldata contentHash) external {
        require(bytes(_records[examId].contentHash).length == 0, "Hash already stored for this exam");
        require(bytes(examId).length > 0, "examId cannot be empty");
        require(bytes(contentHash).length > 0, "contentHash cannot be empty");

        _records[examId] = HashRecord({
            contentHash: contentHash,
            storedAt: block.timestamp,
            storedBy: msg.sender
        });

        emit HashStored(examId, contentHash, block.timestamp, msg.sender);
    }

    /**
     * Đọc hash đã lưu của một đề thi.
     */
    function getHash(string calldata examId) external view returns (
        string memory contentHash,
        uint256 storedAt
    ) {
        HashRecord memory record = _records[examId];
        return (record.contentHash, record.storedAt);
    }

    /**
     * Kiểm tra đề thi đã được anchor chưa.
     */
    function isAnchored(string calldata examId) external view returns (bool) {
        return bytes(_records[examId].contentHash).length > 0;
    }
}
```

### Deploy bằng Remix IDE

1. Truy cập https://remix.ethereum.org
2. Tạo file mới → paste code trên
3. Tab **Solidity Compiler** → chọn version `0.8.19` → bấm **Compile**
4. Tab **Deploy & Run**:
   - Environment: **Injected Provider - MetaMask**
   - Đảm bảo MetaMask đang ở mạng **Sepolia**
   - Bấm **Deploy**
5. MetaMask sẽ popup → xác nhận transaction
6. Sau khi deploy: copy **contract address** từ "Deployed Contracts"

---

## Bước 5: Lấy RPC URL (Infura hoặc Alchemy)

### Dùng Infura (miễn phí):
1. Đăng ký tại https://app.infura.io
2. Tạo project mới → chọn **Ethereum**
3. Copy **Sepolia endpoint**: `https://sepolia.infura.io/v3/YOUR_PROJECT_ID`

### Dùng Alchemy (miễn phí):
1. Đăng ký tại https://alchemy.com
2. Tạo app → chọn **Ethereum Sepolia**
3. Copy **HTTPS URL**: `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`

---

## Bước 6: Cấu hình .env

Thêm vào file `.env` của backend:

```env
# Blockchain (Ethereum Sepolia Testnet)
BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
BLOCKCHAIN_PRIVATE_KEY=your_wallet_private_key_without_0x
BLOCKCHAIN_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

> **Lưu ý `BLOCKCHAIN_PRIVATE_KEY`**: Lấy từ MetaMask → Account Details → Export Private Key. Paste giá trị hex, **không cần** prefix `0x`.

---

## Kiểm tra hoạt động

### 1. Test không có blockchain (local hash only)
Không cần cấu hình `.env` — hệ thống vẫn hoạt động, chỉ lưu `contentHash` vào DB mà không ghi lên chain.

Publish một đề thi → kiểm tra DB:
```sql
SELECT id, title, content_hash, blockchain_tx_hash, blockchain_anchored_at
FROM "Exam"
WHERE status = 'READY';
```

Kết quả mong đợi: `content_hash` có giá trị, `blockchain_tx_hash` là `NULL`.

### 2. Test với blockchain đã cấu hình
Sau khi cấu hình đủ 3 biến môi trường:

1. Publish đề thi → chờ khoảng 15–30 giây (Sepolia cần xác nhận)
2. Kiểm tra DB: `blockchain_tx_hash` có giá trị
3. Truy cập `https://sepolia.etherscan.io/tx/{txHash}` → thấy transaction
4. Trên UI: trang chi tiết đề thi → block "Bảo mật đề thi" → bấm **Kiểm tra toàn vẹn**

### 3. Test giả lập bị tấn công
1. Publish đề thi (đảm bảo đã có `contentHash`)
2. Vào DB, sửa trực tiếp nội dung một câu hỏi:
   ```sql
   UPDATE "ExamQuestion"
   SET content = content || ' [BỊ SỬA]'
   WHERE "examId" = 'your-exam-id'
   LIMIT 1;
   ```
3. Quay lại UI → bấm **Kiểm tra toàn vẹn**
4. Kết quả: `⚠️ Hash nội dung KHÔNG khớp`

---

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/teacher/exams/:id/submit` | Publish đề (tự động anchor hash) |
| `GET` | `/teacher/exams/:id/integrity` | Verify tính toàn vẹn |

### Response mẫu GET `/teacher/exams/:id/integrity`

**Khi nguyên vẹn:**
```json
{
  "success": true,
  "data": {
    "examId": "abc-123",
    "status": "VALID",
    "currentHash": "9f3c...",
    "onChainHash": "9f3c...",
    "contentHashMatch": true,
    "blockchainTxHash": "0x4a3b...",
    "etherscanUrl": "https://sepolia.etherscan.io/tx/0x4a3b...",
    "anchoredAt": "2026-10-26T09:15:32.000Z",
    "message": "✅ Đề thi nguyên vẹn — hash khớp với bản ghi trên blockchain."
  }
}
```

**Khi bị sửa:**
```json
{
  "success": true,
  "data": {
    "examId": "abc-123",
    "status": "TAMPERED",
    "currentHash": "7d2a...",
    "onChainHash": "9f3c...",
    "contentHashMatch": false,
    "message": "⚠️ Hash nội dung KHÔNG khớp với blockchain — đề thi có thể đã bị chỉnh sửa!"
  }
}
```
