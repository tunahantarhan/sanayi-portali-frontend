import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';
import { tenantConfig } from '../config';
import { getAlerts, getIsgaliye, fileUrls } from '../services/api';
import useApi from '../hooks/useApi';
import FileLink from '../components/ui/FileLink';
import SortableTh from '../components/ui/SortableTh';
import { LoadingState, ErrorState, EmptyState } from '../components/ui/PageState';
import {
  formatCurrency,
  formatDate,
  formatFileSize,
  formatNumber,
  toTimestamp,
} from '../utils/format';

// Hesap Durumu: işgaliye kayıtları ile vadesi geçmiş borç, eksik teminat ve eksik DBS kayıtları,
// her biri ayrı sekmede tablo olarak. Sekmeler ve sırası config'tedir (accountTabs);
// kaydı olmayan sekme gösterilmez. Sekme adreste tutulur (?sekme=eksik_teminat), ana sayfadaki
// uyarı kartı doğrudan ilgili sekmeye bağlanır.

const ISGALIYE = 'isgaliye';

// İşgaliye durum rozetleri; bilinmeyen durum gri gösterilir.
const STATUS_STYLES = {
  faturalandi: 'bg-gray-100 text-gray-700 ring-gray-500/20',
  onaylandi: 'bg-amber-50 text-amber-700 ring-amber-600/20',
};

const period = (k) => {
  if (!k.baslangic) return '—';
  const range =
    k.bitis && k.bitis !== k.baslangic
      ? `${formatDate(k.baslangic)} – ${formatDate(k.bitis)}`
      : formatDate(k.baslangic);
  return k.gun ? `${range} (${k.gun} gün)` : range;
};

const money = (v) => (v == null ? '—' : formatCurrency(v));

const muted = (text) => <span className='mt-0.5 block text-xs text-gray-500'>{text}</span>;

// ---- Sütunlar ----
// sort: sıralama değeri, render: hücre, optional: hiçbir kayıtta değer yoksa sütun gizlenir.

