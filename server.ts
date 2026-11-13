import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { getDb, hashPassword, sanitizeUser, saveDb, verifyPassword } from './server/db.ts';
import type { DeliveryMethod, OrderStatus, PaymentMethod, StockMovementType, UserRole } from './src/types.ts';

interface AuthTokenPayload {
  userId: number;
  email: string;
  role: UserRole;
  exp: number;
}

interface AuthedRequest extends Request {
  authUser?: {
    id: number;
    email: string;
    role: UserRole;
  };
}

function createToken(payload: AuthTokenPayload, secret: string): string {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyToken(token: string, secret: string): AuthTokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8')) as AuthTokenPayload;
    if (Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

function extractAuth(req: AuthedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const db = getDb();
    const payload = verifyToken(token, db.sessionSecret);
    if (payload) {
      const user = db.users.find((u) => u.id === payload.userId);
      if (user) {
        req.authUser = { id: user.id, email: user.email, role: user.role };
      }
    }
  }
  next();
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (!req.authUser) {
    res.status(401).json({ error: 'Autenticação necessária.' });
    return;
  }
  next();
}

function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (!req.authUser) {
    res.status(401).json({ error: 'Autenticação necessária.' });
    return;
  }
  if (req.authUser.role !== 'admin') {
    res.status(403).json({ error: 'Acesso restrito a administradores.' });
    return;
  }
  next();
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '5mb' }));
  app.use(extractAuth);

  // Health
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // Auth routes
  app.get('/api/auth/me', (req: AuthedRequest, res) => {
    if (!req.authUser) {
      res.json({ user: null });
      return;
    }
    const db = getDb();
    const user = db.users.find((u) => u.id === req.authUser?.id);
    res.json({ user: user ? sanitizeUser(user) : null });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body as { email?: string; password?: string };
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !password) {
      res.status(400).json({ error: 'Informe e-mail e senha.' });
      return;
    }

    const db = getDb();
    const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: 'E-mail ou senha incorretos.' });
      return;
    }

    const token = createToken(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
      },
      db.sessionSecret
    );

    res.json({ token, user: sanitizeUser(user) });
  });

  app.post('/api/auth/register', (req, res) => {
    const { email, password, name, phone, address } = req.body as {
      email?: string;
      password?: string;
      name?: string;
      phone?: string;
      address?: string;
    };

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      res.status(400).json({ error: 'Informe um e-mail válido.' });
      return;
    }
    if (!password || password.length < 6) {
      res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    const db = getDb();
    if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
      return;
    }

    const newUser = {
      id: db.nextIds.user++,
      email: cleanEmail,
      name: (name || cleanEmail.split('@')[0]).trim(),
      role: 'cliente' as UserRole,
      phone: (phone || '').trim(),
      address: (address || '').trim(),
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    saveDb(db);

    const token = createToken(
      {
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
      },
      db.sessionSecret
    );

    res.status(201).json({ token, user: sanitizeUser(newUser) });
  });

  app.post('/api/auth/reset-password', (req, res) => {
    const { email, newPassword } = req.body as { email?: string; newPassword?: string };
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !newPassword || newPassword.length < 6) {
      res.status(400).json({ error: 'Informe um e-mail válido e nova senha com pelo menos 6 caracteres.' });
      return;
    }

    const db = getDb();
    const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      res.status(404).json({ error: 'Nenhuma conta encontrada com este e-mail.' });
      return;
    }

    user.passwordHash = hashPassword(newPassword);
    saveDb(db);
    res.json({ ok: true, message: 'Senha redefinida com sucesso.' });
  });

  // Public products
  app.get('/api/products', (req, res) => {
    const db = getDb();
    const includeInactive = req.query.all === '1';
    const items = includeInactive ? db.products : db.products.filter((p) => p.active);
    res.json({ products: items });
  });

  // Admin: create product
  app.post('/api/products', requireAdmin, (req: AuthedRequest, res) => {
    const { name, category, price, description, imageUrl, nutritionalInfo, stock } = req.body as {
      name?: string;
      category?: string;
      price?: number;
      description?: string;
      imageUrl?: string;
      nutritionalInfo?: string;
      stock?: number;
    };

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Informe o nome do doce.' });
      return;
    }
    const numPrice = Number(price);
    if (Number.isNaN(numPrice) || numPrice <= 0) {
      res.status(400).json({ error: 'Informe um preço válido maior que zero.' });
      return;
    }
    const initialStock = Math.max(0, Math.floor(Number(stock) || 0));

    const db = getDb();
    const product = {
      id: db.nextIds.product++,
      name: name.trim(),
      category: (category || 'Especiais').trim(),
      price: Number(numPrice.toFixed(2)),
      description: (description || 'Doce artesanal feito com ingredientes selecionados.').trim(),
      imageUrl: (imageUrl || 'preset:brigadeiro').trim(),
      nutritionalInfo: (nutritionalInfo || 'Informação nutricional sob consulta.').trim(),
      stock: initialStock,
      active: true,
      createdAt: new Date().toISOString(),
    };

    db.products.unshift(product);

    if (initialStock > 0) {
      db.movements.unshift({
        id: db.nextIds.movement++,
        productId: product.id,
        productName: product.name,
        type: 'entrada',
        quantity: initialStock,
        observation: 'Estoque inicial no cadastro do produto',
        createdBy: req.authUser?.email || 'admin',
        createdAt: new Date().toISOString(),
      });
    }

    saveDb(db);
    res.status(201).json({ product });
  });

  // Admin: update product
  app.put('/api/products/:id', requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    const db = getDb();
    const product = db.products.find((p) => p.id === id);
    if (!product) {
      res.status(404).json({ error: 'Doce não encontrado.' });
      return;
    }

    const { name, category, price, description, imageUrl, nutritionalInfo, active } = req.body as {
      name?: string;
      category?: string;
      price?: number;
      description?: string;
      imageUrl?: string;
      nutritionalInfo?: string;
      active?: boolean;
    };

    if (name !== undefined && name.trim()) product.name = name.trim();
    if (category !== undefined && category.trim()) product.category = category.trim();
    if (price !== undefined) {
      const numPrice = Number(price);
      if (Number.isNaN(numPrice) || numPrice <= 0) {
        res.status(400).json({ error: 'Preço inválido.' });
        return;
      }
      product.price = Number(numPrice.toFixed(2));
    }
    if (description !== undefined) product.description = description.trim();
    if (imageUrl !== undefined && imageUrl.trim()) product.imageUrl = imageUrl.trim();
    if (nutritionalInfo !== undefined) product.nutritionalInfo = nutritionalInfo.trim();
    if (typeof active === 'boolean') product.active = active;

    saveDb(db);
    res.json({ product });
  });

  // Admin: delete product
  app.delete('/api/products/:id', requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    const db = getDb();
    const idx = db.products.findIndex((p) => p.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Doce não encontrado.' });
      return;
    }
    db.products.splice(idx, 1);
    saveDb(db);
    res.json({ ok: true });
  });

  // Admin: Users management
  app.get('/api/users', requireAdmin, (_req, res) => {
    const db = getDb();
    res.json({ users: db.users.map(sanitizeUser) });
  });

  app.post('/api/users', requireAdmin, (req, res) => {
    const { email, password, name, role, phone, address } = req.body as {
      email?: string;
      password?: string;
      name?: string;
      role?: UserRole;
      phone?: string;
      address?: string;
    };

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      res.status(400).json({ error: 'E-mail inválido.' });
      return;
    }
    if (!password || password.length < 6) {
      res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    const db = getDb();
    if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      res.status(409).json({ error: 'E-mail já cadastrado.' });
      return;
    }

    const userRole: UserRole = role === 'admin' ? 'admin' : 'cliente';
    const newUser = {
      id: db.nextIds.user++,
      email: cleanEmail,
      name: (name || cleanEmail.split('@')[0]).trim(),
      role: userRole,
      phone: (phone || '').trim(),
      address: (address || '').trim(),
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    saveDb(db);
    res.status(201).json({ user: sanitizeUser(newUser) });
  });

  app.patch('/api/users/:id', requireAdmin, (req: AuthedRequest, res) => {
    const id = Number(req.params.id);
    const { role } = req.body as { role?: UserRole };
    const db = getDb();
    const user = db.users.find((u) => u.id === id);
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }
    if (req.authUser?.id === id && role && role !== 'admin') {
      res.status(400).json({ error: 'Você não pode remover seu próprio acesso de administrador.' });
      return;
    }
    if (role === 'admin' || role === 'cliente') {
      user.role = role;
    }
    saveDb(db);
    res.json({ user: sanitizeUser(user) });
  });

  app.delete('/api/users/:id', requireAdmin, (req: AuthedRequest, res) => {
    const id = Number(req.params.id);
    if (req.authUser?.id === id) {
      res.status(400).json({ error: 'Você não pode excluir sua própria conta conectada.' });
      return;
    }
    const db = getDb();
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }
    db.users.splice(idx, 1);
    saveDb(db);
    res.json({ ok: true });
  });

  // Admin: Stock movements
  app.get('/api/stock-movements', requireAdmin, (_req, res) => {
    const db = getDb();
    res.json({ movements: db.movements });
  });

  app.post('/api/stock-movements', requireAdmin, (req: AuthedRequest, res) => {
    const { productId, type, quantity, observation } = req.body as {
      productId?: number;
      type?: StockMovementType;
      quantity?: number;
      observation?: string;
    };

    const pid = Number(productId);
    const qty = Math.floor(Number(quantity));
    if (!pid || !qty || qty <= 0) {
      res.status(400).json({ error: 'Selecione um doce e informe uma quantidade válida.' });
      return;
    }
    if (type !== 'entrada' && type !== 'saida') {
      res.status(400).json({ error: 'Tipo de movimentação inválido.' });
      return;
    }

    const db = getDb();
    const product = db.products.find((p) => p.id === pid);
    if (!product) {
      res.status(404).json({ error: 'Doce não encontrado.' });
      return;
    }

    if (type === 'saida' && product.stock < qty) {
      res.status(400).json({
        error: `Estoque insuficiente para saída. Disponível: ${product.stock} un.`,
      });
      return;
    }

    product.stock = type === 'entrada' ? product.stock + qty : product.stock - qty;

    const movement = {
      id: db.nextIds.movement++,
      productId: product.id,
      productName: product.name,
      type,
      quantity: qty,
      observation:
        (observation || '').trim() ||
        (type === 'entrada' ? 'Entrada manual de estoque' : 'Saída manual de estoque'),
      createdBy: req.authUser?.email || 'admin',
      createdAt: new Date().toISOString(),
    };

    db.movements.unshift(movement);
    saveDb(db);

    res.status(201).json({ movement, product });
  });

  // Orders: create checkout order (customer or guest)
  app.post('/api/orders', (req: AuthedRequest, res) => {
    const {
      customerName,
      customerEmail,
      customerPhone,
      deliveryMethod,
      deliveryAddress,
      paymentMethod,
      notes,
      items,
    } = req.body as {
      customerName?: string;
      customerEmail?: string;
      customerPhone?: string;
      deliveryMethod?: DeliveryMethod;
      deliveryAddress?: string;
      paymentMethod?: PaymentMethod;
      notes?: string;
      items?: Array<{ productId: number; quantity: number }>;
    };

    if (!customerName?.trim() || !customerPhone?.trim()) {
      res.status(400).json({ error: 'Informe nome completo e telefone para contato.' });
      return;
    }
    if (!items || items.length === 0) {
      res.status(400).json({ error: 'Seu carrinho está vazio.' });
      return;
    }

    const db = getDb();
    const orderItems: Array<{
      productId: number;
      productName: string;
      unitPrice: number;
      quantity: number;
    }> = [];

    let subtotal = 0;
    for (const item of items) {
      const product = db.products.find((p) => p.id === item.productId && p.active);
      if (!product) {
        res.status(400).json({ error: 'Um dos doces selecionados não está mais disponível.' });
        return;
      }
      const qty = Math.floor(Number(item.quantity));
      if (qty <= 0) {
        res.status(400).json({ error: 'Quantidade inválida no carrinho.' });
        return;
      }
      if (product.stock < qty) {
        res.status(400).json({
          error: `Estoque insuficiente para "${product.name}". Disponível: ${product.stock}.`,
        });
        return;
      }
      orderItems.push({
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: qty,
      });
      subtotal += product.price * qty;
    }

    const orderId = db.nextIds.order++;
    const orderNumber = `DE-${1000 + orderId}`;
    const deliveryFee = 0;
    const total = Number(subtotal.toFixed(2));
    const nowIso = new Date().toISOString();

    for (const item of orderItems) {
      const product = db.products.find((p) => p.id === item.productId);
      if (product) {
        product.stock -= item.quantity;
        db.movements.unshift({
          id: db.nextIds.movement++,
          productId: product.id,
          productName: product.name,
          type: 'saida',
          quantity: item.quantity,
          observation: `Venda Pedido #${orderNumber}`,
          createdBy: req.authUser?.email || customerEmail?.trim() || customerName.trim(),
          createdAt: nowIso,
        });
      }
    }

    const order = {
      id: orderId,
      orderNumber,
      userId: req.authUser?.id ?? null,
      customerEmail: (customerEmail || req.authUser?.email || '').trim(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryMethod: 'retirada' as const,
      deliveryAddress: 'Retirada na loja',
      paymentMethod:
        paymentMethod === 'cartao_retirada' || paymentMethod === 'dinheiro' ? paymentMethod : ('pix' as const),
      notes: (notes || '').trim(),
      items: orderItems,
      subtotal: Number(subtotal.toFixed(2)),
      deliveryFee,
      total,
      status: 'Pendente' as OrderStatus,
      createdAt: nowIso,
    };

    db.orders.unshift(order);
    saveDb(db);

    res.status(201).json({ order });
  });

  // Orders: list (admin sees all, logged-in user sees their own)
  app.get('/api/orders', requireAuth, (req: AuthedRequest, res) => {
    const db = getDb();
    if (req.authUser?.role === 'admin') {
      res.json({ orders: db.orders });
      return;
    }
    const userOrders = db.orders.filter(
      (o) =>
        o.userId === req.authUser?.id ||
        (o.customerEmail && o.customerEmail.toLowerCase() === req.authUser?.email.toLowerCase())
    );
    res.json({ orders: userOrders });
  });

  app.patch('/api/orders/:id/status', requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body as { status?: OrderStatus };
    const valid: OrderStatus[] = ['Pendente', 'Em Preparo', 'Pronto para Retirada', 'Concluído'];
    if (!status || !valid.includes(status)) {
      res.status(400).json({ error: 'Status inválido.' });
      return;
    }
    const db = getDb();
    const order = db.orders.find((o) => o.id === id);
    if (!order) {
      res.status(404).json({ error: 'Pedido não encontrado.' });
      return;
    }
    order.status = status;
    saveDb(db);
    res.json({ order });
  });

  // Vite or static serving
  const distPath = path.resolve(process.cwd(), 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(distPath);

  if (isProd) {
    app.use(express.static(distPath));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Doce Essência running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
