import { useState, useMemo, useEffect, useRef } from 'react';
import { Truck, HelpCircle, Loader2 } from 'lucide-react';
import { getKavaletoList, fileUrls } from '../services/api';
import useApi from '../hooks/useApi';
import SortableTh from '../components/ui/SortableTh';
import FileLink from '../components/ui/FileLink';
import { ErrorState } from '../components/ui/PageState';
import { formatDate, formatNumber, toTimestamp } from '../utils/format';
import { sortList, nextSort } from '../utils/sort';

const SORTERS = {
  sevkNo: (k) => k.sevkNo,
  sevkTarihi: (k) => toTimestamp(k.sevkTarihi),
  aracPlaka: (k) => k.aracPlaka,
  miktarTon: (k) => k.miktarTon,
};

export default function Kavaleto() {
  const { data, loading, error, reload } = useApi(getKavaletoList);
  const [sortConfig, setSortConfig] = useState({ key: 'sevkTarihi', direction: 'desc' });  
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const tooltipRef = useRef(null);

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

  const sortedData = useMemo(() => sortList(data || [], SORTERS, sortConfig), [data, sortConfig]);
  const onSort = (key) => setSortConfig(nextSort(sortConfig, key));

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
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="select-none bg-gray-50/50">
              <tr>
                <SortableTh k="sevkNo" sortConfig={sortConfig} onSort={onSort}>
                  Sevk / Fiş No
                </SortableTh>
                <SortableTh k="sevkTarihi" sortConfig={sortConfig} onSort={onSort}>
                  Sevk Tarihi
                </SortableTh>
                <SortableTh k="aracPlaka" sortConfig={sortConfig} onSort={onSort}>
                  Araç Plakası
                </SortableTh>
                <SortableTh k="miktarTon" sortConfig={sortConfig} onSort={onSort} align="right">
                  Miktar (Ton)
                </SortableTh>
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
                      {formatDate(item.sevkTarihi)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-800">
                        <Truck className="h-3.5 w-3.5 text-gray-500" />
                        {item.aracPlaka}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                      {formatNumber(item.miktarTon, 2)} Ton
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {item.dosyaId ? (
                        <FileLink
                          url={fileUrls.kavaletoPdf(item.id)}
                          label="PDF İndir"
                          fileName={`${item.sevkNo}.pdf`}
                        />
                      ) : (
                        <span className="text-xs text-gray-400">Belge yok</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
}