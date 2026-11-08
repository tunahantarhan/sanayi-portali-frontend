import axios from 'axios';

// Frontend yalnızca portal backend'ini (Fastify) çağırır. ERP'ye, Logo'ya veya veritabanına
// tarayıcıdan hiçbir zaman doğrudan bağlanılmaz; ERP anahtarı yalnızca backend'de durur.
//
// VITE_USE_MOCK=false olmadıkça uygulama mock veriyle çalışır (GitHub Pages demosu bu modda).
// VITE_API_BASE_URL backend'in adresidir; aynı sunucuda çalışılıyorsa varsayılan "/api" yeterli.

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Oturum HttpOnly cookie ile taşınır
  headers: { Accept: 'application/json' },
  timeout: 30000,
});

// Backend hata biçimi: { error: { code, message } }
export class ApiError extends Error {
  constructor(message, { status, code, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Oturum düştüğünde (401) AuthContext'e haber verilir, kullanıcı giriş ekranına yönlendirilir.
let unauthorizedHandler = null;
export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const body = error.response?.data?.error;
    const isAuthCall = error.config?.url?.startsWith('/auth/');

    if (status === 401 && !isAuthCall && unauthorizedHandler) {
      unauthorizedHandler();
    }

    const message =
      body?.message ||
      (status
        ? 'İşlem sırasında bir hata oluştu. Lütfen tekrar deneyiniz.'
        : 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol ediniz.');

    return Promise.reject(new ApiError(message, { status, code: body?.code, details: body }));
  }
);

// Dosya indirme bağlantıları cookie ile yetkilendirilen düz GET istekleridir.
export const buildApiUrl = (path) => `${API_BASE_URL}${path}`;
