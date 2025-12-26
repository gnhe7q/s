'use client';

import { useState, useEffect, useCallback, memo, useRef, useMemo } from 'react';
import { FreeNoticeModal } from './FreeNoticeModal';
import { NavigationMenu, MenuButton } from '@/components/NavigationMenu';
import { countries, CountryConfig } from '@/lib/countryData';
import { Icon } from '@/components/Icon';
import { haptic } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  generateName,
  generateBirthday,
  generatePhone,
  generatePassword,
  generateEmail,
  getCountryConfig,
  getAllDomains
} from '@/lib/generator';

const flagCache = new Map<string, React.ComponentType<any>>();

const loadFlagIcon = async (countryCode: string) => {
  if (flagCache.has(countryCode)) {
    return flagCache.get(countryCode)!;
  }

  try {
    const flags = await import('country-flag-icons/react/3x2');
    const FlagComponent = flags[countryCode as keyof typeof flags];
    if (FlagComponent && typeof FlagComponent === 'function') {
      flagCache.set(countryCode, FlagComponent);
      return FlagComponent;
    }
    return null;
  } catch {
    return null;
  }
};

const CountryFlag = memo(({ countryCode, className = "w-8 h-6" }: { countryCode: string; className?: string }) => {
  const [FlagComponent, setFlagComponent] = useState<React.ComponentType<any> | null>(() => flagCache.get(countryCode) || null);

  useEffect(() => {
    if (flagCache.has(countryCode)) {
      setFlagComponent(flagCache.get(countryCode)!);
      return;
    }

    let mounted = true;
    loadFlagIcon(countryCode).then((component) => {
      if (mounted && component) {
        setFlagComponent(() => component);
      }
    });

    return () => { mounted = false; };
  }, [countryCode]);

  if (!FlagComponent) {
    return (
      <div className={`${className} bg-muted rounded flex items-center justify-center`}>
        <Icon name="globe" className="w-4 h-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={`${className} rounded overflow-hidden border border-border`}>
      <FlagComponent className="w-full h-full object-cover" title={countryCode} />
    </div>
  );
});
CountryFlag.displayName = 'CountryFlag';

interface UserInfo {
  firstName: string;
  lastName: string;
  birthday: string;
  phone: string;
  password: string;
  email: string;
}

const InfoRow = memo(({ label, value, onCopy, isCopied }: {
  label: string;
  value: string;
  onCopy: () => void;
  isCopied: boolean;
}) => (
  <div
    onClick={onCopy}
    className={`group flex items-center justify-between py-4 px-4 cursor-pointer transition-all duration-200 hover:bg-accent/50 rounded-md ${
      isCopied ? 'bg-accent/70' : ''
    }`}
  >
    <span className="text-sm font-medium text-muted-foreground min-w-[80px]">
      {label}
    </span>

    <div className="flex items-center gap-3 min-w-0 flex-1 justify-end h-6 relative">
      <span
        className={`absolute right-8 text-sm font-semibold text-foreground truncate max-w-[200px] transition-all duration-200 ${
          isCopied ? 'opacity-0 scale-95 translate-y-1' : 'opacity-100 scale-100 translate-y-0'
        }`}
      >
        {value || '---'}
      </span>

      <div
        className={`absolute right-8 flex items-center gap-1.5 transition-all duration-200 ${
          isCopied ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
        }`}
      >
        <Icon name="check" className="w-4 h-4 text-green-600 dark:text-green-400" />
        <span className="text-sm font-semibold text-green-600 dark:text-green-400">已复制</span>
      </div>

      <div className="w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Icon name="copy" className="w-4 h-4 text-muted-foreground" />
      </div>
    </div>
  </div>
));
InfoRow.displayName = 'InfoRow';

const SheetOverlay = memo(({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-in fade-in-0"
      onClick={onClose}
    />
  );
});
SheetOverlay.displayName = 'SheetOverlay';

const Sheet = memo(({
  isOpen,
  onClose,
  title,
  children,
  rightAction
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  rightAction?: React.ReactNode;
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <SheetOverlay isOpen={isOpen} onClose={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 h-full w-full sm:max-w-md border-l bg-background shadow-lg animate-in slide-in-from-right duration-300">
        <div className="flex flex-col h-full">
          <div className="px-6 py-4 border-b shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
              {rightAction || (
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                  <Icon name="close" className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </>
  );
});
Sheet.displayName = 'Sheet';

const CountryList = memo(({ countries, selectedCode, onSelect }: {
  countries: CountryConfig[];
  selectedCode: string;
  onSelect: (c: CountryConfig) => void;
}) => (
  <div className="p-4 space-y-2">
    {countries.map((country) => (
      <button
        key={country.code}
        onClick={() => onSelect(country)}
        className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 border ${
          selectedCode === country.code
            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
            : 'border-transparent hover:bg-accent hover:border-border'
        }`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <CountryFlag countryCode={country.code} className="w-10 h-7 shrink-0" />
          <span className="text-sm font-medium truncate">{country.name}</span>
        </div>
        {selectedCode === country.code && (
          <Icon name="check" className="w-5 h-5 shrink-0 ml-2" />
        )}
      </button>
    ))}
  </div>
));
CountryList.displayName = 'CountryList';

const DomainList = memo(({ allDomains, selectedDomain, onSelect }: {
  allDomains: string[];
  selectedDomain: string;
  onSelect: (d: string) => void;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(50);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setVisibleCount(50);
    }, 300);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [searchQuery]);

  const filteredDomains = useMemo(() => {
    if (!debouncedQuery) return allDomains;
    const query = debouncedQuery.toLowerCase();
    return allDomains.filter(d => d.toLowerCase().includes(query));
  }, [allDomains, debouncedQuery]);

  const visibleDomains = useMemo(() => {
    return filteredDomains.slice(0, visibleCount);
  }, [filteredDomains, visibleCount]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredDomains.length) {
          setVisibleCount(prev => Math.min(prev + 50, filteredDomains.length));
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [visibleCount, filteredDomains.length]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pb-3 pt-2 sticky top-0 z-10 bg-background">
        <div className="relative">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索域名..."
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchQuery('')}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            >
              <Icon name="close" className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
      <div className="px-4 pb-4 space-y-2">
        {!debouncedQuery && (
          <button
            onClick={() => onSelect('random')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 border ${
              selectedDomain === 'random'
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'border-transparent hover:bg-accent hover:border-border'
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon name="sparkles" className={`w-4 h-4 ${selectedDomain === 'random' ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
              <span className="text-sm font-medium">随机域名</span>
            </div>
            {selectedDomain === 'random' && <Icon name="check" className="w-5 h-5" />}
          </button>
        )}
        {visibleDomains.map((domain) => (
          <button
            key={domain}
            onClick={() => onSelect(domain)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 border ${
              selectedDomain === domain
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'border-transparent hover:bg-accent hover:border-border'
            }`}
          >
            <span className="text-sm font-medium">{domain}</span>
            {selectedDomain === domain && <Icon name="check" className="w-5 h-5" />}
          </button>
        ))}
        {visibleCount < filteredDomains.length && (
          <div ref={sentinelRef} className="py-4 text-center">
            <div className="inline-block w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        )}
        {filteredDomains.length === 0 && debouncedQuery && (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">未找到匹配的域名</p>
          </div>
        )}
      </div>
    </div>
  );
});
DomainList.displayName = 'DomainList';

export default function HomePage() {
  const [selectedCountry, setSelectedCountry] = useState<CountryConfig>(countries[0]);
  const [selectedDomain, setSelectedDomain] = useState<string>('random');
  const [userInfo, setUserInfo] = useState<UserInfo>(() => {
    const { firstName, lastName } = generateName(countries[0].code);
    const birthday = generateBirthday();
    const phone = generatePhone(countries[0]);
    const password = generatePassword();
    const email = generateEmail(firstName, lastName);
    return { firstName, lastName, birthday, phone, password, email };
  });
  const [showCountrySheet, setShowCountrySheet] = useState(false);
  const [showDomainSheet, setShowDomainSheet] = useState(false);
  const [ipInfo, setIpInfo] = useState({ ip: '...', country: 'US' });
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [inboxStatus, setInboxStatus] = useState<'idle' | 'opening'>('idle');
  const [showMenu, setShowMenu] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const copyTimerRef = useRef<NodeJS.Timeout | null>(null);

  const copyToClipboard = useCallback(async (text: string, label: string) => {
    haptic(30);
    try {
      await navigator.clipboard.writeText(text);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      setCopiedField(label);
      copyTimerRef.current = setTimeout(() => setCopiedField(null), 2000);
    } catch {
      haptic(50);
    }
  }, []);

  const generate = useCallback(() => {
    haptic(50);
    setIsGenerating(true);
    setCopiedField(null);

    setTimeout(() => {
      try {
        const { firstName, lastName } = generateName(selectedCountry.code);
        const birthday = generateBirthday();
        const phone = generatePhone(selectedCountry);
        const password = generatePassword();
        const customDomain = selectedDomain === 'random' ? undefined : selectedDomain;
        const email = generateEmail(firstName, lastName, customDomain);
        setUserInfo({ firstName, lastName, birthday, phone, password, email });
      } catch (error) {
        console.error(error);
      } finally {
        setIsGenerating(false);
      }
    }, 150);
  }, [selectedCountry, selectedDomain]);

  const handleInboxClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (inboxStatus === 'opening') return;
    haptic(30);
    setInboxStatus('opening');
    const emailName = userInfo.email.split('@')[0];
    setTimeout(() => {
      window.open(`https://yopmail.net/?login=${emailName}`, '_blank');
      setInboxStatus('idle');
    }, 600);
  }, [userInfo.email, inboxStatus]);

  useEffect(() => {
    let isMounted = true;
    const detectIP = async () => {
      try {
        const response = await fetch('/api/ip-info');
        const data = await response.json();
        if (!isMounted) return;
        setIpInfo({ ip: data.ip || '未知', country: data.country || 'US' });
        if (data.country && data.accurate) {
          const detectedCountry = getCountryConfig(data.country);
          if (detectedCountry) {
            setSelectedCountry(detectedCountry);
            const { firstName, lastName } = generateName(detectedCountry.code);
            const birthday = generateBirthday();
            const phone = generatePhone(detectedCountry);
            const password = generatePassword();
            const customDomain = selectedDomain === 'random' ? undefined : selectedDomain;
            const email = generateEmail(firstName, lastName, customDomain);
            setUserInfo({ firstName, lastName, birthday, phone, password, email });
          }
        }
      } catch (error) {
        if (isMounted) {
          setIpInfo({ ip: '未知', country: 'US' });
        }
      }
    };
    detectIP();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (userInfo.firstName) generate();
  }, [selectedCountry.code]);

  const allDomains = useMemo(() => getAllDomains(), []);
  const displayDomain = selectedDomain === 'random' ? '随机' : selectedDomain;

  const handleCountrySelect = useCallback((country: CountryConfig) => {
    haptic(20);
    setSelectedCountry(country);
    setShowCountrySheet(false);
  }, []);

  const handleDomainSelect = useCallback((domain: string) => {
    haptic(20);
    setSelectedDomain(domain);
    setShowDomainSheet(false);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <FreeNoticeModal />

      <div className="relative">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between px-4 max-w-3xl mx-auto">
            <h1 className="text-lg font-semibold tracking-tight">脸书小助手</h1>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="gap-1.5 px-2.5 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="font-mono text-xs">{ipInfo.ip}</span>
              </Badge>
              <MenuButton onClick={() => { haptic(20); setShowMenu(true); }} />
            </div>
          </div>
        </header>

        <main className="container max-w-3xl mx-auto px-4 py-8 space-y-6">
          <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">生成的身份信息</CardTitle>
                  <CardDescription>点击任意字段即可复制到剪贴板</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-0.5 px-2">
                    <InfoRow label="姓氏" value={userInfo.lastName} onCopy={() => copyToClipboard(userInfo.lastName, '姓氏')} isCopied={copiedField === '姓氏'} />
                    <InfoRow label="名字" value={userInfo.firstName} onCopy={() => copyToClipboard(userInfo.firstName, '名字')} isCopied={copiedField === '名字'} />
                    <InfoRow label="生日" value={userInfo.birthday} onCopy={() => copyToClipboard(userInfo.birthday, '生日')} isCopied={copiedField === '生日'} />
                    <InfoRow label="手机号" value={userInfo.phone} onCopy={() => copyToClipboard(userInfo.phone, '手机号')} isCopied={copiedField === '手机号'} />
                    <InfoRow label="密码" value={userInfo.password} onCopy={() => copyToClipboard(userInfo.password, '密码')} isCopied={copiedField === '密码'} />
                  </div>

                  <Separator className="my-4" />

                  <div className="px-4 pb-4 space-y-3">
                    <div
                      className="flex items-center justify-between py-3 px-4 cursor-pointer transition-all duration-200 hover:bg-accent/50 rounded-md"
                      onClick={() => copyToClipboard(userInfo.email, '邮箱')}
                    >
                      <span className="text-sm font-medium text-muted-foreground min-w-[80px]">邮箱</span>
                      <div className="flex items-center gap-3 min-w-0 flex-1 justify-end h-6 relative">
                        <span className={`absolute right-0 text-sm font-semibold text-foreground truncate max-w-[180px] transition-all duration-200 ${
                          copiedField === '邮箱' ? 'opacity-0 scale-95 translate-y-1' : 'opacity-100 scale-100 translate-y-0'
                        }`}>
                          {userInfo.email}
                        </span>
                        <div className={`absolute right-0 flex items-center gap-1.5 transition-all duration-200 ${
                          copiedField === '邮箱' ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
                        }`}>
                          <Icon name="check" className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-sm font-semibold text-green-600 dark:text-green-400">已复制</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleInboxClick}
                        disabled={inboxStatus === 'opening'}
                        className={inboxStatus === 'opening' ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' : ''}
                      >
                        {inboxStatus === 'opening' ? (
                          <>
                            <Icon name="open" className="w-3.5 h-3.5 mr-1.5" />
                            已打开收件箱
                          </>
                        ) : (
                          <>
                            <Icon name="inbox" className="w-3.5 h-3.5 mr-1.5" />
                            查看收件箱
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={generate}
                disabled={isGenerating}
                size="lg"
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Icon name="sparkles" className="w-4 h-4 mr-2" />
                    生成新身份
                  </>
                )}
              </Button>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">生成设置</CardTitle>
                  <CardDescription>自定义身份生成参数</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <button
                    onClick={() => { haptic(20); setShowCountrySheet(true); }}
                    className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-accent transition-colors border border-transparent hover:border-border"
                  >
                    <span className="text-sm font-medium">选择地区</span>
                    <div className="flex items-center gap-2">
                      <CountryFlag countryCode={selectedCountry.code} className="w-7 h-5" />
                      <span className="text-sm text-muted-foreground">{selectedCountry.name}</span>
                      <Icon name="chevronRight" className="w-4 h-4 text-muted-foreground ml-1" />
                    </div>
                  </button>

                  <button
                    onClick={() => { haptic(20); setShowDomainSheet(true); }}
                    className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-accent transition-colors border border-transparent hover:border-border"
                  >
                    <span className="text-sm font-medium">邮箱域名</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono text-xs">{displayDomain}</Badge>
                      <Icon name="chevronRight" className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </button>
                </CardContent>
              </Card>

          <footer className="pt-4 text-center space-y-3">
            <a
              href="https://t.me/fang180"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium transition-colors"
            >
              <Icon name="link" className="w-4 h-4" />
              加入 Telegram 频道
            </a>
            <p className="text-xs text-muted-foreground">
              支持 {countries.length} 个国家/地区 • {allDomains.length} 个邮箱域名
            </p>
          </footer>
        </main>
      </div>

      <Sheet
        isOpen={showCountrySheet}
        onClose={() => setShowCountrySheet(false)}
        title="选择地区"
      >
        <CountryList countries={countries} selectedCode={selectedCountry.code} onSelect={handleCountrySelect} />
      </Sheet>

      <Sheet
        isOpen={showDomainSheet}
        onClose={() => setShowDomainSheet(false)}
        title="选择域名"
        rightAction={
          <Button variant="ghost" size="sm" onClick={() => setShowDomainSheet(false)}>
            完成
          </Button>
        }
      >
        <DomainList allDomains={allDomains} selectedDomain={selectedDomain} onSelect={handleDomainSelect} />
      </Sheet>

      <NavigationMenu isOpen={showMenu} onClose={() => setShowMenu(false)} />
    </div>
  );
}
