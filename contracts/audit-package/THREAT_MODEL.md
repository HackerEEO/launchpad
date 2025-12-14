# CryptoLaunch Smart Contract Threat Model

**Version:** 1.0  
**Date:** December 12, 2025  
**Author:** Security Team  

---

## Executive Summary

This document identifies potential attack vectors, vulnerabilities, and security considerations for the CryptoLaunch IDO platform smart contracts. It provides recommended mitigations for each identified threat.

---

## 1. Contract Overview

| Contract | Purpose | Risk Level |
|----------|---------|------------|
| `IDOPool.sol` | Handles investments, token distribution, refunds | **Critical** |
| `TokenVesting.sol` | Manages token vesting schedules | **High** |
| `LaunchpadFactory.sol` | Creates and tracks IDO pools | **High** |
| `Whitelist.sol` | Manages KYC/whitelist access | **Medium** |

---

## 2. Threat Analysis

### 2.1 Reentrancy Attacks

**Risk Level:** 🔴 Critical

**Description:**  
External calls (ETH transfers, token transfers) could allow malicious contracts to re-enter functions before state updates complete.

**Attack Vectors:**
- `invest()` → external call to refund excess → reenter
- `claim()` → token transfer → reenter  
- `refund()` → ETH transfer → reenter
- `emergencyWithdraw()` → ETH transfer → reenter

**Current Mitigations:**
- ✅ `ReentrancyGuard` from OpenZeppelin applied to all state-changing functions
- ✅ Checks-Effects-Interactions pattern followed
- ✅ State updates before external calls

**Recommendations:**
- Ensure ALL functions with external calls have `nonReentrant` modifier
- Consider using `pull` pattern for ETH withdrawals instead of `push`
- Add reentrancy tests to test suite

---

### 2.2 Price Manipulation / Oracle Attacks

**Risk Level:** 🟡 Medium

**Description:**  
Token price is set at deployment and is immutable. No oracle dependency reduces risk, but creates different concerns.

**Attack Vectors:**
- Admin sets incorrect price at deployment
- No mechanism to update price for market conditions
- Front-running large investments

**Current Mitigations:**
- ✅ Price is immutable after deployment (prevents manipulation)
- ✅ No external oracle dependency

**Recommendations:**
- Add price sanity checks in factory (min/max bounds)
- Consider time-weighted average price for volatile tokens
- Document price-setting procedures for admins

---

### 2.3 Integer Overflow/Underflow

**Risk Level:** 🟢 Low

**Description:**  
Solidity 0.8.x has built-in overflow protection, but unchecked blocks and edge cases remain risks.

**Attack Vectors:**
- Token allocation calculation: `(investment * 1e18) / tokenPrice`
- Vesting calculations with large numbers
- TGE percentage calculations

**Current Mitigations:**
- ✅ Solidity 0.8.20 with built-in overflow checks
- ✅ SafeERC20 for token operations

**Recommendations:**
- Review any `unchecked` blocks carefully
- Add fuzz tests for extreme values
- Test with maximum uint256 values

---

### 2.4 Access Control Vulnerabilities

**Risk Level:** 🔴 Critical

**Description:**  
Improper access control could allow unauthorized users to execute admin functions.

**Attack Vectors:**
- Unauthorized pool finalization
- Unauthorized emergency withdrawals
- Whitelist manipulation
- Factory parameter changes

**Current Mitigations:**
- ✅ OpenZeppelin `Ownable` for admin functions
- ✅ Custom modifiers for specific checks
- ✅ Multi-level access (pool owner vs factory owner)

**Recommendations:**
- ✅ Replace single owner with multi-sig for mainnet
- Add timelocks on critical admin functions
- Implement two-step ownership transfer
- Add role-based access control (RBAC) for granular permissions
- Log all admin actions with events

---

### 2.5 Denial of Service (DoS)

**Risk Level:** 🟡 Medium

**Description:**  
Attackers could prevent legitimate users from using the protocol.

**Attack Vectors:**
- Gas griefing on batch operations
- Block stuffing during critical periods
- Unbounded loops in batch whitelist operations
- Reaching hard cap just before sale ends

**Current Mitigations:**
- ✅ Batch size limits on whitelist operations
- ✅ Individual claiming (no batch claims)

**Recommendations:**
- Add gas limits on batch operations
- Implement emergency pause functionality
- Consider pull-based claiming over push-based
- Add maximum batch size constants

---

### 2.6 Front-Running / MEV

**Risk Level:** 🟡 Medium

**Description:**  
Miners/validators can reorder transactions for profit.

**Attack Vectors:**
- Front-run investments to fill allocation
- Front-run finalization to claim before state change
- Sandwich attacks on large investments

**Current Mitigations:**
- ✅ Whitelist limits investment per address
- ✅ Investment caps reduce sandwich value

**Recommendations:**
- Consider commit-reveal scheme for large investments
- Add minimum time between investment and claim
- Document MEV risks to users
- Consider Flashbots Protect for mainnet transactions

---

### 2.7 ERC20 Token Vulnerabilities

**Risk Level:** 🟡 Medium

**Description:**  
Non-standard ERC20 tokens could cause unexpected behavior.

**Attack Vectors:**
- Fee-on-transfer tokens reducing received amounts
- Rebasing tokens changing balances
- Tokens with blacklist functionality
- Missing return value tokens
- Pausable tokens

**Current Mitigations:**
- ✅ SafeERC20 for all transfers
- ✅ Balance checks before/after transfers

