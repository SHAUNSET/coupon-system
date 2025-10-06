import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

// Request body interfaces
interface UserRequestBody {
  name?: string;
  email: string;
  phone_number?: string;
  role: string;
  password_hash: string;
}

interface ShopRequestBody {
  name: string;
  owner_id: string;
}

interface LoginRequestBody {
  email: string;
  shopkeeper_id: string;
  password: string;
}

interface CouponRequestBody {
  user_id: string;
  shop_id: string;
  expires_at: string;
  threshold?: number;
}

interface ShareLinkRequestBody {
  coupon_id: string;
  user_id?: string;
}

interface ClickRequestBody {
  share_link_id: string;
  clicker_id: string;
  clicker_ip?: string;
}

interface RedeemRequestBody {
  coupon_id: string;
  redeemer_id: string;
  shopkeeper_id: string;
}

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// Validate UUID format
const isValidUUID = (id: string): boolean => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);

// Create a new shop
app.post('/api/shops', async (req: Request<{}, {}, ShopRequestBody>, res: Response) => {
  try {
    const { name, owner_id } = req.body;
    if (!name || !owner_id) {
      return res.status(400).json({ error: 'Missing required fields: name, owner_id' });
    }
    if (!isValidUUID(owner_id)) {
      return res.status(400).json({ error: 'Invalid UUID format for owner_id' });
    }
    const existingShop = await prisma.shops.findUnique({ where: { owner_id } });
    if (existingShop) {
      return res.status(400).json({ error: 'Shop with this owner_id already exists' });
    }
    const shop = await prisma.shops.create({
      data: { id: uuidv4(), name, owner_id, created_at: new Date() },
    });
    console.log(`Created shop: ${JSON.stringify(shop)}`);
    res.status(201).json(shop);
  } catch (error) {
    console.error('Error creating shop:', error);
    res.status(500).json({ error: 'Failed to create shop' });
  }
});

