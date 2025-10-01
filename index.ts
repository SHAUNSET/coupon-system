import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// Get all users
app.get('/api/users', async (req: Request, res: Response) => {
  try {
    const users = await prisma.users.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all coupons
app.get('/api/coupons', async (req: Request, res: Response) => {
  try {
    const coupons = await prisma.coupons.findMany();
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

// Create a new coupon (basic, for testing)
app.post('/api/coupons', async (req: Request, res: Response) => {
  try {
    const { user_id, shop_id, expires_at } = req.body;
    const coupon = await prisma.coupons.create({
      data: { user_id, shop_id, expires_at: new Date(expires_at) },
    });
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create coupon' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});