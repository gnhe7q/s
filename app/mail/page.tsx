'use client';

import { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { tempMailList, isFavorite, toggleFavorite, type TempMail } from '@/lib/mailData';
import { NavigationMenu, MenuButton } from '@/components/NavigationMenu';
import { Icon } from '@/components/Icon';
import { haptic } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface MailCardProps {
  mail: TempMail;
  isFav: boolean;
  onToggleFavorite: (mail: TempMail) => void;
  onCopy: (url: string, name: string) => void;
  copiedId: string | null;
}

const MailCard = memo(({ mail, isFav, onToggleFavorite, onCopy, copiedId }: MailCardProps) => {
  const isCopied = copiedId === mail.id;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-foreground truncate">
              {mail.name}
            </h3>
            {mail.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {mail.description}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { haptic(30); onToggleFavorite(mail); }}
            className="shrink-0"
          >
            <Icon
              name={isFav ? 'star' : 'starOutline'}
              className={`w-5 h-5 ${isFav ? 'text-yellow-500' : 'text-muted-foreground'}`}
            />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            asChild
            className="flex-1"
          >
            <a
              href={mail.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => haptic(20)}
            >
              访问网站
            </a>
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={() => { haptic(30); onCopy(mail.url, mail.id); }}
            className="shrink-0"
          >
            {isCopied ? (
              <Icon name="check" className="w-5 h-5 text-primary" />
            ) : (
              <Icon name="copy" className="w-5 h-5" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
MailCard.displayName = 'MailCard';

export default function MailPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const favs = new Set(
      tempMailList.filter(mail => isFavorite(mail.id)).map(mail => mail.id)
    );
    setFavorites(favs);
  }, []);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 200);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [searchQuery]);

  const filteredMails = useMemo(() => {
    if (!debouncedQuery) return tempMailList;
    const query = debouncedQuery.toLowerCase();
    return tempMailList.filter(mail =>
      mail.name.toLowerCase().includes(query) ||
      mail.description?.toLowerCase().includes(query) ||
      mail.url.toLowerCase().includes(query)
    );
  }, [debouncedQuery]);

  const handleToggleFavorite = useCallback((mail: TempMail) => {
    const newIsFav = toggleFavorite(mail);
    setFavorites(prev => {
      const next = new Set(prev);
      if (newIsFav) {
        next.add(mail.id);
      } else {
        next.delete(mail.id);
      }
      return next;
    });
  }, []);

  const handleCopy = useCallback(async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (error) {
      console.error('Copy failed:', error);
      haptic(50);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background relative z-10">
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold text-foreground">
            临时邮箱大全
          </h1>
          <MenuButton onClick={() => { haptic(20); setShowMenu(true); }} />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon name="search" className="w-5 h-5 text-muted-foreground" />
          </div>
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索临时邮箱..."
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { haptic(20); setSearchQuery(''); }}
              className="absolute inset-y-0 right-0 h-full"
            >
              <Icon name="close" className="w-4 h-4 text-muted-foreground" />
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {filteredMails.length > 0 ? (
            filteredMails.map((mail) => (
              <MailCard
                key={mail.id}
                mail={mail}
                isFav={favorites.has(mail.id)}
                onToggleFavorite={handleToggleFavorite}
                onCopy={handleCopy}
                copiedId={copiedId}
              />
            ))
          ) : (
            <div className="text-center py-16 text-muted-foreground text-sm">
              未找到匹配的邮箱服务
            </div>
          )}
        </div>
      </main>

      <NavigationMenu isOpen={showMenu} onClose={() => setShowMenu(false)} />
    </div>
  );
}
