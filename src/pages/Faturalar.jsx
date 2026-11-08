import { useState, useMemo } from 'react';
import {
  Filter,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  X,
  Info,
} from 'lucide-react';
import { getInvoices, fileUrls } from '../services/api';
import { tenantConfig } from '../config';
import useApi from '../hooks/useApi';
import FileLink from '../components/ui/FileLink';
import SortableTh from '../components/ui/SortableTh';
import { ErrorState } from '../components/ui/PageState';
import { formatCurrency, formatDate, formatPeriod, toTimestamp } from '../utils/format';

const ALL = 'tumu';

const STATUS = {
  odendi: {
    label: 'Ödendi',
    icon: CheckCircle2,
    className: 'bg-green-50 text-green-700 ring-green-600/20',
  },
  bekliyor: {
    label: 'Ödeme Bekliyor',
    icon: Clock,
    className: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  },
  gecikmis: {
    label: 'Gecikmiş',
    icon: AlertCircle,
    className: 'bg-red-50 text-red-700 ring-red-600/10',
  },
};

// Fatura tipinden (ELK, GAZ...) config'teki grubu bulur
const groupOfType = (tip) => tenantConfig.invoiceGroups.find((g) => g.tipler.includes(tip))?.key;

const SORTERS = {
  tip: (inv) => tenantConfig.invoiceTypeLabels[inv.tip] || inv.tip,
  donem: (inv) => inv.donem || '',
  tesisatNo: (inv) => inv.tesisatNo || '',
  sonOdeme: (inv) => toTimestamp(inv.sonOdeme),
  durum: (inv) => inv.durum || '',
  tutar: (inv) => inv.tutar ?? 0,
};

