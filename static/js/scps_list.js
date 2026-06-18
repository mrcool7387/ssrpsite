const scpListElement = document.getElementById('scp-list');
const searchInput = document.getElementById('search-input');
const filterPrimaryClass = document.getElementById('filter-primary-class');
const filterSecondaryClass = document.getElementById('filter-secondary-class');
const filterTertiaryClass = document.getElementById('filter-tertiary-class');
const filterSsrp = document.getElementById('filter-ssrp');
const filterScpr = document.getElementById('filter-scpr');

async function loadLoaderHtml() {
    try {
        const response = await fetch('/api/injects/loader');
        console.log('Loader-Inject response received:', response.ok);
        return await response.text();
    } catch (err) {
        console.error('Fehler beim Laden des Loader-Injects:', err);
        return '<div class="text-red-500 font-semibold text-center py-8 tracking-wide uppercase">WARNUNG: Fehler beim Laden des Loader-Injects</div>';
    }
}

const displayHeaders = [
    'ID', 'Name', 'Primary Class', 'Secondary Class', 'Tertiary Class', 
    'Link', 'Exists in SSRP?', 'SSRP Location', 'Exists in SCPR?', 'SCPR Location'
];

const containmentMap = {
    'c1': 'Containment 1',
    'c2': 'Containment 2',
    'cx': 'Containment X',
    'lcx': 'Lower Containment X',

    'e': 'Event',
    's1': 'Sector 1',
    's2': 'Sector 2',
    's3': 'Sector 3',
    'bhs': 'Biohazard Sector'
};

const classTypeMap = {
    'primary': {
        's': 'Safe',
        'e': 'Euclid',
        'k': 'Keter',
        'ssk': 'Siehe sekundäre Klasse',
        't': 'Thaumiel'
    },
    'secondary': {
        'a+': 'Apollyon',
        'a-': 'Archon',
        'c': 'Cernunnos',
        't': 'Ticonderoga',
        'stk': 'Siehe tertiär Klasse'
    },
    'tertiary': {
        'w': 'Ausstehend',
        'ne': 'Nicht eingedämmt',
        'e': 'Erklärt',
        'n': 'Neutralisiert',
        'a': 'Ausgemustert',
        "sek": 'Sonstige esoterische Klassen'
    }
};


const classHiarchyMap = {
    'primary': ['-/-', 'sicher', 'safe', 'euclid', 'keter', 'thaumiel', 'siehe sekundäre klasse'],
    'secondary': ['-/-', 'apollyon', 'archon', 'cernunnos', 'ticonderoga', 'siehe tertiär klasse'],
    'tertiary': ['-/-', 'ausstehend', 'nicht eingedämmt', 'erklärt', 'neutralisiert', 'ausgemustert', 'sonstige esoterische klassen']
};

const classStyleMap = {
    '-/-': 'bg-slate-800/60 text-slate-400 border-slate-700/40 font-medium',
    '-': 'bg-slate-800/60 text-slate-400 border-slate-700/40 font-medium',
    'sicher': 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40 font-bold',
    'safe': 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40 font-bold',
    'euclid': 'bg-blue-950/40 text-blue-400 border-blue-900/40 font-bold',
    'keter': 'bg-red-950/40 text-red-400 border-red-900/40 font-bold',
    'thaumiel': 'bg-purple-950/40 text-purple-400 border-purple-900/40 font-bold',
    'apollyon': 'bg-red-950/50 text-red-500 border-red-800/60 font-bold',
    'archon': 'bg-orange-950/40 text-orange-400 border-orange-900/40 font-bold',
    'cernunnos': 'bg-yellow-950/30 text-yellow-400 border-yellow-900/40 font-bold',
    'ticonderoga': 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40 font-bold',
    'ausstehend': 'bg-blue-950/40 text-blue-400 border-blue-900/40 font-bold',
    'nicht eingedämmt': 'bg-purple-950/40 text-purple-400 border-purple-900/40 font-bold',
    'erklärt': 'bg-slate-800/80 text-slate-300 border-slate-700/60 font-bold',
    'neutralisiert': 'bg-orange-950/40 text-orange-400 border-orange-900/40 font-bold',
    'ausgemustert': 'bg-red-950/60 text-red-400 border-red-900/60 font-bold',
    'siehe sekundäre klasse': 'bg-slate-800/60 text-slate-400 border-slate-700/40 font-medium italic',
    'siehe tertiär klasse': 'bg-slate-800/60 text-slate-400 border-slate-700/40 font-medium italic',
    'sonstige esoterische klassen': 'bg-slate-800/60 text-slate-400 border-slate-700/40 font-medium italic'
};

