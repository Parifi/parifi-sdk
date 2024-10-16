import { AxiosInstance } from 'axios';
import { PythConfig } from '../interfaces/classConfigs';
import {
  getLatestPricesFromPyth,
  getLatestPricesNormalized,
  getPythClient,
  getVaaPriceUpdateData,
  normalizePythPriceForParifi,
} from './pyth';
import { getPriceIdsForCollaterals } from '../common';

export class Pyth {
  public pythClient: AxiosInstance;

  constructor(private pythConfig: PythConfig) {
    this.pythClient = {} as AxiosInstance;
  }

  async initPyth() {
    this.pythClient = await getPythClient(
      this.pythConfig.pythEndpoint,
      this.pythConfig.username,
      this.pythConfig.password,
      this.pythConfig.isStable,
    );
  }

  public async getVaaPriceUpdateData(priceIds: string[]) {
    return await getVaaPriceUpdateData(priceIds, this.pythClient);
  }

  public normalizePythPriceForParifi(pythPrice: number, pythExponent: number) {
    return normalizePythPriceForParifi(pythPrice, pythExponent);
  }

  public async getLatestPricesFromPyth(priceIds: string[]) {
    return await getLatestPricesFromPyth(priceIds, this.pythClient);
  }

  public async getLatestPricesNormalized(priceIds: string[]) {
    return await getLatestPricesNormalized(priceIds, this.pythClient);
  }

  public getPriceIdsForCollaterals() {
    return getPriceIdsForCollaterals(true);
  }
}
