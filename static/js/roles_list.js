const rolesListElement = document.getElementById('roles-list');
const searchInput = document.getElementById('search-input');

async function loadLoaderHtml() {
    try {
        const response = await fetch('/api/injects/loader');
        return await response.text();
    } catch (err) {
        console.error('Fehler beim Laden des Loader-Injects:', err);
        return '<div class="text-red-500 font-semibold text-center py-8 tracking-wide uppercase">WARNUNG: Fehler beim Laden des Loader-Injects</div>';
    }
}

const PAGE_SIZE = 50;
let currentPage = 1;
let parsedRows = [];
let filteredRows = [];

async function fetchRolesList() {
    try {
        const response = await fetch('/api/data/roleslist');
        if (!response.ok) throw new Error(`API antwortete mit Status ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching roles list:', error);
        return [];
    }
}

function resolveLinkedMaxCounts(rows) {
    const patterns = {};
    const colorPalette = [
        'border-purple-900/40 bg-purple-950/40 text-purple-400',
        'border-amber-900/40 bg-amber-950/40 text-amber-400',
        'border-emerald-900/40 bg-emerald-950/40 text-emerald-400',
        'border-cyan-900/40 bg-cyan-950/40 text-cyan-400',
        'border-pink-900/40 bg-pink-950/40 text-pink-400',
        'border-indigo-900/40 bg-indigo-950/40 text-indigo-400',
        'border-orange-900/40 bg-orange-950/40 text-orange-400',
        'border-teal-900/40 bg-teal-950/40 text-teal-400',
        'border-rose-900/40 bg-rose-950/40 text-rose-400',
        'border-lime-900/40 bg-lime-950/40 text-lime-400',
        'border-sky-900/40 bg-sky-950/40 text-sky-400',
        'border-violet-900/40 bg-violet-950/40 text-violet-400',
        'border-fuchsia-900/40 bg-fuchsia-950/40 text-fuchsia-400',
        'border-yellow-900/40 bg-yellow-950/40 text-yellow-400',
        'border-green-900/40 bg-green-950/40 text-green-400',
        'border-blue-900/40 bg-blue-950/40 text-blue-400',
        'border-red-900/40 bg-red-950/40 text-red-400',
        'border-slate-700 bg-slate-800 text-slate-300',
        'border-zinc-700 bg-zinc-800 text-zinc-300',
        'border-neutral-700 bg-neutral-800 text-neutral-300',
    ];
    let nextColorIdx = 0;

    // First pass: identify links and resolve values, assign colors
    rows.forEach((row, idx) => {
        const mc = String(row.maxcount || '').trim();
        const match = mc.match(/^\?\?(.+)\?\?$/);

        if (match) {
            const pattern = match[1];
            let foundValue = mc;
            let sourceIdx = -1;

            for (let i = rows.length - 1; i >= 0; i--) {
                const r = rows[i];
                // Check if name includes pattern OR class matches pattern
                if ((r.name && r.name.includes(pattern)) || (r.class && r.class === pattern)) {
                    const rMc = String(r.maxcount || '').trim();
                    if (!rMc.startsWith('??') || !rMc.endsWith('??')) {
                        foundValue = rMc;
                        sourceIdx = i;
                        break;
                    }
                }
            }

            if (!patterns[pattern]) {
                patterns[pattern] = colorPalette[nextColorIdx % colorPalette.length];
                nextColorIdx++;
            }

            row.maxcount = foundValue;
            row.isLinked = true;
            row.linkColorClass = patterns[pattern];

            // Mark the source cell as well
            if (sourceIdx !== -1) {
                rows[sourceIdx].isLinked = true;
                rows[sourceIdx].linkColorClass = patterns[pattern];
            }
        }
    });

    return rows;
}

function renderCell(header, value, row) {
    if (value === null || value === undefined) return '';
    let stringValue = String(value).trim();
    
    if (header === 'Price') {
        if (stringValue === '0' || stringValue.toLowerCase() === 'free') {
            stringValue = 'Free';
        } else if (!stringValue.toLowerCase().endsWith('rbx')) {
            stringValue = `${stringValue} RBX`;
        }
    }

    // Price Badges (Grün wenn "Free")
    if (header === 'Price') {
        const isFree = stringValue.toLowerCase() === 'free';
        const priceClasses = isFree
            ? 'text-green-500 bg-green-950/20 border-green-900/30 font-bold'
            : 'text-slate-400 bg-slate-900/60 border-slate-800/60 font-medium';
        return `<span class="px-2.5 py-0.5 rounded text-[10px] border uppercase tracking-wider ${priceClasses}">${stringValue}</span>`;
    }

    // Max. Count Badges (Blau wie im SCP-Style)
    if (header === 'Max. Count') {
        const baseClass = (row && row.isLinked)
            ? row.linkColorClass
            : 'border-blue-900/40 bg-blue-950/40 text-blue-400';

        const plusMatch = stringValue.match(/(.*)\s*\(\+(.*)\)/);
        if (plusMatch) {
            const base = plusMatch[1].trim();
            const extra = plusMatch[2].trim();
            return `
                <div class="flex items-center gap-1.5">
                    <span class="px-2.5 py-0.5 rounded text-[10px] border font-bold uppercase tracking-wide ${baseClass}">${base}</span>
                    <span class="px-2 py-0.5 rounded text-[10px] border border-red-900/40 bg-red-950/40 text-red-400 font-bold uppercase tracking-wide">+${extra}</span>
                </div>
            `;
        }

        return `<span class="px-2.5 py-0.5 rounded text-[10px] border font-bold uppercase tracking-wide ${baseClass}">${stringValue}</span>`;
    }

    // Class & Spawn Room Badges (Grau Style)
    if (header === 'Class' || header === 'Spawn Room') {
        const textClass = header === 'Class' ? 'text-slate-400' : 'text-slate-300';
        return `<span class="px-2.5 py-0.5 rounded text-[10px] border border-slate-800 bg-slate-900 ${textClass} font-bold uppercase tracking-wider">${stringValue}</span>`;
    }

    return stringValue;
}

function renderPagination(currentPage, totalPages) {
    return `
        <div class="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs border-t border-slate-800/60 pt-3 shrink-0">
            <button class="px-3 py-1.5 rounded border border-slate-800 bg-[#121212] text-slate-400 hover:bg-slate-800 hover:text-red-500 hover:border-red-900/50 transition-all duration-200 disabled:opacity-20 disabled:hover:bg-[#121212] disabled:hover:text-slate-400 disabled:hover:border-slate-800 disabled:cursor-not-allowed"
                onclick="gotoPage(${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}>
                Vorherige
            </button>
            <span class="text-slate-400 font-medium tracking-wide">Seite <span class="text-red-500 font-bold">${currentPage}</span> von <span class="text-slate-200">${totalPages}</span></span>
            <button class="px-3 py-1.5 rounded border border-slate-800 bg-[#121212] text-slate-400 hover:bg-slate-800 hover:text-red-500 hover:border-red-900/50 transition-all duration-200 disabled:opacity-20 disabled:hover:bg-[#121212] disabled:hover:text-slate-400 disabled:hover:border-slate-800 disabled:cursor-not-allowed"
                onclick="gotoPage(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}>
                Nächste
            </button>
        </div>
    `;
}

function renderTablePage(rows, page = 1) {
    if (!Array.isArray(rows) || rows.length === 0) {
        return '<div class="text-slate-500 text-center py-8 tracking-wider uppercase text-xs flex-1 flex items-center justify-center">Keine passenden Daten in der Datenbank vorhanden.</div>';
    }

    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const current = Math.min(Math.max(page, 1), totalPages);
    const pageRows = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
    
    const headers = ['Role Name', 'Class', 'Price', 'Max. Count', 'Spawn Room'];
    const columnWidthClass = 'w-1/5';
    
    const headerRow = headers.map(header => `
        <th class="${columnWidthClass} sticky top-0 z-10 border-b border-slate-800 px-6 py-2.5 text-left bg-[#121212] text-slate-400 font-bold tracking-wider text-[11px] uppercase whitespace-nowrap">${header}</th>
    `).join('');

    const bodyRows = pageRows.map(row => {
        const rowDataMap = {
            'Role Name': row.name,
            'Class': row.class,
            'Price': row.price,
            'Max. Count': row.maxcount,
            'Spawn Room': row.spawn
        };

        const cellsHtml = headers.map(header => {
            if (header === 'Role Name') {
                return `
                    <td class="${columnWidthClass} border-b border-slate-800/40 px-6 py-3 align-middle font-black text-gray-300 tracking-wider uppercase group-hover:text-red-500 transition-colors text-xs">
                        ${renderCell(header, rowDataMap[header], row)}
                    </td>
                `;
            }
            return `
                <td class="${columnWidthClass} border-b border-slate-800/40 px-6 py-3 align-middle text-slate-300 text-xs">
                    ${renderCell(header, rowDataMap[header], row)}
                </td>
            `;
        }).join('');
        
        return `<tr class="hover:bg-red-950/30 active:bg-red-900/20 transition-all duration-150 border-l-2 border-transparent hover:border-red-600/50 group">${cellsHtml}</tr>`;
    }).join('');

    return `
        <div class="flex-1 min-h-0 overflow-auto no-scrollbar rounded-lg border border-slate-800/80 bg-[#121212]/40">
            <table class="min-w-full border-collapse table-fixed">
                <thead><tr>${headerRow}</tr></thead>
                <tbody>${bodyRows}</tbody>
            </table>
        </div>
        ${renderPagination(current, totalPages)}
    `;
}

function applyFilters() {
    const searchTerm = searchInput.value.trim().toLowerCase();

    filteredRows = parsedRows.filter(row => {
        if (searchTerm) {
            const nameMatch = String(row.name || '').toLowerCase().includes(searchTerm);
            const classMatch = String(row.class || '').toLowerCase().includes(searchTerm);
            if (!nameMatch && !classMatch) return false;
        }
        return true;
    });

    currentPage = 1;
    rolesListElement.innerHTML = renderTablePage(filteredRows, currentPage);
}

searchInput.addEventListener('input', applyFilters);

function gotoPage(page) {
    const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
    currentPage = Math.min(Math.max(page, 1), totalPages);
    rolesListElement.innerHTML = renderTablePage(filteredRows, currentPage);
}

window.gotoPage = gotoPage;

(async function init() {
    rolesListElement.innerHTML = await loadLoaderHtml();
    try {
        const cellData = await fetchRolesList();
        // Database uses max_player, but the rest of the script uses maxcount
        parsedRows = cellData.map(r => ({
            ...r,
            maxcount: r.max_player
        }));
        parsedRows = resolveLinkedMaxCounts(parsedRows);
        filteredRows = [...parsedRows];
        currentPage = 1;
        rolesListElement.innerHTML = renderTablePage(filteredRows, currentPage);
    } catch (err) {
        console.error('Fehler beim Laden der Rollen-Daten:', err);
        rolesListElement.innerHTML = `<div class="text-red-600 font-semibold text-center py-8 tracking-wide uppercase flex-1 flex items-center justify-center">CRITICAL ERROR: DATA INACCESSIBLE</div>`;
    }
})();