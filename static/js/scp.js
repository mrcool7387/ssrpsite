document.addEventListener("DOMContentLoaded", () => {
    // Mapping-Tabellen für die Namensumsetzung
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

    // 1. SCP-Nummer aus der URL extrahieren
    let scpNumber = window.location.pathname.split("/").pop();

    if (!scpNumber || scpNumber === "scp_detail.html" || scpNumber === "scps") {
        const urlParams = new URLSearchParams(window.location.search);
        scpNumber = urlParams.get("id") || urlParams.get("number");
    }

    if (!scpNumber) {
        showError("Es wurde keine SCP-Identifikationsnummer übergeben.");
        return;
    }

    scpNumber = scpNumber.trim();

    // Dom-Elemente referenzieren
    const statusContainerEl = document.getElementById("status-container");
    const loadingEl = document.getElementById("loading");
    const contentEl = document.getElementById("content");
    const errorContainerEl = document.getElementById("error-container");
    const errorMessageEl = document.getElementById("error-message");

    // 2. API-Abruf starten
    fetch(`/api/scp/${scpNumber}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Datenbank-Fehler: Server antwortete mit Status ${response.status}`);
            }
            return response.json();
        })
        .then(async (data) => {
            if (!data || data.error || !data.number) {
                throw new Error(`Das Objekt SCP-${scpNumber} existiert nicht in der SSRP-Datenbank.`);
            }
            await renderSCPDetails(data);
        })
        .catch(error => {
            let line = error.lineNumber || "unbekannt";
            let file = error.fileName || "unbekannt";

            // Falls die Standardeigenschaften fehlen (z.B. in Chrome/V8), parsen wir den Stacktrace
            if ((line === "unbekannt" || file === "unbekannt") && error.stack) {
                // Findet die erste Zeile im Stacktrace, die eine Datei und Zeile enthält
                const stackLines = error.stack.split("\n");
                const callerLine = stackLines.find(l => l.includes("at ") || l.includes("@"));

                if (callerLine) {
                    // Regex matcht URLs/Dateipfade und die darauf folgenden Zahlen (Zeile:Spalte)
                    const match = callerLine.match(/(https?:\/\/.*?|file:\/\/.*?):(\d+):(\d+)/);
                    if (match) {
                        file = match[1];
                        line = match[2];
                    }
                }
            }

            const msg = `${error.message} || Line ${line} in ${file}`;
            showError(msg);
        });

    // Hilfsfunktion zur Ermittlung der CSS-Klasse basierend auf der SCP-Klassifizierung
    function getClassColorClass(classKey) {
        const k = classKey ? classKey.toLowerCase() : "";
        if (k === "e" || k === "k" || k === "a+") {
            return "text-red-500 font-black uppercase tracking-wide text-sm";
        } else if (k === "s") {
            return "text-green-500 font-black uppercase tracking-wide text-sm";
        }
        return "text-slate-200 font-bold uppercase tracking-wide text-sm";
    }

    // Funktion zum Rendern der API-Daten
    async function renderSCPDetails(scp) {
        // Titel und Beschreibung
        document.getElementById("scp-title").textContent = `SCP-${scp.number}`;
        document.title = `SCP-${scp.number} - Foundation Dossier`;

        // Markdown in HTML umwandeln und auslesen
        const mdResponse = await fetch(`/api/markdownToHtml?markdown=${encodeURIComponent(scp.description || "Keine Beschreibung verfügbar.")}`);
        if (!mdResponse.ok) {
            throw new Error("Fehler beim Laden der Beschreibung.");
        }
        const htmlMd = await mdResponse.text();

        // .innerHTML nutzen, damit HTML-Tags aus der Konvertierung korrekt gerendert werden
        document.getElementById("scp-description").innerHTML = htmlMd;
        
        // Klassen-Klassifizierung verarbeiten
        const classEl = document.getElementById("scp-class");
        classEl.innerHTML = "";

        if (scp.info && scp.info.class) {
            const classdict = scp.info.class;

            console.log("Klassifizierungsdaten:", classdict);

            const p = classdict.primary ? classdict.primary.toLowerCase() : "";
            const s = classdict.secondary ? classdict.secondary.toLowerCase() : "";
            const t = classdict.tertiary ? classdict.tertiary.toLowerCase() : "";

            let finalClass = "UNBEKANNT";

            if (p && p !== "-/-" && p !== "siehe sekundäre klasse") {
                finalClass = p.toUpperCase();
            } else if (s && s !== "-/-" && s !== "siehe tertiäre klasse" && s !== "siehe tertiär klasse") {
                finalClass = s.toUpperCase();
            } else if (t && t !== "-/-") {
                finalClass = t.toUpperCase();
            }

            classEl.textContent = finalClass;

            // Farbklasse dynamisch zuweisen
            classEl.className = getClassColorClass(finalClass);

        } else {
            classEl.textContent = "UNBEKANNT";
            classEl.className = getClassColorClass("UNBEKANNT");
        }

        // Hazards / Gefahrensymbole (Raw ausgegeben)
        const hazardsContainer = document.getElementById("hazards-container");
        hazardsContainer.innerHTML = "";
        if (scp.info && Array.isArray(scp.info.hazards) && scp.info.hazards.length > 0) {
            scp.info.hazards.forEach(hazard => {
                const badge = document.createElement("span");
                badge.className = "px-2 py-0.5 bg-red-950/60 border border-red-800/60 text-red-400 font-bold rounded uppercase tracking-wider text-[9px]";
                badge.textContent = hazard;
                hazardsContainer.appendChild(badge);
            });
        } else {
            hazardsContainer.innerHTML = `<span class="text-slate-500 italic text-[11px]">Keine</span>`;
        }

        // SSRP Info Block mit Namensauflösung
        if (scp.info && scp.info.ssrp) {
            const rawLoc = scp.info.ssrp.location;
            const mappedLoc = containmentMap[rawLoc ? rawLoc.toLowerCase() : ""] || rawLoc || "N/A";

            if (scp.info.ssrp.present) {
                document.getElementById("ssrp-block").classList.add("glow-green");
            } else {
                document.getElementById("ssrp-block").classList.add("glow-red");
            }

            document.getElementById("ssrp-location").textContent = mappedLoc;
            document.getElementById("ssrp-level").textContent = scp.info.ssrp.minlevel !== undefined ? `Level ${scp.info.ssrp.minlevel}` : "N/A";
            document.getElementById("ssrp-block").classList.remove("opacity-40");
        } else {
            document.getElementById("ssrp-block").classList.add("opacity-40");
            document.getElementById("ssrp-location").textContent = "NICHT VORHANDEN";
            document.getElementById("ssrp-level").textContent = "-";
        }

        // SCPR Info Block mit Namensauflösung
        if (scp.info && scp.info.scpr) {
            const rawLoc = scp.info.scpr.location;
            const mappedLoc = containmentMap[rawLoc ? rawLoc.toLowerCase() : ""] || rawLoc || "N/A";

            if (scp.info.scpr.present) {
                document.getElementById("scpr-block").classList.add("glow-green");
            } else {
                document.getElementById("scpr-block").classList.add("glow-red");
            }

            document.getElementById("scpr-location").textContent = mappedLoc;
            document.getElementById("scpr-level").textContent = scp.info.scpr.minlevel !== undefined ? `Level ${scp.info.scpr.minlevel}` : "N/A";
            document.getElementById("scpr-block").classList.remove("opacity-40");
        } else {
            document.getElementById("scpr-block").classList.add("opacity-40");
            document.getElementById("scpr-location").textContent = "NICHT VORHANDEN";
            document.getElementById("scpr-level").textContent = "-";
        }

        // Wiki Link setzen
        const wikiLinkEl = document.getElementById("scp-wiki-link");
        if (scp.info && scp.info.link) {
            wikiLinkEl.href = scp.info.link;
            wikiLinkEl.parentElement.classList.remove("hidden");
        } else {
            wikiLinkEl.parentElement.classList.add("hidden");
        }

        // UI umschalten: Status-Meldungen komplett ausblenden, Content einblenden
        statusContainerEl.classList.add("hidden");
        contentEl.classList.remove("hidden");
    }

    // Funktion zur Fehleranzeige
    function showError(message) {
        contentEl.classList.add("hidden");
        loadingEl.classList.add("hidden");

        errorMessageEl.textContent = message;

        statusContainerEl.classList.remove("hidden");
        errorContainerEl.classList.remove("hidden");
    }
});