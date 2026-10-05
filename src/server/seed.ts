/**
 * One-time database seed. Populates MongoDB from the original mock data so the
 * site has content to render, and creates the admin login user.
 *
 * Run with:  npm run seed
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "./db/connect";
import { Category } from "./models/Category";
import { Product } from "./models/Product";
import { Review } from "./models/Review";
import { BlogPost } from "./models/BlogPost";
import { FlashSale } from "./models/FlashSale";
import { Banner } from "./models/Banner";
import { Settings } from "./models/Settings";
import { AdminUser } from "./models/AdminUser";
import {
  CATEGORIES,
  MOCK_PRODUCTS,
  MOCK_REVIEWS,
  BLOG_POSTS,
  FLASH_SALE_PRODUCTS,
} from "../lib/data";

const ADMIN_EMAIL = "suppergirl230@gmail.com";
const ADMIN_PASSWORD = "Kids Toy Castle";

async function seed() {
  await connectDB();
  console.log("Connected. Clearing existing collections…");

  await Promise.all([
    Category.deleteMany({}),
    Product.deleteMany({}),
    Review.deleteMany({}),
    BlogPost.deleteMany({}),
    FlashSale.deleteMany({}),
    Banner.deleteMany({}),
  ]);

  // --- Categories ---
  const slugToCategoryId = new Map<string, mongoose.Types.ObjectId>();
  for (const c of CATEGORIES) {
    const created = await Category.create({
      name: c.name,
      slug: c.slug,
      description: c.description,
      image: c.image,
      parent: c.parent || null,
      isActive: true,
    });
    slugToCategoryId.set(c.slug, created._id as mongoose.Types.ObjectId);
  }
  console.log(`Seeded ${CATEGORIES.length} categories.`);

  // --- Products ---
  const slugToProductId = new Map<string, mongoose.Types.ObjectId>();
  const nameToProductId = new Map<string, mongoose.Types.ObjectId>();
  for (const p of MOCK_PRODUCTS) {
    const categoryId = slugToCategoryId.get(p.category.slug);
    if (!categoryId) {
      console.warn(`No category for product ${p.name} (${p.category.slug}); skipping`);
      continue;
    }
    const created = await Product.create({
      name: p.name,
      slug: p.slug,
      description: p.description,
      highlights: p.highlights ?? [],
      price: p.price,
      comparePrice: p.comparePrice,
      category: categoryId,
      images: (p.images ?? []).map((img, i) => ({
        url: img.url,
        alt: img.alt,
        isPrimary: img.isPrimary ?? i === 0,
        order: i,
      })),
      variants: (p.variants ?? []).map((v) => ({
        color: v.color,
        colorHex: v.colorHex,
        size: v.size,
        stock: v.stock,
        sku: v.sku,
        price: v.price,
      })),
      tags: p.tags ?? [],
      sku: p.sku,
      stock: p.stock,
      rating: p.rating,
      reviewCount: p.reviewCount,
      isNewArrival: p.isNew ?? false,
      isFeatured: p.isFeatured ?? false,
      isBestSeller: p.isBestSeller ?? false,
      isOnSale: p.isOnSale ?? false,
      specifications: p.specifications ?? {},
      brand: p.brand,
      weight: p.weight,
      dimensions: p.dimensions,
      material: p.material,
      isActive: true,
    });
    slugToProductId.set(p.slug, created._id as mongoose.Types.ObjectId);
    nameToProductId.set(p.name, created._id as mongoose.Types.ObjectId);
  }
  console.log(`Seeded ${slugToProductId.size} products.`);

  // --- Reviews ---
  let reviewCount = 0;
  for (const r of MOCK_REVIEWS) {
    const productId = nameToProductId.get(r.product.name);
    if (!productId) continue;
    await Review.create({
      product: productId,
      productName: r.product.name,
      userName: r.user.name,
      rating: r.rating,
      title: r.title,
      body: r.body,
      images: r.images ?? [],
      isVerified: r.isVerified ?? false,
      status: "approved",
      helpful: r.helpful ?? 0,
    });
    reviewCount++;
  }
  console.log(`Seeded ${reviewCount} reviews.`);

  // --- Blog posts ---
  for (const b of BLOG_POSTS) {
    await BlogPost.create({
      title: b.title,
      slug: b.slug,
      excerpt: b.excerpt,
      body: b.body,
      coverImage: b.coverImage,
      authorName: b.author.name,
      category: b.category,
      tags: b.tags ?? [],
      readTime: b.readTime,
      isPublished: true,
      publishedAt: new Date(b.publishedAt),
    });
  }
  console.log(`Seeded ${BLOG_POSTS.length} blog posts.`);

  // --- Flash sales ---
  let flashCount = 0;
  for (const f of FLASH_SALE_PRODUCTS) {
    const productId = slugToProductId.get(f.slug);
    if (!productId) continue;
    await FlashSale.create({
      product: productId,
      flashPrice: f.flashPrice,
      flashStock: f.flashStock,
      soldCount: f.soldCount,
      saleEndsAt: new Date(f.saleEndsAt),
      isActive: true,
    });
    flashCount++;
  }
  console.log(`Seeded ${flashCount} flash sales.`);

  // --- Demo banners ---
  await Banner.insertMany([
    {
      title: "New Collection 2026",
      subtitle: "Premium watches & timepieces",
      image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1920&q=80",
      link: "/new-arrivals",
      position: "hero",
      isActive: true,
      displayOrder: 1,
    },
    {
      title: "Signature Fragrances",
      subtitle: "Notes of oud, sandalwood & amber",
      image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1920&q=80",
      link: "/category/perfumes",
      position: "hero",
      isActive: true,
      displayOrder: 2,
    },
    {
      title: "Flash Sale — Up to 30% Off",
      subtitle: "Limited time offers",
      image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1920&q=80",
      link: "/flash-sale",
      position: "homepage-mid",
      isActive: true,
      displayOrder: 3,
    },
    {
      title: "Premium Leather Goods",
      subtitle: "Crafted to last a lifetime",
      image: "https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&w=1920&q=80",
      link: "/category/bags",
      position: "category",
      isActive: false,
      displayOrder: 4,
    },
  ]);
  console.log("Seeded 4 demo banners.");

  // --- Settings singleton ---
  await Settings.updateOne(
    { key: "default" },
    {
      $setOnInsert: {
        key: "default",
        store: {
          storeName: "Luxen",
          tagline: "Premium Lifestyle & Fashion",
          email: "hello@luxen.com.bd",
          phone: "+880 1700-000000",
          currency: "BDT",
          currencySymbol: "৳",
        },
        shipping: {
          freeShippingThreshold: 2000,
          defaultShippingCost: 120,
          insideDhaka: 60,
          outsideDhaka: 120,
        },
        payment: { codEnabled: true, bkash: true, nagad: true },
        notifications: { lowStockThreshold: 5 },
        seo: { metaTitle: "Luxen — Premium Lifestyle & Fashion" },
      },
    },
    { upsert: true }
  );
  console.log("Seeded settings.");

  // --- Admin user ---
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await AdminUser.updateOne(
    { email: ADMIN_EMAIL },
    {
      $set: { password: hash, role: "ADMIN", name: "Luxen Admin" },
      $setOnInsert: { email: ADMIN_EMAIL },
    },
    { upsert: true }
  );
  console.log(`Admin user ready: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);

  await mongoose.disconnect();
  console.log("Done. Disconnected.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