const locationStyleMap = {
    'containment 1': {
        dots: '<span class="text-emerald-400">●</span><span class="text-slate-700">●●●</span>',
        classes: 'bg-emerald-950/30 text-emerald-400 border-emerald-900/30 font-bold'
    },
    'containment 2': {
        dots: '<span class="text-yellow-400">●●</span><span class="text-slate-700">●●</span>',
        classes: 'bg-yellow-950/20 text-yellow-400 border-yellow-900/30 font-bold'
    },
    'containment x': {
        dots: '<span class="text-orange-400">●●●</span><span class="text-slate-700">●</span>',
        classes: 'bg-orange-950/30 text-orange-400 border-orange-900/30 font-bold'
    },
    'lower containment x': {
        dots: '<span class="text-red-400">●●●●</span>',
        classes: 'bg-red-950/40 text-red-400 border-red-900/40 font-bold'
    },
    'sector 1': {
        dots: '<span class="text-emerald-400">●</span><span class="text-slate-700">●●●</span>',
        classes: 'bg-emerald-950/30 text-emerald-400 border-emerald-900/30 font-bold'
    },
    'sector 2': {
        dots: '<span class="text-yellow-400">●●</span><span class="text-slate-700">●●</span>',
        classes: 'bg-yellow-950/20 text-yellow-400 border-yellow-900/30 font-bold'
    },
    'sector 3': {
        dots: '<span class="text-orange-400">●●●</span><span class="text-slate-700">●</span>',
        classes: 'bg-orange-950/30 text-orange-400 border-orange-900/30 font-bold'
    },
    'biohazard sector': {
        dots: '<span class="text-red-400">●●●●</span>',
        classes: 'bg-red-950/40 text-red-400 border-red-900/40 font-bold'
    },
    'event': {
        dots: '<span class="text-emerald-400">●</span><span class="text-yellow-400">●</span><span class="text-orange-400">●</span><span class="text-red-400">●</span>',
        classes: 'bg-purple-950/40 text-purple-400 border-purple-900/40 font-bold'
    }
};

const PAGE_SIZE = 50;
let currentPage = 1;
let parsedRows = [];
let filteredRows = [];

function transformData(dbRows) {
    if (!Array.isArray(dbRows)) return [];

    return dbRows.map(row => {
        return {
            'ID': row.id,
            'Name': row.name,
            'Primary Class': classTypeMap.primary[row.primere_klasse] || row.primere_klasse,
            'Secondary Class': classTypeMap.secondary[row.sekundere_klasse] || row.sekundere_klasse,
            'Tertiary Class': classTypeMap.tertiary[row.tertiere_klasse] || row.tertiere_klasse,
            'Link': row.link,
            'Exists in SSRP?': row.in_ssrp === 1,
            'SSRP Location': containmentMap[row.ssrp_standort] || row.ssrp_standort,
            'Exists in SCPR?': row.in_scpr === 1,
            'SCPR Location': containmentMap[row.scpr_standort] || row.scpr_standort
        };
    });
}

function handleRowClick(event, scpIdValue) {
    if (event.target.closest('a')) {
        return;
    }

    if (!scpIdValue) return;
    const cleanId = String(scpIdValue).replace(/scp-/i, '').trim();
    
    if (cleanId) {
        window.location.href = `/scp/${cleanId}`;
    }
}

