import React, { useState, useRef, useEffect } from 'react';
import {
  RotateCcw,
  Upload,
  AlertCircle,
  Move,
  Type,
  Laptop,
  Smartphone,
  Check,
  MoreVertical,
  Table as TableIcon
} from 'lucide-react';

interface FontSample {
  id: string;
  name: string;
  fontCategory: string;
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
}

export const Simulator: React.FC = () => {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [showMobileFab, setShowMobileFab] = useState<boolean>(true);

  const [selectedFontId, setSelectedFontId] = useState<string>('dialog_table');
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState<string>('Português (Brasil)');
  const [model, setModel] = useState<string>('gemini-3.1-flash-lite');

  // Selection states
  const [isOverlayActive, setIsOverlayActive] = useState<boolean>(false);
  const [isDrawingSelection, setIsDrawingSelection] = useState<boolean>(false);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Memorized area for Atalho 2 (Área Fixa)
  const [memorizedArea, setMemorizedArea] = useState<{ x: number; y: number; w: number; h: number } | null>({
    x: 24,
    y: 50,
    w: 380,
    h: 220,
  });

  // Fixed dimensions for the translation window
  const FIXED_WIDTH = 320;
  const FIXED_HEIGHT = 180;
  const [panelPos, setPanelPos] = useState<{ x: number; y: number }>({ x: 24, y: 32 });

  // Translation Panel state
  // Status: 'idle' ("Tradutor"), 'translating' ("Traduzindo..."), 'translated' ("Traduzido"), 'error' ("Erro")
  const [panelStatus, setPanelStatus] = useState<'idle' | 'translating' | 'translated' | 'error'>('idle');
  const [panelVisible, setPanelVisible] = useState<boolean>(false);
  const [translationText, setTranslationText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number>(0);

  // Dragging state for the fixed window
  const [isPanelDragging, setIsPanelDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    startX: number;
    startY: number;
  }>({
    pointerX: 0,
    pointerY: 0,
    startX: 24,
    startY: 32,
  });

  const contentAreaRef = useRef<HTMLDivElement>(null);
  const scenarioCanvasRef = useRef<HTMLCanvasElement>(null);

  const formatLangCode = (lang: string) => {
    const s = lang.toLowerCase();
    if (s.includes('português') || s.includes('brasil')) return 'PT-BR';
    if (s.includes('inglês') || s.includes('english')) return 'EN_US';
    if (s.includes('espanhol') || s.includes('español')) return 'ES-ES';
    if (s.includes('francês') || s.includes('français')) return 'FR-FR';
    if (s.includes('alemão') || s.includes('deutsch')) return 'DE-DE';
    if (s.includes('japonês') || s.includes('nihongo')) return 'JA-JP';
    return lang.toUpperCase().slice(0, 5);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && (e.key === 'T' || e.key === 't')) {
        e.preventDefault();
        toggleFreeSelection();
      } else if (e.key === 'Escape' && isOverlayActive) {
        cancelSelection();
      } else if (e.altKey && e.shiftKey && (e.key === 'R' || e.key === 'r')) {
        e.preventDefault();
        triggerFixedAreaRepeat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOverlayActive, memorizedArea, panelPos, targetLang, model]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const toggleFreeSelection = () => {
    if (isOverlayActive) {
      cancelSelection();
    } else {
      setIsOverlayActive(true);
      setSelectionBox(null);
      setIsMobileMenuOpen(false);
    }
  };

  const cancelSelection = () => {
    setIsOverlayActive(false);
    setIsDrawingSelection(false);
    setSelectionBox(null);
  };

  // Font test templates with standardized, non-shifting table layout
  const fontSamples: FontSample[] = [
    {
      id: 'dialog_table',
      name: 'Tabela de Diálogos & Stats (EN)',
      fontCategory: 'RPG Data Grid / Tabela Padronizada',
      draw: (ctx, width, height) => {
        ctx.fillStyle = '#08080a';
        ctx.fillRect(0, 0, width, height);

        const tableX = 24;
        const tableY = 28;
        const tableW = width - 48;
        const rowH = 34;
        const headerH = 36;

        // Table title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px ui-monospace, SFMono-Regular, monospace';
        ctx.fillText('QUEST & DIALOGUE LOG • ACT IV (ENGLISH)', tableX, tableY - 10);

        // Header background
        ctx.fillStyle = '#141418';
        ctx.fillRect(tableX, tableY, tableW, headerH);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.strokeRect(tableX, tableY, tableW, headerH);

        // Column widths
        const col1 = Math.round(tableW * 0.22);
        const col2 = Math.round(tableW * 0.20);
        const col3 = tableW - col1 - col2;

        ctx.fillStyle = '#a1a1aa';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.fillText('CHARACTER', tableX + 12, tableY + 22);
        ctx.fillText('STATUS / LOCATION', tableX + col1 + 12, tableY + 22);
        ctx.fillText('ACTIVE DIALOGUE / INSTRUCTION', tableX + col1 + col2 + 12, tableY + 22);

        const rows = [
          { speaker: 'Eldric the Mage', status: 'Crypt Entry [Active]', text: '"Only the sacred flame shall unlock the sealed corridor."' },
          { speaker: 'Commander Sarah', status: 'Hangar Bay B', text: '"Prepare all defensive artillery. The swarm approaches at dusk."' },
          { speaker: 'Ancient Tablet', status: 'Sanctuary Ruins', text: '"Those who carry the obsidian relic need fear no phantom."' },
          { speaker: 'System AI', status: 'Firmware 4.19', text: '"Shield depleted to 14%. Press [SPACE] to reboot power cells."' },
          { speaker: 'Merchant Rowan', status: 'Crossroads Camp', text: '"Special offer: Dragonscale armor for 350 gold shards today."' },
          { speaker: 'Mysterious Stranger', status: 'Tavern Corner', text: '"Meet me behind the old clock tower when the clock strikes twelve."' },
          { speaker: 'Quest Objective', status: 'Primary Quest', text: '"Locate the three celestial fragments before midnight arrives."' },
        ];

        rows.forEach((row, i) => {
          const cy = tableY + headerH + i * rowH;
          if (cy + rowH > height - 12) return;

          ctx.fillStyle = i % 2 === 0 ? '#0d0d10' : '#101014';
          ctx.fillRect(tableX, cy, tableW, rowH);

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
          ctx.strokeRect(tableX, cy, tableW, rowH);

          // Speaker
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11.5px system-ui, sans-serif';
          ctx.fillText(row.speaker, tableX + 12, cy + 21);

          // Status
          ctx.fillStyle = '#a1a1aa';
          ctx.font = '10.5px ui-monospace, monospace';
          ctx.fillText(row.status, tableX + col1 + 12, cy + 21);

          // Dialogue text
          ctx.fillStyle = '#e4e4e7';
          ctx.font = '11.5px system-ui, sans-serif';
          ctx.fillText(row.text, tableX + col1 + col2 + 12, cy + 21);
        });
      },
    },
    {
      id: 'game_controls',
      name: 'Controles de Jogos (EN)',
      fontCategory: 'Gaming UI / Instruções',
      draw: (ctx, width, height) => {
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        for (let y = 0; y < height; y += 32) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        const startX = 28;
        let startY = 40;

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px ui-monospace, monospace';
        ctx.fillText('TACTICAL COMBAT & CONTROL MAPPINGS (ACT III)', startX, startY);

        startY += 30;

        const items = [
          { key: 'ENTER / SPACE / TAP', desc: 'Advance dialogue and confirm interaction' },
          { key: 'SWIPE / ARROWS', desc: 'Navigate dialogue tree and tactical decisions' },
          { key: 'HOLD BUTTON 3s', desc: 'Fast-forward previous cutscenes' },
          { key: 'LOG BUTTON [L]', desc: 'Review historical conversation transcript' },
          { key: 'INVENTORY [TAB]', desc: 'Access potions, scrolls, and enchanted relics' },
          { key: 'QUICK DODGE [SHIFT]', desc: 'Evade incoming elemental projectile attack' },
        ];

        items.forEach((item) => {
          ctx.fillStyle = '#f4f4f5';
          ctx.font = 'bold 12.5px system-ui, -apple-system, sans-serif';
          ctx.fillText(item.key, startX, startY);

          ctx.fillStyle = '#a1a1aa';
          ctx.font = '11.5px system-ui, -apple-system, sans-serif';
          ctx.fillText(item.desc, startX, startY + 16);

          startY += 38;
        });
      },
    },
    {
      id: 'pixel_art',
      name: 'Pixel Art 8-Bit (EN)',
      fontCategory: 'Retrô Arcade / RPG',
      draw: (ctx, width, height) => {
        ctx.fillStyle = '#08080a';
        ctx.fillRect(0, 0, width, height);

        const bx = 24;
        const by = 28;
        const bw = width - 48;
        const bh = height - 56;

        ctx.fillStyle = '#101014';
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx, by, bw, bh);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px ui-monospace, Courier, monospace';
        ctx.fillText('*** LEVEL 24 - SHADOW CAVE ***', bx + 20, by + 32);

        ctx.font = '12px ui-monospace, Courier, monospace';
        ctx.fillStyle = '#ededed';
        ctx.fillText('HERO: "THE ANCIENT STONE GATE IS LOCKED."', bx + 20, by + 72);
        ctx.fillText('SYSTEM: INSERT 3 RUNES TO BREAK BARRIER.', bx + 20, by + 104);
        ctx.fillText('WARNING: DEFENSE TURRET ACTIVE! HP -150.', bx + 20, by + 136);
        ctx.fillText('TAP [DODGE] TO AVOID INCOMING FIREBALL.', bx + 20, by + 168);
        ctx.fillText('[EQUIP SWORD] [CAST HEAL] [FLEE BATTLE]', bx + 20, by + 210);
      },
    },
    {
      id: 'japanese_manga',
      name: 'Mangá & Legenda (JP)',
      fontCategory: 'Japonês Kanji / Katakana',
      draw: (ctx, width, height) => {
        ctx.fillStyle = '#09090b';
        ctx.fillRect(0, 0, width, height);

        const bx = 24;
        const by = 28;
        const bw = width - 48;
        const bh = height - 56;

        ctx.fillStyle = '#121215';
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.strokeRect(bx, by, bw, bh);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText('任務完了：新しいスキル「疾風斬」を習得！', bx + 20, by + 42);

        ctx.font = '13px sans-serif';
        ctx.fillStyle = '#d4d4d8';
        ctx.fillText('経験値を 4,500 EXP 獲得しました。レベルアップ！', bx + 20, by + 82);
        ctx.fillText('次の目的地：王都エルシオンの中央広場へ向かえ。', bx + 20, by + 118);
        ctx.fillText('長老：『若者よ、闇の霧が晴れるまで気を抜くな。』', bx + 20, by + 154);

        ctx.fillStyle = '#a1a1aa';
        ctx.font = '11.5px ui-monospace, monospace';
        ctx.fillText('[タップ] 次の会話へ進む   [スキップ]', bx + 20, by + 205);
      },
    },
    {
      id: 'cyberpunk_sci_fi',
      name: 'Cyberpunk HUD',
      fontCategory: 'Sci-Fi / Terminal',
      draw: (ctx, width, height) => {
        ctx.fillStyle = '#070709';
        ctx.fillRect(0, 0, width, height);

        const bx = 24;
        const by = 28;
        const bw = width - 48;
        const bh = height - 56;

        ctx.fillStyle = '#0e0e12';
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.strokeRect(bx, by, bw, bh);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px ui-monospace, monospace';
        ctx.fillText('TERMINAL_ID: // NEON-DISTRICT-SUBLEVEL-09', bx + 18, by + 30);

        ctx.font = '12px ui-monospace, monospace';
        ctx.fillStyle = '#f4f4f5';
        ctx.fillText('[STATUS] OVERRIDE IN PROGRESS: 78%', bx + 18, by + 70);
        ctx.fillText('> DETECTED MALICIOUS PACKET IN SYSTEM.', bx + 18, by + 100);
        ctx.fillText('> DISABLING SECURITY TURRETS IN HANGAR B.', bx + 18, by + 130);
        ctx.fillText('> POWER COUPLING DETACHED. PRESSURE DROPPING.', bx + 18, by + 160);

        ctx.fillStyle = '#a1a1aa';
        ctx.font = '11px ui-monospace, monospace';
        ctx.fillText('[TAP SCREEN TO EXECUTE CIPHER SEQUENCE]', bx + 18, by + bh - 20);
      },
    },
  ];

  const currentFont = fontSamples.find((f) => f.id === selectedFontId) || fontSamples[0];

  useEffect(() => {
    if (customImage) return;
    const canvas = scenarioCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    currentFont.draw(ctx, canvas.width, canvas.height);
  }, [selectedFontId, customImage, currentFont, deviceMode]);

  const executeTranslation = async (area: { x: number; y: number; w: number; h: number }) => {
    setPanelVisible(true);
    setPanelStatus('translating');
    setTranslationText('');
    setErrorMessage(null);

    try {
      const croppedJpeg = await cropAreaFromActiveCanvas(area.x, area.y, area.w, area.h);

      if (latencyMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, latencyMs));
      }

      const res = await fetch('/api/translate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: croppedJpeg,
          mimeType: 'image/jpeg',
          targetLanguage: targetLang,
          model,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro na resposta do Gemini.');

      setTranslationText(data.translation);
      setPanelStatus('translated');
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao processar área.');
      setPanelStatus('error');
    }
  };

  const triggerFixedAreaRepeat = async () => {
    if (!memorizedArea) {
      showToast('Nenhuma área memorizada. Use a seleção primeiro.');
      return;
    }
    await executeTranslation(memorizedArea);
  };

  const triggerFullViewportTranslation = async () => {
    cancelSelection();
    if (!contentAreaRef.current) return;
    const rect = {
      x: 0,
      y: 0,
      w: contentAreaRef.current.clientWidth,
      h: contentAreaRef.current.clientHeight,
    };
    setMemorizedArea(rect);
    await executeTranslation(rect);
  };

  const cropAreaFromActiveCanvas = (x: number, y: number, w: number, h: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const cropW = Math.max(1, Math.round(w));
        const cropH = Math.max(1, Math.round(h));

        let targetW = cropW;
        let targetH = cropH;
        if (targetW > 1024) {
          const ratio = 1024 / targetW;
          targetW = 1024;
          targetH = Math.round(cropH * ratio);
        }

        const outCanvas = document.createElement('canvas');
        outCanvas.width = targetW;
        outCanvas.height = targetH;
        const outCtx = outCanvas.getContext('2d');
        if (!outCtx) return reject(new Error('Canvas indisponível.'));

        outCtx.imageSmoothingEnabled = true;
        outCtx.imageSmoothingQuality = 'medium';

        if (customImage && contentAreaRef.current) {
          const imgEl = contentAreaRef.current.querySelector('img.custom-crop-target') as HTMLImageElement;
          if (imgEl && imgEl.naturalWidth) {
            const scaleX = imgEl.naturalWidth / imgEl.clientWidth;
            const scaleY = imgEl.naturalHeight / imgEl.clientHeight;
            outCtx.drawImage(
              imgEl,
              x * scaleX,
              y * scaleY,
              cropW * scaleX,
              cropH * scaleY,
              0,
              0,
              targetW,
              targetH
            );
            return resolve(outCanvas.toDataURL('image/jpeg', 0.75));
          }
        }

        const sourceCanvas = scenarioCanvasRef.current;
        if (!sourceCanvas) return reject(new Error('Canvas indisponível.'));

        const scaleX = sourceCanvas.width / (contentAreaRef.current?.clientWidth || sourceCanvas.width);
        const scaleY = sourceCanvas.height / (contentAreaRef.current?.clientHeight || sourceCanvas.height);

        const sx = Math.max(0, Math.min(sourceCanvas.width - 2, x * scaleX));
        const sy = Math.max(0, Math.min(sourceCanvas.height - 2, y * scaleY));
        const sw = Math.max(1, Math.min(sourceCanvas.width - sx, cropW * scaleX));
        const sh = Math.max(1, Math.min(sourceCanvas.height - sy, cropH * scaleY));

        outCtx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, targetW, targetH);
        resolve(outCanvas.toDataURL('image/jpeg', 0.75));
      } catch (err) {
        reject(err);
      }
    });
  };

  const handleStartPointer = (clientX: number, clientY: number) => {
    if (!isOverlayActive || !contentAreaRef.current) return;
    const rect = contentAreaRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));

    startPosRef.current = { x, y };
    setIsDrawingSelection(true);
    setSelectionBox({ x, y, w: 0, h: 0 });
  };

  const handleMovePointer = (clientX: number, clientY: number) => {
    if (isDrawingSelection && contentAreaRef.current) {
      const rect = contentAreaRef.current.getBoundingClientRect();
      const currentX = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const currentY = Math.max(0, Math.min(rect.height, clientY - rect.top));

      const left = Math.min(startPosRef.current.x, currentX);
      const top = Math.min(startPosRef.current.y, currentY);
      const w = Math.abs(currentX - startPosRef.current.x);
      const h = Math.abs(currentY - startPosRef.current.y);

      setSelectionBox({ x: left, y: top, w, h });
      return;
    }

    if (isPanelDragging && contentAreaRef.current) {
      const deltaX = clientX - dragStartRef.current.pointerX;
      const deltaY = clientY - dragStartRef.current.pointerY;
      const maxW = contentAreaRef.current.clientWidth - FIXED_WIDTH - 8;
      const maxH = contentAreaRef.current.clientHeight - FIXED_HEIGHT - 8;
      const newX = Math.max(8, Math.min(maxW, dragStartRef.current.startX + deltaX));
      const newY = Math.max(8, Math.min(maxH, dragStartRef.current.startY + deltaY));

      setPanelPos({ x: newX, y: newY });
    }
  };

  const handleEndPointer = async () => {
    if (isPanelDragging) {
      setIsPanelDragging(false);
      return;
    }

    if (!isDrawingSelection || !selectionBox || !contentAreaRef.current) return;
    setIsDrawingSelection(false);
    setIsOverlayActive(false);

    const { x, y, w, h } = selectionBox;
    if (w < 10 || h < 10) {
      setSelectionBox(null);
      return;
    }

    const rect = { x, y, w, h };
    setMemorizedArea(rect);
    await executeTranslation(rect);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('.sim-panel') || (e.target as HTMLElement).closest('.sim-mobile-bar')) return;
    handleStartPointer(e.clientX, e.clientY);
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMovePointer(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleEndPointer();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!e.touches || e.touches.length === 0) return;
    if ((e.target as HTMLElement).closest('.sim-panel') || (e.target as HTMLElement).closest('.sim-mobile-bar')) return;
    const t = e.touches[0];
    handleStartPointer(t.clientX, t.clientY);
    e.preventDefault();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!e.touches || e.touches.length === 0) return;
    const t = e.touches[0];
    handleMovePointer(t.clientX, t.clientY);
    e.preventDefault();
  };

  const handleTouchEnd = () => {
    handleEndPointer();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomImage(event.target?.result as string);
        setSelectedFontId('custom');
      };
      reader.readAsDataURL(file);
    }
  };

  const interactiveTitleLabel = () => {
    if (panelStatus === 'translating') {
      return (
        <span className="flex items-center text-white font-semibold">
          Traduzindo
          <span className="inline-flex ml-0.5 tracking-widest">
            <span className="animate-pulse">.</span>
            <span className="animate-pulse [animation-delay:200ms]">.</span>
            <span className="animate-pulse [animation-delay:400ms]">.</span>
          </span>
        </span>
      );
    }
    if (panelStatus === 'translated') {
      return <span className="text-white font-semibold">Traduzido</span>;
    }
    if (panelStatus === 'error') {
      return <span className="text-red-400 font-semibold">Erro</span>;
    }
    return <span className="text-white font-semibold">Tradutor</span>;
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Top Toolbar: Clean, Standardized & Minimalist */}
      <div className="bg-[#0c0c0e] border border-white/[0.08] p-2.5 rounded-lg flex flex-wrap items-center justify-between gap-3 shadow-md">
        {/* Device Mode Switch */}
        <div className="flex items-center gap-1 bg-black p-1 rounded border border-white/[0.08]">
          <button
            onClick={() => {
              setDeviceMode('desktop');
              setPanelPos({ x: 24, y: 32 });
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition flex items-center gap-1.5 cursor-pointer ${
              deviceMode === 'desktop'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Modo Desktop</span>
          </button>

          <button
            onClick={() => {
              setDeviceMode('mobile');
              setPanelPos({ x: 10, y: 30 });
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition flex items-center gap-1.5 cursor-pointer ${
              deviceMode === 'mobile'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Firefox Android (Mobile)</span>
            <span className="text-[9px] font-mono bg-white/[0.08] text-zinc-300 px-1 py-0.2 rounded border border-white/[0.08]">
              Touch
            </span>
          </button>
        </div>

        {/* Action Controls & Model */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Target Language Selector */}
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="bg-black border border-white/[0.1] px-2 py-1 text-xs text-zinc-300 focus:outline-none cursor-pointer rounded"
          >
            <option value="Português (Brasil)">Para: PT-BR</option>
            <option value="Inglês (US)">Para: EN_US</option>
            <option value="Espanhol">Para: ES-ES</option>
            <option value="Japonês">Para: JA-JP</option>
          </select>

          <select
            value={latencyMs}
            onChange={(e) => setLatencyMs(Number(e.target.value))}
            className="bg-black border border-white/[0.1] px-2 py-1 text-xs text-zinc-300 focus:outline-none cursor-pointer rounded"
            title="Latência da rede"
          >
            <option value="0">⚡ 0ms</option>
            <option value="800">⏳ 800ms</option>
          </select>

          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="bg-black border border-white/[0.1] px-2 py-1 text-xs text-zinc-300 focus:outline-none cursor-pointer rounded"
          >
            <option value="gemini-3.1-flash-lite">3.5 Flash Lite</option>
            <option value="gemini-3.8-flash">3.8 Flash</option>
          </select>

          <button
            onClick={toggleFreeSelection}
            className={`px-3 py-1 text-xs font-medium transition flex items-center gap-1.5 border cursor-pointer rounded ${
              isOverlayActive
                ? 'bg-white text-black border-white font-semibold'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-white/[0.1]'
            }`}
          >
            <Move className="w-3.5 h-3.5" />
            <span>{isOverlayActive ? 'Cancelar' : deviceMode === 'mobile' ? 'Recortar com Toque' : 'Capturar (Alt+Shift+T)'}</span>
          </button>
        </div>
      </div>

      {/* Scenario Selector: Standardized horizontal strip */}
      <div className="flex items-center gap-1.5 flex-wrap bg-[#08080a] p-2 rounded-lg border border-white/[0.06]">
        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1 mr-1">
          <TableIcon className="w-3 h-3 text-zinc-300" /> Cenários:
        </span>
        {fontSamples.map((f) => (
          <button
            key={f.id}
            onClick={() => {
              setSelectedFontId(f.id);
              setCustomImage(null);
              cancelSelection();
            }}
            className={`px-2.5 py-1 text-xs font-medium transition border cursor-pointer rounded ${
              selectedFontId === f.id && !customImage
                ? 'bg-zinc-800 text-white border-white/30 shadow-sm'
                : 'bg-zinc-900/60 text-zinc-400 border-white/[0.06] hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            {f.name}
          </button>
        ))}

        <label className="cursor-pointer px-2.5 py-1 text-xs font-medium bg-zinc-900/60 hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 border border-white/[0.06] transition flex items-center gap-1 rounded">
          <Upload className="w-3 h-3" />
          <span>Upload</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Main Simulation Viewport Container (Zero excess borders, zero shifting) */}
      <div className="flex items-center justify-center w-full">
        {deviceMode === 'desktop' ? (
          /* DESKTOP VIEWPORT */
          <div className="w-full bg-[#09090b] border border-white/[0.08] overflow-hidden shadow-xl flex flex-col rounded-lg">
            {/* Minimalist Firefox Desktop Titlebar */}
            <div className="bg-[#101014] px-3 py-2 border-b border-white/[0.06] flex items-center justify-between text-xs text-zinc-400 font-mono select-none">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-white"></span>
                <span className="text-white font-sans text-xs font-medium">Firefox Desktop • Visualizador de Captura</span>
                <span className="text-[10px] text-zinc-500">[{currentFont.fontCategory}]</span>
              </div>
              <span className="text-[11px] text-zinc-400">Atalho: Alt+Shift+T ou arraste o mouse</span>
            </div>

            {/* Desktop Canvas Screen */}
            <div
              ref={contentAreaRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="relative w-full h-[460px] overflow-hidden bg-[#070709] select-none touch-none"
            >
              {customImage ? (
                <div className="w-full h-full p-4 flex items-center justify-center bg-black">
                  <img
                    src={customImage}
                    alt="Custom target"
                    className="custom-crop-target max-h-[420px] max-w-full object-contain border border-zinc-800"
                  />
                </div>
              ) : (
                <canvas
                  ref={scenarioCanvasRef}
                  width={960}
                  height={460}
                  className="w-full h-full object-cover block"
                />
              )}

              {/* Selection Overlay */}
              {isOverlayActive && (
                <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px] z-30 cursor-crosshair">
                  <div className="sim-mobile-bar absolute top-3 left-1/2 -translate-x-1/2 bg-[#0e0e11]/95 text-zinc-200 border border-white/[0.15] text-[11px] font-medium px-4 py-1.5 shadow-2xl flex items-center gap-3">
                    <span>Arraste para selecionar a área • [ESC] cancelar</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerFullViewportTranslation();
                      }}
                      className="px-2 py-0.5 bg-white text-black font-semibold text-[10.5px] hover:bg-zinc-200 cursor-pointer"
                    >
                      Traduzir Tela Toda
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cancelSelection();
                      }}
                      className="text-zinc-400 hover:text-white cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {selectionBox && (
                    <div
                      style={{
                        left: `${selectionBox.x}px`,
                        top: `${selectionBox.y}px`,
                        width: `${selectionBox.w}px`,
                        height: `${selectionBox.h}px`,
                      }}
                      className="absolute border border-white bg-white/[0.04] shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] pointer-events-none"
                    >
                      <div className="absolute -bottom-5 right-0 bg-[#09090b] text-zinc-400 font-mono text-[9px] px-1 py-0.2 border border-white/10 whitespace-nowrap">
                        {Math.round(selectionBox.w)} × {Math.round(selectionBox.h)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Translation Window: Fixed Width & Height, Single Top Taskbar */}
              {panelVisible && (
                <div
                  style={{
                    left: `${panelPos.x}px`,
                    top: `${panelPos.y}px`,
                    width: `${FIXED_WIDTH}px`,
                    height: `${FIXED_HEIGHT}px`,
                  }}
                  className="sim-panel absolute z-40 bg-[#0c0c0e]/96 backdrop-blur-xl border border-white/[0.14] text-zinc-200 shadow-2xl flex flex-col overflow-hidden select-none"
                >
                  {/* Top Taskbar (Only bar in the window) */}
                  <div
                    onMouseDown={(e) => {
                      if ((e.target as HTMLElement).tagName === 'BUTTON') return;
                      setIsPanelDragging(true);
                      dragStartRef.current = {
                        pointerX: e.clientX,
                        pointerY: e.clientY,
                        startX: panelPos.x,
                        startY: panelPos.y,
                      };
                      e.preventDefault();
                    }}
                    className="h-8 px-2.5 bg-black/75 border-b border-white/[0.08] flex items-center justify-between cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                  >
                    {/* Left: Interactive Name ("Tradutor" / "Traduzindo..." / "Traduzido") */}
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      <span className="w-1.5 h-1.5 bg-white"></span>
                      {interactiveTitleLabel()}
                    </div>

                    {/* Right: Target Language Pill + Close Button */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9.5px] font-mono px-1.5 py-0.2 bg-white/[0.1] text-zinc-200 font-semibold border border-white/[0.08]">
                        {formatLangCode(targetLang)}
                      </span>
                      <button
                        onClick={() => {
                          setPanelVisible(false);
                          setPanelStatus('idle');
                        }}
                        className="text-zinc-400 hover:text-white p-0.5 text-xs transition cursor-pointer"
                        title="Fechar (ESC)"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Body: Purely the translated text, with scroll if text is long */}
                  <div className="p-3 overflow-y-auto text-xs flex-1 flex flex-col justify-start">
                    {panelStatus === 'translating' ? (
                      <div className="flex flex-col gap-2 py-2">
                        <div className="h-3 bg-white/[0.06] rounded animate-pulse w-3/4"></div>
                        <div className="h-3 bg-white/[0.06] rounded animate-pulse w-full"></div>
                        <div className="h-3 bg-white/[0.06] rounded animate-pulse w-1/2"></div>
                      </div>
                    ) : panelStatus === 'error' && errorMessage ? (
                      <div className="text-[11px] text-red-400 bg-red-950/20 p-2 border border-red-900/30">
                        {errorMessage}
                      </div>
                    ) : (
                      <div className="text-[12.5px] leading-relaxed text-zinc-100 whitespace-pre-wrap select-text font-sans">
                        {translationText || 'Texto traduzido aparecerá aqui diretamente após o recorte da área.'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* FIREFOX ANDROID (MOBILE DEVICE FRAME) */
          <div className="w-[340px] bg-[#0c0c0f] border border-zinc-700 rounded-3xl shadow-2xl p-2 flex flex-col relative overflow-hidden">
            {/* Phone Top Speaker */}
            <div className="w-16 h-3 bg-zinc-900 rounded-full mx-auto mb-1 flex items-center justify-center">
              <div className="w-6 h-1 rounded-full bg-zinc-800"></div>
            </div>

            {/* Android Status Bar */}
            <div className="px-3 pb-1 flex items-center justify-between text-[10px] font-mono text-zinc-400 select-none">
              <span>09:41</span>
              <div className="flex items-center gap-1.5 text-[9px]">
                <span>5G</span>
                <span>100%</span>
              </div>
            </div>

            {/* Firefox Android Address & Toolbar */}
            <div className="bg-[#18181c] border border-white/[0.08] rounded-lg px-2 py-1.5 flex items-center justify-between mb-1.5 select-none shadow-sm relative">
              <div className="flex items-center gap-1.5 text-zinc-300 text-xs flex-1 truncate">
                <span className="text-[10px] text-emerald-400">🔒</span>
                <span className="text-[11px] font-mono text-zinc-200 truncate">game-table.app/act-iv</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 border border-zinc-500 rounded text-[9px] font-mono text-zinc-300 flex items-center justify-center">
                  1
                </span>

                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className={`p-1 rounded text-zinc-300 hover:text-white transition cursor-pointer ${
                    isMobileMenuOpen ? 'bg-zinc-700 text-white' : ''
                  }`}
                  title="Menu do Firefox Android"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Simulated Firefox Android 3-Dot Add-ons Menu */}
              {isMobileMenuOpen && (
                <div className="absolute right-0 top-9 w-52 bg-[#16161a] border border-white/[0.15] rounded-lg shadow-2xl z-50 p-1.5 text-xs font-sans text-zinc-200">
                  <div className="px-2 py-1 text-[10px] font-mono text-zinc-400 uppercase tracking-wider border-b border-white/[0.06]">
                    Menu Firefox Android
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        toggleFreeSelection();
                      }}
                      className="w-full text-left px-2 py-1.5 rounded bg-zinc-800/80 hover:bg-zinc-700 text-white flex items-center justify-between transition cursor-pointer mt-0.5"
                    >
                      <span className="font-semibold text-xs">Gemini Screen Translator</span>
                      <span className="text-[9px] font-mono bg-white/[0.1] text-zinc-200 px-1 py-0.2 rounded">
                        Ativar
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Viewport Screen */}
            <div
              ref={contentAreaRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="relative w-full h-[480px] rounded-xl overflow-hidden bg-[#070709] select-none touch-none border border-zinc-800"
            >
              {customImage ? (
                <div className="w-full h-full p-2 flex items-center justify-center bg-black">
                  <img
                    src={customImage}
                    alt="Custom target"
                    className="custom-crop-target max-h-[460px] max-w-full object-contain"
                  />
                </div>
              ) : (
                <canvas
                  ref={scenarioCanvasRef}
                  width={340}
                  height={480}
                  className="w-full h-full object-cover block"
                />
              )}

              {/* Mobile Quick Action Overlay */}
              {isOverlayActive && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-30 cursor-crosshair">
                  <div className="sim-mobile-bar absolute top-2 left-2 right-2 bg-[#121216]/98 border border-white/[0.18] p-2 flex flex-col gap-1.5 shadow-2xl rounded-lg">
                    <span className="text-[10px] text-zinc-300 font-medium text-center">
                      Arraste para recortar • ou use ação rápida:
                    </span>
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerFullViewportTranslation();
                        }}
                        className="px-2 py-0.5 bg-white text-black text-[10.5px] font-bold rounded cursor-pointer"
                      >
                        📱 Ecrã Todo
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelSelection();
                          triggerFixedAreaRepeat();
                        }}
                        className="px-2 py-0.5 bg-zinc-800 text-zinc-200 text-[10.5px] font-medium rounded border border-white/10 cursor-pointer"
                      >
                        🔄 Área Fixa
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelSelection();
                        }}
                        className="px-2 py-0.5 bg-zinc-900 text-zinc-400 text-[10.5px] rounded border border-white/10 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {selectionBox && (
                    <div
                      style={{
                        left: `${selectionBox.x}px`,
                        top: `${selectionBox.y}px`,
                        width: `${selectionBox.w}px`,
                        height: `${selectionBox.h}px`,
                      }}
                      className="absolute border border-white bg-white/[0.08] shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] pointer-events-none"
                    >
                      <div className="absolute -bottom-5 right-0 bg-[#09090b] text-zinc-300 font-mono text-[9px] px-1 py-0.2 border border-white/20 whitespace-nowrap">
                        {Math.round(selectionBox.w)} × {Math.round(selectionBox.h)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile FAB */}
              {showMobileFab && !isOverlayActive && (
                <button
                  onClick={toggleFreeSelection}
                  className="absolute bottom-3 right-3 bg-[#0c0c0e] hover:bg-zinc-800 text-white border border-white/25 px-2 py-1 shadow-xl text-[10.5px] font-bold flex items-center gap-1.5 cursor-pointer z-20 active:scale-95 transition"
                  title="Botão rápido G.S.T para celular"
                >
                  <span className="w-1.5 h-1.5 bg-white"></span>
                  <span>G.S.T ⚡</span>
                </button>
              )}

              {/* Mobile Translation Window: Fixed Dimensions & Single Top Taskbar */}
              {panelVisible && (
                <div
                  style={{
                    left: `${Math.max(6, Math.min(340 - 280, panelPos.x))}px`,
                    top: `${Math.max(8, Math.min(480 - 180, panelPos.y))}px`,
                    width: '280px',
                    height: `${FIXED_HEIGHT}px`,
                  }}
                  className="sim-panel absolute z-40 bg-[#0c0c0e]/96 backdrop-blur-2xl border border-white/[0.2] text-zinc-200 shadow-2xl flex flex-col overflow-hidden select-none"
                >
                  {/* Top Taskbar */}
                  <div
                    onMouseDown={(e) => {
                      if ((e.target as HTMLElement).tagName === 'BUTTON') return;
                      setIsPanelDragging(true);
                      dragStartRef.current = {
                        pointerX: e.clientX,
                        pointerY: e.clientY,
                        startX: panelPos.x,
                        startY: panelPos.y,
                      };
                    }}
                    onTouchStart={(e) => {
                      if ((e.target as HTMLElement).tagName === 'BUTTON') return;
                      if (!e.touches || e.touches.length === 0) return;
                      const t = e.touches[0];
                      setIsPanelDragging(true);
                      dragStartRef.current = {
                        pointerX: t.clientX,
                        pointerY: t.clientY,
                        startX: panelPos.x,
                        startY: panelPos.y,
                      };
                    }}
                    className="h-8 px-2 bg-black/75 border-b border-white/[0.08] flex items-center justify-between cursor-grab select-none flex-shrink-0"
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                      <span className="w-1.5 h-1.5 bg-white"></span>
                      {interactiveTitleLabel()}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono px-1 py-0.2 bg-white/[0.1] text-zinc-200 font-semibold border border-white/[0.08]">
                        {formatLangCode(targetLang)}
                      </span>
                      <button
                        onClick={() => {
                          setPanelVisible(false);
                          setPanelStatus('idle');
                        }}
                        className="text-zinc-400 hover:text-white p-0.5 text-xs transition cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Body: Purely the translated text */}
                  <div className="p-2.5 overflow-y-auto text-xs flex-1 flex flex-col justify-start">
                    {panelStatus === 'translating' ? (
                      <div className="flex flex-col gap-2 py-2">
                        <div className="h-3 bg-white/[0.06] rounded animate-pulse w-3/4"></div>
                        <div className="h-3 bg-white/[0.06] rounded animate-pulse w-full"></div>
                      </div>
                    ) : panelStatus === 'error' && errorMessage ? (
                      <div className="text-[11px] text-red-400 bg-red-950/20 p-1.5 border border-red-900/30">
                        {errorMessage}
                      </div>
                    ) : (
                      <div className="text-[12px] leading-relaxed text-zinc-100 whitespace-pre-wrap select-text font-sans">
                        {translationText || 'Texto traduzido aparecerá aqui diretamente.'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Android Navigation Bar */}
            <div className="pt-1.5 flex items-center justify-around text-zinc-500 text-xs select-none">
              <span>◀</span>
              <span>●</span>
              <span>■</span>
            </div>
          </div>
        )}
      </div>

      {/* Discreet Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-[#121215] border border-white/[0.15] text-zinc-200 text-xs px-3.5 py-2 shadow-2xl backdrop-blur-md z-50 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
