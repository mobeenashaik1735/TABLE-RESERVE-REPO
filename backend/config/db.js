const { Pool } = require('pg');
const { DatabaseSync } = require('node:sqlite');
require('dotenv').config();

let useMock = false;
let realPool = null;
let sqliteDb = null;

// Initialize SQLite Database Sync using a persistent file
try {
  const path = require('path');
  const dbPath = path.resolve(__dirname, '../tablereserve.sqlite');
  sqliteDb = new DatabaseSync(dbPath);
  console.log(`[DB] Persistent SQLite initialized successfully at: ${dbPath}`);
} catch (e) {
  console.error('[DB] Failed to initialize node:sqlite', e);
}

// Function to translate PostgreSQL SQL to SQLite SQL
function translateSQL(sql) {
  let translated = sql;
  
  // 1. Remove CASCADE from DROP TABLE
  translated = translated.replace(/\bDROP\s+TABLE\s+IF\s+EXISTS\s+(\w+)\s+CASCADE/gi, 'DROP TABLE IF EXISTS $1');
  translated = translated.replace(/\bDROP\s+TABLE\s+(\w+)\s+CASCADE/gi, 'DROP TABLE $1');
  
  // 2. Replace SERIAL with INTEGER PRIMARY KEY AUTOINCREMENT
  translated = translated.replace(/\bSERIAL PRIMARY KEY\b/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT');
  
  // 3. Replace NOW() with CURRENT_TIMESTAMP
  translated = translated.replace(/\bNOW\(\)/gi, "CURRENT_TIMESTAMP");
  
  // 4. Replace $1, $2, etc with ?
  translated = translated.replace(/\$\d+/g, '?');

  return translated;
}

// Smart split for ALTER TABLE ADD COLUMN
function splitAlterTable(sqlStr) {
  const match = sqlStr.match(/ALTER\s+TABLE\s+(\w+)\s+([\s\S]+)/i);
  if (!match) return [sqlStr];
  const tableName = match[1];
  const rest = match[2];
  const parts = [];
  let current = '';
  let depth = 0;
  for (let i = 0; i < rest.length; i++) {
    const char = rest[i];
    if (char === '(') depth++;
    else if (char === ')') depth--;
    if (char === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) parts.push(current.trim());
  
  // Filter for ADD COLUMN statements
  const isAddColumn = parts.some(p => p.toUpperCase().startsWith('ADD COLUMN') || p.toUpperCase().startsWith('ADD '));
  if (isAddColumn) {
    return parts.map(part => {
      let cleanPart = part.replace(/ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS/i, 'ADD COLUMN')
                          .replace(/ADD\s+IF\s+NOT\s+EXISTS/i, 'ADD COLUMN')
                          .replace(/ADD\s+COLUMN/i, 'ADD COLUMN');
      return `ALTER TABLE ${tableName} ${cleanPart}`;
    });
  }
  return [sqlStr];
}

if (process.env.DATABASE_URL) {
  const isLocalhost = process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1');
  if (isLocalhost) {
    console.log('[DB] DATABASE_URL points to localhost, which is unreachable in Cloud Run. Using in-memory SQLite.');
    useMock = true;
  } else {
    try {
      realPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 3000 // fail fast if remote DB is unreachable (3 seconds)
      });
      console.log('[DB] Attempting connection to real PostgreSQL database...');
    } catch (err) {
      console.warn('[DB] Real DB connection failed to initialize, falling back to SQLite.', err.message);
      useMock = true;
    }
  }
} else {
  console.log('[DB] No DATABASE_URL found. Running with in-memory SQLite.');
  useMock = true;
}

// Mock Pool wrapper
class MockPool {
  get isSQLite() {
    return useMock;
  }

  async query(sql, params = []) {
    if (!useMock && realPool) {
      try {
        return await realPool.query(sql, params);
      } catch (err) {
        console.error('[DB] Real DB query failed, switching to SQLite backup.', err.message);
        useMock = true;
      }
    }

    // SQLite backup / default execution
    const cleanSql = sql.trim();
    
    // Check if it's a multi-column ALTER TABLE ADD COLUMN
    if (cleanSql.toLowerCase().includes('alter table') && cleanSql.toLowerCase().includes('add column')) {
      const statements = splitAlterTable(cleanSql);
      let lastRes = { rows: [], rowCount: 0 };
      for (const stmtText of statements) {
        const translatedStmt = translateSQL(stmtText);
        try {
          sqliteDb.exec(translatedStmt);
        } catch (err) {
          // If column already exists, ignore
          if (!err.message.includes('duplicate column name') && !err.message.includes('already exists')) {
            console.error('[DB SQLite Error in Alter]', err.message, 'SQL:', translatedStmt);
          }
        }
      }
      return lastRes;
    }

    const translated = translateSQL(cleanSql);
    const normalizedParams = params.map(p => typeof p === 'boolean' ? (p ? 1 : 0) : p);
    
    try {
      // Determine if write/DDL query or read/write with returning
      const lowerSql = translated.toLowerCase();
      
      // If it's a DDL statement or multi-statement, use exec
      if (lowerSql.startsWith('create table') || lowerSql.startsWith('drop table') || lowerSql.startsWith('alter table')) {
        sqliteDb.exec(translated);
        return { rows: [], rowCount: 0 };
      }

      const stmt = sqliteDb.prepare(translated);
      
      // Handle RETURNING clause or SELECT query
      if (lowerSql.startsWith('select') || lowerSql.includes('returning')) {
        const results = stmt.all(...normalizedParams);
        // Normalize COUNT(*) keys
        const processedResults = results.map(row => {
          const newRow = { ...row };
          for (const key of Object.keys(row)) {
            if (key.toLowerCase().startsWith('count(')) {
              newRow.count = row[key];
            }
          }
          return newRow;
        });
        return { rows: processedResults, rowCount: processedResults.length };
      } else {
        const result = stmt.run(...normalizedParams);
        return { rows: [], rowCount: result.changes };
      }
    } catch (err) {
      console.error('[DB SQLite Error]', err.message, 'Original SQL:', sql, 'Translated:', translated);
      throw err;
    }
  }

  async connect() {
    if (!useMock && realPool) {
      try {
        const client = await realPool.connect();
        return client;
      } catch (err) {
        console.error('[DB] Real DB connection failed, using SQLite fallback.', err.message);
        useMock = true;
      }
    }
    
    // Return a mocked client
    return {
      query: (sql, params = []) => this.query(sql, params),
      release: () => {}
    };
  }

  async end() {
    if (realPool) {
      await realPool.end();
    }
  }
}

module.exports = new MockPool();