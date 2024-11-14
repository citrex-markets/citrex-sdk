<p align="center">
  <img alt="Rysk Logo" src="https://app.rysk.finance/brand/rysk-finance-uncorrelated-returns-join-the-community-today.webp" />
</p>

![Build](https://img.shields.io/github/actions/workflow/status/MeanBoyCousin/rysk-sdk/release.yml?style=flat-square&label=Build&color=%234177f6&link=https://github.com/MeanBoyCousin/rysk-sdk/actions/workflows/release.yml)
![NPM Version](https://img.shields.io/npm/v/rysk-sdk?style=flat-square&label=NPM&color=%234177f6&link=https://www.npmjs.com/package/rysk-sdk)
![Discord](https://img.shields.io/discord/912754653756796950?style=flat-square&logo=discord&logoColor=%23fff&label=Discord&color=%234177f6&link=https://discord.gg/Az8dEA8ARs)

Interact with the [Rysk decentralized exchange](https://app.rysk.finance/) and trade BTC, ETH, SOL and other cryptocurrency perp futures with leverage. Live on [Arbitrum](https://arbitrum.io/).

```bash
npm install rysk-sdk
# or
yarn add rysk-sdk
# or
pnpm add rysk-sdk
# or
bun install rysk-sdk
```

## Usage

Getting started is a simple case of creating a .env file, importing the Client and instantiating an instance.

The .env file should contain the necessary contract addresses to interact with the DEX. An up-to-date copy of the relevant contract addresses can be found in the [Rysk API docs](https://rysk.readme.io/reference/contract-addresses).

```sh
CIAO_MAINNET_ADDRESS=<...>
ORDER_DISPATCH_MAINNET_ADDRESS=<...>

CIAO_TESTNET_ADDRESS=<...>
ORDER_DISPATCH_TESTNET_ADDRESS=<...>
```

```ts
import RyskSDK from 'rysk-sdk'

const MY_PRIVATE_KEY = '0x...'

const Client = new RyskSDK(MY_PRIVATE_KEY)
```

The client can also accept a configuration object as the second parameter.

| Key          | Type                     | Default                           | Description                                                               |
|--------------|--------------------------|-----------------------------------|---------------------------------------------------------------------------|
| debug        | `boolean`                | `false`                             | Used to enable debug mode when running the client for additional logging. |
| environment  | `'testnet' \| 'mainnet'` | `'testnet'`                         | Specify the environment you wish to trade in.                             |
| rpc          | `string`                 | `Arbitrum RPC based on environment` | Specify a custom RPC url to used.                                         |
| subAccountId | `number`                 | `1`                                 | Specify a sub-account ID to use. This can be from 1-255.                  |

```ts
import RyskSDK from 'rysk-sdk'

const CONFIG = {
  debug: false,
  environment: 'testnet',
  rpc: 'https://sepolia.arbiscan.io',
  subAccountId: 1,
}
const MY_PRIVATE_KEY = '0x...'

const Client = new RyskSDK(MY_PRIVATE_KEY)
```

## Getting started

To get started, you will need to deposit funds and make a trade. Let's look at how we can do that now. If you need testnet funds, please head to the [Rysk Discord server](https://discord.gg/Az8dEA8ARs) where we will happily help.

```ts
import RyskSDK from 'rysk-sdk'
import { OrderType, TimeInForce } from 'rysk-sdk/enums'

const MY_PRIVATE_KEY = '0x...'

const Client = new RyskSDK(MY_PRIVATE_KEY)

// Let's deposit 1000 USDC to get started. By default deposits are in USDC.
const { error, success, transactionHash } = await Client.deposit(1000)

// Now we can make an order. Let's go long on some ETH!
if (success) {
  const { error, order } = await Client.placeOrder({
    isBuy: true,
    orderType: OrderType.LIMIT,
    price: 3150,
    productId: 1002,
    quantity: 0.1,
    timeInForce: TimeInForce.GTC,
  })

  // Finally let's log out our order to check the details.
  console.log(order)
}
```

### Handy enums

A series of useful enums can be imported from `rysk-sdk/enums` and used to help match against responses or compose payloads.

| Name         | Values                                                                                   | Description                                          |
|--------------|------------------------------------------------------------------------------------------|------------------------------------------------------|
| Environment  | `MAINNET \| TESTNET`                                                                     | The environment to use when initialising the client. |
| Interval     | `'1M' \| '5M' \| '15M' \| '30M' \| '1H' \| '2H' \| '4H' \| '8H' \| '1D' \| '3D' \| '1W'` | The interval to use when fetching K-line data.       |
| MarginAssets | `USDC`                                                                                   | Symbol values of supported margin assets.            |
| OrderStatus  | `CANCELLED \| EXPIRED \| FILLED \| OPEN \| PENDING \| REJECTED`                          | Defines the possible states an order can be in.      |
| OrderType    | `LIMIT \| LIMIT_MAKER \| MARKET`                                                         | Order types for building order payloads.             |
| TimeInForce  | `GTC \| FOK \| IOC`                                                                      | Time in force values for building order payloads.    |

### Further support

For more information on specific endpoints, please refer to the official [Rysk API docs](https://rysk.readme.io/reference/rysk-api-introduction). Each function in this client contains detailed JSDocs on arguments and return types to aid the developer experience and links to their respective endpoints within the official docs.

## Contributing

Want to contribute? Check out that [contributing guide](https://github.com/MeanBoyCousin/rysk-sdk/blob/master/CONTRIBUTING.md) to get started.

## Support

Trouble getting started? Feel free to join us on the official [Rysk Discord server](https://discord.gg/Az8dEA8ARs) where you can get full support from the team.

## License

MIT License © 2024-Present [Tim Dunphy](https://github.com/MeanBoyCousin)
