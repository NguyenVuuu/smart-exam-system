/**
 * Blockchain Hash Anchoring — Sepolia Testnet
 *
 * Dùng để ghi hash nội dung đề thi lên Ethereum Sepolia testnet,
 * đảm bảo tính toàn vẹn và không thể chỉnh sửa sau khi publish.
 *
 * Luồng: submit đề → hash SHA-256 toàn bộ câu hỏi+đáp án → ghi lên chain → lưu txHash vào DB
 */

import { createHash } from 'crypto'
import { JsonRpcProvider, Wallet, Contract, type ContractTransactionReceipt } from 'ethers'
import { logger } from './logger'

// ABI tối giản — chỉ dùng 2 function: storeHash và getHash
const CONTRACT_ABI = [
  'function storeHash(string examId, string contentHash) external',
  'function getHash(string examId) external view returns (string contentHash, uint256 storedAt)',
  'event HashStored(string indexed examId, string contentHash, uint256 storedAt)',
]

export interface BlockchainAnchorResult {
  txHash: string
  blockNumber: number
  anchoredAt: Date
  etherscanUrl: string
}

export interface BlockchainVerifyResult {
  isValid: boolean
  onChainHash: string | null
  currentHash: string
  storedAt: Date | null
  txHash: string | null
  etherscanUrl: string | null
}

function isConfigured(): boolean {
  return Boolean(
    process.env.BLOCKCHAIN_RPC_URL
    && process.env.BLOCKCHAIN_PRIVATE_KEY
    && process.env.BLOCKCHAIN_CONTRACT_ADDRESS
  )
}

function getProvider() {
  return new JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL)
}

function getSigner() {
  const provider = getProvider()
  return new Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY!, provider)
}

function getContract(withSigner = false) {
  const signerOrProvider = withSigner ? getSigner() : getProvider()
  return new Contract(process.env.BLOCKCHAIN_CONTRACT_ADDRESS!, CONTRACT_ABI, signerOrProvider)
}

/**
 * Serialize object thành JSON canonical — sort keys đệ quy ở mọi level.
 * Đảm bảo cùng dữ liệu luôn cho cùng một chuỗi JSON bất kể thứ tự key.
 */
function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalJson).join(',') + ']'
  }
  const obj = value as Record<string, unknown>
  const sortedKeys = Object.keys(obj).sort()
  const pairs = sortedKeys.map((key) => JSON.stringify(key) + ':' + canonicalJson(obj[key]))
  return '{' + pairs.join(',') + '}'
}

/**
 * Tính SHA-256 hash của nội dung đề thi.
 * Dùng canonical JSON (sort keys đệ quy) để đảm bảo hash ổn định.
 */
export function computeExamHash(examContent: object): string {
  const canonical = canonicalJson(examContent)
  return createHash('sha256').update(canonical, 'utf8').digest('hex')
}

/**
 * Ghi hash lên blockchain (Sepolia testnet).
 * Trả về txHash và thông tin transaction.
 *
 * Nếu biến môi trường chưa được cấu hình (dev/local), trả về null thay vì throw.
 */
export async function anchorExamHash(
  examId: string,
  contentHash: string,
): Promise<BlockchainAnchorResult | null> {
  if (!isConfigured()) {
    logger.warn('Blockchain not configured — skipping anchor', { examId })
    return null
  }

  try {
    const contract = getContract(true)
    const tx = await contract.storeHash(examId, contentHash)
    const receipt: ContractTransactionReceipt = await tx.wait(1) // chờ 1 confirmation

    const txHash = receipt.hash
    const blockNumber = receipt.blockNumber
    const anchoredAt = new Date()
    const etherscanUrl = `https://sepolia.etherscan.io/tx/${txHash}`

    logger.info('Exam hash anchored on blockchain', { examId, txHash, blockNumber })

    return { txHash, blockNumber, anchoredAt, etherscanUrl }
  } catch (error) {
    logger.error('Failed to anchor exam hash on blockchain', { examId, error: String(error) })
    // Không throw — blockchain failure không được block việc publish đề
    return null
  }
}

/**
 * Verify tính toàn vẹn của đề thi bằng cách so sánh hash hiện tại với hash trên chain.
 */
export async function verifyExamHash(
  examId: string,
  currentContentHash: string,
  storedTxHash: string,
): Promise<BlockchainVerifyResult> {
  if (!isConfigured()) {
    return {
      isValid: false,
      onChainHash: null,
      currentHash: currentContentHash,
      storedAt: null,
      txHash: storedTxHash,
      etherscanUrl: null,
    }
  }

  try {
    const contract = getContract(false)
    const [onChainHash, storedAtRaw] = await contract.getHash(examId) as [string, bigint]

    const isValid = onChainHash === currentContentHash && onChainHash.length > 0
    const storedAt = storedAtRaw > 0n ? new Date(Number(storedAtRaw) * 1000) : null
    const etherscanUrl = storedTxHash ? `https://sepolia.etherscan.io/tx/${storedTxHash}` : null

    return { isValid, onChainHash, currentHash: currentContentHash, storedAt, txHash: storedTxHash, etherscanUrl }
  } catch (error) {
    logger.error('Failed to verify exam hash from blockchain', { examId, error: String(error) })
    return {
      isValid: false,
      onChainHash: null,
      currentHash: currentContentHash,
      storedAt: null,
      txHash: storedTxHash,
      etherscanUrl: storedTxHash ? `https://sepolia.etherscan.io/tx/${storedTxHash}` : null,
    }
  }
}
