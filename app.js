// ===== INDEXEDDB COM DEXIE.JS =====
const db = new Dexie('ThomsonReutersPSTracker');

// Definir schema do banco de dados (versão 1)
db.version(1).stores({
    users: 'userId, userName, userRole, userEmail, lastAccess',
    deliveries: '++id, userId, title, date, month, status, category, impact',
    kpis: '++id, userId, name, month, target, current, unit',
    weeklyRecords: '++id, userId, week, date, activities, goals',
    customGoals: '++id, userId, title, category, status, dueDate, source',
    strengths: '++id, userId, content, date',
    opportunities: '++id, userId, content, date',
    attentionPoints: '++id, userId, content, date',
    advanceSteps: '++id, userId, content, date',
    reviews: '++id, userId, date, type',
    config: 'userId, userName, userRole, userManager, userEmail'
});

// ===== SISTEMA DE USUÁRIOS =====
let currentUserId = null;

// Data Storage (mantido para compatibilidade temporária)
const APP_DATA = {
    deliveries: [],
    kpis: [],
    weeklyRecords: [],
    strengths: [],
    opportunities: [],
    attentionPoints: [],
    advanceSteps: [],
    reviews: [],
    quickNotes: [], // Quick Add notes
    customGoals: [], // Custom user goals
    config: {
        userName: '',
        userRole: '',
        userManager: '',
        userEmail: '',
        emailReminders: true,
        monthlyReminders: true
    }
};

// Chart instances (para evitar erro de canvas já em uso)
let kpiChartInstance = null;

// ===== FORMATADOR DE TEXTO PROFISSIONAL (IA AVANÇADA) =====
function formatTextProfessionally(text) {
    if (!text || text.trim() === '') return '';

    text = text.trim().replace(/\s+/g, ' ');

    // Lista de projetos/produtos/clientes conhecidos da Thomson Reuters
    const knownEntities = ['Tax One', 'Onesource', 'ONESOURCE', 'Cacau Show', 'CacauShow', 'Novartis', 'Sanofi', 'DF-e', 'DFe', 'SAP', 'Unstoppable'];

    // Regex para detectar entidades (projetos/clientes/soluções)
    const entityPattern = new RegExp(
        `\\b(projeto|client[e]?|solução|solution|produto|product|sistema|para|no|na|do|da)\\s+(${knownEntities.join('|')}|[A-Z][a-zA-Z0-9\\s-]{2,30})`,
        'gi'
    );

    // FASE 1: SEPARAÇÃO INTELIGENTE - identifica múltiplas atividades
    let items = [];

    // Primeiro separa por ponto-e-vírgula (separador forte)
    const mainSegments = text.split(/\s*;\s*/);

    mainSegments.forEach(segment => {
        segment = segment.trim();

        // Conta quantas entidades diferentes tem no segmento
        const entitiesInSegment = [...segment.matchAll(entityPattern)];

        // Se tem múltiplas entidades diferentes, divide antes de cada uma
        if (entitiesInSegment.length > 1) {
            const uniqueEntities = [...new Set(entitiesInSegment.map(e => e[2].trim().toLowerCase()))];
            if (uniqueEntities.length > 1) {
                // Divide antes de cada "projeto", "para", "no", etc
                const parts = segment.split(/(?=\b(?:projeto|client[e]?|solução|para\s+[A-Z]|no\s+[A-Z]|na\s+[A-Z]))/i);
                items.push(...parts.filter(p => p.trim().length > 8));
                return;
            }
        }

        // Se não tem múltiplas entidades, tenta separar por vírgulas + ações
        // Detecta vírgulas que separam ações diferentes
        const actionVerbs = /\b(fiz|realizei|participei|trabalhei|configurei|desenvolvi|ganhei|criei|elaborei|implementei|coordenei)/i;
        const commaParts = segment.split(/,\s+/);

        if (commaParts.length > 1) {
            const hasMultipleActions = commaParts.filter(p => actionVerbs.test(p) || p.split(/\s+/).length > 4).length > 1;
            if (hasMultipleActions) {
                items.push(...commaParts);
                return;
            }
        }

        // Se não conseguiu dividir, adiciona como um único item
        items.push(segment);
    });

    // Remove itens muito pequenos
    items = items.map(i => i.trim()).filter(i => i.length > 8);

    // FASE 2: FORMATAÇÃO CORPORATIVA INTELIGENTE
    const formattedItems = items.map(item => {
        // Remove verbos informais
        item = item.replace(/^(fiz|fazi|fez|realizei|realizou|trabalhei|trabalhamos|participei|participou|ganhei|ganhou)\s+/i, '');
        item = item.replace(/^(a|o|de|da|do|na|no|em|para|um|uma)\s+/i, '');

        // Capitaliza
        item = item.charAt(0).toUpperCase() + item.slice(1);

        // Extrai informação de projeto/cliente/solução
        let entityInfo = null;
        const entityMatch = item.match(/\b(projeto|client[e]?|solução|solution|produto|para|no|na)\s+([A-Z][a-zA-Z0-9\s-]+?)(?=\s*[-:,;]|\s+para|\s+no|\s+na|\s+com|\s+dentro|$)/i);
        if (entityMatch) {
            entityInfo = {
                type: entityMatch[1].toLowerCase(),
                name: entityMatch[2].trim().replace(/\s+(df-?e|sap|one|for)\b/i, ' $1')
            };
        }

        let formatted = item;

        // CATEGORIZAÇÃO INTELIGENTE POR TIPO DE ATIVIDADE

        // 1. REUNIÕES / ACOMPANHAMENTOS
        if (/\b(reuni[ãa]o|meeting|acompanhamento|encontro|alinhamento)/i.test(item)) {
            if (entityInfo) {
                const entityType = entityInfo.type.match(/client/i) ? 'Cliente' :
                                  entityInfo.type.match(/solução|solution/i) ? 'Solução' :
                                  entityInfo.type.match(/projeto/i) ? 'Projeto' : 'Sistema';
                formatted = `Participação em reunião de acompanhamento - ${entityType}: ${entityInfo.name}`;
            } else {
                formatted = `Participação em ${item.charAt(0).toLowerCase() + item.slice(1)}`;
            }
        }

        // 2. CONFIGURAÇÃO / CADASTROS / SETUP
        else if (/\b(config|cadastr|setup|cria[çc][ãa]o|cria[çc]ao)\s+(de\s+)?(usuário|usuario|user|portal|sistema|perfil|acesso)/i.test(item)) {
            const targetMatch = item.match(/\b(usuário|usuario|user|portal|sistema|perfil|acesso)s?\b/i);
            const locationMatch = item.match(/\b(cacau\s*show|portal|sistema|plataforma|show)\b/i);

            if (targetMatch && locationMatch) {
                formatted = `Configuração de ${targetMatch[0].toLowerCase()}s no ${locationMatch[0]}`;
            } else if (targetMatch) {
                formatted = `Configuração de ${targetMatch[0].toLowerCase()}s`;
            } else {
                formatted = `Configuração de ${item.charAt(0).toLowerCase() + item.slice(1)}`;
            }
        }

        // 3. DESENVOLVIMENTO / AUTOMAÇÃO / IA
        else if (/\b(IA|AI|inteligencia|automação|automaç[ãa]o|desenvolv|implementa|cria[çc][ãa]o|gera[çc][ãa]o)\s+(de\s+|para\s+)?(relatório|relatorio|sistema|feature|funcionalidade|ferramenta|script)/i.test(item)) {
            const purposeMatch = item.match(/(relatório|relatorio|sistema|feature|funcionalidade|ferramenta|script)s?\s+(semanal|mensal|de\s+\w+)?/i);

            if (/\b(IA|AI|inteligencia|automação|automaç[ãa]o)/i.test(item)) {
                formatted = `Desenvolvimento de ${purposeMatch ? purposeMatch[0].toLowerCase() : 'automação com IA'} para otimização de processos`;
            } else {
                formatted = `Desenvolvimento de ${item.charAt(0).toLowerCase() + item.slice(1)}`;
            }
        }

        // 4. PRÊMIOS / CONQUISTAS / RECONHECIMENTOS
        else if (/\b(pr[êe]mio|reconhecimento|conquista|award|revela[çc][ãa]o|destaque|ganho|Unstoppable)/i.test(item)) {
            const awardMatch = item.match(/(pr[êe]mio|reconhecimento|award)\s+(de\s+|da\s+|do\s+)?([A-Z][\w\s]+?)(?=\s+da|\s+do|\s+na|\s+no|\s+de|$)/i);

            if (awardMatch) {
                formatted = `Conquista: ${awardMatch[0].trim()}`;
            } else if (/Unstoppable/i.test(item)) {
                formatted = 'Conquista: Prêmio Unstoppable';
            } else {
                formatted = `Conquista: ${item.charAt(0).toUpperCase() + item.slice(1)}`;
            }
        }

        // 5. ATRAÇÃO / CAPTAÇÃO DE USUÁRIOS
        else if (/\b(atra[çc][ãa]o|capta[çc][ãa]o|convite|divulga[çc][ãa]o)\s+(de\s+)?(usuário|usuario|user|cliente)/i.test(item)) {
            formatted = `Atração de usuários para ${entityInfo ? entityInfo.name : 'a plataforma'}`;
        }

        // 6. FOTOS / EVENTOS / INTEGRAÇÃO
        else if (/\b(foto|imagem|estagiário|estagiario|evento|integra[çc][ãa]o)/i.test(item)) {
            if (/estagiário|estagiario/i.test(item)) {
                formatted = 'Participação em evento de integração com estagiários';
            } else if (/foto/i.test(item) && /atra[çc][ãa]o/i.test(item)) {
                formatted = 'Participação em iniciativa de atração de usuários';
            } else {
                formatted = `Participação em ${item.charAt(0).toLowerCase() + item.slice(1)}`;
            }
        }

        // 7. DOCUMENTAÇÃO / RELATÓRIOS
        else if (/\b(relatório|report|documento|apresenta[çc][ãa]o|documenta[çc][ãa]o)/i.test(item)) {
            formatted = `Elaboração de ${item.charAt(0).toLowerCase() + item.slice(1)}`;
        }

        // 8. PROJETOS GENÉRICOS
        else if (entityInfo && /\bprojeto/i.test(item)) {
            formatted = `Atuação no Projeto ${entityInfo.name}`;
        }

        // 9. DEFAULT - já tem verbo corporativo ou adiciona
        else {
            if (!/^(Execução|Realização|Participação|Atuação|Condução|Elaboração|Desenvolvimento|Implementação|Análise|Coordenação|Gestão|Planejamento|Acompanhamento|Resolução|Liderança|Conquista|Configuração|Atração)/i.test(item)) {
                formatted = `Realização de ${item.charAt(0).toLowerCase() + item.slice(1)}`;
            }
        }

        // Limpeza final
        formatted = formatted
            .replace(/\s+/g, ' ')
            .replace(/\s+([,;.])/g, '$1')
            .replace(/\s*[.,;]+$/, '')
            .replace(/\s+de\s+de\s+/gi, ' de ')
            .replace(/\s+no\s+no\s+/gi, ' no ')
            .replace(/\s+para\s+para\s+/gi, ' para ')
            .trim();

        return '• ' + formatted;
    });

    return formattedItems.join('\n');
}

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    checkUserLogin();
});

// ===== LOGIN/LOGOUT FUNCTIONS =====
function checkUserLogin() {
    const loggedUserId = localStorage.getItem('currentUserId');

    if (loggedUserId) {
        // Usuário já está logado
        currentUserId = loggedUserId;
        showMainApp();
    } else {
        // Mostrar tela de login
        showLoginScreen();
    }
}

function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
}

async function showMainApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';

    // Carregar dados do usuário (aguardar)
    await loadData();
    initializeApp();
    updateDashboard();
    updateUserDisplay();
    checkWeeklyReminder();
}

async function loginUser(event) {
    event.preventDefault();

    const userId = document.getElementById('loginUserId').value.trim();
    const userName = document.getElementById('loginUserName').value.trim();

    if (!userId || !userName) {
        alert('Por favor, preencha todos os campos!');
        return;
    }

    // Salvar ID do usuário atual
    currentUserId = userId;
    localStorage.setItem('currentUserId', userId);

    // Carregar ou criar dados do usuário (aguardar)
    await loadData();

    // Se for novo usuário, configurar nome
    if (!APP_DATA.config.userName) {
        APP_DATA.config.userName = userName;
        APP_DATA.config.userEmail = `${userName.split(' ')[0]}.${userName.split(' ')[1] || 'User'}@thomsonreuters.com`;
        await saveDataAsync();
    }

    await showMainApp();
    showNotification(`✅ Bem-vindo(a), ${APP_DATA.config.userName}!`, 'success');
}

function logoutUser() {
    if (confirm('Tem certeza que deseja sair? Todos os dados estão salvos.')) {
        currentUserId = null;
        localStorage.removeItem('currentUserId');
        showLoginScreen();

        // Limpar formulário de login
        document.getElementById('loginUserId').value = '';
        document.getElementById('loginUserName').value = '';

        showNotification('👋 Você saiu do sistema', 'info');
    }
}

function updateUserDisplay() {
    document.getElementById('userNameDisplay').textContent = APP_DATA.config.userName;
    document.getElementById('userRoleDisplay').textContent = APP_DATA.config.userRole || '---';
    document.getElementById('userIdDisplay').textContent = `ID: ${currentUserId}`;
}

// Load data from IndexedDB (específico por usuário)
async function loadData() {
    if (!currentUserId) {
        console.warn('❌ loadData: nenhum usuário logado');
        return;
    }

    try {
        console.log('🔍 Carregando dados do IndexedDB para usuário:', currentUserId);

        // Carregar todos os dados do usuário em paralelo
        const [deliveries, kpis, weeklyRecords, customGoals, strengths, opportunities, attentionPoints, advanceSteps, reviews, config] = await Promise.all([
            db.deliveries.where('userId').equals(currentUserId).toArray(),
            db.kpis.where('userId').equals(currentUserId).toArray(),
            db.weeklyRecords.where('userId').equals(currentUserId).toArray(),
            db.customGoals.where('userId').equals(currentUserId).toArray(),
            db.strengths.where('userId').equals(currentUserId).toArray(),
            db.opportunities.where('userId').equals(currentUserId).toArray(),
            db.attentionPoints.where('userId').equals(currentUserId).toArray(),
            db.advanceSteps.where('userId').equals(currentUserId).toArray(),
            db.reviews.where('userId').equals(currentUserId).toArray(),
            db.config.get(currentUserId)
        ]);

        // Atualizar APP_DATA
        APP_DATA.deliveries = deliveries;
        APP_DATA.kpis = kpis;
        APP_DATA.weeklyRecords = weeklyRecords;
        APP_DATA.customGoals = customGoals.filter(g => !g.isSample);
        APP_DATA.strengths = strengths;
        APP_DATA.opportunities = opportunities;
        APP_DATA.attentionPoints = attentionPoints;
        APP_DATA.advanceSteps = advanceSteps;
        APP_DATA.reviews = reviews;

        if (config) {
            APP_DATA.config = config;
        }

        console.log('✅ Dados carregados do IndexedDB:', {
            metas: APP_DATA.customGoals.length,
            entregas: APP_DATA.deliveries.length,
            kpis: APP_DATA.kpis.length,
            semanas: APP_DATA.weeklyRecords.length
        });

        // Se não tem dados no IndexedDB, tentar migrar do localStorage
        if (deliveries.length === 0 && kpis.length === 0 && customGoals.length === 0) {
            console.log('📦 IndexedDB vazio. Tentando migrar do localStorage...');
            await migrateFromLocalStorage();
        }

    } catch (e) {
        console.error('❌ Erro ao carregar dados do IndexedDB:', e);
        showNotification('❌ Erro ao carregar dados. Tentando recuperar...', 'error');
        await migrateFromLocalStorage();
    }
}

