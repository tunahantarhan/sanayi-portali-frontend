// Backend hazır olana kadar arayüzü besleyen mock veriler.
// Şekiller Backend Rehberi'ndeki API sözleşmesiyle aynıdır.
// Tüm veriler uydurmadır; gerçek firma verisi kullanılmaz (repo herkese açık).

const pad = (n) => String(n).padStart(2, '0');

// Bugünden n gün sonrası/öncesi, "YYYY-MM-DD"
const day = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Şu andan n dakika önce, ISO 8601
const minutesAgo = (n) => new Date(Date.now() - n * 60000).toISOString();

// Bu aydan n ay önce, "YYYY-MM"
const month = (offset) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - offset);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

export const mockFirm = {
  unvan: 'Örnek Deri Sanayi ve Tic. A.Ş.',
  vergiNo: '1234567890',
};

export const mockDashboard = {
  tuketim: {
    buAy: {
      elektrik: { miktar: 12450, birim: 'kWh', abonelik: true },
      su: { miktar: null, birim: 'm³', abonelik: false }, // Su aboneliği olmayan firma senaryosu
      dogalgaz: { miktar: 980, birim: 'kWh', abonelik: true },
    },
    son12Ay: [
      11000, 11500, 10800, 10200, 12100, 13500, 14200, 14000, 12450, 11800, 11200, 12450,
    ].map((elektrik, i) => ({
      ay: month(11 - i),
      elektrik,
      su: null,
      dogalgaz: [1200, 1400, 1100, 800, 600, 400, 350, 380, 520, 760, 900, 980][i],
    })),
  },
  duyurular: [
    {
      id: 1,
      tur: 'kritik',
      baslik: 'Yaklaşan Fatura Son Ödeme Tarihi',
      ozet: 'Elektrik faturalarının son ödeme tarihi yaklaşmaktadır. Gecikme faizi uygulanmaması için ödemelerinizi vadesinde tamamlayınız.',
      icerik:
        'Bölgemiz genelinde enerji tedarik sürekliliğini korumak adına tüm abonelerimizin vadesi geçmiş elektrik faturalarını en geç ay sonuna kadar kapatmaları önemle rica olunur.',
      tarih: minutesAgo(60 * 20),
    },
    {
      id: 2,
      tur: 'bilgi',
      baslik: 'Tarife Güncellemesi',
      ozet: 'Yönetim kurulu kararıyla su birim fiyatlarında ve atık su bedellerinde güncelleme yapılmıştır.',
      icerik:
        'Yeni tarife ayrıntılarına ve arıtma tesisi deşarj parametre katsayılarına resmi web sitemizden veya Bölge Müdürlüğü ilan panosundan ulaşabilirsiniz.',
      tarih: minutesAgo(60 * 50),
    },
    {
      id: 3,
      tur: 'uyari',
      baslik: 'Planlı Trafo Bakımı',
      ozet: '3. Cadde trafo merkezindeki revizyon çalışması nedeniyle kısa süreli kesinti yaşanacaktır.',
      icerik:
        'Hafta sonu 09:00 - 13:00 saatleri arasında jeneratör devreye alma testleri yapılacaktır. Hassas üretim hatlarınız için gerekli önlemleri alınız.',
      tarih: minutesAgo(60 * 24 * 4),
    },
    {
      id: 4,
      tur: 'bilgi',
      baslik: 'Portal Yenilendi',
      ozet: 'Sanayici portalımız yeni arayüzüyle hizmetinizde.',
      icerik:
        'Faturalarınıza, başvurularınıza ve teminat bilgilerinize artık tek ekrandan ulaşabilirsiniz. Görüş ve önerilerinizi Bölge Müdürlüğü ile paylaşabilirsiniz.',
      tarih: minutesAgo(60 * 24 * 9),
    },
  ],
};

