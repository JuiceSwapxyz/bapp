import { Project, SourceFile, TypeLiteralNode } from 'ts-morph'

const project = new Project()

const path = './src/data/tradingApi/__generated__/models'

// Request types
const approvalRequestFile = project.addSourceFileAtPath(`${path}/ApprovalRequest.ts`)
const createSendRequestFile = project.addSourceFileAtPath(`${path}/CreateSendRequest.ts`)
const createSwapRequestFile = project.addSourceFileAtPath(`${path}/CreateSwapRequest.ts`)
const quoteRequestFile = project.addSourceFileAtPath(`${path}/QuoteRequest.ts`)
const checkApprovalLPRequestFile = project.addSourceFileAtPath(`${path}/CheckApprovalLPRequest.ts`)
const requestFiles = [approvalRequestFile, createSendRequestFile, createSwapRequestFile, quoteRequestFile]

// Response types
const approvalResponseFile = project.addSourceFileAtPath(`${path}/ApprovalResponse.ts`)
const createSwapResponseFile = project.addSourceFileAtPath(`${path}/CreateSwapResponse.ts`)
const createSendResponseFile = project.addSourceFileAtPath(`${path}/CreateSendResponse.ts`)
const classicQuoteFile = project.addSourceFileAtPath(`${path}/ClassicQuote.ts`)
const bridgeQuoteFile = project.addSourceFileAtPath(`${path}/BridgeQuote.ts`)
const createLPPositionResponseFile = project.addSourceFileAtPath(`${path}/CreateLPPositionResponse.ts`)
const responseFiles = [approvalResponseFile, createSwapResponseFile, createSendResponseFile, classicQuoteFile]

// Enums
const routingFile = project.addSourceFileAtPath(`${path}/Routing.ts`)
const chainIdFile = project.addSourceFileAtPath(`${path}/ChainId.ts`)
const err404File = project.addSourceFileAtPath(`${path}/Err404.ts`)

function addImport(file: SourceFile, importName: string): void {
  if (!file.getImportDeclaration((imp) => imp.getModuleSpecifierValue() === '../../types')) {
    file.addImportDeclaration({
      namedImports: [importName],
      moduleSpecifier: '../../types',
    })
  } else {
    const existingImport = file.getImportDeclaration((imp) => imp.getModuleSpecifierValue() === '../../types')
    if (
      existingImport &&
      !existingImport.getNamedImports().some((namedImport) => namedImport.getName() === importName)
    ) {
      existingImport.addNamedImport(importName)
    }
  }
}

function modifyType(
  file: SourceFile,
  typeName: string,
  newProperties: { name: string; type: string; isOptional?: boolean }[],
): void {
  const typeAlias = file.getTypeAlias(typeName)
  if (typeAlias) {
    const typeNode = typeAlias.getTypeNode()
    if (typeNode && TypeLiteralNode.isTypeLiteral(typeNode)) {
      newProperties.forEach((prop) => {
        const existingProperty = typeNode.getProperty(prop.name)
        if (!existingProperty) {
          typeNode.addProperty({
            name: prop.name,
            type: prop.type,
            hasQuestionToken: prop.isOptional,
          })
          console.log(`Added property ${prop.name} to ${typeName}`)
        } else {
          existingProperty.setType(prop.type)
          console.log(`Updated property ${prop.name} in ${typeName}`)
        }
      })
    } else {
      console.log(`Type ${typeName} is not an object type`)
    }
  } else {
    console.log(`Type ${typeName} not found`)
  }
}

function addEnumMember(file: SourceFile, enumName: string, newMember: { name: string; value: string | number }): void {
  const enumDecl = file.getEnum(enumName)

  if (!enumDecl) {
    console.log(`Enum ${enumName} not found in ${file.getBaseName()}`)
    return
  }

  // Check for existing member using both quoted and unquoted names
  const quotedName = `'${newMember.name}'`
  const existing = enumDecl.getMember(newMember.name) || enumDecl.getMember(quotedName)

  if (existing) {
    console.log(`Enum member ${newMember.name} already exists in ${enumName}`)
    return
  }

  const initializer = typeof newMember.value === 'string' ? `"${newMember.value}"` : String(newMember.value)

  enumDecl.addMember({
    name: quotedName,
    initializer,
  })

  console.log(`Added enum member ${newMember.name} = ${initializer} to ${enumName}`)
}

