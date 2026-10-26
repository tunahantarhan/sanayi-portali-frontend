import { Zap, Droplets, Flame } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="mb-8 text-2xl font-bold text-gray-800">Ana Sayfa</h1>
      
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

      {/* Grafik Alanı */}
      <div className="flex h-80 items-center justify-center rounded-2xl border border-gray-100 bg-white shadow-sm">
        <p className="text-gray-400">TODO: 12 Aylık Dinamik Tüketim Grafiği (Recharts...)</p>
      </div>
    </div>
  );
}