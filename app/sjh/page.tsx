'use client';

import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { countries, generatePhoneNumber, searchCountries, type CountryData } from '@/lib/phoneData';
import { NavigationMenu, MenuButton } from '@/components/NavigationMenu';
import { Icon } from '@/components/Icon';
import { haptic } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

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

const STORAGE_KEY_COUNTRY = 'phone_generator_selected_country';
const STORAGE_KEY_COUNT = 'phone_generator_count';

interface CountrySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (country: CountryData) => void;
  currentCountry: CountryData | null;
}

const CountrySelector = memo(({ isOpen, onClose, onSelect, currentCountry }: CountrySelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const ITEMS_PER_PAGE = 50;

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(0);
    }, 200);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [searchQuery]);

  const filteredCountries = useMemo(() => {
    return searchCountries(debouncedQuery);
  }, [debouncedQuery]);

  const paginatedCountries = useMemo(() => {
    const start = page * ITEMS_PER_PAGE;
    return filteredCountries.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCountries, page]);

  const totalPages = Math.ceil(filteredCountries.length / ITEMS_PER_PAGE);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setSearchQuery('');
      setPage(0);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [page]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 h-full w-full sm:max-w-md border-l bg-background shadow-lg">
        <div className="flex flex-col h-full">
          <div className="px-6 py-4 border-b shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold tracking-tight">选择国家/地区</h2>
              <Button variant="ghost" size="icon" onClick={() => { haptic(20); onClose(); }} className="h-8 w-8">
                <Icon name="close" className="w-4 h-4" />
              </Button>
            </div>

            <div className="relative">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索国家或区号..."
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { haptic(20); setSearchQuery(''); }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                >
                  <Icon name="close" className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              找到 {filteredCountries.length} 个国家
            </p>
          </div>

          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {paginatedCountries.map((country) => (
                <button
                  key={country.id}
                  onClick={() => {
                    haptic(30);
                    onSelect(country);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                    currentCountry?.id === country.id
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-card border-transparent hover:bg-accent hover:border-border'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <CountryFlag countryCode={country.id} className="w-10 h-7 shrink-0" />
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-sm font-medium truncate">
                        {country.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {country.code}
                      </div>
                    </div>
                  </div>
                  {currentCountry?.id === country.id && (
                    <Icon name="check" className="w-5 h-5 shrink-0 ml-2" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {totalPages > 1 && (
            <div className="shrink-0 p-4 border-t">
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { haptic(20); setPage(p => Math.max(0, p - 1)); }}
                  disabled={page === 0}
                >
                  上一页
                </Button>
                <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                  {page + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { haptic(20); setPage(p => Math.min(totalPages - 1, p + 1)); }}
                  disabled={page >= totalPages - 1}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
CountrySelector.displayName = 'CountrySelector';

export default function PhoneGeneratorPage() {
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const [generatedNumbers, setGeneratedNumbers] = useState<string[]>([]);
  const [count, setCount] = useState<number>(10);
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [isCopiedAll, setIsCopiedAll] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    try {
      const savedCountryId = localStorage.getItem(STORAGE_KEY_COUNTRY);
      const savedCount = localStorage.getItem(STORAGE_KEY_COUNT);

      if (savedCountryId) {
        const country = countries.find(c => c.id === savedCountryId);
        if (country) {
          setSelectedCountry(country);
        } else {
          setSelectedCountry(countries[0]);
        }
      } else {
        setSelectedCountry(countries[0]);
      }

      if (savedCount) {
        const parsedCount = parseInt(savedCount, 10);
        if (parsedCount > 0 && parsedCount <= 10000) {
          setCount(parsedCount);
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      setSelectedCountry(countries[0]);
    }
  }, []);

  const handleSelectCountry = useCallback((country: CountryData) => {
    setSelectedCountry(country);
    setGeneratedNumbers([]);
    setPage(0);
    try {
      localStorage.setItem(STORAGE_KEY_COUNTRY, country.id);
    } catch (error) {
      console.error('Failed to save country:', error);
    }
  }, []);

  const handleGenerate = useCallback(() => {
    if (!selectedCountry) return;
    haptic(50);
    setIsGenerating(true);
    setPage(0);

    setTimeout(() => {
      try {
        if (count <= 2000) {
          const numbers = generatePhoneNumber(selectedCountry, count);
          setGeneratedNumbers(numbers);
        } else {
          const batchSize = 1000;
          const batches = Math.ceil(count / batchSize);
          const allNumbers: string[] = [];

          for (let i = 0; i < batches; i++) {
            const currentBatchSize = Math.min(batchSize, count - i * batchSize);
            const batchNumbers = generatePhoneNumber(selectedCountry, currentBatchSize);
            allNumbers.push(...batchNumbers);
          }

          setGeneratedNumbers(allNumbers);
        }

        try {
          localStorage.setItem(STORAGE_KEY_COUNT, count.toString());
        } catch (error) {
          console.error('Failed to save count:', error);
        }
      } catch (error) {
        console.error('Generation failed:', error);
      } finally {
        setIsGenerating(false);
      }
    }, 150);
  }, [selectedCountry, count]);

  const handleCopy = useCallback(async (text: string, index: number) => {
    haptic(30);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch (error) {
      console.error('Copy failed:', error);
      haptic(50);
    }
  }, []);

  const handleCopyAll = useCallback(async () => {
    haptic(30);
    try {
      const text = generatedNumbers.join('\n');
      await navigator.clipboard.writeText(text);
      setIsCopiedAll(true);
      setTimeout(() => setIsCopiedAll(false), 2000);
    } catch (error) {
      console.error('Copy all failed:', error);
      haptic(50);
    }
  }, [generatedNumbers]);

  const handleDownload = useCallback(() => {
    haptic(30);
    if (generatedNumbers.length === 0) return;

    const text = generatedNumbers.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    a.download = `${selectedCountry?.name || 'phone'}_${timestamp}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [generatedNumbers, selectedCountry]);

  const paginatedNumbers = useMemo(() => {
    const start = page * ITEMS_PER_PAGE;
    return generatedNumbers.slice(start, start + ITEMS_PER_PAGE);
  }, [generatedNumbers, page]);

  const totalPages = Math.ceil(generatedNumbers.length / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="container flex h-14 items-center justify-between px-4 max-w-3xl mx-auto">
          <h1 className="text-lg font-semibold tracking-tight">手机号生成器</h1>
          <MenuButton onClick={() => { haptic(20); setShowMenu(true); }} />
        </div>
      </header>

      <main className="container max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">选择国家/地区</CardTitle>
            <CardDescription>选择要生成手机号的国家或地区</CardDescription>
          </CardHeader>
          <CardContent>
            <button
              onClick={() => { haptic(20); setShowCountrySelector(true); }}
              className="w-full p-4 flex items-center justify-between rounded-lg hover:bg-accent transition-colors border border-transparent hover:border-border"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {selectedCountry ? (
                  <>
                    <CountryFlag countryCode={selectedCountry.id} className="w-12 h-9 shrink-0" />
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-sm font-semibold truncate">
                        {selectedCountry.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {selectedCountry.code}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 w-12 h-9 bg-muted rounded flex items-center justify-center">
                      <Icon name="globe" className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-medium">选择国家</span>
                  </div>
                )}
              </div>
              <Icon name="chevronRight" className="w-5 h-5 text-muted-foreground shrink-0" />
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">生成设置</CardTitle>
            <CardDescription>设置要生成的手机号数量</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="count" className="text-sm font-medium">
                生成数量
              </label>
              <Input
                id="count"
                type="number"
                value={count}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (val > 0 && val <= 10000) setCount(val);
                }}
                min="1"
                max="10000"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                最多支持生成 10,000 个号码
              </p>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!selectedCountry || isGenerating}
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
                  生成号码
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {generatedNumbers.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">生成结果</CardTitle>
                  <CardDescription>
                    共生成 {generatedNumbers.length} 个号码
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyAll}
                    className={isCopiedAll ? 'bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800' : ''}
                  >
                    {isCopiedAll ? (
                      <Icon name="check" className="w-4 h-4" />
                    ) : (
                      <Icon name="copy" className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleDownload}
                  >
                    <Icon name="download" className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {paginatedNumbers.map((number, idx) => {
                  const actualIndex = page * ITEMS_PER_PAGE + idx;
                  const isCopied = copiedIndex === actualIndex;
                  return (
                    <button
                      key={actualIndex}
                      onClick={() => handleCopy(number, actualIndex)}
                      className={`w-full px-4 py-3 flex items-center justify-between hover:bg-accent transition-colors ${
                        isCopied ? 'bg-accent/70' : ''
                      }`}
                    >
                      <span className="text-sm font-mono text-foreground">
                        {number}
                      </span>
                      {isCopied ? (
                        <Icon name="check" className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <Icon name="copy" className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <>
                  <Separator />
                  <div className="flex items-center justify-center gap-3 p-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { haptic(20); setPage(p => Math.max(0, p - 1)); }}
                      disabled={page === 0}
                    >
                      上一页
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {page + 1} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { haptic(20); setPage(p => Math.min(totalPages - 1, p + 1)); }}
                      disabled={page >= totalPages - 1}
                    >
                      下一页
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <footer className="pt-4 text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            支持 {countries.length} 个国家/地区
          </p>
          <p className="text-xs text-muted-foreground">
            生成的号码仅供测试使用
          </p>
        </footer>
      </main>

      <CountrySelector
        isOpen={showCountrySelector}
        onClose={() => setShowCountrySelector(false)}
        onSelect={handleSelectCountry}
        currentCountry={selectedCountry}
      />

      <NavigationMenu isOpen={showMenu} onClose={() => setShowMenu(false)} />
    </div>
  );
}
