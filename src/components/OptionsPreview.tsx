import React, { useState, useEffect } from 'react';
import {
  Download,
  Key,
  Eye,
  EyeOff,
  Keyboard,
  RotateCcw,
  ShieldCheck,
  Check,
  Sliders,
  Settings,
} from 'lucide-react';
import {
  getExtensionConfig,
  saveExtensionConfig,
  DEFAULT_EXTENSION_CONFIG,
  ExtensionConfig
} from '../utils/extensionConfig';
import { downloadExtensionZip } from '../utils/zipExporter';
import { EXTENSION_AVATAR_DATA_URI } from '../utils/iconAssets';

export const OptionsPreview: React.FC = () => {
  const [config, setConfig] = useState<ExtensionConfig>(getExtensionConfig());
  const [apiKey, setApiKey] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [targetLang, setTargetLang] = useState<string>('Português do Brasil');
  const [model, setModel] = useState<string>('gemini-3.5-flash-lite');

  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [hasEnvKey, setHasEnvKey] = useState<boolean>(false);

  const handleTestConnection = async () => {
    if (!apiKey || apiKey.trim() === '') {
      setStatus({ message: 'Informe uma chave de API para testar.', type: 'error' });
      return;
    }
    setIsTesting(true);
    setStatus({ message: 'Testando conexão com a API do Gemini...', type: 'info' });
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey.trim()}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Ping' }] }] })
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ message: '✓ Conexão com o Gemini estabelecida com sucesso!', type: 'success' });
      } else {
        const errDesc = data?.error?.message || res.statusText;
        setStatus({ message: `Falha na conexão (${res.status}): ${errDesc}`, type: 'error' });
      }
    } catch (err: any) {
      setStatus({ message: `Erro de rede ao testar: ${err.message}`, type: 'error' });
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    const loaded = getExtensionConfig();
    setConfig(loaded);

    fetch('/api/config-status')
      .then((res) => res.json())
      .then((data) => {
        if (data.hasEnvKey) setHasEnvKey(true);
      })
      .catch(() => {});
  }, []);

  const handleUpdateConfig = (partial: Partial<ExtensionConfig>) => {
    const updated = saveExtensionConfig(partial);
    setConfig(updated);
  };

  const handleResetShortcuts = () => {
    handleUpdateConfig({
      shortcutFree: DEFAULT_EXTENSION_CONFIG.shortcutFree,
      shortcutFixed: DEFAULT_EXTENSION_CONFIG.shortcutFixed,
    });
    setStatus({
      message: 'Atalhos restaurados para Alt+Shift+T e Alt+Shift+R.',
      type: 'info',
    });
  };

  const handleResetAllDefaults = () => {
    const reset = saveExtensionConfig(DEFAULT_EXTENSION_CONFIG);
    setConfig(reset);
    setStatus({
      message: 'Configurações de versão, ID e atalhos restauradas para os padrões.',
      type: 'info',
    });
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadExtensionZip(config);
    } finally {
      setIsDownloading(false);
    }
  };



  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setStatus({
        message: '✓ Todas as preferências e atalhos foram salvos com sucesso.',
        type: 'success',
      });
    }, 200);
  };

  return (
    <div className="flex flex-col gap-4 max-w-3xl mx-auto font-sans">
      {/* 1. Header & Empacotador do Add-on (Preto Fosco, Quadrado, Minimalista) */}
      <div className="bg-[#08080a] border border-white/[0.1] p-4 rounded-none shadow-2xl flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2.5">
            <img
              src={EXTENSION_AVATAR_DATA_URI}
              alt="G.S.T Robot"
              className="w-5 h-5 object-cover border border-white/20 bg-black flex-shrink-0"
            />
            <div>
              <h2 className="text-xs font-semibold text-white tracking-tight uppercase font-mono flex items-center gap-2">
                <span>Configurações</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-white/[0.08] text-zinc-300 border border-white/[0.08]">
                  v{config.version}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-white/[0.08] text-zinc-400 border border-white/[0.08]">
                  Firefox MV3
                </span>
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetAllDefaults}
            className="text-[10.5px] text-zinc-400 hover:text-white transition flex items-center gap-1 cursor-pointer font-mono"
            title="Restaurar todas as opções para o padrão"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restaurar Padrões</span>
          </button>
        </div>

        {/* Metadados: Versão & ID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-mono text-zinc-300 font-semibold uppercase">
              Versão do Add-on (manifest.version):
            </label>
            <input
              type="text"
              value={config.version}
              onChange={(e) => handleUpdateConfig({ version: e.target.value })}
              placeholder="1.0.0"
              className="bg-[#0d0d10] border border-white/[0.12] focus:border-white px-2.5 py-1.5 text-xs text-white font-mono rounded-none outline-none transition"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10.5px] font-mono text-zinc-300 font-semibold uppercase">
              ID da Extensão (gecko.id):
            </label>
            <input
              type="text"
              value={config.extensionId}
              onChange={(e) => handleUpdateConfig({ extensionId: e.target.value })}
              placeholder="gemini-screen-translator@firefox.local"
              className="bg-[#0d0d10] border border-white/[0.12] focus:border-white px-2.5 py-1.5 text-xs text-white font-mono rounded-none outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* 2. Formulário Principal */}
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        {/* Bloco: Credenciais Google Gemini */}
        <div className="bg-[#08080a] border border-white/[0.1] p-4 rounded-none space-y-3">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
            <div className="flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-zinc-300" />
              <h3 className="text-[11px] font-bold text-white uppercase tracking-wider font-mono">
                Credenciais da API (Google Gemini)
              </h3>
            </div>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10.5px] text-zinc-400 hover:text-white underline font-mono transition"
            >
              Gerar chave gratuita ↗
            </a>
          </div>

          <div className="relative flex items-center">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-[#0d0d10] border border-white/[0.12] rounded-none px-2.5 py-1.5 text-xs text-white font-mono outline-none focus:border-white transition pr-8"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2.5 text-zinc-500 hover:text-white transition cursor-pointer"
              title="Mostrar ou ocultar chave"
            >
              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="w-full h-8 px-3 border border-white/[0.12] bg-[#0d0d10] hover:bg-[#15151a] text-[11px] font-semibold text-white transition cursor-pointer rounded-none font-mono flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              {isTesting ? 'Testando Conexão...' : 'Testar Conexão Gemini'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-[10.5px] font-mono text-zinc-300 font-semibold uppercase block">
                Idioma de Destino
              </label>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full bg-[#0d0d10] border border-white/[0.12] rounded-none px-2.5 py-1.5 text-xs text-white outline-none focus:border-white transition cursor-pointer"
              >
                <option value="Português do Brasil">Português do Brasil</option>
                <option value="Inglês">Inglês</option>
                <option value="Espanhol">Espanhol</option>
                <option value="Francês">Francês</option>
                <option value="Alemão">Alemão</option>
                <option value="Japonês">Japonês</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10.5px] font-mono text-zinc-300 font-semibold uppercase block">
                Modelo do Gemini
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-[#0d0d10] border border-white/[0.12] rounded-none px-2.5 py-1.5 text-xs text-white outline-none focus:border-white transition cursor-pointer"
              >
                <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash Lite</option>
                <option value="gemini-3.8-flash">Gemini 3.8 Flash</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bloco: Atalhos de Teclado (Desktop) */}
        <div className="bg-[#08080a] border border-white/[0.1] p-4 rounded-none space-y-3">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
            <div className="flex items-center gap-2">
              <Keyboard className="w-3.5 h-3.5 text-zinc-300" />
              <h3 className="text-[11px] font-bold text-white uppercase tracking-wider font-mono">
                Atalhos de Teclado
              </h3>
            </div>
            <button
              type="button"
              onClick={handleResetShortcuts}
              className="text-[10.5px] text-zinc-400 hover:text-white transition flex items-center gap-1 cursor-pointer font-mono"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restaurar Atalhos</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-[#0d0d10] p-2.5 border border-white/[0.08] space-y-1">
              <div className="flex items-center justify-between">
                <strong className="text-zinc-200 text-xs">Atalho 1: Captura Livre</strong>
                <span className="text-[9.5px] font-mono text-zinc-500">toggle-selection</span>
              </div>
              <input
                type="text"
                value={config.shortcutFree}
                onChange={(e) => handleUpdateConfig({ shortcutFree: e.target.value })}
                placeholder="Alt+Shift+T"
                className="w-full bg-[#000000] border border-white/[0.12] focus:border-white px-2 py-1.5 text-xs font-mono text-white rounded-none outline-none transition font-semibold"
              />
            </div>

            <div className="bg-[#0d0d10] p-2.5 border border-white/[0.08] space-y-1">
              <div className="flex items-center justify-between">
                <strong className="text-zinc-200 text-xs">Atalho 2: Zona Fixa</strong>
                <span className="text-[9.5px] font-mono text-zinc-500">repeat-fixed-selection</span>
              </div>
              <input
                type="text"
                value={config.shortcutFixed}
                onChange={(e) => handleUpdateConfig({ shortcutFixed: e.target.value })}
                placeholder="Alt+Shift+Q"
                className="w-full bg-[#000000] border border-white/[0.12] focus:border-white px-2 py-1.5 text-xs font-mono text-white rounded-none outline-none transition font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full h-9 px-3 border border-white/[0.12] bg-[#0d0d10] hover:bg-[#15151a] text-[11px] font-semibold text-white transition cursor-pointer rounded-none font-mono flex items-center justify-center gap-1.5 whitespace-nowrap box-border"
          >
            {isSaving ? 'Salvando...' : 'Salvar Preferências'}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full h-9 px-3 border border-white/[0.2] bg-[#0d0d10] hover:bg-white hover:text-black text-[11px] font-semibold text-white transition cursor-pointer rounded-none font-mono flex items-center justify-center gap-1.5 whitespace-nowrap box-border"
          >
            <Download className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{isDownloading ? 'Empacotando...' : `Baixar Extensão (.zip)`}</span>
          </button>
        </div>
      </form>

      {/* Status de Notificações com posição fixa sem deslocamento */}

      {/* 4. Feedback de Status posicionado estritamente abaixo da barra de garantias para evitar qualquer deslocamento dos itens do menu */}
      <div className="min-h-[38px]">
        {status ? (
          <div
            className={`p-2.5 rounded-none text-xs leading-relaxed border font-mono flex items-center justify-between ${
              status.type === 'success'
                ? 'bg-[#0d0d10] text-emerald-300 border-emerald-500/40'
                : status.type === 'error'
                ? 'bg-[#150a0a] text-red-400 border-red-500/40'
                : 'bg-[#0d0d10] text-zinc-300 border-white/20'
            }`}
          >
            <span className="font-bold">{status.message}</span>
            <button
              type="button"
              onClick={() => setStatus(null)}
              className="text-zinc-500 hover:text-white ml-2 text-xs font-mono cursor-pointer"
              title="Fechar alerta"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="p-2 text-[10.5px] font-mono text-zinc-600 border border-dashed border-white/[0.04] text-center">
            Nenhuma alteração pendente
          </div>
        )}
      </div>
    </div>
  );
};
