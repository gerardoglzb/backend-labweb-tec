const sqlite3 = require("sqlite3").verbose()
let sql;

const db = new sqlite3.Database("./sqlite3.db", sqlite3.OPEN_READWRITE, (err) => {
	if (err) return console.error(err.message);
})

// sql = `CREATE TABLE users(id INTEGER PRIMARY KEY, name, email, password, type)`;
// sql = `DROP TABLE users`;
// db.run(sql);

sql = `INSERT INTO users(name, email, password, type) VALUES (?,?,?,?)`;
db.run(
	sql,
	[],
	(err) => {
		if (err) return console.error(err.message);
	}
)
