import type { Signer } from '@ethersproject/abstract-signer'
import type { Contract } from '@ethersproject/contracts'
import { Contract as EthersContract } from '@ethersproject/contracts'
import { COIN_SWAP_ABI } from 'uniswap/src/abis/coin_swap'
import { ERC20_SWAP_ABI } from 'uniswap/src/abis/erc20swap'
import { satoshiToWei } from 'uniswap/src/features/lds-bridge/utils/conversion'
import { prefix0x } from 'uniswap/src/features/lds-bridge/utils/hex'

export type BuildEvmClaimTxParams = {
  signer: Signer
  contractAddress: string
  preimageHash: string
  claimAddress: string | undefined
  timeoutBlockHeight: number
  amountSatoshis: number
}

export type EvmLockupTransaction = {
  contract: Contract
  tx: Awaited<ReturnType<Contract['lock']>>
  hash: string
}

export async function buildEvmLockupTx(params: BuildEvmClaimTxParams): Promise<EvmLockupTransaction> {
  const { signer, contractAddress, preimageHash, claimAddress, timeoutBlockHeight, amountSatoshis } = params

  if (!claimAddress) {
    throw new Error('claimAddress is required for EVM lockup transaction')
  }

  const contract = new EthersContract(contractAddress, COIN_SWAP_ABI, signer) as Contract
  const preimageHashBytes32 = prefix0x(preimageHash)
  const value = satoshiToWei(amountSatoshis)

  const tx = await contract.lock(preimageHashBytes32, claimAddress, timeoutBlockHeight, {
    value,
  })

  return {
    contract,
    tx,
    hash: tx.hash,
  }
}

const ERC20_TOKEN_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
]

// MaxUint256 for unlimited approvals
const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')

// Simplified ABI for swap contract operations
const SWAP_CONTRACT_ABI = [
  'function lock(bytes32 preimageHash, uint256 amount, address tokenAddress, address claimAddress, uint256 timelock)',
  'function claim(bytes32 preimage, uint256 amount, address tokenAddress, address refundAddress, uint256 timelock)',
  'function refund(bytes32 preimageHash, uint256 amount, address tokenAddress, address claimAddress, uint256 timelock)',
  'function refund(bytes32 preimageHash, uint256 amount, address tokenAddress, address claimAddress, address refundAddress, uint256 timelock)',
]

export async function buildErc20LockupTx(params: {
  signer: Signer
  contractAddress: string
  tokenAddress: string
  preimageHash: string
  amount: bigint
  claimAddress: string
  timelock: number
}): Promise<{ hash: string }> {
  const { signer, contractAddress, tokenAddress, preimageHash, amount, claimAddress, timelock } = params

  const tokenContract = new EthersContract(tokenAddress, ERC20_TOKEN_ABI, signer)
  const swapContract = new EthersContract(contractAddress, SWAP_CONTRACT_ABI, signer)

  // Check current allowance and only approve if needed
  const ownerAddress = await signer.getAddress()
  const currentAllowance = await tokenContract.allowance(ownerAddress, contractAddress)

  if (currentAllowance.toBigInt() < amount) {
    // eslint-disable-next-line no-console
    console.log('[ERC20 Lock] Allowance insufficient, approving unlimited...', {
      currentAllowance: currentAllowance.toString(),
      requiredAmount: amount.toString(),
    })

    // For USDT and similar tokens: reset allowance to 0 first if there's a non-zero allowance
    // This prevents "execution reverted" errors on tokens that don't allow changing non-zero allowances
    if (!currentAllowance.isZero()) {
      // eslint-disable-next-line no-console
      console.log('[ERC20 Lock] Resetting existing allowance to 0 (required for USDT and similar tokens)')
      const resetTx = await tokenContract.approve(contractAddress, 0)
      await resetTx.wait()
      // eslint-disable-next-line no-console
      console.log('[ERC20 Lock] Allowance reset confirmed')
    }

    // Approve unlimited (MaxUint256) to avoid repeated approvals for future transactions
    const approveTx = await tokenContract.approve(contractAddress, MAX_UINT256)
    await approveTx.wait()
    // eslint-disable-next-line no-console
    console.log('[ERC20 Lock] Unlimited approval confirmed')
  } else {
    // eslint-disable-next-line no-console
    console.log('[ERC20 Lock] Allowance sufficient, skipping approval', {
      currentAllowance: currentAllowance.toString(),
      requiredAmount: amount.toString(),
    })
  }

  // Lock
  const lockTx = await swapContract.lock(prefix0x(preimageHash), amount, tokenAddress, claimAddress, timelock)

  return { hash: lockTx.hash }
}

export async function claimErc20Swap(params: {
  signer: Signer
  contractAddress: string
  tokenAddress: string
  preimage: string
  amount: bigint
  refundAddress: string
  timelock: number
}): Promise<string> {
  const { signer, contractAddress, tokenAddress, preimage, amount, refundAddress, timelock } = params

  const swapContract = new EthersContract(contractAddress, SWAP_CONTRACT_ABI, signer)

  const tx = await swapContract.claim(prefix0x(preimage), amount, tokenAddress, refundAddress, timelock)

  const receipt = await tx.wait()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return receipt.hash
}

export async function refundCoinSwap(params: {
  signer: Signer
  contractAddress: string
  preimageHash: string
  amount: bigint
  claimAddress: string
  timelock: number
}): Promise<string> {
  const { signer, contractAddress, preimageHash, amount, claimAddress, timelock } = params

  const contract = new EthersContract(contractAddress, COIN_SWAP_ABI, signer) as Contract

  // For native coin swaps (cBTC), use the 4-parameter refund function explicitly
  const tx = await contract['refund(bytes32,uint256,address,uint256)'](
    prefix0x(preimageHash),
    amount,
    claimAddress,
    timelock,
  )

  const receipt = await tx.wait()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return receipt.hash
}

export async function refundErc20Swap(params: {
  signer: Signer
  contractAddress: string
  tokenAddress: string
  preimageHash: string
  amount: bigint
  claimAddress: string
  refundAddress: string
  timelock: number
}): Promise<string> {
  const { signer, contractAddress, tokenAddress, preimageHash, amount, claimAddress, refundAddress, timelock } = params

  const swapContract = new EthersContract(contractAddress, SWAP_CONTRACT_ABI, signer)

  // For ERC20 token swaps, use the 6-parameter refund function (with refundAddress)
  const tx = await swapContract['refund(bytes32,uint256,address,address,address,uint256)'](
    prefix0x(preimageHash),
    amount,
    tokenAddress,
    claimAddress,
    refundAddress,
    timelock,
  )

  const receipt = await tx.wait()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return receipt.hash
}
