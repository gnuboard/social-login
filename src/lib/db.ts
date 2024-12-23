import mysql from 'mysql2/promise';

const registerService = (name: string, initFn: () => any) => {
  if (process.env.NODE_ENV === "development") {
    if (!(name in global)) {
      (global as any)[name] = initFn();
    }
    return (global as any)[name];
  }
  return initFn();
};

let db;

try {
  db = registerService("db", () => 
    mysql.createPool({
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT),
      database: process.env.MYSQL_DATABASE,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    })
  );
} catch (err) {
  console.error('데이터베이스 연결 에러:', err);
}

export default db;