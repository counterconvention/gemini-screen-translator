import React, { useState } from 'react';
import {
  Monitor,
  Mic,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Info,
  Lock,
  Globe,
  Sliders,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Volume2
} from 'lucide-react';

export const FirefoxPermissionsGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'screen' | 'mic' | 'settings'>('screen');
  const [simulatedGranted, setSimulatedGranted] = useState<boolean>(false);
  const [rememberDecision, setRememberDecision] = useState<boolean>(true);

  return (
    <div className="bg-[#0f0f12] border border-white/[0.08] rounded-xl p-5 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/[0.08] flex items-center justify-center text-white">
            <Shield className="w-4 h-4 text-zinc-300" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span>Passo a Passo Visual: Permissões de Tela & Microfone no Firefox</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/50 text-amber-300 border border-amber-800/40">
                Guia AMO
              </span>
            </h3>
            <p className="text-xs text-zinc-400">
              Instruções detalhadas para conceder permissões e evitar falsos-positivos durante a revisão da Mozilla.
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center bg-black p-0.5 rounded-lg border border-white/[0.08] text-xs">
          <button
            onClick={() => {
              setActiveTab('screen');
              setSimulatedGranted(false);
            }}
            className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
              activeTab === 'screen'
                ? 'bg-zinc-800 text-white font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5 text-blue-400" />
            <span>Acesso à Tela</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('mic');
              setSimulatedGranted(false);
            }}
            className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
              activeTab === 'mic'
                ? 'bg-zinc-800 text-white font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-rose-400" />
            <span>Microfone & Áudio</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('settings');
              setSimulatedGranted(false);
            }}
            className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-zinc-800 text-white font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>about:preferences</span>
          </button>
        </div>
      </div>

      {/* Critical Note for Mozilla AMO Reviewer */}
      <div className="bg-amber-950/20 border border-amber-800/40 rounded-lg p-3.5 flex items-start gap-3 text-xs text-amber-200">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-white font-semibold">
            Nota Crítica para o Revisor da Mozilla (Atenção às Restrições de Segurança do Firefox):
          </strong>
          <p className="text-amber-200/90 leading-relaxed text-[11.5px]">
            O Firefox proíbe estritamente a execução de Content Scripts e captura de tela em páginas internas de sistema, como{' '}
            <code className="text-white bg-black/60 px-1 py-0.5 rounded border border-white/[0.08]">about:debugging</code>,{' '}
            <code className="text-white bg-black/60 px-1 py-0.5 rounded border border-white/[0.08]">about:addons</code>,{' '}
            <code className="text-white bg-black/60 px-1 py-0.5 rounded border border-white/[0.08]">about:blank</code> e no domínio{' '}
            <code className="text-white bg-black/60 px-1 py-0.5 rounded border border-white/[0.08]">addons.mozilla.org</code>.{' '}
            Para testar a captura com sucesso, <strong>abra qualquer página pública na web</strong> (ex:{' '}
            <em>wikipedia.org</em>, <em>mozilla.org</em> ou sites de notícias) antes de acionar o atalho.
          </p>
        </div>
      </div>

      {/* Interactive Firefox Mockup Window */}
      <div className="bg-black border border-white/[0.1] rounded-xl overflow-hidden shadow-2xl">
        {/* Firefox Title Bar */}
        <div className="bg-[#18181c] px-3 py-2 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-600"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-600"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-600"></span>
          </div>

          {/* Browser Tabs */}
          <div className="flex items-center gap-1">
            <div className="bg-[#24242a] text-zinc-200 text-[11px] font-medium px-3 py-1 rounded-t border-t border-x border-white/[0.08] flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-zinc-400" />
              <span>Exemplo Web (Página Normal)</span>
            </div>
            <div className="text-zinc-500 text-[11px] px-2 py-1">
              <span>about:debugging</span>
            </div>
          </div>

          <div className="text-[10px] font-mono text-zinc-500">Firefox Desktop</div>
        </div>

        {/* Address Bar with Permission Icon */}
        <div className="bg-[#121216] p-2.5 border-b border-white/[0.06] flex items-center gap-2">
          <div className="flex-1 bg-[#1c1c22] border border-white/[0.08] rounded-md px-3 py-1.5 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-zinc-200">https://exemplo.org/pagina-de-teste</span>
            </div>

            {/* Pulsing Permission Indicator Button */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSimulatedGranted(!simulatedGranted)}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition ${
                  simulatedGranted
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-blue-950 text-blue-300 border border-blue-800 animate-pulse'
                }`}
                title="Clique para alternar o diálogo de permissão do Firefox"
              >
                {activeTab === 'screen' ? <Monitor className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                <span>{simulatedGranted ? 'Permissão Ativa' : 'Solicitando Acesso'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area with Firefox Permission Prompt Modal */}
        <div className="p-6 bg-[#08080a] relative min-h-[220px] flex items-center justify-center">
          {activeTab === 'screen' && (
            <div className="max-w-md w-full bg-[#1c1c24] border border-white/[0.12] rounded-xl p-4 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-950/80 border border-blue-800/60 flex items-center justify-center text-blue-400 flex-shrink-0">
                  <Monitor className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-white">
                    Permitir que a extensão acesse a tela desta aba?
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    A extensão <strong>Gemini Screen Translator</strong> precisa ler a área visível para realizar o OCR e traduzir o texto selecionado.
                  </p>
                </div>
              </div>

              <div className="bg-black/60 border border-white/[0.06] rounded-lg p-2.5 text-xs text-zinc-300 space-y-2 font-sans">
                <div className="flex items-center justify-between text-[11.5px]">
                  <span className="text-zinc-400">Janela ou Ecrã a partilhar:</span>
                  <span className="font-semibold text-white bg-zinc-800 px-2 py-0.5 rounded border border-white/[0.06]">
                    Aba Atual (Apenas leitura visual)
                  </span>
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
                  <input
                    type="checkbox"
                    checked={rememberDecision}
                    onChange={(e) => setRememberDecision(e.target.checked)}
                    className="rounded bg-zinc-800 border-white/[0.2] text-white focus:ring-0"
                  />
                  <span className="text-[11px] text-zinc-300">
                    Lembrar esta decisão para esta sessão
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => setSimulatedGranted(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white transition"
                >
                  Não permitir
                </button>
                <button
                  onClick={() => setSimulatedGranted(true)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                    simulatedGranted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  {simulatedGranted ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Concedido com Sucesso!</span>
                    </>
                  ) : (
                    <span>Permitir</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'mic' && (
            <div className="max-w-md w-full bg-[#1c1c24] border border-white/[0.12] rounded-xl p-4 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-rose-950/80 border border-rose-800/60 flex items-center justify-center text-rose-400 flex-shrink-0">
                  <Mic className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-white">
                    Permitir uso de áudio e síntese de voz (TTS)?
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    O recurso de pronúncia em áudio da extensão requer autorização de reprodução na página ativa para ler o texto em voz alta.
                  </p>
                </div>
              </div>

              <div className="bg-black/60 border border-white/[0.06] rounded-lg p-2.5 text-xs text-zinc-300 space-y-2">
                <div className="flex items-center justify-between text-[11.5px]">
                  <span className="text-zinc-400">Reprodução Automática:</span>
                  <span className="font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    Permitir áudio e vídeo
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11.5px]">
                  <span className="text-zinc-400">Dispositivo de Microfone:</span>
                  <span className="text-zinc-300">Microfone Interno Padrão</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => setSimulatedGranted(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white transition"
                >
                  Bloquear
                </button>
                <button
                  onClick={() => setSimulatedGranted(true)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                    simulatedGranted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-600 hover:bg-rose-500 text-white'
                  }`}
                >
                  {simulatedGranted ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Áudio Autorizado!</span>
                    </>
                  ) : (
                    <span>Permitir Áudio</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-md w-full bg-[#1c1c24] border border-white/[0.12] rounded-xl p-4 shadow-2xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-white pb-2 border-b border-white/[0.06]">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>Firefox • about:preferences#privacy (Permissões Globais)</span>
              </div>

              <div className="space-y-2.5 text-xs text-zinc-300">
                <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-3.5 h-3.5 text-blue-400" />
                    <span>Compartilhamento de Ecrã / Janela</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    Permitido ✓
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <Mic className="w-3.5 h-3.5 text-rose-400" />
                    <span>Microfone & Áudio</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    Permitido ✓
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Reprodução Automática</span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded">
                    Permitir áudio e vídeo
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step by Step Instruction Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-[#0b0b0e] border border-white/[0.06] rounded-xl p-3.5 space-y-2">
          <div className="w-6 h-6 rounded-md bg-zinc-800 text-white font-mono text-xs font-bold flex items-center justify-center border border-white/[0.08]">
            1
          </div>
          <h4 className="text-xs font-semibold text-white">
            Navegar para uma Página Externa
          </h4>
          <p className="text-[11.5px] text-zinc-400 leading-relaxed">
            Nunca execute os atalhos dentro de <code>about:debugging</code> ou <code>about:addons</code>. Abra um site comum como <em>wikipedia.org</em>.
          </p>
        </div>

        <div className="bg-[#0b0b0e] border border-white/[0.06] rounded-xl p-3.5 space-y-2">
          <div className="w-6 h-6 rounded-md bg-zinc-800 text-white font-mono text-xs font-bold flex items-center justify-center border border-white/[0.08]">
            2
          </div>
          <h4 className="text-xs font-semibold text-white">
            Pressionar Atalho & Conceder
          </h4>
          <p className="text-[11.5px] text-zinc-400 leading-relaxed">
            Pressione <kbd className="font-mono text-white bg-zinc-800 px-1 py-0.5 rounded border border-white/[0.1]">Alt+Shift+T</kbd>. Quando o diálogo do Firefox surgir, clique em <strong>"Permitir"</strong>.
          </p>
        </div>

        <div className="bg-[#0b0b0e] border border-white/[0.06] rounded-xl p-3.5 space-y-2">
          <div className="w-6 h-6 rounded-md bg-zinc-800 text-white font-mono text-xs font-bold flex items-center justify-center border border-white/[0.08]">
            3
          </div>
          <h4 className="text-xs font-semibold text-white">
            Desbloquear em caso de Erro
          </h4>
          <p className="text-[11.5px] text-zinc-400 leading-relaxed">
            Se bloquear sem querer, clique no ícone de <strong>cadeado/permissões</strong> à esquerda da URL e altere a permissão para <strong>Permitir</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};
