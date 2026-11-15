// Yalnızca yerel geliştirme (npm run dev) için ERP ara katmanı. Build'e ve tarayıcıya girmez.
//
// Amaç: Backend hazır olmadan mevcut ERP servislerini gerçek veriyle denemek ve
// yanıtları API sözleşmesine çevirmek. Buradaki eşlemeler, backend'i yazacak kişi için örnektir.
//
// Güvenlik:
// - Anahtar ve ERP adresi yalnızca .env.development.local içinde durur (VITE_ öneki yok, git dışı).
// - Firma, istekten değil ortam değişkeninden alınır (gerçek backend'de oturumdan alınacak).
// - Yalnızca GET ve yalnızca aşağıdaki listedeki uçlar; SMS/e-posta gibi işlem yapan servisler çağrılamaz.
// - Yalnızca aynı bilgisayardan gelen isteklere yanıt verir (vite --host ile açılsa bile).

const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

// Ham ERP yanıtını görmek için: http://localhost:5173/__erp/<ad>
const rawRoutes = (env) => ({
  'evrak-tipler': () => '/api/v1/evrak-tipler',
  detay: () =>
    env.ERP_DEV_VERGI_NO && `/api/v1/sanayici-panel/sanayici/${env.ERP_DEV_VERGI_NO}/detay`,
  'eksik-teminat': () => env.ERP_DEV_FIRMA_ID && `/api/v1/eksik-teminat/${env.ERP_DEV_FIRMA_ID}`,
  isgaliye: () => env.ERP_DEV_FIRMA_ID && `/api/v1/isgaliye/${env.ERP_DEV_FIRMA_ID}`,
});

// Sözleşme uçları: ERP yanıtını frontend'in beklediği şekle çevirir.
// erpPath null dönerse gerekli ortam değişkeni eksiktir.
const contractRoutes = (env) => ({
  // GET /api/applications/types -> { data: [{ id, ad, aciklama, sik }] }
  '/api/applications/types': {
    erpPath: () => '/api/v1/evrak-tipler',
    map: (erp) => ({
      // ERP sık kullanılanları işaretlemiyor; sik=false iken ekran ilk N türü öne çıkarır.
      data: (erp.data || []).map((t) => ({
        id: t.id,
        ad: t.isim,
        aciklama: t.aciklama || '',
        sik: false,
      })),
    }),
  },

  // GET /api/firm/profile
  // ERP detay servisi bir vergi no için birden fazla kayıt (farklı unvan/adres/parsel) dönebiliyor;
  // her biri "yerler" altında listelenir. Teminat ve kanal izni bu serviste yok, alan gönderilmez.
  // Gerçek backend'de vergi no oturumdan alınır.
  '/api/firm/profile': {
    erpPath: () =>
      env.ERP_DEV_VERGI_NO && `/api/v1/sanayici-panel/sanayici/${env.ERP_DEV_VERGI_NO}/detay`,
    map: (erp) => {
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
        vergiNo: env.ERP_DEV_VERGI_NO,
        nace: ilk.nace_kodu ? { kod: ilk.nace_kodu.kodu, aciklama: ilk.nace_kodu.aciklama } : null,
        yetkili,
        yerler: kayitlar.map((k) => ({
          unvan: k.isim,
          adres: k.adres || null,
          parseller: (k.parseller || []).map((p) => p.isim),
          tesisatlar: (k.tesisatlar || []).map((t) => t.isim),
        })),
      };
    },
  },
});

const sendJson = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body, null, 2));
};

const sendError = (res, status, code, message) =>
  sendJson(res, status, { error: { code, message } });

async function callErp(env, path) {
  const response = await fetch(new URL(path, env.ERP_DEV_URL), {
    headers: { Authorization: `Colab-Api-Key ${env.ERP_DEV_KEY}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  });
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { yanitMetni: text.slice(0, 2000) };
  }
  return { status: response.status, body };
}

export function erpDevProxy(env) {
  return {
    name: 'erp-dev-proxy',
    apply: 'serve',
    configureServer(server) {
      if (!env.ERP_DEV_URL || !env.ERP_DEV_KEY) return;

      const raw = rawRoutes(env);
      const contracts = contractRoutes(env);
      server.config.logger.info(`  ERP dev ara katmanı açık. Ham yanıtlar: /__erp/`);

      server.middlewares.use(async (req, res, next) => {
        // /__erp hem kökte hem de uygulamanın base path'i altında açılabilir.
        const base = server.config.base.replace(/\/$/, '');
        let pathname = (req.url || '').split('?')[0];
        if (base && pathname.startsWith(`${base}/__erp`)) pathname = pathname.slice(base.length);
        const isRaw = pathname === '/__erp' || pathname.startsWith('/__erp/');
        const contract = contracts[pathname];
        if (!isRaw && !contract) return next();

        if (!LOOPBACK.has(req.socket.remoteAddress)) {
          return sendError(res, 403, 'FORBIDDEN', 'Yalnızca yerel erişime açıktır.');
        }
        if (req.method !== 'GET') {
          return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Yalnızca GET desteklenir.');
        }

        let erpPath;
        if (isRaw) {
          const name = pathname.replace(/^\/__erp\/?/, '');
          if (!name)
            return sendJson(res, 200, { uclar: Object.keys(raw).map((n) => `/__erp/${n}`) });
          const build = raw[name];
          if (!build) return sendError(res, 404, 'NOT_FOUND', 'Bilinmeyen uç.');
          erpPath = build();
          if (!erpPath) {
            return sendError(
              res,
              400,
              'MISSING_ENV',
              'ERP_DEV_VERGI_NO veya ERP_DEV_FIRMA_ID tanımlı değil.'
            );
          }
        } else {
          erpPath = contract.erpPath();
          if (!erpPath)
            return sendError(res, 400, 'MISSING_ENV', 'ERP_DEV_VERGI_NO tanımlı değil.');
        }

        try {
          const { status, body } = await callErp(env, erpPath);
          if (isRaw) return sendJson(res, status, body);
          if (status >= 400) {
            return sendError(res, 502, 'ERP_ERROR', `ERP ${status} döndü.`);
          }
          return sendJson(res, 200, contract.map(body));
        } catch (err) {
          // Gerçek nedeni terminale yaz (ör. ETIMEDOUT, ENOTFOUND, ECONNREFUSED).
          const reason =
            err.name === 'TimeoutError' ? 'zaman aşımı' : err.cause?.code || err.message;
          server.config.logger.warn(`[erp] ${erpPath} başarısız: ${reason}`, { timestamp: true });
          const message =
            err.name === 'TimeoutError'
              ? 'ERP zaman aşımına uğradı. Ayrıntı terminalde.'
              : "ERP'ye ulaşılamadı. Ayrıntı terminalde.";
          return sendError(res, 502, 'ERP_UNREACHABLE', message);
        }
      });
    },
  };
}
