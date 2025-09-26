"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
console.log('🔧 Carregando rotas de teste...');
const router = (0, express_1.Router)();
router.get('/test', (_req, res) => {
    console.log('Teste GET recebido');
    res.json({ success: true, message: 'Endpoint de teste funcionando' });
});
router.post('/test', (req, res) => {
    console.log('Teste POST recebido', { body: req.body });
    res.json({ success: true, message: 'Endpoint POST funcionando', body: req.body });
});
console.log('✅ Rotas de teste carregadas');
exports.default = router;
//# sourceMappingURL=test.js.map