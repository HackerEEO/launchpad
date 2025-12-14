import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIDOPool } from '../useIDOPool';

// Mock ethers
vi.mock('ethers', () => ({
  ethers: {
    Contract: vi.fn().mockImplementation(() => ({
      poolInfo: vi.fn().mockResolvedValue({
        projectToken: '0x1234567890123456789012345678901234567890',
        paymentToken: '0x0000000000000000000000000000000000000000',
        tokenPrice: BigInt('1000000000000000'), // 0.001 ETH
        hardCap: BigInt('100000000000000000000'), // 100 ETH
        softCap: BigInt('10000000000000000000'), // 10 ETH
        minContribution: BigInt('100000000000000000'), // 0.1 ETH
        maxContribution: BigInt('10000000000000000000'), // 10 ETH
        startTime: BigInt(Math.floor(Date.now() / 1000) - 3600),
        endTime: BigInt(Math.floor(Date.now() / 1000) + 3600),
        totalRaised: BigInt('5000000000000000000'), // 5 ETH
        finalized: false,
        cancelled: false,
      }),
      getInvestorInfo: vi.fn().mockResolvedValue({
        contribution: BigInt('1000000000000000000'),
        tokenAllocation: BigInt('1000000000000000000000'),
        claimed: false,
        refunded: false,
      }),
      invest: vi.fn().mockImplementation(async () => ({
        hash: '0xmocktxhash123',
        wait: vi.fn().mockResolvedValue({
          status: 1,
          transactionHash: '0xmocktxhash123',
        }),
      })),
      claim: vi.fn().mockImplementation(async () => ({
        hash: '0xmockclaimhash123',
        wait: vi.fn().mockResolvedValue({
          status: 1,
          transactionHash: '0xmockclaimhash123',
        }),
      })),
      refund: vi.fn().mockImplementation(async () => ({
        hash: '0xmockrefundhash123',
        wait: vi.fn().mockResolvedValue({
          status: 1,
          transactionHash: '0xmockrefundhash123',
        }),
      })),
    })),
    BrowserProvider: vi.fn().mockImplementation(() => ({
      getSigner: vi.fn().mockResolvedValue({
        address: '0xTestUser123456789012345678901234567890ab',
      }),
    })),
    parseEther: vi.fn().mockImplementation((value: string) => BigInt(Math.floor(parseFloat(value) * 1e18))),
    formatEther: vi.fn().mockImplementation((value: bigint) => (Number(value) / 1e18).toString()),
  },
}));

// Mock window.ethereum
const mockEthereum = {
  request: vi.fn().mockResolvedValue(['0xTestUser123456789012345678901234567890ab']),
  on: vi.fn(),
  removeListener: vi.fn(),
};

Object.defineProperty(window, 'ethereum', {
  value: mockEthereum,
  writable: true,
});

describe('useIDOPool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useIDOPool('0xPoolAddress123'));
    
    expect(result.current.poolInfo).toBeNull();
    expect(result.current.investorInfo).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should have invest function', () => {
    const { result } = renderHook(() => useIDOPool('0xPoolAddress123'));
    
    expect(typeof result.current.invest).toBe('function');
  });

  it('should have claim function', () => {
    const { result } = renderHook(() => useIDOPool('0xPoolAddress123'));
    
    expect(typeof result.current.claim).toBe('function');
  });

  it('should have refund function', () => {
    const { result } = renderHook(() => useIDOPool('0xPoolAddress123'));
    
    expect(typeof result.current.refund).toBe('function');
  });

  it('should have refreshPoolInfo function', () => {
    const { result } = renderHook(() => useIDOPool('0xPoolAddress123'));
    
    expect(typeof result.current.refreshPoolInfo).toBe('function');
  });

  it('should handle empty pool address', () => {
    const { result } = renderHook(() => useIDOPool(''));
    
    expect(result.current.loading).toBe(false);
    expect(result.current.poolInfo).toBeNull();
  });
});

describe('useIDOPool invest function', () => {
  it('should validate positive amount', async () => {
    const { result } = renderHook(() => useIDOPool('0xPoolAddress123'));
    
    // Wait for initial loading to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Try to invest with 0 amount should throw
    await expect(async () => {
      await result.current.invest(0);
    }).rejects.toThrow();
  });

  it('should validate negative amount', async () => {
    const { result } = renderHook(() => useIDOPool('0xPoolAddress123'));
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    await expect(async () => {
      await result.current.invest(-1);
    }).rejects.toThrow();
  });
});

describe('useIDOPool pool status helpers', () => {
  it('should export getPoolStatus function', async () => {
    const { result } = renderHook(() => useIDOPool('0xPoolAddress123'));
    
    expect(typeof result.current.getPoolStatus).toBe('function');
  });

  it('should export getRaisedPercentage function', async () => {
    const { result } = renderHook(() => useIDOPool('0xPoolAddress123'));
    
    expect(typeof result.current.getRaisedPercentage).toBe('function');
  });

  it('should export getTimeRemaining function', async () => {
    const { result } = renderHook(() => useIDOPool('0xPoolAddress123'));
    
    expect(typeof result.current.getTimeRemaining).toBe('function');
  });
});
