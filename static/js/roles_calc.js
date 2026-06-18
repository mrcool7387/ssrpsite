// Role class color database
const ROLE_COLORS = {
    'CD': { bg: '#ffc8aa', fg: '#aa6f42', label: 'Class-D' }, // Rich Amber
    'ScD': { bg: '#bfe1f6', fg: '#6b9fd2', label: 'Science' }, // Rich Emerald
    'MD': { bg: '#c6dbe1', fg: '#4f7d8d', label: 'Medical' }, // Rich Cyan
    'SD': { bg: '#e6e6e6', fg: '#5f5f5f', label: 'Security' }, // Security Blue
    'O5': { bg: '#b10202', fg: '#ffffff', border: '#b10202', label: 'O5 Command' }, // Dark/Crimson
    'MTF': { bg: '#0a53a8', fg: '#ffffff', label: 'MTF' }, // MTF Blue
    'SiD': { bg: '#11734b', fg: '#ffffff', label: 'Site Director' }, // Violet
    'IA': { bg: '#5a3286', fg: '#ffffff', label: 'Intelligence' }, // Teal
    'ISD': { bg: '#ff0089', fg: '#ffffff', label: 'Internal Security' }, // Crimson
    'RRT': { bg: '#b10202', fg: '#ffffff', label: 'Rapid Response' }, // Rose Red
    'CI': { bg: '#3d3d3d', fg: '#ffffff', label: 'Chaos Insurgency' } // Olive Green
};

function $(selector) {
    return document.getElementById(selector);
}

// Global state
let roles = [];
let currentLevelsList = [];
let selectedRole = null;

// Get native select and other inputs
const nativeSelect = $('role-select');
const currentLevelInput = $('current-level-input');
const currentLevelSlider = $('current-level-slider');
const currentXpInput = $('current-xp-input');
const currentXpSlider = $('current-xp-slider');
const xpIntervalInput = $('xp-interval-input');
const xpAmountInput = $('xp-amount-input');
const globalXpDisplay = $('global-xp-display');

// Outputs
const currentLevelDisplay = $('current-level-display');
const nextLevelDisplay = $('next-level-display');
const xpToNextDisplay = $('xp-to-next-display');
const timeToNextDisplay = $('time-to-next-display');
const timeUntilMaxDisplay = $('time-until-max-display');
const timePlayedDisplay = $('time-played-display');


const globalXpPerMin = xpAmountInput.value / xpIntervalInput.value;

function $$(SHOUT) {
    // console.log(SHOUT);
}



// Start up
document.addEventListener('DOMContentLoaded', async () => {
    await fetchRoles();
});

// Add EventListeners to all Inputs to trigegr recalculation on change
[currentLevelInput, currentLevelSlider, currentXpInput, currentXpSlider, xpIntervalInput, xpAmountInput].forEach(input => {
    input.addEventListener('input', () => {
        // Sync sliders with inputs
        if (input === currentLevelInput) currentLevelSlider.value = input.value;
        if (input === currentLevelSlider) currentLevelInput.value = input.value;
        if (input === currentXpInput) currentXpSlider.value = input.value;
        if (input === currentXpSlider) currentXpInput.value = input.value;

        calculate();
    });
});

// Fetch all roles
async function fetchRoles() {
    try {
        const response = await fetch('/api/data/roleslist');
        if (!response.ok) throw new Error('Network error');
        roles = await response.json();

        // Populate the dropdown options list
        buildCustomDropdown();
    } catch (err) {
        console.error('Error fetching roles:', err);
        nativeSelect.innerHTML = '<option value="">Fehler beim Laden</option>';
    }
}

// Helper to get role colors
function getRoleStyle(roleClass) {
    return ROLE_COLORS[roleClass] || { bg: '#334155', fg: '#cbd5e1', label: roleClass };
}