function StatusBadge({ status }) {
  const s = STATUS[status];
  if (!s) return <span className='text-sm text-gray-400'>—</span>;
  const Icon = s.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${s.className}`}
    >
      <Icon className='h-3 w-3' /> {s.label}
    </span>
  );
}

export default function Faturalar() {
  const { data, loading, error, reload } = useApi(getInvoices);
  const invoices = useMemo(
    () => (data?.data || []).filter((inv) => groupOfType(inv.tip)), // KAV gibi grupsuz tipler bu sayfada değil
    [data]
  );
  const paymentEnabled = data?.odemeAktif ?? tenantConfig.features.payment;

  const [activeTab, setActiveTab] = useState(ALL);
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'sonOdeme', direction: 'desc' });

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  const hasStatus = invoices.some((inv) => inv.durum);
  const hasTesisat = invoices.some((inv) => inv.tesisatNo);

  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  const clearFilters = () => {
    setStatusFilter(ALL);
    setMinAmount('');
    setMaxAmount('');
  };

  const hasActiveFilters = statusFilter !== ALL || minAmount !== '' || maxAmount !== '';

  const processedInvoices = useMemo(() => {
    let list = activeTab === ALL ? [...invoices] : invoices.filter((inv) => groupOfType(inv.tip) === activeTab);

    if (statusFilter !== ALL) list = list.filter((inv) => inv.durum === statusFilter);
    if (minAmount !== '') list = list.filter((inv) => inv.tutar >= parseFloat(minAmount));
    if (maxAmount !== '') list = list.filter((inv) => inv.tutar <= parseFloat(maxAmount));

    const getValue = SORTERS[sortConfig.key];
    if (getValue) {
      const dir = sortConfig.direction === 'asc' ? 1 : -1;
      list.sort((a, b) => {
        const av = getValue(a);
        const bv = getValue(b);
        if (typeof av === 'string') return av.localeCompare(bv, 'tr') * dir;
        return (av - bv) * dir;
      });
    }
    return list;
  }, [invoices, activeTab, statusFilter, minAmount, maxAmount, sortConfig]);

  const payable = processedInvoices.filter((inv) => inv.durum !== 'odendi');

  const handleSelectAll = (e) => {
    setSelectedInvoices(e.target.checked ? payable.map((inv) => inv.id) : []);
  };

  const handleSelectOne = (id) => {
    setSelectedInvoices((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedTotal = invoices
    .filter((inv) => selectedInvoices.includes(inv.id))
    .reduce((sum, inv) => sum + (inv.tutar || 0), 0);

  const columnCount = 5 + (paymentEnabled ? 1 : 0) + (hasStatus ? 1 : 0) + (hasTesisat ? 1 : 0);

  return (
    <div className='relative mx-auto max-w-7xl pb-24'>
      <style>{`
        @keyframes rowFadeIn {
          0% { opacity: 0; transform: translateY(6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-cascade-row {
          animation: rowFadeIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      <div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-800'>Faturalar</h1>
          <p className='mt-1 text-sm text-gray-500'>
            Faturalarınızı inceleyin, başlığa tıklayarak sıralayın ve PDF olarak indirin.
          </p>
        </div>

        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`flex items-center gap-2 self-start rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-95 sm:self-auto ${
            isFilterOpen || hasActiveFilters
              ? 'border-brand bg-brand/10 text-brand shadow-sm'
              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Filter
            className={`h-4 w-4 transition-transform duration-300 ${isFilterOpen ? 'rotate-180 text-brand' : ''}`}
          />
          Filtrele
          {hasActiveFilters && <span className='flex h-2 w-2 animate-pulse rounded-full bg-brand' />}
        </button>
      </div>

      {!paymentEnabled && (
        <div className='mb-6 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-800'>
          <Info className='mt-0.5 h-4 w-4 shrink-0' />
          <p>
            Portal üzerinden online ödeme henüz aktif değildir. Faturalarınızı banka kanalları
            üzerinden ödeyebilirsiniz.
          </p>
        </div>
      )}

      {/* Filtre paneli */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isFilterOpen ? 'mb-6 max-h-96 opacity-100' : 'pointer-events-none mb-0 max-h-0 opacity-0'
        }`}
      >
        <div className='rounded-2xl border border-gray-200 bg-white p-5 shadow-sm'>
          <div className='mb-4 flex items-center justify-between border-b border-gray-100 pb-3'>
            <span className='text-sm font-bold text-gray-800'>Gelişmiş Filtreler</span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className='flex items-center gap-1 text-xs text-red-500 transition-transform hover:underline active:scale-95'
              >
                <X className='h-3.5 w-3.5' /> Filtreleri Temizle
              </button>
            )}
          </div>

          <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
            {hasStatus && (
              <div>
                <label className='mb-1.5 block text-xs font-semibold text-gray-600'>Ödeme Durumu</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className='w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs text-gray-700 outline-none transition-all focus:border-brand focus:bg-white'
                >
                  <option value={ALL}>Tüm Durumlar</option>
                  {Object.entries(STATUS).map(([key, s]) => (
                    <option key={key} value={key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className='mb-1.5 block text-xs font-semibold text-gray-600'>Min Tutar (₺)</label>
              <input
                type='number'
                placeholder='Örn: 500'
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className='w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs text-gray-700 outline-none transition-all focus:border-brand focus:bg-white'
              />
            </div>

            <div>
              <label className='mb-1.5 block text-xs font-semibold text-gray-600'>Max Tutar (₺)</label>
              <input
                type='number'
                placeholder='Örn: 15000'
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className='w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs text-gray-700 outline-none transition-all focus:border-brand focus:bg-white'
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fatura grupları */}
      <div className='mb-6 flex w-full max-w-2xl flex-wrap gap-1 rounded-xl bg-gray-100/80 p-1'>
        {[{ key: ALL, label: 'Tümü' }, ...tenantConfig.invoiceGroups].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setSelectedInvoices([]);
            }}
            className={`min-w-[130px] flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 active:scale-95 sm:text-sm ${
              activeTab === tab.key
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:bg-gray-200/50 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className='overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm'>
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : (
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='select-none bg-gray-50/50'>
                <tr>
                  {paymentEnabled && (
                    <th scope='col' className='w-12 px-6 py-4 text-left'>
                      <input
                        type='checkbox'
                        aria-label='Tümünü seç'
                        className='h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand'
                        onChange={handleSelectAll}
                        checked={payable.length > 0 && selectedInvoices.length === payable.length}
                      />
                    </th>
                  )}
                  <SortableTh sortConfig={sortConfig} onSort={handleSort} k='tip'>Fatura Türü</SortableTh>
                  <SortableTh sortConfig={sortConfig} onSort={handleSort} k='donem'>Dönem</SortableTh>
                  {hasTesisat && <SortableTh sortConfig={sortConfig} onSort={handleSort} k='tesisatNo'>Tesisat No</SortableTh>}
                  <SortableTh sortConfig={sortConfig} onSort={handleSort} k='sonOdeme'>Son Ödeme</SortableTh>
                  {hasStatus && <SortableTh sortConfig={sortConfig} onSort={handleSort} k='durum'>Durum</SortableTh>}
                  <SortableTh sortConfig={sortConfig} onSort={handleSort} k='tutar' align='right'>
                    Tutar
                  </SortableTh>
                  <th scope='col' className='px-6 py-4 text-right text-sm font-semibold text-gray-900'>
                    PDF
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100 bg-white'>
                {loading ? (
                  <tr>
                    <td colSpan={columnCount} className='py-12 text-center text-sm text-gray-500'>
                      <div className='flex items-center justify-center gap-2'>
                        <Loader2 className='h-5 w-5 animate-spin text-brand' />
                        <span>Faturalar yükleniyor...</span>
                      </div>
                    </td>
                  </tr>
                ) : processedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={columnCount} className='py-12 text-center text-sm text-gray-500'>
                      Kriterlerinize uygun fatura kaydı bulunmamaktadır.
                    </td>
                  </tr>
                ) : (
                  processedInvoices.map((invoice, index) => {
                    const isPayable = invoice.durum !== 'odendi';
                    const isSelected = selectedInvoices.includes(invoice.id);
                    return (
                      <tr
                        key={`${invoice.id}-${sortConfig.key}-${sortConfig.direction}-${activeTab}`}
                        style={{ animationDelay: `${Math.min(index * 30, 240)}ms` }}
                        className={`animate-cascade-row transition-all duration-200 hover:bg-gray-50/70 ${
                          isSelected ? 'bg-brand/5 hover:bg-brand/10' : ''
                        }`}
                      >
                        {paymentEnabled && (
                          <td className='whitespace-nowrap px-6 py-4'>
                            <input
                              type='checkbox'
                              aria-label='Faturayı seç'
                              disabled={!isPayable}
                              checked={isSelected}
                              onChange={() => handleSelectOne(invoice.id)}
                              className='h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand disabled:cursor-not-allowed disabled:opacity-30'
                            />
                          </td>
                        )}
                        <td className='whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900'>
                          {tenantConfig.invoiceTypeLabels[invoice.tip] || invoice.tip}
                        </td>
                        <td className='whitespace-nowrap px-6 py-4 text-sm text-gray-500'>
                          {formatPeriod(invoice.donem)}
                        </td>
                        {hasTesisat && (
                          <td className='whitespace-nowrap px-6 py-4 text-sm text-gray-500'>
                            {invoice.tesisatNo || '—'}
                          </td>
                        )}
                        <td className='whitespace-nowrap px-6 py-4 text-sm text-gray-500'>
                          {formatDate(invoice.sonOdeme)}
                        </td>
                        {hasStatus && (
                          <td className='whitespace-nowrap px-6 py-4'>
                            <StatusBadge status={invoice.durum} />
                          </td>
                        )}
                        <td className='whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-gray-900'>
                          {formatCurrency(invoice.tutar)}
                        </td>
                        <td className='whitespace-nowrap px-6 py-4 text-right text-sm'>
                          <FileLink
                            url={fileUrls.invoicePdf(invoice.id)}
                            label='PDF'
                            fileName={`${invoice.tip}_${invoice.donem}.pdf`}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Toplu ödeme çubuğu (yalnızca ödeme açıkken) */}
      {paymentEnabled && (
        <div
          className={`fixed bottom-0 left-0 right-0 z-30 transform transition-all duration-300 ease-out lg:left-64 ${
            selectedInvoices.length > 0
              ? 'translate-y-0 opacity-100'
              : 'pointer-events-none translate-y-full opacity-0'
          }`}
        >
          <div className='mx-auto max-w-7xl px-4 pb-6 md:px-8'>
            <div className='flex flex-col items-center justify-between gap-4 rounded-2xl bg-gray-900 px-6 py-4 shadow-2xl ring-1 ring-white/10 sm:flex-row'>
              <div className='flex items-center gap-4'>
                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-white/10 font-semibold text-white'>
                  {selectedInvoices.length}
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-400'>Seçili Fatura Toplamı</p>
                  <p className='text-xl font-bold text-white'>{formatCurrency(selectedTotal)}</p>
                </div>
              </div>

              {/* TODO: Sanal POS anlaşması sonrası ödeme akışı (POST /api/payments) bağlanacak */}
              <button className='flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 font-medium text-white shadow-lg shadow-brand/20 transition-all hover:bg-brand/90 active:scale-95 sm:w-auto'>
                <CreditCard className='h-5 w-5' />
                Seçilenleri Öde
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
