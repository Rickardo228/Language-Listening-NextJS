'use client'

import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

export interface ModalProps {
  // Control
  isOpen: boolean;
  onClose: () => void;

  // Content
  title?: ReactNode;
  children: ReactNode;

  // Layout
  size?: 'sm' | 'md' | 'lg' | 'xl';

  // Header customization
  icon?: ReactNode;
  subtitle?: ReactNode;
  showCloseButton?: boolean;
  headerActions?: ReactNode;

  // Footer
  footer?: ReactNode;

  // Styling
  className?: string;
  panelClassName?: string;

  // Behavior
  closeOnBackdropClick?: boolean;
  enableBlur?: boolean;

  // Animation
  animationVariant?: 'fade' | 'scale' | 'slideUp';
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

const animationVariants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  slideUp: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 },
  },
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  icon,
  subtitle,
  showCloseButton = true,
  headerActions,
  footer,
  className = '',
  panelClassName = '',
  closeOnBackdropClick = true,
  enableBlur = false,
  animationVariant = 'scale',
}: ModalProps) {
  const animation = animationVariants[animationVariant];

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog
          static
          open={isOpen}
          onClose={closeOnBackdropClick ? onClose : () => { }}
          className="relative z-50"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 bg-black/50 ${enableBlur ? 'backdrop-blur-sm' : ''}`}
            aria-hidden="true"
          />

          {/* Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel
              as={motion.div}
              initial={animation.initial}
              animate={animation.animate}
              exit={animation.exit}
              className={`bg-background text-foreground rounded-lg shadow-lg w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col ${panelClassName}`}
            >
              {/* Header */}
              {(title || icon || headerActions || showCloseButton) && (
                <div className="flex items-start justify-between p-6 pb-4 border-b border-border">
                  <div className="flex items-start gap-3 flex-1">
                    {icon && <div className="flex-shrink-0">{icon}</div>}
                    <div className="flex-1">
                      {title && (
                        <Dialog.Title className="text-xl font-bold text-foreground">
                          {title}
                        </Dialog.Title>
                      )}
                      {subtitle && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {headerActions}
                    {showCloseButton && (
                      <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-secondary"
                        aria-label="Close"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Body */}
              <div className={`flex-1 overflow-y-auto p-6 ${className}`}>
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className="border-t border-border p-4 flex justify-end gap-2">
                  {footer}
                </div>
              )}
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}

// Subcomponents for composition (optional usage)
Modal.Header = function ModalHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`p-6 pb-4 border-b border-border ${className}`}>{children}</div>;
};

Modal.Body = function ModalBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`flex-1 overflow-y-auto p-6 ${className}`}>{children}</div>;
};

Modal.Footer = function ModalFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`border-t border-border p-4 flex justify-end gap-2 ${className}`}>{children}</div>;
};
