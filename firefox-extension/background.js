/**
 * Gemini Screen Translator - Background Script
 * Compatível exclusivamente com Firefox Desktop (Manifest V3)
 * Responsável por:
 *  - Escutar atalhos de teclado (Atalho 1: Alt+Shift+T / Atalho 2: Alt+Shift+Q)
 *  - Gerenciamento dinâmico de atalhos via browser.commands.update()
 *  - Captura do ecrã visível da aba ativa (tabs.captureVisibleTab)
 *  - Chamada à API REST do Google Gemini 3.5 Flash Lite com latência mínima
 */

const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

const DEFAULT_TARGET_LANG = 'Português do Brasil';
const DEFAULT_MODEL = 'gemini-3.5-flash-lite';

/**
 * Envia uma ação para a aba ativa (ex: START_SELECTION ou REPEAT_FIXED_SELECTION)
 */
async function sendActionToActiveTab(actionName) {
  try {
    const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0) return;

    const activeTab = tabs[0];
    if (!activeTab.id || activeTab.url?.startsWith('about:') || activeTab.url?.startsWith('moz-extension:')) {
      console.warn('Não é possível executar captura em páginas internas do navegador.');
      return;
    }

    try {
      await browserAPI.tabs.sendMessage(activeTab.id, { action: actionName });
    } catch (_err) {
      // Injeta se a aba foi aberta antes da instalação ou recarga da extensão
      await browserAPI.scripting.insertCSS({
        target: { tabId: activeTab.id },
        files: ['content.css']
      });
      await browserAPI.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ['content.js']
      });
      await browserAPI.tabs.sendMessage(activeTab.id, { action: actionName });
    }
  } catch (error) {
    console.error(`Erro ao disparar ${actionName}:`, error);
  }
}

// 1. Ouvinte para atalhos de teclado (commands)
browserAPI.commands.onCommand.addListener((command) => {
  if (command === 'toggle-selection') {
    sendActionToActiveTab('START_SELECTION');
  } else if (command === 'repeat-fixed-selection') {
    sendActionToActiveTab('REPEAT_FIXED_SELECTION');
  }
});

// 2. Ouvinte para o clique no ícone da barra de ferramentas
if (browserAPI.action && browserAPI.action.onClicked) {
  browserAPI.action.onClicked.addListener(() => {
    sendActionToActiveTab('START_SELECTION');
  });
}

// 3. Ouvinte de mensagens do content script e options page
browserAPI.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // A. Captura da aba visível
  if (message.action === 'CAPTURE_TAB') {
    handleCaptureTab().then(sendResponse).catch((err) => {
      sendResponse({ success: false, error: err.message || 'Falha ao capturar tela.' });
    });
    return true;
  }

  // B. Envio da imagem para a API do Gemini
  if (message.action === 'TRANSLATE_IMAGE') {
    handleTranslateImage(message).then(sendResponse).catch((err) => {
      sendResponse({ success: false, error: err.message || 'Erro inesperado na tradução.' });
    });
    return true;
  }

  // C. Gestão dinâmica de atalhos (browser.commands.update)
  if (message.action === 'GET_COMMANDS') {
    if (browserAPI.commands && browserAPI.commands.getAll) {
      browserAPI.commands.getAll().then((commands) => {
        sendResponse({ success: true, commands });
      }).catch((err) => {
        sendResponse({ success: false, error: err.message });
      });
      return true;
    } else {
      sendResponse({ success: false, error: 'API commands não suportada.' });
      return false;
    }
  }

  if (message.action === 'UPDATE_COMMAND') {
    handleUpdateCommand(message.name, message.shortcut).then(sendResponse).catch((err) => {
      sendResponse({ success: false, error: err.message });
    });
    return true;
  }

  // D. Abrir página de opções
  if (message.action === 'OPEN_OPTIONS') {
    if (browserAPI.runtime.openOptionsPage) {
      browserAPI.runtime.openOptionsPage();
    }
    sendResponse({ success: true });
    return false;
  }

  // E. Teste de chave de API
  if (message.action === 'TEST_API_KEY') {
    handleTestApiKey(message.apiKey).then(sendResponse).catch((err) => {
      sendResponse({ valid: false, error: err.message });
    });
    return true;
  }

  // F. Logs de Auditoria para transparência
  if (message.action === 'GET_AUDIT_LOGS') {
    browserAPI.storage.local.get('auditLogs').then((data) => {
      sendResponse({ success: true, logs: Array.isArray(data.auditLogs) ? data.auditLogs : [] });
    }).catch((err) => {
      sendResponse({ success: false, error: err.message, logs: [] });
    });
    return true;
  }

  if (message.action === 'CLEAR_AUDIT_LOGS') {
    browserAPI.storage.local.set({ auditLogs: [] }).then(() => {
      sendResponse({ success: true });
    }).catch((err) => {
      sendResponse({ success: false, error: err.message });
    });
    return true;
  }
});

async function addAuditLog(entry) {
  try {
    const data = await browserAPI.storage.local.get('auditLogs');
    const logs = Array.isArray(data.auditLogs) ? data.auditLogs : [];
    logs.unshift({
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      timestamp: new Date().toISOString(),
      timeFormatted: new Date().toLocaleTimeString(),
      ...entry,
    });
    const trimmed = logs.slice(0, 20);
    await browserAPI.storage.local.set({ auditLogs: trimmed });
  } catch (err) {
    console.error('Falha ao gravar log de auditoria:', err);
  }
}