// Custom dropdown UI Builder
function buildCustomDropdown() {
    // Hide native select
    nativeSelect.style.display = 'none';

    // Create custom wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'relative w-full';
    nativeSelect.parentNode.insertBefore(wrapper, nativeSelect.nextSibling);

    // Trigger Button
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'w-full flex items-center justify-between border rounded-lg px-3 py-2.5 text-sm font-bold cursor-pointer transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-red-650';
    trigger.innerHTML = `
        <span class="selected-preview flex items-center gap-2">
            <span class="text-slate-500">Rolle auswählen...</span>
        </span>
        <svg class="h-4.5 w-4.5 text-current transition-transform duration-200 dropdown-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
    `;
    wrapper.appendChild(trigger);

    // Dropdown Panel
    const panel = document.createElement('div');
    panel.className = 'custom-dropdown-panel hidden absolute left-0 right-0 mt-1.5 bg-slate-950/95 backdrop-blur-md border border-slate-800/90 rounded-xl shadow-2xl z-50 p-2 flex flex-col gap-1 max-h-64 overflow-y-auto';

    // Search Box
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Rolle suchen...';
    searchInput.className = 'w-full bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-red-500/50 mb-1.5 font-sans';
    panel.appendChild(searchInput);

    // Options List Container
    const listContainer = document.createElement('div');
    listContainer.className = 'flex flex-col gap-1 overflow-y-auto max-h-48 pr-1';
    panel.appendChild(listContainer);

    wrapper.appendChild(panel);

    // Toggle dropdown
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = !panel.classList.contains('hidden');
        closeAllDropdowns();
        if (!isOpen) {
            panel.classList.remove('hidden');
            trigger.querySelector('.dropdown-arrow').classList.add('rotate-180');
            searchInput.value = '';
            renderOptions('', listContainer);
            setTimeout(() => searchInput.focus(), 50);
        }
    });

    // Search filter logic
    searchInput.addEventListener('input', (e) => {
        renderOptions(e.target.value, listContainer);
    });

    // Close on click outside
    document.addEventListener('click', () => {
        closeAllDropdowns();
    });

    panel.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Initial Render of Options
    renderOptions('', listContainer);

    // Auto select first role
    if (roles.length > 0) {
        selectRoleItem(roles[0], trigger);
    }
}

function closeAllDropdowns() {
    document.querySelectorAll('.dropdown-arrow').forEach(arrow => arrow.classList.remove('rotate-180'));
    document.querySelectorAll('.custom-dropdown-panel').forEach(panel => {
        panel.classList.add('hidden');
    });
}

function renderOptions(filterText, container) {
    container.innerHTML = '';
    const query = filterText.toLowerCase().trim();

    const filtered = roles.filter(role =>
        role.name.toLowerCase().includes(query) ||
        role.class.toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
        container.innerHTML = '<div class="text-slate-500 text-xs py-3 text-center">Keine Rollen gefunden.</div>';
        return;
    }

    filtered.forEach(role => {
        const optionStyle = getRoleStyle(role.class);
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all duration-150 border hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]';

        item.style.backgroundColor = optionStyle.bg;
        item.style.color = optionStyle.fg;
        item.style.borderColor = optionStyle.border || optionStyle.bg;

        item.innerHTML = `
            <span class="text-sm font-black uppercase tracking-wider">${role.name}</span>
            <span class="text-[10px] opacity-80 font-bold tracking-widest uppercase font-mono">${role.class}</span>
        `;

        item.addEventListener('click', () => {
            selectRoleItem(role, container.parentNode.parentNode.querySelector('button'));
            closeAllDropdowns();
        });

        container.appendChild(item);
    });
}

async function selectRoleItem(role, triggerBtn) {
    selectedRole = role;

    // Update native select so it's in sync
    nativeSelect.value = role.class;

    // Update selected preview
    const preview = triggerBtn.querySelector('.selected-preview');
    const roleStyle = getRoleStyle(role.class);

    triggerBtn.style.backgroundColor = roleStyle.bg;
    triggerBtn.style.color = roleStyle.fg;
    triggerBtn.style.borderColor = roleStyle.border || roleStyle.bg;

    preview.innerHTML = `
        <span class="text-sm font-black uppercase tracking-wider">${role.name} (${role.class})</span>
    `;

    // Recalculate outputs
    calculate();
}

function formatTime(totalSeconds) {
    if (totalSeconds === Infinity) return '-';

    let hours = 0
    let minutes = 0
    let seconds = 0

    while (totalSeconds >= 3600) {
        totalSeconds -= 3600;
        hours++;
    }

    while (totalSeconds >= 60) {
        totalSeconds -= 60;
        minutes++;
    }

    seconds = totalSeconds;

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

    return parts.join(' ');
}