**Recommendations:**
- Add token validation in factory before pool creation
- Document supported token types
- Consider token whitelist for sale tokens
- Add explicit fee-on-transfer handling

---

### 2.8 Timestamp Manipulation

**Risk Level:** 🟢 Low

**Description:**  
Block timestamps can be manipulated by miners within bounds (~15 seconds).

**Attack Vectors:**
- Manipulating sale start/end times
- Affecting vesting calculations
- Cliff period manipulation

**Current Mitigations:**
- ✅ Using block.timestamp (standard practice)
- ✅ Long time periods (days/weeks) reduce manipulation impact

**Recommendations:**
- Use block numbers for critical timing where possible
- Add buffer periods around critical timestamps
- Minimum sale duration requirements

---

### 2.9 Upgrade/Migration Risks

**Risk Level:** 🟡 Medium

**Description:**  
Contracts are not upgradeable, which is both a security feature and limitation.

**Attack Vectors:**
- No way to fix critical bugs post-deployment
- Locked funds if contract has issues
- Version fragmentation across pools

**Current Mitigations:**
- ✅ Non-upgradeable (immutable logic)
- ✅ Emergency withdraw function

**Recommendations:**
- Thorough testing before deployment
- Clear migration documentation
- Consider upgradeable proxy for factory only
- Add timelock on factory updates

---

### 2.10 Flash Loan Attacks

**Risk Level:** 🟢 Low (for this protocol)

**Description:**  
Flash loans could be used to manipulate state within a single transaction.

**Attack Vectors:**
- Borrowing funds to fill hard cap, then refunding
- Manipulating soft cap thresholds
- Governance attacks (if added)

**Current Mitigations:**
- ✅ Whitelist requirement limits flash loan utility
- ✅ KYC requirement (off-chain) adds friction
- ✅ No same-block claims

**Recommendations:**
- Add minimum holding period before claims
- Consider block delay between investment and withdrawal
- Monitor for unusual transaction patterns

---

## 3. Smart Contract Security Checklist

### 3.1 General Security

- [x] ReentrancyGuard on all external functions
- [x] Checks-Effects-Interactions pattern
- [x] SafeERC20 for token transfers
- [x] Ownable for access control
- [x] Events for all state changes
- [x] Custom errors for gas efficiency
- [ ] Pausable functionality for emergencies
- [ ] Timelocks on admin functions
- [ ] Multi-sig requirement for mainnet

### 3.2 Input Validation

- [x] Zero address checks
- [x] Zero amount checks
- [x] Timestamp sanity checks
- [x] Cap relationship validation (soft < hard)
- [x] Percentage bounds (0-100)
- [ ] Token decimals validation
- [ ] Maximum value bounds

### 3.3 State Management

- [x] Proper initialization
- [x] Finalization state machine
- [x] Claim tracking per user
- [x] Investment tracking per user
- [ ] Invariant testing

### 3.4 External Interactions

- [x] SafeERC20 for tokens
- [x] Low-level call for ETH transfers
- [x] Return value checking
- [ ] Gas stipend considerations

---

## 4. Recommended Security Measures for Production

### 4.1 Pre-Deployment

1. **Professional Audit**
   - Engage at least 2 audit firms
   - Budget: $30,000 - $100,000
   - Timeline: 3-4 weeks

2. **Bug Bounty Program**
   - Setup on Immunefi
   - Initial pool: $10,000 - $50,000
   - Tiered rewards by severity

3. **Testing Requirements**
   - Unit tests: >95% coverage
   - Integration tests: all user flows
   - Fuzz tests: edge cases
   - Invariant tests: state consistency

### 4.2 Deployment

1. **Multi-Sig Wallet**
   - Use Gnosis Safe for ownership
   - Minimum 3-of-5 signers
   - Geographically distributed

2. **Staged Rollout**
   - Testnet deployment first
   - Limited mainnet launch
   - Gradual cap increases

3. **Monitoring**
   - Forta agents for attack detection
   - OpenZeppelin Defender for automation
   - Real-time alerts on suspicious activity

### 4.3 Post-Deployment

1. **Incident Response Plan**
   - Documented procedures
   - Emergency contacts
   - Communication templates

2. **Regular Reviews**
   - Quarterly security reviews
   - Dependency updates
   - New vulnerability monitoring

---

## 5. Attack Severity Matrix

| Attack Type | Likelihood | Impact | Overall Risk | Priority |
|-------------|------------|--------|--------------|----------|
| Reentrancy | Low | Critical | High | P1 |
| Access Control | Low | Critical | High | P1 |
| DoS | Medium | Medium | Medium | P2 |
| Front-running | Medium | Low | Low | P3 |
| ERC20 Issues | Medium | Medium | Medium | P2 |
| Timestamp | Low | Low | Low | P4 |
| Overflow | Very Low | High | Low | P3 |
| Flash Loan | Very Low | Medium | Low | P4 |

---

## 6. Conclusion

The CryptoLaunch smart contracts implement industry-standard security practices including ReentrancyGuard, SafeERC20, and Ownable access control. The primary remaining concerns are:

1. **Multi-sig requirement** for mainnet admin functions
2. **Professional audit** before mainnet deployment
3. **Bug bounty program** for ongoing security
4. **Monitoring infrastructure** for attack detection

With these measures in place, the contracts should be suitable for production use.

---

*This threat model should be reviewed and updated after each significant code change or security incident.*
