function parseWikidot(text) {
    if (!text) return '';

    let html = text;

    // 1. Alle [[include ...]] entfernen
    html = html.replace(/\[\[include[\s\S]*?\]\]/g, '');

    // 2. Listensymbole (* oder **) zu - umwandeln
    html = html.replace(/^(\*+)(\s+)/gm, (match, stars, spaces) => {
        return '-'.repeat(stars.length) + spaces;
    });

    // 3. Wikidot-spezifische Layout-Tags und Module entfernen
    html = html.replace(/\[\[\/?(?:>|<|=|div|collapsible|module|footnoteblock)[^\]]*\]\]/g, '');

    // 4. Trennlinien und Platzhalter (===== oder @@@@) durch <hr> ersetzen
    html = html.replace(/^(?:={3,}|@{3,})$/gm, '<hr>');

    // 5. Zitate (> Text) in Blockquotes umwandeln (zeilenweise)
    html = html.replace(/^>\s*(.+)$/gm, '<blockquote>$1</blockquote>');

    // HTML-Escaping (wichtig für die Sicherheit)
    html = html
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Da wir oben HTML-Tags generiert haben (<hr> und <blockquote>), müssen wir deren Escaping rückgängig machen
    html = html
        .replace(/&lt;hr&gt;/g, '<hr>')
        .replace(/&lt;blockquote&gt;([\s\S]*?)&lt;\/blockquote&gt;/g, '<blockquote>$1</blockquote>');

    // Code-Blöcke
    html = html.replace(/\[\[code(?: type="(\w+)")?\]\]([\s\S]*?)\[\[\/code\]\]/g, (match, lang, code) => {
        const langClass = lang ? ` class="language-${lang}"` : '';
        return `<pre><code${langClass}>${code.trim()}</code></pre>`;
    });

    // Überschriften
    html = html.replace(/^\+ (.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/^\+\+ (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^\+\+\+ (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^\+\+\+\+ (.+)$/gm, '<h4>$1</h4>');

    // Fett und Kursiv
    html = html.replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\/\/([\s\S]*?)\/\//g, '<em>$1</em>');

    // Externe Links mit 3 Klammern abfangen (Fix für den Wikimedia-Link im Beispiel)
    html = html.replace(/\[\[\[(https?:\/\/[^\s|]+)\|([^\]]+)\]\]\]/g, '<a href="$1" target="_blank">$2</a>');
    html = html.replace(/\[\[\[(https?:\/\/[^\s]+)\]\]\]/g, '<a href="$1" target="_blank">$1</a>');

    // Interne Links
    html = html.replace(/\[\[\[([^\]|]+)\|([^\]]+)\]\]\]/g, '<a href="/wiki/$1">$2</a>');
    html = html.replace(/\[\[\[([^\]]+)\]\]\]/g, '<a href="/wiki/$1">$1</a>');

    // Standard Externe Links
    html = html.replace(/\[(https?:\/\/[^\s]+)\s+([^\]]+)\]/g, '<a href="$1" target="_blank">$2</a>');

    // Spezifische Wikidot-User-Verlinkungen aufräumen
    html = html.replace(/\[\[\*user\s+([^\]]+)\]\]/g, '$1');

    // Tabellen
    html = html.replace(/^\|\|([\s\S]*?)\|\|$/gm, (match, content) => {
        const cells = content.split('||');
        const tdElements = cells.map(cell => `<td>${cell.trim()}</td>`).join('');
        return `<tr>${tdElements}</tr>`;
    });
    html = html.replace(/((?:<tr>[\s\S]*?<\/tr>\s*)+)/g, '<table>\n$1</table>');

    // Absätze und Zeilenumbrüche generieren
    html = html.split(/\n\n+/).map(p => {
        const trimmed = p.trim();
        if (
            trimmed.startsWith('<h') || 
            trimmed.startsWith('<table') || 
            trimmed.startsWith('<pre') || 
            trimmed.startsWith('<hr') || 
            trimmed.startsWith('<blockquote')
        ) {
            return p;
        }
        return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');

    // Doppelte leere Absätze kosmetisch korrigieren
    html = html.replace(/<p>\s*(?:<br>\s*)*<\/p>/g, '');

    return html;
}

module.exports = { parseWikidot };