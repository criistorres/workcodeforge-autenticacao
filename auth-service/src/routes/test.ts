import { Router } from 'express';

console.log('🔧 Carregando rotas de teste...');

const router = Router();

// Rota de teste simples
router.get('/test', (_req, res) => {
  console.log('Teste GET recebido');
  res.json({ success: true, message: 'Endpoint de teste funcionando' });
});

router.post('/test', (req, res) => {
  console.log('Teste POST recebido', { body: req.body });
  res.json({ success: true, message: 'Endpoint POST funcionando', body: req.body });
});

console.log('✅ Rotas de teste carregadas');

export default router;