// Vadesi geçmiş borç, eksik teminat ve eksik DBS. Yoksa boş dizi gelir ve ekranda hiç görünmez.
export const mockAlerts = [
  {
    id: 'vgb-1',
    tur: 'vadesi_gecmis_borc',
    baslik: 'Vadesi geçmiş borç',
    aciklama: 'Ödenmemiş yönetim gideri faturanız bulunmaktadır.',
    tutar: 2150,
    sonTarih: day(-12),
    dosyalar: [{ id: 'vgb-1', ad: 'borc-bildirimi.pdf' }],
  },
  {
    id: 'et-1',
    tur: 'eksik_teminat',
    baslik: 'Eksik teminat',
    aciklama: 'Tüketim artışı nedeniyle elektrik teminatınızın tamamlanması gerekmektedir.',
    tutar: 150000,
    sonTarih: day(18),
    dosyalar: [{ id: 'et-1-1', ad: 'teminat-yazisi.pdf' }],
  },
];

export const mockInvoices = {
  odemeAktif: false,
  data: [
    { id: 'f1', tip: 'ELK', donem: month(1), tarih: day(-20), sonOdeme: day(10), tesisatNo: '1000001', tutar: 12450.0, durum: 'bekliyor' },
    { id: 'f2', tip: 'GAZ', donem: month(1), tarih: day(-20), sonOdeme: day(10), tesisatNo: '1000002', tutar: 980.0, durum: 'bekliyor' },
    { id: 'f3', tip: 'SUK', donem: month(1), tarih: day(-20), sonOdeme: day(10), tesisatNo: '1000003', tutar: 320.5, durum: 'bekliyor' },
    { id: 'f4', tip: 'ART', donem: month(1), tarih: day(-20), sonOdeme: day(10), tesisatNo: '1000003', tutar: 410.75, durum: 'bekliyor' },
    { id: 'f5', tip: 'YON', donem: month(1), tarih: day(-20), sonOdeme: day(15), tesisatNo: null, tutar: 2150.0, durum: 'bekliyor' },
    { id: 'f6', tip: 'COP', donem: month(1), tarih: day(-20), sonOdeme: day(15), tesisatNo: null, tutar: 640.0, durum: 'bekliyor' },
    { id: 'f7', tip: 'ELK', donem: month(2), tarih: day(-50), sonOdeme: day(-20), tesisatNo: '1000001', tutar: 11800.0, durum: 'odendi' },
    { id: 'f8', tip: 'SUK', donem: month(2), tarih: day(-50), sonOdeme: day(-20), tesisatNo: '1000003', tutar: 300.0, durum: 'odendi' },
    { id: 'f9', tip: 'YON', donem: month(2), tarih: day(-50), sonOdeme: day(-12), tesisatNo: null, tutar: 2150.0, durum: 'gecikmis' },
    { id: 'f10', tip: 'ELK', donem: month(3), tarih: day(-80), sonOdeme: day(-50), tesisatNo: '1000001', tutar: 14200.0, durum: 'odendi' },
  ],
};

