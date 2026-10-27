import { useState, useMemo, useEffect } from 'react';
import { 
  Download, 
  Filter, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  X
} from 'lucide-react';
import { getInvoices } from '../services/api';

export default function Faturalar() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Tümü');
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'sonOdeme', direction: 'desc' });

  // Filtre Paneli State'leri
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('Tümü');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  useEffect(() => {
    getInvoices()
      .then((data) => {
        setInvoices(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Faturalar yüklenemedi:', err);
        setLoading(false);
      });
  }, []);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return 0;
    const [day, month, year] = dateStr.split('.');
    return new Date(`${year}-${month}-${day}`).getTime();
  };

  const clearFilters = () => {
    setStatusFilter('Tümü');
    setMinAmount('');
    setMaxAmount('');
  };

  const hasActiveFilters = statusFilter !== 'Tümü' || minAmount !== '' || maxAmount !== '';

  const processedInvoices = useMemo(() => {
    let list = activeTab === 'Tümü' 
      ? [...invoices] 
      : invoices.filter((inv) => inv.tur === activeTab);

    if (statusFilter !== 'Tümü') {
      list = list.filter((inv) => inv.durum === statusFilter);
    }

    if (minAmount !== '') {
      list = list.filter((inv) => inv.tutar >= parseFloat(minAmount));
    }
    if (maxAmount !== '') {
      list = list.filter((inv) => inv.tutar <= parseFloat(maxAmount));
    }

    if (sortConfig.key) {
      list.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === 'sonOdeme') {
          aVal = parseDate(aVal);
          bVal = parseDate(bVal);
        }

        if (sortConfig.key === 'tutar') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }

        if (typeof aVal === 'string') {
          return sortConfig.direction === 'asc' 
            ? aVal.localeCompare(bVal, 'tr') 
            : bVal.localeCompare(aVal, 'tr');
        }

        return sortConfig.direction === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
      });
    }

    return list;
  }, [invoices, activeTab, statusFilter, minAmount, maxAmount, sortConfig]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const payableIds = processedInvoices
        .filter((inv) => inv.durum !== 'Ödendi')
        .map((inv) => inv.id);
      setSelectedInvoices(payableIds);
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedInvoices.includes(id)) {
      setSelectedInvoices(selectedInvoices.filter((item) => item !== id));
    } else {
      setSelectedInvoices([...selectedInvoices, id]);
    }
  };

  const selectedTotal = useMemo(() => {
    return invoices
      .filter((inv) => selectedInvoices.includes(inv.id))
      .reduce((sum, inv) => sum + (inv.tutar || 0), 0);
  }, [invoices, selectedInvoices]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Ödendi':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
            <CheckCircle2 className="h-3 w-3" /> Ödendi
          </span>
        );
      case 'Bekliyor':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
            <Clock className="h-3 w-3" /> Ödeme Bekliyor
          </span>
        );
      case 'Gecikmiş':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
            <AlertCircle className="h-3 w-3" /> Gecikmiş
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const renderSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return (
      <span className="transition-transform duration-200 transform scale-110">
        {sortConfig.direction === 'asc' 
          ? <ArrowUp className="h-3.5 w-3.5 text-brand" /> 
          : <ArrowDown className="h-3.5 w-3.5 text-brand" />}
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-7xl relative pb-24">
      <style>{`
        @keyframes rowFadeIn {
          0% {
            opacity: 0;
            transform: translateY(6px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-cascade-row {
          animation: rowFadeIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Faturalar</h1>
          <p className="text-sm text-gray-500 mt-1">Fatura detaylarınızı inceleyin, başlığa tıklayarak sıralayın ve seçerek ödeyin.</p>
        </div>
        
        {/* Filtreleme Butonu */}
        <div className="flex items-center gap-2">
           <button 
             onClick={() => setIsFilterOpen(!isFilterOpen)}
             className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-95 ${
               isFilterOpen || hasActiveFilters
                 ? 'border-brand bg-brand/10 text-brand shadow-sm'
                 : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
             }`}
           >
              <Filter className={`h-4 w-4 transition-transform duration-300 ${isFilterOpen ? 'rotate-180 text-brand' : ''}`} />
              Filtrele
              {hasActiveFilters && (
                <span className="flex h-2 w-2 rounded-full bg-brand animate-pulse"></span>
              )}
           </button>
        </div>
      </div>

      {/* AÇILIR FİLTRE PANELİ */}
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isFilterOpen ? 'max-h-96 opacity-100 mb-6' : 'max-h-0 opacity-0 mb-0 pointer-events-none'
        }`}
      >
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <span className="text-sm font-bold text-gray-800">Gelişmiş Filtreler</span>
            {hasActiveFilters && (
              <button 
                onClick={clearFilters}
                className="text-xs text-red-500 hover:underline flex items-center gap-1 active:scale-95 transition-transform"
              >
                <X className="h-3.5 w-3.5" /> Filtreleri Temizle
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ödeme Durumu</label>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs text-gray-700 outline-none focus:border-brand focus:bg-white transition-all"
              >
                <option value="Tümü">Tüm Durumlar</option>
                <option value="Bekliyor">Ödeme Bekliyor</option>
                <option value="Gecikmiş">Gecikmiş</option>
                <option value="Ödendi">Ödendi</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Min Tutar (₺)</label>
              <input 
                type="number"
                placeholder="Örn: 500"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs text-gray-700 outline-none focus:border-brand focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Max Tutar (₺)</label>
              <input 
                type="number"
                placeholder="Örn: 15000"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs text-gray-700 outline-none focus:border-brand focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3 Ana Fatura Grubu Sekmeleri */}
      <div className="mb-6 flex flex-wrap gap-1 rounded-xl bg-gray-100/80 p-1 w-full max-w-2xl">
        {['Tümü', 'Elektrik & Doğalgaz', 'Su ve Diğer Giderler', 'İlave Faturalar'].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setSelectedInvoices([]);
            }}
            className={`flex-1 min-w-[130px] rounded-lg py-2 px-3 text-xs sm:text-sm font-medium transition-all duration-200 active:scale-95 ${
              activeTab === tab
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tablo Alanı */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50 select-none">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-900 w-12">
                  <input 
                    type="checkbox" 
                    className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand transition-all"
                    onChange={handleSelectAll}
                    checked={
                      processedInvoices.filter((i) => i.durum !== 'Ödendi').length > 0 &&
                      selectedInvoices.length === processedInvoices.filter((i) => i.durum !== 'Ödendi').length
                    }
                  />
                </th>

                <th 
                  scope="col" 
                  onClick={() => handleSort('no')} 
                  className="group px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100/60 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Fatura No
                    {renderSortIcon('no')}
                  </div>
                </th>

                <th 
                  scope="col" 
                  onClick={() => handleSort('donem')} 
                  className="group px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100/60 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Dönem
                    {renderSortIcon('donem')}
                  </div>
                </th>

                <th 
                  scope="col" 
                  onClick={() => handleSort('sonOdeme')} 
                  className="group px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100/60 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Son Ödeme
                    {renderSortIcon('sonOdeme')}
                  </div>
                </th>

                <th 
                  scope="col" 
                  onClick={() => handleSort('durum')} 
                  className="group px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100/60 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Durum
                    {renderSortIcon('durum')}
                  </div>
                </th>

                <th 
                  scope="col" 
                  onClick={() => handleSort('tutar')} 
                  className="group px-6 py-4 text-right text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100/60 transition-colors"
                >
                  <div className="flex items-center justify-end gap-2">
                    Tutar
                    {renderSortIcon('tutar')}
                  </div>
                </th>

                <th scope="col" className="px-6 py-4 text-right text-sm font-semibold text-gray-900">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-sm text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-brand" />
                      <span>Faturalar yükleniyor...</span>
                    </div>
                  </td>
                </tr>
              ) : processedInvoices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-sm text-gray-500">
                    Kriterlerinize uygun fatura kaydı bulunmamaktadır.
                  </td>
                </tr>
              ) : (
                processedInvoices.map((invoice, index) => {
                  const isPayable = invoice.durum !== 'Ödendi';
                  return (
                    <tr 
                      key={`${invoice.id}-${sortConfig.key}-${sortConfig.direction}-${activeTab}`} 
                      style={{ animationDelay: `${Math.min(index * 30, 240)}ms` }}
                      className={`animate-cascade-row transition-all duration-200 hover:bg-gray-50/70 ${
                        selectedInvoices.includes(invoice.id) ? 'bg-brand/5 hover:bg-brand/10' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input 
                          type="checkbox" 
                          disabled={!isPayable}
                          checked={selectedInvoices.includes(invoice.id)}
                          onChange={() => handleSelectOne(invoice.id)}
                          className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.no}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.donem}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.sonOdeme}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(invoice.durum)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                        {formatCurrency(invoice.tutar)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="inline-flex items-center gap-1 text-brand hover:text-brand-dark active:scale-95 transition-all">
                          <Download className="h-4 w-4" /> PDF
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sticky Footer (Toplu Ödeme Barı) */}
      <div 
        className={`fixed bottom-0 left-0 right-0 lg:left-64 z-30 transform transition-all duration-300 ease-out ${
          selectedInvoices.length > 0 ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 md:px-8 pb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-gray-900 px-6 py-4 shadow-2xl ring-1 ring-white/10">
             <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white font-semibold">
                  {selectedInvoices.length}
                </div>
                <div>
                   <p className="text-sm font-medium text-gray-400">Seçili Fatura Toplamı</p>
                   <p className="text-xl font-bold text-white">{formatCurrency(selectedTotal)}</p>
                </div>
             </div>
             
             <button className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 font-medium text-white hover:bg-brand/90 active:scale-95 transition-all shadow-lg shadow-brand/20">
                <CreditCard className="h-5 w-5" />
                Seçilenleri Öde
             </button>
          </div>
        </div>
      </div>

    </div>
  );
}