// Create a new user
app.post('/api/users', async (req: Request<{}, {}, UserRequestBody>, res: Response) => {
  try {
    const { name, email, phone_number, role, password_hash } = req.body;
    console.log(`Creating user - Raw Request: ${JSON.stringify(req.body)}`); // Debug raw input
    if (!email || !role || !password_hash) {
      return res.status(400).json({ error: 'Missing required fields: email, role, password_hash' });
    }
    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    const user = await prisma.users.create({
      data: { id: uuidv4(), name, email, phone_number, role, password_hash, created_at: new Date() },
    });
    console.log(`Created user in DB: ${JSON.stringify(user)}`); // Debug saved user
    const verifiedUser = await prisma.users.findUnique({ where: { email } });
    console.log(`Verified user from DB: ${JSON.stringify(verifiedUser)}`); // Debug verified data
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Login endpoint for shopkeepers
app.post('/api/users/login', async (req: Request<{}, {}, LoginRequestBody>, res: Response) => {
  try {
    console.log(`Login request received: ${JSON.stringify(req.body)}`); // Debug raw request
    const { email, shopkeeper_id, password } = req.body;
    if (!email || !shopkeeper_id || !password) {
      return res.status(400).json({ error: 'Missing required fields: email, shopkeeper_id, password' });
    }
    if (!isValidUUID(shopkeeper_id)) {
      return res.status(400).json({ error: 'Invalid UUID format for shopkeeper_id' });
    }
    const user = await prisma.users.findUnique({ where: { email } });
    console.log(`Raw user data from DB: ${JSON.stringify(user)}`); // Debug raw user
    if (user) {
      console.log(`User details - ID: ${user.id}, Role: ${user.role}, Password Hash: "${user.password_hash}"`); // Debug details
      if (user.role === 'shopkeeper' && user.id.toLowerCase() === shopkeeper_id.toLowerCase()) {
        console.log(`Password check - Stored: "${user.password_hash}", Input: "${password}"`); // Debug comparison
        if (user.password_hash.trim() === password.trim()) { // Trim to handle hidden spaces
          console.log(`Login successful for ${email}`);
          res.json(user);
        } else {
          console.log(`Password mismatch - Stored: "${user.password_hash.length}" chars, Input: "${password.length}" chars`);
          res.status(401).json({ error: 'Invalid credentials or not a shopkeeper!' });
        }
      } else {
        console.log(`No match for ${email} or not a shopkeeper - ID: ${user.id}, Role: ${user.role}`);
        res.status(401).json({ error: 'Invalid credentials or not a shopkeeper!' });
      }
    } else {
      console.log(`No user found for ${email}`);
      res.status(401).json({ error: 'Invalid credentials or not a shopkeeper!' });
    }
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get all users
app.get('/api/users', async (req: Request, res: Response) => {
  try {
    const users = await prisma.users.findMany();
    console.log(`Fetched ${users.length} users`);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all shops
app.get('/api/shops', async (req: Request, res: Response) => {
  try {
    const shops = await prisma.shops.findMany();
    console.log(`Fetched ${shops.length} shops`);
    res.json(shops);
  } catch (error) {
    console.error('Error fetching shops:', error);
    res.status(500).json({ error: 'Failed to fetch shops' });
  }
});

// Create a new coupon
app.post('/api/coupons', async (req: Request<{}, {}, CouponRequestBody>, res: Response) => {
  try {
    const { user_id, shop_id, expires_at, threshold } = req.body;
    if (!user_id || !shop_id || !expires_at) {
      return res.status(400).json({ error: 'Missing required fields: user_id, shop_id, expires_at' });
    }
    if (!isValidUUID(user_id) || !isValidUUID(shop_id)) {
      return res.status(400).json({ error: 'Invalid UUID format for user_id or shop_id' });
    }
    const userExists = await prisma.users.findUnique({ where: { id: user_id } });
    const shopExists = await prisma.shops.findUnique({ where: { id: shop_id } });
    if (!userExists) return res.status(404).json({ error: `User with ID ${user_id} not found` });
    if (!shopExists) return res.status(404).json({ error: `Shop with ID ${shop_id} not found` });
    const effectiveThreshold = threshold !== undefined ? parseInt(threshold.toString(), 10) : 3;
    const coupon = await prisma.coupons.create({
      data: {
        user_id,
        shop_id,
        expires_at: new Date(expires_at),
        status: 'pending',
        threshold: effectiveThreshold,
        created_at: new Date()
      },
    });
    console.log(`Created coupon: ${JSON.stringify(coupon)}`);
    res.status(201).json(coupon);
  } catch (error) {
    console.error('Error creating coupon:', error);
    res.status(500).json({ error: 'Failed to create coupon' });
  }
});

// Create share links for a coupon
app.post('/api/share-links', async (req: Request<{}, {}, ShareLinkRequestBody>, res: Response) => {
  try {
    const { coupon_id, user_id } = req.body;
    if (!coupon_id) {
      return res.status(400).json({ error: 'Missing coupon_id' });
    }
    if (!isValidUUID(coupon_id)) {
      return res.status(400).json({ error: 'Invalid UUID format for coupon_id' });
    }
    const coupon = await prisma.coupons.findUnique({ where: { id: coupon_id } });
    if (!coupon) {
      return res.status(404).json({ error: `Coupon with ID ${coupon_id} not found` });
    }
    const link = `http://yourdomain.com/redeem/${coupon_id}/${uuidv4()}`;
    const shareLink = await prisma.share_links.create({
      data: { coupon_id, link_url: link, user_id: user_id || null, generated_at: new Date() },
    });
    console.log(`Created share link: ${JSON.stringify(shareLink)}`);
    res.status(201).json(shareLink);
  } catch (error) {
    console.error('Error creating share link:', error);
    res.status(500).json({ error: 'Failed to create share link' });
  }
});

// Record a click and update coupon status
app.post('/api/clicks', async (req: Request<{}, {}, ClickRequestBody>, res: Response) => {
  try {
    const { share_link_id, clicker_id, clicker_ip } = req.body;
    if (!share_link_id || !clicker_id) {
      return res.status(400).json({ error: 'Missing required fields: share_link_id, clicker_id' });
    }
    if (!isValidUUID(share_link_id) || !isValidUUID(clicker_id)) {
      return res.status(400).json({ error: 'Invalid UUID format for share_link_id or clicker_id' });
    }
    const shareLink = await prisma.share_links.findUnique({ where: { id: share_link_id } });
    if (!shareLink) {
      return res.status(404).json({ error: `Share link with ID ${share_link_id} not found` });
    }
    const clickerExists = await prisma.users.findUnique({ where: { id: clicker_id } });
    if (!clickerExists) {
      return res.status(404).json({ error: `User with ID ${clicker_id} not found` });
    }
    const click = await prisma.clicks.create({
      data: {
        share_link_id,
        clicker_id,
        clicker_ip: clicker_ip || null,
        redeemed: false,
        clicked_at: new Date()
      },
    });
    console.log(`Click recorded: ${JSON.stringify(click)}`);

    const couponId = shareLink.coupon_id;
    const coupon = await prisma.coupons.findUnique({ where: { id: couponId } });
    if (!coupon) {
      return res.status(404).json({ error: `Coupon with ID ${couponId} not found` });
    }
    const totalClicks = await prisma.clicks.count({
      where: {
        share_link_id: { in: (await prisma.share_links.findMany({ where: { coupon_id: couponId } })).map(sl => sl.id) },
      },
    });
    console.log(`Total clicks for coupon ${couponId}: ${totalClicks}, Threshold: ${coupon.threshold}`);
    if (totalClicks >= coupon.threshold && coupon.status !== 'active') {
      await prisma.coupons.update({
        where: { id: couponId },
        data: { status: 'active' },
      });
      console.log(`Coupon ${couponId} status updated to active`);
    }

    res.status(201).json(click);
  } catch (error) {
    console.error('Error in clicks endpoint:', error);
    res.status(500).json({ error: 'Failed to record click' });
  }
});

// Redeem a coupon
app.post('/api/redeem', async (req: Request<{}, {}, RedeemRequestBody>, res: Response) => {
  try {
    const { coupon_id, redeemer_id, shopkeeper_id } = req.body;
    if (!coupon_id || !redeemer_id || !shopkeeper_id) {
      return res.status(400).json({ error: 'Missing required fields: coupon_id, redeemer_id, shopkeeper_id' });
    }
    if (!isValidUUID(coupon_id) || !isValidUUID(redeemer_id) || !isValidUUID(shopkeeper_id)) {
      return res.status(400).json({ error: 'Invalid UUID format for one or more IDs' });
    }
    const coupon = await prisma.coupons.findUnique({ where: { id: coupon_id } });
    if (!coupon) {
      return res.status(404).json({ error: `Coupon with ID ${coupon_id} not found` });
    }
    if (coupon.status !== 'active') {
      return res.status(400).json({ error: `Coupon ${coupon_id} is not active, current status: ${coupon.status}` });
    }
    const redeemer = await prisma.users.findUnique({ where: { id: redeemer_id } });
    const shopkeeper = await prisma.users.findUnique({ where: { id: shopkeeper_id } });
    if (!redeemer) return res.status(404).json({ error: `Redeemer with ID ${redeemer_id} not found` });
    if (!shopkeeper) return res.status(404).json({ error: `Shopkeeper with ID ${shopkeeper_id} not found` });

    const redemption = await prisma.redemptions.create({
      data: {
        id: uuidv4(),
        coupon_id,
        redeemer_id,
        shopkeeper_id,
        confirmed_at: new Date(),
      },
    });
    console.log(`Redemption created for coupon ${coupon_id}: ${JSON.stringify(redemption)}`);
    res.status(201).json(redemption);
  } catch (error) {
    console.error('Error in redeem endpoint:', error);
    res.status(500).json({ error: 'Failed to redeem coupon' });
  }
});

// Get redemptions for a shopkeeper with customer details
app.get('/api/redeem', async (req: Request, res: Response) => {
  try {
    const { shopkeeper_id } = req.query;
    if (!shopkeeper_id || !isValidUUID(shopkeeper_id.toString())) {
      return res.status(400).json({ error: 'Invalid or missing shopkeeper_id' });
    }
    const redemptions = await prisma.redemptions.findMany({
      where: { shopkeeper_id: shopkeeper_id.toString().toLowerCase() },
      include: {
        users_redeemer: true,
      },
    });
    console.log(`Fetched ${redemptions.length} redemptions for shopkeeper ${shopkeeper_id}`);
    const formattedRedemptions = redemptions.map(r => ({
      id: r.id,
      coupon_id: r.coupon_id,
      redeemer_id: r.redeemer_id,
      shopkeeper_id: r.shopkeeper_id,
      confirmed_at: r.confirmed_at,
      redeemer_name: r.users_redeemer.name,
      redeemer_phone: r.users_redeemer.phone_number,
    }));
    res.json(formattedRedemptions);
  } catch (error) {
    console.error('Error fetching redemptions:', error);
    res.status(500).json({ error: 'Failed to fetch redemptions' });
  }
});

// Test endpoint to manually update status
app.post('/api/test-update-status', async (req: Request<{}, {}, { coupon_id: string }>, res: Response) => {
  try {
    const { coupon_id } = req.body;
    if (!coupon_id) {
      return res.status(400).json({ error: 'Missing coupon_id' });
    }
    if (!isValidUUID(coupon_id)) {
      return res.status(400).json({ error: 'Invalid UUID format for coupon_id' });
    }
    const coupon = await prisma.coupons.findUnique({ where: { id: coupon_id } });
    if (!coupon) {
      return res.status(404).json({ error: `Coupon with ID ${coupon_id} not found` });
    }
    const updateResult = await prisma.coupons.update({
      where: { id: coupon_id },
      data: { status: 'active' },
    });
    console.log(`Manually updated coupon ${coupon_id} to active: ${JSON.stringify(updateResult)}`);
    res.json(updateResult);
  } catch (error) {
    console.error('Error in test-update-status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} at ${new Date().toISOString()}`);
  console.log('MVP endpoints available: /api/users, /api/users/login, /api/shops, /api/coupons, /api/share-links, /api/clicks, /api/redeem, /api/test-update-status');
});