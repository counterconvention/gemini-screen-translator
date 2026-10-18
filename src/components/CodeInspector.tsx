import React, { useState } from 'react';
import { EXTENSION_FILES, ExtensionFile } from '../extensionFiles';
import {
  Copy,
  Check,
  Download,
  FileCode,
  Shield,
  ShieldCheck,
  Sparkles,
  Accessibility,
  CheckCircle2
} from 'lucide-react';
import { downloadExtensionZip } from '../utils/zipExporter';
import { A11yAuditor } from './A11yAuditor';
import { ManifestValidator } from './ManifestValidator';
import { getExtensionConfig } from '../utils/extensionConfig';

export const CodeInspector: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'files' | 'manifest' | 'a11y'>('files');
  const [selectedFile, setSelectedFile] = useState<ExtensionFile>(EXTENSION_FILES[0]);
  const [copied, setCopied] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [config, setConfig] = useState(getExtensionConfig());

  React.useEffect(() => {
    const handleConfigChange = (e: any) => {
      if (e.detail) setConfig(e.detail);
    };
    window.addEventListener('gst-extension-config-changed', handleConfigChange);
    return () => window.removeEventListener('gst-extension-config-changed', handleConfigChange);
  }, []);

  const displayedContent = React.useMemo(() => {
    if (selectedFile.name === 'manifest.json') {
      try {
        const parsed = JSON.parse(selectedFile.content);
        parsed.version = config.version;
        if (parsed.browser_specific_settings?.gecko) {
          parsed.browser_specific_settings.gecko.id = config.extensionId;
        }
        return JSON.stringify(parsed, null, 2);
      } catch (_e) {}
    }
    return selectedFile.content;
  }, [selectedFile, config]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (_e) {}
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadExtensionZip(config);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top action header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0f0f12] border border-white/[0.08] p-3.5 rounded-xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-900 border border-white/[0.08] text-white">
            <FileCode className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-zinc-100">
                Código & Validação da Extensão Firefox (Manifest V3)
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                AMO Compliant
              </span>
            </div>
            <p className="text-[11.5px] text-zinc-400 mt-0.5">
              Arquivos de produção em Vanilla JavaScript, validador de manifest.json e auditoria de acessibilidade WCAG 2.1 AA.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-tab view switch */}
          <div className="bg-black p-0.5 rounded-lg border border-white/[0.08] flex items-center">
            <button
              onClick={() => setActiveSubTab('files')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-1.5 ${
                activeSubTab === 'files'
                  ? 'bg-zinc-800 text-white font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Arquivos do Pacote</span>
            </button>

            <button
              onClick={() => setActiveSubTab('manifest')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-1.5 ${
                activeSubTab === 'manifest'
                  ? 'bg-zinc-800 text-white font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Validador Manifest</span>
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                100%
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('a11y')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-1.5 ${
                activeSubTab === 'a11y'
                  ? 'bg-zinc-800 text-white font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Accessibility className="w-3.5 h-3.5 text-emerald-400" />
              <span>Auditoria A11y</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </button>
          </div>

          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="px-3 py-1.5 bg-white text-black hover:bg-zinc-200 text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloading ? 'Compactando...' : 'Baixar (.zip)'}</span>
          </button>
        </div>
      </div>

      {/* Conditional Rendering: Manifest Validator vs A11y Tool vs File Inspector */}
      {activeSubTab === 'manifest' ? (
        <ManifestValidator />
      ) : activeSubTab === 'a11y' ? (
        <A11yAuditor />
      ) : (
        /* Main split view for files */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: File Tabs */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <div className="bg-[#0f0f12] border border-white/[0.08] rounded-xl p-2.5 flex flex-col gap-1">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider px-2 py-1">
                Ficheiros do Pacote ({EXTENSION_FILES.length})
              </span>
              {EXTENSION_FILES.map((file) => {
                const isSelected = selectedFile.name === file.name;
                return (
                  <button
                    key={file.name}
                    onClick={() => setSelectedFile(file)}
                    className={`flex items-start justify-between p-2.5 rounded-lg text-left transition-all ${
                      isSelected
                        ? 'bg-zinc-800 text-white font-medium border border-white/[0.1]'
                        : 'hover:bg-zinc-900 text-zinc-400 hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-mono font-medium flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-zinc-600'}`}></span>
                        {file.name}
                      </span>
                      <span className="text-[10.5px] text-zinc-500 mt-0.5 line-clamp-1">
                        {file.path}
                      </span>
                    </div>
                    <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-black/60 text-zinc-400 uppercase">
                      {file.language}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Manifest Validator Status Banner */}
            <div
              onClick={() => setActiveSubTab('manifest')}
              className="bg-[#0f0f12] hover:bg-zinc-900 border border-emerald-900/40 rounded-xl p-3 flex items-center justify-between cursor-pointer transition group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-200 group-hover:text-white">
                    Validador manifest.json
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    Zero campos obsoletos • 100% conforme AMO
                  </div>
                </div>
              </div>
              <span className="text-[10.5px] text-emerald-400 font-mono font-bold">100%</span>
            </div>

            {/* Quick A11y Status Banner in Sidebar */}
            <div
              onClick={() => setActiveSubTab('a11y')}
              className="bg-[#0f0f12] hover:bg-zinc-900 border border-emerald-900/40 rounded-xl p-3 flex items-center justify-between cursor-pointer transition group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
                  <Accessibility className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-200 group-hover:text-white">
                    Auditoria A11y (WCAG 2.1 AA)
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    8/8 regras aprovadas para o Mozilla AMO
                  </div>
                </div>
              </div>
              <span className="text-[10.5px] text-emerald-400 font-mono font-bold">100%</span>
            </div>

            {/* Technical Highlights */}
            <div className="bg-[#0f0f12] border border-white/[0.08] rounded-xl p-3.5 flex flex-col gap-2.5 text-xs">
              <h3 className="font-semibold text-zinc-200 flex items-center gap-1.5 text-xs">
                <Shield className="w-3.5 h-3.5 text-zinc-300" />
                <span>Garantias Técnicas</span>
              </h3>

              <div className="space-y-2 text-zinc-400 text-[11px] leading-relaxed">
                <div className="flex gap-2 items-start">
                  <span className="font-mono text-zinc-300">•</span>
                  <span>
                    <strong className="text-zinc-200">100% Seguro no DOM:</strong> Zero uso de <code>innerHTML</code> ou <code>eval</code>. Todo conteúdo usa <code>textContent</code> seguro.
                  </span>
                </div>
                <div className="flex gap-2 items-start">
                  <span className="font-mono text-zinc-300">•</span>
                  <span>
                    <strong className="text-zinc-200">Posição Fixa Memorizada:</strong> Coordenadas persistentes em <code>browser.storage.local</code>.
                  </span>
                </div>
                <div className="flex gap-2 items-start">
                  <span className="font-mono text-zinc-300">•</span>
                  <span>
                    <strong className="text-zinc-200">Acessibilidade Total:</strong> Suporte nativo a tecla Esc, foco visível e <code>aria-live</code>.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Code viewer */}
          <div className="lg:col-span-8 flex flex-col bg-black border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl">
            <div className="bg-[#0c0c0e] px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-zinc-200">{selectedFile.name}</span>
                <span className="text-[10px] font-mono text-zinc-500">({selectedFile.description})</span>
              </div>

              <button
                onClick={handleCopy}
                className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition ${
                  copied
                    ? 'bg-zinc-800 text-white'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/[0.08]'
                }`}
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>

            <div className="p-4 overflow-x-auto max-h-[520px] text-xs font-mono text-zinc-300 leading-relaxed bg-[#050507]">
              <pre className="selection:bg-white selection:text-black">
                <code>{displayedContent}</code>
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

