/**
 * Gemini Screen Translator - Options Page Script
 * Design: Preto fosco, estritamente quadrado, minimalista
 * Exclusivo para Firefox Desktop (sem suporte mobile)
 * AMO Linter Compliant: Zero innerHTML, manipulação estrita do DOM.
 */

const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

const apiKeyInput = document.getElementById('apiKey');
const targetLangSelect = document.getElementById('targetLanguage');
const modelSelect = document.getElementById('geminiModel');
const shortcutFreeInput = document.getElementById('shortcutFree');
const shortcutFixedInput = document.getElementById('shortcutFixed');
const optionsForm = document.getElementById('optionsForm');
const toggleVisBtn = document.getElementById('toggleVisibility');
const testConnectionBtn = document.getElementById('testConnectionBtn');
const saveBtn = document.getElementById('saveBtn');
const statusBox = document.getElementById('statusBox');
const statusMessage = document.getElementById('statusMessage');
const statusCloseBtn = document.getElementById('statusCloseBtn');
const statusIdle = document.getElementById('statusIdle');
const auditLogList = document.getElementById('auditLogList');
const refreshAuditBtn = document.getElementById('refreshAuditBtn');
const clearAuditBtn = document.getElementById('clearAuditBtn');
const resetShortcutsTopBtn = document.getElementById('resetShortcutsTopBtn');
const resetShortcutsCardBtn = document.getElementById('resetShortcutsCardBtn');
const addonVersionBadge = document.getElementById('addonVersionBadge');

// 1. Carrega configurações salvas e metadados
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Exibe a versão real declarada no manifest
    if (browserAPI.runtime && browserAPI.runtime.getManifest) {
      const manifest = browserAPI.runtime.getManifest();
      if (manifest && manifest.version && addonVersionBadge) {
        addonVersionBadge.textContent = `v${manifest.version}`;
      }
    }

    const data = await browserAPI.storage.local.get([
      'geminiApiKey',
      'targetLanguage',
      'geminiModel',
      'customShortcuts'
    ]);

    if (data.geminiApiKey) apiKeyInput.value = data.geminiApiKey;
    if (data.targetLanguage) targetLangSelect.value = data.targetLanguage;
    if (data.geminiModel) modelSelect.value = data.geminiModel;

    // Obtém atalhos registrados
    let commands = [];
    try {
      const resp = await browserAPI.runtime.sendMessage({ action: 'GET_COMMANDS' });
      if (resp && resp.commands) commands = resp.commands;
    } catch (_e) {
      if (browserAPI.commands && browserAPI.commands.getAll) {
        commands = await browserAPI.commands.getAll();
      }
    }

    const freeCmd = commands.find((c) => c.name === 'toggle-selection');
    const fixedCmd = commands.find((c) => c.name === 'repeat-fixed-selection');

    shortcutFreeInput.value = freeCmd?.shortcut || data.customShortcuts?.['toggle-selection'] || 'Alt+Shift+T';
    shortcutFixedInput.value = fixedCmd?.shortcut || data.customShortcuts?.['repeat-fixed-selection'] || 'Alt+Shift+Q';
  } catch (err) {
    console.error('Erro ao ler opções:', err);
    showStatus('Erro ao carregar configurações salvas.', 'error');
  }

  loadAuditLogs();
});

// 2. Alternar visibilidade da API Key
toggleVisBtn.addEventListener('click', () => {
  if (apiKeyInput.type === 'password') {
    apiKeyInput.type = 'text';
    toggleVisBtn.textContent = '🔒';
  } else {
    apiKeyInput.type = 'password';
    toggleVisBtn.textContent = '👁';
  }
});

// 3. Testar conexão com a API do Gemini
if (testConnectionBtn) {
  testConnectionBtn.addEventListener('click', async () => {
    const key = apiKeyInput.value.trim();
    if (!key) {
      showStatus('Informe uma chave de API para testar.', 'error');
      return;
    }

    testConnectionBtn.disabled = true;
    testConnectionBtn.textContent = 'Testando Conexão...';
    showStatus('Testando conexão com a API do Gemini...', 'info');

    try {
      const resp = await browserAPI.runtime.sendMessage({
        action: 'TEST_API_KEY',
        apiKey: key
      });

      if (resp && resp.valid) {
        showStatus('✓ Conexão com o Gemini estabelecida com sucesso!', 'success');
      } else {
        const errorDetail = resp?.error || 'Chave de API inválida ou sem resposta.';
        showStatus(`Falha na conexão: ${errorDetail}`, 'error');
      }
    } catch (err) {
      console.error('Erro ao testar conexão:', err);
      showStatus(`Falha ao conectar: ${err.message}`, 'error');
    } finally {
      testConnectionBtn.disabled = false;
      testConnectionBtn.textContent = 'Testar Conexão Gemini';
    }
  });
}

// 4. Restaurar Atalhos Padrão (Alt+Shift+T / Alt+Shift+Q)
function restoreDefaultShortcuts() {
  shortcutFreeInput.value = 'Alt+Shift+T';
  shortcutFixedInput.value = 'Alt+Shift+Q';
  showStatus('Atalhos restaurados para Alt+Shift+T e Alt+Shift+Q.', 'info');
}

