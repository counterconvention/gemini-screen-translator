import React, { useState, useId } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Copy,
  Check,
  Download,
  Save,
  Sparkles,
  Shield,
  Eye,
  Edit3,
  CheckCircle2
} from 'lucide-react';

interface ChangelogItem {
  id: string;
  category: 'security' | 'feature' | 'fix' | 'a11y';
  text: string;
}

const PRESET_CHANGELOG_SUGGESTIONS: Array<{ category: ChangelogItem['category']; text: string }> = [
  {
    category: 'security',
    text: 'Substituição completa de innerHTML por manipulação segura de DOM com textContent (em conformidade com Mozilla AMO Linter).'
  },
  {
    category: 'security',
    text: 'Permissões estritamente limitadas no manifest.json (activeTab, storage, scripting) com browser_specific_settings.gecko configurado.'
  },
  {
    category: 'a11y',
    text: 'Auditoria de Acessibilidade (A11y - WCAG 2.1 AA): suporte a leitores de tela com aria-live, aria-labels em botões e navegação por teclado (Esc).'
  },
  {
    category: 'security',
    text: 'Política estrita de Privacidade: Zero coleta de dados, sem telemetria ou analytics, e armazenamento exclusivamente local via browser.storage.local.'
  },
  {
    category: 'feature',
    text: 'Definição do Gemini 3.5 Flash Lite como modelo de IA padrão, com opção para Gemini 3.8 Flash na página de opções.'
  },
  {
    category: 'feature',
    text: 'Interface de tradução flutuante estritamente quadrada, translúcida fosca, com alças de redimensionamento pelas 4 pontas.'
  },
  {
    category: 'feature',
    text: 'Painel de Logs de Auditoria integrado na página de opções para validação transparente de requisições pelo revisor da Mozilla.'
  }
];