function addNestedEnumMember(
  file: SourceFile,
  namespaceName: string,
  enumName: string,
  newMember: { name: string; value: string | number },
): void {
  const namespace = file.getModule(namespaceName)

  if (!namespace) {
    console.log(`Namespace ${namespaceName} not found in ${file.getBaseName()}`)
    return
  }

  const enumDecl = namespace.getEnum(enumName)

  if (!enumDecl) {
    console.log(`Enum ${enumName} not found in namespace ${namespaceName}`)
    return
  }

  const existing = enumDecl.getMember(newMember.name)

  if (existing) {
    console.log(`Enum member ${newMember.name} already exists in ${namespaceName}.${enumName}`)
    return
  }

  const initializer = typeof newMember.value === 'string' ? `'${newMember.value}'` : String(newMember.value)

  enumDecl.addMember({
    name: newMember.name,
    initializer,
  })

  console.log(`Added enum member ${newMember.name} = ${initializer} to ${namespaceName}.${enumName}`)
}

// Modify the request interfaces
requestFiles.forEach((file) => {
  addImport(file, 'GasStrategy')
  modifyType(file, file.getBaseName().replace('.ts', ''), [
    { name: 'gasStrategies', type: 'GasStrategy[]', isOptional: true },
  ])
})

addImport(createSwapRequestFile, 'CustomSwapDataForRequest')
modifyType(createSwapRequestFile, 'CreateSwapRequest', [
  { name: 'customSwapData', type: 'CustomSwapDataForRequest', isOptional: true },
])

// Add tokenId to CheckApprovalLPRequest for NFT approval during increase/decrease liquidity
modifyType(checkApprovalLPRequestFile, 'CheckApprovalLPRequest', [
  { name: 'tokenId', type: 'number', isOptional: true },
])

// Modify the response interfaces
responseFiles.forEach((file) => {
  addImport(file, 'GasEstimate')
  modifyType(file, file.getBaseName().replace('.ts', ''), [
    { name: 'gasEstimates', type: 'GasEstimate[]', isOptional: true },
  ])
})

addImport(bridgeQuoteFile, 'LightningBridgeDirection')
addImport(bridgeQuoteFile, 'BitcoinBridgeDirection')
addImport(bridgeQuoteFile, 'Erc20ChainSwapDirection')
addImport(bridgeQuoteFile, 'WbtcBridgeDirection')
modifyType(bridgeQuoteFile, 'BridgeQuote', [
  {
    name: 'direction',
    type: 'LightningBridgeDirection | BitcoinBridgeDirection | Erc20ChainSwapDirection | WbtcBridgeDirection',
    isOptional: true,
  },
])

// Add createPool field to CreateLPPositionResponse for Gateway pool creation
modifyType(createLPPositionResponseFile, 'CreateLPPositionResponse', [
  { name: 'createPool', type: 'TransactionRequest', isOptional: true },
])

// Add new enum members
addEnumMember(routingFile, 'Routing', { name: 'JUPITER', value: 'JUPITER' })
addEnumMember(routingFile, 'Routing', { name: 'BITCOIN_BRIDGE', value: 'BITCOIN_BRIDGE' })
addEnumMember(routingFile, 'Routing', { name: 'LN_BRIDGE', value: 'LN_BRIDGE' })
addEnumMember(routingFile, 'Routing', { name: 'ERC20_CHAIN_SWAP', value: 'ERC20_CHAIN_SWAP' })
addEnumMember(routingFile, 'Routing', { name: 'WBTC_BRIDGE', value: 'WBTC_BRIDGE' })
addEnumMember(chainIdFile, 'ChainId', { name: '_4114', value: 4114 })
addEnumMember(chainIdFile, 'ChainId', { name: '_5115', value: 5115 })
addEnumMember(chainIdFile, 'ChainId', { name: '_21_000_000', value: 21000000 })
addEnumMember(chainIdFile, 'ChainId', { name: '_21_000_001', value: 21000001 })
addNestedEnumMember(err404File, 'Err404', 'errorCode', {
  name: 'QUOTE_AMOUNT_TOO_HIGH',
  value: 'QuoteAmountTooHighError',
})

// Save the changes
requestFiles.forEach((file) => {
  file.saveSync()
})
responseFiles.forEach((file) => {
  file.saveSync()
})
checkApprovalLPRequestFile.saveSync()
bridgeQuoteFile.saveSync()
createLPPositionResponseFile.saveSync()
routingFile.saveSync()
chainIdFile.saveSync()
err404File.saveSync()

console.log('Trading API types have been updated')
