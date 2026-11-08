import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  Droplets,
  Flame,
  AlertCircle,
  Info,
  CalendarClock,
  ShieldAlert,
  ArrowRight,
  AlertTriangle,
  Megaphone,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { getDashboardData, getAlerts, getFirmProfile } from '../services/api';
import useApi from '../hooks/useApi';
import AlertsPanel from '../components/AlertsPanel';
import Modal from '../components/ui/Modal';
import { LoadingState, ErrorState, EmptyState } from '../components/ui/PageState';
import { buildExpiryWarnings } from '../utils/warnings';
import { formatDate, formatDaysLeft, formatMonthShort, formatNumber, formatRelative } from '../utils/format';

// Uyarı pop-up'ı oturum başına bir kez gösterilir ("Daha sonra hatırlat" ile kapatılınca tekrar açılmaz)
const WARNING_DISMISS_KEY = 'warning-modal-dismissed';
const isWarningDismissed = () => {
  try {
    return sessionStorage.getItem(WARNING_DISMISS_KEY) === '1';
  } catch {
    return false;
  }
};

const ANNOUNCEMENT_STYLES = {
  kritik: { icon: AlertCircle, color: 'text-red-500', bgColor: 'bg-red-50' },
  uyari: { icon: CalendarClock, color: 'text-amber-500', bgColor: 'bg-amber-50' },
  bilgi: { icon: Info, color: 'text-blue-500', bgColor: 'bg-blue-50' },
};
const announcementStyle = (tur) => ANNOUNCEMENT_STYLES[tur] || ANNOUNCEMENT_STYLES.bilgi;

const CONSUMPTION_CARDS = [
  {
    key: 'elektrik',
    label: 'BU AYKİ ELEKTRİK',
    empty: 'Elektrik aboneliğiniz bulunmamaktadır',
    icon: Zap,
    iconClass: 'bg-amber-50 text-amber-500 ring-amber-500/20',
    fillClass: 'fill-amber-500/20',
    emptyClass: 'text-amber-600',
  },
  {
    key: 'su',
    label: 'BU AYKİ SU',
    empty: 'Su aboneliğiniz bulunmamaktadır',
    icon: Droplets,
    iconClass: 'bg-sky-50 text-sky-600 ring-sky-600/20',
    fillClass: 'fill-sky-600/20',
    emptyClass: 'text-blue-600',
  },
  {
    key: 'dogalgaz',
    label: 'BU AYKİ DOĞALGAZ',
    empty: 'Doğalgaz aboneliğiniz bulunmamaktadır',
    icon: Flame,
    iconClass: 'bg-orange-50 text-orange-600 ring-orange-600/20',
    fillClass: 'fill-orange-600/20',
    emptyClass: 'text-orange-600',
  },
];

