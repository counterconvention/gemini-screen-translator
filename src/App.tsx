import React, { useState, useEffect } from 'react';
import {
  Download,
  ShieldCheck,
} from 'lucide-react';
import { OptionsPreview } from './components/OptionsPreview';
import { downloadExtensionZip } from './utils/zipExporter';
import { getExtensionConfig, ExtensionConfig } from './utils/extensionConfig';

export default function App() {
  return (
    <div className="min-h-screen bg-[#000000] text-zinc-100 flex flex-col font-sans selection:bg-white selection:text-black">
      {/* Main View: Configurações & Empacotador Padronizado */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">
        <OptionsPreview />
      </main>
    </div>
  );
}
