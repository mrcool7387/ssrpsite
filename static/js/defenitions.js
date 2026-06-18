document.addEventListener("DOMContentLoaded", async function () {
    const container = document.getElementById("definitions-container");

    const colorMap = {
        emerald: {
            border: 'hover:border-emerald-700/80',
            line: 'bg-emerald-600/50 group-hover:bg-emerald-600',
            text: 'text-emerald-500',
            icon: 'text-emerald-500',
            glow: 'rgba(16,185,129,0.45)'
        },
        blue: {
            border: 'hover:border-blue-700/80',
            line: 'bg-blue-600/50 group-hover:bg-blue-600',
            text: 'text-blue-500',
            icon: 'text-blue-500',
            glow: 'rgba(59,130,246,0.45)'
        },
        red: {
            border: 'hover:border-red-700/80',
            line: 'bg-red-600/50 group-hover:bg-red-600',
            text: 'text-red-500',
            icon: 'text-red-500',
            glow: 'rgba(239,68,68,0.45)'
        },
        purple: {
            border: 'hover:border-purple-700/80',
            line: 'bg-purple-600/50 group-hover:bg-purple-600',
            text: 'text-purple-500',
            icon: 'text-purple-500',
            glow: 'rgba(168,85,247,0.45)'
        },
        orange: {
            border: 'hover:border-orange-700/80',
            line: 'bg-orange-600/50 group-hover:bg-orange-600',
            text: 'text-orange-500',
            icon: 'text-orange-500',
            glow: 'rgba(249,115,22,0.45)'
        },
        yellow: {
            border: 'hover:border-yellow-700/80',
            line: 'bg-yellow-600/50 group-hover:bg-yellow-600',
            text: 'text-yellow-400',
            icon: 'text-yellow-400',
            glow: 'rgba(250,204,21,0.40)'
        },
        slate: {
            border: 'hover:border-slate-700/80',
            line: 'bg-slate-600/50 group-hover:bg-slate-600',
            text: 'text-slate-400',
            icon: 'text-slate-400',
            glow: 'rgba(148,163,184,0.30)'
        },
        darkgreen: {
            border: 'hover:border-green-700/80',
            line: 'bg-green-600/50 group-hover:bg-green-600',
            text: 'text-green-400',
            icon: 'text-green-400',
            glow: 'rgba(148,163,184,0.30)'
        },
    };

    try {
        const response = await fetch("/api/data/definitions");
        if (!response.ok) {
            throw new Error(`API antwortete mit Status ${response.status}`);
        }
        const data = await response.json();

        // Clear loading state
        container.innerHTML = "";

        if (Array.isArray(data) && data.length > 0) {
            data.forEach((definition) => {
                const colorKey = definition.color || "red";
                const colorConfig = colorMap[colorKey] || colorMap.red;
                const icon = definition.icon || "";

                const card = document.createElement("div");
                card.className = `p-6 bg-slate-900/30 backdrop-blur-sm rounded-xl border border-slate-800/80 shadow-xl flex flex-col gap-4 relative overflow-hidden group ${colorConfig.border} transition-all duration-300`;
                
                // If this definition is marked important, make it span the full row and add a colored glow
                if (definition.important) {
                    card.classList.add('col-span-full', 'z-10');
                    const glowColor = colorConfig.glow || 'rgba(255,0,0,0.45)';
                    const glowShadow = `shadow-[0_0_12px_${glowColor},0_0_28px_${glowColor}]`;
                    card.classList.add(glowShadow);
                }
                // Add top color line
                const borderLine = document.createElement("div");
                borderLine.className = `absolute top-0 left-0 right-0 h-0.75 ${colorConfig.line} transition-colors duration-300`;
                card.appendChild(borderLine);

                const header = document.createElement("div");
                header.className = "flex items-center gap-3 border-b border-slate-800/80 pb-3";

                // Icon handling
                if (icon) {
                    if (icon.trim().startsWith("<svg")) {
                        const iconContainer = document.createElement("div");
                        iconContainer.className = `w-6 h-6 ${colorConfig.icon}`;
                        iconContainer.innerHTML = icon;
                        header.appendChild(iconContainer);
                    } else if (icon.trim().endsWith('.svg')) {
                        const iconContainer = document.createElement("img");
                        iconContainer.src = icon;
                        iconContainer.alt = definition.title;
                        iconContainer.className = `w-6 h-6 object-contain transition-all duration-300 invert`;
                        header.appendChild(iconContainer);
                    } else {
                        const img = document.createElement("img");
                        img.src = icon;
                        img.alt = definition.title;
                        img.className = "w-6 h-6 object-contain transition-all duration-300";
                        header.appendChild(img);
                    }
                }

                const title = document.createElement("h3");
                title.className = `text-lg font-black ${colorConfig.text} tracking-widest uppercase`;
                title.textContent = definition.title;
                header.appendChild(title);
                card.appendChild(header);

                const desc = document.createElement("p");
                desc.className = "text-slate-300 text-sm leading-relaxed tracking-wide text-justify font-mono";
                if (definition.desc) {
                    definition.desc.split('\n').forEach((line, index, lines) => {
                        desc.appendChild(document.createTextNode(line));
                        if (index < lines.length - 1) {
                            desc.appendChild(document.createElement('br'));
                        }
                    });
                }
                card.appendChild(desc);

                container.appendChild(card);
            });
        } else {
            container.innerHTML = '<div class="text-slate-500 text-center py-8 tracking-wider uppercase text-xs col-span-full">Keine passenden Definitionen in der Datenbank vorhanden.</div>';
        }
    } catch (err) {
        console.error("Fehler beim Laden der Definitionen:", err);
        container.innerHTML = '<div class="text-red-500 font-semibold text-center py-8 tracking-wide uppercase col-span-full">CRITICAL ERROR: DATA INACCESSIBLE</div>';
    }
});