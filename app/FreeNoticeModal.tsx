import { useState, useEffect, useCallback, memo } from 'react';
import { Icon } from '@/components/Icon';
import { haptic } from '@/lib/utils';

const setCookie = (name: string, value: string, days: number = 365) => {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/`;
};

const getCookie = (name: string): string | null => {
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

export const FreeNoticeModal = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const shown = getCookie('freeNoticeShown');
    if (shown !== 'true') {
      requestAnimationFrame(() => {
        setIsOpen(true);
      });
    }
  }, []);

  const handleClose = useCallback(() => {
    haptic(20);
    setIsOpen(false);
  }, []);

  const handleDontShowAgain = useCallback(() => {
    haptic(30);
    setIsOpen(false);
    setCookie('freeNoticeShown', 'true', 365);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isMounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 transition-opacity duration-300"
        style={{
          animation: 'fadeIn 0.3s ease-out'
        }}
      />

      <div
        className="relative w-full max-w-sm bg-card border border-border rounded-lg shadow-lg max-h-[90vh] flex flex-col"
        style={{
          animation: 'scaleIn 0.3s ease-out',
          willChange: 'auto'
        }}
      >
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="flex justify-center">
            <div className="text-5xl">📱</div>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              欢迎使用
            </h2>
            <p className="text-muted-foreground text-sm">
              无广告 • 无限制
            </p>
          </div>

          <div className="space-y-3 bg-muted rounded-lg p-4 border border-border">
            <div className="flex items-start gap-3">
              <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded-lg shrink-0">
                <Icon name="check" className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-foreground font-semibold text-sm mb-1">
                  无广告干扰
                </h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  纯净体验,专注使用
                </p>
              </div>
            </div>

            <div className="h-px bg-border" />

            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                <Icon name="gift" className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-foreground font-semibold text-sm mb-1">
                  无使用限制
                </h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  随心使用,畅享所有功能
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={handleClose}
              className="w-full py-3 bg-primary hover:bg-primary/90 rounded-lg text-primary-foreground font-semibold text-sm shadow-sm transition-colors"
            >
              开始使用
            </button>

            <a
              href="https://t.me/fang180"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => haptic(20)}
              className="block w-full py-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors text-center"
            >
              加入交流群 @fang180
            </a>

            <button
              onClick={handleDontShowAgain}
              className="w-full py-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              不再提示
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
});
FreeNoticeModal.displayName = 'FreeNoticeModal';

export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <FreeNoticeModal />
    </div>
  );
}
