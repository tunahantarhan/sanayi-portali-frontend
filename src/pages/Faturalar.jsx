import { useState, useMemo } from 'react';
import { 
  Download, 
  Filter, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

// TODO: Bu mock veri ileride Backend'den "/api/invoices" üzerinden çekilecek.
const mockInvoices = [
  { id: 1, no: 'ELK-2024-0871', donem: 'Eylül 2024', tur: 'Elektrik', sonOdeme: '15.10.2024', tutar: 12450.00, durum: 'Bekliyor' },
  { id: 2, no: 'SU-2024-0872', donem: 'Eylül 2024', tur: 'Su', sonOdeme: '15.10.2024', tutar: 320.50, durum: 'Bekliyor' },
  { id: 3, no: 'DGL-2024-0873', donem: 'Eylül 2024', tur: 'Doğalgaz', sonOdeme: '15.10.2024', tutar: 980.00, durum: 'Bekliyor' },
  { id: 4, no: 'ELK-2024-0762', donem: 'Ağustos 2024', tur: 'Elektrik', sonOdeme: '15.09.2024', tutar: 11800.00, durum: 'Ödendi' },
  { id: 5, no: 'SU-2024-0763', donem: 'Ağustos 2024', tur: 'Su', sonOdeme: '15.09.2024', tutar: 300.00, durum: 'Ödendi' },
  { id: 6, no: 'ELK-2024-0649', donem: 'Temmuz 2024', tur: 'Elektrik', sonOdeme: '15.08.2024', tutar: 14200.00, durum: 'Gecikmiş' },
  { id: 7, no: 'ELK-2024-0534', donem: 'Haziran 2024', tur: 'Elektrik', sonOdeme: '15.07.2024', tutar: 13500.00, durum: 'Ödendi' },
];

export default function Faturalar() {
  const [activeTab, setActiveTab] = useState('Tümü');
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  
  // Sıralama durumu
  const [sortConfig, setSortConfig] = useState({ key: 'sonOdeme', direction: 'desc' });

  // Sıralama tetikleyici fonksiyon
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Tarih sıralaması için yardımcı parse fonksiyonu (GG.AA.YYYY)
  const parseDate = (dateStr) => {
    const [day, month, year] = dateStr.split('.');
    return new Date(`${year}-${month}-${day}`).getTime();
  };

  // Filtreleme ve Sıralama İşlemi
  const processedInvoices = useMemo(() => {
    // 1. Sekmeye göre filtrele
    let list = activeTab === 'Tümü' 
      ? [...mockInvoices] 
      : mockInvoices.filter(inv => inv.tur === activeTab);

    // 2. Belirlenen sütuna göre sırala
    if (sortConfig.key) {
      list.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        // Tarih formatı sıralaması
        if (sortConfig.key === 'sonOdeme') {
          aVal = parseDate(aVal);
          bVal = parseDate(bVal);
        }

        // Tutar sayısal sıralaması
        if (sortConfig.key === 'tutar') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }

        // Metinsel sıralama
        if (typeof aVal === 'string') {
          return sortConfig.direction === 'asc' 
            ? aVal.localeCompare(bVal, 'tr') 
            : bVal.localeCompare(aVal, 'tr');
        }

        return sortConfig.direction === 'asc' 
          ? (aVal > bVal ? 1 : -1) 
          : (aVal < bVal ? 1 : -1);
      });
    }

    return list;
  }, [activeTab, sortConfig]);

  // Çoklu seçim (Checkbox) işlemleri
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const payableIds = processedInvoices
        .filter(inv => inv.durum !== 'Ödendi')
        .map(inv => inv.id);
      setSelectedInvoices(payableIds);
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedInvoices.includes(id)) {
      setSelectedInvoices(selectedInvoices.filter(item => item !== id));
    } else {
      setSelectedInvoices([...selectedInvoices, id]);
    }
  };

  // Seçilen faturaların toplam tutarını hesapla
  const selectedTotal = useMemo(() => {
    return mockInvoices
      .filter(inv => selectedInvoices.includes(inv.id))
      .reduce((sum, inv) => sum + inv.tutar, 0);
  }, [selectedInvoices]);

  // Para birimi formatlayıcı
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
  };

  // Duruma göre etiket (Badge) tasarımı
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Ödendi':
        return <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20"><CheckCircle2 className="h-3 w-3" /> Ödendi</span>;
      case 'Bekliyor':
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20"><Clock className="h-3 w-3" /> Ödeme Bekliyor</span>;
      case 'Gecikmiş':
        return <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10"><AlertCircle className="h-3 w-3" /> Gecikmiş</span>;
      default:
        return <span>{status}</span>;
    }
  };

  // Sütun başlığında sıralama ikonu gösterici yardımcı
  const renderSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-3.5 w-3.5 text-brand" /> 
      : <ArrowDown className="h-3.5 w-3.5 text-brand" />;
  };

  return (
    <div className="mx-auto max-w-7xl relative pb-24">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Faturalar</h1>
          <p className="text-sm text-gray-500 mt-1">Fatura detaylarınızı inceleyin, başlığa tıklayarak sıralayın ve seçerek ödeyin.</p>
        </div>
        
        <div className="flex items-center gap-2">
           <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              <Filter className="h-4 w-4" />
              Filtrele
           </button>
        </div>
      </div>

      {/* Sekmeler (Tabs) */}
      <div className="mb-6 flex space-x-1 rounded-xl bg-gray-100/80 p-1 w-full max-w-md">
        {['Tümü', 'Elektrik', 'Su', 'Doğalgaz'].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setSelectedInvoices([]);
            }}
            className={`w-full rounded-lg py-2 text-sm font-medium transition-all ${
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
            <thead className="bg-gray-50/50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-900 w-12">
                  <input 
                    type="checkbox" 
                    className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                    onChange={handleSelectAll}
                    checked={
                      processedInvoices.filter(i => i.durum !== 'Ödendi').length > 0 &&
                      selectedInvoices.length === processedInvoices.filter(i => i.durum !== 'Ödendi').length
                    }
                  />
                </th>

                {/* Sıralanabilir Başlıklar */}
                <th 
                  scope="col" 
                  onClick={() => handleSort('no')} 
                  className="group px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer select-none hover:bg-gray-100/60"
                >
                  <div className="flex items-center gap-2">
                    Fatura No
                    {renderSortIcon('no')}
                  </div>
                </th>

                <th 
                  scope="col" 
                  onClick={() => handleSort('donem')} 
                  className="group px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer select-none hover:bg-gray-100/60"
                >
                  <div className="flex items-center gap-2">
                    Dönem
                    {renderSortIcon('donem')}
                  </div>
                </th>

                <th 
                  scope="col" 
                  onClick={() => handleSort('sonOdeme')} 
                  className="group px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer select-none hover:bg-gray-100/60"
                >
                  <div className="flex items-center gap-2">
                    Son Ödeme
                    {renderSortIcon('sonOdeme')}
                  </div>
                </th>

                <th 
                  scope="col" 
                  onClick={() => handleSort('durum')} 
                  className="group px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer select-none hover:bg-gray-100/60"
                >
                  <div className="flex items-center gap-2">
                    Durum
                    {renderSortIcon('durum')}
                  </div>
                </th>

                <th 
                  scope="col" 
                  onClick={() => handleSort('tutar')} 
                  className="group px-6 py-4 text-right text-sm font-semibold text-gray-900 cursor-pointer select-none hover:bg-gray-100/60"
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
              {processedInvoices.map((invoice) => {
                const isPayable = invoice.durum !== 'Ödendi';
                return (
                  <tr key={invoice.id} className={`hover:bg-gray-50/50 transition-colors ${selectedInvoices.includes(invoice.id) ? 'bg-brand/5 hover:bg-brand/10' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input 
                        type="checkbox" 
                        disabled={!isPayable}
                        checked={selectedInvoices.includes(invoice.id)}
                        onChange={() => handleSelectOne(invoice.id)}
                        className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand disabled:opacity-30 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.no}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.donem}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.sonOdeme}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(invoice.durum)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">{formatCurrency(invoice.tutar)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="inline-flex items-center gap-1 text-brand hover:text-brand-dark transition-colors">
                        <Download className="h-4 w-4" /> PDF
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sticky Footer (Toplu Ödeme Barı) */}
      <div 
        className={`fixed bottom-0 left-0 right-0 lg:left-64 z-30 transform transition-transform duration-300 ease-in-out ${
          selectedInvoices.length > 0 ? 'translate-y-0' : 'translate-y-full'
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
             
             <button className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 font-medium text-white hover:bg-brand/90 transition-colors shadow-lg shadow-brand/20">
                <CreditCard className="h-5 w-5" />
                Seçilenleri Öde
             </button>
          </div>
        </div>
      </div>

    </div>
  );
}