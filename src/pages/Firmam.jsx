import { Building2, ShieldCheck, FileCheck, Phone, Mail, MapPin, MessageSquare, Briefcase } from 'lucide-react';
import { tenantConfig } from '../config';

export default function Firmam() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Firma Profili ve Bilgileri</h1>
        <p className="text-sm text-gray-500 mt-1">Sicil kayıtları, teminat mektupları ve OSB ile olan yasal izinleriniz.</p>
      </div>

      {/* 1. KART: TEMEL FİRMA BİLGİLERİ & BİLDİRİM KANALLARI */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-brand" /> Firma Genel Bilgileri
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <span className="text-xs text-gray-400 font-medium">Firma Ünvanı</span>
            <p className="text-sm font-semibold text-gray-800 mt-1">Örnek Deri Sanayi ve Tic. A.Ş.</p>
          </div>
          <div>
            <span className="text-xs text-gray-400 font-medium">Vergi No / Dairesi</span>
            <p className="text-sm font-semibold text-gray-800 mt-1">4810090571 (Tuzla V.D.)</p>
          </div>
          <div>
            <span className="text-xs text-gray-400 font-medium">Abone No</span>
            <p className="text-sm font-semibold text-gray-800 mt-1">TR-IDOSB-88341</p>
          </div>
          <div>
            <span className="text-xs text-gray-400 font-medium">SMS & E-Tebligat Durumu</span>
            <p className="text-sm font-semibold text-emerald-600 mt-1 flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" /> Aktif (+90 532 *** ** 00)
            </p>
          </div>
        </div>
      </div>

      {/* 2. KART: TEMİNAT BİLGİLERİ & KANAL BAĞLANTI İZNİ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Teminat Bilgileri */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-brand" /> Teminat Bilgileri
            </h3>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-600/20">
              Yenileme Bekliyor
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Garanti BBVA - Teminat Mektubu</p>
                <p className="text-xs text-gray-500">Mektup No: GR-994102</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">1.500.000 ₺</p>
                <p className="text-xs font-medium text-red-500">Bitiş: 01.11.2026</p>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">DBS (Doğrudan Borçlanma Sistemi)</p>
                <p className="text-xs text-gray-500">İş Bankası</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">750.000 ₺</p>
                <p className="text-xs font-medium text-emerald-600">Süresiz / Aktif</p>
              </div>
            </div>
          </div>
        </div>

        {/* Kanal Bağlantı İzin Bilgisi */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-brand" /> Kanal Bağlantı İzni
            </h3>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-600/20">
              12 Gün Kaldı
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">İzin Belge No:</span>
              <span className="font-semibold text-gray-800">KB-2024/091</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Geçerlilik Başlangıç:</span>
              <span className="font-semibold text-gray-800">08.11.2024</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Bitiş Tarihi:</span>
              <span className="font-bold text-red-600">08.11.2026</span>
            </div>
            <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
              Süre bitiminden önce arıtma tesisi parametre değerleriniz ile birlikte OSB Başvuru ekranından yenileme başvurusu yapmanız gerekmektedir.
            </p>
          </div>
        </div>

      </div>

      {/* 3. KART: OSB İLETİŞİM, KEP & İSTİHDAM */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{tenantConfig.fullName} Bölge Müdürlüğü</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-brand shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-800">Adres</p>
              <p className="text-gray-500 text-xs mt-1">Aydınlı Mah. Deri OSB Yan Yol Cad. No:1 Tuzla / İSTANBUL</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="h-5 w-5 text-brand shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-800">Santral / Telefon</p>
              <p className="text-gray-500 text-xs mt-1">(0216) 394 14 80</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-brand shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-800">E-Posta & KEP</p>
              <p className="text-gray-500 text-xs mt-1">info@ideriosb.org.tr<br/>ideriosb@hs01.kep.tr</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Briefcase className="h-5 w-5 text-brand shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-800">İstihdam / İlan</p>
              <p className="text-gray-500 text-xs mt-1">İDOSB Kariyer Portalından personel arayışlarınızı yayınlayabilirsiniz.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}