function ConsumptionCard({ card, value }) {
  const Icon = card.icon;
  const hasValue = value?.abonelik && value.miktar !== null && value.miktar !== undefined;
  return (
    <div className='flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md'>
      <div className='flex-1 pr-3'>
        <h3 className='text-xs font-semibold tracking-wider text-gray-400'>{card.label}</h3>
        {hasValue ? (
          <p className='mt-2 text-3xl font-extrabold tracking-tight text-gray-900'>
            {formatNumber(value.miktar)}{' '}
            <span className='font-sans text-sm font-semibold text-gray-400'>{value.birim}</span>
          </p>
        ) : (
          <div className='mt-2'>
            <span className='text-2xl font-bold text-gray-400'>--</span>
            <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${card.emptyClass}`}>
              <AlertTriangle className='h-3 w-3' />{' '}
              {value?.abonelik ? 'Bu ay için tüketim verisi yok' : card.empty}
            </p>
          </div>
        )}
      </div>
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ${card.iconClass}`}
      >
        <Icon className={`h-6 w-6 ${card.fillClass}`} />
      </div>
    </div>
  );
}

function AnnouncementIcon({ tur, size = 'h-9 w-9' }) {
  const style = announcementStyle(tur);
  const Icon = style.icon;
  return (
    <div className={`flex ${size} shrink-0 items-center justify-center rounded-xl ${style.bgColor}`}>
      <Icon className={`h-5 w-5 ${style.color}`} />
    </div>
  );
}

export default function Dashboard() {
  const dashboard = useApi(getDashboardData);
  const alerts = useApi(getAlerts);
  const profile = useApi(getFirmProfile);

  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false);
  const [warningDismissed, setWarningDismissed] = useState(isWarningDismissed);

  const navigate = useNavigate();

  const expiryWarnings = useMemo(() => buildExpiryWarnings(profile.data), [profile.data]);
  const showWarningModal = !warningDismissed && expiryWarnings.length > 0;

  const dismissWarnings = () => {
    try {
      sessionStorage.setItem(WARNING_DISMISS_KEY, '1');
    } catch {
      // Depolama kapalıysa yalnızca bu sayfa için kapanır
    }
    setWarningDismissed(true);
  };

  if (dashboard.loading) return <LoadingState text='Panel verileri yükleniyor...' />;
  if (dashboard.error) return <ErrorState error={dashboard.error} onRetry={dashboard.reload} />;

  const { tuketim, duyurular = [] } = dashboard.data;
  const chartData = (tuketim?.son12Ay || []).map((row) => ({
    ...row,
    name: formatMonthShort(row.ay),
  }));
  const hasWater = chartData.some((r) => r.su !== null && r.su !== undefined);

  return (
    <div className='mx-auto max-w-7xl'>
      <h1 className='mb-8 text-2xl font-bold text-gray-800'>Ana Sayfa</h1>

      <AlertsPanel alerts={alerts.data} className='mb-8' />

      <div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-3'>
        {CONSUMPTION_CARDS.map((card) => (
          <ConsumptionCard key={card.key} card={card} value={tuketim?.buAy?.[card.key]} />
        ))}
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* 12 Aylık Tüketim Grafiği */}
        <div className='flex h-[420px] flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2'>
          <div className='mb-4 flex items-center justify-between'>
            <h3 className='font-bold text-gray-800'>12 Aylık Tüketim Analizi</h3>
            <span className='text-xs text-gray-400'>Son 1 Yıllık Trend</span>
          </div>

          <div className='w-full flex-1'>
            {chartData.length === 0 ? (
              <EmptyState text='Tüketim verisi bulunmamaktadır.' className='h-full' />
            ) : (
              <ResponsiveContainer width='100%' height='100%'>
                <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='#f3f4f6' />
                  <XAxis
                    dataKey='name'
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    yAxisId='left'
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    tickFormatter={(v) => formatNumber(v)}
                  />
                  <YAxis yAxisId='right' orientation='right' axisLine={false} tickLine={false} tick={false} />
                  <Tooltip
                    formatter={(v) => (v === null ? '—' : formatNumber(v))}
                    contentStyle={{
                      borderRadius: '16px',
                      border: '1px solid #f3f4f6',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
                    }}
                  />
                  <Legend iconType='circle' wrapperStyle={{ paddingTop: '20px' }} />
                  <Line
                    yAxisId='left'
                    type='monotone'
                    dataKey='elektrik'
                    name='Elektrik (kWh)'
                    stroke='#f59e0b'
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                  {hasWater && (
                    <Line
                      yAxisId='right'
                      type='monotone'
                      dataKey='su'
                      name='Su (m³)'
                      stroke='#0284c7'
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#0284c7', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6 }}
                    />
                  )}
                  <Line
                    yAxisId='right'
                    type='monotone'
                    dataKey='dogalgaz'
                    name='Doğalgaz (kWh)'
                    stroke='#ea580c'
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#ea580c', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Duyurular */}
        <div className='flex h-[420px] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm'>
          <div className='flex items-center justify-between border-b border-gray-100 bg-gray-50/70 p-5'>
            <h3 className='font-bold text-gray-800'>Duyurular ve Uyarılar</h3>
            <span className='text-[11px] font-medium text-gray-400'>Detay için tıklayın</span>
          </div>

          <div className='flex-1 space-y-2.5 overflow-y-auto p-3'>
            {duyurular.length === 0 ? (
              <EmptyState text='Güncel duyuru bulunmamaktadır.' icon={Megaphone} />
            ) : (
              duyurular.map((item) => (
                <button
                  type='button'
                  key={item.id}
                  onClick={() => setSelectedAnnouncement(item)}
                  className='group flex w-full gap-3.5 rounded-xl border border-transparent p-3 text-left transition-all hover:border-gray-200 hover:bg-gray-50/80 active:scale-[0.99]'
                >
                  <AnnouncementIcon tur={item.tur} />
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center justify-between gap-2'>
                      <h4 className='truncate text-xs font-bold text-gray-900 transition-colors group-hover:text-brand'>
                        {item.baslik}
                      </h4>
                      <span className='shrink-0 text-[10px] font-medium text-gray-400'>
                        {formatRelative(item.tarih)}
                      </span>
                    </div>
                    <p className='mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500'>
                      {item.ozet}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          {duyurular.length > 0 && (
            <div className='border-t border-gray-100 bg-gray-50/50 p-3 text-center'>
              <button
                onClick={() => setShowAllAnnouncements(true)}
                className='text-xs font-semibold text-brand hover:underline'
              >
                Tüm Duyuruları Listele ({duyurular.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tüm duyurular */}
      {showAllAnnouncements && (
        <Modal
          title='Tüm Duyurular'
          subtitle={`${duyurular.length} duyuru`}
          size='max-w-2xl'
          onClose={() => setShowAllAnnouncements(false)}
        >
          <div className='divide-y divide-gray-100'>
            {duyurular.map((item) => (
              <div key={item.id} className='flex gap-4 px-6 py-5'>
                <AnnouncementIcon tur={item.tur} size='h-10 w-10' />
                <div className='min-w-0 flex-1'>
                  <div className='flex flex-wrap items-baseline justify-between gap-2'>
                    <h4 className='text-sm font-bold text-gray-900'>{item.baslik}</h4>
                    <span className='text-xs text-gray-400'>{formatDate(item.tarih)}</span>
                  </div>
                  <p className='mt-1 text-sm text-gray-700'>{item.ozet}</p>
                  {item.icerik && (
                    <p className='mt-2 text-xs leading-relaxed text-gray-500'>{item.icerik}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Tek duyuru */}
      {selectedAnnouncement && (
        <Modal
          title={selectedAnnouncement.baslik}
          subtitle={formatDate(selectedAnnouncement.tarih)}
          icon={<AnnouncementIcon tur={selectedAnnouncement.tur} size='h-10 w-10' />}
          onClose={() => setSelectedAnnouncement(null)}
          footer={
            <button
              onClick={() => setSelectedAnnouncement(null)}
              className='rounded-xl bg-brand px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-dark'
            >
              Kapat
            </button>
          }
        >
          <div className='space-y-3 p-6'>
            <p className='text-sm font-medium leading-relaxed text-gray-800'>
              {selectedAnnouncement.ozet}
            </p>
            {selectedAnnouncement.icerik && (
              <div className='rounded-xl border border-gray-100 bg-gray-50 p-4 text-xs leading-relaxed text-gray-600'>
                {selectedAnnouncement.icerik}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Süresi yaklaşan teminat ve izinler (veriden üretilir, yoksa açılmaz) */}
      {showWarningModal && (
        <Modal
          title='Süresi Yaklaşan İzin ve Teminatlar'
          subtitle='Lütfen işlemlerinizi tamamlayınız'
          headerClassName='bg-amber-500/10'
          icon={
            <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white'>
              <ShieldAlert className='h-6 w-6' />
            </div>
          }
          onClose={dismissWarnings}
          footer={
            <>
              <button
                onClick={dismissWarnings}
                className='rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100'
              >
                Daha Sonra Hatırlat
              </button>
              <button
                onClick={() => {
                  dismissWarnings();
                  navigate('/panel/firmam');
                }}
                className='flex items-center gap-2 rounded-xl bg-brand px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-dark'
              >
                Detayları Gör <ArrowRight className='h-4 w-4' />
              </button>
            </>
          }
        >
          <div className='space-y-3 p-6'>
            {expiryWarnings.map((w) => {
              const urgent = w.days <= 7;
              const tone =
                w.kind === 'kanal' && !urgent
                  ? 'border-blue-200 bg-blue-50/60 text-blue-900'
                  : 'border-amber-200 bg-amber-50/60 text-amber-900';
              return (
                <div key={w.id} className={`rounded-xl border p-4 ${tone}`}>
                  <div className='flex items-start justify-between gap-3'>
                    <h4 className='text-sm font-bold'>{w.title}</h4>
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${
                        w.days < 0 ? 'bg-red-100 text-red-700' : 'bg-white/80'
                      }`}
                    >
                      {formatDaysLeft(w.days)}
                    </span>
                  </div>
                  <p className='mt-1 text-xs opacity-90'>
                    {w.text} <strong>{formatDate(w.date)}</strong> tarihinde{' '}
                    {w.days < 0 ? 'sona erdi' : 'sona erecektir'}.{' '}
                    {w.kind === 'kanal'
                      ? 'OSB Başvuru ekranından yenileme başvurusu yapabilirsiniz.'
                      : 'Cezai duruma düşmemek için teminatınızı yenileyiniz.'}
                  </p>
                </div>
              );
            })}
          </div>
        </Modal>
      )}
    </div>
  );
}
