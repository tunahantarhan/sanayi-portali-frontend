import { useState, useMemo } from 'react';
import { Download, Truck, ArrowUpDown, ArrowUp, ArrowDown, FileText } from 'lucide-react';

// TODO: ERP üzerinden onaylanan kavaleto dökümleri çekilecek
const mockKavaletoData = [
  { id: 1, sevkNo: 'KVT-2026-0041', sevkTarihi: '22.10.2026', miktarTon: 14.25, aracPlaka: '34 VT 4810', durum: 'Onaylandı' },
  { id: 2, sevkNo: 'KVT-2026-0038', sevkTarihi: '15.10.2026', miktarTon: 22.80, aracPlaka: '34 KV 1905', durum: 'Onaylandı' },
  { id: 3, sevkNo: 'KVT-2026-0031', sevkTarihi: '04.10.2026', miktarTon: 18.10, aracPlaka: '34 AB 7712', durum: 'Onaylandı' },
  { id: 4, sevkNo: 'KVT-2026-0027', sevkTarihi: '28.09.2026', miktarTon: 9.60, aracPlaka: '34 DB 3301', durum: 'Onaylandı' },
];

export default function Kavaleto() {
  const [sortConfig, setSortConfig] = useState({ key: 'sevkTarihi', direction: 'desc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const parseDate = (dateStr) => {
    const [day, month, year] = dateStr.split('.');
    return new Date(`${year}-${month}-${day}`).getTime();
  };

  const sortedData = useMemo(() => {
    const list = [...mockKavaletoData];
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
  }, [sortConfig]);

  const renderSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-3.5 w-3.5 text-brand" /> 
      : <ArrowDown className="h-3.5 w-3.5 text-brand" />;
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Kavaleto İşlemleri</h1>
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
                  PDF Çıktısı
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {sortedData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {item.sevkNo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.sevkTarihi}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                      <Truck className="h-3.5 w-3.5 text-gray-500" />
                      {item.aracPlaka}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                    {item.miktarTon.toFixed(2)} Ton
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="inline-flex items-center gap-1 text-brand hover:text-brand-dark transition-colors">
                      <Download className="h-4 w-4" /> İndir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}