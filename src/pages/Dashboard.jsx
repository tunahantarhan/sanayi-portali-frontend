import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, 
  Droplets, 
  Flame, 
  AlertCircle, 
  Info, 
  CalendarClock, 
  ShieldAlert, 
  X, 
  ArrowRight,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { getDashboardData } from '../services/api';

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWarningModal, setShowWarningModal] = useState(true);
  
  // Tıklanan duyuruyu açan modal state'i
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    getDashboardData()
      .then((data) => {
        setDashboardData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Dashboard verileri alınamadı:', err);
        setLoading(false);
      });
  }, []);

  const getAnnouncementBadge = (type) => {
    switch (type) {
      case 'alert':
        return { icon: AlertCircle, color: 'text-red-500', bgColor: 'bg-red-50' };
      case 'warning':
        return { icon: CalendarClock, color: 'text-amber-500', bgColor: 'bg-amber-50' };
      default:
        return { icon: Info, color: 'text-blue-500', bgColor: 'bg-blue-50' };
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
        <span className="ml-3 text-sm text-gray-500 font-medium">Panel verileri yükleniyor...</span>
      </div>
    );
  }

  const { elektrik, su, dogalgaz } = dashboardData?.currentMonth || {};

  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="mb-8 text-2xl font-bold text-gray-800">Ana Sayfa</h1>
      
      {/* 3'lü Özet Tüketim Kartları */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        
        {/* ELEKTRİK */}
        <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex-1 pr-3">
            <h3 className="text-xs font-semibold tracking-wider text-gray-400">BU AYKİ ELEKTRİK</h3>
            {elektrik?.miktar ? (
              <p className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight">
                {elektrik.miktar}{' '}
                <span className="text-sm font-semibold text-gray-400 font-sans">{elektrik.birim}</span>
              </p>
            ) : (
              <div className="mt-2">
                <span className="text-2xl font-bold text-gray-400">--</span>
                <p className="text-xs font-medium text-amber-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Elektrik Tüketiminiz Bulunmamaktadır
                </p>
              </div>
            )}
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 ring-1 ring-amber-500/20">
            <Zap className="h-6 w-6 fill-amber-500/20" />
          </div>
        </div>

        {/* SU */}
        <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex-1 pr-3">
            <h3 className="text-xs font-semibold tracking-wider text-gray-400">BU AYKİ SU</h3>
            {su?.miktar ? (
              <p className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight">
                {su.miktar}{' '}
                <span className="text-sm font-semibold text-gray-400 font-sans">{su.birim}</span>
              </p>
            ) : (
              <div className="mt-2">
                <span className="text-2xl font-bold text-gray-400">--</span>
                <p className="text-xs font-medium text-blue-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Su Tüketiminiz Bulunmamaktadır
                </p>
              </div>
            )}
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 ring-1 ring-sky-600/20">
            <Droplets className="h-6 w-6 fill-sky-600/20" />
          </div>
        </div>

        {/* DOĞALGAZ */}
        <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex-1 pr-3">
            <h3 className="text-xs font-semibold tracking-wider text-gray-400">BU AYKİ DOĞALGAZ</h3>
            {dogalgaz?.miktar ? (
              <p className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight">
                {dogalgaz.miktar}{' '}
                <span className="text-sm font-semibold text-gray-400 font-sans">{dogalgaz.birim}</span>
              </p>
            ) : (
              <div className="mt-2">
                <span className="text-2xl font-bold text-gray-400">--</span>
                <p className="text-xs font-medium text-orange-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Doğalgaz Tüketiminiz Bulunmamaktadır
                </p>
              </div>
            )}
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 ring-1 ring-orange-600/20">
            <Flame className="h-6 w-6 fill-orange-600/20" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 12 Aylık Tüketim Grafiği */}
        <div className="lg:col-span-2 flex flex-col h-[420px] rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">12 Aylık Tüketim Analizi</h3>
            <span className="text-xs text-gray-400">Son 1 Yıllık Trend</span>
          </div>
          
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardData?.chart12Months || []} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12 }} 
                  dy={10} 
                />
                <YAxis 
                  yAxisId="left" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12 }} 
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={false} 
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: '1px solid #f3f4f6', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08)' 
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                
                {/* Elektrik: Altın Sarısı */}
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="elektrik" 
                  name="Elektrik (kWh)" 
                  stroke="#f59e0b" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 6 }} 
                />
                {/* Su: Mavi */}
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="su" 
                  name="Su (m³)" 
                  stroke="#0284c7" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#0284c7', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 6 }} 
                />
                {/* Doğalgaz: Kiremit/Kırmızı-Turuncu */}
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="dogalgaz" 
                  name="Doğalgaz (kWh)" 
                  stroke="#ea580c" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#ea580c', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Duyurular ve Bildirimler Akışı */}
        <div className="flex flex-col h-[420px] rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50/70 flex items-center justify-between">
            <h3 className="font-bold text-gray-800">Duyurular ve Uyarılar</h3>
            <span className="text-[11px] font-medium text-gray-400">Detay için tıklayın</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {dashboardData?.announcements?.map((item) => {
              const badge = getAnnouncementBadge(item.type);
              const Icon = badge.icon;
              return (
                <div 
                  key={item.id} 
                  onClick={() => setSelectedAnnouncement(item)}
                  className="flex gap-3.5 p-3 rounded-xl border border-transparent hover:border-gray-200 hover:bg-gray-50/80 active:scale-[0.99] transition-all cursor-pointer group"
                >
                  <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${badge.bgColor}`}>
                    <Icon className={`h-5 w-5 ${badge.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-gray-900 truncate group-hover:text-brand transition-colors">
                        {item.title}
                      </h4>
                      <span className="text-[10px] font-medium text-gray-400 shrink-0">{item.date}</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 border-t border-gray-100 bg-gray-50/50 text-center">
            <button 
              onClick={() => setSelectedAnnouncement(dashboardData?.announcements?.[0])}
              className="text-xs font-semibold text-brand hover:underline"
            >
              Tüm Duyuruları Listele
            </button>
          </div>
        </div>
      </div>

      {/* Pop-up Uyarı Modalı */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/80">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${getAnnouncementBadge(selectedAnnouncement.type).bgColor}`}>
                  {(() => {
                    const Icon = getAnnouncementBadge(selectedAnnouncement.type).icon;
                    return <Icon className={`h-5 w-5 ${getAnnouncementBadge(selectedAnnouncement.type).color}`} />;
                  })()}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{selectedAnnouncement.title}</h3>
                  <span className="text-xs text-gray-400">{selectedAnnouncement.date}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedAnnouncement(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200/60 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-sm font-medium text-gray-800 leading-relaxed">
                {selectedAnnouncement.desc}
              </p>
              {selectedAnnouncement.content && (
                <div className="rounded-xl bg-gray-50 p-4 border border-gray-100 text-xs text-gray-600 leading-relaxed">
                  {selectedAnnouncement.content}
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-gray-100 px-6 py-3.5 bg-gray-50/50">
              <button 
                onClick={() => setSelectedAnnouncement(null)}
                className="rounded-xl bg-brand px-5 py-2 text-xs font-semibold text-white hover:bg-brand-dark transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SÜRESİ DOLAN TEMİNAT/İZİN MODALI */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 bg-amber-500/10 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Süresi Yaklaşan İzin ve Teminatlar</h3>
                  <p className="text-xs text-gray-500">Lütfen işlemlerinizi tamamlayınız</p>
                </div>
              </div>
              <button 
                onClick={() => setShowWarningModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 p-6">
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <div className="flex justify-between items-start">
                   <h4 className="text-sm font-bold text-amber-900">Banka Teminat Mektubu Süresi Doluyor</h4>
                   <span className="rounded-md bg-amber-200/80 px-2 py-0.5 text-xs font-semibold text-amber-800">5 Gün Kaldı</span>
                </div>
                <p className="mt-1 text-xs text-amber-800">
                  Garanti Bankası teminat mektubunuzun süresi <strong>01.11.2026</strong> tarihinde sona erecektir. Cezai duruma düşmemek için teminatınızı yenileyiniz.
                </p>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
                <div className="flex justify-between items-start">
                   <h4 className="text-sm font-bold text-blue-900">Kanal Bağlantı İzin Belgesi Yenileme</h4>
                   <span className="rounded-md bg-blue-200/80 px-2 py-0.5 text-xs font-semibold text-blue-800">12 Gün Kaldı</span>
                </div>
                <p className="mt-1 text-xs text-blue-800">
                  Fabrikanız için geçerli olan Kanal Bağlantı İzninin süresi <strong>08.11.2026</strong> tarihinde dolacaktır. Başvuru sekmesinden yenileme yapabilirsiniz.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4">
              <button 
                onClick={() => setShowWarningModal(false)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Daha Sonra Hatırlat
              </button>
              <button 
                onClick={() => {
                  setShowWarningModal(false);
                  navigate('/panel/firmam');
                }}
                className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2 text-sm font-medium text-white hover:bg-brand-dark shadow-sm"
              >
                Detayları Gör <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}