const mysql = require('mysql2');
const dotenv = require('dotenv');
require('dotenv').config();

// Criando a pool de conexões (para múltiplas requisições)
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
});

// Conexão única (para testes ou conexões específicas)
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

// Conectando ao MySQL com o `connection` (usado para operações específicas)
connection.connect((err) => {
    if (err) {
        console.error('Erro de conexão: ' + err.stack);
        return;
    }
    console.log('Conectado ao banco de dados como ' + process.env.DB_USER);
});

// Função auxiliar para transformar callbacks em Promises (usando a pool)
function queryPromise(query, values) {
    return new Promise((resolve, reject) => {
        pool.query(query, values, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

// Exportando a conexão única e a função de consulta
module.exports = { connection, queryPromise };