async function handleCaptureTab() {
  try {
    const dataUrl = await browserAPI.tabs.captureVisibleTab(null, { format: 'png' });
    if (!dataUrl) throw new Error('Nenhum dado retornado.');
    return { success: true, dataUrl };
  } catch (error) {
    console.error('Erro em captureVisibleTab:', error);
    return { success: false, error: 'Falha ao capturar ecrã.' };
  }
}

/**
 * Atualiza um atalho dinamicamente via browser.commands.update()
 */
async function handleUpdateCommand(name, shortcut) {
  try {
    if (!browserAPI.commands || !browserAPI.commands.update) {
      throw new Error('browser.commands.update não disponível nesta versão do Firefox.');
    }
    await browserAPI.commands.update({ name, shortcut });
    const current = (await browserAPI.storage.local.get('customShortcuts')).customShortcuts || {};
    current[name] = shortcut;
    await browserAPI.storage.local.set({ customShortcuts: current });
    return { success: true };
  } catch (err) {
    console.error(`Erro ao atualizar comando ${name}:`, err);
    return { success: false, error: err.message || 'Atalho inválido ou já em uso.' };
  }
}

/**
 * Realiza a chamada REST ao Google Gemini 3.5 Flash Lite otimizada para resposta ultra-rápida
 */
async function handleTranslateImage(message) {
  const { imageBase64, mimeType = 'image/jpeg' } = message;

  if (!imageBase64) {
    return { success: false, error: 'Nenhuma imagem foi recebida para tradução.' };
  }

  const storageData = await browserAPI.storage.local.get(['geminiApiKey', 'targetLanguage', 'geminiModel']);
  const apiKey = storageData.geminiApiKey;
  const targetLanguage = storageData.targetLanguage || DEFAULT_TARGET_LANG;
  let model = storageData.geminiModel || DEFAULT_MODEL;

  if (!apiKey || apiKey.trim() === '') {
    return {
      success: false,
      error: 'NO_API_KEY',
      message: 'Chave de API do Gemini não configurada! Clique no botão abaixo para abrir as Opções.'
    };
  }

  let resolvedMime = mimeType || 'image/jpeg';
  const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
  if (mimeMatch && mimeMatch[1]) {
    resolvedMime = mimeMatch[1];
  }
  const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '').replace(/\s+/g, '');

  // Prompt enxuto e direto para maximizar velocidade de inferência e tokens mínimos
  const prompt = `Traduza todo o texto contido nesta imagem diretamente para: ${targetLanguage}.
Retorne APENAS o texto traduzido final, sem introdução, sem aspas, sem formatação markdown.
Se não houver texto na imagem, retorne exatamente: "[Nenhum texto detectado]"`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: resolvedMime,
              data: cleanBase64
            }
          },
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.0,
      maxOutputTokens: 400
    }
  };

  async function executeRequest(modelName) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey.trim()}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    const data = await response.json();
    return { response, data };
  }

  try {
    let { response, data } = await executeRequest(model);

    // Fallback gracioso para gemini-3.1-flash-lite caso o endpoint ainda utilize alias anterior
    if (!response.ok && model === 'gemini-3.5-flash-lite' && response.status === 404) {
      model = 'gemini-3.1-flash-lite';
      const fallback = await executeRequest(model);
      response = fallback.response;
      data = fallback.data;
    }

    if (!response.ok) {
      let errorMsg = `Erro na API (${response.status}): `;
      if (data.error && data.error.message) {
        if (response.status === 400 && data.error.message.includes('API_KEY_INVALID')) {
          errorMsg = 'A chave de API informada é inválida. Atualize-a nas Opções da extensão.';
        } else if (response.status === 429) {
          errorMsg = 'Limite de cota excedido (Rate limit). Tente novamente em instantes.';
        } else {
          errorMsg += data.error.message;
        }
      } else {
        errorMsg += response.statusText;
      }

      await addAuditLog({
        type: 'OCR_TRANSLATE',
        model,
        status: `${response.status} Error`,
        success: false,
        sizeKb: Math.round(cleanBase64.length * 0.75 / 1024),
        lang: targetLanguage,
        details: errorMsg
      });

      return { success: false, error: errorMsg };
    }

    const candidate = data.candidates && data.candidates[0];
    const textPart = candidate?.content?.parts?.[0]?.text;

    if (!textPart) {
      return { success: false, error: 'Nenhum texto retornado pelo modelo Gemini.' };
    }

    await addAuditLog({
      type: 'OCR_TRANSLATE',
      model,
      status: '200 OK',
      success: true,
      sizeKb: Math.round(cleanBase64.length * 0.75 / 1024),
      lang: targetLanguage,
      chars: textPart.trim().length,
      details: 'Tradução concluída com sucesso.'
    });

    return {
      success: true,
      translation: textPart.trim(),
      targetLanguage,
      model
    };
  } catch (netError) {
    console.error('Erro de conexão:', netError);
    return {
      success: false,
      error: `Falha de rede ao conectar à API: ${netError.message}`
    };
  }
}

/**
 * Validação de chave de API
 */
async function handleTestApiKey(apiKey) {
  if (!apiKey || apiKey.trim() === '') {
    return { valid: false, error: 'Chave não informada.' };
  }

  const testEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey.trim()}`;
  try {
    let resp = await fetch(testEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Ping' }] }]
      })
    });

    if (!resp.ok && resp.status === 404) {
      const fallbackEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey.trim()}`;
      resp = await fetch(fallbackEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Ping' }] }]
        })
      });
    }

    const data = await resp.json();
    if (resp.ok) {
      return { valid: true };
    }
    return { valid: false, error: data?.error?.message || 'Chave de API inválida.' };
  } catch (err) {
    return { valid: false, error: err.message || 'Falha de comunicação.' };
  }
}
