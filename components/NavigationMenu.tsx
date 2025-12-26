'use client';

import { useEffect, memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/Icon';

interface NavigationMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NavigationMenu = memo(({ isOpen, onClose }: NavigationMenuProps) => {
  const pathname = usePathname();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const menuItems = [
    { href: '/', label: '脸书小助手', icon: 'home' },
    { href: '/sjh', label: '手机号生成器', icon: 'phone' },
    { href: '/mail', label: '临时邮箱', icon: 'mail' },
    { href: '/mail/favorites', label: '我的收藏', icon: 'star' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-end">
      <div
        className="absolute inset-0 bg-black/50 transition-opacity duration-300"
        onClick={onClose}
      />

      <div
        className="relative w-[280px] h-full bg-card border-l border-border shadow-lg flex flex-col"
        style={{
          animation: 'slideInRight 0.3s ease-out',
          willChange: 'transform'
        }}
      >
        <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
          <h3 className="text-lg font-semibold text-foreground">
            导航菜单
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
          >
            <Icon name="close" className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-accent text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <Icon name={item.icon} className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
});
NavigationMenu.displayName = 'NavigationMenu';

export const MenuButton = memo(({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="p-2 rounded-lg bg-card border border-border shadow-sm hover:bg-accent transition-colors"
  >
    <Icon name="menu" className="w-5 h-5 text-foreground" />
  </button>
));
MenuButton.displayName = 'MenuButton';
