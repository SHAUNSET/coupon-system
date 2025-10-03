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
      data: { 
        user_id, 
        shop_id, 
        expires_at: new Date(expires_at), 
        status: 'pending', // Added to satisfy the required field
        users: { connect: { id: user_id } }, // Connect the user relation
        shops: { connect: { id: shop_id } }  // Connect the shop relation
      },
    });
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create coupon' });
  }
});

// Create share links for a coupon
app.post('/api/share-links', async (req: Request, res: Response) => {
  try {
    const { coupon_id } = req.body;
    const coupon = await prisma.coupons.findUnique({ where: { id: coupon_id } });
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    const link = `http://yourdomain.com/redeem/${coupon_id}/${Math.random().toString(36).substr(2, 9)}`;
    const shareLink = await prisma.share_links.create({
      data: { coupon_id, link_url: link },
    });
    res.json(shareLink);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create share link' });
  }
});

// Record a click on a share link and check threshold
app.post('/api/clicks', async (req: Request, res: Response) => {
  try {
    const { share_link_id } = req.body;
    const shareLink = await prisma.share_links.findUnique({ where: { id: share_link_id } });
    if (!shareLink) {
      return res.status(404).json({ error: 'Share link not found' });
    }
    const clicker_ip = req.ip || '::1'; // Using ::1 for IPv6 localhost
    const click = await prisma.clicks.create({
      data: { share_link_id, clicker_ip, redeemed: false },
    });

    const couponId = shareLink.coupon_id;
    const coupon = await prisma.coupons.findUnique({ where: { id: couponId } });
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    const clickCount = await prisma.clicks.count({
      where: { share_link_id: share_link_id },
    });
    console.log(`Coupon ID: ${couponId}, Click Count: ${clickCount}, Threshold: ${coupon.threshold}`);
    if (clickCount >= coupon.threshold) {
      try {
        await prisma.coupons.update({
          where: { id: couponId },
          data: { status: 'active' },
        });
        console.log(`Status updated to active for coupon ${couponId}`);
      } catch (updateError) {
        console.log(`Update failed: ${updateError}`);
      }
    } else {
      console.log(`Click count ${clickCount} is below threshold ${coupon.threshold}`);
    }

    res.json(click);
  } catch (error) {
    res.status(500).json({ error: 'Failed to record click' });
  }
});

// Test endpoint to manually update status
app.post('/api/test-update-status', async (req: Request, res: Response) => {
  try {
    const { coupon_id } = req.body;
    const coupon = await prisma.coupons.findUnique({ where: { id: coupon_id } });
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    const updateResult = await prisma.coupons.update({
      where: { id: coupon_id },
      data: { status: 'active' },
    });
    res.json(updateResult);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});