window.handleRowClick = handleRowClick;

function renderCell(header, value) {
    if (value === null || value === undefined) {
        return '';
    }

    if (typeof value === 'boolean') {
        return value 
            ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/40 text-red-400 border border-red-900/50 uppercase tracking-wider">Yes</span>' 
            : '<span class="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-500 border border-slate-700/60 uppercase tracking-wider">No</span>';
    }

    if (header === 'Link' && typeof value === 'string') {
        const safeUrl = value;
        return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="text-red-500 hover:text-red-400 font-medium transition-colors hover:underline inline-flex items-center gap-1 break-all">ACCESS</a>`;
    }

    if (typeof value === 'string' && (header === 'Primary Class' || header === 'Secondary Class' || header === 'Tertiary Class')) {
        const normalized = value.trim().toLowerCase();
        const classes = classStyleMap[normalized] || 'bg-slate-800/60 text-slate-400 border-slate-700/40 font-medium';
        return `<span class="px-2 py-0.5 rounded text-[10px] border uppercase tracking-wider ${classes}">${value}</span>`;
    }

    if (typeof value === 'string' && (header === 'SSRP Location' || header === 'SCPR Location')) {
        const normalized = value.trim().toLowerCase();
        
        if (normalized === '-/-' || normalized === '-' || normalized === '') {
            return '<span class="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800/60 text-slate-400 border-slate-700/40 uppercase tracking-wider">-/-</span>';
        }

        const locationConfig = locationStyleMap[normalized];

        if (locationConfig) {
            return `<span class="inline-flex items-center gap-2 px-2 py-0.5 rounded text-[10px] border uppercase tracking-wider ${locationConfig.classes}">
                <span class="font-sans text-[11px] tracking-none leading-none select-none">${locationConfig.dots}</span>
                <span>${value}</span>
            </span>`;
        }

        return `<span class="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800/60 text-slate-400 border-slate-700/40 uppercase tracking-wider">${value}</span>`;
    }

    return String(value);
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
    const headers = displayHeaders;
    
    const headerRow = headers.map(header => `
        <th class="sticky top-0 z-10 border-b border-slate-800 px-4 py-2.5 text-left bg-[#121212] text-slate-400 font-bold tracking-wider text-[11px] uppercase whitespace-nowrap">${header}</th>
    `).join('');

    const bodyRows = pageRows.map(row => {
        const cellsHtml = headers.map(header => {
            if (header === 'ID' || header === 'Name') {
                return `
                    <td class="border-b border-slate-800/40 px-4 py-2.5 align-middle font-black text-gray-300 tracking-wider uppercase group-hover:text-red-500 transition-colors text-xs">
                        ${renderCell(header, row[header])}
                    </td>
                `;
            }
            return `
                <td class="border-b border-slate-800/40 px-4 py-2.5 align-middle text-slate-300 text-xs">
                    ${renderCell(header, row[header])}
                </td>
            `;
        }).join('');
        
        const scpId = row['ID'] || '';
        
        return `<tr class="hover:bg-red-950/30 active:bg-red-900/20 transition-all duration-150 cursor-pointer border-l-2 border-transparent hover:border-red-600/50 group" 
                    onclick="handleRowClick(event, '${scpId}')">${cellsHtml}</tr>`;
    }).join('');

    return `
        <div class="flex-1 min-h-0 overflow-auto no-scrollbar rounded-lg border border-slate-800/80 bg-[#121212]/40">
            <table class="min-w-full border-collapse">
                <thead><tr>${headerRow}</tr></thead>
                <tbody>${bodyRows}</tbody>
            </table>
        </div>
        ${renderPagination(current, totalPages)}
    `;
}

function buildDropdownOptions(classList) {
    return classList.map(cls => `<option value="${cls}">${cls.toUpperCase()}</option>`).join('');
}

function populateDropdowns() {
    filterPrimaryClass.insertAdjacentHTML('beforeend', buildDropdownOptions(classHiarchyMap['primary']));
    filterSecondaryClass.insertAdjacentHTML('beforeend', buildDropdownOptions(classHiarchyMap['secondary']));
    filterTertiaryClass.insertAdjacentHTML('beforeend', buildDropdownOptions(classHiarchyMap['tertiary']));
}

function applyFilters() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedPrimary = filterPrimaryClass.value;
    const selectedSecondary = filterSecondaryClass.value;
    const selectedTertiary = filterTertiaryClass.value;
    const selectedSsrp = filterSsrp.value;
    const selectedScpr = filterScpr.value;

    filteredRows = parsedRows.filter(row => {
        // Freitextsuche
        if (searchTerm) {
            const idMatch = String(row['ID'] || '').toLowerCase().includes(searchTerm);
            const nameMatch = String(row['Name'] || '').toLowerCase().includes(searchTerm);
            if (!idMatch && !nameMatch) return false;
        }

        // Primary Class Filter
        if (selectedPrimary) {
            const rowPrimary = String(row['Primary Class'] || '').toLowerCase().trim();
            if (selectedPrimary === 'safe' || selectedPrimary === 'sicher') {
                if (rowPrimary !== 'safe' && rowPrimary !== 'sicher') return false;
            } else if (rowPrimary !== selectedPrimary) {
                return false;
            }
        }

        // Secondary Class Filter
        if (selectedSecondary) {
            const rowSecondary = String(row['Secondary Class'] || '').toLowerCase().trim();
            if (rowSecondary !== selectedSecondary) return false;
        }

        // Tertiary Class Filter
        if (selectedTertiary) {
            const rowTertiary = String(row['Tertiary Class'] || '').toLowerCase().trim();
            if (rowTertiary !== selectedTertiary) return false;
        }

        // SSRP Filter
        if (selectedSsrp !== "") {
            const isSsrp = !!row['Exists in SSRP?'];
            const targetSsrp = selectedSsrp === "true";
            if (isSsrp !== targetSsrp) return false;
        }

        // SCPR Filter
        if (selectedScpr !== "") {
            const isScpr = !!row['Exists in SCPR?'];
            const targetScpr = selectedScpr === "true";
            if (isScpr !== targetScpr) return false;
        }

        return true;
    });

    currentPage = 1;
    scpListElement.innerHTML = renderTablePage(filteredRows, currentPage);
}

searchInput.addEventListener('input', applyFilters);
filterPrimaryClass.addEventListener('change', applyFilters);
filterSecondaryClass.addEventListener('change', applyFilters);
filterTertiaryClass.addEventListener('change', applyFilters);
filterSsrp.addEventListener('change', applyFilters);
filterScpr.addEventListener('change', applyFilters);

function gotoPage(page) {
    const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
    currentPage = Math.min(Math.max(page, 1), totalPages);
    scpListElement.innerHTML = renderTablePage(filteredRows, currentPage);
}

window.gotoPage = gotoPage;

async function loadSheetData() {
    const response = await fetch('/api/data/scplist');
    if (!response.ok) {
        throw new Error(`API antwortete mit Status ${response.status}`);
    }
    return await response.json();
}

(async function init() {
    populateDropdowns();
    scpListElement.innerHTML = await loadLoaderHtml();
    try {
        const dbData = await loadSheetData();
        parsedRows = transformData(dbData);
        filteredRows = [...parsedRows];
        currentPage = 1;
        scpListElement.innerHTML = renderTablePage(filteredRows, currentPage);
    } catch (err) {
        console.error('Fehler beim Laden der Datenbank-Daten:', err);
        scpListElement.innerHTML = `<div class="text-red-500 font-semibold text-center py-8 tracking-wide uppercase flex-1 flex items-center justify-center">CRITICAL ERROR: DATA INACCESSIBLE</div>`;
    }
})();