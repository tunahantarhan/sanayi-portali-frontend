// ERP yanıtlarını portalin API sözleşmesine çeviren saf fonksiyonlar.
//
// Şu an yalnızca yerel ERP ara katmanı (dev-tools/erpDevProxy.js) kullanıyor. ERP ileride
// giriş token'ını kabul eder ve frontend servisleri doğrudan çağırırsa api.js de bunları kullanır;
// böylece sayfalar ve sözleşme değişmez. Bu dosyada anahtar, adres veya gizli bilgi bulunmaz.

export const num = (v) => (v == null || v === '' || Number.isNaN(Number(v)) ? null : Number(v));

// "FATURALANDI" -> "faturalandi": durumlar sözleşmede küçük harf ASCII anahtardır.
export const statusKey = (text) =>
  (text || '')
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/\s+/g, '_');

const titleTr = (text) =>
  (text || '').toLocaleLowerCase('tr').replace(/^\p{L}/u, (c) => c.toLocaleUpperCase('tr'));

// ---- Uyarı dosyaları ----
// Dosya kimliği "<kaynak>-<kayıtId>-<index|slot>" biçimindedir, ör. isg-507-0, et-22-0.
// Kaynaklar: isg (işgaliye), et (eksik teminat), borc (vadesi geçmiş borç), dbs (eksik DBS).

export const ALERT_FILE_KEYS = { isg: 'index', et: 'slot', borc: 'slot', dbs: 'slot' };

export const alertFileIdPattern = /^(isg|et|borc|dbs)-(\d+)-(\d+)$/;

const toFiles = (source, kayit) =>
  (kayit.dosyalar || [])
    .filter((d) => !d.bulunamadi)
    .map((d) => ({ id: `${source}-${kayit.id}-${d[ALERT_FILE_KEYS[source]]}`, ad: d.adi }));

// ---- Başvuru türleri ----

// ERP: { data: [{ id, isim, aciklama }] } -> { data: [{ id, ad, aciklama, sik }] }
// ERP sık kullanılanları işaretlemiyor; sik=false iken ekran ilk N türü öne çıkarır.
export const mapApplicationTypes = (erp) => ({
  data: (erp.data || []).map((t) => ({
    id: t.id,
    ad: t.isim,
    aciklama: t.aciklama || '',
    sik: false,
  })),
});

// ---- Firma profili ----

// ERP detay servisi bir vergi no için birden fazla kayıt dönebiliyor; her biri "yerler" altında.
// Teminat ve kanal izni bu serviste yok, alan gönderilmez (ekran ilgili kartları gizler).
export const mapFirmProfile = (erp, vergiNo) => {
  const kayitlar = erp.data || [];
  const ilk = kayitlar[0] || {};
  const yetkili =
    ilk.k_isimsoyisim || ilk.k_tel || ilk.k_email
      ? {
          adSoyad: ilk.k_isimsoyisim || null,
          telefon: ilk.k_tel || null,
          eposta: ilk.k_email || null,
        }
      : null;
  return {
    unvan: ilk.isim || '',
    vergiNo,
    nace: ilk.nace_kodu ? { kod: ilk.nace_kodu.kodu, aciklama: ilk.nace_kodu.aciklama } : null,
    yetkili,
    yerler: kayitlar.map((k) => ({
      unvan: k.isim,
      adres: k.adres || null,
      parseller: (k.parseller || []).map((p) => p.isim),
      tesisatlar: (k.tesisatlar || []).map((t) => t.isim),
    })),
  };
};

// ---- İşgaliye ----
// Firmanın tüm kayıtları (faturalanan/onaylanan) Firmam'da liste olarak gösterilir.

