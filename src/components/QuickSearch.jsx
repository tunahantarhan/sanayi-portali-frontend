import { forwardRef, useId, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Search } from 'lucide-react';
import { tenantConfig } from '../config';

// Üst bardaki arama: menüdeki sayfaları ve config'teki anahtar kelimeleri arar.
// Veri araması (fatura no, evrak no...) backend/servis desteği gelince eklenebilir.

// Türkçe karakter ve büyük/küçük harf farkını yok sayar: "Doğalgaz" ~ "dogalgaz".
const normalize = (text) =>
  (text || '')
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');

const ENTRIES = tenantConfig.menu.map((item) => ({
  ...item,
  tokens: normalize([item.label, ...(item.keywords || [])].join(' '))
    .split(/[^a-z0-9]+/)
    .filter(Boolean),
}));

const MAX_RESULTS = 6;
const STEM_LENGTH = 5;

const commonPrefix = (a, b) => {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
};

// Kelime puanı: yazılan kelime bir kelimenin başıysa ("tem" ~ "teminat") veya kelimeyi ekiyle
// içeriyorsa ("teminatımız" ~ "teminat") 2; yalnızca ilk 5 harf ortaksa ("faturası" ~ "faturalar") 1.
// Kısa kelimelerde ("su", "iş") yalnızca baştan eşleşme geçerlidir; "işgaliye" "iş"e uymaz.
const wordScore = (word, token) => {
  if (token.startsWith(word) || (token.length >= STEM_LENGTH && word.startsWith(token))) return 2;
  return commonPrefix(word, token) >= STEM_LENGTH ? 1 : 0;
};

// Kelimelerden en az biri eşleşen sayfalar, en yüksek puanlı önce gelir.
const search = (query) => {
  const words = normalize(query)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  if (!words.length) return [];
  return ENTRIES.map((entry) => ({
    entry,
    score: words.reduce((sum, w) => sum + Math.max(...entry.tokens.map((t) => wordScore(w, t))), 0),
  }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS)
    .map((r) => r.entry);
};

const QuickSearch = forwardRef(function QuickSearch(
  { placeholder = 'Sayfa veya işlem arayın...', onNavigate, inputClassName = '', className = '' },
  ref
) {
  const navigate = useNavigate();
  const listId = useId();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const results = useMemo(() => search(query), [query]);

  const go = (item) => {
    if (item.href) window.open(item.href, '_blank', 'noopener');
    else navigate(item.to);
    setQuery('');
    setOpen(false);
    onNavigate?.();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown' && results.length) {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp' && results.length) {
      e.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault();
      go(results[active]);
    } else if (e.key === 'Escape') {
      setQuery('');
      setOpen(false);
    }
  };

  const showList = open && query.trim() !== '';

  return (
    <div className={`relative ${className}`}>
      <div className='flex items-center'>
        <Search className='h-4 w-4 shrink-0 text-gray-500' />
        <input
          ref={ref}
          type='search'
          role='combobox'
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete='list'
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          // Sonuca tıklama, blur'dan önce işlensin diye listede onMouseDown kullanılır.
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={`ml-2 w-full bg-transparent text-sm font-medium text-gray-800 placeholder-gray-500 outline-none ${inputClassName}`}
        />
      </div>

      {showList && (
        <ul
          id={listId}
          role='listbox'
          className='absolute left-0 right-0 top-full z-50 mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg'
        >
          {results.length === 0 ? (
            <li className='px-4 py-3 text-sm text-gray-500'>Sonuç bulunamadı.</li>
          ) : (
            results.map((item, i) => (
              <li
                key={item.to || item.href}
                role='option'
                aria-selected={i === active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  go(item);
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex cursor-pointer items-center justify-between px-4 py-2.5 text-sm ${
                  i === active ? 'bg-brand/5 text-brand' : 'text-gray-700'
                }`}
              >
                <span className='font-medium'>{item.label}</span>
                {item.href && <ExternalLink className='h-3.5 w-3.5 text-gray-400' />}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
});

export default QuickSearch;
