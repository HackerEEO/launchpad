/**
 * @file TransactionModal.tsx
 * @description Modal component for displaying transaction status
 * Shows gas estimates, pending state, confirmation, and explorer links
 */

import { motion } from 'framer-motion';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export type TransactionStatus = 'idle' | 'estimating' | 'pending' | 'confirming' | 'success' | 'error';

export interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: TransactionStatus;
  title?: string;
  
  // Gas estimation
  gasEstimate?: {
    gasLimit: string;
    gasCost: string;
    totalCost: string;
  };
  
  // Transaction details
  txHash?: string;
  explorerUrl?: string;
  errorMessage?: string;
  
  // Actions
  onConfirm?: () => void;
  onRetry?: () => void;
  confirmLabel?: string;
  
  // Amount display
  amount?: string;
  tokenSymbol?: string;
}

export function TransactionModal({
  isOpen,
  onClose,
  status,
  title = 'Transaction',
  gasEstimate,
  txHash,
  explorerUrl,
  errorMessage,
  onConfirm,
  onRetry,
  confirmLabel = 'Confirm',
  amount,
  tokenSymbol = 'ETH',
}: TransactionModalProps) {
  const canClose = status === 'idle' || status === 'success' || status === 'error';
  
  const getStatusConfig = () => {
    switch (status) {
      case 'estimating':
        return {
          icon: <SpinnerIcon className="h-12 w-12 text-primary-500" />,
          title: 'Estimating Gas',
          description: 'Calculating transaction costs...',
        };
      case 'pending':
        return {
          icon: <WalletIcon className="h-12 w-12 text-primary-500" />,
          title: 'Confirm in Wallet',
          description: 'Please confirm the transaction in your wallet',
        };
      case 'confirming':
        return {
          icon: <SpinnerIcon className="h-12 w-12 text-amber-500" />,
          title: 'Transaction Pending',
          description: 'Waiting for blockchain confirmation...',
        };
      case 'success':
        return {
          icon: <CheckIcon className="h-12 w-12 text-green-500" />,
          title: 'Transaction Successful',
          description: 'Your transaction has been confirmed',
        };
      case 'error':
        return {
          icon: <ErrorIcon className="h-12 w-12 text-red-500" />,
          title: 'Transaction Failed',
          description: errorMessage || 'Something went wrong',
        };
      default:
        return {
          icon: <InfoIcon className="h-12 w-12 text-primary-500" />,
          title: title,
          description: 'Review transaction details',
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={canClose ? onClose : () => {}} 
      title={statusConfig.title}
    >
      <div className="flex flex-col items-center py-6">
        {/* Status Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="mb-4"
        >
          {statusConfig.icon}
        </motion.div>

        {/* Description */}
        <p className="text-center text-slate-400 mb-6">
          {statusConfig.description}
        </p>

        {/* Amount Display */}
        {amount && status === 'idle' && (
          <div className="w-full bg-slate-700/50 rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Amount</span>
              <span className="text-lg font-semibold text-white">
                {amount} {tokenSymbol}
              </span>
            </div>
          </div>
        )}

        {/* Gas Estimation */}
        {gasEstimate && status === 'idle' && (
          <div className="w-full bg-slate-700/50 rounded-xl p-4 mb-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Estimated Gas</span>
              <span className="text-slate-300">{gasEstimate.gasCost} ETH</span>
            </div>
            <div className="flex justify-between text-sm border-t border-slate-600 pt-2">
              <span className="text-slate-400">Total Cost</span>
              <span className="text-white font-medium">{gasEstimate.totalCost} ETH</span>
            </div>
          </div>
        )}

        {/* Transaction Hash */}
        {txHash && (status === 'confirming' || status === 'success') && (
          <div className="w-full bg-slate-700/50 rounded-xl p-4 mb-4">
            <div className="flex flex-col gap-2">
              <span className="text-sm text-slate-400">Transaction Hash</span>
              <code className="text-xs text-primary-400 break-all">
                {txHash}
              </code>
            </div>
          </div>
        )}

        {/* Explorer Link */}
        {explorerUrl && (status === 'confirming' || status === 'success') && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors mb-6"
          >
            <ExternalLinkIcon className="h-4 w-4" />
            View on Explorer
          </a>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 w-full">
          {status === 'idle' && onConfirm && (
            <>
              <Button
                variant="outline"
                className="flex-1"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <Button
                variant="outline"
                className="flex-1"
                onClick={onClose}
              >
                Close
              </Button>
              {onRetry && (
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={onRetry}
                >
                  Try Again
                </Button>
              )}
            </>
          )}

          {status === 'success' && (
            <Button
              variant="primary"
              className="w-full"
              onClick={onClose}
            >
              Done
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

// Icons
function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

export default TransactionModal;
