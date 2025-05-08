import { ZeroAddress } from 'ethers';
import { getParifiSdkInstanceForTesting } from '..';
import {
  TEST_USER_1,
  TEST_USER_2,
  TEST_USER_3,
  TEST_USER_4,
  TEST_ACCOUNT_ID_1,
  TEST_ACCOUNT_ID_2,
  TEST_ACCOUNT_ID_3,
  TEST_ACCOUNT_ID_4,
} from '../common/constants';

describe('Account data fetching logic from subgraph', () => {
  it('should return correct integrator fees', async () => {
    const parifiSdk = await getParifiSdkInstanceForTesting();
    const userAddresses = [TEST_USER_1, TEST_USER_2, TEST_USER_3, TEST_USER_4];

    const response = await parifiSdk.subgraph.getFeesByAddress(userAddresses);
    expect(response.size).toEqual(userAddresses.length);
  });

  it('should check if a user address is an existing user', async () => {
    const parifiSdk = await getParifiSdkInstanceForTesting();
    const newUserAddress = ZeroAddress;
    const existingUserAddress = TEST_USER_1;

    expect(await parifiSdk.subgraph.checkIfExistingUser(newUserAddress)).toBe(false);
    expect(await parifiSdk.subgraph.checkIfExistingUser(existingUserAddress)).toBe(true);
  });

  it('should return correct collateral deposits for accountId', async () => {
    const parifiSdk = await getParifiSdkInstanceForTesting();
    const accountIds = [TEST_ACCOUNT_ID_1, TEST_ACCOUNT_ID_2, TEST_ACCOUNT_ID_3, TEST_ACCOUNT_ID_4];

    const response = await parifiSdk.subgraph.depositedCollateralForSnxAccounts(accountIds);
    expect(response.length).toEqual(accountIds.length);
  });
});