if (resetShortcutsTopBtn) {
  resetShortcutsTopBtn.addEventListener('click', restoreDefaultShortcuts);
}
if (resetShortcutsCardBtn) {
  resetShortcutsCardBtn.addEventListener('click', restoreDefaultShortcuts);
}

// 5. Salvar configurações
optionsForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const apiKey = apiKeyInput.value.trim();
  const targetLanguage = targetLangSelect.value;
  const geminiModel = modelSelect.value;
  const newFreeShortcut = shortcutFreeInput.value.trim() || 'Alt+Shift+T';
  const newFixedShortcut = shortcutFixedInput.value.trim() || 'Alt+Shift+Q';

  if (!apiKey) {
    showStatus('A Chave de API é obrigatória.', 'error');
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = 'Salvando...';

  try {
    const shortcutErrors = [];
    if (newFreeShortcut) {
      const resp1 = await browserAPI.runtime.sendMessage({
        action: 'UPDATE_COMMAND',
        name: 'toggle-selection',
        shortcut: newFreeShortcut
      });
      if (!resp1?.success && resp1?.error) shortcutErrors.push(`Atalho 1: ${resp1.error}`);
    }

    if (newFixedShortcut) {
      const resp2 = await browserAPI.runtime.sendMessage({
        action: 'UPDATE_COMMAND',
        name: 'repeat-fixed-selection',
        shortcut: newFixedShortcut
      });
      if (!resp2?.success && resp2?.error) shortcutErrors.push(`Atalho 2: ${resp2.error}`);
    }

    await browserAPI.storage.local.set({
      geminiApiKey: apiKey,
      targetLanguage,
      geminiModel,
      customShortcuts: {
        'toggle-selection': newFreeShortcut,
        'repeat-fixed-selection': newFixedShortcut
      }
    });

    if (shortcutErrors.length > 0) {
      showStatus(`✓ Preferências salvas! (${shortcutErrors.join(' | ')})`, 'success');
    } else {
      showStatus('✓ Todas as preferências e atalhos foram salvos com sucesso.', 'success');
    }
  } catch (err) {
    console.error('Erro ao salvar:', err);
    showStatus(`Falha ao salvar: ${err.message}`, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Salvar Preferências';
    loadAuditLogs();
  }
});

// Fechar balão de status manualmente se o usuário desejar
if (statusCloseBtn) {
  statusCloseBtn.addEventListener('click', () => {
    statusBox.style.display = 'none';
    if (statusIdle) statusIdle.style.display = 'block';
  });
}

function showStatus(message, type) {
  if (statusIdle) statusIdle.style.display = 'none';
  if (statusMessage) statusMessage.textContent = message;

  statusBox.style.display = 'flex';
  statusBox.className = 'status-box';

  if (type === 'success') {
    statusBox.classList.add('status-success');
  } else if (type === 'error') {
    statusBox.classList.add('status-error');
  } else {
    statusBox.classList.add('status-info');
  }
}

// 6. Auditoria de requisições
async function loadAuditLogs() {
  if (!auditLogList) return;
  try {
    const resp = await browserAPI.runtime.sendMessage({ action: 'GET_AUDIT_LOGS' });
    const logs = resp?.logs || [];

    while (auditLogList.firstChild) {
      auditLogList.removeChild(auditLogList.firstChild);
    }

    if (logs.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'audit-empty';
      empty.textContent = 'Nenhuma chamada efetuada ainda.';
      auditLogList.appendChild(empty);
      return;
    }

    logs.forEach((log) => {
      const row = document.createElement('div');
      row.className = 'audit-row';

      const top = document.createElement('div');
      top.className = 'audit-row-top';

      const timeSpan = document.createElement('span');
      timeSpan.textContent = log.timeFormatted || log.timestamp?.slice(11, 19);
      timeSpan.style.color = '#71717a';

      const tag = document.createElement('span');
      tag.className = `audit-tag ${log.success ? 'audit-tag-success' : 'audit-tag-error'}`;
      tag.textContent = log.status || (log.success ? '200 OK' : 'ERR');

      top.appendChild(timeSpan);
      top.appendChild(tag);

      const desc = document.createElement('div');
      desc.className = 'audit-row-desc';
      desc.textContent = `${log.model || 'Gemini'} • ${log.lang || 'PT'} • ${log.sizeKb || 0} KB • ${log.details || ''}`;

      row.appendChild(top);
      row.appendChild(desc);
      auditLogList.appendChild(row);
    });
  } catch (err) {
    console.error('Falha ao ler logs de auditoria:', err);
  }
}

if (refreshAuditBtn) {
  refreshAuditBtn.addEventListener('click', loadAuditLogs);
}

if (clearAuditBtn) {
  clearAuditBtn.addEventListener('click', async () => {
    try {
      await browserAPI.runtime.sendMessage({ action: 'CLEAR_AUDIT_LOGS' });
      loadAuditLogs();
      showStatus('Logs de auditoria foram limpos.', 'info');
    } catch (err) {
      console.error('Falha ao limpar logs:', err);
    }
  });
}