// ERP `evrak-tipler` servisinden gelir. `sik: true` olanlar öne çıkarılır.
export const mockApplicationTypes = [
  { id: 1, ad: 'Kanal Bağlantı İzni', aciklama: 'Kanal bağlantı izni alma veya yenileme başvurusu.', sik: true },
  { id: 2, ad: 'Sayaç ve Okuma Hata Bildirimi', aciklama: 'Yanlış veya eksik okunduğunu düşündüğünüz sayaçlar için.', sik: true },
  { id: 3, ad: 'Altyapı ve Arıza Talebi', aciklama: 'Elektrik, su ve doğalgaz altyapısındaki arızalar.', sik: true },
  { id: 4, ad: 'Genel Dilekçe', aciklama: 'Diğer istek ve şikayetleriniz için standart dilekçe.', sik: true },
  { id: 5, ad: 'Abonelik Başvurusu', aciklama: 'Yeni elektrik, su veya doğalgaz aboneliği.', sik: false },
  { id: 6, ad: 'Abonelik İptali', aciklama: 'Mevcut aboneliğin sonlandırılması.', sik: false },
  { id: 7, ad: 'Yapı Ruhsatı', aciklama: 'Yeni yapı veya ek bina ruhsat başvurusu.', sik: false },
  { id: 8, ad: 'İskan Başvurusu', aciklama: 'Yapı kullanma izin belgesi başvurusu.', sik: false },
  { id: 9, ad: 'Tadilat İzni', aciklama: 'Mevcut yapıda değişiklik izni.', sik: false },
  { id: 10, ad: 'Bölgeye Araç Giriş İzni', aciklama: 'Lojistik araçların bölgeye giriş kayıtları.', sik: false },
  { id: 11, ad: 'Teminat İadesi', aciklama: 'Teminat mektubu veya nakit teminat iadesi.', sik: false },
  { id: 12, ad: 'Unvan Değişikliği', aciklama: 'Firma unvanı değişikliğinin bildirilmesi.', sik: false },
  { id: 13, ad: 'Kiracı Bildirimi', aciklama: 'Parselde faaliyet gösteren kiracının bildirilmesi.', sik: false },
  { id: 14, ad: 'Arıtma Numune Talebi', aciklama: 'Atık su numune alma talebi.', sik: false },
  { id: 15, ad: 'İşgaliye Başvurusu', aciklama: 'Ortak alan kullanım izni.', sik: false },
  { id: 16, ad: 'Fatura İtirazı', aciklama: 'Fatura tutarına itiraz.', sik: false },
];

export const mockApplications = [
  {
    id: 4512,
    evrakNo: '4512',
    evrakTipi: 'Sayaç ve Okuma Hata Bildirimi',
    konu: 'Elektrik sayacı okuma farkı',
    tarih: day(-11),
    durum: 'islemde',
    acan: 'firma',
    talepDosyalari: [
      { id: '4512-1', ad: 'dilekce.pdf' },
      { id: '4512-2', ad: 'sayac-fotografi.jpg' },
    ],
    cevapDosyalari: [],
  },
  {
    id: 4470,
    evrakNo: '4470',
    evrakTipi: 'Kanal Bağlantı İzni',
    konu: 'Kanal bağlantı izni yenileme',
    tarih: day(-17),
    durum: 'kapali',
    acan: 'firma',
    talepDosyalari: [{ id: '4470-1', ad: 'basvuru.pdf' }],
    cevapDosyalari: [{ id: '4470-9', ad: 'izin-belgesi.pdf' }],
  },
  {
    id: 4391,
    evrakNo: '4391',
    evrakTipi: 'Eksik Evrak Bildirimi',
    konu: 'Güncel imza sirküleri talebi',
    tarih: day(-30),
    durum: 'islemde',
    acan: 'osb',
    talepDosyalari: [{ id: '4391-1', ad: 'osb-yazisi.pdf' }],
    cevapDosyalari: [],
  },
  {
    id: 4202,
    evrakNo: '4202',
    evrakTipi: 'Genel Dilekçe',
    konu: 'Otopark düzenlemesi talebi',
    tarih: day(-53),
    durum: 'kapali',
    acan: 'firma',
    talepDosyalari: [{ id: '4202-1', ad: 'dilekce.pdf' }],
    cevapDosyalari: [{ id: '4202-9', ad: 'cevap-yazisi.pdf' }],
  },
];

// Yalnızca onaylanan kavaleto kayıtları gelir.
export const mockKavaleto = [
  { id: 41, sevkNo: 'KVT-0041', sevkTarihi: day(-13), miktarTon: 14.25, aracPlaka: '34 XX 0001', dosyaId: 'k41' },
  { id: 38, sevkNo: 'KVT-0038', sevkTarihi: day(-20), miktarTon: 22.8, aracPlaka: '34 XX 0002', dosyaId: 'k38' },
  { id: 31, sevkNo: 'KVT-0031', sevkTarihi: day(-31), miktarTon: 18.1, aracPlaka: '34 XX 0003', dosyaId: 'k31' },
  { id: 27, sevkNo: 'KVT-0027', sevkTarihi: day(-37), miktarTon: 9.6, aracPlaka: '34 XX 0004', dosyaId: null },
];

