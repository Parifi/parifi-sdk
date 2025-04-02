import { calculateLiquidationPriceOffchain } from '../../src/perps/offchain';

describe('offchain logic', () => {
  describe('calculateLiquidationPriceOffchain', () => {
    it('should return market price if positionSize is 0', () => {
      const liquidationPrice = calculateLiquidationPriceOffchain({
        availableMarginInUsd: 1000,
        marginBufferInUsd: 100,
        formattedPositionSize: 0,
        formattedMarketPrice: 2000,
      });
      expect(liquidationPrice).toBe(2000);
    });

    it('should calculate liquidation price for a long position', () => {
      const liquidationPrice = calculateLiquidationPriceOffchain({
        availableMarginInUsd: 100,
        marginBufferInUsd: 20,
        formattedPositionSize: 1,
        formattedMarketPrice: 2000,
      });
      expect(liquidationPrice).toBeCloseTo(1920);
    });

    it('should calculate liquidation price for a short position', () => {
      const liquidationPrice = calculateLiquidationPriceOffchain({
        availableMarginInUsd: 1000,
        marginBufferInUsd: 20,
        formattedPositionSize: -1,
        formattedMarketPrice: 2000,
      });
      expect(liquidationPrice).toBeCloseTo(2980);
    });

    it('should return 0 when availableMarginInUsd is 0', () => {
      const liquidationPrice = calculateLiquidationPriceOffchain({
        availableMarginInUsd: 0,
        marginBufferInUsd: 100,
        formattedPositionSize: 1,
        formattedMarketPrice: 2000,
      });
      expect(liquidationPrice).toBe(0);
    });
  });
});
