import { AlertOctagon, Banknote, ShieldAlert, FileWarning } from 'lucide-react';
import FileLink from './ui/FileLink';
import { fileUrls } from '../services/api';
import { ALERT_TYPE_LABELS } from '../utils/warnings';
import { formatCurrency, formatDate } from '../utils/format';

const ICONS = {
  vadesi_gecmis_borc: Banknote,
  eksik_teminat: ShieldAlert,
  eksik_dbs: FileWarning,
};

// Vadesi geçmiş borç, eksik teminat ve eksik DBS uyarıları.
// Uyarı yoksa hiçbir şey çizmez (Ahmet Bey'in isteği: yoksa hiç görünmesin).
export default function AlertsPanel({ alerts, className = '' }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className={`rounded-2xl border border-red-200 bg-red-50/40 p-5 shadow-sm ${className}`}>
      <h3 className='mb-3 flex items-center gap-2 text-sm font-bold text-red-900'>
        <AlertOctagon className='h-5 w-5 text-red-600' />
        Dikkat Gerektiren Konular
      </h3>
      <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
        {alerts.map((alert) => {
          const Icon = ICONS[alert.tur] || AlertOctagon;
          return (
            <div key={alert.id} className='rounded-xl border border-red-100 bg-white p-4'>
              <div className='flex items-start justify-between gap-3'>
                <div className='flex min-w-0 items-start gap-3'>
                  <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50'>
                    <Icon className='h-5 w-5 text-red-600' />
                  </div>
                  <div className='min-w-0'>
                    <p className='text-xs font-semibold uppercase tracking-wide text-red-600'>
                      {ALERT_TYPE_LABELS[alert.tur] || alert.baslik}
                    </p>
                    <p className='mt-0.5 text-sm text-gray-700'>{alert.aciklama}</p>
                  </div>
                </div>
                {alert.tutar != null && (
                  <p className='shrink-0 text-sm font-bold text-gray-900'>
                    {formatCurrency(alert.tutar)}
                  </p>
                )}
              </div>
              <div className='mt-3 flex flex-wrap items-center justify-between gap-2 pl-12 text-xs'>
                {alert.sonTarih && (
                  <span className='text-gray-500'>
                    Son tarih: <strong className='text-gray-700'>{formatDate(alert.sonTarih)}</strong>
                  </span>
                )}
                <div className='flex flex-wrap gap-3'>
                  {(alert.dosyalar || []).map((f) => (
                    <FileLink
                      key={f.id}
                      url={fileUrls.alertFile(f.id)}
                      label={f.ad}
                      fileName={f.ad}
                      className='max-w-[180px] text-xs'
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
