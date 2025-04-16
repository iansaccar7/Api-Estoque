const express = require('express');
const { queryPromise } = require('../mysql.js');

const router = express.Router();

// GET: listar tampas
router.get('/', async (req, res) => {
    try {
        const rows = await queryPromise('SELECT * FROM tampas ORDER BY tipo ASC');
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar tampas:', error);
        res.status(500).json({ error: 'Erro ao buscar tampas' });
    }
});

// POST: registrar entrada ou saída
router.post('/movimento', async (req, res) => {
    const { tipo, cor, peso, quantidade, operacao } = req.body;
    const quantidadeFinal = operacao === 'entrada' ? quantidade : -quantidade;

    console.log("DADOS RECEBIDOS:", req.body);

    if (!tipo || !cor || !peso || !quantidade || !operacao) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    try {
        const [existing] = await queryPromise(
            'SELECT * FROM tampas WHERE tipo = ? AND cor = ?',
            [tipo, cor]
        );

        if (existing) {
            const novaQuantidade = existing.quantidade + quantidadeFinal;
            if (novaQuantidade < 0) {
                return res.status(400).json({ error: 'Quantidade insuficiente em estoque' });
            }

            await queryPromise(
                'UPDATE tampas SET quantidade = ? WHERE id = ?',
                [novaQuantidade, existing.id]
            );
        } else if (operacao === 'entrada') {
            await queryPromise(
                'INSERT INTO tampas (tipo, cor, peso, quantidade) VALUES (?, ?, ?, ?)',
                [tipo, cor, peso, quantidade]
            );
        } else {
            return res.status(400).json({ error: 'Tampa não encontrada para saída' });
        }

        // ⛔ Esse é o mais provável que está causando o 500
        try {
            await queryPromise(
                'INSERT INTO movimentos (tipo, cor, peso, quantidade, operacao) VALUES (?, ?, ?, ?, ?)',
                [tipo, cor, peso, quantidade, operacao]
            );
        } catch (movError) {
            console.error('Erro ao salvar no histórico:', movError);
            return res.status(500).json({ error: 'Erro ao salvar no histórico', details: movError.message });
        }

        res.json({ message: 'Movimento registrado com sucesso' });
    } catch (error) {
        console.error('Erro geral:', error);
        res.status(500).json({ error: 'Erro ao registrar movimento', details: error.message });
    }
});


// GET: listar movimentos com filtros
router.get('/movimentos', async (req, res) => {
    const { dataInicio, dataFim, tipo, operacao } = req.query;
    let sql = `SELECT * FROM movimentos WHERE 1=1`;
    const params = [];

    if (dataInicio) {
        sql += ` AND DATE(created_at) >= ?`;
        params.push(dataInicio);
    }
    if (dataFim) {
        sql += ` AND DATE(created_at) <= ?`;
        params.push(dataFim);
    }
    if (tipo) {
        sql += ` AND tipo = ?`;
        params.push(tipo);
    }
    if (operacao) {
        sql += ` AND operacao = ?`;
        params.push(operacao);
    }

    sql += ` ORDER BY created_at DESC`;

    try {
        const rows = await queryPromise(sql, params);
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar movimentos:', error);
        res.status(500).json({ error: 'Erro ao buscar movimentos' });
    }
});

module.exports = router;
