import { CurrencyAmount } from '@juiceswapxyz/sdk-core'
import { Interface } from 'ethers/lib/utils'
import type { providers } from 'ethers'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import wethAbi from 'uniswap/src/abis/weth.json'

// WcBTC address on Citrea Testnet
const WCBTC_ADDRESS_CITREA_TESTNET = '0x4370e27F7d91D9341bFf232d7Ee8bdfE3a9933a0'

const wethInterface = new Interface(wethAbi)

export function buildCitreaWrapTransaction({
  amount,
  wrapType,
  chainId,
  walletAddress,
}: {
  amount: CurrencyAmount<any>
  wrapType: WrapType
  chainId: number
  walletAddress: string
}): providers.TransactionRequest | undefined {
  console.log('buildCitreaWrapTransaction called:', {
    amount: amount.toExact(),
    quotient: amount.quotient.toString(),
    decimals: amount.currency.decimals,
    wrapType,
    chainId,
    walletAddress,
    currency: {
      symbol: amount.currency.symbol,
      name: amount.currency.name,
      address: amount.currency.isToken ? amount.currency.address : 'Native'
    }
  })

  // Der quotient ist bereits in Wei (kleinste Einheit), das ist korrekt für die value
  const valueInWei = amount.quotient.toString()
  const valueInHex = '0x' + BigInt(valueInWei).toString(16)
  console.log('Using value in Wei:', valueInWei, '= ', (parseInt(valueInWei) / Math.pow(10, amount.currency.decimals)).toFixed(6), 'cBTC')
  console.log('Value in hex:', valueInHex)

  // Verify the conversion
  const backToDecimal = parseInt(valueInHex, 16)
  console.log('Hex back to decimal verification:', backToDecimal, 'matches original:', backToDecimal === parseInt(valueInWei))

  // Only handle Citrea testnet
  if (chainId !== UniverseChainId.CitreaTestnet) {
    console.log('Wrong chainId, expected:', UniverseChainId.CitreaTestnet, 'got:', chainId)
    return undefined
  }

  // Only handle wrap/unwrap operations
  if (wrapType === WrapType.NotApplicable) {
    console.log('WrapType.NotApplicable, returning undefined')
    return undefined
  }

  const isWrap = wrapType === WrapType.Wrap
  const wcBtcAddress = WCBTC_ADDRESS_CITREA_TESTNET

  if (isWrap) {
    // Wrapping: call deposit() with value
    const gasLimit = 50000
    const gasPrice = 10000000000 // 10 gwei (matching our gas fee calculation)
    const txRequest = {
      to: wcBtcAddress,
      data: wethInterface.encodeFunctionData('deposit'),
      value: valueInHex, // Use the hex value for ethers compatibility
      from: walletAddress,
      chainId: chainId,
      gasLimit: '0x' + gasLimit.toString(16), // Convert to hex
      gasPrice: '0x' + gasPrice.toString(16), // Convert to hex (10 gwei)
    }
    console.log('Built wrap transaction with gas:', txRequest)
    return txRequest
  } else {
    // Unwrapping: call withdraw(amount)
    const gasLimit = 50000
    const gasPrice = 10000000000 // 10 gwei (matching our gas fee calculation)
    const txRequest = {
      to: wcBtcAddress,
      data: wethInterface.encodeFunctionData('withdraw', [valueInWei]), // Use decimal for function parameter
      value: '0x0', // Hex format for no value
      from: walletAddress,
      chainId: chainId,
      gasLimit: '0x' + gasLimit.toString(16), // Convert to hex
      gasPrice: '0x' + gasPrice.toString(16), // Convert to hex (10 gwei)
    }
    console.log('Built unwrap transaction with gas:', txRequest)
    return txRequest
  }
}