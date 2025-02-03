import { getParifiSdkInstanceForTesting } from '..';

describe('Account data fetching logic from subgraph', () => {
  it('should return correct integrator fees', async () => {
    const parifiSdk = await getParifiSdkInstanceForTesting();
    const userAddresses = [
      '0x0809fd0036a173e3a0d50b95ee32e9bc20aa4ef9',
      '0x9613eeb13e36f39bc72f4f5d4bcbf606bfcd906d',
      '0x2f22928335ed7e472c18e1e487593c0ac40e9ca8',
      '0x325cd6b3cd80edb102ac78848f5b127eb6db13f3',
    ];

    const response = await parifiSdk.subgraph.getFeesByAddress(userAddresses);
    expect(response.size).toEqual(userAddresses.length);
  });

  it('should check if a user address is an existing user', async () => {
    const parifiSdk = await getParifiSdkInstanceForTesting();
    const newUserAddress = '0x0809fd0036a173e3a0d50b95ee32e9bc20aa4ef9';
    const existingUserAddress = '0x2f22928335ed7e472c18e1e487593c0ac40e9ca8';

    expect(await parifiSdk.subgraph.checkIfExistingUser(newUserAddress)).toBe(false);
    expect(await parifiSdk.subgraph.checkIfExistingUser(existingUserAddress)).toBe(true);
  });

  it.only('should return correct collateral deposits for accountId', async () => {
    const parifiSdk = await getParifiSdkInstanceForTesting();
    const accountIds = ['4419558961993983236', '11008871937430344025', '16131201045014071399'];

    const response = await parifiSdk.subgraph.depositedCollateralForSnxAccounts(accountIds);
    console.log('---------', JSON.stringify(response));
    expect(response.length).toEqual(accountIds.length);
  });
});
