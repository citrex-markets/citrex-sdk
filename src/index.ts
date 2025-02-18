import type { Logger } from 'pino'
import type { Chain, PrivateKeyAccount, PublicClient, WalletClient } from 'viem'
import type {
  AccountHealth,
  AccountHealthReturnType,
  Balance,
  BalancesReturnType,
  BaseApiResponse,
  CalculateMarginRequirement,
  CalculateMarginRequirementReturnType,
  CancelOrder,
  CancelOrderReturnType,
  CancelOrders,
  CancelOrdersReturnType,
  Config,
  DepositReturnType,
  EIP712Domain,
  HexString,
  KlineOptionalArgs,
  KlinesResponse,
  KlinesReturnType,
  MarginAssetKey,
  OpenOrdersReturnType,
  Order,
  OrderArgs,
  OrderBookResponse,
  OrderBookReturnType,
  PlaceOrderReturnType,
  Position,
  PositionsReturnType,
  ProductResponse,
  ProductReturnType,
  ProductSymbol,
  ProductsResponse,
  ProductsReturnType,
  ReplacementOrderArgs,
  ServerTimeResponse,
  ServerTimeReturnType,
  TickerResponse,
  TickerReturnType,
  TradeHistoryResponse,
  TradeHistoryReturnType,
  WithdrawReturnType,
} from './types'

