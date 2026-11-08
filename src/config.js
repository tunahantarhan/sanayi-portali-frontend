// Kurum (tenant) yapılandırması.
// Müşteriye göre değişen her şey burada durur; bileşenlere müşteri özel değer yazılmaz.
// Yeni bir OSB için bu dosya ve logo değiştirilerek aynı uygulama kullanılır.

import firmaLogo from './assets/firma-logo.png';

export const tenantConfig = {
  name: 'İDOSB',
  fullName: 'İstanbul Deri Organize Sanayi Bölgesi',
  logo: firmaLogo,

  // Ana tema rengi. Tailwind'deki `brand` rengi bu değerden CSS değişkeni olarak üretilir
  // (bkz. src/theme.js), ayrıca elle eşitlemeye gerek yoktur.
  colors: {
    primary: '#83472F',
    primaryLight: '#A06148',
    primaryDark: '#663521',
  },

  // OSB iletişim bilgileri (Firmam ekranı ve "Şifremi unuttum" bilgisi)
  contact: {
    adres: 'Aydınlı Mah. Deri OSB Yan Yol Cad. No:1 Tuzla / İSTANBUL',
    telefon: '(0216) 394 14 80',
    eposta: 'info@ideriosb.org.tr',
    kep: 'ideriosb@hs01.kep.tr',
  },

  // Özellik anahtarları
  features: {
    // Sanal POS anlaşması gelene kadar kapalı. Açılınca faturalarda seçim ve toplu ödeme görünür.
    // Backend `odemeAktif` gönderirse o değer önceliklidir.
    payment: false,
  },

  // Uyarı eşikleri (gün). Bitişine bu kadar gün kalan teminat ve izinler uyarı olarak gösterilir.
  warningThresholdDays: {
    teminat: 30,
    kanalIzni: 30,
  },

  // Doğrulama kodu süresi (sn). Backend `gecerlilikSn` gönderirse o değer önceliklidir.
  otpDurationSec: 120,

  // Yan menü. `to` iç sayfa, `href` dış bağlantıdır. `icon` değerleri Layout.jsx'teki ikon listesindedir.
  menu: [
    { to: '/panel', label: 'Ana Sayfa', icon: 'home', end: true },
    { to: '/panel/faturalar', label: 'Faturalar', icon: 'invoice' },
    { to: '/panel/kavaleto', label: 'Kavaleto İşlemleri', icon: 'truck' },
    { to: '/panel/basvurular', label: 'OSB Başvuru', icon: 'send' },
    { to: '/panel/bilgilendirmeler', label: 'Bilgilendirmeler', icon: 'mail' },
    { to: '/panel/firmam', label: 'Firmam', icon: 'building' },
    { href: 'https://ideriosb.org.tr', label: 'Aranan Eleman', icon: 'briefcase' },
  ],

  // Fatura grupları (sekmeler). `tipler`, Logo dosya adındaki fatura tipi kodlarıdır.
  // KAV (kavaleto) faturaları Kavaleto sayfasında gösterildiği için burada yer almaz.
  invoiceGroups: [
    { key: 'elektrik_dogalgaz', label: 'Elektrik & Doğalgaz', tipler: ['ELK', 'GAZ'] },
    { key: 'su_diger', label: 'Su ve Diğer Giderler', tipler: ['SUK', 'ART'] },
    { key: 'ilave', label: 'İlave Faturalar', tipler: ['YON', 'COP'] },
  ],

  invoiceTypeLabels: {
    ELK: 'Elektrik',
    GAZ: 'Doğalgaz',
    SUK: 'Su',
    ART: 'Atık Su',
    YON: 'Yönetim Gideri',
    COP: 'Çöp',
    KAV: 'Kavaleto',
  },

  // Başvuru ekranında öne çıkarılacak tür sayısı (kalanlar accordion içinde)
  popularApplicationTypeCount: 4,

  // Alt bilgi bağlantıları
  footerLinks: [
    { label: 'KVKK Aydınlatma Metni', href: null },
    { label: 'Gizlilik Politikası', href: null },
  ],
};
