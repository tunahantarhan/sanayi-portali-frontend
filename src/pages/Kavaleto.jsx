import { useState, useMemo, useEffect, useRef } from 'react';
import { Download, Truck, ArrowUpDown, ArrowUp, ArrowDown, HelpCircle, Loader2 } from 'lucide-react';
import { getKavaletoList } from '../services/api';

export default function Kavaleto() {
  const [kavaletoData, setKavaletoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'sevkTarihi', direction: 'desc' });  
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const tooltipRef = useRef(null);

  useEffect(() => {
    getKavaletoList()
      .then((data) => {
        setKavaletoData(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Kavaleto verileri alınamadı:', err);
        setLoading(false);
      });
  }, []);

  // Mobilde dışarı tıklandığında tooltip'i kapat
  useEffect(() => {
    function handleClickOutside(event) {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setIsTooltipOpen(false);
      }
    }
    if (isTooltipOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isTooltipOpen]);

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

  const sortedData = useMemo(() => {
    const list = [...kavaletoData];
    if (sortConfig.key) {
      list.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === 'sevkTarihi') {
          aVal = parseDate(aVal);
          bVal = parseDate(bVal);
        }

        if (sortConfig.key === 'miktarTon') {
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
  }, [kavaletoData, sortConfig]);

  const renderSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-3.5 w-3.5 text-brand" /> 
      : <ArrowDown className="h-3.5 w-3.5 text-brand" />;
  };

  const handleDownloadPdf = (sevkNo) => {
    alert(`${sevkNo} numaralı Kavaleto kantar tartım fişi indiriliyor.`);
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-800">Kavaleto İşlemleri</h1>
            
            {/* TOOLTIP */}
            <div 
              ref={tooltipRef}
              className="relative inline-flex items-center"
              onMouseEnter={() => setIsTooltipOpen(true)}
              onMouseLeave={() => setIsTooltipOpen(false)}
            >
              <button 
                type="button" 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsTooltipOpen((prev) => !prev);
                }}
                aria-label="Kavaleto hakkında bilgi" 
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-all focus:outline-none ${
                  isTooltipOpen 
                    ? 'bg-brand/10 text-brand ring-2 ring-brand/20' 
                    : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700 active:scale-95'
                }`}
              >
                <HelpCircle className="h-5 w-5" />
              </button>

              {/* Tooltip Balonu */}
              {isTooltipOpen && (
                <div className="absolute top-full mt-2.5 -left-44 sm:left-1/2 sm:-translate-x-1/2 w-72 sm:w-80 p-3.5 bg-gray-900 text-white text-xs rounded-xl shadow-2xl z-40 leading-relaxed animate-in fade-in zoom-in-95 duration-150">
                  <div className="absolute bottom-full left-[188px] sm:left-1/2 sm:-translate-x-1/2 border-4 border-transparent border-b-gray-900" />
                  
                  <p className="font-semibold text-amber-300 mb-1 flex items-center gap-1.5">
                    <span>Kavaleto Nedir?</span>
                  </p>
                  <p className="text-gray-200">
                    Organize Sanayi Bölgesi'nde deri işleme tesislerine ait kantar tartım fişleri, tonaj tespiti ve fabrika araç giriş-çıkış sevk kayıtlarını ifade eder.
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <p className="text-sm text-gray-500 mt-1">ERP onaylı sevk irsaliyeleri, tartım fişleri ve tonaj dökümleri.</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th 
                  scope="col" 
                  onClick={() => handleSort('sevkNo')} 
                  className="group px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer select-none hover:bg-gray-100/60"
                >
                  <div className="flex items-center gap-2">
                    Sevk / Fiş No
                    {renderSortIcon('sevkNo')}
                  </div>
                </th>

                <th 
                  scope="col" 
                  onClick={() => handleSort('sevkTarihi')} 
                  className="group px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer select-none hover:bg-gray-100/60"
                >
                  <div className="flex items-center gap-2">
                    Sevk Tarihi
                    {renderSortIcon('sevkTarihi')}
                  </div>
                </th>

                <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Araç Plakası
                </th>

                <th 
                  scope="col" 
                  onClick={() => handleSort('miktarTon')} 
                  className="group px-6 py-4 text-right text-sm font-semibold text-gray-900 cursor-pointer select-none hover:bg-gray-100/60"
                >
                  <div className="flex items-center justify-end gap-2">
                    Miktar (Ton)
                    {renderSortIcon('miktarTon')}
                  </div>
                </th>

                <th scope="col" className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                  Kantar Fişi PDF
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-sm text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-brand" />
                      <span>Kavaleto verileri yükleniyor...</span>
                    </div>
                  </td>
                </tr>
              ) : sortedData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-sm text-gray-500">
                    Kayıtlı kavaleto / kantar sevk kaydı bulunmamaktadır.
                  </td>
                </tr>
              ) : (
                sortedData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {item.sevkNo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.sevkTarihi}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-800">
                        <Truck className="h-3.5 w-3.5 text-gray-500" />
                        {item.aracPlaka}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                      {item.miktarTon.toFixed(2)} Ton
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleDownloadPdf(item.sevkNo)}
                        className="inline-flex items-center gap-1.5 text-brand hover:text-brand-dark font-medium transition-colors"
                      >
                        <Download className="h-4 w-4" /> PDF İndir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}