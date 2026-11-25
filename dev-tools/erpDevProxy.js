// Yalnızca yerel geliştirme (npm run dev) için ERP ara katmanı. Build'e ve tarayıcıya girmez.
//
// Amaç: Backend hazır olmadan ERP servislerini portal ekranlarıyla denemek ve yanıtları
// API sözleşmesine çevirmek. Buradaki eşlemeler ve oturum akışı, backend'i yazacak kişi için örnektir.
//
// Güvenlik:
// - Anahtar ve ERP adresi yalnızca .env.development.local içinde durur (VITE_ öneki yok, git dışı).
// - ERP token'ı tarayıcıya verilmez; ara katmanın belleğinde durur, tarayıcıya yalnızca HttpOnly cookie gider.
// - Firma, istekten değil oturumdan alınır (oturum yoksa ve giriş canlı değilse .env'deki deneme firmasından).
// - Yalnızca aşağıda tanımlı uçlar çağrılabilir (dosyalar dahil); SMS/e-posta gönderen servisler çağrılamaz.
// - Yalnızca aynı bilgisayardan gelen isteklere yanıt verir (vite --host ile açılsa bile).

import { Buffer } from 'node:buffer';
import { randomUUID } from 'node:crypto';
import {
  ALERT_FILE_KEYS,
  alertFileIdPattern,
  mapAlerts,
  mapApplicationTypes,
  mapFirmProfile,
  mapIsgaliye,
} from '../src/services/erpMappers.js';

const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
const COOKIE = 'portal_dev_sid';

// Yeniden kod isteme beklemesi kademeli: 1 dk, 3 dk, 5 dk (Ahmet Bey, 16 Kasım).
// Arayüzdeki geri sayım ve kodun geçerliliği de bu süreyi izler.
const OTP_STEPS_SEC = [60, 180, 300];
const otpWaitSec = (sendCount) => OTP_STEPS_SEC[Math.min(sendCount - 1, OTP_STEPS_SEC.length - 1)];
const PENDING_TTL_MS = 15 * 60 * 1000;

// sid -> { vergiNo, password?, sendCount, codeSentAt, token?, firmaId?, firmaIds?, isim?, expiresAt? }
// Not: Şifre yalnızca "kodu tekrar gönder" için, doğrulamaya kadar bellekte tutulur (yalnızca dev).
const sessions = new Map();

// ---- Yardımcılar ----

const sendJson = (res, status, body, headers = {}) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(body === undefined ? '' : JSON.stringify(body, null, 2));
};

const sendError = (res, status, code, message, headers) =>
  sendJson(res, status, { error: { code, message } }, headers);

const readCookie = (req, name) =>
  (req.headers.cookie || '')
    .split(';')
    .map((c) => c.trim().split('='))
    .find(([k]) => k === name)?.[1];

const setCookie = (sid, maxAgeSec) =>
  `${COOKIE}=${sid}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAgeSec}`;

const readBody = (req) =>
  new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e5) req.destroy();
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
  });

// ---- ERP çağrısı ----

// ctx.authHeader verilmişse (ör. "Bearer <token>") anahtar yerine o gönderilir; null ise hiç gönderilmez.
const authHeaderOf = (ctx) =>
  ctx.authHeader === undefined ? `Colab-Api-Key ${ctx.env.ERP_DEV_KEY}` : ctx.authHeader;

