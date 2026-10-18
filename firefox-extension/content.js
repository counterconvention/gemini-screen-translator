/**
 * Gemini Screen Translator (G.S.T) - Content Script
 * AMO Linter Compliant: Zero innerHTML, manipulação estrita do DOM.
 * Design: Preto fosco, estritamente quadrado, minimalista.
 * Exclusivo para Firefox Desktop (sem suporte mobile, sem balão na captura, sem quadrado ao lado do X).
 */

(() => {
  if (window.__geminiTranslatorInitialized) return;
  window.__geminiTranslatorInitialized = true;

  const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

  let isSelecting = false;
  let startX = 0;
  let startY = 0;
  let overlayElem = null;
  let selectionBoxElem = null;
  let floatingPanel = null;
  let currentTargetLang = 'Português do Brasil';

  // Carrega idioma de destino, posição e tamanho salvos do painel
  browserAPI.storage.local.get(['targetLanguage', 'panelPos', 'panelSize']).then((data) => {
    if (data.targetLanguage) currentTargetLang = data.targetLanguage;
    if (data.panelPos) window.__geminiSavedPanelPos = data.panelPos;
    if (data.panelSize) window.__geminiSavedPanelSize = data.panelSize;
  }).catch(() => {});

  // 1. Inicia a seleção de área com overlay escurecido
  function startSelectionOverlay() {
    if (isSelecting || overlayElem) cleanupOverlay();

    overlayElem = document.createElement('div');
    overlayElem.id = 'gemini-translator-overlay';
    overlayElem.className = 'gemini-trans-overlay';

    selectionBoxElem = document.createElement('div');
    selectionBoxElem.className = 'gemini-trans-box';
    selectionBoxElem.style.display = 'none';

    overlayElem.appendChild(selectionBoxElem);
    document.body.appendChild(overlayElem);

    // Ouvintes estritamente desktop
    overlayElem.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('keydown', onKeyDown);
  }

  function cleanupOverlay() {
    if (overlayElem) {
      overlayElem.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('keydown', onKeyDown);
      overlayElem.remove();
      overlayElem = null;
      selectionBoxElem = null;
    }
    isSelecting = false;
  }

  function cancelSelection() {
    cleanupOverlay();
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      cancelSelection();
      closeFloatingPanel();
    }
  }

  function onMouseDown(e) {
    if (e.button !== 0) return;
    handleStartSelection(e.clientX, e.clientY);
    e.preventDefault();
  }

  function onMouseMove(e) {
    if (!isSelecting) return;
    handleMoveSelection(e.clientX, e.clientY);
    e.preventDefault();
  }

  function onMouseUp(e) {
    if (!isSelecting) return;
    handleEndSelection(e.clientX, e.clientY);
  }

  function handleStartSelection(x, y) {
    isSelecting = true;
    startX = x;
    startY = y;

    if (selectionBoxElem) {
      selectionBoxElem.style.left = `${x}px`;
      selectionBoxElem.style.top = `${y}px`;
      selectionBoxElem.style.width = '0px';
      selectionBoxElem.style.height = '0px';
      selectionBoxElem.style.display = 'block';
    }
  }

  function handleMoveSelection(x, y) {
    if (!selectionBoxElem) return;

    const currentX = x;
    const currentY = y;
    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    selectionBoxElem.style.left = `${left}px`;
    selectionBoxElem.style.top = `${top}px`;
    selectionBoxElem.style.width = `${width}px`;
    selectionBoxElem.style.height = `${height}px`;
  }

  async function handleEndSelection(x, y) {
    isSelecting = false;

    const left = Math.min(startX, x);
    const top = Math.min(startY, y);
    const width = Math.abs(x - startX);
    const height = Math.abs(y - startY);

    // Ignora cliques acidentais menores que 15x15px
    if (width < 15 || height < 15) {
      cleanupOverlay();
      return;
    }

    const cropRect = {
      x: left,
      y: top,
      width: width,
      height: height
    };

    browserAPI.storage.local.set({ lastCropArea: cropRect }).catch(() => {});
    cleanupOverlay();
    showFloatingPanel(cropRect, 'translating');

    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 40)));

    try {
      const captureResp = await browserAPI.runtime.sendMessage({ action: 'CAPTURE_TAB' });
      if (!captureResp || !captureResp.success) {
        throw new Error(captureResp?.error || 'Falha ao capturar imagem da tela.');
      }

      const croppedBase64 = await cropImageWithCanvasOptimized(captureResp.dataUrl, cropRect);

      const transResp = await browserAPI.runtime.sendMessage({
        action: 'TRANSLATE_IMAGE',
        imageBase64: croppedBase64,
        mimeType: 'image/jpeg'
      });

      if (!transResp.success) {
        if (transResp.error === 'NO_API_KEY') {
          showPanelError(transResp.message, true);
        } else {
          showPanelError(transResp.error || 'Falha ao obter tradução.');
        }
        return;
      }

      showPanelResult(transResp.translation);
    } catch (err) {
      console.error('Erro no fluxo de tradução:', err);
      showPanelError(err.message || 'Erro inesperado na captura/tradução.');
    }
  }

  // 2. Atalho 2: Repete tradução instantânea na última área memorizada
  async function executeFixedAreaRepeat() {
    try {
      const data = await browserAPI.storage.local.get('lastCropArea');
      const lastArea = data.lastCropArea;

      if (!lastArea || !lastArea.width || !lastArea.height) {
        showToastNotification('Nenhuma área gravada. Use Alt+Shift+T primeiro para selecionar uma área.');
        startSelectionOverlay();
        return;
      }

      showFloatingPanel(lastArea, 'translating');

      const captureResp = await browserAPI.runtime.sendMessage({ action: 'CAPTURE_TAB' });
      if (!captureResp || !captureResp.success) {
        throw new Error(captureResp?.error || 'Falha ao capturar ecrã.');
      }

      const croppedBase64 = await cropImageWithCanvasOptimized(captureResp.dataUrl, lastArea);

      const transResp = await browserAPI.runtime.sendMessage({
        action: 'TRANSLATE_IMAGE',
        imageBase64: croppedBase64,
        mimeType: 'image/jpeg'
      });

      if (!transResp.success) {
        if (transResp.error === 'NO_API_KEY') {
          showPanelError(transResp.message, true);
        } else {
          showPanelError(transResp.error || 'Falha ao obter tradução.');
        }
        return;
      }

      showPanelResult(transResp.translation);
    } catch (err) {
      console.error('Erro na repetição de área fixa:', err);
      showPanelError(err.message || 'Erro ao capturar zona fixa.');
    }
  }

  // 3. Recorte rápido no canvas otimizado para JPEG (reduz tamanho e acelera upload)
  function cropImageWithCanvasOptimized(dataUrl, rect) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const dpr = window.devicePixelRatio || 1;
          const canvas = document.createElement('canvas');

          const sx = Math.round(rect.x * dpr);
          const sy = Math.round(rect.y * dpr);
          const sw = Math.round(rect.width * dpr);
          const sh = Math.round(rect.height * dpr);

          const finalWidth = Math.max(1, sw);
          const finalHeight = Math.max(1, sh);

          canvas.width = finalWidth;
          canvas.height = finalHeight;

          const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: false });
          if (!ctx) {
            reject(new Error('Contexto do canvas 2D indisponível.'));
            return;
          }

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, finalWidth, finalHeight);
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, finalWidth, finalHeight);

          // JPEG qualidade 0.85 para menor latência de rede
          const cropped = canvas.toDataURL('image/jpeg', 0.85);
          resolve(cropped);
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => reject(new Error('Falha ao decodificar imagem capturada.'));
      img.src = dataUrl;
    });
  }

  // Helper para nome interativo com 3 pontos animados
  function setInteractiveTitle(containerElem, state) {
    while (containerElem.firstChild) {
      containerElem.removeChild(containerElem.firstChild);
    }

    if (state === 'translating') {
      const textSpan = document.createElement('span');
      textSpan.textContent = 'Traduzindo';
      containerElem.appendChild(textSpan);

      const dotsContainer = document.createElement('span');
      dotsContainer.className = 'gemini-trans-dots';

      const d1 = document.createElement('span');
      d1.textContent = '.';
      const d2 = document.createElement('span');
      d2.textContent = '.';
      const d3 = document.createElement('span');
      d3.textContent = '.';

      dotsContainer.appendChild(d1);
      dotsContainer.appendChild(d2);
      dotsContainer.appendChild(d3);

      containerElem.appendChild(dotsContainer);
    } else if (state === 'done') {
      const textSpan = document.createElement('span');
      textSpan.textContent = 'Traduzido';
      containerElem.appendChild(textSpan);
    } else {
      const textSpan = document.createElement('span');
      textSpan.textContent = 'Tradutor';
      containerElem.appendChild(textSpan);
    }
  }

  // 4. Janela de Tradução Minimalista (Preto Fosco, Quadrado, Barra Superior Única)
  function showFloatingPanel(rect, initialStatus = 'translating') {
    closeFloatingPanel();

    const panel = document.createElement('div');
    panel.id = 'gemini-floating-panel';
    panel.className = 'gemini-trans-panel';
    floatingPanel = panel;

    let panelW = 340;
    let panelH = 180;
    if (window.__geminiSavedPanelSize && typeof window.__geminiSavedPanelSize.width === 'number') {
      panelW = Math.max(180, Math.min(window.innerWidth - 16, window.__geminiSavedPanelSize.width));
      panelH = Math.max(70, Math.min(window.innerHeight - 16, window.__geminiSavedPanelSize.height));
    }
    panel.style.width = `${Math.round(panelW)}px`;
    panel.style.height = `${Math.round(panelH)}px`;

    // Posicionamento inteligente com memória de arrasto
    let posX = rect.x;
    let posY = rect.y + rect.height + 10;

    if (window.__geminiSavedPanelPos && typeof window.__geminiSavedPanelPos.x === 'number') {
      posX = Math.max(8, Math.min(window.innerWidth - panelW - 8, window.__geminiSavedPanelPos.x));
      posY = Math.max(8, Math.min(window.innerHeight - panelH - 8, window.__geminiSavedPanelPos.y));
    } else {
      const padding = 12;
      if (posY + panelH > window.innerHeight) {
        posY = Math.max(padding, rect.y - panelH - padding);
      }
      if (posX + panelW > window.innerWidth) {
        posX = Math.max(padding, window.innerWidth - panelW - padding);
      }
      window.__geminiSavedPanelPos = { x: posX, y: posY };
      browserAPI.storage.local.set({ panelPos: window.__geminiSavedPanelPos }).catch(() => {});
    }

    panel.style.left = `${Math.round(posX)}px`;
    panel.style.top = `${Math.round(posY)}px`;

    // 5. Barra Superior Única:
    // Lado esquerdo: Nome Interativo ("Tradutor" / "Traduzindo..." / "Traduzido")
    // Lado direito: Somente o botão de fechar (✕) - Sem quadrado de idioma ou erro
    const header = document.createElement('div');
    header.className = 'gemini-trans-header';
    header.id = 'gemini-trans-drag-handle';

    const titleDiv = document.createElement('div');
    titleDiv.className = 'gemini-trans-title';

    const dotSpan = document.createElement('span');
    dotSpan.className = 'gemini-trans-dot';

    const titleInteractive = document.createElement('span');
    titleInteractive.id = 'gemini-title-interactive';
    titleInteractive.className = 'gemini-trans-interactive-name';
    setInteractiveTitle(titleInteractive, initialStatus);

    titleDiv.appendChild(dotSpan);
    titleDiv.appendChild(titleInteractive);

    const headerActions = document.createElement('div');
    headerActions.className = 'gemini-trans-header-actions';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'gemini-trans-btn-icon';
    closeBtn.id = 'gemini-btn-close';
    closeBtn.textContent = '✕';
    closeBtn.title = 'Fechar (ESC)';
    closeBtn.setAttribute('aria-label', 'Fechar janela');

    headerActions.appendChild(closeBtn);

    header.appendChild(titleDiv);
    header.appendChild(headerActions);
    panel.appendChild(header);

    // 6. Corpo Único da Janela: Apenas o Texto Traduzido
    const body = document.createElement('div');
    body.className = 'gemini-trans-body';

    const resultDiv = document.createElement('div');
    resultDiv.className = 'gemini-trans-content';
    resultDiv.id = 'gemini-trans-result-text';
    resultDiv.textContent = 'Aguardando resposta do modelo...';

    body.appendChild(resultDiv);
    panel.appendChild(body);

    // 7. Alça de redimensionamento sutil e minimalista (canto inferior direito)
    const resizer = document.createElement('div');
    resizer.className = 'gemini-trans-resizer';
    resizer.id = 'gemini-trans-resizer';
    resizer.title = 'Redimensionar janela';
    panel.appendChild(resizer);

    document.body.appendChild(panel);

    closeBtn.addEventListener('click', closeFloatingPanel);
    setupDrag(panel, header);
    setupResize(panel, resizer);
  }

  function showPanelResult(text) {
    if (!floatingPanel) return;

    const titleInteractive = document.getElementById('gemini-title-interactive');
    if (titleInteractive) {
      setInteractiveTitle(titleInteractive, 'done');
    }

    const resultDiv = document.getElementById('gemini-trans-result-text');
    if (resultDiv) {
      resultDiv.textContent = text || '[Nenhum texto detectado]';
    }
  }

  function showPanelError(errorMessage, showOptionsBtn = false) {
    if (!floatingPanel) return;

    const titleInteractive = document.getElementById('gemini-title-interactive');
    if (titleInteractive) {
      setInteractiveTitle(titleInteractive, 'idle');
    }

    const resultDiv = document.getElementById('gemini-trans-result-text');
    if (resultDiv) {
      while (resultDiv.firstChild) {
        resultDiv.removeChild(resultDiv.firstChild);
      }

      const errSpan = document.createElement('span');
      errSpan.className = 'gemini-trans-error-text';
      errSpan.textContent = errorMessage;
      resultDiv.appendChild(errSpan);

      if (showOptionsBtn) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = 'Abrir Opções da Extensão';
        btn.style.cssText = 'display:block;margin-top:8px;padding:4px 8px;background:#ffffff;color:#000000;border:none;font-size:11px;font-weight:600;cursor:pointer;';
        btn.addEventListener('click', () => {
          browserAPI.runtime.sendMessage({ action: 'OPEN_OPTIONS' }).catch(() => {});
        });
        resultDiv.appendChild(btn);
      }
    }
  }

  function closeFloatingPanel() {
    if (floatingPanel) {
      floatingPanel.remove();
      floatingPanel = null;
    }
  }

  // 7. Arrasto da Janela com Salvamento Automático da Posição
  function setupDrag(panel, handle) {
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let initialLeft = 0;
    let initialTop = 0;

    handle.addEventListener('mousedown', (e) => {
      if (e.target.closest('#gemini-btn-close')) return;
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      initialLeft = panel.offsetLeft;
      initialTop = panel.offsetTop;
      handle.style.cursor = 'grabbing';
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;

      const newLeft = Math.max(0, Math.min(window.innerWidth - panel.offsetWidth, initialLeft + dx));
      const newTop = Math.max(0, Math.min(window.innerHeight - panel.offsetHeight, initialTop + dy));

      panel.style.left = `${newLeft}px`;
      panel.style.top = `${newTop}px`;
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        handle.style.cursor = 'grab';
        window.__geminiSavedPanelPos = { x: panel.offsetLeft, y: panel.offsetTop };
        browserAPI.storage.local.set({ panelPos: window.__geminiSavedPanelPos }).catch(() => {});
      }
    });
  }

  // 8. Redimensionamento da Janela com Salvamento Automático da Largura e Altura
  function setupResize(panel, resizer) {
    let isResizing = false;
    let startX = 0;
    let startY = 0;
    let startW = 0;
    let startH = 0;

    resizer.addEventListener('mousedown', (e) => {
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startW = panel.offsetWidth;
      startH = panel.offsetHeight;
      e.stopPropagation();
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const newW = Math.max(180, Math.min(window.innerWidth - panel.offsetLeft - 8, startW + dx));
      const newH = Math.max(70, Math.min(window.innerHeight - panel.offsetTop - 8, startH + dy));

      panel.style.width = `${Math.round(newW)}px`;
      panel.style.height = `${Math.round(newH)}px`;
    });

    window.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        const finalW = Math.round(panel.offsetWidth);
        const finalH = Math.round(panel.offsetHeight);
        window.__geminiSavedPanelSize = { width: finalW, height: finalH };
        browserAPI.storage.local.set({ panelSize: window.__geminiSavedPanelSize }).catch(() => {});
      }
    });

    // Sincroniza dimensões caso o usuário use o redimensionamento nativo da borda
    if (typeof ResizeObserver !== 'undefined') {
      let roTimeout = null;
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === panel && !isResizing && !isDragging) {
            clearTimeout(roTimeout);
            roTimeout = setTimeout(() => {
              const curW = Math.round(panel.offsetWidth);
              const curH = Math.round(panel.offsetHeight);
              if (curW >= 180 && curH >= 70) {
                window.__geminiSavedPanelSize = { width: curW, height: curH };
                browserAPI.storage.local.set({ panelSize: window.__geminiSavedPanelSize }).catch(() => {});
              }
            }, 120);
          }
        }
      });
      ro.observe(panel);
    }
  }

  function showToastNotification(message) {
    const existing = document.getElementById('gemini-toast-msg');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'gemini-toast-msg';
    toast.className = 'gemini-trans-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => { toast.remove(); }, 3200);
  }

  // 8. Ouvinte de Mensagens do Background Script
  browserAPI.runtime.onMessage.addListener((message) => {
    if (message.action === 'START_SELECTION') {
      startSelectionOverlay();
    } else if (message.action === 'REPEAT_FIXED_SELECTION') {
      executeFixedAreaRepeat();
    }
  });
})();