import logger, { levels } from 'pino'
import {
  BaseError,
  ContractFunctionRevertedError,
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  parseUnits,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { eip712WalletActions } from 'viem/zksync'

import CIAO from './ABI/CIAO'
import EIP712 from './ABI/EIP712'
import ERC20 from './ABI/ERC20'
import API_URL from './constants/api'
import CHAINS from './constants/chains'
import CIAO_ADDRESS from './constants/ciao'
import MARGIN_ASSETS from './constants/marginAssets'
import { UNKNOWN_ERROR } from './constants/messages'
import { THIRTY_DAYS } from './constants/time'
import VERIFIER_ADDRESS from './constants/verifier'
import { Environment, Interval, MarginAssets, OrderType, TimeInForce } from './enums'
import sleep from './utils/sleep'
import toRounded from './utils/toRounded'

class CitrexSDK {
  readonly account: PrivateKeyAccount
  readonly apiUrl: string
  readonly chain: Chain
  readonly ciaoAddress: HexString
  readonly domain: EIP712Domain
  readonly environment: Environment
  readonly #logger: Logger
  readonly logs: {}[]
  readonly marginAssets: Record<MarginAssetKey, HexString>
  readonly publicClient: PublicClient
  readonly rpc: string
  subAccountId: number
  readonly verifierAddress: HexString
  readonly #walletClient: WalletClient

  /**
   * Creates a new instance of the Citrex SDK.
   *
   * See {@link https://citrex.readme.io/} for detailed documentation.
   *
   * @param privateKey The private key used to sign transactions.
   * @param [config] (Optional) Configuration options.
   * @param [config.debug] (Optional) Enable debug mode.
   * @param [config.environment] (Optional) The environment to use (default: testnet). Use the {@link Environment} enum.
   * @param [config.rpc] (Optional) The RPC URL to use.
   * @param [config.subAccountId] (Optional) The sub-account ID to use (default: 1).
   * @throws {Error} If the provided private key is invalid.
   */
  constructor(privateKey: HexString, config?: Config) {
    const debug = config?.debug || false
    const environment = config?.environment || Environment.TESTNET
    const rpc = config?.rpc || CHAINS[environment].rpcUrls.default.http[0]
    const subAccountId = config?.subAccountId ?? 1

    const account = privateKeyToAccount(privateKey)
    const chain = CHAINS[environment]
    const transport = http(rpc)
    const verifyingContract = VERIFIER_ADDRESS[environment]

    this.account = account
    this.apiUrl = API_URL[environment]
    this.chain = chain
    this.ciaoAddress = CIAO_ADDRESS[environment]
    this.domain = {
      name: 'ciao',
      version: '0.0.0',
      chainId: BigInt(chain.id),
      verifyingContract,
    }
    this.environment = environment
    this.#logger = logger({
      level: debug ? 'trace' : 'info',
      name: 'citrex-sdk',
      mixin: (messageObject, level) => {
        if (debug || level > levels.values.debug) this.logs.push(messageObject)

        return messageObject
      },
      transport: {
        target: 'pino-pretty',
        options: { colorize: true },
      },
    })
    this.logs = []
    this.marginAssets = MARGIN_ASSETS[environment]
    this.publicClient = createPublicClient({
      chain,
      transport,
    })
    this.rpc = rpc
    this.subAccountId = subAccountId
    this.verifierAddress = verifyingContract
    this.#walletClient = createWalletClient({ account, chain, transport }).extend(
      eip712WalletActions(),
    )

    if (debug) this.#logger.info({ msg: 'Debug mode enabled' })

    if (environment === Environment.MAINNET) this.#refer()
  }

  /**
   * Adjust a price by a specified percentage depending on order direction.
   *
   * @param isBuy Whether to buy (true) or sell (false).
   * @param price The price of the order.
   * @param slippage The percentage by which to adjust the price.
   * @param priceIncrement The precision the price should be rounded to.
   * This value can be found under the `increment` key when calling the `getProduct` method.
   * @returns A new price number adjusted by the specified slippage.
   */
  #adjustPriceForSlippage = (
    isBuy: boolean,
    price: number,
    slippage: number,
    priceIncrement: bigint,
  ) => {
    const slippagePercentage = slippage / 100
    const multiplier = isBuy ? 1 + slippagePercentage : 1 - slippagePercentage
    const precision = 18 - Math.log10(Number(priceIncrement))

    return toRounded(price * multiplier, precision)
  }

  /**
   * Fetches data from the Citrex API asynchronously.
   *
   * @template TypedResponse The type expected for the parsed JSON response.
   * @param path The API endpoint path relative to the base API URL.
   * @param [config] (Optional) An object containing configuration options for the fetch request.
   *   See [MDN Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) for details.
   * @returns A promise that resolves with the parsed JSON response as the specified type.
   */
  #fetchFromAPI = async <TypedResponse>(
    path: string,
    config?: RequestInit,
  ): Promise<TypedResponse> => {
    const url = `${this.apiUrl}/${path}`
    this.#logger.debug({
      ...config,
      body: config?.body ? JSON.parse(config.body as string) : undefined,
      msg: 'Communicating with API...',
      url,
    })

    const response = await fetch(url, config)

    return (await response.json()) as TypedResponse
  }

  /**
   * Generates a signature for a message using EIP712.
   *
   * @param message - The message object to be signed. The structure of this object should conform to the schema defined in the `EIP712` types.
   * @param primaryType - The primary type of the message within the EIP712 schema. This should be a key of the `EIP712` types object.
   * @returns A promise that resolves to the generated signature as a hex string.
   * @throws {Error} - If there is an error during the signing process.
   */
  #generateSignature = async (
    message: any,
    primaryType: keyof typeof EIP712,
  ): Promise<HexString> => {
    const signature = await this.account.signTypedData({
      domain: this.domain,
      message,
      primaryType,
      types: EIP712,
    })

    this.#logger.debug({
      msg: 'Generated signature with following params:',
      ...message,
    })

    return signature
  }

  /**
   * Generates a signature for the EIP712 type `SignedAuthentication`.
   *
   * @returns A promise that resolves to the generated signature as a hex string.
   * @throws {Error} - If there is an error during the signing process.
   */
  #generateSignedAuthentication = async (): Promise<HexString> => {
    return await this.#generateSignature(
      { account: this.account.address, subAccountId: this.subAccountId },
      'SignedAuthentication',
    )
  }

  /**
   * Gets the current timestamp.
   *
   * @returns The current timestamp in milliseconds.
   */
  #getCurrentTimestamp = (): number => Date.now()

  /**
   * Generates a nonce.
   *
   * @returns The current timestamp in microseconds.
   */
  #getNonce = (): number => Math.floor((Date.now() + performance.now()) * 1000)

  /**
   * Private method to refer the user on class initialisation.
   */
  #refer = async (): Promise<void> => {
    try {
      await this.#fetchFromAPI('vault/referral', {
        body: JSON.stringify({ account: this.account.address, code: 'kickflip' }),
        method: 'POST',
      })
    } catch (error) {
      this.#logger.debug({ msg: 'Call failed, ignoring.' })
    }
  }

  /**
   * Converts a decimal number of Ether to USDC.
   *
   * @param value The decimal number representing the quantity in Ether.
   * @returns The equivalent value in USDC as a BigInt.
   */
  #toUSDC = (value: number): bigint => parseUnits(value.toString(), 6)

  /**
   * Converts a decimal number of Ether to Wei.
   *
   * @param value The decimal number representing the quantity in Ether.
   * @returns The equivalent value in Wei as a BigInt.
   */
  #toWei = (value: number): bigint => parseEther(value.toString())

  /**
   * Waits for a transaction on the blockchain to be mined and included in a block.
   *
   * This function takes a transaction hash and an optional message as arguments. It attempts to
   * retrieve the transaction receipt using the provided client. In case of an error, it waits
   * for a second and then recursively calls itself again to retry fetching the receipt.
   *
   * @param hash The hexadecimal hash of the transaction to wait for.
   * @param message A message to log before waiting for the transaction.
   * @returns (Implicit) This function does not explicitly return a value, but it waits
   * for the transaction to be mined and logs related information.
   */
  #waitForTransaction = async (hash: HexString, message: string): Promise<void> => {
    if (message) this.#logger.info({ msg: message })

    try {
      const txReceipt = await this.publicClient.getTransactionReceipt({ hash })
      this.#logger.debug({ hash, msg: 'Transaction receipt:', txReceipt })
    } catch (error) {
      await sleep(1000)
      await this.#waitForTransaction(hash, '')
    }
  }

  // -------
  // Setters
  // -------

  /**
   * Switch sub-account ID.
   */
  set setSubAccountId(subAccountId: number) {
    this.#logger.info({ msg: `Switching to sub-account ${subAccountId}.` })
    this.subAccountId = subAccountId
  }

  // --------------
  // REST endpoints
  // --------------

  /**
   * Calculate the required margin for a new order.
   *
   * {@link https://citrex.readme.io/reference/margin-calculator}
   *
   * @param isBuy Whether to buy (true) or sell (false).
   * @param price The price of the asset you intend to order.
   * @param productId The product ID of asset.
   * @param quantity The amount of the asset you intend to order.
   * @returns A promise that resolves to an object with either the required margin or an error.
   * @throws {Error} Thrown if an error occurs during the order process. The error object may contain details from the API response or a generic message.
   */
  public calculateMarginRequirement = async (
    isBuy: boolean,
    price: number,
    productId: number,
    quantity: number,
  ): Promise<CalculateMarginRequirementReturnType> => {
    try {
      const params = new URLSearchParams({
        isBuy: String(isBuy),
        price: this.#toWei(price).toString(),
        productId: productId.toString(),
        quantity: this.#toWei(quantity).toString(),
      })
      const { error, value } = await this.#fetchFromAPI<CalculateMarginRequirement>(
        `new-order-margin?${params}`,
      )

      if (error) {
        this.#logger.error({ msg: error })
        return {
          error: { message: error },
          required: BigInt(''),
        }
      }

      return { required: value }
    } catch (error) {
      this.#logger.debug({ err: error })
      return {
        error: { message: UNKNOWN_ERROR },
        required: BigInt(''),
      }
    }
  }

  /**
   * Get the current state of the order book for a product.
   *
   * {@link https://citrex.readme.io/reference/book-depth}
   *
   * @param productSymbol The product symbol to get data for (btcperp, ethperp, etc.).
   * @param [limit] (Optional) The number of bids and asks to retrieve. Can be 5, 10 or 20 (default: 5).
   * @param [granularity] (Optional) The number of decimals to remove from prices (default: 10).
   * @returns A promise that resolves with an object containing asks and bids, or an error object.
   * @throws {Error} Thrown if an error occurs fetching the data.
   */
  public getOrderBook = async (
    productSymbol: ProductSymbol,
    limit: 5 | 10 | 20 = 5,
    granularity: number = 10,
  ): Promise<OrderBookReturnType> => {
    try {
      const { asks, bids } = await this.#fetchFromAPI<OrderBookResponse>(
        `depth?symbol=${productSymbol}&limit=${limit}&granularity=${granularity}`,
      )

      return { asks, bids }
    } catch (error) {
      this.#logger.debug({ err: error })
      return {
        asks: [],
        bids: [],
        error: { message: UNKNOWN_ERROR },
      }
    }
  }

  /**
   * Get K-line (candlestick) chart data for a product.
   *
   * {@link https://citrex.readme.io/reference/ui-klines}
   *
   * @param productSymbol The product symbol to get data for (btcperp, ethperp, etc.).
   * @param [optionalArgs] (Optional) Query parameters.
   * @param [optionalArgs.endTime] (Optional) The end time range to query in unix milliseconds.
   * @param [optionalArgs.interval] (Optional) The time interval for each K-line. Use the {@link Interval} enum.
   * @param [optionalArgs.limit] (Optional) The amount of K-lines to fetch. Should be between 1 & 1000 inclusive.
   * @param [optionalArgs.startTime] (Optional) The start time range to query in unix milliseconds.
   * @returns A promise that resolves with an object containing the K-line data, or an error object.
   * @throws {Error} Thrown if an error occurs fetching the data.
   */
  public getKlines = async (
    productSymbol: ProductSymbol,
    optionalArgs?: KlineOptionalArgs,
  ): Promise<KlinesReturnType> => {
    if (optionalArgs) {
      if (Number(optionalArgs.limit) > 1000 || Number(optionalArgs.limit) <= 0) {
        return {
          error: { message: 'Limit must be between 0 and 1000.' },
          klines: [],
        }
      }

      if (Number(optionalArgs.startTime) > Number(optionalArgs.endTime)) {
        return {
          error: { message: 'Start time cannot be after end time.' },
          klines: [],
        }
      }

      if (Number(optionalArgs.startTime) > Date.now()) {
        return {
          error: { message: 'Start time cannot be in the future.' },
          klines: [],
        }
      }
    }

    const queryParams = optionalArgs
      ? `${Object.entries(optionalArgs)
          .map(([key, value]) => `&${key}=${value}`)
          .join('')}`
      : ''

    try {
      const klines = await this.#fetchFromAPI<KlinesResponse>(
        `uiKlines?symbol=${productSymbol}${queryParams}`,
      )

      return { klines }
    } catch (error) {
      this.#logger.debug({ err: error })
      return {
        error: { message: UNKNOWN_ERROR },
        klines: [],
      }
    }
  }

  /**
   * Get a list of all products.
   *
   * {@link https://citrex.readme.io/reference/list-products}
   *
   * @returns A promise that resolves with an object containing a list of products, or an error object.
   * @throws {Error} Thrown if an error occurs during the request.
   */
  public getProducts = async (): Promise<ProductsReturnType> => {
    try {
      const products = await this.#fetchFromAPI<ProductsResponse>('products')

      return { products }
    } catch (error) {
      this.#logger.debug({ err: error })
      return {
        error: { message: UNKNOWN_ERROR },
        products: [],
      }
    }
  }

  /**
   * Get a specific product.
   *
   * {@link https://citrex.readme.io/reference/get-product} By product ID.
   *
   * {@link https://citrex.readme.io/reference/get-product-copy} By product symbol.
   *
   * @param identifier The product symbol or product ID to get.
   * @returns A promise that resolves with an object containing the product, or an error object.
   * @throws {Error} Thrown if an error occurs during the request.
   */
  public getProduct = async (identifier: number | string): Promise<ProductReturnType> => {
    try {
      if (typeof identifier === 'number') {
        const product = await this.#fetchFromAPI<ProductResponse>(
          `products/product-by-id/${identifier}`,
        )

        return { product }
      }

      const product = await this.#fetchFromAPI<ProductResponse>(`products/${identifier}`)

      return { product }
    } catch (error) {
      this.#logger.debug({ err: error })
      return {
        error: { message: UNKNOWN_ERROR },
        product: {},
      }
    }
  }

  /**
   * Get the current server time in unix milliseconds.
   *
   * {@link https://citrex.readme.io/reference/server-time}
   *
   * @returns A promise that resolves with an object containing the timestamp, or an error object.
   * @throws {Error} Thrown if an error occurs during the request.
   */
  public getServerTime = async (): Promise<ServerTimeReturnType> => {
    try {
      return await this.#fetchFromAPI<ServerTimeResponse>('time')
    } catch (error) {
      this.#logger.debug({ err: error })
      return {
        error: { message: UNKNOWN_ERROR },
      }
    }
  }

  /**
   * Get ticker data for a product(s).
   *
   * {@link https://citrex.readme.io/reference/24hr-ticker-data}
   *
   * @param [productSymbol] (Optional) The product symbol to get ticker data for. If left blank, data for all tickers is returned.
   * @returns A promise that resolves with an object containing the ticker data, or an error object.
   * @throws {Error} Thrown if an error occurs fetching the data.
   */
  public getTickers = async (productSymbol?: ProductSymbol): Promise<TickerReturnType> => {
    try {
      const tickers = await this.#fetchFromAPI<TickerResponse>(
        `ticker/24hr${productSymbol ? `?symbol=${productSymbol}` : ''}`,
      )

      return {
        tickers: tickers.reduce(
          (tickerMap: TickerReturnType['tickers'], ticker) => ({
            ...tickerMap,
            [ticker.productSymbol]: ticker,
          }),
          {},
        ),
      }
    } catch (error) {
      this.#logger.debug({ err: error })
      return {
        error: { message: UNKNOWN_ERROR },
        tickers: {},
      }
    }
  }

  /**
   * Get trade history for a product.
   *
   * {@link https://citrex.readme.io/reference/trade-history}
   *
   * @param productSymbol The product symbol to get data for (btcperp, ethperp, etc.).
   * @param [quantity] (Optional) The quantity of trades to fetch. Maximum value is 500. (default: 10).
   * @returns A promise that resolves with an object containing the trade history data, or an error object.
   * @throws {Error} Thrown if an error occurs fetching the data.
   */
  public getTradeHistory = async (
    productSymbol: ProductSymbol,
    quantity: number = 10,
  ): Promise<TradeHistoryReturnType> => {
    try {
      const { error, trades } = await this.#fetchFromAPI<TradeHistoryResponse>(
        `trade-history?symbol=${productSymbol}&lookback=${quantity}&account=${this.account.address}&subAccountId=${this.subAccountId}`,
      )

      if (error) {
        this.#logger.error({ msg: error })
        return {
          error: { message: error },
          trades: [],
        }
      }

      return { trades: trades || [] }
    } catch (error) {
      this.#logger.debug({ err: error })
      return {
        error: { message: UNKNOWN_ERROR },
        trades: [],
      }
    }
  }

  // -------------------
  // REST AUTH endpoints
  // -------------------

  /**
   * Cancels and replaces an order on the exchange.
   * Replaced orders enforce an order type of {@link OrderType.LIMIT_MAKER} and a time in force of {@link TimeInForce.GTC}.
   *
   * {@link https://citrex.readme.io/reference/cancel-and-replace-trade}
   *
   * @param orderId The Id of the order to replace.
   * @param orderArgs The order arguments.
   * @param [orderArgs.expiration] (Optional) The expiration time of the order in milliseconds (default: now + 30 days).
   * @param orderArgs.isBuy Whether to buy (true) or sell (false).
   * @param [orderArgs.nonce] (Optional) A unique identifier for the order. (default: current unix timestamp in nano seconds).
   * @param orderArgs.price The price of the order.
   * @param orderArgs.productId The product identifier for the order.
   * @param orderArgs.quantity The quantity of the order.
   * @returns A promise that resolves to an object with either the new order or an error.
   * @throws {Error} Thrown if an error occurs during the order process. The error object may contain details from the API response or a generic message.
   */
  public cancelAndReplaceOrder = async (
    orderId: HexString,
    {
      expiration = this.#getCurrentTimestamp() + THIRTY_DAYS,
      isBuy,
      nonce = this.#getNonce(),
      price,
      productId,
      quantity,
    }: ReplacementOrderArgs,
  ): Promise<PlaceOrderReturnType> => {
    const bigPrice = this.#toWei(price)
    const bigQuantity = this.#toWei(quantity)

    const sharedParams = {
      account: this.account.address,
      isBuy,
      orderType: OrderType.LIMIT_MAKER,
      productId,
      subAccountId: this.subAccountId,
      timeInForce: TimeInForce.GTC,
    }
    const message = {
      expiration: BigInt(expiration),
      nonce: BigInt(nonce),
      price: bigPrice,
      quantity: bigQuantity,
      ...sharedParams,
    }

    try {
      const signature = await this.#generateSignature(message, 'Order')

      const { error, ...order } = await this.#fetchFromAPI<Order>('order/cancel-and-replace', {
        body: JSON.stringify({
          idToCancel: orderId,
          newOrder: {
            expiration,
            nonce,
            price: bigPrice.toString(),
            quantity: bigQuantity.toString(),
            signature,
            ...sharedParams,
          },
        }),
        method: 'POST',
      })

      if (error) {
        this.#logger.error({ msg: error })
        return {
          error: { message: error },
          order: {},
        }
      }

      return { order }
    } catch (error) {
      this.#logger.debug({ err: error })
      return {
        error: { message: UNKNOWN_ERROR },
        order: {},
      }
    }
  }

  /**
   * Cancel all open orders for a specific product.
   *
   * {@link https://citrex.readme.io/reference/cancel-all-open-orders-trade}
   *
   * @param productId The product ID of the orders to be cancelled.
   * @returns A promise that resolves with an object containing the cancellation status, or an error object.
   * @throws {Error} Thrown if an error occurs during the cancellation process. The error object may contain details from the API response or a generic message.
   */
  public cancelOpenOrdersForProduct = async (
    productId: number,
  ): Promise<CancelOrdersReturnType> => {
    const message = {
      account: this.account.address,
      productId,
      subAccountId: this.subAccountId,
    }

    try {
      const signature = await this.#generateSignature(message, 'CancelOrders')

      const { error, success } = await this.#fetchFromAPI<CancelOrders>('openOrders', {
        body: JSON.stringify({ ...message, signature }),
        method: 'DELETE',
      })

      if (error) {
        this.#logger.error({ msg: error })
        return {
          error: { message: error },
          success,
        }
      }

      return { success }
    } catch (error) {
      this.#logger.debug({ err: error })
      return {
        error: { message: UNKNOWN_ERROR },

        success: false,
      }
    }
  }

  /**
   * Cancel an order on the exchange.
   *
   * {@link https://citrex.readme.io/reference/cancel-order}
   *
   * @param orderId The unique order ID of the order to be cancelled.
   * @param productId The product ID of the order to be cancelled.
   * @returns A promise that resolves with an object containing the cancellation status, or an error object.
   * @throws {Error} Thrown if an error occurs during the cancellation process. The error object may contain details from the API response or a generic message.
   */
  public cancelOrder = async (
    orderId: HexString,
    productId: number,
  ): Promise<CancelOrderReturnType> => {
    const message = {
      account: this.account.address,
      orderId,
      productId,
      subAccountId: this.subAccountId,
    }

    try {
      const signature = await this.#generateSignature(message, 'CancelOrder')

      const { error, success } = await this.#fetchFromAPI<CancelOrder>('order', {
        body: JSON.stringify({ ...message, signature }),
        method: 'DELETE',
      })

      if (error) {
        this.#logger.error({ msg: error })
        return {
          error: { message: error },
          success,
        }
      }

      return { success }
    } catch (error) {
      this.#logger.debug({ err: error })
      return {
        error: { message: UNKNOWN_ERROR },
        success: false,
      }
    }
  }

  /**
   * Cancels multiple orders on the exchange.
   * This function is a wrapper around {@link CitrexSDK.cancelOrder} and takes the same args in list form.
   *
   * @param ordersArgs A list of order arguments. See {@link CitrexSDK.cancelOrder} for further details.
   * @returns A promise that resolves to a list of objects with either the cancellation status or an error.
   */
  public cancelOrders = async (
    ordersArgs: [HexString, number][],
  ): Promise<CancelOrderReturnType[]> => {
    return await Promise.all(ordersArgs.map(async order => await this.cancelOrder(...order)))
  }

  /**
   * Deposits a specified quantity of an asset.
   *
   * {@link https://citrex.readme.io/reference/depositing}
   *
   * @param quantity The amount of the asset to deposit.
   * @param [asset] The type of asset to deposit (default: USDC).
   * @returns A promise that resolves with an object containing the deposit status and transaction hash, or an error object.
   * @throws {ContractFunctionRevertedError} Thrown if a user-facing error occurs during the deposit, such as insufficient allowance or failed deposit. The error object will contain the error name and message.
   * @throws {BaseError} Thrown if an unexpected error occurs during the deposit. The error object may not provide user-friendly messages.
   */
  public deposit = async (
    quantity: number,
    asset: MarginAssetKey = 'USDC',
  ): Promise<DepositReturnType> => {
    this.#logger.info({ msg: `Depositing ${quantity} ${asset}...` })

    const assetAddress = this.marginAssets[asset]
    const bigQuantity = this.#toUSDC(quantity)

    const allowance = await this.publicClient.readContract({
      abi: ERC20,
      address: assetAddress,
      args: [this.account.address, this.ciaoAddress],
      functionName: 'allowance',
    })

    try {
      if (allowance < bigQuantity) {
        const approval = await this.publicClient.simulateContract({
          account: this.account,
          abi: ERC20,
          address: assetAddress,
          args: [this.ciaoAddress, bigQuantity],
          functionName: 'approve',
        })
        const approvalHash = await this.#walletClient.writeContract(approval.request)
        await this.#waitForTransaction(approvalHash, 'Waiting for approval confirmation...')
      }

      const deposit = await this.publicClient.simulateContract({
        account: this.account,
        abi: CIAO,
        address: this.ciaoAddress,
        args: [this.account.address, this.subAccountId, bigQuantity, assetAddress],
        functionName: 'deposit',
      })

      const depositHash = await this.#walletClient.writeContract(deposit.request)
      await this.#waitForTransaction(depositHash, 'Waiting for deposit confirmation...')

      this.#logger.info({ msg: 'Deposit completed!' })
      return {
        success: true,
        transactionHash: depositHash,
      }
    } catch (error) {
      if (error instanceof BaseError) {
        const revertError = error.walk(error => error instanceof ContractFunctionRevertedError)

        if (revertError instanceof ContractFunctionRevertedError) {
          const errorName = revertError.data?.errorName
          const errorResponse = {
            errorName,
            message: revertError.shortMessage.replace(/"/g, `'`),
          }

          this.#logger.error({ ...errorResponse, msg: 'An error occurred.' })
          this.#logger.debug({ err: error })
          return {
            error: errorResponse,
            success: false,
          }
        }
      }

      this.#logger.debug({ err: error })
      return {
        error: { message: UNKNOWN_ERROR },
        success: false,
      }
    }
  }

  /**
   * Get health metrics for the account.
   *
   * {@link https://citrex.readme.io/reference/get-account-health}
   *
   * @returns A promise that resolves to an object with either the account health or an error.
   * @throws {Error} Thrown if an error occurs during the order process. The error object may contain details from the API response or a generic message.
   */
  public getAccountHealth = async (): Promise<AccountHealthReturnType> => {
    try {
      const params = new URLSearchParams({
        account: this.account.address,
        subAccountId: this.subAccountId.toString(),
      })
      const { error, value } = await this.#fetchFromAPI<AccountHealth>(
        `account-health?${params.toString()}`,
      )

      if (error) {
        this.#logger.error({ msg: error })
        return {
          accountHealth: {},
          error: { message: error },
        }
      }

      return { accountHealth: value }
    } catch (error) {
      this.#logger.debug({ err: error })
      return {
        accountHealth: {},
        error: { message: UNKNOWN_ERROR },
      }
    }
  }

  /**
   * List all margin balances for the account and sub-account.
   *
   * {@link https://citrex.readme.io/reference/get-spot-position}
   *
   * Note: The `asset` key for each balance object will match one of the values found in the {@link MarginAssets} enum.
   *
   * @returns A promise that resolves to an object with either the list of balances or an error.
   * @throws {Error} Thrown if an error occurs fetching the data. The error object may contain details from the API response or a generic message.
   */
  public listBalances = async (): Promise<BalancesReturnType> => {
    try {
      const signature = await this.#generateSignedAuthentication()

      const addressToKeyMap = Object.entries(this.marginAssets).reduce(
        (map, [key, address]) => ({
          ...map,
          [address]: key,
        }),
        {} as Record<HexString, MarginAssetKey>,
      )
      const params = new URLSearchParams({
        account: this.account.address,
        signature,
        subAccountId: this.subAccountId.toString(),
      })
      const response = await this.#fetchFromAPI<Required<BaseApiResponse> | Balance[]>(
        `balances?${params.toString()}`,
      )

      if (!Array.isArray(response)) {
        this.#logger.error({ msg: response.error })
        return {
          balances: [],
          error: { message: response.error },
        }
      }

      return {
        balances: response.map(({ asset, pendingWithdrawal, quantity }) => ({
          address: asset,
          asset: addressToKeyMap[asset],
          pendingWithdrawal,
          quantity,
        })),
      }
    } catch (error) {
      this.#logger.debug({ err: error })
      return {
        balances: [],
        error: { message: UNKNOWN_ERROR },
      }
    }
  }

  /**
   * List all open orders for the account and sub-account.
   * An optional product symbol can be passed to limit the results to just that product.
   *
   * {@link https://citrex.readme.io/reference/list-open-orders}
   *
   * @param [productSymbol] (Optional) A specific product symbol to fetch positions for.
   * @returns A promise that resolves to an object with either the list of open orders or an error.
   * @throws {Error} Thrown if an error occurs fetching the data. The error object may contain details from the API response or a generic message.
   */
  public listOpenOrders = async (productSymbol?: ProductSymbol): Promise<OpenOrdersReturnType> => {
    try {
      const signature = await this.#generateSignedAuthentication()

      const params = new URLSearchParams({
        account: this.account.address,
        signature,
        subAccountId: this.subAccountId.toString(),
        ...(productSymbol ? { symbol: productSymbol } : {}),
      })
      const response = await this.#fetchFromAPI<Required<BaseApiResponse> | Order[]>(
        `openOrders?${params.toString()}`,
      )

      if (!Array.isArray(response)) {
        this.#logger.error({ msg: response.error })
        return {
          error: { message: response.error },
          orders: [],
        }
      }

      return { orders: response }
    } catch (error) {
      this.#logger.debug({ err: error })
      return {
        error: { message: UNKNOWN_ERROR },
        orders: [],
      }
    }
  }

  /**
   * List all positions for the account and sub-account.
   * An optional product symbol can be passed to limit the results to just that product.
   *
   * {@link https://citrex.readme.io/reference/get-perpetual-positions}
   *
   * @param [productSymbol] (Optional) A specific product symbol to fetch positions for.
   * @returns A promise that resolves to an object with either the list of positions or an error.
   * @throws {Error} Thrown if an error occurs fetching the data. The error object may contain details from the API response or a generic message.
   */
  public listPositions = async (productSymbol?: ProductSymbol): Promise<PositionsReturnType> => {
    try {
      const signature = await this.#generateSignedAuthentication()

      const params = new URLSearchParams({
        account: this.account.address,
        signature,
        subAccountId: this.subAccountId.toString(),
        ...(productSymbol ? { symbol: productSymbol } : {}),
      })
      const response = await this.#fetchFromAPI<Required<BaseApiResponse> | Position[]>(
        `positionRisk?${params.toString()}`,
      )

      if (!Array.isArray(response)) {
        this.#logger.error({ msg: response.error })
        return {
          error: { message: response.error },
          positions: [],
        }
      }

      return { positions: response }
    } catch (error) {
      this.#logger.debug({ err: error })
      return {
        error: { message: UNKNOWN_ERROR },
        positions: [],
      }
    }
  }

  /**
   * Places an order on the exchange.
   *
   * {@link https://citrex.readme.io/reference/place-order}
   *
   * @param orderArgs The order arguments.
   * @param [orderArgs.expiration] (Optional) The expiration time of the order in milliseconds (default: now + 30 days).
   * @param orderArgs.isBuy Whether to buy (true) or sell (false).
   * @param [orderArgs.nonce] (Optional) A unique identifier for the order. (default: current unix timestamp in nano seconds).
   * @param [orderArgs.orderType] (Optional) The type of order (default: MARKET). Use the {@link OrderType} enum.
   * @param orderArgs.price The price of the order.
   * @param [orderArgs.priceIncrement] The price precision for the product. This is only required for MARKET orders.
   * This value can be found under the `increment` key when calling the `getProduct` method.
   * @param orderArgs.productId The product identifier for the order.
   * @param orderArgs.quantity The quantity of the order.
   * @param [orderArgs.timeInForce] (Optional) The time in force for the order (default: FOK). Use the {@link TimeInForce} enum.
   * @param [orderArgs.slippage] (Optional) The percentage by which to adjust the price when orderType is {@link OrderType.MARKET} (default: 2.5%).
   * @returns A promise that resolves to an object with either the order or an error.
   * @throws {Error} Thrown if an error occurs during the order process. The error object may contain details from the API response or a generic message.
   */
  public placeOrder = async ({
    expiration = this.#getCurrentTimestamp() + THIRTY_DAYS,
    isBuy,
    nonce = this.#getNonce(),
    orderType = OrderType.MARKET,
    price,
    priceIncrement,
    productId,
    quantity,
    slippage = 2.5,
    timeInForce = TimeInForce.FOK,
  }: OrderArgs): Promise<PlaceOrderReturnType> => {
    if (orderType === OrderType.MARKET && priceIncrement === undefined) {
      return {
        error: { message: 'A priceIncrement is required for market orders' },
        order: {},
      }
    }

    const bigPrice =
      orderType === OrderType.MARKET
        ? this.#toWei(
            this.#adjustPriceForSlippage(isBuy, price, slippage, priceIncrement as bigint),
          )
        : this.#toWei(price)
    const bigQuantity = this.#toWei(quantity)

    const sharedParams = {
      account: this.account.address,
      isBuy,
      orderType,
      productId,
      subAccountId: this.subAccountId,
      timeInForce,
    }
    const message = {
      expiration: BigInt(expiration),
      nonce: BigInt(nonce),
      price: bigPrice,
      quantity: bigQuantity,
      ...sharedParams,
    }

    try {
      const signature = await this.#generateSignature(message, 'Order')

      const { error, ...order } = await this.#fetchFromAPI<Order>('order', {
        body: JSON.stringify({
          expiration,
          nonce,
          price: bigPrice.toString(),
          quantity: bigQuantity.toString(),
          signature,
          ...sharedParams,
        }),
        method: 'POST',
      })

      if (error) {
        this.#logger.error({ msg: error })
        return {
          error: { message: error },
          order: {},
        }
      }

      return { order }
    } catch (error) {
      this.#logger.debug({ err: error })
      return {
        error: { message: UNKNOWN_ERROR },
        order: {},
      }
    }
  }

  /**
   * Places multiple orders on the exchange.
   * This function is a wrapper around {@link CitrexSDK.placeOrder} and takes the same args in list form.
   *
   * @param ordersArgs A list of order arguments. See {@link CitrexSDK.placeOrder} for further details.
   * @returns A promise that resolves to a list of objects with either the order or an error.
   */
  public placeOrders = async (ordersArgs: OrderArgs[]): Promise<PlaceOrderReturnType[]> => {
    return await Promise.all(ordersArgs.map(async orderArgs => await this.placeOrder(orderArgs)))
  }

  /**
   * Withdraw a specified quantity of an asset.
   *
   * {@link https://citrex.readme.io/reference/withdraw}
   *
   * @param quantity The amount of the asset to withdraw.
   * @param [asset] The type of asset to withdraw (default: USDC).
   * @returns A promise that resolves with an object containing the withdrawal status, or an error object.
   * @throws {Error} Thrown if an error occurs during the withdrawal process. The error object may contain details from the API response or a generic message.
   */
  public withdraw = async (
    quantity: number,
    asset: MarginAssetKey = 'USDC',
  ): Promise<WithdrawReturnType> => {
    this.#logger.info({ msg: `Withdrawing ${quantity} ${asset}...` })

    const bigQuantity = this.#toUSDC(quantity)
    const nonce = this.#getNonce()

    const sharedParams = {
      account: this.account.address,
      asset: this.marginAssets[asset],
      subAccountId: this.subAccountId,
    }
    const message = {
      ...sharedParams,
      nonce: BigInt(nonce),
      quantity: bigQuantity,
    }

    try {
      const signature = await this.#generateSignature(message, 'Withdraw')

      const { error, success } = await this.#fetchFromAPI<BaseApiResponse>('withdraw', {
        body: JSON.stringify({
          ...sharedParams,
          nonce,
          quantity: bigQuantity.toString(),
          signature,
        }),
        method: 'POST',
      })

      if (error) {
        this.#logger.error({ msg: error })
        return {
          error: { message: error },
          success: false,
        }
      }

      this.#logger.info({ msg: 'Withdrawal completed!' })
      return { success }
    } catch (error) {
      this.#logger.debug({ err: error })
      return {
        error: { message: UNKNOWN_ERROR },
        success: false,
      }
    }
  }
}

export default CitrexSDK