async function callErp(ctx, path, { method = 'GET', body } = {}) {
  const { env } = ctx;
  const auth = authHeaderOf(ctx);
  const response = await fetch(new URL(path, env.ERP_DEV_URL), {
    method,
    headers: {
      ...(auth ? { Authorization: auth } : {}),
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const text = await response.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { yanitMetni: text.slice(0, 2000) };
  }
  return { status: response.status, body: parsed };
}

// ERP'den dosya (PDF, görsel) alıp tarayıcıya aynen aktarır.
async function pipeErpFile(ctx, path, res) {
  const response = await fetch(new URL(path, ctx.env.ERP_DEV_URL), {
    headers: authHeaderOf(ctx) ? { Authorization: authHeaderOf(ctx) } : {},
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) {
    ctx.log(`${path} -> ERP ${response.status}`);
    return sendError(res, 502, 'ERP_ERROR', `ERP ${response.status} döndü.`);
  }
  res.statusCode = 200;
  for (const h of ['content-type', 'content-disposition', 'content-length']) {
    const v = response.headers.get(h);
    if (v) res.setHeader(h, v);
  }
  res.setHeader('Cache-Control', 'no-store');
  res.end(Buffer.from(await response.arrayBuffer()));
}

class ErpStatusError extends Error {
  constructor(path, status) {
    super(`${path} -> ERP ${status}`);
    this.status = status;
  }
}

// JSON döndüren ERP ucu; 4xx/5xx'te hata fırlatır.
async function getErpJson(ctx, path) {
  const { status, body } = await callErp(ctx, path);
  if (status >= 400) throw new ErpStatusError(path, status);
  return body;
}

// ---- Uyarılar ve işgaliye ----
// ERP yanıtlarının sözleşmeye çevrilmesi src/services/erpMappers.js içindedir.

const ALERT_SOURCES = {
  isg: {
    list: (firmaId) => `/api/v1/isgaliye/${firmaId}`,
    file: (id, n) => `/api/v1/isgaliye-dosya/${id}/${n}`,
  },
  et: {
    list: (firmaId) => `/api/v1/eksik-teminat/${firmaId}`,
    file: (id, n) => `/api/v1/eksik-teminat-dosya/${id}/${n}`,
  },
  // Geçmiş borçta tek dosya var, dosya yalnızca kayıt id'siyle alınır (Saed Bey, 31 Ekim).
  borc: {
    list: (firmaId) => `/api/v1/gecmis-borc/${firmaId}`,
    file: (id) => `/api/v1/gecmis-borc-dosya/${id}`,
  },
  dbs: {
    list: (firmaId) => `/api/v1/eksik-dbs/${firmaId}`,
    file: (id, n) => `/api/v1/eksik-dbs-dosya/${id}/${n}`,
  },
};

async function loadIsgaliye(ctx, firm) {
  const id = firmaIdFor(ctx, firm, 'isg');
  const list = id ? (await getErpJson(ctx, ALERT_SOURCES.isg.list(id))).data || [] : [];
  return { data: list.map(mapIsgaliye) };
}

// Yalnızca deneme için: ERP_DEV_TEST_FIRMA="isg=1078,et=2900" ile her kaynak ayrı bir test
// firmasından okunabilir (Saed Bey'in verdiği test id'leri). Tanımlı değilse oturumdaki firma kullanılır.
const parseTestFirms = (value) =>
  Object.fromEntries(
    (value || '')
      .split(',')
      .map((pair) => pair.split('=').map((x) => x.trim()))
      .filter(([k, v]) => ALERT_SOURCES[k] && /^\d+$/.test(v || ''))
  );

const firmaIdFor = (ctx, firm, source) => ctx.testFirms[source] || firm?.firmaId || null;

const hasAlertFirm = (ctx, firm) => Boolean(firm?.firmaId || Object.keys(ctx.testFirms).length);

async function loadAlerts(ctx, firm) {
  const listOf = async (source) => {
    const id = firmaIdFor(ctx, firm, source);
    return id ? (await getErpJson(ctx, ALERT_SOURCES[source].list(id))).data || [] : [];
  };
  const [borc, et, dbs] = await Promise.all([listOf('borc'), listOf('et'), listOf('dbs')]);
  return mapAlerts({ borc, et, dbs });
}

// Dosya, yalnızca oturumdaki firmanın kaydına aitse indirilir (gerçek backend'de de böyle olmalı).
async function sendAlertFile(ctx, firm, fileId, res) {
  const m = alertFileIdPattern.exec(fileId);
  if (!m) return sendError(res, 404, 'NOT_FOUND', 'Dosya bulunamadı.');
  const [, source, kayitId, n] = m;
  const src = ALERT_SOURCES[source];
  const firmaId = firmaIdFor(ctx, firm, source);
  if (!firmaId) return sendError(res, 404, 'NOT_FOUND', 'Dosya bulunamadı.');
  const list = await getErpJson(ctx, src.list(firmaId));
  const kayit = (list.data || []).find((k) => String(k.id) === kayitId);
  const exists = kayit?.dosyalar?.some(
    (d) => String(d[ALERT_FILE_KEYS[source]]) === n && !d.bulunamadi
  );
  if (!exists) return sendError(res, 404, 'NOT_FOUND', 'Dosya bulunamadı.');
  return pipeErpFile(ctx, src.file(kayitId, n), res);
}

// ---- Oturum ----

const getSession = (req) => {
  const sid = readCookie(req, COOKIE);
  const session = sid && sessions.get(sid);
  if (!session) return null;
  if (session.expiresAt && Date.now() > session.expiresAt) {
    sessions.delete(sid);
    return null;
  }
  return { sid, ...session };
};

// Veri uçlarının hangi firma için çağrılacağı. Giriş canlıysa yalnızca oturumdan;
// değilse (giriş mock) .env'deki deneme firması kullanılır.
const resolveFirm = (ctx, req) => {
  const session = getSession(req);
  if (session?.token) return { vergiNo: session.vergiNo, firmaId: session.firmaId };
  if (ctx.authLive) return null;
  return { vergiNo: ctx.env.ERP_DEV_VERGI_NO, firmaId: ctx.env.ERP_DEV_FIRMA_ID };
};

const firmPayload = (s) => ({ unvan: s.isim, vergiNo: s.vergiNo });

// ---- Giriş uçları (/api/auth/*) ----

async function requestCode(ctx, vergiNo, password) {
  const { status, body } = await callErp(ctx, '/api/v1/portal-auth/request-code', {
    method: 'POST',
    body: { vergi_no: vergiNo, password },
  });
  const ok = status >= 200 && status < 300;
  // Teşhis için ERP'nin durum kodu ve mesajı terminale yazılır (şifre yazılmaz).
  if (!ok) {
    const detail = body?.message || body?.error?.message || body?.data?.message || body?.yanitMetni;
    ctx.log(`request-code -> ERP ${status}${detail ? `: ${String(detail).slice(0, 300)}` : ''}`);
  }
  return ok;
}

const noPending = (res) =>
  sendError(res, 401, 'NO_PENDING_LOGIN', 'Oturum süresi doldu, lütfen tekrar giriş yapınız.');

const authRoutes = {
  // { vergiNo, sifre } -> { kanal, hedef, gecerlilikSn }
  async 'POST /api/auth/login'(ctx, req, res) {
    const { vergiNo, sifre } = await readBody(req);
    if (!/^\d{10,11}$/.test(vergiNo || '') || !sifre) {
      return sendError(res, 401, 'INVALID_CREDENTIALS', 'Vergi numarası veya şifre hatalı.');
    }
    if (!(await requestCode(ctx, vergiNo, sifre))) {
      return sendError(res, 502, 'ERP_ERROR', 'Kod gönderilemedi. Lütfen tekrar deneyiniz.');
    }
    const sid = randomUUID();
    sessions.set(sid, { vergiNo, password: sifre, sendCount: 1, codeSentAt: Date.now() });
    setTimeout(() => {
      if (!sessions.get(sid)?.token) sessions.delete(sid);
    }, PENDING_TTL_MS).unref();
    // ERP kodun nereye gittiğini söylemiyor (hesap var/yok sızdırmamak için); hedef boş kalır.
    return sendJson(
      res,
      200,
      { kanal: null, hedef: null, gecerlilikSn: otpWaitSec(1) },
      { 'Set-Cookie': setCookie(sid, PENDING_TTL_MS / 1000) }
    );
  },

  // -> { kanal, hedef, gecerlilikSn } | 429 süre dolmadıysa
  async 'POST /api/auth/resend'(ctx, req, res) {
    const s = getSession(req);
    if (!s || s.token || !s.password) return noPending(res);
    if (Date.now() - s.codeSentAt < otpWaitSec(s.sendCount) * 1000) {
      return sendError(res, 429, 'OTP_TOO_EARLY', 'Yeni kod için süre dolmadı.');
    }
    if (!(await requestCode(ctx, s.vergiNo, s.password))) {
      return sendError(res, 502, 'ERP_ERROR', 'Kod gönderilemedi. Lütfen tekrar deneyiniz.');
    }
    const sendCount = s.sendCount + 1;
    sessions.set(s.sid, { ...sessions.get(s.sid), sendCount, codeSentAt: Date.now() });
    return sendJson(res, 200, { kanal: null, hedef: null, gecerlilikSn: otpWaitSec(sendCount) });
  },

  // { kod } -> { firma }
  async 'POST /api/auth/verify'(ctx, req, res) {
    const { kod } = await readBody(req);
    const s = getSession(req);
    if (!s || s.token) return noPending(res);
    if (Date.now() - s.codeSentAt > otpWaitSec(s.sendCount) * 1000) {
      return sendError(res, 401, 'OTP_EXPIRED', 'Kodun süresi doldu. Lütfen yeni kod isteyiniz.');
    }
    const { status, body } = await callErp(ctx, '/api/v1/portal-auth/verify-code', {
      method: 'POST',
      body: { vergi_no: s.vergiNo, code: String(kod || '') },
    });
    const data = body?.data;
    if (status < 200 || status >= 300 || !data?.token) {
      return sendError(res, 401, 'OTP_INVALID', 'Doğrulama kodu hatalı.');
    }
    // Ahmet Bey: her firmanın tek id'si var. Birden fazla gelirse ilki kullanılır.
    const expiresIn = data.expires_in || 3600;
    const session = {
      vergiNo: s.vergiNo,
      token: data.token,
      firmaId: data.firma_id ?? data.firma_ids?.[0],
      firmaIds: data.firma_ids || [],
      isim: data.isim || '',
      expiresAt: Date.now() + expiresIn * 1000,
    };
    sessions.set(s.sid, session); // şifre burada bellekten silinir
    return sendJson(
      res,
      200,
      { firma: firmPayload(session) },
      { 'Set-Cookie': setCookie(s.sid, expiresIn) }
    );
  },

  async 'GET /api/auth/me'(ctx, req, res) {
    const s = getSession(req);
    if (!s?.token) return sendError(res, 401, 'UNAUTHENTICATED', 'Oturum bulunamadı.');
    return sendJson(res, 200, { firma: firmPayload(s) });
  },

  async 'POST /api/auth/logout'(ctx, req, res) {
    const s = getSession(req);
    if (s) sessions.delete(s.sid);
    res.statusCode = 204;
    res.setHeader('Set-Cookie', setCookie('', 0));
    res.end();
  },
};

// ---- Veri uçları (GET): ERP yanıtını frontend'in beklediği şekle çevirir ----

const dataRoutes = {
  // -> { data: [{ id, ad, aciklama, sik }] }
  '/api/applications/types': {
    erpPath: () => '/api/v1/evrak-tipler',
    map: mapApplicationTypes,
  },

  // -> { data: [{ id, tur, baslik, aciklama, tutar, sonTarih, dosyalar: [{ id, ad }] }] }
  '/api/alerts': {
    needsFirmaId: true,
    load: loadAlerts,
  },

  // -> { data: [{ id, durum, durumText, tur, parsel, miktar, birim, baslangic, bitis, gun,
  //      tutar, faturaNo, faturaTarihi, aciklama, dosyalar: [{ id, ad, boyut }] }] }
  '/api/firm/isgaliye': {
    needsFirmaId: true,
    load: loadIsgaliye,
  },

  // -> { unvan, vergiNo, nace, yetkili, yerler }
  '/api/firm/profile': {
    needsFirm: true,
    erpPath: (firm) => `/api/v1/sanayici-panel/sanayici/${firm.vergiNo}/detay`,
    map: (erp, firm) => mapFirmProfile(erp, firm.vergiNo),
  },
};

// Ham ERP yanıtını görmek için: http://localhost:5173/__erp/<ad>
// Uyarı servislerinde sona firma id'si eklenebilir: /__erp/isgaliye/1078 (yalnızca bu deneme
// görüntüleyicisinde; ekranlara giden uçlar firmayı her zaman oturumdan/.env'den alır).
// Dosyalar: /__erp/isgaliye-dosya/<kayıtId>/<index>, /__erp/gecmis-borc-dosya/<kayıtId> ...
const sourceRaw = (source) => (firm, ctx, id) => {
  const firmaId = id || firmaIdFor(ctx, firm, source);
  return firmaId && ALERT_SOURCES[source].list(firmaId);
};
const sourceFileRaw = (source) => (firm, ctx, id, n) =>
  id && ALERT_SOURCES[source].file(id, n ?? 0);

const rawRoutes = {
  'evrak-tipler': () => '/api/v1/evrak-tipler',
  detay: (firm) => firm?.vergiNo && `/api/v1/sanayici-panel/sanayici/${firm.vergiNo}/detay`,
  isgaliye: sourceRaw('isg'),
  'isgaliye-dosya': sourceFileRaw('isg'),
  'eksik-teminat': sourceRaw('et'),
  'eksik-teminat-dosya': sourceFileRaw('et'),
  'gecmis-borc': sourceRaw('borc'),
  'gecmis-borc-dosya': sourceFileRaw('borc'),
  'eksik-dbs': sourceRaw('dbs'),
  'eksik-dbs-dosya': sourceFileRaw('dbs'),
};

// ---- Servis durumu: /__erp/durum ----
// Bilinen GET servislerini sırayla dener: HTTP durumu, kayıt sayısı, eşlemenin beklediği alanlar
// ve ilk dosyanın indirilip indirilemediği. Oturum açıksa her servis giriş token'ıyla da denenir
// (ERP token'ı kabul etmeye başladı mı, görmek için). Yalnızca durum ve alan adlarını döner.

// Eşlemelerin ERP kaydında okuduğu alanlar. Eksik alan, ekranda boş kalan bilgi demektir.
const EXPECTED_FIELDS = {
  'evrak-tipler': ['id', 'isim', 'aciklama'],
  detay: [
    'isim',
    'adres',
    'k_isimsoyisim',
    'k_tel',
    'k_email',
    'nace_kodu',
    'parseller',
    'tesisatlar',
  ],
  isg: [
    'id',
    'durum_text',
    'turu_text',
    'parsel_adi',
    'miktar',
    'birim',
    'baslangic_t',
    'bitis_t',
    'gun',
    'fatura_tutar',
    'fatura_no',
    'fatura_t',
    'aciklama',
    'dosyalar',
  ],
  et: [
    'id',
    'tarih',
    'cari_no',
    'veri',
    'teminat_talep',
    'teminat',
    'teminat_eksik',
    'evrak_sayi',
    'dosyalar',
  ],
  borc: ['id', 'tarih', 'cari_no', 'veri', 'bakiye', 'finans', 'evrak_sayi', 'dosyalar'],
  dbs: ['id', 'tarih', 'cari_no', 'veri', 'dbs', 'evrak_sayi', 'dosyalar'],
};

const SOURCE_NAMES = {
  isg: 'isgaliye',
  et: 'eksik-teminat',
  borc: 'gecmis-borc',
  dbs: 'eksik-dbs',
};

const MAPPERS = {
  'evrak-tipler': (body) => mapApplicationTypes(body),
  detay: (body) => mapFirmProfile(body, ''),
  isg: (body) => (body.data || []).map(mapIsgaliye),
  et: (body) => mapAlerts({ et: body.data || [] }),
  borc: (body) => mapAlerts({ borc: body.data || [] }),
  dbs: (body) => mapAlerts({ dbs: body.data || [] }),
};

const elapsed = (start) => `${Date.now() - start} ms`;

async function probeFile(ctx, path) {
  const start = Date.now();
  try {
    const r = await fetch(new URL(path, ctx.env.ERP_DEV_URL), {
      headers: authHeaderOf(ctx) ? { Authorization: authHeaderOf(ctx) } : {},
      signal: AbortSignal.timeout(30000),
    });
    const size = (await r.arrayBuffer()).byteLength;
    return `${r.status} ${r.headers.get('content-type') || '?'} ${Math.round(size / 1024)} KB (${elapsed(start)})`;
  } catch (err) {
    return `hata: ${err.name === 'TimeoutError' ? 'zaman aşımı' : err.cause?.code || err.message}`;
  }
}

async function probeService(ctx, key, path, tokenCtx) {
  const sonuc = { yol: path };
  const start = Date.now();
  try {
    const { status, body } = await callErp(ctx, path);
    sonuc.http = `${status} (${elapsed(start)})`;
    if (status >= 400) {
      sonuc.durum = 'HATA';
      sonuc.mesaj = String(body?.message || body?.error || body?.yanitMetni || '').slice(0, 200);
      return sonuc;
    }
    const list = Array.isArray(body?.data) ? body.data : [];
    sonuc.kayit = list.length;
    const first = list[0];
    if (!first) {
      sonuc.durum = 'KAYIT YOK';
      sonuc.not = 'Alanlar kontrol edilemedi; kaydı olan bir test id ile deneyin.';
    } else {
      const eksik = EXPECTED_FIELDS[key].filter((f) => !(f in first));
      const fazla = Object.keys(first).filter((f) => !EXPECTED_FIELDS[key].includes(f));
      sonuc.eksikAlanlar = eksik;
      sonuc.kullanilmayanAlanlar = fazla;
      try {
        MAPPERS[key](body);
        sonuc.durum = eksik.length ? 'UYUMSUZ ALAN' : 'OK';
      } catch (err) {
        sonuc.durum = 'EŞLEME HATASI';
        sonuc.mesaj = err.message;
      }
      // İlk bulunan dosyayı dene (yalnızca uyarı/işgaliye kaynakları).
      if (ALERT_SOURCES[key]) {
        const kayit = list.find((k) => (k.dosyalar || []).some((d) => !d.bulunamadi));
        const dosya = kayit?.dosyalar.find((d) => !d.bulunamadi);
        if (dosya) {
          const n = dosya[ALERT_FILE_KEYS[key]];
          sonuc.dosya = {
            yol: ALERT_SOURCES[key].file(kayit.id, n),
            sonuc: await probeFile(ctx, ALERT_SOURCES[key].file(kayit.id, n)),
          };
        } else {
          sonuc.dosya = 'Bulunabilir dosyası olan kayıt yok';
        }
      }
    }
  } catch (err) {
    sonuc.durum = 'ULAŞILAMADI';
    sonuc.mesaj = err.name === 'TimeoutError' ? 'zaman aşımı' : err.cause?.code || err.message;
  }
  if (tokenCtx) {
    const r = await callErp(tokenCtx, path).catch(() => ({ status: 'hata' }));
    sonuc.tokenIle = String(r.status);
  }
  return sonuc;
}

async function runStatusCheck(ctx, firm, session) {
  const tokenCtx = session?.token ? { ...ctx, authHeader: `Bearer ${session.token}` } : null;
  const services = [['evrak-tipler', 'evrak-tipler', '/api/v1/evrak-tipler']];
  if (firm?.vergiNo) {
    services.push(['detay', 'detay', `/api/v1/sanayici-panel/sanayici/${firm.vergiNo}/detay`]);
  }
  for (const source of Object.keys(SOURCE_NAMES)) {
    const id = firmaIdFor(ctx, firm, source);
    if (id)
      services.push([source, `${SOURCE_NAMES[source]} (${id})`, ALERT_SOURCES[source].list(id)]);
  }

  const servisler = {};
  for (const [key, name, path] of services) {
    servisler[name] = await probeService(ctx, key, path, tokenCtx);
  }

  const ozet = Object.entries(servisler).map(([name, s]) => {
    const parts = [s.durum, s.http];
    if (s.kayit != null) parts.push(`${s.kayit} kayıt`);
    if (s.eksikAlanlar?.length) parts.push(`eksik alan: ${s.eksikAlanlar.join(', ')}`);
    if (s.dosya?.sonuc) parts.push(`dosya: ${s.dosya.sonuc}`);
    if (s.tokenIle) parts.push(`token ile: ${s.tokenIle}`);
    if (s.mesaj) parts.push(s.mesaj);
    return `${name}: ${parts.filter(Boolean).join(' · ')}`;
  });

  return {
    erp: ctx.env.ERP_DEV_URL,
    tarih: new Date().toISOString(),
    giris: session?.token
      ? `OK (portal-auth, firma_id ${session.firmaId ?? '?'})`
      : 'denenmedi: gerçek girişle oturum açılmamış',
    ozet,
    denenmeyenler: [
      'evrak-dosya: başvuru listesi servisi olmadığı için evrak/detay id bilinmiyor',
      'evrak (POST): kayıt oluşturduğu için otomatik denenmez',
      'Logo fatura servisleri: ayrı sunucu, ara katmana bağlı değil',
    ],
    servisler,
  };
}

// ---- Plugin ----

export function erpDevProxy(env) {
  return {
    name: 'erp-dev-proxy',
    apply: 'serve',
    configureServer(server) {
      if (!env.ERP_DEV_URL || !env.ERP_DEV_KEY) return;

      const live = (env.VITE_DEV_LIVE_ENDPOINTS || '').split(',').map((s) => s.trim());
      const baseCtx = {
        env,
        authLive: live.includes('auth'),
        dataAuth: (env.ERP_DEV_DATA_AUTH || 'key').trim(),
        testFirms: parseTestFirms(env.ERP_DEV_TEST_FIRMA),
        log: (msg) => server.config.logger.warn(`[erp] ${msg}`, { timestamp: true }),
      };
      server.config.logger.info('  ERP dev ara katmanı açık. Ham yanıtlar: /__erp/');

      server.middlewares.use(async (req, res, next) => {
        let ctx = baseCtx;
        // /__erp hem kökte hem de uygulamanın base path'i altında açılabilir.
        const base = server.config.base.replace(/\/$/, '');
        let pathname = (req.url || '').split('?')[0];
        if (base && pathname.startsWith(`${base}/__erp`)) pathname = pathname.slice(base.length);

        const isAuthPath = ctx.authLive && pathname.startsWith('/api/auth/');
        const dataRoute = dataRoutes[pathname];
        const isRaw = pathname === '/__erp' || pathname.startsWith('/__erp/');
        // Dosya uçları aynı kontrolden geçer: isg-<kayıt>-<index>, et-<kayıt>-<slot>
        const isgFile = /^\/api\/firm\/isgaliye\/(\d+)\/files\/(\d+)$/.exec(pathname);
        const alertFileId = isgFile
          ? `isg-${isgFile[1]}-${isgFile[2]}`
          : /^\/api\/alerts\/files\/([^/]+)$/.exec(pathname)?.[1];
        if (!isAuthPath && !dataRoute && !isRaw && !alertFileId) return next();

        if (!LOOPBACK.has(req.socket.remoteAddress)) {
          return sendError(res, 403, 'FORBIDDEN', 'Yalnızca yerel erişime açıktır.');
        }

        try {
          if (isAuthPath) {
            const handler = authRoutes[`${req.method} ${pathname}`];
            if (!handler) return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Desteklenmiyor.');
            return await handler(ctx, req, res);
          }

          if (req.method !== 'GET') {
            return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Yalnızca GET desteklenir.');
          }

          const firm = resolveFirm(ctx, req);
          const session = getSession(req);

          // Teşhis: evrak-tipler'i farklı yetki biçimleriyle dener, yalnızca durum kodlarını döner.
          if (pathname.replace(/\/$/, '') === '/__erp/tani') {
            const tries = [
              ['anahtar (Colab-Api-Key)', undefined],
              ["giriş token'ı (Bearer)", session?.token ? `Bearer ${session.token}` : false],
              ['yetkisiz', null],
            ];
            const sonuc = {};
            for (const [ad, authHeader] of tries) {
              if (authHeader === false) {
                sonuc[ad] = 'denenmedi: önce gerçek girişle oturum açın';
                continue;
              }
              const r = await callErp({ ...ctx, authHeader }, '/api/v1/evrak-tipler');
              sonuc[ad] =
                `${r.status} ${String(r.body?.message || r.body?.error || (r.status < 300 ? 'OK' : '')).slice(0, 120)}`;
            }
            return sendJson(res, 200, { erp: ctx.env.ERP_DEV_URL, sonuc });
          }

          // ERP_DEV_DATA_AUTH=bearer: veri uçları anahtar yerine giriş token'ıyla çağrılır.
          if (ctx.dataAuth === 'bearer' && session?.token) {
            ctx = { ...ctx, authHeader: `Bearer ${session.token}` };
          }

          if (pathname.replace(/\/$/, '') === '/__erp/durum') {
            return sendJson(res, 200, await runStatusCheck(ctx, firm, session));
          }

          if (isRaw) {
            const name = pathname.replace(/^\/__erp\/?/, '');
            if (!name) {
              return sendJson(res, 200, {
                firma: firm ? { vergiNo: firm.vergiNo, firmaId: firm.firmaId || null } : null,
                uclar: ['durum', 'tani', ...Object.keys(rawRoutes)].map((n) => `/__erp/${n}`),
              });
            }
            const [routeName, ...args] = name.split('/').filter(Boolean);
            if (args.some((a) => !/^\d+$/.test(a)) || args.length > 2) {
              return sendError(res, 400, 'BAD_ID', 'Id yalnızca rakam olabilir.');
            }
            const build = rawRoutes[routeName];
            if (!build) return sendError(res, 404, 'NOT_FOUND', 'Bilinmeyen uç.');
            const erpPath = build(firm, ctx, ...args);
            if (!erpPath) {
              return sendError(
                res,
                400,
                'NO_FIRM',
                'Firma bilgisi yok: giriş yapın veya .env değerlerini doldurun.'
              );
            }
            if (routeName.endsWith('-dosya')) return await pipeErpFile(ctx, erpPath, res);
            const { status, body } = await callErp(ctx, erpPath);
            return sendJson(res, status, body);
          }

          if (alertFileId || dataRoute.needsFirmaId) {
            if (!firm) return sendError(res, 401, 'UNAUTHENTICATED', 'Oturum bulunamadı.');
            if (!hasAlertFirm(ctx, firm)) {
              return sendError(
                res,
                400,
                'NO_FIRMA_ID',
                'Firma id yok: .env içinde ERP_DEV_FIRMA_ID doldurun.'
              );
            }
          }
          if (alertFileId) {
            return await sendAlertFile(ctx, firm, decodeURIComponent(alertFileId), res);
          }
          if (dataRoute.load) {
            return sendJson(res, 200, await dataRoute.load(ctx, firm));
          }

          if (dataRoute.needsFirm && !firm?.vergiNo) {
            return sendError(res, 401, 'UNAUTHENTICATED', 'Oturum bulunamadı.');
          }
          const { status, body } = await callErp(ctx, dataRoute.erpPath(firm));
          if (status >= 400) {
            server.config.logger.warn(`[erp] ${pathname} -> ERP ${status}`, { timestamp: true });
            return sendError(res, 502, 'ERP_ERROR', `ERP ${status} döndü. Ayrıntı terminalde.`);
          }
          return sendJson(res, 200, dataRoute.map(body, firm));
        } catch (err) {
          if (err instanceof ErpStatusError) {
            ctx.log(err.message);
            return sendError(res, 502, 'ERP_ERROR', `ERP ${err.status} döndü. Ayrıntı terminalde.`);
          }
          // Gerçek nedeni terminale yaz (ör. ETIMEDOUT, ENOTFOUND, ECONNREFUSED).
          const reason =
            err.name === 'TimeoutError' ? 'zaman aşımı' : err.cause?.code || err.message;
          server.config.logger.warn(`[erp] ${pathname} başarısız: ${reason}`, { timestamp: true });
          return sendError(res, 502, 'ERP_UNREACHABLE', "ERP'ye ulaşılamadı. Ayrıntı terminalde.");
        }
      });
    },
  };
}
