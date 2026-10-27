import { Zap, Droplets, Flame, AlertCircle, Info, CalendarClock } from 'lucide-react';
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
import { tenantConfig } from '../config';

// TODO: Bu mock veri ileride Backend'den (Fastify) "/api/consumption/endpoint-ismi" endpointi ile çekilecek.
const mockChartData = [
  { name: 'Oca', elektrik: 11000, su: 280, dogalgaz: 1200 },
  { name: 'Şub', elektrik: 11500, su: 290, dogalgaz: 1400 },
  { name: 'Mar', elektrik: 10800, su: 310, dogalgaz: 1100 },
  { name: 'Nis', elektrik: 10200, su: 350, dogalgaz: 800 },
  { name: 'May', elektrik: 12100, su: 380, dogalgaz: 600 },
  { name: 'Haz', elektrik: 13500, su: 420, dogalgaz: 400 },
  { name: 'Tem', elektrik: 14200, su: 450, dogalgaz: 350 },
  { name: 'Ağu', elektrik: 14000, su: 440, dogalgaz: 380 },
  { name: 'Eyl', elektrik: 12450, su: 320, dogalgaz: 980 },
  // Son 3 ay tahmini/boş bırakılabilir veya önceki yıla ait olabilir
  { name: 'Eki', elektrik: 11800, su: 300, dogalgaz: 1300 },
  { name: 'Kas', elektrik: 11200, su: 290, dogalgaz: 1500 },
  { name: 'Ara', elektrik: 11000, su: 280, dogalgaz: 1600 },
];

// TODO: Duyurular ileride ERP/Backend'den çekilecek. (Örn: "/api/announcements")
const mockAnnouncements = [
  {
    id: 1,
    type: 'alert',
    title: 'Yaklaşan Ödeme',
    desc: 'Eylül ayı elektrik faturasının son ödeme tarihi yaklaşıyor.',
    date: 'Yarın',
    icon: AlertCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-50'
  },
  {
    id: 2,
    type: 'info',
    title: 'Tarife Güncellemesi',
    desc: 'Ekim ayı itibarıyla su birim fiyatlarında güncelleme yapılmıştır.',
    date: '2 saat önce',
    icon: Info,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50'
  },
  {
    id: 3,
    type: 'warning',
    title: 'Planlı Kesinti',
    desc: 'Hafta sonu trafo bakım çalışması nedeniyle kısa süreli kesinti yaşanacaktır.',
    date: '28 Ekim',
    icon: CalendarClock,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50'
  }
];

export default function Dashboard() {
  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="mb-8 text-2xl font-bold text-gray-800">Ana Sayfa</h1>
      
      {/* (TODO: Bu rakamlar "/api/consumption/current-month" ile çekilecek) */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Elektrik Kartı */}
        <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Bu Ayki Elektrik</h3>
            <p className="mt-2 text-3xl font-bold text-gray-800">12.450 <span className="text-lg font-medium text-gray-400">kWh</span></p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50">
            <Zap className="h-6 w-6 text-amber-500" />
          </div>
        </div>

        {/* Su Kartı */}
        <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Bu Ayki Su</h3>
            <p className="mt-2 text-3xl font-bold text-gray-800">320 <span className="text-lg font-medium text-gray-400">m³</span></p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
            <Droplets className="h-6 w-6 text-blue-500" />
          </div>
        </div>

        {/* Doğalgaz Kartı */}
        <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Bu Ayki Doğalgaz</h3>
            <p className="mt-2 text-3xl font-bold text-gray-800">980 <span className="text-lg font-medium text-gray-400">m³</span></p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50">
            <Flame className="h-6 w-6 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Grafik Alanı */}
        <div className="lg:col-span-2 flex flex-col h-[400px] rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-6">12 Aylık Tüketim Analizi</h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
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
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                
                <Line yAxisId="left" type="monotone" dataKey="elektrik" name="Elektrik (kWh)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" dataKey="su" name="Su (m³)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" dataKey="dogalgaz" name="Doğalgaz (m³)" stroke="#f97316" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Duyurular/Bildirimler Alanı */}
        <div className="flex flex-col h-[400px] rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-semibold text-gray-800">Duyurular ve Uyarılar</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                 {mockAnnouncements.map((item) => (
                   <div key={item.id} className="flex gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer mb-1">
                     <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${item.bgColor}`}>
                       <item.icon className={`h-5 w-5 ${item.color}`} />
                     </div>
                     <div>
                       <h4 className="text-sm font-semibold text-gray-800">{item.title}</h4>
                       <p className="mt-1 text-xs text-gray-500 line-clamp-2">{item.desc}</p>
                       <p className="mt-2 text-[11px] font-medium text-gray-400">{item.date}</p>
                     </div>
                   </div>
                 ))}
            </div>
            <div className="p-3 border-t border-gray-100 bg-gray-50/50 text-center">
              <button className="text-sm font-medium text-brand hover:underline">Tümünü Gör</button>
            </div>
        </div>
      </div>
    </div>
  );
}