// Save data to IndexedDB (específico por usuário) - versão síncrona
function saveData() {
    saveDataAsync().catch(err => {
        console.error('❌ Erro ao salvar dados:', err);
    });
}

// Versão assíncrona de saveData
async function saveDataAsync() {
    if (!currentUserId) {
        console.warn('⚠️ Não é possível salvar dados: nenhum usuário está logado');
        return;
    }

    try {
        console.log('💾 Salvando dados no IndexedDB...');

        // Adicionar userId a todos os itens e filtrar samples
        const deliveries = APP_DATA.deliveries.map(d => ({ ...d, userId: currentUserId }));
        const kpis = APP_DATA.kpis.map(k => ({ ...k, userId: currentUserId }));
        const weeklyRecords = APP_DATA.weeklyRecords.map(w => ({ ...w, userId: currentUserId }));
        const customGoals = APP_DATA.customGoals.filter(g => !g.isSample).map(g => ({ ...g, userId: currentUserId }));
        const strengths = APP_DATA.strengths.map(s => ({ ...s, userId: currentUserId }));
        const opportunities = APP_DATA.opportunities.map(o => ({ ...o, userId: currentUserId }));
        const attentionPoints = APP_DATA.attentionPoints.map(a => ({ ...a, userId: currentUserId }));
        const advanceSteps = APP_DATA.advanceSteps.map(a => ({ ...a, userId: currentUserId }));
        const reviews = APP_DATA.reviews.map(r => ({ ...r, userId: currentUserId }));

        const config = {
            userId: currentUserId,
            ...APP_DATA.config,
            lastSaved: new Date().toISOString()
        };

        // Salvar tudo em uma transação (ACID - tudo ou nada)
        await db.transaction('rw', [db.deliveries, db.kpis, db.weeklyRecords, db.customGoals, db.strengths, db.opportunities, db.attentionPoints, db.advanceSteps, db.reviews, db.config], async () => {
            // Limpar dados antigos do usuário
            await db.deliveries.where('userId').equals(currentUserId).delete();
            await db.kpis.where('userId').equals(currentUserId).delete();
            await db.weeklyRecords.where('userId').equals(currentUserId).delete();
            await db.customGoals.where('userId').equals(currentUserId).delete();
            await db.strengths.where('userId').equals(currentUserId).delete();
            await db.opportunities.where('userId').equals(currentUserId).delete();
            await db.attentionPoints.where('userId').equals(currentUserId).delete();
            await db.advanceSteps.where('userId').equals(currentUserId).delete();
            await db.reviews.where('userId').equals(currentUserId).delete();

            // Inserir novos dados
            if (deliveries.length > 0) await db.deliveries.bulkAdd(deliveries);
            if (kpis.length > 0) await db.kpis.bulkAdd(kpis);
            if (weeklyRecords.length > 0) await db.weeklyRecords.bulkAdd(weeklyRecords);
            if (customGoals.length > 0) await db.customGoals.bulkAdd(customGoals);
            if (strengths.length > 0) await db.strengths.bulkAdd(strengths);
            if (opportunities.length > 0) await db.opportunities.bulkAdd(opportunities);
            if (attentionPoints.length > 0) await db.attentionPoints.bulkAdd(attentionPoints);
            if (advanceSteps.length > 0) await db.advanceSteps.bulkAdd(advanceSteps);
            if (reviews.length > 0) await db.reviews.bulkAdd(reviews);

            // Salvar config (put = insert ou update)
            await db.config.put(config);
        });

        console.log('✅ Dados salvos no IndexedDB:', {
            metas: customGoals.length,
            entregas: deliveries.length,
            kpis: kpis.length,
            semanas: weeklyRecords.length
        });

        // BACKUP em localStorage como segurança extra
        await saveBackupToLocalStorage();

    } catch (e) {
        console.error('❌ Erro ao salvar dados no IndexedDB:', e);
        showNotification('❌ Erro ao salvar dados! Tentando backup...', 'error');
        // Tentar salvar no localStorage como fallback
        await saveBackupToLocalStorage();
    }
}

// Migrar dados do localStorage para IndexedDB
async function migrateFromLocalStorage() {
    if (!currentUserId) return;

    try {
        const userDataKey = `professionalTrackerData_${currentUserId}`;
        const savedData = localStorage.getItem(userDataKey);

        if (!savedData) {
            console.log('ℹ️ Nenhum dado no localStorage para migrar');
            return;
        }

        console.log('📦 Migrando dados do localStorage para IndexedDB...');
        const parsed = JSON.parse(savedData);

        // Validar e corrigir dados
        if (!parsed.customGoals) parsed.customGoals = [];
        if (!parsed.deliveries) parsed.deliveries = [];
        if (!parsed.kpis) parsed.kpis = [];
        if (!parsed.weeklyRecords) parsed.weeklyRecords = [];
        if (!parsed.strengths) parsed.strengths = [];
        if (!parsed.opportunities) parsed.opportunities = [];
        if (!parsed.attentionPoints) parsed.attentionPoints = [];
        if (!parsed.advanceSteps) parsed.advanceSteps = [];
        if (!parsed.reviews) parsed.reviews = [];
        if (!parsed.config) parsed.config = {};

        // Atualizar APP_DATA
        Object.assign(APP_DATA, parsed);

        // Salvar no IndexedDB
        await saveData();

        showNotification('✅ Dados migrados do localStorage para IndexedDB!', 'success');
        console.log('✅ Migração concluída:', {
            metas: parsed.customGoals?.length || 0,
            entregas: parsed.deliveries?.length || 0,
            kpis: parsed.kpis?.length || 0
        });

    } catch (e) {
        console.error('❌ Erro na migração:', e);
        showNotification('⚠️ Erro ao migrar dados antigos', 'warning');
    }
}

// Backup em localStorage como segurança extra
async function saveBackupToLocalStorage() {
    if (!currentUserId) return;

    try {
        const backupData = {
            ...APP_DATA,
            customGoals: APP_DATA.customGoals.filter(g => !g.isSample),
            lastBackup: new Date().toISOString()
        };

        const backupKey = `professionalTrackerData_${currentUserId}_backup`;
        localStorage.setItem(backupKey, JSON.stringify(backupData));

        console.log('💾 Backup salvo em localStorage');
    } catch (e) {
        console.warn('⚠️ Erro ao salvar backup em localStorage:', e);
    }
}

// Initialize App
function initializeApp() {
    // Set current month
    const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    document.getElementById('currentMonth').textContent = currentMonth;

    // Set default week and month in inputs
    const today = new Date();
    const currentWeek = getWeekNumber(today);
    document.getElementById('weekDate').value = `${today.getFullYear()}-W${currentWeek.toString().padStart(2, '0')}`;

    const currentMonthInput = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
    document.getElementById('deliveryMonthFilter').value = currentMonthInput;
    document.getElementById('kpiMonth').value = currentMonthInput;

    // Load all sections
    updateDeliveriesList();
    updateKpisList();
    updateWeeklyHistory();
    updateAnalysisLists();
    updateReviewsHistory();
    loadConfigData();
}

// Navigation
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected section
    document.getElementById(sectionId).classList.add('active');

    // Add active class to clicked button
    event.target.classList.add('active');

    // Render custom goals when Metas section is shown
    if (sectionId === 'metas') {
        renderCustomGoals();
    }
}

// Dashboard Updates
function updateDashboard() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Count deliveries for current month
    const monthDeliveries = APP_DATA.deliveries.filter(d => {
        const dDate = new Date(d.date);
        return dDate.getMonth() === currentMonth && dDate.getFullYear() === currentYear;
    });

    document.getElementById('monthDeliveries').textContent = monthDeliveries.length;

    // Calculate average performance from KPIs
    const currentMonthKpis = APP_DATA.kpis.filter(k => {
        const kDate = new Date(k.month + '-01');
        return kDate.getMonth() === currentMonth && kDate.getFullYear() === currentYear;
    });

    let avgPerf = 0;
    if (currentMonthKpis.length > 0) {
        const totalPerf = currentMonthKpis.reduce((sum, kpi) => {
            return sum + (kpi.current / kpi.target * 100);
        }, 0);
        avgPerf = (totalPerf / currentMonthKpis.length).toFixed(1);
    }

    document.getElementById('avgPerformance').textContent = avgPerf + '%';

    // Calculate evolution (mock for now)
    const evolution = Math.random() * 20 - 5;
    const evolutionEl = document.getElementById('evolution');
    evolutionEl.textContent = (evolution >= 0 ? '+' : '') + evolution.toFixed(1) + '%';
    evolutionEl.style.color = evolution >= 0 ? 'var(--tr-teal)' : '#dc3545';

    // Next reminder
    const nextFriday = getNextFriday();
    document.getElementById('nextReminder').textContent = nextFriday;

    // Update charts
    updateCharts();

    // Update recent activity
    updateRecentActivity();
}

function getNextFriday() {
    const today = new Date();
    const day = today.getDay();
    const daysUntilFriday = (5 - day + 7) % 7 || 7;
    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + daysUntilFriday);
    return nextFriday.toLocaleDateString('pt-BR');
}

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}

// Charts
function updateCharts() {
    updateKpiChart();
    updateWeeklyTrendChart();
    updateGoalsDistributionChart();
    updateStreakDisplay();
}

// ============================================
// MELHORIA #3: DASHBOARD VISUAL MELHORADO
// ============================================

function updateWeeklyTrendChart() {
    const ctx = document.getElementById('weeklyTrendChart');
    if (!ctx) return;

    // Get last 8 weeks of data
    const last8Weeks = APP_DATA.weeklyRecords.slice(-8).reverse();

    if (last8Weeks.length === 0) {
        ctx.parentElement.innerHTML = '<p style="text-align: center; color: var(--tr-grey4); padding: 40px;">Adicione registros semanais para ver a evolução</p>';
        return;
    }

    const labels = last8Weeks.map(r => r.week || 'N/A').reverse();
    const activityCounts = last8Weeks.map(r => {
        if (!r.goalsAlignment) return 0;
        return Object.values(r.goalsAlignment).reduce((sum, arr) => sum + arr.length, 0);
    }).reverse();

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Atividades Relacionadas a Metas',
                data: activityCounts,
                borderColor: '#D64000',
                backgroundColor: 'rgba(214, 64, 0, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
}

function updateGoalsDistributionChart() {
    const ctx = document.getElementById('goalsDistributionChart');
    if (!ctx) return;

    const goalCounts = {
        customer: 0,
        aiRace: 0,
        financepeople: 0,
        internal: 0,
        commonGoal: 0,
        career: 0
    };

    APP_DATA.weeklyRecords.forEach(record => {
        if (record.goalsAlignment) {
            Object.keys(goalCounts).forEach(key => {
                if (record.goalsAlignment[key]) {
                    goalCounts[key] += record.goalsAlignment[key].length;
                }
            });
        }
    });

    const totalActivities = Object.values(goalCounts).reduce((a, b) => a + b, 0);

    if (totalActivities === 0) {
        ctx.parentElement.innerHTML = '<p style="text-align: center; color: var(--tr-grey4); padding: 40px;">Adicione registros para ver a distribuição</p>';
        return;
    }

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [
                'LOVED & TRUSTED',
                'AI RACE',
                'Finance & People',
                'Internal AI',
                'Common Goal',
                'Carreira'
            ],
            datasets: [{
                data: Object.values(goalCounts),
                backgroundColor: [
                    '#D64000', // TR Orange
                    '#1A7EE5', // TR Sky
                    '#4DB299', // TR Teal
                    '#D4792A', // TR Amber
                    '#123021', // TR Green
                    '#212223'  // TR Graphite
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { boxWidth: 12, font: { size: 10 } }
                }
            }
        }
    });
}

function updateStreakDisplay() {
    const streakNumber = document.getElementById('streakNumber');
    const streakCalendar = document.getElementById('streakCalendar');

    if (!streakNumber || !streakCalendar) return;

    // Calculate streak
    const sortedRecords = APP_DATA.weeklyRecords
        .filter(r => r.date)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    let streak = 0;
    let lastDate = new Date();

    for (let record of sortedRecords) {
        const recordDate = new Date(record.date);
        const diffDays = (lastDate - recordDate) / (1000 * 60 * 60 * 24);

        if (diffDays <= 10) { // Within 10 days tolerance
            streak++;
            lastDate = recordDate;
        } else {
            break;
        }
    }

    streakNumber.textContent = streak;
    streakNumber.style.color = streak >= 4 ? '#4DB299' : '#D64000';

    // Create mini calendar (last 12 weeks)
    const last12Weeks = [];
    const today = new Date();

    for (let i = 11; i >= 0; i--) {
        const weekDate = new Date(today);
        weekDate.setDate(weekDate.getDate() - (i * 7));
        last12Weeks.push(weekDate);
    }

    streakCalendar.innerHTML = last12Weeks.map(date => {
        const hasRecord = APP_DATA.weeklyRecords.some(r => {
            if (!r.date) return false;
            const rDate = new Date(r.date);
            return Math.abs(date - rDate) < (7 * 24 * 60 * 60 * 1000);
        });

        return `<div class="streak-week ${hasRecord ? 'active' : ''}" title="${date.toLocaleDateString('pt-BR')}"></div>`;
    }).join('');
}

