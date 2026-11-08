import { tenantConfig } from './config';

// "#83472F" -> "131 71 47"
const hexToRgbChannels = (hex) => {
  const value = hex.replace('#', '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value;
  const num = parseInt(full, 16);
  return `${(num >> 16) & 255} ${(num >> 8) & 255} ${num & 255}`;
};

export const applyTheme = () => {
  const root = document.documentElement;
  const { primary, primaryLight, primaryDark } = tenantConfig.colors;
  root.style.setProperty('--color-brand', hexToRgbChannels(primary));
  root.style.setProperty('--color-brand-light', hexToRgbChannels(primaryLight || primary));
  root.style.setProperty('--color-brand-dark', hexToRgbChannels(primaryDark || primary));
  document.title = `${tenantConfig.name} Sanayici Portalı`;
};
