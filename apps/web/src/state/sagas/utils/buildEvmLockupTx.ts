import type { Signer } from '@ethersproject/abstract-signer'
import type { Contract } from '@ethersproject/contracts'
import { Contract as EthersContract } from '@ethersproject/contracts'

const COIN_SWAP_ABI = [
  {
    inputs: [
      { name: 'preimageHash', type: 'bytes32' },
      { name: 'claimAddress', type: 'address' },
      { name: 'timeoutBlockHeight', type: 'uint256' },
    ],
    name: 'lock',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
] as const

export type BuildEvmLockupTxParams = {
  signer: Signer
  contractAddress: string
  preimageHash: string
  claimAddress: string
  timeoutBlockHeight: number
  amountSatoshis: number
}

export type EvmLockupTransaction = {
  contract: Contract
  tx: Awaited<ReturnType<Contract['lock']>>
  hash: string
}

const satoshiToWei = (satoshis: number): bigint => {
  const weiFactor = BigInt(10 ** 10)
  return BigInt(satoshis) * weiFactor
}

export const prefix0x = (val: string): string => {
  return val.startsWith('0x') ? val : `0x${val}`
}

export const buildEvmLockupTx = async (params: BuildEvmLockupTxParams): Promise<EvmLockupTransaction> => {
  const { signer, contractAddress, preimageHash, claimAddress, timeoutBlockHeight, amountSatoshis } = params

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