function updateKpiChart() {
    const ctx = document.getElementById('kpiChart');
    if (!ctx) return;

    // Destruir gráfico anterior para evitar erro "Canvas is already in use"
    if (kpiChartInstance) {
        kpiChartInstance.destroy();
        kpiChartInstance = null;
    }

    const last6Months = getLast6Months();
    const kpiData = last6Months.map(month => {
        const monthKpis = APP_DATA.kpis.filter(k => k.month === month);
        if (monthKpis.length === 0) return 0;
        const avg = monthKpis.reduce((sum, k) => sum + (k.current / k.target * 100), 0) / monthKpis.length;
        return avg.toFixed(1);
    });

    kpiChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last6Months.map(m => {
                const date = new Date(m + '-01');
                return date.toLocaleDateString('pt-BR', { month: 'short' });
            }),
            datasets: [{
                label: 'Performance Média (%)',
                data: kpiData,
                borderColor: '#D64000',
                backgroundColor: 'rgba(214, 64, 0, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

function updateStrengthsChart() {
    const ctx = document.getElementById('strengthsChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pontos Fortes', 'Oportunidades', 'Pontos de Atenção'],
            datasets: [{
                data: [
                    APP_DATA.strengths.length,
                    APP_DATA.opportunities.length,
                    APP_DATA.attentionPoints.length
                ],
                backgroundColor: [
                    '#4DB299',
                    '#1A7EE5',
                    '#D4792A'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function getLast6Months() {
    const months = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        months.push(monthStr);
    }
    return months;
}

function updateRecentActivity() {
    const activities = [];

    // Add recent deliveries
    APP_DATA.deliveries.slice(-5).reverse().forEach(d => {
        activities.push({
            date: d.date,
            title: `Entrega: ${d.title}`,
            type: 'delivery'
        });
    });

    // Add recent weekly records
    APP_DATA.weeklyRecords.slice(-3).reverse().forEach(w => {
        activities.push({
            date: w.week,
            title: `Registro Semanal`,
            type: 'weekly'
        });
    });

    // Sort by date
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    const listEl = document.getElementById('recentActivityList');
    if (activities.length === 0) {
        listEl.innerHTML = '<p style="color: var(--tr-grey4);">Nenhuma atividade recente</p>';
        return;
    }

    listEl.innerHTML = activities.slice(0, 10).map(a => `
        <div class="activity-item">
            <div class="activity-date">${new Date(a.date).toLocaleDateString('pt-BR')}</div>
            <div class="activity-title">${a.title}</div>
        </div>
    `).join('');
}

// Deliveries
function openDeliveryModal() {
    document.getElementById('deliveryModal').style.display = 'block';
}

function saveDelivery(event) {
    event.preventDefault();

    const delivery = {
        id: Date.now(),
        title: document.getElementById('deliveryTitle').value,
        description: document.getElementById('deliveryDescription').value,
        date: document.getElementById('deliveryDate').value,
        status: document.getElementById('deliveryStatus').value,
        impact: parseInt(document.getElementById('deliveryImpact').value)
    };

    APP_DATA.deliveries.push(delivery);
    saveData();

    closeModal('deliveryModal');
    event.target.reset();
    updateDeliveriesList();
    updateDashboard();

    showNotification('Entrega salva com sucesso!');
}

function updateDeliveriesList() {
    const listEl = document.getElementById('deliveriesList');
    const filter = document.getElementById('deliveryStatusFilter')?.value || 'all';
    const monthFilter = document.getElementById('deliveryMonthFilter')?.value;

    let filtered = APP_DATA.deliveries;

    if (filter !== 'all') {
        filtered = filtered.filter(d => d.status === filter);
    }

    if (monthFilter) {
        filtered = filtered.filter(d => d.date.startsWith(monthFilter));
    }

    if (filtered.length === 0) {
        listEl.innerHTML = '<p style="color: var(--tr-grey4); text-align: center; padding: 40px;">Nenhuma entrega encontrada</p>';
        return;
    }

    listEl.innerHTML = filtered.sort((a, b) => new Date(b.date) - new Date(a.date)).map(d => `
        <div class="delivery-item">
            <div class="delivery-header">
                <h3 class="delivery-title">${d.title}</h3>
                <span class="delivery-status status-${d.status}">
                    ${getStatusText(d.status)}
                </span>
            </div>
            <p class="delivery-description">${d.description}</p>
            <div class="delivery-meta">
                <span>📅 ${new Date(d.date).toLocaleDateString('pt-BR')}</span>
                <span>⭐ Impacto: ${d.impact}/5</span>
            </div>
        </div>
    `).join('');
}

function filterDeliveries() {
    updateDeliveriesList();
}

function getStatusText(status) {
    const statusMap = {
        'completed': 'Concluído',
        'in-progress': 'Em Progresso',
        'planned': 'Planejado'
    };
    return statusMap[status] || status;
}

// KPIs
function openKpiModal() {
    document.getElementById('kpiModal').style.display = 'block';
}

function saveKpi(event) {
    event.preventDefault();

    const kpi = {
        id: Date.now(),
        name: document.getElementById('kpiName').value,
        target: parseFloat(document.getElementById('kpiTarget').value),
        current: parseFloat(document.getElementById('kpiCurrent').value),
        unit: document.getElementById('kpiUnit').value,
        month: document.getElementById('kpiMonth').value
    };

    APP_DATA.kpis.push(kpi);
    saveData();

    closeModal('kpiModal');
    event.target.reset();
    updateKpisList();
    updateDashboard();

    showNotification('KPI salvo com sucesso!');
}

function updateKpisList() {
    const gridEl = document.getElementById('kpisGrid');

    if (APP_DATA.kpis.length === 0) {
        gridEl.innerHTML = '<p style="color: var(--tr-grey4); grid-column: 1/-1; text-align: center; padding: 40px;">Nenhum KPI cadastrado</p>';
        return;
    }

    gridEl.innerHTML = APP_DATA.kpis.sort((a, b) => b.month.localeCompare(a.month)).map(k => {
        const percentage = (k.current / k.target * 100).toFixed(1);
        const date = new Date(k.month + '-01');
        const monthYear = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

        return `
            <div class="kpi-item">
                <h4>${k.name}</h4>
                <p style="color: var(--tr-grey4); font-size: 0.9em;">${monthYear}</p>
                <div class="kpi-progress">
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill" style="width: ${Math.min(percentage, 100)}%"></div>
                    </div>
                    <div class="kpi-values">
                        <span>Atual: ${k.current} ${k.unit}</span>
                        <span>Meta: ${k.target} ${k.unit}</span>
                    </div>
                    <div style="text-align: center; margin-top: 10px; font-weight: bold; color: var(--tr-orange);">
                        ${percentage}%
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Weekly Records
function saveWeeklyRecord() {
    const record = {
        id: Date.now(),
        week: document.getElementById('weekDate').value,
        activities: document.getElementById('weekActivities').value,
        achievements: document.getElementById('weekAchievements').value,
        deliveries: document.getElementById('weekDeliveries').value,
        learnings: document.getElementById('weekLearnings').value,
        challenges: document.getElementById('weekChallenges').value,
        nextSteps: document.getElementById('weekNextSteps').value,
        date: new Date().toISOString(),
        goalsAlignment: analyzeGoalsAlignment(document.getElementById('weekActivities').value)
    };

    APP_DATA.weeklyRecords.push(record);
    saveData();

    // Clear form
    document.getElementById('weekActivities').value = '';
    document.getElementById('weekAchievements').value = '';
    document.getElementById('weekDeliveries').value = '';
    document.getElementById('weekLearnings').value = '';
    document.getElementById('weekChallenges').value = '';
    document.getElementById('weekNextSteps').value = '';

    updateWeeklyHistory();
    updateDashboard();

    showNotification('Registro semanal salvo com sucesso! Alinhamento com metas analisado.');
}

// Analyze Goals Alignment
function analyzeGoalsAlignment(activitiesText) {
    const alignment = {
        customer: [],
        aiRace: [],
        financepeople: [],
        internal: [],
        commonGoal: [],
        career: []
    };

    const text = activitiesText.toLowerCase();

    // Customer - Most LOVED & TRUSTED PARTNER
    if (text.includes('cliente') || text.includes('customer') || text.includes('suporte') ||
        text.includes('atendimento') || text.includes('reunião com cliente') || text.includes('feedback')) {
        alignment.customer.push('Interação e suporte a clientes');
    }
    if (text.includes('qualidade') || text.includes('excelência') || text.includes('revisão') || text.includes('aprovei')) {
        alignment.customer.push('Foco em qualidade e excelência');
    }

    // AI Race - WIN with cutting-edge AI SOLUTIONS
    if (text.includes('ia') || text.includes('ai') || text.includes('inteligência artificial') ||
        text.includes('automação') || text.includes('machine learning') || text.includes('script')) {
        alignment.aiRace.push('Desenvolvimento de soluções com IA/Automação');
    }
    if (text.includes('inovação') || text.includes('inovador') || text.includes('nova solução') ||
        text.includes('melhoria') || text.includes('otimização')) {
        alignment.aiRace.push('Iniciativas de inovação e melhoria');
    }

    // Finance + People
    if (text.includes('desenvolveu') || text.includes('aprendeu') || text.includes('estudei') ||
        text.includes('curso') || text.includes('treinamento') || text.includes('capacitação')) {
        alignment.financepeople.push('Desenvolvimento profissional contínuo');
    }
    if (text.includes('mentoria') || text.includes('ensinar') || text.includes('compartilhar conhecimento') ||
        text.includes('ajudei') || text.includes('suporte ao colega')) {
        alignment.financepeople.push('Compartilhamento de conhecimento com o time');
    }

    // Internal - REIMAGINE OUR WORK WITH AI
    if (text.includes('processo') || text.includes('fluxo') || text.includes('metodologia') ||
        text.includes('eficiência') || text.includes('produtividade')) {
        alignment.internal.push('Otimização de processos internos');
    }
    if (text.includes('documentação') || text.includes('confluence') || text.includes('wiki') ||
        text.includes('guia') || text.includes('manual')) {
        alignment.internal.push('Documentação e padronização');
    }

    // Common Goal - AI Transformation
    if (text.includes('transformação') || text.includes('digital') || text.includes('modernização') ||
        text.includes('atualização')) {
        alignment.commonGoal.push('Contribuição para transformação digital');
    }

    // Career Goals
    if (text.includes('inglês') || text.includes('english') || text.includes('internacional')) {
        alignment.career.push('Melhoria de inglês para projetos internacionais');
    }
    if (text.includes('tax calendar') || text.includes('calendário fiscal') || text.includes('latam')) {
        alignment.career.push('Trabalho em Tax Calendar LATAM');
    }
    if (text.includes('tax one') || text.includes('sap') || text.includes('s/4hana')) {
        alignment.career.push('Especialização em Tax One para SAP');
    }

    // Count meetings
    const meetingMatches = text.match(/reunião|reuniões|meeting|daily|weekly|workshop|apresentação/gi);
    if (meetingMatches) {
        alignment.customer.push(`Participação em ${meetingMatches.length} reuniões/eventos`);
    }

    // Count documentation
    const docMatches = text.match(/documentação|documento|doc|confluence|wiki|manual|guia/gi);
    if (docMatches) {
        alignment.internal.push(`Criação de ${docMatches.length} documentações`);
    }

    return alignment;
}

function updateWeeklyHistory() {
    const listEl = document.getElementById('weeklyHistoryList');

    if (APP_DATA.weeklyRecords.length === 0) {
        listEl.innerHTML = '<p style="color: var(--tr-grey4); text-align: center; padding: 40px;">Nenhum registro semanal</p>';
        return;
    }

    listEl.innerHTML = APP_DATA.weeklyRecords.sort((a, b) => b.week.localeCompare(a.week)).map(r => `
        <div class="weekly-record">
            <h4>Semana ${r.week}</h4>

            ${r.activities ? `
            <div class="record-section highlight-section">
                <h5>📋 Atividades da Semana</h5>
                <p>${r.activities.replace(/\n/g, '<br>')}</p>
            </div>
            ` : ''}

            ${r.goalsAlignment ? `
            <div class="record-section goals-alignment">
                <h5>🎯 Alinhamento com Metas</h5>
                ${Object.entries(r.goalsAlignment).map(([key, items]) => {
                    if (items.length === 0) return '';
                    const labels = {
                        customer: '❤️ Customer Experience',
                        aiRace: '🤖 AI Solutions',
                        financepeople: '💰 Finance + People',
                        internal: '🔄 Internal AI',
                        commonGoal: '🎯 Transformação IA',
                        career: '🚀 Metas de Carreira'
                    };
                    return `
                        <div class="alignment-item">
                            <strong>${labels[key]}:</strong>
                            <ul>
                                ${items.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                        </div>
                    `;
                }).join('')}
            </div>
            ` : ''}

            <div class="record-section">
                <h5>✅ Conquistas</h5>
                <p>${r.achievements || 'Não registrado'}</p>
            </div>
            <div class="record-section">
                <h5>🎯 Entregas</h5>
                <p>${r.deliveries || 'Não registrado'}</p>
            </div>
            <div class="record-section">
                <h5>📚 Aprendizados</h5>
                <p>${r.learnings || 'Não registrado'}</p>
            </div>
            <div class="record-section">
                <h5>⚠️ Desafios</h5>
                <p>${r.challenges || 'Não registrado'}</p>
            </div>
            <div class="record-section">
                <h5>🔜 Próximos Passos</h5>
                <p>${r.nextSteps || 'Não registrado'}</p>
            </div>

            <button class="btn-secondary" style="margin-top: 15px;" onclick="generateSingleWeekReport('${r.id}')">
                📊 Gerar Relatório desta Semana
            </button>
        </div>
    `).join('');
}

// ============================================
// MELHORIA #2: BUSCA E FILTROS
// ============================================

function filterWeeklyRecords() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const timeFilter = document.getElementById('timeFilter')?.value || 'all';
    const goalFilter = document.getElementById('goalFilter')?.value || 'all';

    const now = new Date();
    let filteredRecords = APP_DATA.weeklyRecords.filter(record => {
        // Text search
        const matchesSearch = !searchTerm ||
            (record.activities && record.activities.toLowerCase().includes(searchTerm)) ||
            (record.achievements && record.achievements.toLowerCase().includes(searchTerm)) ||
            (record.challenges && record.challenges.toLowerCase().includes(searchTerm));

        // Time filter
        let matchesTime = true;
        if (timeFilter !== 'all' && record.date) {
            const recordDate = new Date(record.date);
            const diffDays = (now - recordDate) / (1000 * 60 * 60 * 24);

            switch(timeFilter) {
                case 'week': matchesTime = diffDays <= 7; break;
                case 'month': matchesTime = diffDays <= 30; break;
                case 'quarter': matchesTime = diffDays <= 90; break;
                case 'year': matchesTime = diffDays <= 365; break;
            }
        }

        // Goal filter
        let matchesGoal = true;
        if (goalFilter !== 'all' && record.goalsAlignment) {
            matchesGoal = record.goalsAlignment[goalFilter] &&
                         record.goalsAlignment[goalFilter].length > 0;
        }

        return matchesSearch && matchesTime && matchesGoal;
    });

    // Update display
    const listEl = document.getElementById('weeklyHistoryList');

    if (filteredRecords.length === 0) {
        listEl.innerHTML = '<p style="color: var(--tr-grey4); text-align: center; padding: 40px;">Nenhum registro encontrado com os filtros selecionados.</p>';
        return;
    }

    listEl.innerHTML = filteredRecords.sort((a, b) => b.week.localeCompare(a.week)).map(r => `
        <div class="weekly-record">
            <h4>Semana ${r.week}</h4>

            ${r.activities ? `
            <div class="record-section highlight-section">
                <h5>📋 Atividades da Semana</h5>
                <p>${r.activities.replace(/\n/g, '<br>')}</p>
            </div>
            ` : ''}

            ${r.goalsAlignment ? `
            <div class="record-section goals-alignment">
                <h5>🎯 Alinhamento com Metas</h5>
                ${Object.entries(r.goalsAlignment).map(([key, items]) => {
                    if (items.length === 0) return '';
                    const labels = {
                        customer: '❤️ Customer Experience',
                        aiRace: '🤖 AI Solutions',
                        financepeople: '💰 Finance + People',
                        internal: '🔄 Internal AI',
                        commonGoal: '🎯 Transformação IA',
                        career: '🚀 Metas de Carreira'
                    };
                    return `
                        <div class="alignment-item">
                            <strong>${labels[key]}:</strong>
                            <ul>
                                ${items.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                        </div>
                    `;
                }).join('')}
            </div>
            ` : ''}

            ${r.achievements ? `
            <div class="record-section">
                <h5>🏆 Principais Conquistas</h5>
                <p>${r.achievements}</p>
            </div>
            ` : ''}

            ${r.challenges ? `
            <div class="record-section">
                <h5>⚠️ Desafios e Bloqueios</h5>
                <p>${r.challenges}</p>
            </div>
            ` : ''}

            <div class="record-section">
                <h5>🔜 Próximos Passos</h5>
                <p>${r.nextSteps || 'Não registrado'}</p>
            </div>

            <button class="btn-secondary" style="margin-top: 15px;" onclick="generateSingleWeekReport('${r.id}')">
                📊 Gerar Relatório desta Semana
            </button>
        </div>
    `).join('');
}

// Generate Manager Report
function generateManagerReport() {
    const lastRecord = APP_DATA.weeklyRecords[APP_DATA.weeklyRecords.length - 1];

    if (!lastRecord) {
        alert('Nenhum registro semanal encontrado. Preencha um registro primeiro.');
        return;
    }

    generateWeeklyManagerReport(lastRecord);
}

function generateSingleWeekReport(recordId) {
    const record = APP_DATA.weeklyRecords.find(r => r.id == recordId);
    if (record) {
        generateWeeklyManagerReport(record);
    }
}

async function generateWeeklyManagerReport(record) {
    showNotification('Gerando relatório para o gestor... Aguarde.');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        putOnlyUsedFonts: true,
        floatPrecision: 16
    });

    // Normalize text to remove accents (jsPDF doesn't handle them well)
    const normalizeText = (text) => {
        if (!text) return '';
        // Normalize unicode and remove accents
        return String(text)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/ç/g, 'c')
            .replace(/Ç/g, 'C');
    };

    const orange = [214, 64, 0];
    const green = [18, 48, 33];
    const grey = [122, 122, 122];
    const teal = [77, 178, 153];

    let yPos = 20;

    // Thomson Reuters Logo (SVG converted to base64)
    const trLogo = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjQwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjx0ZXh0IHg9IjEwIiB5PSIyOCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iI0Q2NDAwMCI+VGhvbXNvbiBSZXV0ZXJzPC90ZXh0Pjwvc3ZnPg==';

    // Header
    doc.setFillColor(...green);
    doc.rect(0, 0, 210, 40, 'F');

    // Add logo
    try {
        doc.addImage(trLogo, 'SVG', 15, 8, 60, 12);
    } catch (e) {
        // Fallback to text if logo fails
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.text('Thomson Reuters', 20, 18);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('Professional Service (PS)', 105, 18, { align: 'center' });
    doc.setFontSize(12);
    doc.text(normalizeText('Relatorio Semanal de Atividades'), 105, 28, { align: 'center' });

    yPos = 50;

    // Employee Info
    doc.setTextColor(...green);
    doc.setFontSize(12);
    doc.text(normalizeText(APP_DATA.config.userName), 20, yPos);
    yPos += 6;
    doc.setFontSize(10);
    doc.setTextColor(...grey);
    doc.text(normalizeText(APP_DATA.config.userRole), 20, yPos);
    yPos += 5;
    doc.text(normalizeText(`Gestor: ${APP_DATA.config.userManager}`), 20, yPos);
    yPos += 5;
    doc.text(normalizeText(`Semana: ${record.week} | Gerado em: ${new Date().toLocaleDateString('pt-BR')}`), 20, yPos);

    yPos += 15;

    // Atividades da Semana
    doc.setTextColor(...orange);
    doc.setFontSize(13);
    doc.text(normalizeText('ATIVIDADES DA SEMANA'), 20, yPos);
    yPos += 7;

    doc.setTextColor(...grey);
    doc.setFontSize(9);
    if (record.activities) {
        // Formatar texto de forma profissional
        const formattedActivities = formatTextProfessionally(record.activities);
        const normalizedActivities = normalizeText(formattedActivities);
        const lines = doc.splitTextToSize(normalizedActivities, 170);
        lines.forEach(line => {
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
            doc.text(line, 20, yPos);
            yPos += 4;
        });
    }

    yPos += 10;

    // Alinhamento com Metas
    if (record.goalsAlignment) {
        if (yPos > 240) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFillColor(...orange);
        doc.rect(15, yPos - 5, 180, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.text(normalizeText('ALINHAMENTO COM METAS ESTRATEGICAS'), 20, yPos);
        yPos += 12;

        const goalLabels = {
            customer: normalizeText('Customer - Most LOVED & TRUSTED PARTNER'),
            aiRace: normalizeText('AI Race - Cutting-edge AI SOLUTIONS'),
            financepeople: normalizeText('Finance + People'),
            internal: normalizeText('Internal - REIMAGINE with AI'),
            commonGoal: normalizeText('Objetivo Comum - Transformacao da IA'),
            career: normalizeText('Metas de Carreira')
        };

        Object.entries(record.goalsAlignment).forEach(([key, items]) => {
            if (items.length > 0) {
                if (yPos > 260) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.setTextColor(...green);
                doc.setFontSize(10);
                doc.setFont(undefined, 'bold');
                doc.text(goalLabels[key], 20, yPos);
                yPos += 5;

                doc.setFont(undefined, 'normal');
                doc.setTextColor(...grey);
                doc.setFontSize(9);
                items.forEach(item => {
                    const normalizedItem = normalizeText(`• ${item}`);
                    const itemLines = doc.splitTextToSize(normalizedItem, 165);
                    itemLines.forEach(line => {
                        if (yPos > 275) {
                            doc.addPage();
                            yPos = 20;
                        }
                        doc.text(line, 25, yPos);
                        yPos += 4;
                    });
                });
                yPos += 3;
            }
        });
    }

    yPos += 5;

    // Conquistas
    if (record.achievements) {
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }

        doc.setTextColor(...teal);
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text(normalizeText('PRINCIPAIS CONQUISTAS'), 20, yPos);
        yPos += 6;

        doc.setFont(undefined, 'normal');
        doc.setTextColor(...grey);
        doc.setFontSize(9);
        const formattedAchievements = formatTextProfessionally(record.achievements);
        const achievementLines = doc.splitTextToSize(normalizeText(formattedAchievements), 170);
        achievementLines.forEach(line => {
            if (yPos > 275) {
                doc.addPage();
                yPos = 20;
            }
            doc.text(line, 20, yPos);
            yPos += 4;
        });
        yPos += 8;
    }

    // Entregas
    if (record.deliveries) {
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }

        doc.setTextColor(...orange);
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text(normalizeText('ENTREGAS REALIZADAS'), 20, yPos);
        yPos += 6;

        doc.setFont(undefined, 'normal');
        doc.setTextColor(...grey);
        doc.setFontSize(9);
        const formattedDeliveries = formatTextProfessionally(record.deliveries);
        const deliveryLines = doc.splitTextToSize(normalizeText(formattedDeliveries), 170);
        deliveryLines.forEach(line => {
            if (yPos > 275) {
                doc.addPage();
                yPos = 20;
            }
            doc.text(line, 20, yPos);
            yPos += 4;
        });
        yPos += 8;
    }

    // Aprendizados
    if (record.learnings) {
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }

        doc.setTextColor(...green);
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text(normalizeText('APRENDIZADOS'), 20, yPos);
        yPos += 6;

        doc.setFont(undefined, 'normal');
        doc.setTextColor(...grey);
        doc.setFontSize(9);
        const formattedLearnings = formatTextProfessionally(record.learnings);
        const learningLines = doc.splitTextToSize(normalizeText(formattedLearnings), 170);
        learningLines.forEach(line => {
            if (yPos > 275) {
                doc.addPage();
                yPos = 20;
            }
            doc.text(line, 20, yPos);
            yPos += 4;
        });
        yPos += 8;
    }

    // Desafios
    if (record.challenges) {
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }

        doc.setTextColor(212, 121, 42); // amber
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text(normalizeText('DESAFIOS ENFRENTADOS'), 20, yPos);
        yPos += 6;

        doc.setFont(undefined, 'normal');
        doc.setTextColor(...grey);
        doc.setFontSize(9);
        const formattedChallenges = formatTextProfessionally(record.challenges);
        const challengeLines = doc.splitTextToSize(normalizeText(formattedChallenges), 170);
        challengeLines.forEach(line => {
            if (yPos > 275) {
                doc.addPage();
                yPos = 20;
            }
            doc.text(line, 20, yPos);
            yPos += 4;
        });
        yPos += 8;
    }

    // Próximos Passos
    if (record.nextSteps) {
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }

        doc.setTextColor(...orange);
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text(normalizeText('PROXIMOS PASSOS'), 20, yPos);
        yPos += 6;

        doc.setFont(undefined, 'normal');
        doc.setTextColor(...grey);
        doc.setFontSize(9);
        const formattedNextSteps = formatTextProfessionally(record.nextSteps);
        const nextLines = doc.splitTextToSize(normalizeText(formattedNextSteps), 170);
        nextLines.forEach(line => {
            if (yPos > 275) {
                doc.addPage();
                yPos = 20;
            }
            doc.text(line, 20, yPos);
            yPos += 4;
        });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(...grey);
        doc.text(normalizeText(`Pagina ${i} de ${pageCount}`), 105, 290, { align: 'center' });
        doc.text('Thomson Reuters - Professional Service (PS)', 105, 285, { align: 'center' });
    }

    const fileName = `relatorio-semanal-${record.week}-${APP_DATA.config.userName.replace(/ /g, '-')}.pdf`;
    doc.save(fileName);

    showNotification('✅ Relatório gerado com sucesso! Pronto para enviar ao gestor.');
}

// Analysis Lists
function updateAnalysisLists() {
    updateList('strengthsList', APP_DATA.strengths, 'strength');
    updateList('opportunitiesList', APP_DATA.opportunities, 'opportunity');
    updateList('attentionList', APP_DATA.attentionPoints, 'attention');
    updateList('advanceList', APP_DATA.advanceSteps, 'advance');
}

function updateList(elementId, data, type) {
    const listEl = document.getElementById(elementId);

    if (data.length === 0) {
        listEl.innerHTML = '<p style="color: var(--tr-grey4); font-size: 0.9em;">Nenhum item cadastrado</p>';
        return;
    }

    listEl.innerHTML = data.map((item, index) => `
        <div class="analysis-item">
            <span class="analysis-item-text">${item.text}</span>
            <button class="delete-btn" onclick="deleteAnalysisItem('${type}', ${index})">×</button>
        </div>
    `).join('');
}

function openStrengthModal() {
    const text = prompt('Digite um ponto forte:');
    if (text) {
        APP_DATA.strengths.push({ text, date: new Date().toISOString() });
        saveData();
        updateAnalysisLists();
        updateDashboard();
    }
}

function openOpportunityModal() {
    const text = prompt('Digite uma oportunidade de melhoria:');
    if (text) {
        APP_DATA.opportunities.push({ text, date: new Date().toISOString() });
        saveData();
        updateAnalysisLists();
        updateDashboard();
    }
}

function openAttentionModal() {
    const text = prompt('Digite um ponto de atenção:');
    if (text) {
        APP_DATA.attentionPoints.push({ text, date: new Date().toISOString() });
        saveData();
        updateAnalysisLists();
        updateDashboard();
    }
}

function openAdvanceModal() {
    const text = prompt('Como avançar? Digite uma ação:');
    if (text) {
        APP_DATA.advanceSteps.push({ text, date: new Date().toISOString() });
        saveData();
        updateAnalysisLists();
        updateDashboard();
    }
}

function deleteAnalysisItem(type, index) {
    const typeMap = {
        'strength': 'strengths',
        'opportunity': 'opportunities',
        'attention': 'attentionPoints',
        'advance': 'advanceSteps'
    };

    APP_DATA[typeMap[type]].splice(index, 1);
    saveData();
    updateAnalysisLists();
    updateDashboard();
}

// Reviews
function generatePeriodicReview() {
    const review = {
        id: Date.now(),
        date: new Date().toISOString(),
        strengths: [...APP_DATA.strengths],
        opportunities: [...APP_DATA.opportunities],
        attentionPoints: [...APP_DATA.attentionPoints],
        advanceSteps: [...APP_DATA.advanceSteps],
        deliveries: APP_DATA.deliveries.filter(d => {
            const dDate = new Date(d.date);
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return dDate >= monthAgo;
        }),
        kpis: APP_DATA.kpis.slice(-5)
    };

    APP_DATA.reviews.push(review);
    saveData();
    updateReviewsHistory();

    showNotification('Avaliação periódica gerada!');

    // Generate PDF
    setTimeout(() => exportReviewToPDF(review), 500);
}

function updateReviewsHistory() {
    const listEl = document.getElementById('reviewsHistoryList');

    if (APP_DATA.reviews.length === 0) {
        listEl.innerHTML = '<p style="color: var(--tr-grey4); text-align: center; padding: 40px;">Nenhuma avaliação gerada</p>';
        return;
    }

    listEl.innerHTML = APP_DATA.reviews.sort((a, b) => new Date(b.date) - new Date(a.date)).map(r => `
        <div class="review-item" onclick="viewReview(${r.id})">
            <div class="review-header">
                <span class="review-date">${new Date(r.date).toLocaleDateString('pt-BR')}</span>
                <button class="view-review-btn" onclick="event.stopPropagation(); exportReviewToPDF(${JSON.stringify(r).replace(/"/g, '&quot;')})">
                    📄 Exportar PDF
                </button>
            </div>
            <p style="color: var(--tr-grey4); margin-top: 5px;">
                ${r.deliveries.length} entregas | ${r.strengths.length} pontos fortes | ${r.opportunities.length} oportunidades
            </p>
        </div>
    `).join('');
}

// Summaries
function generateWeeklySummary() {
    const lastWeek = APP_DATA.weeklyRecords[APP_DATA.weeklyRecords.length - 1];

    if (!lastWeek) {
        alert('Nenhum registro semanal encontrado. Preencha um registro primeiro.');
        return;
    }

    const summary = `
        RESUMO SEMANAL - ${lastWeek.week}

        ✅ CONQUISTAS:
        ${lastWeek.achievements}

        🎯 ENTREGAS:
        ${lastWeek.deliveries}

        📚 APRENDIZADOS:
        ${lastWeek.learnings}

        ⚠️ DESAFIOS:
        ${lastWeek.challenges}

        🔜 PRÓXIMOS PASSOS:
        ${lastWeek.nextSteps}
    `;

    downloadTextFile(summary, `resumo-semanal-${lastWeek.week}.txt`);
    showNotification('Resumo semanal gerado!');
}

async function generateMonthlySummary() {
    showNotification('Gerando relatorio mensal em PDF... Aguarde.');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        putOnlyUsedFonts: true,
        floatPrecision: 16
    });

    // Normalize text function
    const normalizeText = (text) => {
        if (!text) return '';
        return String(text)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/ç/g, 'c')
            .replace(/Ç/g, 'C');
    };

    const orange = [214, 64, 0];
    const green = [18, 48, 33];
    const grey = [122, 122, 122];
    const teal = [77, 178, 153];
    const sky = [26, 126, 229];

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const monthName = today.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    // Filter data for current month
    const monthDeliveries = APP_DATA.deliveries.filter(d => {
        const dDate = new Date(d.date);
        return dDate.getMonth() === currentMonth && dDate.getFullYear() === currentYear;
    });

    const monthKpis = APP_DATA.kpis.filter(k => {
        const kDate = new Date(k.month + '-01');
        return kDate.getMonth() === currentMonth && kDate.getFullYear() === currentYear;
    });

    const monthWeeks = APP_DATA.weeklyRecords.filter(w => {
        const wDate = new Date(w.date);
        return wDate.getMonth() === currentMonth && wDate.getFullYear() === currentYear;
    });

    // Previous month data for comparison
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const prevMonthWeeks = APP_DATA.weeklyRecords.filter(w => {
        const wDate = new Date(w.date);
        return wDate.getMonth() === prevMonth && wDate.getFullYear() === prevYear;
    });

    let yPos = 20;

    // Thomson Reuters Logo
    const trLogo = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjQwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjx0ZXh0IHg9IjEwIiB5PSIyOCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iI0Q2NDAwMCI+VGhvbXNvbiBSZXV0ZXJzPC90ZXh0Pjwvc3ZnPg==';

    // Header
    doc.setFillColor(...green);
    doc.rect(0, 0, 210, 40, 'F');

    try {
        doc.addImage(trLogo, 'SVG', 15, 8, 60, 12);
    } catch (e) {
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.text('Thomson Reuters', 20, 18);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('Professional Service (PS)', 105, 18, { align: 'center' });
    doc.setFontSize(12);
    doc.text(normalizeText(`Relatorio Mensal - ${monthName}`), 105, 28, { align: 'center' });

    yPos = 50;

    // Employee Info
    doc.setTextColor(...green);
    doc.setFontSize(12);
    doc.text(normalizeText(APP_DATA.config.userName), 20, yPos);
    yPos += 6;
    doc.setFontSize(10);
    doc.setTextColor(...grey);
    doc.text(normalizeText(APP_DATA.config.userRole), 20, yPos);
    yPos += 5;
    doc.text(normalizeText(`Gestor: ${APP_DATA.config.userManager}`), 20, yPos);
    yPos += 5;
    doc.text(normalizeText(`Gerado em: ${today.toLocaleDateString('pt-BR')}`), 20, yPos);

    yPos += 15;

    // Statistics Box
    doc.setFillColor(249, 247, 245);
    doc.rect(15, yPos - 5, 180, 35, 'F');
    doc.setDrawColor(...orange);
    doc.setLineWidth(0.5);
    doc.rect(15, yPos - 5, 180, 35);

    doc.setTextColor(...orange);
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text(normalizeText('ESTATISTICAS DO MES'), 20, yPos);
    yPos += 8;

    doc.setFont(undefined, 'normal');
    doc.setTextColor(...grey);
    doc.setFontSize(10);

    const completedDeliveries = monthDeliveries.filter(d => d.status === 'completed').length;
    const avgKpiPerformance = monthKpis.length > 0
        ? (monthKpis.reduce((sum, k) => sum + (k.current / k.target * 100), 0) / monthKpis.length).toFixed(1)
        : 0;

    const comparison = prevMonthWeeks.length > 0
        ? ((monthWeeks.length - prevMonthWeeks.length) / prevMonthWeeks.length * 100).toFixed(1)
        : 0;

    doc.text(normalizeText(`• Total de Entregas: ${monthDeliveries.length} (${completedDeliveries} concluidas)`), 25, yPos);
    yPos += 5;
    doc.text(normalizeText(`• Registros Semanais: ${monthWeeks.length} (${comparison > 0 ? '+' : ''}${comparison}% vs mes anterior)`), 25, yPos);
    yPos += 5;
    doc.text(normalizeText(`• Performance Media KPIs: ${avgKpiPerformance}%`), 25, yPos);
    yPos += 5;
    doc.text(normalizeText(`• KPIs Acompanhados: ${monthKpis.length}`), 25, yPos);

    yPos += 15;

    // Weekly Evolution
    if (monthWeeks.length > 0) {
        doc.setTextColor(...orange);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(normalizeText('EVOLUCAO SEMANAL'), 20, yPos);
        yPos += 7;

        doc.setFont(undefined, 'normal');
        doc.setTextColor(...grey);
        doc.setFontSize(9);

        monthWeeks.sort((a, b) => a.week.localeCompare(b.week)).forEach((week, index) => {
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }

            const activityCount = week.goalsAlignment
                ? Object.values(week.goalsAlignment).reduce((sum, arr) => sum + arr.length, 0)
                : 0;

            doc.text(normalizeText(`Semana ${index + 1} (${week.week}): ${activityCount} atividades registradas`), 25, yPos);
            yPos += 5;
        });

        yPos += 10;
    }

    // Goals Alignment Summary
    if (monthWeeks.length > 0) {
        if (yPos > 240) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFillColor(...orange);
        doc.rect(15, yPos - 5, 180, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.text(normalizeText('ALINHAMENTO COM METAS ESTRATEGICAS (CONSOLIDADO)'), 20, yPos);
        yPos += 12;

        const consolidatedGoals = {
            customer: [],
            aiRace: [],
            financepeople: [],
            internal: [],
            commonGoal: [],
            career: []
        };

        monthWeeks.forEach(week => {
            if (week.goalsAlignment) {
                Object.keys(consolidatedGoals).forEach(key => {
                    if (week.goalsAlignment[key]) {
                        consolidatedGoals[key].push(...week.goalsAlignment[key]);
                    }
                });
            }
        });

        const goalLabels = {
            customer: normalizeText('Customer - Most LOVED & TRUSTED PARTNER'),
            aiRace: normalizeText('AI Race - Cutting-edge AI SOLUTIONS'),
            financepeople: normalizeText('Finance + People'),
            internal: normalizeText('Internal - REIMAGINE with AI'),
            commonGoal: normalizeText('Objetivo Comum - Transformacao da IA'),
            career: normalizeText('Metas de Carreira')
        };

        Object.entries(consolidatedGoals).forEach(([key, items]) => {
            if (items.length > 0) {
                if (yPos > 260) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.setTextColor(...green);
                doc.setFontSize(10);
                doc.setFont(undefined, 'bold');
                doc.text(normalizeText(`${goalLabels[key]} (${items.length} atividades)`), 20, yPos);
                yPos += 7;
            }
        });
    }

    yPos += 5;

    // Deliveries
    if (monthDeliveries.length > 0) {
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }

        doc.setTextColor(...teal);
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text(normalizeText('PRINCIPAIS ENTREGAS DO MES'), 20, yPos);
        yPos += 6;

        doc.setFont(undefined, 'normal');
        doc.setTextColor(...grey);
        doc.setFontSize(9);

        monthDeliveries.slice(0, 10).forEach(d => {
            if (yPos > 275) {
                doc.addPage();
                yPos = 20;
            }

            const statusText = getStatusText(d.status);
            const deliveryLine = normalizeText(`• ${d.title} - ${statusText}`);
            const lines = doc.splitTextToSize(deliveryLine, 165);

            lines.forEach(line => {
                doc.text(line, 25, yPos);
                yPos += 4;
            });
        });

        yPos += 8;
    }

    // KPIs Performance
    if (monthKpis.length > 0) {
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }

        doc.setTextColor(...sky);
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text(normalizeText('PERFORMANCE DOS KPIs'), 20, yPos);
        yPos += 6;

        doc.setFont(undefined, 'normal');
        doc.setTextColor(...grey);
        doc.setFontSize(9);

        monthKpis.forEach(k => {
            if (yPos > 275) {
                doc.addPage();
                yPos = 20;
            }

            const performance = (k.current / k.target * 100).toFixed(1);
            doc.text(normalizeText(`• ${k.name}: ${k.current}/${k.target} ${k.unit} (${performance}%)`), 25, yPos);
            yPos += 5;
        });

        yPos += 8;
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(...grey);
        doc.text(normalizeText(`Pagina ${i} de ${pageCount}`), 105, 290, { align: 'center' });
        doc.text('Thomson Reuters - Professional Service (PS)', 105, 285, { align: 'center' });
    }

    const fileName = `relatorio-mensal-${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}.pdf`;
    doc.save(fileName);
    showNotification('PDF mensal gerado com sucesso!', 'success');
}

// PDF Export
async function exportToPDF() {
    showNotification('Gerando PDF... Aguarde.');

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Colors
    const orange = [214, 64, 0];
    const green = [18, 48, 33];
    const grey = [122, 122, 122];

    let yPos = 20;

    // Thomson Reuters Logo
    const trLogo = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjQwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjx0ZXh0IHg9IjEwIiB5PSIyOCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iI0Q2NDAwMCI+VGhvbXNvbiBSZXV0ZXJzPC90ZXh0Pjwvc3ZnPg==';

    // Header
    doc.setFillColor(...orange);
    doc.rect(0, 0, 210, 30, 'F');

    // Add logo
    try {
        doc.addImage(trLogo, 'SVG', 15, 6, 60, 12);
    } catch (e) {
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.text('Thomson Reuters', 20, 15);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text('Professional Service (PS)', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text('Report', 105, 23, { align: 'center' });

    yPos = 40;
    doc.setTextColor(...green);
    doc.setFontSize(14);
    doc.text(`${APP_DATA.config.userName}`, 20, yPos);
    yPos += 7;
    doc.setFontSize(10);
    doc.setTextColor(...grey);
    doc.text(`${APP_DATA.config.userRole}`, 20, yPos);
    yPos += 7;
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, yPos);

    yPos += 15;

    // Deliveries
    doc.setTextColor(...orange);
    doc.setFontSize(12);
    doc.text('Entregas Recentes', 20, yPos);
    yPos += 7;

    doc.setTextColor(...grey);
    doc.setFontSize(9);
    const recentDeliveries = APP_DATA.deliveries.slice(-10);
    recentDeliveries.forEach(d => {
        if (yPos > 270) {
            doc.addPage();
            yPos = 20;
        }
        doc.text(`• ${d.title} - ${getStatusText(d.status)}`, 25, yPos);
        yPos += 5;
    });

    yPos += 10;

    // Add more sections...

    doc.save(`professional-service-${new Date().toISOString().split('T')[0]}.pdf`);
    showNotification('PDF gerado com sucesso!');
}

async function exportReviewToPDF(review) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const orange = [214, 64, 0];
    const green = [18, 48, 33];
    const grey = [122, 122, 122];

    let yPos = 20;

    // Thomson Reuters Logo
    const trLogo = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjQwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjx0ZXh0IHg9IjEwIiB5PSIyOCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iI0Q2NDAwMCI+VGhvbXNvbiBSZXV0ZXJzPC90ZXh0Pjwvc3ZnPg==';

    // Header
    doc.setFillColor(...orange);
    doc.rect(0, 0, 210, 35, 'F');

    // Add logo
    try {
        doc.addImage(trLogo, 'SVG', 15, 8, 60, 12);
    } catch (e) {
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.text('Thomson Reuters', 20, 15);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('Professional Service (PS)', 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Avaliação Periódica de Desempenho', 105, 25, { align: 'center' });

    yPos = 45;
    doc.setTextColor(...green);
    doc.setFontSize(12);
    doc.text(APP_DATA.config.userName, 20, yPos);
    yPos += 6;
    doc.setFontSize(10);
    doc.setTextColor(...grey);
    doc.text(APP_DATA.config.userRole, 20, yPos);
    yPos += 6;
    doc.text(`Data: ${new Date(review.date).toLocaleDateString('pt-BR')}`, 20, yPos);

    yPos += 15;

    // Pontos Fortes
    doc.setTextColor(...orange);
    doc.setFontSize(12);
    doc.text('💪 Pontos Fortes', 20, yPos);
    yPos += 7;

    doc.setTextColor(...grey);
    doc.setFontSize(9);
    review.strengths.forEach(s => {
        if (yPos > 270) {
            doc.addPage();
            yPos = 20;
        }
        const lines = doc.splitTextToSize(`• ${s.text}`, 170);
        lines.forEach(line => {
            doc.text(line, 25, yPos);
            yPos += 5;
        });
    });

    yPos += 10;

    // Oportunidades
    if (yPos > 250) {
        doc.addPage();
        yPos = 20;
    }
    doc.setTextColor(...orange);
    doc.setFontSize(12);
    doc.text('🎯 Oportunidades de Melhoria', 20, yPos);
    yPos += 7;

    doc.setTextColor(...grey);
    doc.setFontSize(9);
    review.opportunities.forEach(o => {
        if (yPos > 270) {
            doc.addPage();
            yPos = 20;
        }
        const lines = doc.splitTextToSize(`• ${o.text}`, 170);
        lines.forEach(line => {
            doc.text(line, 25, yPos);
            yPos += 5;
        });
    });

    yPos += 10;

    // Pontos de Atenção
    if (yPos > 250) {
        doc.addPage();
        yPos = 20;
    }
    doc.setTextColor(...orange);
    doc.setFontSize(12);
    doc.text('⚠️ Pontos de Atenção', 20, yPos);
    yPos += 7;

    doc.setTextColor(...grey);
    doc.setFontSize(9);
    review.attentionPoints.forEach(a => {
        if (yPos > 270) {
            doc.addPage();
            yPos = 20;
        }
        const lines = doc.splitTextToSize(`• ${a.text}`, 170);
        lines.forEach(line => {
            doc.text(line, 25, yPos);
            yPos += 5;
        });
    });

    yPos += 10;

    // Como Avançar
    if (yPos > 250) {
        doc.addPage();
        yPos = 20;
    }
    doc.setTextColor(...orange);
    doc.setFontSize(12);
    doc.text('🚀 Como Avançar', 20, yPos);
    yPos += 7;

    doc.setTextColor(...grey);
    doc.setFontSize(9);
    review.advanceSteps.forEach(a => {
        if (yPos > 270) {
            doc.addPage();
            yPos = 20;
        }
        const lines = doc.splitTextToSize(`• ${a.text}`, 170);
        lines.forEach(line => {
            doc.text(line, 25, yPos);
            yPos += 5;
        });
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(...grey);
        doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
    }

    doc.save(`avaliacao-periodica-${new Date(review.date).toISOString().split('T')[0]}.pdf`);
    showNotification('PDF da avaliação gerado!');
}

// Config
function loadConfigData() {
    document.getElementById('userEmail').value = APP_DATA.config.userEmail;
    document.getElementById('emailReminders').checked = APP_DATA.config.emailReminders;
    document.getElementById('monthlyReminders').checked = APP_DATA.config.monthlyReminders;
    document.getElementById('configName').value = APP_DATA.config.userName;
    document.getElementById('configRole').value = APP_DATA.config.userRole;
    document.getElementById('configManager').value = APP_DATA.config.userManager;
}

function saveEmailConfig() {
    APP_DATA.config.userEmail = document.getElementById('userEmail').value;
    APP_DATA.config.emailReminders = document.getElementById('emailReminders').checked;
    APP_DATA.config.monthlyReminders = document.getElementById('monthlyReminders').checked;
    saveData();
    showNotification('Configurações de e-mail salvas!');
}

function savePersonalInfo() {
    APP_DATA.config.userName = document.getElementById('configName').value;
    APP_DATA.config.userRole = document.getElementById('configRole').value;
    APP_DATA.config.userManager = document.getElementById('configManager').value;

    document.getElementById('userName').textContent = APP_DATA.config.userName;
    document.querySelector('.user-role').textContent = APP_DATA.config.userRole;

    saveData();
    showNotification('Informações pessoais salvas!');
}

function exportData() {
    const dataStr = JSON.stringify(APP_DATA, null, 2);
    downloadTextFile(dataStr, `professional-tracker-backup-${new Date().toISOString().split('T')[0]}.json`);
    showNotification('Dados exportados com sucesso!');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = event => {
            try {
                const importedData = JSON.parse(event.target.result);
                Object.assign(APP_DATA, importedData);
                saveData();
                location.reload();
            } catch (error) {
                alert('Erro ao importar dados. Verifique o arquivo.');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function clearAllData() {
    if (!currentUserId) {
        showNotification('❌ Erro: nenhum usuário logado', 'error');
        return;
    }

    if (confirm('Tem certeza que deseja limpar TODOS os seus dados? Esta ação não pode ser desfeita!')) {
        if (confirm('Última confirmação: Todos os seus registros serão perdidos!')) {
            // Limpar APENAS os dados do usuário atual, não de todos os usuários
            const userDataKey = `professionalTrackerData_${currentUserId}`;
            localStorage.removeItem(userDataKey);
            showNotification('🗑️ Seus dados foram limpos com sucesso', 'success');
            location.reload();
        }
    }
}

// Reminders
function checkWeeklyReminder() {
    const today = new Date();
    const dayOfWeek = today.getDay();

    // Check if it's Friday (5)
    if (dayOfWeek === 5 && APP_DATA.config.emailReminders) {
        const lastReminder = localStorage.getItem('lastWeeklyReminder');
        const todayStr = today.toISOString().split('T')[0];

        if (lastReminder !== todayStr) {
            showNotification('🔔 Lembrete: Não esqueça de preencher seu registro semanal!', 10000);
            localStorage.setItem('lastWeeklyReminder', todayStr);

            // In a real app, this would send an email
            console.log('Email reminder would be sent to:', APP_DATA.config.userEmail);
        }
    }
}

// Modal Functions
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// Utilities
function downloadTextFile(content, filename) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function showNotification(message, duration = 3000) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--tr-green);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);

// ============================================
// MELHORIA #1: EXPORT/IMPORT DE DADOS
// ============================================

function exportData() {
    const dataStr = JSON.stringify(APP_DATA, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().split('T')[0];
    link.download = `professional-tracker-backup-${timestamp}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('✅ Dados exportados com sucesso!', 'success');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                if (confirm('⚠️ Isso vai SUBSTITUIR todos os seus dados atuais. Tem certeza?\n\nRecomendação: Faça um backup primeiro usando "Exportar Dados"!')) {
                    Object.assign(APP_DATA, importedData);
                    saveData();
                    location.reload();
                }
            } catch (error) {
                showNotification('❌ Erro ao importar dados. Arquivo inválido!', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function exportToExcel() {
    let csv = 'Data,Tipo,Descrição,Meta Relacionada\n';

    APP_DATA.weeklyRecords.forEach(record => {
        const date = record.week || 'N/A';
        const activities = (record.activities || '').replace(/\n/g, ' ').replace(/,/g, ';');
        csv += `${date},Atividade Semanal,"${activities}",Múltiplas\n`;
    });

    APP_DATA.deliveries.forEach(delivery => {
        const desc = (delivery.description || '').replace(/,/g, ';');
        csv += `${delivery.date},Entrega,"${desc}",${delivery.goal || 'N/A'}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().split('T')[0];
    link.download = `professional-tracker-${timestamp}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('✅ Dados exportados para Excel!', 'success');
}

// ============================================
// MELHORIA #4: NOTIFICAÇÕES IN-APP
// ============================================

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `app-notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function checkActivityStreak() {
    const lastRecord = APP_DATA.weeklyRecords[APP_DATA.weeklyRecords.length - 1];
    if (!lastRecord) return;

    const lastDate = new Date(lastRecord.date);
    const today = new Date();
    const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays > 7) {
        const banner = document.getElementById('notification-banner');
        if (banner) {
            banner.innerHTML = `⚠️ Atenção! Você não registra atividades há ${diffDays} dias. <a href="#" onclick="showSection('weekly'); return false;">Registre agora!</a>`;
            banner.style.display = 'block';
        }
    } else if (APP_DATA.weeklyRecords.length >= 4) {
        const lastFour = APP_DATA.weeklyRecords.slice(-4);
        const allRecent = lastFour.every(r => {
            const d = new Date(r.date);
            return (today - d) / (1000 * 60 * 60 * 24 * 7) < 5;
        });
        if (allRecent) {
            showNotification('🎉 Parabéns! Você manteve consistência nas últimas 4 semanas!', 'success');
        }
    }
}

function updateNotificationBadges() {
    const lastRecord = APP_DATA.weeklyRecords[APP_DATA.weeklyRecords.length - 1];
    if (lastRecord) {
        const lastDate = new Date(lastRecord.date);
        const today = new Date();
        const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

        if (diffDays > 7) {
            const weeklyBtn = document.querySelector('[onclick*="weekly"]');
            if (weeklyBtn && !weeklyBtn.querySelector('.badge')) {
                const badge = document.createElement('span');
                badge.className = 'notification-badge';
                badge.textContent = '!';
                weeklyBtn.style.position = 'relative';
                weeklyBtn.appendChild(badge);
            }
        }
    }
}

// ============================================
// MELHORIA #5: TEMA CLARO/ESCURO
// ============================================

let currentTheme = localStorage.getItem('theme') || 'dark';

function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', currentTheme);
    applyTheme();
}

function applyTheme() {
    document.body.setAttribute('data-theme', currentTheme);
    const icon = document.getElementById('theme-icon');
    if (icon) {
        icon.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
    }
}

// Apply theme on load
document.addEventListener('DOMContentLoaded', function() {
    applyTheme();
    checkActivityStreak();
    updateNotificationBadges();
    setupQuickAddShortcut();
    updateQuickAddHistory();
});

// ============================================
// QUICK ADD (REGISTRO RÁPIDO)
// ============================================

function openQuickAdd() {
    const modal = document.getElementById('quickAddModal');
    modal.style.display = 'block';

    // Focus no textarea
    setTimeout(() => {
        document.getElementById('quickAddText').focus();
    }, 100);

    // Atualiza histórico
    updateQuickAddHistory();
}

function closeQuickAdd() {
    const modal = document.getElementById('quickAddModal');
    modal.style.display = 'none';
    document.getElementById('quickAddText').value = '';
}

function saveQuickAdd(event) {
    event.preventDefault();

    const text = document.getElementById('quickAddText').value.trim();

    if (!text) {
        showNotification('⚠️ Digite algo antes de salvar!', 'error');
        return;
    }

    // Cria nota rápida
    const quickNote = {
        id: Date.now(),
        text: text,
        date: new Date().toISOString(),
        timestamp: new Date().toLocaleString('pt-BR'),
        converted: false // Indica se já foi convertido em registro completo
    };

    // Adiciona ao array
    APP_DATA.quickNotes.unshift(quickNote);

    // Mantém apenas últimas 50 notas
    if (APP_DATA.quickNotes.length > 50) {
        APP_DATA.quickNotes = APP_DATA.quickNotes.slice(0, 50);
    }

    saveData();

    // Fecha modal
    closeQuickAdd();

    // Mostra confirmação
    showNotification('✅ Nota rápida salva! Vá em "Registro Semanal" para completar os detalhes.', 'success');

    // Badge no menu (opcional)
    updateQuickNoteBadge();
}

function updateQuickAddHistory() {
    const listEl = document.getElementById('quickAddHistoryList');
    if (!listEl) return;

    const recentNotes = APP_DATA.quickNotes.slice(0, 5);

    if (recentNotes.length === 0) {
        listEl.innerHTML = '<p style="color: var(--tr-grey4); text-align: center; padding: 20px;">Nenhuma nota rápida ainda</p>';
        return;
    }

    listEl.innerHTML = recentNotes.map(note => `
        <div class="quick-note-item ${note.converted ? 'converted' : ''}">
            <div class="quick-note-header">
                <span class="quick-note-time">${note.timestamp}</span>
                ${note.converted ? '<span class="quick-note-badge">✅ Convertido</span>' : '<span class="quick-note-badge pending">📝 Pendente</span>'}
            </div>
            <div class="quick-note-text">${note.text.substring(0, 100)}${note.text.length > 100 ? '...' : ''}</div>
            <div class="quick-note-actions">
                ${!note.converted ? `
                    <button class="btn-mini" onclick="convertToWeekly('${note.id}')">📋 Converter em Registro</button>
                ` : ''}
                <button class="btn-mini delete" onclick="deleteQuickNote('${note.id}')">🗑️</button>
            </div>
        </div>
    `).join('');
}

function convertToWeekly(noteId) {
    const note = APP_DATA.quickNotes.find(n => n.id == noteId);
    if (!note) return;

    // Preenche o campo de atividades no registro semanal
    const activitiesField = document.getElementById('weekActivities');
    if (activitiesField) {
        // Adiciona ao texto existente (se houver)
        const currentText = activitiesField.value.trim();
        activitiesField.value = currentText ?
            `${currentText}\n\n${note.text}` :
            note.text;

        // Marca como convertido
        note.converted = true;
        saveData();

        // Vai para a seção de registro semanal
        showSection('weekly');

        // Scroll até o campo
        activitiesField.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Fecha o modal se estiver aberto
        closeQuickAdd();

        showNotification('✅ Nota transferida para Registro Semanal!', 'success');
        updateQuickNoteBadge();
    }
}

function deleteQuickNote(noteId) {
    if (confirm('Deletar esta nota rápida?')) {
        APP_DATA.quickNotes = APP_DATA.quickNotes.filter(n => n.id != noteId);
        saveData();
        updateQuickAddHistory();
        showNotification('🗑️ Nota deletada', 'info');
        updateQuickNoteBadge();
    }
}

function updateQuickNoteBadge() {
    const pendingCount = APP_DATA.quickNotes.filter(n => !n.converted).length;

    // Atualiza badge no botão flutuante
    const quickBtn = document.getElementById('quickAddBtn');
    let badge = quickBtn.querySelector('.quick-add-badge');

    if (pendingCount > 0) {
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'quick-add-badge';
            quickBtn.appendChild(badge);
        }
        badge.textContent = pendingCount;
    } else {
        if (badge) badge.remove();
    }
}

function setupQuickAddShortcut() {
    // Atalho Alt+Q para abrir Quick Add
    document.addEventListener('keydown', function(e) {
        if (e.altKey && e.key === 'q') {
            e.preventDefault();
            openQuickAdd();
        }

        // ESC para fechar
        if (e.key === 'Escape') {
            const modal = document.getElementById('quickAddModal');
            if (modal && modal.style.display === 'block') {
                closeQuickAdd();
            }
        }
    });
}

// ===== CUSTOM GOALS MANAGEMENT =====

function openGoalModal() {
    document.getElementById('goalModal').style.display = 'block';
}

function saveCustomGoal(event) {
    event.preventDefault();

    const goal = {
        id: Date.now(),
        title: document.getElementById('goalTitle').value,
        description: document.getElementById('goalDescription').value,
        category: document.getElementById('goalCategory').value,
        deadline: document.getElementById('goalDeadline').value,
        priority: document.getElementById('goalPriority').value,
        progress: parseInt(document.getElementById('goalProgress').value),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    APP_DATA.customGoals.push(goal);
    saveData();
    closeModal('goalModal');
    renderCustomGoals();
    showNotification('✅ Meta criada com sucesso!', 'success');

    // Clear form
    document.getElementById('goalTitle').value = '';
    document.getElementById('goalDescription').value = '';
    document.getElementById('goalProgress').value = '0';
}

function renderCustomGoals() {
    const container = document.getElementById('goalsCategories');
    if (!container) return;

    // Mostrar TODAS as metas (manuais + Workday) juntas
    const allGoals = APP_DATA.customGoals.filter(g => !g.isSample); // Apenas remover samples

    if (allGoals.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>🎯 Nenhuma meta criada ainda.</p>
                <p>Clique em "+ Nova Meta" ou importe do Workday para começar!</p>
            </div>
        `;
        return;
    }

    // Category definitions with bilingual support
    const categoryInfo = {
        carreira: {
            icon: '📈',
            title: 'Career Goals',
            subtitle: 'Metas de desenvolvimento de carreira',
            color: '#D64000'
        },
        tecnica: {
            icon: '💻',
            title: 'Habilidades Técnicas',
            subtitle: 'Competências técnicas e ferramentas',
            color: '#1A7EE5'
        },
        'soft-skills': {
            icon: '🤝',
            title: 'Soft Skills',
            subtitle: 'Habilidades interpessoais e comportamentais',
            color: '#4DB29D'
        },
        certificacao: {
            icon: '🎓',
            title: 'Certificações',
            subtitle: 'Certificações profissionais e acadêmicas',
            color: '#D4792A'
        },
        projeto: {
            icon: '🚀',
            title: 'Projetos Especiais',
            subtitle: 'Projetos estratégicos e iniciativas',
            color: '#123021'
        },
        outros: {
            icon: '⭐',
            title: 'Outras Metas',
            subtitle: 'Objetivos diversos',
            color: '#7A7A7A'
        }
    };

    const priorityColors = {
        alta: '#D64000',
        media: '#D4792A',
        baixa: '#4DB29D'
    };

    // Group ALL goals by category (manual + Workday)
    const groupedGoals = {};
    allGoals.forEach(goal => {
        if (!groupedGoals[goal.category]) {
            groupedGoals[goal.category] = [];
        }
        groupedGoals[goal.category].push(goal);
    });

    // Render each category
    let html = '';
    Object.keys(groupedGoals).forEach(categoryKey => {
        const category = categoryInfo[categoryKey];
        const goals = groupedGoals[categoryKey];

        // Sort goals by priority
        goals.sort((a, b) => {
            const priorityOrder = { alta: 0, media: 1, baixa: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        html += `
            <div class="category-section">
                <div class="category-header" style="border-left: 4px solid ${category.color}">
                    <div class="category-title">
                        <span class="category-icon">${category.icon}</span>
                        <div class="category-info">
                            <h3>${category.title}</h3>
                            <p class="category-subtitle">${category.subtitle}</p>
                        </div>
                    </div>
                    <span class="category-badge">${goals.length} ${goals.length === 1 ? 'meta' : 'metas'}</span>
                </div>

                <div class="category-goals">
                    ${goals.map(goal => {
                        const deadline = new Date(goal.deadline);
                        const today = new Date();
                        const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
                        const isOverdue = daysLeft < 0;
                        const isUrgent = daysLeft <= 7 && daysLeft >= 0;

                        return `
                            <div class="custom-goal-card" data-id="${goal.id}">
                                <div class="goal-header">
                                    <div class="goal-title-row">
                                        ${goal.source === 'workday' ? '<span class="workday-badge">📄 Workday</span>' : ''}
                                        <h4>${goal.title}</h4>
                                    </div>
                                    <div class="goal-actions">
                                        <button class="btn-icon-small" onclick="editGoal(${goal.id})" title="Editar">✏️</button>
                                        <button class="btn-icon-small" onclick="deleteGoal(${goal.id})" title="Excluir">🗑️</button>
                                    </div>
                                </div>
                                <p class="goal-description">${goal.description}</p>

                                <div class="goal-progress-bar">
                                    <div class="goal-progress-fill" style="width: ${goal.progress}%; background: ${priorityColors[goal.priority]}"></div>
                                    <span class="goal-progress-text">${goal.progress}%</span>
                                </div>

                                <div class="goal-meta">
                                    <span class="goal-deadline ${isOverdue ? 'overdue' : isUrgent ? 'urgent' : ''}">
                                        📅 ${deadline.toLocaleDateString('pt-BR')}
                                        ${isOverdue ? '(Atrasado!)' : isUrgent ? '(Urgente!)' : `(${daysLeft} dias)`}
                                    </span>
                                    <span class="goal-priority" style="color: ${priorityColors[goal.priority]}">
                                        ${goal.priority === 'alta' ? '🔴' : goal.priority === 'media' ? '🟡' : '🟢'} ${goal.priority.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;

    // Metas do Workday e metas manuais agora são mostradas juntas!
    // Não há mais separação - todas aparecem na mesma lista por categoria
}

function renderWorkdayGoals() {
    const container = document.getElementById('goalsCategories');
    if (!container) return;

    // Filter only Workday imported goals
    const workdayGoals = APP_DATA.customGoals.filter(g => g.source === 'workday');

    if (workdayGoals.length === 0) return;

    // Category definitions
    const categoryInfo = {
        carreira: {
            icon: '📈',
            title: 'Career Goals',
            subtitle: 'Metas de desenvolvimento de carreira',
            color: '#D64000'
        },
        tecnica: {
            icon: '💻',
            title: 'Habilidades Técnicas',
            subtitle: 'Competências técnicas e ferramentas',
            color: '#1A7EE5'
        },
        'soft-skills': {
            icon: '🤝',
            title: 'Soft Skills',
            subtitle: 'Habilidades interpessoais e comportamentais',
            color: '#4DB29D'
        },
        certificacao: {
            icon: '🎓',
            title: 'Certificações',
            subtitle: 'Certificações profissionais e acadêmicas',
            color: '#D4792A'
        },
        projeto: {
            icon: '🚀',
            title: 'Projetos Especiais',
            subtitle: 'Projetos estratégicos e iniciativas',
            color: '#123021'
        },
        outros: {
            icon: '⭐',
            title: 'Outras Metas',
            subtitle: 'Objetivos diversos',
            color: '#7A7A7A'
        }
    };

    const priorityColors = {
        alta: '#D64000',
        media: '#D4792A',
        baixa: '#4DB29D'
    };

    // Group Workday goals by category
    const groupedWorkdayGoals = {};
    workdayGoals.forEach(goal => {
        if (!groupedWorkdayGoals[goal.category]) {
            groupedWorkdayGoals[goal.category] = [];
        }
        groupedWorkdayGoals[goal.category].push(goal);
    });

    // Add Workday section header
    let workdayHtml = `
        <div class="workday-goals-divider">
            <div class="divider-line"></div>
            <span class="divider-text">📄 Metas Importadas do Workday</span>
            <div class="divider-line"></div>
        </div>
    `;

    // Render each Workday category
    Object.keys(groupedWorkdayGoals).forEach(categoryKey => {
        const category = categoryInfo[categoryKey];
        const goals = groupedWorkdayGoals[categoryKey];

        // Sort goals by priority
        goals.sort((a, b) => {
            const priorityOrder = { alta: 0, media: 1, baixa: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        workdayHtml += `
            <div class="category-section workday-category">
                <div class="category-header" style="border-left: 4px solid ${category.color}">
                    <div class="category-title">
                        <span class="category-icon">${category.icon}</span>
                        <div class="category-info">
                            <h3>${category.title}</h3>
                            <p class="category-subtitle">${category.subtitle} • Workday</p>
                        </div>
                    </div>
                    <span class="category-badge workday-badge">${goals.length} ${goals.length === 1 ? 'meta' : 'metas'}</span>
                </div>

                <div class="category-goals">
                    ${goals.map(goal => {
                        const deadline = new Date(goal.deadline);
                        const today = new Date();
                        const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
                        const isOverdue = daysLeft < 0;
                        const isUrgent = daysLeft <= 7 && daysLeft >= 0;

                        return `
                            <div class="custom-goal-card workday-goal-card" data-id="${goal.id}">
                                <div class="goal-header">
                                    <div class="goal-title-row">
                                        <span class="workday-tag">📄 Workday</span>
                                        <h4>${goal.title}</h4>
                                    </div>
                                    <div class="goal-actions">
                                        <button class="btn-icon-small" onclick="editGoal(${goal.id})" title="Editar">✏️</button>
                                        <button class="btn-icon-small" onclick="deleteGoal(${goal.id})" title="Excluir">🗑️</button>
                                    </div>
                                </div>
                                <p class="goal-description">${goal.description}</p>

                                <div class="goal-progress-bar">
                                    <div class="goal-progress-fill" style="width: ${goal.progress}%; background: ${priorityColors[goal.priority]}"></div>
                                    <span class="goal-progress-text">${goal.progress}%</span>
                                </div>

                                <div class="goal-meta">
                                    <span class="goal-deadline ${isOverdue ? 'overdue' : isUrgent ? 'urgent' : ''}">
                                        📅 ${deadline.toLocaleDateString('pt-BR')}
                                        ${isOverdue ? '(Atrasado!)' : isUrgent ? '(Urgente!)' : `(${daysLeft} dias)`}
                                    </span>
                                    <span class="goal-priority" style="color: ${priorityColors[goal.priority]}">
                                        ${goal.priority === 'alta' ? '🔴' : goal.priority === 'media' ? '🟡' : '🟢'} ${goal.priority.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    });

    container.innerHTML += workdayHtml;
}

function editGoal(goalId) {
    const goal = APP_DATA.customGoals.find(g => g.id === goalId);
    if (!goal) return;

    document.getElementById('goalTitle').value = goal.title;
    document.getElementById('goalDescription').value = goal.description;
    document.getElementById('goalCategory').value = goal.category;
    document.getElementById('goalDeadline').value = goal.deadline;
    document.getElementById('goalPriority').value = goal.priority;
    document.getElementById('goalProgress').value = goal.progress;

    // Remove old goal
    APP_DATA.customGoals = APP_DATA.customGoals.filter(g => g.id !== goalId);
    saveData();

    openGoalModal();
}

function deleteGoal(goalId) {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) return;

    APP_DATA.customGoals = APP_DATA.customGoals.filter(g => g.id !== goalId);
    saveData();
    renderCustomGoals();
    showNotification('🗑️ Meta excluída', 'success');
}

// Emergency function to clear all sample/duplicate goals
function clearAllSampleGoals() {
    if (!confirm('Isso vai remover TODAS as metas de exemplo duplicadas. Deseja continuar?')) return;

    // Keep only unique goals based on a combination of title and category
    const seen = new Set();
    APP_DATA.customGoals = APP_DATA.customGoals.filter(goal => {
        const key = `${goal.title}-${goal.category}`;
        if (seen.has(key) || goal.isSample) {
            return false; // Remove duplicates and samples
        }
        seen.add(key);
        return true;
    });

    sampleGoalsVisible = false;
    saveData();
    renderCustomGoals();
    showNotification('✅ Metas de exemplo e duplicadas removidas!', 'success');

    // Reset button
    const btn = document.querySelector('[onclick="toggleSampleGoals()"]');
    if (btn) {
        btn.innerHTML = '👁️ Ver Exemplo';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
    }
}

// Clear all Workday imported goals
function clearWorkdayGoals() {
    const workdayCount = APP_DATA.customGoals.filter(g => g.source === 'workday').length;

    if (workdayCount === 0) {
        showNotification('ℹ️ Nenhuma meta do Workday encontrada', 'info');
        return;
    }

    if (!confirm(`Isso vai remover TODAS as ${workdayCount} metas importadas do Workday. Deseja continuar?`)) return;

    // Remove all goals with source: 'workday'
    APP_DATA.customGoals = APP_DATA.customGoals.filter(g => g.source !== 'workday');

    saveData();
    renderCustomGoals();
    showNotification(`✅ ${workdayCount} metas do Workday removidas!`, 'success');
}

// Clear ALL goals (emergency reset)
function clearAllGoals() {
    const totalCount = APP_DATA.customGoals.length;

    if (totalCount === 0) {
        showNotification('ℹ️ Nenhuma meta encontrada', 'info');
        return;
    }

    if (!confirm(`⚠️ ATENÇÃO! Isso vai remover TODAS as ${totalCount} metas (incluindo suas metas pessoais). Esta ação não pode ser desfeita! Deseja continuar?`)) return;

    APP_DATA.customGoals = [];
    sampleGoalsVisible = false;

    saveData();
    renderCustomGoals();
    showNotification('🗑️ Todas as metas foram removidas!', 'success');

    // Reset button
    const btn = document.querySelector('[onclick="toggleSampleGoals()"]');
    if (btn) {
        btn.innerHTML = '👁️ Ver Exemplo';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
    }
}

// Toggle sample goals display
let sampleGoalsVisible = false;
let sampleGoalsData = [];

function toggleSampleGoals() {
    const btn = document.querySelector('[onclick="toggleSampleGoals()"]');

    if (sampleGoalsVisible) {
        // Hide samples - remove them from display
        APP_DATA.customGoals = APP_DATA.customGoals.filter(g => !g.isSample);
        sampleGoalsData = []; // Clear saved samples
        sampleGoalsVisible = false;
        btn.innerHTML = '👁️ Ver Exemplo';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
        // Don't save when hiding samples - just render
        renderCustomGoals();
        showNotification('ℹ️ Exemplos ocultados', 'info');
    } else {
        // First, remove any existing samples
        APP_DATA.customGoals = APP_DATA.customGoals.filter(g => !g.isSample);
        // Show samples - add them temporarily
        const today = new Date();
        const threeMonthsLater = new Date(today.getTime());
        threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
        const sixMonthsLater = new Date(today.getTime());
        sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

        sampleGoalsData = [
            // Manual goals
            {
                id: 'sample-1',
                title: 'Obter certificação AWS Solutions Architect',
                description: 'Estudar e passar no exame de certificação AWS para melhorar conhecimentos em cloud computing',
                category: 'certificacao',
                deadline: threeMonthsLater.toISOString().split('T')[0],
                priority: 'alta',
                progress: 35,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isSample: true
            },
            {
                id: 'sample-2',
                title: 'Dominar Python para automação fiscal',
                description: 'Aprender Python avançado para automatizar processos de compliance fiscal',
                category: 'tecnica',
                deadline: sixMonthsLater.toISOString().split('T')[0],
                priority: 'alta',
                progress: 20,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isSample: true
            },
            {
                id: 'sample-3',
                title: 'Melhorar habilidades de apresentação',
                description: 'Fazer curso de oratória e apresentar pelo menos 3 workshops internos',
                category: 'soft-skills',
                deadline: sixMonthsLater.toISOString().split('T')[0],
                priority: 'media',
                progress: 50,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isSample: true
            },
            {
                id: 'sample-4',
                title: 'Promoção para Consultor Fiscal Pleno',
                description: 'Desenvolver competências necessárias e alcançar resultados para promoção',
                category: 'carreira',
                deadline: new Date(new Date().setMonth(new Date().getMonth() + 12)).toISOString().split('T')[0],
                priority: 'alta',
                progress: 40,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isSample: true
            },
            // Workday imported goals
            {
                id: 'sample-5',
                title: 'Liderar implementação Tax One SAP',
                description: 'Conduzir a implementação do sistema Tax One SAP para 5 clientes estratégicos - Meta importada do Workday',
                category: 'projeto',
                deadline: sixMonthsLater.toISOString().split('T')[0],
                priority: 'alta',
                progress: 25,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                source: 'workday',
                isSample: true
            },
            {
                id: 'sample-6',
                title: 'Desenvolver expertise em IA aplicada a Tax',
                description: 'Estudar e implementar soluções de IA para otimização de processos fiscais - Meta do Workday Q1 2026',
                category: 'carreira',
                deadline: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0],
                priority: 'alta',
                progress: 15,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                source: 'workday',
                isSample: true
            },
            {
                id: 'sample-7',
                title: 'Mentoria de 2 júniors',
                description: 'Desenvolver habilidades de liderança mentorando 2 consultores júnior - Performance Review 2026',
                category: 'soft-skills',
                deadline: new Date(new Date().setMonth(new Date().getMonth() + 9)).toISOString().split('T')[0],
                priority: 'media',
                progress: 60,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                source: 'workday',
                isSample: true
            }
        ];

        APP_DATA.customGoals = [...APP_DATA.customGoals, ...sampleGoalsData];
        sampleGoalsVisible = true;
        btn.innerHTML = '🙈 Ocultar Exemplo';
        btn.classList.remove('btn-secondary');
        btn.classList.add('btn-primary');
        renderCustomGoals();
        showNotification('✅ Metas de exemplo exibidas!', 'success');
    }
}

// ===== WORKDAY IMPORT =====
// 🚫 FUNCIONALIDADE DESATIVADA POR SOLICITAÇÃO DO USUÁRIO
// As funções abaixo estão mantidas mas não são mais usadas
// Modal e botão foram removidos do HTML

/*
function openWorkdayImport() {
    document.getElementById('workdayModal').style.display = 'block';
}
*/

/*
// TODAS AS FUNÇÕES ABAIXO FORAM DESATIVADAS
// Para reativar, remova este bloco de comentário

function switchImportTab(tabName) {
    // Remove active class from all tabs and contents
    document.querySelectorAll('.import-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.import-tab-content').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
    });

    // Activate selected tab
    if (tabName === 'file') {
        document.querySelector('[onclick="switchImportTab(\'file\')"]').classList.add('active');
        const fileTab = document.getElementById('importFileTab');
        fileTab.classList.add('active');
        fileTab.style.display = 'block';
    } else if (tabName === 'paste') {
        document.querySelector('[onclick="switchImportTab(\'paste\')"]').classList.add('active');
        const pasteTab = document.getElementById('importPasteTab');
        pasteTab.classList.add('active');
        pasteTab.style.display = 'block';
    }
}

async function importWorkdayReport(event) {
    event.preventDefault();

    // Pegar texto colado
    const textInput = document.getElementById('workdayText');
    const text = textInput.value.trim();

    if (!text) {
        showNotification('⚠️ Cole o texto de UMA meta do Workday primeiro!', 'error');
        return;
    }

    showNotification('📄 Processando meta... Aguarde.', 'info');

    // Process the text
    try {
        const extractedData = parseWorkdayReport(text, 'workday-import');

        // Show preview
        displayWorkdayPreview(extractedData);

        // Ask for confirmation
        if (confirm(`Encontrada ${extractedData.goals.length} meta(s).\n\nDeseja importar? Isso irá ADICIONAR à lista existente.`)) {
            // NUNCA substituir - sempre adicionar
            const overwrite = false;

            if (overwrite) {
                // Clear existing data
                APP_DATA.customGoals = [];
                APP_DATA.strengths = [];
                APP_DATA.opportunities = [];
            }

            // Import goals
            if (extractedData.goals && extractedData.goals.length > 0) {
                extractedData.goals.forEach(goal => {
                    APP_DATA.customGoals.push({
                        id: Date.now() + Math.random(),
                        title: goal.title,
                        description: goal.description || 'Importado do Workday',
                        category: 'carreira',
                        deadline: goal.deadline || new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
                        priority: 'alta',
                        progress: goal.progress || 0,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        source: 'workday' // Mark as Workday import
                    });
                });
            }

            // Import strengths
            if (extractedData.strengths && extractedData.strengths.length > 0) {
                extractedData.strengths.forEach(strength => {
                    APP_DATA.strengths.push({
                        id: Date.now() + Math.random(),
                        text: strength,
                        date: new Date().toISOString()
                    });
                });
            }

            // Import opportunities
            if (extractedData.opportunities && extractedData.opportunities.length > 0) {
                extractedData.opportunities.forEach(opp => {
                    APP_DATA.opportunities.push({
                        id: Date.now() + Math.random(),
                        text: opp,
                        date: new Date().toISOString()
                    });
                });
            }

            // NÃO atualizar informações pessoais automaticamente
            // Os usuários devem configurar manualmente na seção de Configurações
            // Isso evita sobrescrever dados incorretos do Workday

            saveData();
            renderCustomGoals();
            updateDashboard();

            // Limpar formulário para próxima meta
            document.getElementById('workdayText').value = '';
            document.getElementById('workdayPreview').style.display = 'none';

            showNotification(`✅ Meta importada com sucesso!`, 'success');

            // Show summary
            alert(`✅ Meta importada!\n\n` +
                  `${extractedData.goals[0]?.title || 'Meta adicionada'}\n\n` +
                  `💡 Para importar outra meta:\n` +
                  `1. Cole o texto da próxima meta\n` +
                  `2. Clique em "Importar Esta Meta"\n\n` +
                  `Ou feche este modal para ver suas metas na aba "Metas".`);
        }

    } catch (error) {
        console.error('Error importing Workday report:', error);
        console.error('Error stack:', error.stack);

        // Show more specific error message
        let errorMessage = '❌ Erro ao processar meta.';
        if (error.message) {
            errorMessage = '❌ ' + error.message;
        }

        showNotification(errorMessage, 'error');

        // Show detailed error in console for debugging
        console.log('=== WORKDAY IMPORT ERROR DETAILS ===');
        console.log('Text length:', text?.length);
        console.log('Error:', error);
        console.log('=====================================');
    }
}

// Função para limpar o formulário e importar outra meta
function clearWorkdayForm() {
    document.getElementById('workdayText').value = '';
    document.getElementById('workdayPreview').style.display = 'none';
    showNotification('📝 Formulário limpo. Cole a próxima meta!', 'info');
}

async function readFileAsText(file) {
    // Check if it's a PDF
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        return await extractTextFromPDF(file);
    }

    // Read as text for other formats
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file, 'UTF-8');
    });
}

async function extractTextFromPDF(file) {
    return new Promise((resolve, reject) => {
        // Check if PDF.js is loaded
        if (typeof pdfjsLib === 'undefined') {
            console.error('PDF.js library not loaded');
            reject(new Error('Biblioteca PDF.js não carregada. Recarregue a página e tente novamente.'));
            return;
        }

        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const typedarray = new Uint8Array(e.target.result);

                console.log('Iniciando extração de PDF...');
                console.log('Tamanho do arquivo:', typedarray.length, 'bytes');

                // Load PDF with loading task
                const loadingTask = pdfjsLib.getDocument({
                    data: typedarray,
                    verbosity: 0 // Reduce console spam
                });

                const pdf = await loadingTask.promise;
                console.log('PDF carregado com sucesso. Páginas:', pdf.numPages);

                let fullText = '';

                // Extract text from each page
                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                    const page = await pdf.getPage(pageNum);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + '\n';
                    console.log(`Página ${pageNum}/${pdf.numPages} extraída`);
                }

                console.log('Extração completa. Total de caracteres:', fullText.length);

                if (fullText.trim().length === 0) {
                    reject(new Error('PDF não contém texto extraível. Tente exportar como TXT do Workday.'));
                    return;
                }

                resolve(fullText);
            } catch (error) {
                console.error('Error extracting PDF text:', error);
                console.error('Error details:', error.message, error.name);
                reject(new Error('Erro ao ler PDF: ' + error.message + '. Tente exportar como TXT do Workday.'));
            }
        };
        reader.onerror = (e) => {
            console.error('FileReader error:', e);
            reject(new Error('Erro ao ler arquivo. Verifique se o arquivo não está corrompido.'));
        };
        reader.readAsArrayBuffer(file);
    });
}

function parseWorkdayReport(text, filename) {
    const data = {
        goals: [],
        strengths: [],
        opportunities: [],
        userInfo: {}
    };

    console.log('=== PARSING WORKDAY REPORT (NOVA VERSÃO) ===');
    console.log('Text length:', text.length);
    console.log('First 1000 chars:');
    console.log(text.substring(0, 1000));
    console.log('============================================');

    // PARSER BASEADO NO FORMATO EXATO DO WORKDAY
    const lines = text.split('\n').map(l => l.trim());
    const goals = [];

    console.log('📋 Total de linhas:', lines.length);
    console.log('📄 Iniciando parse estruturado...');

    // Processar linha por linha procurando por estrutura de meta
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Detectar início de uma meta (linha com "Meta" duplicado ou linha que começa com categoria)
        if (line === 'Meta' && i + 1 < lines.length && lines[i + 1] === 'Meta') {
            console.log('🎯 Início de meta detectado na linha', i);

            // A linha seguinte após "Meta\nMeta" é o título
            const titleLine = i + 2 < lines.length ? lines[i + 2] : null;

            if (titleLine && titleLine.length > 15) {
                console.log('✅ Título encontrado:', titleLine);

                // Procurar descrição (vem depois de "Descrição\nDescrição")
                let description = '';
                let dueDate = '';

                for (let j = i + 3; j < Math.min(i + 20, lines.length); j++) {
                    // Encontrar descrição
                    if (lines[j] === 'Descrição' && j + 1 < lines.length && lines[j + 1] === 'Descrição') {
                        if (j + 2 < lines.length) {
                            // Pegar todas as linhas de descrição até encontrar "Status"
                            let descLines = [];
                            for (let k = j + 2; k < lines.length && lines[k] !== 'Status'; k++) {
                                if (lines[k].length > 5 && lines[k] !== 'Descrição') {
                                    descLines.push(lines[k]);
                                }
                            }
                            description = descLines.join(' ');
                            console.log('📝 Descrição:', description.substring(0, 80));
                        }
                    }

                    // Encontrar data de vencimento
                    if (lines[j] === 'Data de vencimento' && j + 1 < lines.length) {
                        if (lines[j + 1] === 'Data de vencimento' && j + 2 < lines.length) {
                            dueDate = lines[j + 2];
                            console.log('📅 Data:', dueDate);
                        }
                    }

                    // Parar se encontrar próxima meta ou fim da seção
                    if (j > i + 3 && (lines[j] === 'Meta' || lines[j].startsWith('Meta '))) {
                        break;
                    }
                }

                // Adicionar meta
                goals.push({
                    title: titleLine,
                    description: description || titleLine,
                    deadline: dueDate || null
                });

                console.log('➕ Meta adicionada:', titleLine.substring(0, 60));
                console.log('---');
            }
        }
    }

    console.log('📊 Total de metas estruturadas encontradas:', goals.length);

    // FALLBACK DESATIVADO - A estrutura "Meta\nMeta" é suficiente
    // O fallback estava criando duplicatas pegando as linhas de descrição
    if (goals.length === 0) {
        console.log('⚠️  AVISO: Nenhuma meta encontrada!');
        console.log('💡 Certifique-se de copiar o texto EXATO do Workday incluindo os labels "Meta" duplicados.');
        console.log('📋 Formato esperado:');
        console.log('   Meta');
        console.log('   Meta');
        console.log('   [Título da Meta]');
        console.log('   Descrição');
        console.log('   Descrição');
        console.log('   [Texto da descrição...]');
    }

    // Criar objetos de meta para o APP_DATA
    goals.forEach((goal, index) => {
        data.goals.push({
            title: goal.title.length > 100 ? goal.title.substring(0, 97) + '...' : goal.title,
            description: goal.description,
            progress: 0,
            deadline: goal.deadline || new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0]
        });
    });

    console.log('=== RESULTADO DO PARSE ===');
    console.log('Metas:', data.goals.length);
    console.log('Pontos Fortes:', data.strengths.length);
    console.log('Oportunidades:', data.opportunities.length);
    console.log('==========================');

    return data;
}

function displayWorkdayPreview(data) {
    const preview = document.getElementById('workdayPreview');
    const content = document.getElementById('workdayPreviewContent');

    let html = '<div class="workday-preview-content">';

    if (data.userInfo && (data.userInfo.name || data.userInfo.role)) {
        html += '<div class="preview-section"><h5>👤 Informações Pessoais</h5><ul>';
        if (data.userInfo.name) html += `<li><strong>Nome:</strong> ${data.userInfo.name}</li>`;
        if (data.userInfo.role) html += `<li><strong>Cargo:</strong> ${data.userInfo.role}</li>`;
        if (data.userInfo.manager) html += `<li><strong>Gestor:</strong> ${data.userInfo.manager}</li>`;
        html += '</ul></div>';
    }

    if (data.goals && data.goals.length > 0) {
        html += `<div class="preview-section">
            <h5>🎯 Metas Encontradas (${data.goals.length})</h5>
            <p style="font-size: 12px; color: #666; margin: 10px 0;">Preview das primeiras 10 metas:</p>
            <ul style="max-height: 300px; overflow-y: auto; padding-right: 10px;">`;

        data.goals.slice(0, 10).forEach((goal, index) => {
            html += `<li><strong>#${index + 1}:</strong> ${goal.title}</li>`;
        });

        if (data.goals.length > 10) {
            html += `<li style="color: var(--tr-orange); font-weight: 600;">... e mais ${data.goals.length - 10} metas</li>`;
        }

        html += '</ul></div>';
    }

    if (data.strengths && data.strengths.length > 0) {
        html += `<div class="preview-section"><h5>💪 Pontos Fortes (${data.strengths.length})</h5><ul>`;
        data.strengths.slice(0, 3).forEach(s => {
            html += `<li>${s.substring(0, 100)}...</li>`;
        });
        html += '</ul></div>';
    }

    if (data.opportunities && data.opportunities.length > 0) {
        html += `<div class="preview-section"><h5>🎯 Oportunidades (${data.opportunities.length})</h5><ul>`;
        data.opportunities.slice(0, 3).forEach(o => {
            html += `<li>${o.substring(0, 100)}...</li>`;
        });
        html += '</ul></div>';
    }

    if (data.goals.length === 0 && data.strengths.length === 0 && data.opportunities.length === 0) {
        html += `
            <div class="warning-box">
                <p class="warning">⚠️ Nenhum dado foi detectado no texto fornecido.</p>
                <p style="font-size: 13px; color: #666; margin-top: 10px;">
                    <strong>Dicas:</strong><br>
                    • Certifique-se de copiar TODO o conteúdo do relatório<br>
                    • Tente exportar do Workday em formato TXT<br>
                    • Ou adicione suas metas manualmente na aba "Metas"
                </p>
            </div>
        `;
    }

    html += '</div>';
    content.innerHTML = html;
    preview.style.display = 'block';
}
*/ // FIM DO BLOCO DE FUNÇÕES DO WORKDAY DESATIVADAS

// ===== IMPORTAR PDF DO RELATÓRIO =====
async function importFromReportPDF() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        showNotification('📄 Lendo PDF do relatório...', 'info');

        try {
            const text = await extractTextFromPDF(file);
            console.log('📄 Texto extraído:', text.substring(0, 500));

            const reportData = parseReportPDF(text);

            if (reportData.found) {
                importReportData(reportData);
                showNotification(`✅ Relatório importado! ${reportData.itemsImported} itens adicionados`, 'success');
            } else {
                showNotification('⚠️ Não foi possível extrair dados do PDF.', 'warning');
            }

        } catch (error) {
            console.error('❌ Erro:', error);
            showNotification('❌ Erro ao processar PDF.', 'error');
        }
    };

    input.click();
}

function parseReportPDF(text) {
    const result = {
        found: false,
        itemsImported: 0,
        userName: null,
        userRole: null,
        manager: null,
        weekActivities: [],
        goals: []
    };

    const nameMatch = text.match(/Erik Nascimento/i);
    if (nameMatch) {
        result.userName = 'Erik Nascimento';
        result.found = true;
    }

    const roleMatch = text.match(/Consultor Fiscal Jr/i);
    if (roleMatch) {
        result.userRole = 'Consultor Fiscal Jr';
        result.found = true;
    }

    const managerMatch = text.match(/Gestor:\s*([^\n]+)/i);
    if (managerMatch) {
        result.manager = managerMatch[1].trim();
        result.found = true;
    }

    const activitiesMatch = text.match(/ATIVIDADES DA SEMANA\s+(.*?)(?=ALINHAMENTO|$)/is);
    if (activitiesMatch) {
        const activities = activitiesMatch[1].trim();
        if (activities) {
            result.weekActivities.push(activities);
            result.itemsImported++;
            result.found = true;
        }
    }

    const goalsSection = text.match(/ALINHAMENTO COM METAS ESTRATEGICAS\s+(.*?)$/is);
    if (goalsSection) {
        const goalsText = goalsSection[1];

        if (goalsText.match(/Customer.*Most LOVED.*TRUSTED PARTNER/i)) {
            result.goals.push({
                title: 'Customer - Most LOVED & TRUSTED PARTNER',
                category: 'Customer',
                status: 'In Progress',
                activities: []
            });
            result.itemsImported++;
            result.found = true;
        }

        if (goalsText.match(/Finance.*People/i)) {
            result.goals.push({
                title: 'Finance + People',
                category: 'Finance',
                status: 'In Progress',
                activities: []
            });
            result.itemsImported++;
            result.found = true;
        }

        const activityLines = goalsText.split('\n').filter(line => {
            const t = line.trim();
            return t.length > 20 && (t.match(/^[•\-\*]/) || t.match(/participac/i) || t.match(/desenvolvimento/i));
        });

        activityLines.forEach(activity => {
            if (result.goals.length > 0) {
                result.goals[result.goals.length - 1].activities.push(activity.trim());
            }
        });
    }

    return result;
}

function importReportData(reportData) {
    let updated = false;

    if (reportData.userName && !APP_DATA.config.userName) {
        APP_DATA.config.userName = reportData.userName;
        updated = true;
    }

    if (reportData.userRole && !APP_DATA.config.userRole) {
        APP_DATA.config.userRole = reportData.userRole;
        updated = true;
    }

    if (reportData.manager) {
        APP_DATA.config.manager = reportData.manager;
        updated = true;
    }

    if (reportData.weekActivities.length > 0) {
        const today = new Date();
        const weekNum = getWeekNumber(today);

        reportData.weekActivities.forEach(activity => {
            APP_DATA.weeklyRecords.push({
                id: Date.now() + Math.random(),
                week: `${today.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`,
                date: today.toISOString().split('T')[0],
                activities: activity,
                learnings: '',
                challenges: ''
            });
        });
        updated = true;
    }

    if (reportData.goals.length > 0) {
        reportData.goals.forEach(goal => {
            const exists = APP_DATA.customGoals.some(g =>
                g.title.toLowerCase() === goal.title.toLowerCase()
            );

            if (!exists) {
                APP_DATA.customGoals.push({
                    id: Date.now() + Math.random(),
                    title: goal.title,
                    description: goal.activities.join('\n• '),
                    category: goal.category || 'Performance Goal',
                    status: goal.status || 'In Progress',
                    dueDate: '2026-12-31',
                    source: 'report-pdf',
                    isSample: false
                });
                updated = true;
            }
        });
    }

    if (updated) {
        saveData();
        updateDashboard();
        renderCustomGoals();
        updateUserDisplay();
    }
}


