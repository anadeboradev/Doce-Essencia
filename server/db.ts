import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Order, Product, StockMovement, User, UserRole } from '../src/types.ts';

export interface StoredUser extends User {
  passwordHash: string;
}

export interface DatabaseState {
  sessionSecret: string;
  nextIds: {
    user: number;
    product: number;
    movement: number;
    order: number;
  };
  users: StoredUser[];
  products: Product[];
  movements: StockMovement[];
  orders: Order[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'doce_essencia.json');

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derivedBuf = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

function createInitialState(): DatabaseState {
  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000).toISOString();

  return {
    sessionSecret: crypto.randomBytes(32).toString('hex'),
    nextIds: {
      user: 3,
      product: 7,
      movement: 7,
      order: 2,
    },
    users: [
      {
        id: 1,
        email: 'admin@example.com',
        name: 'Administradora',
        role: 'admin' as UserRole,
        phone: '(11) 99999-0000',
        address: '',
        passwordHash: hashPassword('admin123'),
        createdAt: hoursAgo(240),
      },
      {
        id: 2,
        email: 'cadu173@gmail.com',
        name: 'Cadu Mendes',
        role: 'cliente' as UserRole,
        phone: '(11) 98765-4321',
        address: 'Av. Paulista, 1200, Apto 42 — Bela Vista',
        passwordHash: hashPassword('cliente123'),
        createdAt: hoursAgo(120),
      },
    ],
    products: [
      {
        id: 1,
        name: 'Brigadeiro Gourmet (25 unidades)',
        category: 'Brigadeiros & Docinhos',
        price: 45.0,
        description:
          'Brigadeiros artesanais preparados com leite condensado cozido lentamente, manteiga extra e chocolate belga meio amargo, finalizados com raspas crocantes.',
        imageUrl: 'preset:brigadeiro',
        nutritionalInfo:
          'Porção de 20g (1 unidade): 88 kcal · Carboidratos: 11g · Proteínas: 1,4g · Gorduras totais: 4,1g. Contém leite e derivados.',
        stock: 36,
        active: true,
        createdAt: hoursAgo(200),
      },
      {
        id: 2,
        name: 'Beijinho de Coco (25 unidades)',
        category: 'Brigadeiros & Docinhos',
        price: 42.0,
        description:
          'Docinhos cremosos de coco fresco ralado em ponto macio e sedoso, envolvidos em flocos de coco branco e finalizados com cravo-da-índia aromático.',
        imageUrl: 'preset:beijinho',
        nutritionalInfo:
          'Porção de 20g (1 unidade): 82 kcal · Carboidratos: 10g · Proteínas: 1,2g · Gorduras totais: 3,9g. Contém leite e derivados.',
        stock: 28,
        active: true,
        createdAt: hoursAgo(195),
      },
      {
        id: 3,
        name: 'Brownie Artesanal com Nozes',
        category: 'Bolos & Brownies',
        price: 15.0,
        description:
          'Brownie denso e úmido de chocolate 70% cacau com pedaços de nozes pecã tostadas na manteiga e cobertura brilhante de ganache meio amargo.',
        imageUrl: 'preset:brownie',
        nutritionalInfo:
          'Porção de 80g (1 fatia): 310 kcal · Carboidratos: 34g · Proteínas: 4,5g · Gorduras totais: 17g. Contém glúten, ovos, leite e nozes.',
        stock: 24,
        active: true,
        createdAt: hoursAgo(190),
      },
      {
        id: 4,
        name: 'Bolo de Cenoura com Brigadeiro',
        category: 'Bolos & Brownies',
        price: 18.0,
        description:
          'Fatia generosa de massa fofinha de cenoura fresca assada no dia, coberta com calda cremosa de brigadeiro tradicional e granulados belgas.',
        imageUrl: 'preset:bolo_cenoura',
        nutritionalInfo:
          'Porção de 120g (1 fatia): 345 kcal · Carboidratos: 46g · Proteínas: 4,2g · Gorduras totais: 15g. Contém glúten, ovos e leite.',
        stock: 18,
        active: true,
        createdAt: hoursAgo(180),
      },
      {
        id: 5,
        name: 'Palha Italiana Artesanal (6 un.)',
        category: 'Especiais',
        price: 28.0,
        description:
          'Quadradinhos macios de brigadeiro intenso intercalados com biscoito maisena crocante e polvilhados delicadamente com açúcar de confeiteiro.',
        imageUrl: 'preset:palha_italiana',
        nutritionalInfo:
          'Porção de 35g (1 quadrado): 142 kcal · Carboidratos: 19g · Proteínas: 2,1g · Gorduras totais: 6,3g. Contém glúten e leite.',
        stock: 20,
        active: true,
        createdAt: hoursAgo(170),
      },
      {
        id: 6,
        name: 'Caixa Degustação Doce Essência (16 un.)',
        category: 'Especiais',
        price: 54.0,
        description:
          'Seleção especial para presente com 8 brigadeiros gourmet variados, 4 beijinhos de coco e 4 mini brownies artesanais em embalagem presenteável.',
        imageUrl: 'preset:hero',
        nutritionalInfo:
          'Porção de 25g: 105 kcal · Carboidratos: 13g · Proteínas: 1,7g · Gorduras totais: 5,1g. Contém glúten, leite e nozes.',
        stock: 14,
        active: true,
        createdAt: hoursAgo(160),
      },
    ],
    movements: [
      {
        id: 1,
        productId: 1,
        productName: 'Brigadeiro Gourmet (25 unidades)',
        type: 'entrada',
        quantity: 40,
        observation: 'Produção diária da cozinha artesanal',
        createdBy: 'admin@example.com',
        createdAt: hoursAgo(72),
      },
      {
        id: 2,
        productId: 2,
        productName: 'Beijinho de Coco (25 unidades)',
        type: 'entrada',
        quantity: 30,
        observation: 'Produção diária da cozinha artesanal',
        createdBy: 'admin@example.com',
        createdAt: hoursAgo(70),
      },
      {
        id: 3,
        productId: 3,
        productName: 'Brownie Artesanal com Nozes',
        type: 'entrada',
        quantity: 26,
        observation: 'Lote forno da manhã',
        createdBy: 'admin@example.com',
        createdAt: hoursAgo(48),
      },
      {
        id: 4,
        productId: 3,
        productName: 'Brownie Artesanal com Nozes',
        type: 'saida',
        quantity: 2,
        observation: 'Degustação para evento corporativo',
        createdBy: 'admin@example.com',
        createdAt: hoursAgo(36),
      },
      {
        id: 5,
        productId: 1,
        productName: 'Brigadeiro Gourmet (25 unidades)',
        type: 'saida',
        quantity: 4,
        observation: 'Venda Pedido #DE-1001',
        createdBy: 'cadu173@gmail.com',
        createdAt: hoursAgo(24),
      },
      {
        id: 6,
        productId: 2,
        productName: 'Beijinho de Coco (25 unidades)',
        type: 'saida',
        quantity: 2,
        observation: 'Venda Pedido #DE-1001',
        createdBy: 'cadu173@gmail.com',
        createdAt: hoursAgo(24),
      },
    ],
    orders: [
      {
        id: 1,
        orderNumber: 'DE-1001',
        userId: 2,
        customerEmail: 'cadu173@gmail.com',
        customerName: 'Cadu Mendes',
        customerPhone: '(11) 98765-4321',
        deliveryMethod: 'retirada',
        deliveryAddress: 'Retirada na loja',
        paymentMethod: 'pix',
        notes: 'Vou retirar no período da tarde.',
        items: [
          {
            productId: 1,
            productName: 'Brigadeiro Gourmet (25 unidades)',
            unitPrice: 45.0,
            quantity: 2,
          },
          {
            productId: 2,
            productName: 'Beijinho de Coco (25 unidades)',
            unitPrice: 42.0,
            quantity: 1,
          },
        ],
        subtotal: 132.0,
        deliveryFee: 0,
        total: 132.0,
        status: 'Em Preparo',
        createdAt: hoursAgo(24),
      },
    ],
  };
}

let cachedState: DatabaseState | null = null;

export function getDb(): DatabaseState {
  if (cachedState) return cachedState;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      cachedState = JSON.parse(raw) as DatabaseState;
      return cachedState;
    } catch {
      // Fallback to fresh seed if JSON got corrupted
    }
  }

  cachedState = createInitialState();
  saveDb(cachedState);
  return cachedState;
}

export function saveDb(state: DatabaseState): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

export function sanitizeUser(user: StoredUser): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
    address: user.address,
    createdAt: user.createdAt,
  };
}
