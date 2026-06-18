// database.js --> better-sqlite3

const Database = require('better-sqlite3');
const { content } = require('googleapis/build/src/apis/content');
const path = require('path');

const db = new Database(path.join(__dirname, 'scp_database.db'));

class askDatabaseClass {
    constructor() {
        this.db = db;
    }

    scpList() {
        const stmt = this.db.prepare('SELECT * FROM scp_entries');
        return stmt.all();
    }

    scp(id) {
        const stmt = this.db.prepare('SELECT * FROM scp_entries WHERE id = ?');
        return stmt.get(id);
    }

    rolesList() {
        const stmt = this.db.prepare('SELECT * FROM roles_entries');
        return stmt.all();
    }

    role(roleclass) {
        const stmt = this.db.prepare('SELECT * FROM roles_entries WHERE class = ?');
        return stmt.all(roleclass.toUpperCase());
    }

    levelsList() {
        const stmt = this.db.prepare('SELECT * FROM sqlite_master WHERE type = \'table\' AND name LIKE \'levels_%\'');
        let out = [];
        for (const row of stmt.all()) {
            const stmt2 = this.db.prepare(`SELECT * FROM ${row.name}`);
            const content = stmt2.all();
            out = out.concat({ tableName: row.name, llist: content });
        }
        return out;
    }

    level(classname) {
        const stmt = this.db.prepare('SELECT name FROM sqlite_master WHERE type = \'table\' AND name LIKE ? ESCAPE \'\\\'');
        const tableName = stmt.all(`levels\_${classname}%`);
        if (!tableName) return null;

        let out = [];
        console.log(tableName);
        for (const row of tableName) {
            const stmt2 = this.db.prepare(`SELECT * FROM ${row.name}`);
            const content = stmt2.all();
            out = out.concat({ tableName: row.name, llist: content });
        }
        return out;
    }
}

module.exports = { askDatabaseClass };

function displayHelp() {
    console.log("Available commands:");
    console.log("  node database.js scp             - Prints the list of all SCPs");
    console.log("  node database.js scp-single <id> - Prints the details of a single SCP");
    console.log("  node database.js roles           - Prints the list of all roles");
    console.log("  node database.js role <class>    - Prints the details of a single role");
    console.log("  node database.js levels          - Prints all levels data");
    console.log("  node database.js level <class>   - Prints data for a specific level class");
}

if (require.main === module) {
    const flags = process.argv.slice(2);
    switch (flags[0]) {
        case 'scp':
            const askDatabase = new askDatabaseClass();
            console.log(askDatabase.scpList());
            break;
        case 'scp-single':
            const askDatabaseSingle = new askDatabaseClass();
            console.log(askDatabaseSingle.scp(flags[1]));
            break;
        case 'roles':
            const askDatabaseRoles = new askDatabaseClass();
            console.log(askDatabaseRoles.rolesList());
            break;
        case 'role':
            const askDatabaseRole = new askDatabaseClass();
            console.log(askDatabaseRole.role(flags[1]));
            break;
        case 'levels':
            const askDatabaseLevels = new askDatabaseClass();
            for (const row of askDatabaseLevels.levelsList()) {
                console.log(row);
            }
            break;
        case 'level':
            const askDatabaseLevel = new askDatabaseClass();
            console.log(askDatabaseLevel.level(flags[1]));
            break;
        case 'help':
            displayHelp();
            break;
        default:
            displayHelp();
            break;
    }
}