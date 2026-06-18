const express = require('express');
const fs = require('fs');
const path = require('path');
const { askDatabaseClass } = require('./database'); // Importiere die neue Datenbankfunktion

if (!process.env.ENV_EXISTS) {
    console.error(".env-Datei nicht gefunden. Stelle sicher, dass sie existiert und die notwendigen Variablen enthält.");
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;
const askDatabase = new askDatabaseClass();

function getInjectsPath(injectName) {
    const injectsDir = path.join(__dirname, 'public', 'injects');
    const injectPath = path.join(injectsDir, `${injectName}.part.html`);

    if (fs.existsSync(injectPath)) {
        return injectPath;
    } else {
        console.log(`Warnung: Inject-Datei '${injectPath}' nicht gefunden.`);
        return null;
    }
}

// 1. STATISCHE DATEIEN (Zuerst prüfen, ob es eine Datei im Dateisystem gibt)
app.use(express.static('public'));
app.use('/static', express.static('static'));
app.use('/assets', express.static('assets'));

// 2. ERROR LINKS (Die /notfound Route muss vor der Catch-All Middleware definiert sein)
app.get('/notfound', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'codes', '404.html'));
});

// 3. API-ENDPUNKTE & ROUTEN
app.get('/api/data/scplist', async (req, res) => {
    const data = askDatabase.scpList();
    res.json(data);
});

app.get('/api/data/roleslist', async (req, res) => {
    const data = askDatabase.rolesList();
    res.json(data);
});

app.get('/api/data/role/:class', async (req, res) => {
    const roleClass = req.params.class;
    const data = askDatabase.role(roleClass);
    res.json(data);
});

app.get('/api/data/levels', (req, res) => {
    const data = askDatabase.levelsList();
    res.json(data);
});

app.get('/api/data/level/:classname', (req, res) => {
    const classname = req.params.classname.toLowerCase();
    const data = askDatabase.level(classname);
    console.log(`data: ${JSON.stringify(data)}`);
    if (!data) {
        res.status(404).send('Level configuration not found');
        return;
    }
    const transformedList = {};

    let rdata = [];
    for (const entry of data) {
        for (const item of entry.llist) {
            const { level, ...rest } = item;
            transformedList[level] = rest;
        }

        rdata.push({
            tableName: entry.tableName,
            list: transformedList
        });
    }
    res.json(rdata);
});

app.get('/api/scp/:number', (req, res) => {
    const scpNumber = req.params.number;
    const dbData = askDatabase.scp(scpNumber);

    if (!dbData) {
        res.status(404).send('SCP not found');
        return;
    }

    const scpFolderPath = path.join(__dirname, 'scp-data', scpNumber);
    const descPath = path.join(scpFolderPath, 'desc.md');
    const infoPath = path.join(scpFolderPath, 'infos.json');

    let desc = null;
    if (fs.existsSync(descPath)) {
        desc = fs.readFileSync(descPath, 'utf8');
    }

    let infoData = {
        name: dbData.name,
        class: {
            primary: dbData.primere_klasse,
            secondary: dbData.sekundere_klasse,
            tertiary: dbData.tertiere_klasse
        },
        ssrp: {
            location: dbData.ssrp_standort,
            present: dbData.in_ssrp === 1
        },
        scpr: {
            location: dbData.scpr_standort,
            present: dbData.in_scpr === 1
        },
        link: dbData.link
    };

    if (fs.existsSync(infoPath)) {
        try {
            const fileInfo = JSON.parse(fs.readFileSync(infoPath, 'utf8'));

            if (fileInfo.ssrp) infoData.ssrp = { ...infoData.ssrp, ...fileInfo.ssrp };
            if (fileInfo.scpr) infoData.scpr = { ...infoData.scpr, ...fileInfo.scpr };
            if (fileInfo.hazards) infoData.hazards = fileInfo.hazards;
            if (fileInfo.class) infoData.class = { ...infoData.class, ...fileInfo.class };
        } catch (e) {
            console.error(`Fehler beim Parsen von infos.json für SCP-${scpNumber}:`, e);
        }
    }

    res.json({
        number: scpNumber,
        description: desc,
        info: infoData
    });
});

app.get('/api/injects/loader', (req, res) => {
    const loaderPath = getInjectsPath('loader');
    console.info(`Loader Path: ${loaderPath}`);
    if (loaderPath) {
        res.sendFile(loaderPath);
    } else {
        res.status(404).send('Loader not found');
    }
});

app.get('/api/markdownToHtml', (req, res) => {
    const markdown = req.query.markdown;
    const html = marked.parse(markdown);
    console.log(html)
    res.send(html);
});

app.get('/scp/:number', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'scp.html'));
});

app.get('/scps', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'scps_list.html'));
});

app.get('/roles', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'roles_list.html'));
});

app.get('/roles/calc', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'roles_calc.html'));
});

app.get('/definitions', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'defenitions.html'));
});

app.get('/api/data/definitions', (req, res) => {
    const dataPath = path.join(__dirname, 'scp-data', 'defenitions.json');
    if (fs.existsSync(dataPath)) {
        res.json(JSON.parse(fs.readFileSync(dataPath, 'utf8')));
    } else {
        res.status(404).send('Definitions not found');
    }
});

// 4. CATCH-ALL INTERCEPTOR (Ganz am Ende! Wenn kein Endpunkt oben matched, greift dieser hier)
app.use('/disabled', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'codes', '503.html'))
});

app.use('/denied', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'codes', '403.html'))
})

app.use((req, res, next) => {
    res.status(404).redirect('/notfound');
});


app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});