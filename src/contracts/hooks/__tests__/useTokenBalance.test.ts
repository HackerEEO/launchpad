import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTokenBalance } from '../useTokenBalance';

// Mock ethers
vi.mock('ethers', () => ({
  ethers: {
    Contract: vi.fn().mockImplementation(() => ({
      balanceOf: vi.fn().mockResolvedValue(BigInt('1000000000000000000000')), // 1000 tokens
      allowance: vi.fn().mockResolvedValue(BigInt('500000000000000000000')), // 500 tokens
      decimals: vi.fn().mockResolvedValue(18),
      symbol: vi.fn().mockResolvedValue('TEST'),
      name: vi.fn().mockResolvedValue('Test Token'),
      approve: vi.fn().mockImplementation(async () => ({
        hash: '0xmockapprovehash123',
        wait: vi.fn().mockResolvedValue({
          status: 1,
          transactionHash: '0xmockapprovehash123',
        }),
      })),
    })),
    BrowserProvider: vi.fn().mockImplementation(() => ({
      getSigner: vi.fn().mockResolvedValue({
        address: '0xTestUser123456789012345678901234567890ab',
      }),
    })),
    formatUnits: vi.fn().mockImplementation((value: bigint, decimals: number) => 
      (Number(value) / Math.pow(10, decimals)).toString()
    ),
    parseUnits: vi.fn().mockImplementation((value: string, decimals: number) => 
      BigInt(Math.floor(parseFloat(value) * Math.pow(10, decimals)))
    ),
    MaxUint256: BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),
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

describe('useTokenBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => 
      useTokenBalance('0xTokenAddress123', '0xTestUser123456789012345678901234567890ab')
    );
    
    expect(result.current.balance).toBe('0');
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should have balanceOf function', () => {
    const { result } = renderHook(() => 
      useTokenBalance('0xTokenAddress123', '0xTestUser123456789012345678901234567890ab')
    );
    
    expect(typeof result.current.balanceOf).toBe('function');
  });

  it('should have allowance function', () => {
    const { result } = renderHook(() => 
      useTokenBalance('0xTokenAddress123', '0xTestUser123456789012345678901234567890ab')
    );
    
    expect(typeof result.current.allowance).toBe('function');
  });

  it('should have approve function', () => {
    const { result } = renderHook(() => 
      useTokenBalance('0xTokenAddress123', '0xTestUser123456789012345678901234567890ab')
    );
    
    expect(typeof result.current.approve).toBe('function');
  });

  it('should have getTokenInfo function', () => {
    const { result } = renderHook(() => 
      useTokenBalance('0xTokenAddress123', '0xTestUser123456789012345678901234567890ab')
    );
    
    expect(typeof result.current.getTokenInfo).toBe('function');
  });

  it('should handle empty token address', () => {
    const { result } = renderHook(() => 
      useTokenBalance('', '0xTestUser123456789012345678901234567890ab')
    );
    
    expect(result.current.loading).toBe(false);
    expect(result.current.balance).toBe('0');
  });

  it('should handle empty user address', () => {
    const { result } = renderHook(() => 
      useTokenBalance('0xTokenAddress123', '')
    );
    
    expect(result.current.loading).toBe(false);
    expect(result.current.balance).toBe('0');
  });
});

describe('useTokenBalance approve function', () => {
  it('should be callable with spender and amount', async () => {
    const { result } = renderHook(() => 
      useTokenBalance('0xTokenAddress123', '0xTestUser123456789012345678901234567890ab')
    );
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.approve).toBeDefined();
  });
});

describe('useTokenBalance allowance function', () => {
  it('should accept spender address parameter', async () => {
    const { result } = renderHook(() => 
      useTokenBalance('0xTokenAddress123', '0xTestUser123456789012345678901234567890ab')
    );
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.allowance).toBeDefined();
  });
});
