import { MapPinned } from 'lucide-react';
import FileLink from './ui/FileLink';
import { fileUrls } from '../services/api';
import { formatCurrency, formatDate, formatFileSize, formatNumber } from '../utils/format';

// Durum rozet renkleri; bilinmeyen durum gri gösterilir.
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

// Firmanın işgaliye kayıtları: dönem, alan/araç, tutar, fatura ve tutanak/fotoğraflar.
// Kayıt yoksa kart hiç gösterilmez.
export default function IsgaliyeList({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <div className='rounded-2xl border border-gray-200 bg-white p-6 shadow-sm'>
      <h3 className='mb-4 flex items-center gap-2 text-lg font-bold text-gray-900'>
        <MapPinned className='h-5 w-5 text-brand' /> İşgaliye Kayıtları
      </h3>
      <div className='divide-y divide-gray-100'>
        {items.map((k) => (
          <div key={k.id} className='py-4 first:pt-0 last:pb-0'>
            <div className='flex flex-wrap items-start justify-between gap-3'>
              <div className='min-w-0'>
                <div className='flex flex-wrap items-center gap-2'>
                  <p className='text-sm font-semibold text-gray-800'>
                    {[k.tur, k.parsel && `Parsel ${k.parsel}`].filter(Boolean).join(' · ') ||
                      'İşgaliye'}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${
                      STATUS_STYLES[k.durum] || STATUS_STYLES.faturalandi
                    }`}
                  >
                    {k.durumText || k.durum}
                  </span>
                </div>
                <p className='mt-0.5 text-xs text-gray-500'>
                  {period(k)}
                  {k.miktar != null &&
                    ` · ${formatNumber(k.miktar, k.miktar % 1 ? 1 : 0)} ${k.birim || ''}`}
                </p>
              </div>
              <div className='shrink-0 text-right'>
                <p className='text-sm font-bold text-gray-900'>{formatCurrency(k.tutar)}</p>
                {k.faturaNo && (
                  <p className='text-xs text-gray-500'>
                    Fatura {k.faturaNo}
                    {k.faturaTarihi && ` · ${formatDate(k.faturaTarihi)}`}
                  </p>
                )}
              </div>
            </div>
            {k.aciklama && <p className='mt-2 text-sm text-gray-600'>{k.aciklama}</p>}
            {k.dosyalar?.length > 0 && (
              <div className='mt-2 flex flex-wrap gap-x-4 gap-y-1'>
                {k.dosyalar.map((f) => (
                  <FileLink
                    key={f.id}
                    url={fileUrls.isgaliyeFile(k.id, f.id)}
                    label={f.boyut ? `${f.ad} (${formatFileSize(f.boyut)})` : f.ad}
                    fileName={f.ad}
                    className='max-w-[260px] text-xs'
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
