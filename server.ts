import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Body parser with 25mb limit for screenshots
app.use(express.json({ limit: '25mb' }));

// Shared GenAI client for server-side calls
function getGeminiClient(customApiKey?: string) {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Nenhuma chave de API do Gemini foi fornecida ou configurada no ambiente.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// API endpoint for translating cropped image (used by the live simulator in the app)
app.post('/api/translate-image', async (req, res) => {
  try {
    const { imageBase64, mimeType, targetLanguage = 'Português do Brasil', model = 'gemini-3.1-flash-lite' } = req.body;
    const customApiKey = (req.headers['x-gemini-api-key'] as string) || undefined;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Nenhuma imagem foi recebida para tradução.' });
    }

    // Detect actual mime-type from data URL prefix or fallback to jpeg
    let resolvedMime = mimeType || 'image/jpeg';
    const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
    if (mimeMatch && mimeMatch[1]) {
      resolvedMime = mimeMatch[1];
    }

    // Clean base64 string
    const cleanBase64 = imageBase64
      .replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '')
      .replace(/\s+/g, '');

    if (!cleanBase64 || cleanBase64.length < 50) {
      return res.status(400).json({ error: 'Payload de imagem inválido ou corrompido.' });
    }

    const ai = getGeminiClient(customApiKey);

    // Optimized prompt specialized for games, stylized fonts, and fast concise translation
    const promptText = `Atue como um especialista em OCR avançado e tradução para videojogos e mídias visuais.
Extraia com precisão todo o texto desta imagem (mesmo que a fonte seja estilizada, pixel art, gótica, fantasia ou legendas de jogos).
Traduza diretamente e com precisão natural para: ${targetLanguage}.
Retorne APENAS o texto traduzido, sem aspas, sem markdown, sem introduções e sem comentários.
Se a imagem não contiver nenhum caractere ou texto legível, retorne exatamente: "[Nenhum texto detectado na imagem selecionada]"`;

    // Default: Gemini 3.5 Flash Lite for fastest response time
    let selectedModel = 'gemini-3.5-flash-lite';
    if (model && model.includes('3.8')) {
      selectedModel = 'gemini-3.8-flash';
    }

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: resolvedMime,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        temperature: 0.0,
        maxOutputTokens: 400,
      },
    });

    const translation = response.text ? response.text.trim() : '';
    return res.json({
      success: true,
      translation,
      model: selectedModel,
      targetLanguage,
    });
  } catch (error: any) {
    console.error('Erro na tradução Gemini:', error);
    return res.status(500).json({
      error: error.message || 'Erro ao processar imagem com a API do Gemini.',
    });
  }
});

// API endpoint to test an API key
app.post('/api/test-key', async (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey) {
      return res.status(400).json({ valid: false, error: 'Chave de API não informada.' });
    }
    const ai = getGeminiClient(apiKey);
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: 'Ping',
    });
    if (response.text) {
      return res.json({ valid: true });
    }
    return res.json({ valid: false, error: 'Resposta vazia da API.' });
  } catch (err: any) {
    return res.status(400).json({ valid: false, error: err.message || 'Chave de API inválida.' });
  }
});

// Environment check endpoint
app.get('/api/config-status', (_req, res) => {
  res.json({
    hasEnvKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Endpoint to update REVISION_NOTES.md and synchronize extension files
app.post('/api/save-revision-notes', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ success: false, error: 'Conteúdo das notas não fornecido.' });
    }
    const fs = await import('fs');
    const path = await import('path');
    const { execSync } = await import('child_process');

    const filePath = path.join(process.cwd(), 'firefox-extension', 'REVISION_NOTES.md');
    fs.writeFileSync(filePath, content, 'utf-8');

    // Executa build para atualizar extensionFiles.ts em tempo real
    execSync('node scripts/build-extension-files.mjs', { stdio: 'ignore' });

    return res.json({ success: true, message: 'REVISION_NOTES.md atualizado com sucesso!' });
  } catch (err: any) {
    console.error('Erro ao salvar REVISION_NOTES.md:', err);
    return res.status(500).json({ success: false, error: err.message || 'Erro ao salvar arquivo.' });
  }
});

// Mount Vite or static server
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const disableHmr = process.env.DISABLE_HMR === 'true' || Boolean(process.env.K_SERVICE);
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: disableHmr ? false : undefined,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT} (isProd: ${isProd})`);
  });
}

startServer();
