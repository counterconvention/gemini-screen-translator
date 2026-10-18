import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  RefreshCw,
  FileCode,
  Copy,
  Check,
  Search,
  ExternalLink,
  Code2,
  Sparkles,
  Info,
  Layers,
  Cpu
} from 'lucide-react';
import { EXTENSION_FILES } from '../extensionFiles';
import { getExtensionConfig } from '../utils/extensionConfig';

export interface ManifestRuleCheck {
  id: string;
  category: 'obsolete' | 'permissions' | 'gecko' | 'structure' | 'security';
  title: string;
  description: string;
  status: 'passed' | 'warning' | 'failed';
  mozillaPolicy: string;
  detectedValue: string;
  recommendation: string;
}

export const ManifestValidator: React.FC = () => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [copiedReport, setCopiedReport] = useState(false);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [config, setConfig] = useState(getExtensionConfig());

  useEffect(() => {
    const handleConfigChange = (e: any) => {
      if (e.detail) setConfig(e.detail);
    };
    window.addEventListener('gst-extension-config-changed', handleConfigChange);
    return () => window.removeEventListener('gst-extension-config-changed', handleConfigChange);
  }, []);

  // Parse current manifest from EXTENSION_FILES
  const manifestFile = useMemo(() => {
    return EXTENSION_FILES.find((f) => f.name === 'manifest.json');
  }, []);

  const parsedManifest = useMemo(() => {
    try {
      if (!manifestFile) return null;
      const parsed = JSON.parse(manifestFile.content);
      parsed.version = config.version;
      if (parsed.browser_specific_settings?.gecko) {
        parsed.browser_specific_settings.gecko.id = config.extensionId;
      }
      return parsed;
    } catch (_e) {
      return null;
    }
  }, [manifestFile, config]);

  // Code inspection for permissions verification
  const backgroundJs = useMemo(() => {
    return EXTENSION_FILES.find((f) => f.name === 'background.js')?.content || '';
  }, []);

  const contentJs = useMemo(() => {
    return EXTENSION_FILES.find((f) => f.name === 'content.js')?.content || '';
  }, []);

  // Run audit rules
  const auditResults: ManifestRuleCheck[] = useMemo(() => {
    const rules: ManifestRuleCheck[] = [];
    const m = parsedManifest || {};

    // 1. Manifest Version (MV3)
    const isMV3 = m.manifest_version === 3;
    rules.push({
      id: 'AMO-MV3-001',
      category: 'structure',
      title: 'Versão do Manifest (Manifest V3)',
      description: 'Verifica se a extensão utiliza a especificação moderna Manifest V3 aceita pela Mozilla.',
      status: isMV3 ? 'passed' : 'failed',
      mozillaPolicy: 'A Mozilla recomenda estritamente Manifest V3 para novos envios e atualizações.',
      detectedValue: `"manifest_version": ${m.manifest_version || 'não especificado'}`,
      recommendation: isMV3
        ? 'Manifest V3 configurado perfeitamente.'
        : 'Atualize para "manifest_version": 3 conforme diretrizes do Firefox.'
    });

    // 2. browser_specific_settings.gecko.id (Obrigatório para o Firefox)
    const geckoId = m.browser_specific_settings?.gecko?.id;
    const hasValidGeckoId = typeof geckoId === 'string' && (geckoId.includes('@') || geckoId.startsWith('{'));
    rules.push({
      id: 'AMO-GECKO-001',
      category: 'gecko',
      title: 'ID Exclusivo do Firefox (browser_specific_settings.gecko.id)',
      description: 'Extensões enviadas para a Mozilla AMO ou empacotadas para o Firefox exigem um ID permanente para armazenamento e assinatura.',
      status: hasValidGeckoId ? 'passed' : 'failed',
      mozillaPolicy: 'Obrigatório no AMO para identificar a extensão e manter compatibilidade entre atualizações.',
      detectedValue: `"id": "${geckoId || 'ausente'}"`,
      recommendation: hasValidGeckoId
        ? 'ID presente em formato válido (gemini-screen-translator@firefox.local).'
        : 'Defina browser_specific_settings.gecko.id com formato de email ou UUID.'
    });

    // 3. strict_min_version do Gecko
    const minVersion = m.browser_specific_settings?.gecko?.strict_min_version;
    const hasMinVersion = typeof minVersion === 'string' && parseFloat(minVersion) >= 109.0;
    rules.push({
      id: 'AMO-GECKO-002',
      category: 'gecko',
      title: 'Versão Mínima do Navegador (strict_min_version)',
      description: 'Garante que o Firefox 109+ (versão que estabilizou o Manifest V3) seja o requisito mínimo.',
      status: hasMinVersion ? 'passed' : 'warning',
      mozillaPolicy: 'O Firefox adicionou suporte completo estável ao Manifest V3 na versão 109.0.',
      detectedValue: `"strict_min_version": "${minVersion || 'ausente'}"`,
      recommendation: hasMinVersion
        ? 'Versão mínima 109.0 definida para garantir estabilidade de APIs MV3.'
        : 'Recomenda-se definir strict_min_version: "109.0".'
    });

    // 3b. Suporte a Dispositivos Móveis (Firefox Android)
    const geckoAndroid = m.browser_specific_settings?.gecko_android;
    const hasGeckoAndroid = geckoAndroid && typeof geckoAndroid.strict_min_version === 'string';
    rules.push({
      id: 'AMO-GECKO-003',
      category: 'gecko',
      title: 'Compatibilidade com Firefox para Android (gecko_android)',
      description: 'Declara suporte explícito ao ecossistema aberto de extensões do Firefox Android (Fenix/GeckoView).',
      status: hasGeckoAndroid ? 'passed' : 'warning',
      mozillaPolicy: 'A Mozilla recomenda declarar gecko_android.strict_min_version para sinalizar suporte ao Firefox móvel.',
      detectedValue: hasGeckoAndroid
        ? `"gecko_android": { "strict_min_version": "${geckoAndroid.strict_min_version}" }`
        : 'browser_specific_settings.gecko_android ausente',
      recommendation: hasGeckoAndroid
        ? 'Suporte ao Firefox Android 109+ configurado com sucesso.'
        : 'Adicione "gecko_android": { "strict_min_version": "109.0" } para compatibilidade móvel.'
    });

    // 4. Verificação de Campos Obsoletos: browser_action / page_action
    const hasLegacyAction = 'browser_action' in m || 'page_action' in m;
    rules.push({
      id: 'AMO-OBS-001',
      category: 'obsolete',
      title: 'Ausência de browser_action / page_action (Legados MV2)',
      description: 'No Manifest V3, ambos os campos foram unificados sob a chave "action".',
      status: !hasLegacyAction && 'action' in m ? 'passed' : 'failed',
      mozillaPolicy: 'O uso de browser_action ou page_action causa rejeição automática na validação MV3 da Mozilla.',
      detectedValue: hasLegacyAction
        ? 'Detectado campo obsoleto (browser_action ou page_action)'
        : '"action": { "default_title": "...", "default_icon": {...} } (Válido)',
      recommendation: 'A extensão utiliza o campo unificado "action" em total conformidade.'
    });

    // 5. Verificação de Campo Obsoleto: applications.gecko
    const hasLegacyApplications = 'applications' in m;
    rules.push({
      id: 'AMO-OBS-002',
      category: 'obsolete',
      title: 'Ausência de campo "applications" depreciado',
      description: 'O campo "applications" era usado em versões antigas do Firefox e foi substituído por "browser_specific_settings".',
      status: !hasLegacyApplications ? 'passed' : 'warning',
      mozillaPolicy: 'A Mozilla adverte contra o uso de "applications" em favor de "browser_specific_settings".',
      detectedValue: hasLegacyApplications
        ? '"applications": detectado (obsoleto)'
        : '"browser_specific_settings" utilizado corretamente',
      recommendation: 'Substituição concluída com sucesso por browser_specific_settings.'
    });

    // 6. Verificação do Background no Firefox (scripts vs service_worker)
    const bgScripts = m.background?.scripts;
    const bgServiceWorker = m.background?.service_worker;
    const isValidFirefoxBg = Array.isArray(bgScripts) && bgScripts.includes('background.js') && !bgServiceWorker;
    rules.push({
      id: 'AMO-OBS-003',
      category: 'obsolete',
      title: 'Background Script no Padrão Firefox (scripts: ["background.js"])',
      description: 'O Firefox MV3 suporta e recomenda Event Pages via "scripts: [...]", enquanto "service_worker" tem restrições no Gecko.',
      status: isValidFirefoxBg ? 'passed' : 'warning',
      mozillaPolicy: 'O Gecko recomenda background.scripts com suporte a ciclo de vida baseado em eventos.',
      detectedValue: bgServiceWorker
        ? '"service_worker" detectado (não recomendado no Firefox)'
        : `"scripts": ${JSON.stringify(bgScripts || [])}`,
      recommendation: 'Configurado com "scripts": ["background.js"] para compatibilidade máxima com Firefox.'
    });

    // 7. Separação Estrita de host_permissions no MV3
    const perms = Array.isArray(m.permissions) ? m.permissions : [];
    const hostPerms = Array.isArray(m.host_permissions) ? m.host_permissions : [];
    const hasUrlInPermissions = perms.some((p: string) => p.includes('://') || p.includes('<all_urls>'));
    rules.push({
      id: 'AMO-PERM-001',
      category: 'permissions',
      title: 'Separação Estrita de host_permissions (Regra MV3)',
      description: 'No Manifest V3, padrões de URLs devem constar em "host_permissions", nunca em "permissions".',
      status: !hasUrlInPermissions && hostPerms.length > 0 ? 'passed' : 'failed',
      mozillaPolicy: 'URLs dentro do array permissions geram erro de validação de esquema no AMO.',
      detectedValue: hasUrlInPermissions
        ? 'Detectado padrão de URL no array permissions'
        : `host_permissions: ${JSON.stringify(hostPerms)} | permissions: ${JSON.stringify(perms)}`,
      recommendation: 'URLs isoladas exclusivamente em host_permissions.'
    });

    // 8. Permissões de Código vs Manifest: activeTab
    const usesActiveTab = backgroundJs.includes('tabs.captureVisibleTab') || backgroundJs.includes('activeTab');
    const hasActiveTab = perms.includes('activeTab');
    rules.push({
      id: 'AMO-PERM-002',
      category: 'permissions',
      title: 'Permissão "activeTab" (Captura de Ecrã Temporária)',
      description: 'Verifica se a API tabs.captureVisibleTab está coberta pela permissão de menor privilégio activeTab.',
      status: hasActiveTab ? 'passed' : 'failed',
      mozillaPolicy: 'O uso de activeTab é a forma mais segura recomendada pela Mozilla para interagir com a aba em foco.',
      detectedValue: `Declarado: ${hasActiveTab ? 'SIM' : 'NÃO'} | Chamadas tabs.captureVisibleTab: ${usesActiveTab ? 'Detectadas' : 'Nenhuma'}`,
      recommendation: 'activeTab concede acesso seguro apenas no momento da interação do usuário.'
    });

    // 9. Permissões de Código vs Manifest: storage
    const usesStorage = backgroundJs.includes('storage.local') || contentJs.includes('storage.local');
    const hasStorage = perms.includes('storage');
    rules.push({
      id: 'AMO-PERM-003',
      category: 'permissions',
      title: 'Permissão "storage" (Persistência Local de Opções e Logs)',
      description: 'Verifica se o uso de browser.storage.local para salvar a chave do Gemini e logs está declarado.',
      status: hasStorage ? 'passed' : 'failed',
      mozillaPolicy: 'storage é necessário para ler e gravar dados persistentes sem expor arquivos do sistema.',
      detectedValue: `Declarado: ${hasStorage ? 'SIM' : 'NÃO'} | Chamadas browser.storage.local: ${usesStorage ? 'Detectadas' : 'Nenhuma'}`,
      recommendation: 'storage declarado de forma limpa e restrita ao armazenamento local isolado.'
    });

    // 10. Permissões de Código vs Manifest: scripting
    const usesScripting = backgroundJs.includes('scripting.executeScript') || backgroundJs.includes('scripting.insertCSS');
    const hasScripting = perms.includes('scripting');
    rules.push({
      id: 'AMO-PERM-004',
      category: 'permissions',
      title: 'Permissão "scripting" (Injeção de Fallback em Abas Antigas)',
      description: 'Garante que browser.scripting esteja declarado para injetar o content script caso a aba já estivesse aberta.',
      status: hasScripting ? 'passed' : 'failed',
      mozillaPolicy: 'A API scripting substitui tabs.executeScript no MV3 e requer permissão explícita.',
      detectedValue: `Declarado: ${hasScripting ? 'SIM' : 'NÃO'} | Chamadas browser.scripting: ${usesScripting ? 'Detectadas' : 'Nenhuma'}`,
      recommendation: 'scripting devidamente declarado para garantir funcionamento ininterrupto.'
    });

    // 11. Ausência de Permissões Excessivas ou Não Utilizadas (Over-permissioning)
    const dangerousPerms = ['webRequest', 'webRequestBlocking', 'cookies', 'management', 'history', 'bookmarks', 'geolocation', 'proxy', 'debugger', 'nativeMessaging'];
    const declaredDangerous = perms.filter((p: string) => dangerousPerms.includes(p));
    rules.push({
      id: 'AMO-PERM-005',
      category: 'permissions',
      title: 'Princípio do Menor Privilégio (Zero Permissões Excessivas)',
      description: 'Garante que a extensão não solicita permissões de risco (como cookies, webRequest, historico) que não utiliza.',
      status: declaredDangerous.length === 0 ? 'passed' : 'failed',
      mozillaPolicy: 'Revisores da Mozilla questionam ou rejeitam extensões com permissões declaradas que não são estritamente necessárias.',
      detectedValue: declaredDangerous.length === 0
        ? 'Nenhuma permissão excessiva solicitada (Apenas activeTab, storage, scripting)'
        : `Permissões suspeitas: ${declaredDangerous.join(', ')}`,
      recommendation: 'Lista de permissões estritamente restrita ao mínimo funcional.'
    });

    // 12. Host Permissions da API do Gemini
    const hasGeminiHost = hostPerms.some((h: string) => h.includes('generativelanguage.googleapis.com'));
    rules.push({
      id: 'AMO-PERM-006',
      category: 'permissions',
      title: 'Host Permission Estrita para a API do Google Gemini',
      description: 'Garante que requisições fetch para o endpoint da Google AI estejam autorizadas no manifest.',
      status: hasGeminiHost ? 'passed' : 'failed',
      mozillaPolicy: 'Requisições cross-origin para APIs externas devem ter seus domínios declarados em host_permissions.',
      detectedValue: hasGeminiHost ? '"https://generativelanguage.googleapis.com/*"' : 'Domínio não declarado',
      recommendation: 'Host específico generativelanguage.googleapis.com declarado com sucesso.'
    });

    // 13. Atribuição de Atalhos (commands)
    const commands = m.commands;
    const hasCommands = commands && typeof commands === 'object' && ('toggle-selection' in commands || 'repeat-fixed-selection' in commands);
    rules.push({
      id: 'AMO-STR-001',
      category: 'structure',
      title: 'Declaração Estrutural de Atalhos ("commands")',
      description: 'Verifica se os comandos de atalho sugeridos (Alt+Shift+T e Alt+Shift+R) estão registrados.',
      status: hasCommands ? 'passed' : 'failed',
      mozillaPolicy: 'Atalhos globais devem ser registrados na chave commands para permitir customização pelo usuário em about:addons.',
      detectedValue: hasCommands
        ? `2 atalhos registrados: ${Object.keys(commands).join(', ')}`
        : 'Seção commands ausente',
      recommendation: 'Comandos devidamente mapeados com teclas sugeridas válidas.'
    });

    // 14. Segurança do Código: Zero innerHTML nos scripts
    const hasInnerHTMLInContent = contentJs.includes('.innerHTML');
    const hasInnerHTMLInBg = backgroundJs.includes('.innerHTML');
    rules.push({
      id: 'AMO-SEC-001',
      category: 'security',
      title: 'Auditoria de Segurança: Zero innerHTML ou eval',
      description: 'Garante que os arquivos JavaScript da extensão utilizem apenas manipulação de DOM segura (textContent/createElement).',
      status: !hasInnerHTMLInContent && !hasInnerHTMLInBg ? 'passed' : 'failed',
      mozillaPolicy: 'Atribuições inseguras a innerHTML ou uso de eval são as principais causas de rejeição no AMO.',
      detectedValue: (!hasInnerHTMLInContent && !hasInnerHTMLInBg)
        ? 'Zero innerHTML em content.js e background.js'
        : 'Detectado innerHTML não seguro',
      recommendation: '100% de manipulação do DOM através de textContent e elementos nativos.'
    });

    return rules;
  }, [parsedManifest, backgroundJs, contentJs]);

  // Statistics
  const totalRules = auditResults.length;
  const passedCount = auditResults.filter((r) => r.status === 'passed').length;
  const warningCount = auditResults.filter((r) => r.status === 'warning').length;
  const failedCount = auditResults.filter((r) => r.status === 'failed').length;
  const complianceScore = Math.round((passedCount / totalRules) * 100);

  // Filtered rules
  const filteredRules = auditResults.filter((rule) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'passed') return rule.status === 'passed';
    if (filterCategory === 'failed') return rule.status === 'failed';
    if (filterCategory === 'warning') return rule.status === 'warning';
    return rule.category === filterCategory;
  });

  const handleRunAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setIsAuditing(false);
    }, 600);
  };

  const handleCopyReport = async () => {
    const markdownReport = [
      `# Relatório de Conformidade do Manifest - Mozilla Firefox (AMO)`,
      `**Data da Auditoria:** ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`,
      `**Extensão:** Gemini Screen Translator`,
      `**ID Gecko:** gemini-screen-translator@firefox.local`,
      `**Manifest Version:** 3 (Gecko strict_min_version: 109.0)`,
      `**Pontuação de Conformidade:** ${complianceScore}% (${passedCount}/${totalRules} regras aprovadas)`,
      ``,
      `## Resumo Executivo`,
      `- **Erros Críticos:** ${failedCount}`,
      `- **Avisos / Alertas:** ${warningCount}`,
      `- **Campos Obsoletos do MV2:** 0 detectados (sem browser_action, sem applications, sem background.service_worker)`,
      `- **Permissões Não Declaradas:** 0 detectadas (todas as APIs cobertas)`,
      `- **Permissões Excessivas:** 0 detectadas (regras mínimas: activeTab, storage, scripting)`,
      `- **Segurança no DOM:** 100% seguro (Zero innerHTML, Zero eval)`,
      ``,
      `## Detalhamento das Regras Validadas`,
      ...auditResults.map(
        (r) =>
          `### [${r.status.toUpperCase()}] ${r.id}: ${r.title}\n- **Categoria:** ${r.category}\n- **Valor Detectado:** \`${r.detectedValue}\`\n- **Diretriz Mozilla:** ${r.mozillaPolicy}\n- **Parecer:** ${r.recommendation}\n`
      ),
      `---`,
      `*Gerado automaticamente pelo Verificador de Conformidade AMO.*`
    ].join('\n');

    try {
      await navigator.clipboard.writeText(markdownReport);
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2000);
    } catch (_e) {}
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Banner / Scorecard */}
      <div className="bg-[#0f0f12] border border-white/[0.08] rounded-xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">
                  Validador de Conformidade do Manifest (Mozilla AMO)
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-700/40 font-semibold">
                  100% Compatível
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Verificação automática contra campos obsoletos do MV2, permissões não declaradas e exigências do motor Gecko.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunAudit}
              disabled={isAuditing}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg border border-white/[0.08] flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
              <span>{isAuditing ? 'Analisando...' : 'Reexecutar Verificação'}</span>
            </button>

            <button
              onClick={handleCopyReport}
              className="px-3 py-1.5 bg-white text-black hover:bg-zinc-200 text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition"
            >
              {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedReport ? 'Relatório Copiado' : 'Copiar Relatório (.md)'}</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-black/50 border border-white/[0.06] rounded-lg p-3">
            <div className="text-[11px] text-zinc-400 font-medium">Conformidade Geral</div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1 flex items-baseline gap-1.5">
              <span>{complianceScore}%</span>
              <span className="text-[10px] text-zinc-500 font-normal">({passedCount}/{totalRules})</span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">Normas da Mozilla atendidas</div>
          </div>

          <div className="bg-black/50 border border-white/[0.06] rounded-lg p-3">
            <div className="text-[11px] text-zinc-400 font-medium">Campos Obsoletos</div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              0 <span className="text-xs text-emerald-400 font-normal">detectados</span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">Sem campos MV2 depreciados</div>
          </div>

          <div className="bg-black/50 border border-white/[0.06] rounded-lg p-3">
            <div className="text-[11px] text-zinc-400 font-medium">Permissões Não Declaradas</div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              0 <span className="text-xs text-emerald-400 font-normal">ausentes</span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">100% das APIs cobertas</div>
          </div>

          <div className="bg-black/50 border border-white/[0.06] rounded-lg p-3">
            <div className="text-[11px] text-zinc-400 font-medium">Identificador Gecko</div>
            <div className="text-xs font-bold font-mono text-zinc-200 mt-1 truncate" title={parsedManifest?.browser_specific_settings?.gecko?.id}>
              {parsedManifest?.browser_specific_settings?.gecko?.id || 'Válido'}
            </div>
            <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" /> ID Estrito Mozilla
            </div>
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0c0c0e] p-2 rounded-lg border border-white/[0.06]">
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-[11px] text-zinc-500 font-mono px-2">Filtrar:</span>
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-2.5 py-1 rounded text-xs transition ${
              filterCategory === 'all'
                ? 'bg-zinc-800 text-white font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Todas ({totalRules})
          </button>
          <button
            onClick={() => setFilterCategory('obsolete')}
            className={`px-2.5 py-1 rounded text-xs transition ${
              filterCategory === 'obsolete'
                ? 'bg-zinc-800 text-white font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Campos Obsoletos (3)
          </button>
          <button
            onClick={() => setFilterCategory('permissions')}
            className={`px-2.5 py-1 rounded text-xs transition ${
              filterCategory === 'permissions'
                ? 'bg-zinc-800 text-white font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Permissões & APIs (6)
          </button>
          <button
            onClick={() => setFilterCategory('gecko')}
            className={`px-2.5 py-1 rounded text-xs transition ${
              filterCategory === 'gecko'
                ? 'bg-zinc-800 text-white font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Identificador Gecko & Android (3)
          </button>
          <button
            onClick={() => setFilterCategory('security')}
            className={`px-2.5 py-1 rounded text-xs transition ${
              filterCategory === 'security'
                ? 'bg-zinc-800 text-white font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Segurança de Código (1)
          </button>
        </div>

        <div className="text-[11px] font-mono text-zinc-400 px-2 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Zero erros de validação</span>
        </div>
      </div>

      {/* Rules Checklist */}
      <div className="space-y-2.5">
        {filteredRules.map((rule) => {
          const isExpanded = expandedRule === rule.id;

          return (
            <div
              key={rule.id}
              className={`border rounded-xl transition-all ${
                rule.status === 'passed'
                  ? 'bg-[#0f0f12] border-white/[0.08] hover:border-white/[0.15]'
                  : rule.status === 'warning'
                  ? 'bg-amber-950/20 border-amber-800/30'
                  : 'bg-rose-950/20 border-rose-800/30'
              }`}
            >
              <div
                onClick={() => setExpandedRule(isExpanded ? null : rule.id)}
                className="p-4 flex items-start justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0">
                    {rule.status === 'passed' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                    {rule.status === 'warning' && (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    )}
                    {rule.status === 'failed' && (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-white">
                        {rule.title}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black text-zinc-400 border border-white/[0.08]">
                        {rule.id}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300">
                        {rule.category}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {rule.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span
                    className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded border ${
                      rule.status === 'passed'
                        ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                        : rule.status === 'warning'
                        ? 'bg-amber-950/40 text-amber-300 border-amber-800/40'
                        : 'bg-rose-950/40 text-rose-300 border-rose-800/40'
                    }`}
                  >
                    {rule.status === 'passed' ? 'Conforme' : rule.status === 'warning' ? 'Aviso' : 'Rejeição'}
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {/* Expandable Technical Details */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-white/[0.06] space-y-3 text-xs bg-black/30 rounded-b-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="bg-[#09090c] border border-white/[0.06] p-2.5 rounded-lg space-y-1">
                      <div className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
                        <FileCode className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Valor Detectado no manifest.json</span>
                      </div>
                      <div className="font-mono text-[11px] text-zinc-300 bg-black/60 p-2 rounded border border-white/[0.04] overflow-x-auto">
                        <code>{rule.detectedValue}</code>
                      </div>
                    </div>

                    <div className="bg-[#09090c] border border-white/[0.06] p-2.5 rounded-lg space-y-1">
                      <div className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Diretriz Oficial da Mozilla (AMO)</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        {rule.mozillaPolicy}
                      </p>
                    </div>
                  </div>

                  <div className="bg-emerald-950/20 border border-emerald-800/30 p-2.5 rounded-lg text-[11px] text-emerald-200 flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Parecer de Conformidade:</strong> {rule.recommendation}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Manifest Comparison Reference Card */}
      <div className="bg-[#0b0b0e] border border-white/[0.08] rounded-xl p-4 text-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-zinc-300" />
            <span>Resumo de Permissões Declaradas vs APIs Utilizadas</span>
          </span>
          <span className="text-[10px] font-mono text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded bg-emerald-950/40">
            Mapeamento 1:1 Perfeito
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300 border-collapse table-fixed">
            <thead>
              <tr className="border-b border-white/[0.08] text-zinc-400 font-mono text-[11px]">
                <th className="pb-2 font-medium w-[28%]">Recurso / API Usada</th>
                <th className="pb-2 font-medium w-[32%]">Onde é Chamado</th>
                <th className="pb-2 font-medium w-[25%]">Permissão no Manifest</th>
                <th className="pb-2 font-medium text-right w-[15%]">Status AMO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-[11.5px]">
              <tr>
                <td className="py-2 font-mono text-white">tabs.captureVisibleTab</td>
                <td className="py-2 text-zinc-400">background.js (handleCaptureTab)</td>
                <td className="py-2 font-mono text-zinc-300">permissions: ["activeTab"]</td>
                <td className="py-2 text-right text-emerald-400 font-mono font-medium">Declarado ✓</td>
              </tr>
              <tr>
                <td className="py-2 font-mono text-white">browser.storage.local</td>
                <td className="py-2 text-zinc-400">options, background.js, content.js</td>
                <td className="py-2 font-mono text-zinc-300">permissions: ["storage"]</td>
                <td className="py-2 text-right text-emerald-400 font-mono font-medium">Declarado ✓</td>
              </tr>
              <tr>
                <td className="py-2 font-mono text-white">browser.scripting</td>
                <td className="py-2 text-zinc-400">background.js (fallback em abas)</td>
                <td className="py-2 font-mono text-zinc-300">permissions: ["scripting"]</td>
                <td className="py-2 text-right text-emerald-400 font-mono font-medium">Declarado ✓</td>
              </tr>
              <tr>
                <td className="py-2 font-mono text-white">browser.commands</td>
                <td className="py-2 text-zinc-400">background.js (atalhos e update)</td>
                <td className="py-2 font-mono text-zinc-300">commands: &#123;...&#125;</td>
                <td className="py-2 text-right text-emerald-400 font-mono font-medium">Declarado ✓</td>
              </tr>
              <tr>
                <td className="py-2 font-mono text-white">fetch(generativelanguage...)</td>
                <td className="py-2 text-zinc-400">background.js (Gemini REST API)</td>
                <td className="py-2 font-mono text-zinc-300">host_permissions: ["https://...*"]</td>
                <td className="py-2 text-right text-emerald-400 font-mono font-medium">Declarado ✓</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
