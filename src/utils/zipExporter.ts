import JSZip from 'jszip';
import { EXTENSION_FILES } from '../extensionFiles';
import {
  BASE64_ICON_16,
  BASE64_ICON_32,
  BASE64_ICON_48,
  BASE64_ICON_96,
  BASE64_ICON_128
} from './iconAssets';
import { getExtensionConfig, ExtensionConfig } from './extensionConfig';

const SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
  <rect width="96" height="96" fill="#121214"/>
  <text x="48" y="28" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="13" fill="#FFFFFF" text-anchor="middle" letter-spacing="1.5">G.S.T</text>
  <circle cx="48" cy="50" r="16" fill="#FFFFFF"/>
  <circle cx="53" cy="48" r="4" fill="#FF0040"/>
</svg>`;

const README_CONTENT = (version: string, id: string, freeKey: string, fixedKey: string) => `# Gemini Screen Translator (G.S.T) - Firefox Extension

**Versão:** ${version}
**ID:** \`${id}\`
**Atalho Captura Livre:** \`${freeKey}\`
**Atalho Área Fixa:** \`${fixedKey}\`

Extensão desenvolvida em Vanilla JavaScript, HTML e CSS (Manifest V3) para Mozilla Firefox Desktop.
Permite selecionar qualquer área visual da página web, recortar a imagem e traduzir com o Google Gemini 3.5 Flash Lite.

---

## 1. Como Instalar no Firefox Desktop

1. Descompacte este arquivo .zip em uma pasta local.
2. Abra o Mozilla Firefox e acesse: \`about:debugging#/runtime/this-firefox\`
3. Na seção "Extensões Temporárias", clique no botão "Carregar extensão temporária...".
4. Selecione o arquivo \`manifest.json\` dentro da pasta descompactada.
5. Pronto! A extensão estará carregada e ativa.

---

## 2. Como Usar

- Pressione o atalho configurado: **\`${freeKey}\`** (Seleção livre) ou **\`${fixedKey}\`** (Área fixa).
- Ou clique no ícone da extensão na barra de ferramentas.
- Clique e arraste o mouse para recortar o texto.
- A janela de tradução minimalista exibirá o texto traduzido diretamente.
`;

export async function downloadExtensionZip(options?: Partial<ExtensionConfig>): Promise<void> {
  const currentConfig = getExtensionConfig();
  const targetVersion = (options?.version || currentConfig.version).trim() || '1.0.0';
  const targetId = (options?.extensionId || currentConfig.extensionId).trim() || 'gemini-screen-translator@firefox.local';
  const targetShortcutFree = (options?.shortcutFree || currentConfig.shortcutFree).trim() || 'Alt+Shift+T';
  const targetShortcutFixed = (options?.shortcutFixed || currentConfig.shortcutFixed).trim() || 'Alt+Shift+Q';

  const zip = new JSZip();

  // Add all core extension files with dynamically updated version, ID, and shortcuts in manifest.json
  for (const file of EXTENSION_FILES) {
    let content = file.content;
    if (file.name === 'manifest.json') {
      try {
        const manifestObj = JSON.parse(content);
        manifestObj.version = targetVersion;
        if (manifestObj.browser_specific_settings && manifestObj.browser_specific_settings.gecko) {
          manifestObj.browser_specific_settings.gecko.id = targetId;
        }
        if (manifestObj.commands) {
          if (manifestObj.commands['toggle-selection']) {
            manifestObj.commands['toggle-selection'].suggested_key = {
              default: targetShortcutFree,
              mac: targetShortcutFree,
            };
          }
          if (manifestObj.commands['repeat-fixed-selection']) {
            manifestObj.commands['repeat-fixed-selection'].suggested_key = {
              default: targetShortcutFixed,
              mac: targetShortcutFixed,
            };
          }
        }
        content = JSON.stringify(manifestObj, null, 2);
      } catch (_e) {}
    }
    zip.file(file.path, content);
  }

  // Add icons folder with official G.S.T Cyborg Robot icon
  const iconsFolder = zip.folder('icons');
  if (iconsFolder) {
    iconsFolder.file('icon.svg', SVG_ICON);

    // Add all icon resolutions: 16, 32, 48, 96, 128
    iconsFolder.file('icon-16.png', BASE64_ICON_16, { base64: true });
    iconsFolder.file('icon-32.png', BASE64_ICON_32, { base64: true });
    iconsFolder.file('icon-48.png', BASE64_ICON_48, { base64: true });
    iconsFolder.file('icon-96.png', BASE64_ICON_96, { base64: true });
    iconsFolder.file('icon-128.png', BASE64_ICON_128, { base64: true });
  }

  // Add README customized with version, id and shortcuts
  zip.file('README.md', README_CONTENT(targetVersion, targetId, targetShortcutFree, targetShortcutFixed));

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gemini-screen-translator-v${targetVersion}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
