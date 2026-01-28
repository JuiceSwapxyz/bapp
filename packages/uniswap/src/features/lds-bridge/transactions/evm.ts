import type { Signer } from '@ethersproject/abstract-signer'
import type { Contract } from '@ethersproject/contracts'
import { Contract as EthersContract } from '@ethersproject/contracts'
import { COIN_SWAP_ABI } from 'uniswap/src/abis/coin_swap'
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

const ERC20_SWAP_ABI = [
  'function lock(bytes32 preimageHash, uint256 amount, address tokenAddress, address claimAddress, uint256 timelock)',
  'function claim(bytes32 preimage, uint256 amount, address tokenAddress, address refundAddress, uint256 timelock)',
]

const ERC20_TOKEN_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
]

export type CheckErc20AllowanceParams = {
  signer: Signer
  contractAddress: string
  tokenAddress: string
  amount: bigint
}

export type CheckErc20AllowanceResult = {
  needsApproval: boolean
  currentAllowance: bigint
}

/**
 * Check if ERC20 token approval is needed for LDS Bridge
 */
export async function checkErc20Allowance(params: CheckErc20AllowanceParams): Promise<CheckErc20AllowanceResult> {
  const { signer, contractAddress, tokenAddress, amount } = params

  const tokenContract = new EthersContract(tokenAddress, ERC20_TOKEN_ABI, signer)
  const ownerAddress = await signer.getAddress()
  const currentAllowance = await tokenContract.allowance(ownerAddress, contractAddress)
  const currentAllowanceBigInt = currentAllowance.toBigInt()

  return {
    needsApproval: currentAllowanceBigInt < amount,
    currentAllowance: currentAllowanceBigInt,
  }
}

export type ApproveErc20Params = {
  signer: Signer
  contractAddress: string
  tokenAddress: string
  amount: bigint
}

export type ApproveErc20Result = {
  tx: Awaited<ReturnType<Contract['approve']>>
  hash: string
}

/**
 * Approve ERC20 token for LDS Bridge contract (does not wait for confirmation)
 */
export async function approveErc20ForLdsBridge(params: ApproveErc20Params): Promise<ApproveErc20Result> {
  const { signer, contractAddress, tokenAddress, amount } = params

  const tokenContract = new EthersContract(tokenAddress, ERC20_TOKEN_ABI, signer)
  const tx = await tokenContract.approve(contractAddress, amount)

  return { tx, hash: tx.hash }
}

/**
 * Build ERC20 lockup transaction for LDS Bridge.
 * NOTE: This function assumes approval has already been done if needed.
 * Use checkErc20Allowance and approveErc20ForLdsBridge separately for granular UI feedback.
 */
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

  const swapContract = new EthersContract(contractAddress, ERC20_SWAP_ABI, signer)

  // Lock (approval should already be done)
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

  const swapContract = new EthersContract(contractAddress, ERC20_SWAP_ABI, signer)

  const tx = await swapContract.claim(prefix0x(preimage), amount, tokenAddress, refundAddress, timelock)

  const receipt = await tx.wait()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return receipt.hash
}
