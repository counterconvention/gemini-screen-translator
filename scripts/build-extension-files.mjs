import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const extDir = path.join(rootDir, 'firefox-extension');

const filesToInclude = [
  {
    name: 'manifest.json',
    path: 'manifest.json',
    language: 'json',
    description: 'Manifest V3 Firefox estritamente configurado com permissions (activeTab, storage, scripting) e browser_specific_settings.gecko'
  },
  {
    name: 'background.js',
    path: 'background.js',
    language: 'javascript',
    description: 'Background Script: escuta atalhos de teclado, captura de tela ativa e chamada segura ao Google Gemini com logs de auditoria'
  },
  {
    name: 'content.js',
    path: 'content.js',
    language: 'javascript',
    description: 'Content Script (AMO Linter Safe): manipulação estrita de DOM sem innerHTML, janela quadrada e redimensionável pelas 4 pontas'
  },
  {
    name: 'content.css',
    path: 'content.css',
    language: 'css',
    description: 'Estilos CSS: tema minimalista escuro fosco e formato estritamente quadrado para a janela flutuante'
  },
  {
    name: 'options.html',
    path: 'options.html',
    language: 'html',
    description: 'Página de Opções: configuração de chave de API, seleção de modelo e painel de Logs de Auditoria para revisão da Mozilla'
  },
  {
    name: 'options.js',
    path: 'options.js',
    language: 'javascript',
    description: 'Script de Opções: manipulação segura sem innerHTML, teste de chave de API e visualização de logs de auditoria'
  },
  {
    name: 'REVISION_NOTES.md',
    path: 'REVISION_NOTES.md',
    language: 'markdown',
    description: 'Notas detalhadas para o revisor da Mozilla (AMO), justificando permissões, ausência de ofuscação e política de não coleta de dados'
  }
];

const results = [];

for (const file of filesToInclude) {
  const filePath = path.join(extDir, file.path);
  if (!fs.existsSync(filePath)) {
    console.error(`Arquivo não encontrado: ${filePath}`);
    process.exit(1);
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  results.push({
    name: file.name,
    path: file.path,
    language: file.language,
    description: file.description,
    content
  });
}

const outputTs = `export interface ExtensionFile {
  name: string;
  path: string;
  language: string;
  description: string;
  content: string;
}

export const EXTENSION_FILES: ExtensionFile[] = ${JSON.stringify(results, null, 2)};
`;

const outputPath = path.join(rootDir, 'src', 'extensionFiles.ts');
fs.writeFileSync(outputPath, outputTs, 'utf-8');
console.log(`[OK] extensionFiles.ts gerado com sucesso com ${results.length} arquivos.`);
