import sqlite from 'sqlite3';

// open the database
const db = new sqlite.Database('dao/lotto.sqlite', (err) => {
  if (err) throw err;
});

export default db;