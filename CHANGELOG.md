# Citrex SDK

## 1.0.0

- V1 release.

## 1.1.0

- New `account-health` endpoint added via the `getAccountHealth` method.
- README updates.
- Now stubbing env vars in unit tests.
- Mutation testing now at 100% coverage.

## 1.1.1

- New workflow to confirm builds are passing on supported Node.js versions.
- Dependency updates.
- Add LIMIT_REDUCE_ONLY order type.

## 1.2.0

- Now exposing the public client that is created when the SDK is initialised.
- Now exporting typings in their own import @ `citrex-sdk/types`.
- Constants are now exposed via the client. This includes the API URL, Chain and available margin assets.
