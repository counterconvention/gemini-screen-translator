export interface ExtensionConfig {
  version: string;
  extensionId: string;
  shortcutFree: string;
  shortcutFixed: string;
}

export const DEFAULT_EXTENSION_CONFIG: ExtensionConfig = {
  version: '1.0.0',
  extensionId: 'gemini-screen-translator@firefox.local',
  shortcutFree: 'Alt+Shift+T',
  shortcutFixed: 'Alt+Shift+Q',
};

const STORAGE_KEY = 'gst_extension_config';

export function getExtensionConfig(): ExtensionConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        version: parsed.version?.trim() || DEFAULT_EXTENSION_CONFIG.version,
        extensionId: parsed.extensionId?.trim() || DEFAULT_EXTENSION_CONFIG.extensionId,
        shortcutFree: parsed.shortcutFree?.trim() || DEFAULT_EXTENSION_CONFIG.shortcutFree,
        shortcutFixed: parsed.shortcutFixed?.trim() || DEFAULT_EXTENSION_CONFIG.shortcutFixed,
      };
    }
  } catch (_e) {}
  return { ...DEFAULT_EXTENSION_CONFIG };
}

export function saveExtensionConfig(config: Partial<ExtensionConfig>): ExtensionConfig {
  const current = getExtensionConfig();
  const updated: ExtensionConfig = {
    version: config.version !== undefined ? config.version.trim() : current.version,
    extensionId: config.extensionId !== undefined ? config.extensionId.trim() : current.extensionId,
    shortcutFree: config.shortcutFree !== undefined ? config.shortcutFree.trim() : current.shortcutFree,
    shortcutFixed: config.shortcutFixed !== undefined ? config.shortcutFixed.trim() : current.shortcutFixed,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('gst-extension-config-changed', { detail: updated }));
  } catch (_e) {}
  return updated;
}