export const RevisionNotesGenerator: React.FC = () => {
  const versionInputId = useId();
  const dateInputId = useId();
  const reviewerNoteInputId = useId();
  const newChangeInputId = useId();

  const [version, setVersion] = useState<string>('1.0.0');
  const [releaseDate, setReleaseDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [reviewerNote, setReviewerNote] = useState<string>(
    'Uma chave de teste gratuita pode ser obtida em segundos no Google AI Studio (https://aistudio.google.com/app/apikey) sem necessidade de cartão de crédito.'
  );

  const [changes, setChanges] = useState<ChangelogItem[]>([
    {
      id: '1',
      category: 'security',
      text: 'Substituição completa de innerHTML por manipulação segura de DOM com textContent (em conformidade com Mozilla AMO Linter).'
    },
    {
      id: '2',
      category: 'security',
      text: 'Permissões estritamente limitadas no manifest.json (activeTab, storage, scripting) com browser_specific_settings.gecko configurado.'
    },
    {
      id: '3',
      category: 'a11y',
      text: 'Auditoria de Acessibilidade (A11y - WCAG 2.1 AA): suporte a leitores de tela com aria-live, aria-labels em botões e navegação por teclado (Esc).'
    },
    {
      id: '4',
      category: 'security',
      text: 'Política estrita de Privacidade: Zero coleta de dados, sem telemetria ou analytics, e armazenamento exclusivamente local via browser.storage.local.'
    },
    {
      id: '5',
      category: 'feature',
      text: 'Definição do Gemini 3.5 Flash Lite como modelo de IA padrão, com opção para Gemini 3.8 Flash na página de opções.'
    }
  ]);

  const [newChangeText, setNewChangeText] = useState<string>('');
  const [newChangeCategory, setNewChangeCategory] = useState<ChangelogItem['category']>('security');
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');
  const [copied, setCopied] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleAddChange = (textToAdd?: string, catToAdd?: ChangelogItem['category']) => {
    const text = textToAdd || newChangeText.trim();
    const cat = catToAdd || newChangeCategory;
    if (!text) return;

    setChanges((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        category: cat,
        text
      }
    ]);
    if (!textToAdd) {
      setNewChangeText('');
    }
  };

  const handleRemoveChange = (id: string) => {
    setChanges((prev) => prev.filter((item) => item.id !== id));
  };

  /**
   * Gera o conteúdo Markdown formatado estritamente para o revisor da Mozilla AMO
   */
  const generateMarkdown = (): string => {
    const formattedChangelog = changes.length > 0
      ? changes.map((c) => {
          const badge =
            c.category === 'security'
              ? '[Segurança]'
              : c.category === 'a11y'
              ? '[Acessibilidade]'
              : c.category === 'fix'
              ? '[Correção]'
              : '[Novidade]';
          return `- **${badge}** ${c.text}`;
        }).join('\n')
      : '- Versão inicial submetida para avaliação no Mozilla Add-ons (AMO).';

    return `# Notes for Mozilla Reviewer (AMO Submission)

**Add-on Name:** Gemini Screen Translator  
**Add-on ID:** \`gemini-screen-translator@firefox.local\`  
**Version:** ${version}  
**Release Date:** ${releaseDate}  
**Manifest Version:** 3  
**Target Platform:** Firefox Desktop (strict_min_version: 109.0)  

---

## 1. O Que Mudou Nesta Versão (${version}) - Changelog

${formattedChangelog}

---

## 2. Summary & How the Add-on Works

**Gemini Screen Translator** allows users to select any region of a webpage, capture an image snippet of that visual area, and obtain an instant AI-powered translation overlaid directly on top of the page.

### User Flow:
1. **Shortcut Activation:** The user triggers either \`Alt+Shift+T\` (free selection of a rectangle) or \`Alt+Shift+R\` (repeat translation on the last memorized coordinates, commonly used for dialog sequences in games/comics).
2. **Screen Snippet Capture:** \`browser.tabs.captureVisibleTab\` is called to capture the active tab's visible viewport.
3. **Local Cropping:** The image is cropped strictly to the user-selected coordinates using an off-screen HTML5 \`<canvas>\` inside the background service.
4. **Direct API Call:** The cropped base64 image snippet is transmitted via \`fetch\` directly from \`background.js\` to the official Google Gemini REST endpoint (\`https://generativelanguage.googleapis.com/v1beta/models/...\`).
5. **Overlay Result:** The resulting translated text is sent back to \`content.js\` and rendered in a draggable, 4-corner resizable floating bubble with persistent positioning.

---

## 3. API Key Requirement & Reviewer Testing Instructions

The extension requires a Google Gemini API key to query the translation model (\`gemini-3.1-flash-lite\` or \`gemini-3.8-flash\`).

${reviewerNote ? `> **Nota para o Revisor:** ${reviewerNote}\n` : ''}
### How to Test during Review:
1. Open the extension Options page (\`options.html\` or through \`about:debugging\` -> This Firefox -> Gemini Screen Translator -> Options).
2. Enter any valid Google AI Studio API key in the field. (A free personal API key can be obtained in 10 seconds with any Google account at https://aistudio.google.com/app/apikey).
3. Click **"Testar Conexão"** (*Test Connection*) to verify API connectivity.
4. Open any webpage with foreign text (e.g., Japanese, English, French).
5. Press \`Alt+Shift+T\`, drag a rectangle over the foreign text, and release.
6. The floating translation bubble appears showing the translated text, with TTS audio playback and 4-corner resize handles.
7. Inspect the **"Logs de Auditoria"** (*Audit Logs*) section at the bottom of \`options.html\` to inspect real-time logs of outgoing requests (timestamps, model used, HTTP status code, and crop dimensions).

---

## 4. Strict Privacy & Zero Data Collection Policy

**This extension DOES NOT collect, store, track, sell, or transmit any user data.**

- **No Analytics / No Telemetry:** There are zero external trackers, no Google Analytics, no Sentry, no Mixpanel, and no remote telemetry scripts.
- **No Remote Code:** 100% of the code executed is contained inside the extension bundle (\`background.js\`, \`content.js\`, \`options.js\`). No scripts are loaded from CDN or remote servers.
- **Local Storage Only:** The user's API Key, preferred target language, selected model, and saved bubble coordinates are stored strictly inside the browser using \`browser.storage.local\`.
- **Ephemerality:** Screenshots are processed strictly in-memory (canvas) and transmitted solely to Google Gemini's REST API for translation. No screenshots or browsing history are ever saved or transmitted anywhere else.

---

## 5. No Build Tools, No Minification & No Obfuscation

The extension files submitted in the \`.zip\` archive are **100% human-readable source code**:

- **Written in standard Vanilla JavaScript (ES2022), HTML5, and CSS3.**
- **No bundlers used:** No Webpack, Rollup, Vite, esbuild, or Parcel are involved in building the extension runtime files.
- **No code minification:** All files (\`background.js\`, \`content.js\`, \`options.js\`) contain full indentation, original variable and function names, and developer comments.
- **Safe DOM APIs:** The codebase uses strict DOM manipulation (\`textContent\`, \`createElement\`, \`setAttribute\`, \`appendChild\`). There are zero occurrences of \`innerHTML\`, \`outerHTML\`, \`document.write\`, or \`eval()\`.

Therefore, the submitted package matches the original source code directly without any transformation or transpilations.

---

## 6. Security & Permissions Analysis

All permissions declared in \`manifest.json\` are strictly minimized to what is functionally required:

| Permission | Justification |
| :--- | :--- |
| \`activeTab\` | Grants temporary access to capture the visible tab (\`tabs.captureVisibleTab\`) and communicate with the page overlay only when invoked by the user. |
| \`storage\` | Stores user configuration locally (\`browser.storage.local\`: API key, language preference, model selection, bubble position). |
| \`scripting\` | Fallback mechanism to inject \`content.js\` and \`content.css\` into tabs opened before the extension was installed/reloaded. |
| \`host_permissions: https://generativelanguage.googleapis.com/*\` | Required to send POST requests directly to Google Gemini's official REST API endpoint from \`background.js\` without CORS blocking. |
| \`content_scripts: <all_urls>\` | Required so the user can select and translate text on any webpage they are reading. |
| \`browser_specific_settings.gecko.id\` | Set to \`gemini-screen-translator@firefox.local\` for unique add-on identification on Firefox Desktop. |

---

*Thank you for reviewing Gemini Screen Translator! If any further clarification is required, please reach out via AMO.*
`;
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(generateMarkdown());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_e) {}
  };

  const handleDownloadMarkdown = () => {
    const markdown = generateMarkdown();
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'REVISION_NOTES.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveToProject = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      const markdown = generateMarkdown();
      const res = await fetch('/api/save-revision-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: markdown })
      });
      const data = await res.json();
      if (data.success) {
        setSaveStatus('✓ REVISION_NOTES.md salvo no pacote da extensão!');
      } else {
        setSaveStatus(`✕ Erro: ${data.error || 'Falha ao salvar'}`);
      }
    } catch (err: any) {
      setSaveStatus(`✕ Erro de conexão: ${err.message}`);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(null), 3500);
    }
  };

  return (
    <div className="bg-[#0f0f12] border border-white/[0.08] rounded-xl p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-white/[0.06] gap-3">
        <div className="flex items-center gap-2.5">
          <FileText className="w-4 h-4 text-white" />
          <div>
            <h3 className="text-sm font-semibold text-white">
              Gerador de REVISION_NOTES.md (Mozilla AMO)
            </h3>
            <p className="text-[11px] text-zinc-400">
              Formatação oficial com log de alterações, permissões e instruções para os revisores da Mozilla.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-black p-0.5 rounded-lg border border-white/[0.08]">
          <button
            type="button"
            onClick={() => setViewMode('editor')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition flex items-center gap-1.5 ${
              viewMode === 'editor'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Edit3 className="w-3 h-3" />
            <span>Editar Alterações</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition flex items-center gap-1.5 ${
              viewMode === 'preview'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Prévia Formatada</span>
          </button>
        </div>
      </div>

      {viewMode === 'editor' ? (
        <div className="space-y-4 text-xs">
          {/* Metadata Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-black/60 p-3 rounded-lg border border-white/[0.06]">
            <div>
              <label htmlFor={versionInputId} className="text-[11px] font-medium text-zinc-400 block mb-1">
                Versão do Pacote
              </label>
              <input
                id={versionInputId}
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1.0.0"
                className="w-full bg-zinc-950 border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label htmlFor={dateInputId} className="text-[11px] font-medium text-zinc-400 block mb-1">
                Data do Envio
              </label>
              <input
                id={dateInputId}
                type="date"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                className="w-full bg-zinc-950 border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-white/30"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor={reviewerNoteInputId} className="text-[11px] font-medium text-zinc-400 block mb-1">
                Nota de Teste / Instruções Especiais ao Revisor
              </label>
              <input
                id={reviewerNoteInputId}
                type="text"
                value={reviewerNote}
                onChange={(e) => setReviewerNote(e.target.value)}
                placeholder="Como obter chave ou testar a extensão..."
                className="w-full bg-zinc-950 border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span className="font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-white" />
                Sugestões Rápidas de Alterações (Clique para adicionar):
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_CHANGELOG_SUGGESTIONS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddChange(preset.text, preset.category)}
                  className="px-2 py-1 bg-black/80 hover:bg-zinc-900 border border-white/[0.08] hover:border-white/20 rounded text-[10.5px] text-zinc-300 text-left transition flex items-center gap-1"
                >
                  <Plus className="w-3 h-3 flex-shrink-0 text-zinc-400" />
                  <span className="line-clamp-1">{preset.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Add custom change */}
          <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
            <label htmlFor={newChangeInputId} className="text-[11px] font-semibold text-zinc-300 block">
              Adicionar Nova Alteração ao Log
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                aria-label="Categoria da alteração"
                value={newChangeCategory}
                onChange={(e) => setNewChangeCategory(e.target.value as ChangelogItem['category'])}
                className="bg-black border border-white/[0.08] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="security">Segurança</option>
                <option value="a11y">Acessibilidade</option>
                <option value="fix">Correção</option>
                <option value="feature">Novidade</option>
              </select>

              <input
                id={newChangeInputId}
                type="text"
                value={newChangeText}
                onChange={(e) => setNewChangeText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChange();
                  }
                }}
                placeholder="Ex: Refatoração da manipulação de DOM para atender diretriz da Mozilla..."
                className="flex-1 bg-black border border-white/[0.08] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/30"
              />

              <button
                type="button"
                onClick={() => handleAddChange()}
                className="px-3 py-1.5 bg-white text-black font-semibold rounded hover:bg-zinc-200 transition flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar</span>
              </button>
            </div>
          </div>

          {/* Current Changelog List */}
          <div className="space-y-1.5">
            <span className="text-[10.5px] font-mono text-zinc-400 uppercase tracking-wider block">
              Itens do Changelog Atuais ({changes.length})
            </span>
            {changes.length === 0 ? (
              <div className="p-3 bg-black/40 border border-white/[0.04] rounded text-center text-zinc-500 text-xs">
                Nenhuma alteração adicionada. Use os botões acima ou digite uma novidade.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {changes.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 bg-black/60 border border-white/[0.06] rounded flex items-start justify-between gap-2 text-xs"
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded border uppercase flex-shrink-0 ${
                          item.category === 'security'
                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                            : item.category === 'a11y'
                            ? 'bg-blue-950/40 text-blue-400 border-blue-800/40'
                            : item.category === 'fix'
                            ? 'bg-amber-950/40 text-amber-400 border-amber-800/40'
                            : 'bg-zinc-800 text-zinc-200 border-zinc-700'
                        }`}
                      >
                        {item.category === 'security'
                          ? 'Segurança'
                          : item.category === 'a11y'
                          ? 'A11y'
                          : item.category === 'fix'
                          ? 'Correção'
                          : 'Recurso'}
                      </span>
                      <span className="text-zinc-200 leading-snug">{item.text}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveChange(item.id)}
                      className="text-zinc-500 hover:text-red-400 p-0.5 transition flex-shrink-0"
                      title="Remover alteração"
                      aria-label="Remover alteração"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Preview Mode */
        <div className="space-y-2">
          <div className="p-3 bg-black border border-white/[0.08] rounded-lg max-h-96 overflow-y-auto text-xs font-mono text-zinc-300 leading-relaxed">
            <pre className="whitespace-pre-wrap selection:bg-white selection:text-black">
              {generateMarkdown()}
            </pre>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
          <Shield className="w-3.5 h-3.5 text-zinc-300" />
          <span>Pronto para colar nas notas da versão do portal AMO</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] rounded text-white font-medium flex items-center gap-1.5 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar Markdown'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadMarkdown}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-white/[0.08] rounded text-white font-medium flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar .md</span>
          </button>

          <button
            type="button"
            onClick={handleSaveToProject}
            disabled={isSaving}
            className="px-3 py-1.5 bg-white text-black hover:bg-zinc-200 rounded font-semibold flex items-center gap-1.5 transition shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Salvando...' : 'Salvar no Pacote'}</span>
          </button>
        </div>
      </div>

      {saveStatus && (
        <div
          className={`p-2 rounded text-xs leading-normal flex items-center gap-2 ${
            saveStatus.startsWith('✓')
              ? 'bg-zinc-900 border border-white/20 text-white'
              : 'bg-red-950/40 border border-red-900 text-red-300'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{saveStatus}</span>
        </div>
      )}
    </div>
  );
};
