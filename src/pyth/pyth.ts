import axios, { AxiosInstance } from 'axios';
import { PythConfig } from '../types';
import { getVaaPriceUpdateData, normalizePythPriceForParifi } from '.';

export class Pyth {
  constructor(private pythConfig: PythConfig) {}

  private getPythClient = (
    pythServiceEndpoint = this.pythConfig.pythEndpoint,
    pythServiceUsername = this.pythConfig.username,
    pythServicePassword = this.pythConfig.password,
    isStable = this.pythConfig.isStable,
  ): AxiosInstance | undefined => {
    try {
      if (isStable === undefined) {
        isStable = true;
      }
      if (pythServiceEndpoint) {
        if (pythServiceUsername && pythServicePassword) {
          // If Username and password is provided, connect using credentials
          return axios.create({
            baseURL: pythServiceEndpoint,
            auth: {
              username: pythServiceUsername,
              password: pythServicePassword,
            },
          });
        } else {
          // Connect to the PYTH service endpoint without authentication
          return axios.create({
            baseURL: pythServiceEndpoint,
          });
        }
      } else {
        // If Pyth service endpoint is not provided, connect to public endpoints
        if (isStable) {
          return axios.create({
            baseURL: 'https://hermes.pyth.network',
          });
        } else {
          return axios.create({
            baseURL: 'https://hermes-beta.pyth.network',
          });
        }
      }
    } catch (error) {
      throw error;
    }
  };

  public async getVaaPriceUpdateData(priceIds: string[]) {
    const pythClient = await this.getPythClient();

    if (pythClient) {
      return await getVaaPriceUpdateData(priceIds, pythClient);
    }
  }

  public async normalizePythPriceForParifi(pythPrice: number, pythExponent: number) {
    normalizePythPriceForParifi(pythPrice, pythExponent);
  }
}