async function calc_single(currentSelectedRole) {
    const roleData = await fetch(`/api/data/role/${currentSelectedRole}`).then(res => res.json());
    const rawLevelData = await fetch(`/api/data/level/${currentSelectedRole}`).then(res => res.json());

    const levelData = rawLevelData.find(entry => entry.tableName === `levels_${currentSelectedRole}`);

    const current = {
        level: parseInt(currentLevelInput.value),
        xp: parseInt(currentXpInput.value),
    }

    $$(levelData)
    $$(rawLevelData)
    const isMaxLevel = !levelData.list[current.level + 1];


    let BIGmaxXP = 0;
    for (const lvl in levelData.list) {
        BIGmaxXP += levelData.list[lvl].xp;
    }

    // wait for xp sliders to update before disabling them if max level is reached, otherwise they would get stuck on the last xp value and not update if the user changes the level back down
    if (isMaxLevel) {
        setTimeout(() => {
            currentXpSlider.disabled = true;
            currentXpInput.disabled = true;
        }, 50);
    } else {
        currentXpSlider.disabled = false;
        currentXpInput.disabled = false;
    }

    currentLevelSlider.max = Object.keys(levelData.list).length - 1;
    currentLevelInput.max = Object.keys(levelData.list).length - 1;

    let maxxp = 0;
    try {
        maxxp = levelData.list[current.level + 1].xp;
    } catch (err) {
        if (err instanceof TypeError) {
            maxxp = 0;
        } else {
            throw err;
        }
    }

    currentXpSlider.max = maxxp;
    currentXpInput.max = maxxp;

    currentLevelDisplay.textContent = `${levelData.list[current.level].rank} (${current.level})`;
    nextLevelDisplay.textContent = isMaxLevel ? 'Max Level' : `${levelData.list[current.level + 1].rank} (${current.level + 1})`;

    const xpToNext = isMaxLevel ? 0 : maxxp - current.xp;
    xpToNextDisplay.textContent = `${xpToNext.toLocaleString()} XP`;

    const timeToNext = xpToNext / globalXpPerMin;
    timeToNextDisplay.textContent = isMaxLevel ? Infinity : formatTime((timeToNext * 60).toFixed(0));

    let counter = 0;
    let totalXp = 0;
    while (counter <= current.level) {
        $$(`counter: ${counter} | xp: ${levelData.list[counter].xp} | totalXp: ${totalXp}   `);
        totalXp += levelData.list[counter].xp;
        counter++;
    }

    totalXp += current.xp;
    $$(`totalXp: ${totalXp}`);

    const timeUntilMax = (BIGmaxXP - totalXp) / globalXpPerMin;
    timeUntilMaxDisplay.textContent = formatTime((timeUntilMax * 60).toFixed(0));

    const timePlayed = totalXp / globalXpPerMin;
    timePlayedDisplay.textContent = formatTime((timePlayed * 60).toFixed(0));
}

async function calculate() {
    if (!selectedRole) return;

    const src = selectedRole.class.toLowerCase();
    const rolesData = await fetch(`/api/data/role/${selectedRole.class}`).then(res => res.json());

    switch (src) {
        case 'cd':
            await calc_single("cd")
            break;

        case 'scd':
            await calc_single("scd")
            break;

        case 'md':
            await calc_single("md")
            break;

        case 'sd':
            await calc_single("sd")
            break;

        case 'o5':
            await calc_single("o5")
            break;

        case 'mtf':
            const subrole_mtf = selectedRole.name.toLowerCase()
            switch (subrole_mtf) {
                case "alpha-1": {
                    await calc_single("mtf_alpha_1");
                    break;
                }
                case "nu-7": {
                    await calc_single("mtf_nu_7");
                    break;
                }
                case "beta-7": {
                    await calc_single("mtf_beta_7");
                    break;
                }
                case "epsilon-11": {
                    await calc_single("mtf_epsilon_11");
                    break;
                }
                case Default: break;
            }
            break;

        case 'sid':
            await calc_single("sid")
            break;

        case 'ia':
            await calc_single("ia")
            break;

        case 'isd':
            await calc_single("isd")
            break;

        case 'rrt':
            await calc_single("rrt")
            break;

        case 'ci':
            const subrole_ci = selectedRole.name.toLowerCase()
            switch (subrole_ci) {
                case "combative": {
                    await calc_single("ci_combative");
                    break;
                }
                case "combat medic": {
                    await calc_single("ci_combat_medic");
                    break;
                }
                case Default: break;
            }
            break;

        case Default: break;
    }

}