const isgaliyeColumns = [
  {
    key: 'tur',
    label: 'Tür / Parsel',
    sort: (k) => k.tur || '',
    render: (k) => (
      <>
        <span className='font-medium text-gray-900'>{k.tur || 'İşgaliye'}</span>
        {k.parsel && muted(`Parsel ${k.parsel}`)}
        {k.aciklama && (
          <span className='mt-1 block max-w-xs whitespace-normal text-xs text-gray-500'>
            {k.aciklama}
          </span>
        )}
      </>
    ),
  },
  { key: 'baslangic', label: 'Dönem', sort: (k) => toTimestamp(k.baslangic), render: period },
  {
    key: 'miktar',
    label: 'Miktar',
    optional: true,
    sort: (k) => k.miktar ?? 0,
    render: (k) =>
      k.miktar == null ? '—' : `${formatNumber(k.miktar, k.miktar % 1 ? 1 : 0)} ${k.birim || ''}`,
  },
  {
    key: 'durum',
    label: 'Durum',
    sort: (k) => k.durumText || k.durum || '',
    render: (k) => (
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
          STATUS_STYLES[k.durum] || STATUS_STYLES.faturalandi
        }`}
      >
        {k.durumText || k.durum}
      </span>
    ),
  },
  {
    key: 'faturaNo',
    label: 'Fatura',
    optional: true,
    sort: (k) => toTimestamp(k.faturaTarihi),
    render: (k) =>
      k.faturaNo ? (
        <>
          {k.faturaNo}
          {k.faturaTarihi && muted(formatDate(k.faturaTarihi))}
        </>
      ) : (
        '—'
      ),
  },
  {
    key: 'tutar',
    label: 'Tutar',
    align: 'right',
    sort: (k) => k.tutar ?? 0,
    render: (k) => <span className='font-semibold text-gray-900'>{money(k.tutar)}</span>,
  },
  {
    key: 'dosyalar',
    label: 'Tutanak / Fotoğraf',
    render: (k) => (
      <FileList
        files={k.dosyalar}
        urlOf={(f) => fileUrls.isgaliyeFile(k.id, f.id)}
        labelOf={(f) => (f.boyut ? `${f.ad} (${formatFileSize(f.boyut)})` : f.ad)}
      />
    ),
  },
];

// Uyarı kayıtlarında ortak sütunlar; `extra` türe özel tutar sütunlarıdır.
const alertColumns = (extra, amountLabel) => [
  {
    key: 'tarih',
    label: 'Yazı Tarihi',
    optional: true,
    sort: (a) => toTimestamp(a.tarih),
    render: (a) => (
      <>
        {a.tarih ? formatDate(a.tarih) : '—'}
        {a.yaziSayisi && muted(`Sayı: ${a.yaziSayisi}`)}
      </>
    ),
  },
  {
    key: 'cariKod',
    label: 'Parsel / Cari Hesap',
    optional: true,
    sort: (a) => a.parsel || a.cariKod || '',
    render: (a) => (
      <>
        {a.parsel ? `Parsel ${a.parsel}` : '—'}
        {a.cariKod && muted(a.cariKod)}
      </>
    ),
  },
  ...extra,
  {
    key: 'tutar',
    label: amountLabel,
    align: 'right',
    sort: (a) => a.tutar ?? 0,
    render: (a) => <span className='font-semibold text-red-700'>{money(a.tutar)}</span>,
  },
  {
    key: 'sonTarih',
    label: 'Son Tarih',
    optional: true,
    sort: (a) => toTimestamp(a.sonTarih),
    render: (a) => formatDate(a.sonTarih),
  },
  {
    key: 'dosyalar',
    label: 'Yazı',
    render: (a) => (
      <FileList files={a.dosyalar} urlOf={(f) => fileUrls.alertFile(f.id)} labelOf={(f) => f.ad} />
    ),
  },
];

const amountColumn = (key, label) => ({
  key,
  label,
  align: 'right',
  optional: true,
  sort: (a) => a[key] ?? 0,
  render: (a) => money(a[key]),
});

const COLUMNS = {
  [ISGALIYE]: isgaliyeColumns,
  vadesi_gecmis_borc: alertColumns(
    [amountColumn('bakiye', 'Toplam Bakiye'), amountColumn('vadesiGelmemis', 'Vadesi Gelmemiş')],
    'Vadesi Geçmiş'
  ),
  eksik_teminat: alertColumns(
    [amountColumn('istenen', 'İstenen Teminat'), amountColumn('mevcut', 'Mevcut Teminat')],
    'Eksik Tutar'
  ),
  eksik_dbs: alertColumns([amountColumn('dbsLimiti', 'DBS Limiti')], 'Eksik Tutar'),
};

const DEFAULT_SORT = {
  [ISGALIYE]: { key: 'baslangic', direction: 'desc' },
  default: { key: 'tarih', direction: 'desc' },
};

const TAB_INFO = {
  [ISGALIYE]: 'OSB ortak alanlarının kullanımı için düzenlenen işgaliye kayıtları ve tutanakları.',
  vadesi_gecmis_borc: 'Vadesi geçmiş ve ödenmemiş borçlarınız ile ilgili bildirim yazıları.',
  eksik_teminat: 'Tamamlanması gereken teminat tutarları ve ilgili yazılar.',
  eksik_dbs: 'Tamamlanması gereken DBS teminatı ve ilgili yazılar.',
};

function FileList({ files, urlOf, labelOf }) {
  if (!files?.length) return <span className='text-sm text-gray-400'>—</span>;
  return (
    <div className='flex flex-col gap-1'>
      {files.map((f) => (
        <FileLink
          key={f.id}
          url={urlOf(f)}
          label={labelOf(f)}
          fileName={f.ad}
          className='max-w-[220px] text-xs'
        />
      ))}
    </div>
  );
}

function RecordTable({ tabKey, rows }) {
  const [sortConfig, setSortConfig] = useState(DEFAULT_SORT[tabKey] || DEFAULT_SORT.default);

  const columns = COLUMNS[tabKey].filter(
    (c) => !c.optional || rows.some((r) => r[c.key] != null && r[c.key] !== '')
  );

  // Listeler kısa olduğu için her çizimde sıralanır (React Compiler gerekirse önbellekler).
  const getValue = COLUMNS[tabKey].find((c) => c.key === sortConfig.key)?.sort;
  const dir = sortConfig.direction === 'asc' ? 1 : -1;
  const sorted = getValue
    ? [...rows].sort((a, b) => {
        const av = getValue(a);
        const bv = getValue(b);
        if (typeof av === 'string') return av.localeCompare(bv, 'tr') * dir;
        return (av - bv) * dir;
      })
    : rows;

  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  return (
    <div className='overflow-x-auto'>
      <table className='min-w-full divide-y divide-gray-200'>
        <thead className='select-none bg-gray-50/50'>
          <tr>
            {columns.map((c) =>
              c.sort ? (
                <SortableTh
                  key={c.key}
                  k={c.key}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  align={c.align}
                >
                  {c.label}
                </SortableTh>
              ) : (
                <th
                  key={c.key}
                  scope='col'
                  className='whitespace-nowrap px-6 py-4 text-left text-sm font-semibold text-gray-900'
                >
                  {c.label}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className='divide-y divide-gray-100 bg-white'>
          {sorted.map((row) => (
            <tr key={row.id} className='align-top transition-colors hover:bg-gray-50/70'>
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`whitespace-nowrap px-6 py-4 text-sm text-gray-600 ${
                    c.align === 'right' ? 'text-right' : ''
                  }`}
                >
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function HesapDurumu() {
  const alerts = useApi(getAlerts);
  const isgaliye = useApi(getIsgaliye);
  const [searchParams, setSearchParams] = useSearchParams();

  const rowsOf = (key) =>
    key === ISGALIYE ? isgaliye.data || [] : (alerts.data || []).filter((a) => a.tur === key);

  // Yalnızca kaydı olan (ve bu sayfanın tanıdığı) sekmeler gösterilir.
  const tabs = tenantConfig.accountTabs
    .filter((tab) => COLUMNS[tab.key])
    .map((tab) => ({ ...tab, rows: rowsOf(tab.key) }))
    .filter((tab) => tab.rows.length > 0);

  if (alerts.loading || isgaliye.loading) return <LoadingState text='Kayıtlar yükleniyor...' />;

  // Bir kaynak hata verirse diğerinin sekmeleri yine gösterilir.
  const failed = [alerts, isgaliye].filter((s) => s.error);
  const retryFailed = () => failed.forEach((s) => s.reload());

  if (failed.length === 2) return <ErrorState error={alerts.error} onRetry={retryFailed} />;

  const requested = searchParams.get('sekme');
  const active = tabs.find((t) => t.key === requested) || tabs[0];
  const total = active?.rows.reduce((sum, r) => sum + (r.tutar || 0), 0) ?? 0;

  return (
    <div className='mx-auto max-w-7xl'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-800'>Hesap Durumu</h1>
        <p className='mt-1 text-sm text-gray-500'>
          İşgaliye kayıtlarınız ile borç, teminat ve DBS durumunuz. Başlığa tıklayarak
          sıralayabilir, yazıları PDF olarak açabilirsiniz.
        </p>
      </div>

      {failed.length > 0 && (
        <div className='mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-800'>
          <span className='flex items-center gap-2'>
            <AlertTriangle className='h-4 w-4 shrink-0' />
            Bazı kayıtlar şu an alınamadı, gösterilen liste eksik olabilir.
          </span>
          <button
            onClick={retryFailed}
            className='inline-flex items-center gap-1.5 font-semibold hover:underline'
          >
            <RefreshCw className='h-3.5 w-3.5' /> Tekrar Dene
          </button>
        </div>
      )}

      {!active ? (
        <div className='rounded-2xl border border-gray-200 bg-white shadow-sm'>
          <EmptyState
            icon={Inbox}
            text='Hesabınızda görüntülenecek işgaliye, borç veya teminat kaydı bulunmuyor.'
          />
        </div>
      ) : (
        <>
          <div className='mb-4 flex w-full max-w-3xl flex-wrap gap-1 rounded-xl bg-gray-100/80 p-1'>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSearchParams({ sekme: tab.key }, { replace: true })}
                className={`flex min-w-[130px] flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 active:scale-95 sm:text-sm ${
                  active.key === tab.key
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:bg-gray-200/50 hover:text-gray-700'
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-1.5 text-xs ${
                    tab.key === ISGALIYE ? 'bg-gray-200 text-gray-600' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {tab.rows.length}
                </span>
              </button>
            ))}
          </div>

          <div className='mb-4 flex flex-wrap items-end justify-between gap-2'>
            <p className='text-sm text-gray-500'>{TAB_INFO[active.key]}</p>
            {total > 0 && (
              <p className='text-sm text-gray-500'>
                Toplam: <strong className='text-base text-gray-900'>{formatCurrency(total)}</strong>
              </p>
            )}
          </div>

          <div className='overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm'>
            <RecordTable key={active.key} tabKey={active.key} rows={active.rows} />
          </div>
        </>
      )}
    </div>
  );
}