export const mapIsgaliye = (k) => ({
  id: k.id,
  durum: statusKey(k.durum_text),
  durumText: titleTr(k.durum_text),
  tur: k.turu_text || null,
  parsel: k.parsel_adi || null,
  miktar: num(k.miktar),
  birim: k.birim || null,
  baslangic: k.baslangic_t || null,
  bitis: k.bitis_t || null,
  gun: num(k.gun),
  tutar: num(k.fatura_tutar),
  faturaNo: k.fatura_no || null,
  faturaTarihi: k.fatura_t || null,
  aciklama: k.aciklama || '',
  dosyalar: (k.dosyalar || [])
    .filter((d) => !d.bulunamadi)
    .map((d) => ({ id: String(d.index), ad: d.adi, boyut: num(d.boyut) })),
});

// ---- Uyarılar ----

const yaziSayisi = (k) => (k.evrak_sayi ? ` Yazı sayısı: ${k.evrak_sayi}.` : '');

// Üç uyarı kaynağında ortak alanlar: kayıt (yazı) tarihi, cari hesap, parsel ve yazı sayısı.
// Hesap Durumu tablolarında gösterilir; ana sayfadaki uyarı kartı yalnızca tutar ve dosyayı kullanır.
const alertCommon = (k) => ({
  tarih: k.tarih || null,
  cariKod: k.cari_no || k.veri?.CARIKOD || null,
  parsel: k.veri?.PARSEL || null,
  yaziSayisi: k.evrak_sayi || null,
});

// Eksik teminat: ERP eksik tutarı hazır veriyor (teminat_eksik); yoksa istenen - mevcut.
export const mapEksikTeminat = (k) => {
  const talep = num(k.teminat_talep);
  const mevcut = num(k.teminat);
  const eksik = num(k.teminat_eksik) ?? (talep != null && mevcut != null ? talep - mevcut : null);
  return {
    id: `et-${k.id}`,
    tur: 'eksik_teminat',
    baslik: 'Eksik teminat',
    aciklama: `Teminatınızın tamamlanması gerekmektedir.${yaziSayisi(k)}`,
    tutar: eksik != null ? Math.max(eksik, 0) : null,
    sonTarih: null,
    ...alertCommon(k),
    istenen: talep,
    mevcut,
    dosyalar: toFiles('et', k),
  };
};

// Vadesi geçmiş borç: tutar ERP'nin vadesi geçmiş bakiyesi (bakiye = finans.vadesi_gecmis).
export const mapGecmisBorc = (k) => ({
  id: `borc-${k.id}`,
  tur: 'vadesi_gecmis_borc',
  baslik: 'Vadesi geçmiş borç',
  aciklama: `Vadesi geçmiş ödenmemiş borcunuz bulunmaktadır.${yaziSayisi(k)}`,
  tutar: num(k.bakiye) ?? num(k.finans?.vadesi_gecmis),
  sonTarih: null,
  ...alertCommon(k),
  bakiye: num(k.finans?.bakiye),
  vadesiGelmemis: num(k.finans?.vadesi_gelmemis),
  dosyalar: toFiles('borc', k),
});

// Eksik DBS: tutar, yazıdaki "Eksik Kalan (istenen) Teminat Tutarı" ile aynı olan yuvarlanmış
// dbs.eksik_kalan_erp (31 Ekim görselinde 116.000 TL). Yoksa yuvarlanmamış değerler kullanılır.
export const mapEksikDbs = (k) => ({
  id: `dbs-${k.id}`,
  tur: 'eksik_dbs',
  baslik: 'Eksik DBS',
  aciklama: `DBS teminatınızın tamamlanması gerekmektedir.${yaziSayisi(k)}`,
  tutar: num(k.dbs?.eksik_kalan_erp) ?? num(k.dbs?.eksik_kalan) ?? num(k.teminat_eksik_kolon),
  sonTarih: null,
  ...alertCommon(k),
  dbsLimiti: num(k.dbs?.dbs_limit),
  dosyalar: toFiles('dbs', k),
});

// Üç uyarı kaynağının ERP listelerinden sözleşmedeki { data: [...] } yanıtı.
export const mapAlerts = ({ borc = [], et = [], dbs = [] }) => ({
  data: [...borc.map(mapGecmisBorc), ...et.map(mapEksikTeminat), ...dbs.map(mapEksikDbs)],
});
