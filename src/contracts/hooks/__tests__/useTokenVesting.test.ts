import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTokenVesting } from '../useTokenVesting';

// Mock ethers
vi.mock('ethers', () => ({
  ethers: {
    Contract: vi.fn().mockImplementation(() => ({
      getVestingSchedule: vi.fn().mockResolvedValue({
        beneficiary: '0xTestUser123456789012345678901234567890ab',
        totalAmount: BigInt('1000000000000000000000'), // 1000 tokens
        releasedAmount: BigInt('100000000000000000000'), // 100 tokens
        startTime: BigInt(Math.floor(Date.now() / 1000) - 86400),
        cliffDuration: BigInt(2592000), // 30 days
        vestingDuration: BigInt(31536000), // 365 days
        revoked: false,
      }),
      computeReleasableAmount: vi.fn().mockResolvedValue(
        BigInt('50000000000000000000') // 50 tokens
      ),
      release: vi.fn().mockImplementation(async () => ({
        hash: '0xmockreleasehash123',
        wait: vi.fn().mockResolvedValue({
          status: 1,
          transactionHash: '0xmockreleasehash123',
        }),
      })),
    })),
    BrowserProvider: vi.fn().mockImplementation(() => ({
      getSigner: vi.fn().mockResolvedValue({
        address: '0xTestUser123456789012345678901234567890ab',
      }),
    })),
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

describe('useTokenVesting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useTokenVesting('0xVestingContract123'));
    
    expect(result.current.vestingSchedule).toBeNull();
    expect(result.current.releasableAmount).toBe('0');
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should have release function', () => {
    const { result } = renderHook(() => useTokenVesting('0xVestingContract123'));
    
    expect(typeof result.current.release).toBe('function');
  });

  it('should have refreshSchedule function', () => {
    const { result } = renderHook(() => useTokenVesting('0xVestingContract123'));
    
    expect(typeof result.current.refreshSchedule).toBe('function');
  });

  it('should handle empty contract address', () => {
    const { result } = renderHook(() => useTokenVesting(''));
    
    expect(result.current.loading).toBe(false);
    expect(result.current.vestingSchedule).toBeNull();
  });
});

describe('useTokenVesting vesting calculations', () => {
  it('should export getVestedPercentage function', () => {
    const { result } = renderHook(() => useTokenVesting('0xVestingContract123'));
    
    expect(typeof result.current.getVestedPercentage).toBe('function');
  });

  it('should export getTimeUntilNextRelease function', () => {
    const { result } = renderHook(() => useTokenVesting('0xVestingContract123'));
    
    expect(typeof result.current.getTimeUntilNextRelease).toBe('function');
  });

  it('should export isCliffPassed function', () => {
    const { result } = renderHook(() => useTokenVesting('0xVestingContract123'));
    
    expect(typeof result.current.isCliffPassed).toBe('function');
  });
});

describe('useTokenVesting release function', () => {
  it('should be callable', async () => {
    const { result } = renderHook(() => useTokenVesting('0xVestingContract123'));
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.release).toBeDefined();
  });
});
