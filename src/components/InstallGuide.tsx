import React, { useState } from 'react';
import {
  Laptop,
  Smartphone,
  Copy,
  Check,
  BookOpen,
  ShieldCheck,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { FirefoxPermissionsGuide } from './FirefoxPermissionsGuide';

export const InstallGuide: React.FC = () => {
  const [platform, setPlatform] = useState<'desktop' | 'android'>('desktop');
  const [copiedPath, setCopiedPath] = useState<boolean>(false);

  const handleCopyDebuggingPath = async () => {
    try {
      await navigator.clipboard.writeText('about:debugging#/runtime/this-firefox');
      setCopiedPath(true);
      setTimeout(() => setCopiedPath(false), 1800);
    } catch (_e) {}
  };

  return (
    <div className="flex flex-col gap-4 max-w-4xl mx-auto font-sans">
      {/* 1. Guia Header Banner */}
      <div className="bg-[#0c0c0e] border border-white/[0.08] p-4 rounded-lg shadow-lg flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-black border border-white/[0.1] flex items-center justify-center text-white flex-shrink-0">
            <BookOpen className="w-4 h-4 text-zinc-300" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              <span>Guia de Instalação Oficial (about:debugging)</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.08] text-zinc-300 border border-white/[0.08]">
                Manifest V3
              </span>
            </h2>
            <p className="text-[11.5px] text-zinc-400 mt-0.5">
              Instruções passo a passo para carregar a extensão no Mozilla Firefox Desktop e no Firefox para Android sem necessidade de assinatura prévia.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 bg-black/60 px-2.5 py-1.5 rounded border border-white/[0.06]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Zero Telemetria</span>
        </div>
      </div>

      {/* 2. Platform Selector Tabs: Desktop vs Android */}
      <div className="grid grid-cols-2 gap-2 bg-[#0c0c0e] p-1 rounded-lg border border-white/[0.08]">
        <button
          onClick={() => setPlatform('desktop')}
          className={`py-2 px-3 rounded text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
            platform === 'desktop'
              ? 'bg-zinc-800 text-white shadow-sm border border-white/10'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Laptop className="w-3.5 h-3.5" />
          <span>Firefox Desktop (Computador)</span>
        </button>

        <button
          onClick={() => setPlatform('android')}
          className={`py-2 px-3 rounded text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
            platform === 'android'
              ? 'bg-zinc-800 text-white shadow-sm border border-white/10'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Firefox Android (Mobile)</span>
        </button>
      </div>

      {/* 3. Steps Content */}
      {platform === 'desktop' ? (
        <div className="space-y-3">
          {/* Step 1 */}
          <div className="bg-[#0c0c0e] border border-white/[0.08] rounded-lg p-3.5 flex gap-3.5 items-start">
            <div className="w-6 h-6 rounded bg-zinc-800 text-white font-mono text-xs font-bold flex items-center justify-center flex-shrink-0 border border-white/[0.08]">
              1
            </div>
            <div className="space-y-1 text-xs flex-1">
              <h3 className="font-semibold text-white">Obter e Descompactar o Pacote .zip</h3>
              <p className="text-zinc-400 leading-relaxed">
                Baixe o pacote na aba <strong>"Configurações & Atalhos"</strong> e extraia o arquivo <code>.zip</code> em uma pasta local do seu computador. A pasta conterá o arquivo <code>manifest.json</code>, os scripts e ícones.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-[#0c0c0e] border border-white/[0.08] rounded-lg p-3.5 flex gap-3.5 items-start">
            <div className="w-6 h-6 rounded bg-zinc-800 text-white font-mono text-xs font-bold flex items-center justify-center flex-shrink-0 border border-white/[0.08]">
              2
            </div>
            <div className="space-y-1.5 text-xs flex-1">
              <h3 className="font-semibold text-white">Acessar a página about:debugging no Firefox</h3>
              <p className="text-zinc-400 leading-relaxed">
                Abra uma nova aba no Mozilla Firefox e digite o endereço abaixo na barra de navegação:
              </p>
              <div className="flex items-center justify-between bg-black px-3 py-2 rounded border border-white/[0.08] font-mono text-xs text-zinc-300">
                <span>about:debugging#/runtime/this-firefox</span>
                <button
                  onClick={handleCopyDebuggingPath}
                  className="text-zinc-400 hover:text-white transition flex items-center gap-1 text-[11px] cursor-pointer"
                  title="Copiar endereço"
                >
                  {copiedPath ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPath ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-[#0c0c0e] border border-white/[0.08] rounded-lg p-3.5 flex gap-3.5 items-start">
            <div className="w-6 h-6 rounded bg-zinc-800 text-white font-mono text-xs font-bold flex items-center justify-center flex-shrink-0 border border-white/[0.08]">
              3
            </div>
            <div className="space-y-1 text-xs flex-1">
              <h3 className="font-semibold text-white">Carregar Extensão Temporária</h3>
              <p className="text-zinc-400 leading-relaxed">
                Na seção <em>"Extensões Temporárias"</em>, clique no botão <strong>"Carregar extensão temporária..."</strong> (Load Temporary Add-on) e selecione o arquivo <strong><code>manifest.json</code></strong> dentro da pasta descompactada.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-[#0c0c0e] border border-white/[0.08] rounded-lg p-3.5 flex gap-3.5 items-start">
            <div className="w-6 h-6 rounded bg-zinc-800 text-white font-mono text-xs font-bold flex items-center justify-center flex-shrink-0 border border-white/[0.08]">
              4
            </div>
            <div className="space-y-2 text-xs flex-1">
              <h3 className="font-semibold text-white">Como Utilizar no Firefox Desktop</h3>
              <p className="text-zinc-400 leading-relaxed">
                Com a extensão carregada, você pode acionar a tradução a qualquer momento:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-300">
                <div className="bg-black/60 p-2.5 rounded border border-white/[0.06] flex items-start gap-2">
                  <span className="font-mono text-white bg-zinc-800 px-1.5 py-0.5 rounded text-[11px]">Alt+Shift+T</span>
                  <div>
                    <strong className="block text-white text-[11.5px]">Captura Livre:</strong>
                    <span className="text-[10.5px] text-zinc-400">Arraste o mouse para recortar qualquer texto de jogos ou páginas.</span>
                  </div>
                </div>
                <div className="bg-black/60 p-2.5 rounded border border-white/[0.06] flex items-start gap-2">
                  <span className="font-mono text-white bg-zinc-800 px-1.5 py-0.5 rounded text-[11px]">Alt+Shift+R</span>
                  <div>
                    <strong className="block text-white text-[11.5px]">Zona Fixa:</strong>
                    <span className="text-[10.5px] text-zinc-400">Traduz instantaneamente a última área memorizada sem precisar redesenhar.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Permissions visual guidance */}
          <FirefoxPermissionsGuide />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Method A */}
          <div className="bg-[#0c0c0e] border border-white/[0.08] rounded-lg p-3.5 flex gap-3.5 items-start">
            <div className="w-6 h-6 rounded bg-zinc-800 text-white font-mono text-xs font-bold flex items-center justify-center flex-shrink-0 border border-white/[0.08]">
              A
            </div>
            <div className="space-y-1.5 text-xs flex-1">
              <h3 className="font-semibold text-white">Depuração Remota via USB (Método Oficial Mozilla)</h3>
              <p className="text-zinc-400 leading-relaxed">
                1. Ative a <strong>Depuração USB</strong> nas opções de desenvolvedor do seu aparelho Android.<br />
                2. Conecte o celular ao computador via cabo USB.<br />
                3. No Firefox Desktop, acesse <code>about:debugging</code> e clique no seu dispositivo em <em>"Dispositivos USB"</em>.<br />
                4. Clique em <strong>"Carregar extensão temporária..."</strong> e selecione o <code>manifest.json</code>.
              </p>
            </div>
          </div>

          {/* Method B */}
          <div className="bg-[#0c0c0e] border border-white/[0.08] rounded-lg p-3.5 flex gap-3.5 items-start">
            <div className="w-6 h-6 rounded bg-zinc-800 text-white font-mono text-xs font-bold flex items-center justify-center flex-shrink-0 border border-white/[0.08]">
              B
            </div>
            <div className="space-y-1.5 text-xs flex-1">
              <h3 className="font-semibold text-white">Firefox Nightly / Beta para Android (Coleção AMO)</h3>
              <p className="text-zinc-400 leading-relaxed">
                1. No Firefox Nightly ou Beta no celular, vá em <strong>Configurações &gt; Sobre o Firefox</strong>.<br />
                2. Toque <strong>5 vezes no logotipo do Firefox</strong> para desbloquear as opções de desenvolvedor.<br />
                3. Adicione sua coleção personalizada contendo a extensão para instalar sem cabo diretamente no celular.
              </p>
            </div>
          </div>

          {/* Method C */}
          <div className="bg-[#0c0c0e] border border-white/[0.08] rounded-lg p-3.5 flex gap-3.5 items-start">
            <div className="w-6 h-6 rounded bg-zinc-800 text-white font-mono text-xs font-bold flex items-center justify-center flex-shrink-0 border border-white/[0.08]">
              C
            </div>
            <div className="space-y-2 text-xs flex-1">
              <h3 className="font-semibold text-white">Como Usar no Firefox Android</h3>
              <p className="text-zinc-400 leading-relaxed">
                Utilize os recursos táteis adaptados para telas móveis:
              </p>
              <div className="bg-black/60 p-3 rounded border border-white/[0.06] space-y-1.5 text-zinc-300 text-[11.5px]">
                <div>👉 <strong>1 toque no Botão Flutuante (FAB):</strong> Traduz a zona fixa instantaneamente.</div>
                <div>👉 <strong>Segurar o Botão Flutuante (Long Press):</strong> Abre a seleção para desenhar uma nova zona com animação tátil fluida.</div>
                <div>👉 <strong>Menu de 3 pontos (⋮):</strong> Acesse <em>Extensões &gt; Gemini Screen Translator</em> para acionar a qualquer instante.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info Banner */}
      <div className="bg-[#08080a] border border-white/[0.06] rounded-lg p-3 text-xs text-zinc-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
          <span>Para customizar chaves, atalhos, versão e baixar o pacote .zip, acerte a aba <strong>Configurações & Atalhos</strong>.</span>
        </span>
        <span className="font-mono text-[10.5px] text-zinc-500">Firefox MV3</span>
      </div>
    </div>
  );
};