export const mockFirmProfile = {
  unvan: mockFirm.unvan,
  vergiNo: mockFirm.vergiNo,
  vergiDairesi: 'Örnek V.D.',
  aboneNo: 'ABN-000123',
  smsTebligat: { aktif: true, telefon: '+90 5** *** ** 12' },
  teminatlar: [
    {
      id: 1,
      tur: 'teminat_mektubu',
      banka: 'Örnek Bankası',
      belgeNo: 'TM-000001',
      tutar: 1500000,
      bitisTarihi: day(5),
    },
    {
      id: 2,
      tur: 'dbs',
      banka: 'Deneme Bankası',
      belgeNo: null,
      tutar: 750000,
      bitisTarihi: null,
    },
  ],
  kanalIzni: {
    belgeNo: 'KB-0091',
    baslangicTarihi: day(-718),
    bitisTarihi: day(12),
  },
};

export const mockNotifications = [
  {
    id: 1,
    tur: 'uyari',
    baslik: 'Teminat Süresi',
    aciklama: 'Teminat mektubunuzun bitimine 5 gün kaldı.',
    zaman: minutesAgo(10),
    okundu: false,
  },
  {
    id: 2,
    tur: 'fatura',
    baslik: 'Yeni Fatura',
    aciklama: 'Elektrik faturanız sisteme yansıdı.',
    zaman: minutesAgo(120),
    okundu: false,
  },
  {
    id: 3,
    tur: 'bilgi',
    baslik: 'Başvuru Güncellendi',
    aciklama: '4470 numaralı başvurunuz sonuçlandı.',
    zaman: minutesAgo(60 * 26),
    okundu: true,
  },
];

// OSB'nin firmaya gönderdiği KEP yazıları
export const mockKep = [
  {
    id: 301,
    konu: 'Teminat tamamlama hakkında',
    gonderen: 'Bölge Müdürlüğü',
    tarih: minutesAgo(60 * 24 * 3),
    ozet: 'Elektrik tüketim artışı nedeniyle teminat tutarınızın güncellenmesi gerekmektedir.',
    ekler: [{ id: '301-1', ad: 'yazi.pdf' }],
  },
  {
    id: 287,
    konu: 'Planlı bakım çalışması',
    gonderen: 'Teknik İşler Müdürlüğü',
    tarih: minutesAgo(60 * 24 * 12),
    ozet: 'Arıtma tesisinde yapılacak planlı bakım çalışmasına ilişkin bilgilendirme.',
    ekler: [],
  },
];

// Firmaya gönderilen SMS ve e-postalar (gönderim kaydı)
export const mockMessages = [
  {
    id: 9001,
    kanal: 'sms',
    hedef: '+90 5** *** ** 12',
    konu: null,
    icerik: 'Sayın üyemiz, elektrik faturanız düzenlenmiştir. Son ödeme tarihi ay sonudur.',
    tarih: minutesAgo(60 * 2),
    durum: 'iletildi',
  },
  {
    id: 9000,
    kanal: 'eposta',
    hedef: 'f***@ornek.com.tr',
    konu: 'Teminat tamamlama hakkında',
    icerik: 'Elektrik tüketim artışı nedeniyle teminat tutarınızın güncellenmesi gerekmektedir. Ayrıntılar KEP ile iletilmiştir.',
    tarih: minutesAgo(60 * 24 * 3),
    durum: 'iletildi',
  },
  {
    id: 8990,
    kanal: 'sms',
    hedef: '+90 5** *** ** 12',
    konu: null,
    icerik: 'Planlı trafo bakımı nedeniyle hafta sonu kısa süreli kesinti yaşanacaktır.',
    tarih: minutesAgo(60 * 24 * 4),
    durum: 'basarisiz',
  },
];
