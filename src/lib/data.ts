import type { Category, Product, BlogPost, Review, FlashSaleProduct } from "@/types";

export const CATEGORIES: Category[] = [
  { id: "1", name: "Watches", slug: "watches", image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1920&q=80", productCount: 48 },
  { id: "2", name: "Wallets", slug: "wallets", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1920&q=80", productCount: 32 },
  { id: "3", name: "Men's Apparel", slug: "mens-apparel", image: "https://images.unsplash.com/photo-1617137984095-da51f3022371?auto=format&fit=crop&w=1920&q=80", productCount: 64 },
  { id: "4", name: "Women's Apparel", slug: "womens-apparel", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1920&q=80", productCount: 72 },
  { id: "5", name: "Cosmetics", slug: "cosmetics", image: "https://images.unsplash.com/photo-1596462502278-af407713a298?auto=format&fit=crop&w=1920&q=80", productCount: 56 },
  { id: "6", name: "Perfumes", slug: "perfumes", image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1920&q=80", productCount: 40 },
  { id: "7", name: "Bags", slug: "bags", image: "https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&w=1920&q=80", productCount: 44 },
  { id: "8", name: "Sunglasses", slug: "sunglasses", image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1920&q=80", productCount: 28 },
  { id: "9", name: "Lifestyle", slug: "lifestyle-accessories", image: "https://images.unsplash.com/photo-1511297437033-dc4151aa2e14?auto=format&fit=crop&w=1920&q=80", productCount: 36 },
  { id: "10", name: "Gift Items", slug: "gift-items", image: "https://images.unsplash.com/photo-1513651857529-ef9dd2b85e61?auto=format&fit=crop&w=1920&q=80", productCount: 24 },
  { id: "11", name: "Sunnah Items", slug: "sunnah-items", image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1920&q=80", productCount: 0, parent: "lifestyle-accessories" },
  { id: "12", name: "Gadget Items", slug: "gadgets", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1920&q=80", productCount: 0 },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Luxen Prestige Chronograph",
    slug: "luxen-prestige-chronograph",
    description: "An exquisite timepiece that blends classic elegance with modern precision. Crafted for the discerning gentleman who values both style and functionality.",
    highlights: ["Swiss Quartz Movement", "Sapphire Crystal Glass", "50m Water Resistant", "2-Year Warranty"],
    price: 12500,
    comparePrice: 15000,
    category: CATEGORIES[0],
    images: [
      { id: "i1", url: "https://images.unsplash.com/photo-1523170335684-f7f43b645a00?auto=format&fit=crop&w=800&q=80", alt: "Luxen Prestige Chronograph front", isPrimary: true },
      { id: "i2", url: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80", alt: "Luxen Prestige Chronograph side" },
    ],
    variants: [
      { id: "v1", color: "Gold", colorHex: "#a0d5e9", stock: 15, sku: "LXN-WAT-00001-GLD" },
      { id: "v2", color: "Silver", colorHex: "#C0C0C0", stock: 8, sku: "LXN-WAT-00001-SLV" },
      { id: "v3", color: "Black", colorHex: "#2C2C2C", stock: 12, sku: "LXN-WAT-00001-BLK" },
    ],
    tags: ["watch", "luxury", "chronograph", "men"],
    sku: "LXN-WAT-00001",
    stock: 35,
    rating: 4.8,
    reviewCount: 124,
    isNew: false,
    isFeatured: true,
    isBestSeller: true,
    isOnSale: true,
    specifications: {
      "Movement": "Swiss Quartz",
      "Case Diameter": "42mm",
      "Case Material": "316L Stainless Steel",
      "Crystal": "Sapphire",
      "Water Resistance": "50 meters",
      "Strap": "Genuine Leather / Stainless Steel",
    },
    brand: "Luxen",
    weight: "150g",
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2026-01-01T10:00:00Z",
  },
  {
    id: "p2",
    name: "Luxen Heritage Slim Watch",
    slug: "luxen-heritage-slim-watch",
    description: "A minimalist masterpiece with an ultra-slim profile. Perfect for formal occasions and everyday sophistication.",
    price: 8900,
    comparePrice: 11000,
    category: CATEGORIES[0],
    images: [
      { id: "i3", url: "https://images.unsplash.com/photo-1579101822197-87c4c6d48d17?auto=format&fit=crop&w=800&q=80", alt: "Luxen Heritage Slim Watch", isPrimary: true },
    ],
    sku: "LXN-WAT-00002",
    stock: 22,
    rating: 4.6,
    reviewCount: 89,
    isNew: true,
    isFeatured: true,
    isOnSale: true,
    brand: "Luxen",
    createdAt: "2026-02-01T10:00:00Z",
    updatedAt: "2026-05-01T10:00:00Z",
  },
  {
    id: "p3",
    name: "Luxen Executive Leather Wallet",
    slug: "luxen-executive-leather-wallet",
    description: "Handcrafted from premium full-grain leather, this slim bifold wallet combines style with practicality.",
    highlights: ["Full-Grain Leather", "RFID Blocking", "8 Card Slots", "Slim Profile"],
    price: 3200,
    comparePrice: 4500,
    category: CATEGORIES[1],
    images: [
      { id: "i4", url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80", alt: "Luxen Executive Wallet", isPrimary: true },
    ],
    variants: [
      { id: "v4", color: "Dark Brown", colorHex: "#5C3317", stock: 30, sku: "LXN-WAL-00001-BRN" },
      { id: "v5", color: "Black", colorHex: "#1a1a1a", stock: 25, sku: "LXN-WAL-00001-BLK" },
      { id: "v6", color: "Tan", colorHex: "#D2691E", stock: 18, sku: "LXN-WAL-00001-TAN" },
    ],
    sku: "LXN-WAL-00001",
    stock: 73,
    rating: 4.9,
    reviewCount: 215,
    isBestSeller: true,
    brand: "Luxen",
    createdAt: "2025-06-01T10:00:00Z",
    updatedAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "p4",
    name: "Luxen Noir Eau de Parfum",
    slug: "luxen-noir-eau-de-parfum",
    description: "A bold and sophisticated fragrance with notes of oud, sandalwood, and amber. The signature scent of the modern Bangladeshi gentleman.",
    price: 5500,
    comparePrice: 7000,
    category: CATEGORIES[5],
    images: [
      { id: "i5", url: "https://images.unsplash.com/photo-1594971677386-c2d02a8aa0b2?auto=format&fit=crop&w=800&q=80", alt: "Luxen Noir Perfume", isPrimary: true },
    ],
    variants: [
      { id: "v7", size: "50ml", stock: 40, sku: "LXN-PRF-00001-50" },
      { id: "v8", size: "100ml", stock: 25, sku: "LXN-PRF-00001-100", price: 9500 },
    ],
    sku: "LXN-PRF-00001",
    stock: 65,
    rating: 4.7,
    reviewCount: 178,
    isNew: true,
    isFeatured: true,
    brand: "Luxen",
    createdAt: "2026-01-01T10:00:00Z",
    updatedAt: "2026-04-01T10:00:00Z",
  },
  {
    id: "p5",
    name: "Luxen Structured Tote Bag",
    slug: "luxen-structured-tote-bag",
    description: "An elegant structured tote crafted from premium vegan leather. Spacious enough for daily essentials with a touch of luxury.",
    price: 6800,
    comparePrice: 9500,
    category: CATEGORIES[6],
    images: [
      { id: "i6", url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80", alt: "Luxen Tote Bag", isPrimary: true },
    ],
    variants: [
      { id: "v9", color: "Ivory", colorHex: "#faf8ea", stock: 20, sku: "LXN-BAG-00001-IVR" },
      { id: "v10", color: "Black", colorHex: "#1a1a1a", stock: 15, sku: "LXN-BAG-00001-BLK" },
      { id: "v11", color: "Cream", colorHex: "#faf8ea", stock: 10, sku: "LXN-BAG-00001-CRM" },
    ],
    sku: "LXN-BAG-00001",
    stock: 45,
    rating: 4.5,
    reviewCount: 92,
    isNew: true,
    isFeatured: true,
    brand: "Luxen",
    createdAt: "2026-03-01T10:00:00Z",
    updatedAt: "2026-05-15T10:00:00Z",
  },
  {
    id: "p6",
    name: "Luxen Classic Aviator Sunglasses",
    slug: "luxen-classic-aviator-sunglasses",
    description: "Timeless aviator style with UV400 protection and polarized lenses. The perfect accessory for the sun-loving fashionista.",
    price: 4200,
    comparePrice: 5500,
    category: CATEGORIES[7],
    images: [
      { id: "i7", url: "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?auto=format&fit=crop&w=800&q=80", alt: "Luxen Aviator Sunglasses", isPrimary: true },
    ],
    variants: [
      { id: "v12", color: "Gold/Brown", colorHex: "#a0d5e9", stock: 35, sku: "LXN-SUN-00001-GLD" },
      { id: "v13", color: "Silver/Grey", colorHex: "#C0C0C0", stock: 28, sku: "LXN-SUN-00001-SLV" },
    ],
    sku: "LXN-SUN-00001",
    stock: 63,
    rating: 4.4,
    reviewCount: 67,
    isBestSeller: true,
    brand: "Luxen",
    createdAt: "2025-09-01T10:00:00Z",
    updatedAt: "2026-02-01T10:00:00Z",
  },
];

export const FLASH_SALE_PRODUCTS: FlashSaleProduct[] = [
  {
    ...MOCK_PRODUCTS[0],
    flashPrice: 9999,
    flashStock: 20,
    soldCount: 13,
    saleEndsAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    ...MOCK_PRODUCTS[2],
    flashPrice: 2499,
    flashStock: 30,
    soldCount: 18,
    saleEndsAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    ...MOCK_PRODUCTS[3],
    flashPrice: 4299,
    flashStock: 25,
    soldCount: 10,
    saleEndsAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    ...MOCK_PRODUCTS[4],
    flashPrice: 5499,
    flashStock: 15,
    soldCount: 8,
    saleEndsAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  },
];

export const MOCK_REVIEWS: Review[] = [
  {
    id: "r1",
    user: { id: "u1", name: "Rahul Ahmed", avatar: undefined },
    product: { id: "p1", name: "Luxen Prestige Chronograph" },
    rating: 5,
    title: "Absolutely stunning watch!",
    body: "The quality is outstanding. I've been wearing it for 3 months now and it still looks brand new. The gold tone is exactly as shown in the pictures. Would definitely recommend to anyone looking for a premium watch.",
    isVerified: true,
    helpful: 24,
    createdAt: "2026-03-15T10:00:00Z",
  },
  {
    id: "r2",
    user: { id: "u2", name: "Fatima Islam", avatar: undefined },
    product: { id: "p3", name: "Luxen Executive Leather Wallet" },
    rating: 5,
    title: "Best wallet I've ever owned",
    body: "The leather is genuine and high quality. It's slim enough to fit in my pocket without any bulk. The RFID blocking feature gives me peace of mind. Luxen has exceeded my expectations!",
    isVerified: true,
    helpful: 31,
    createdAt: "2026-04-02T10:00:00Z",
  },
  {
    id: "r3",
    user: { id: "u3", name: "Tariq Hassan", avatar: undefined },
    product: { id: "p4", name: "Luxen Noir Eau de Parfum" },
    rating: 5,
    title: "Incredible fragrance, long-lasting",
    body: "This is my new signature scent. The oud and sandalwood blend is perfectly balanced – masculine yet refined. It lasts easily 8+ hours on my skin. Will be ordering again!",
    isVerified: true,
    helpful: 19,
    createdAt: "2026-04-20T10:00:00Z",
  },
  {
    id: "r4",
    user: { id: "u4", name: "Nadia Chowdhury", avatar: undefined },
    product: { id: "p5", name: "Luxen Structured Tote Bag" },
    rating: 4,
    title: "Elegant and spacious",
    body: "The bag is beautiful and very well made. Fits my laptop, wallet, and all my daily essentials comfortably. The ivory color is so classy. Packaging was also premium quality.",
    isVerified: true,
    helpful: 15,
    createdAt: "2026-05-01T10:00:00Z",
  },
];

export const BLOG_POSTS: BlogPost[] = [
  {
    id: "b1",
    title: "How to Choose the Perfect Watch for Every Occasion",
    slug: "choose-perfect-watch-every-occasion",
    excerpt: "A comprehensive guide to selecting the right timepiece that complements your outfit and occasion, from boardroom meetings to formal galas.",
    body: "",
    coverImage: "https://images.unsplash.com/photo-1523170335684-f7f43b645a00?auto=format&fit=crop&w=1920&q=80",
    author: { name: "Luxen Editorial" },
    category: "Style Guide",
    tags: ["watches", "style", "fashion"],
    readTime: 7,
    publishedAt: "2026-05-15T10:00:00Z",
  },
  {
    id: "b2",
    title: "The Art of Leather Care: Keep Your Wallet Looking Premium",
    slug: "art-of-leather-care-wallet",
    excerpt: "Expert tips on maintaining your leather goods to ensure they age gracefully and retain their luxurious appearance for years to come.",
    body: "",
    coverImage: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1920&q=80",
    author: { name: "Luxen Editorial" },
    category: "Care Guide",
    tags: ["leather", "wallet", "care"],
    readTime: 5,
    publishedAt: "2026-05-22T10:00:00Z",
  },
  {
    id: "b3",
    title: "Summer 2026: Luxen's Top Fragrance Picks",
    slug: "summer-2026-top-fragrance-picks",
    excerpt: "Discover the finest summer fragrances from our curated collection, perfect for the warm Bangladesh evenings and outdoor celebrations.",
    body: "",
    coverImage: "https://images.unsplash.com/photo-1594971677386-c2d02a8aa0b2?auto=format&fit=crop&w=1920&q=80",
    author: { name: "Luxen Editorial" },
    category: "Fragrance",
    tags: ["perfume", "summer", "fragrance"],
    readTime: 6,
    publishedAt: "2026-06-01T10:00:00Z",
  },
];

export const PAYMENT_METHODS = [
  { id: "cash_on_delivery", name: "Cash on Delivery", icon: "💵", description: "Pay when you receive" },
  { id: "bkash", name: "bKash", icon: "/icons/bkash.png", description: "Mobile banking" },
  { id: "nagad", name: "Nagad", icon: "/icons/nagad.png", description: "Mobile banking" },
  { id: "rocket", name: "Rocket", icon: "/icons/rocket.png", description: "Mobile banking" },
  { id: "sslcommerz", name: "SSLCommerz", icon: "/icons/sslcommerz.png", description: "Online payment" },
  { id: "visa", name: "Visa", icon: "/icons/visa.png", description: "Credit/Debit card" },
  { id: "mastercard", name: "Mastercard", icon: "/icons/mastercard.png", description: "Credit/Debit card" },
];

export const COURIERS = [
  { id: "steadfast", name: "Steadfast Courier" },
  { id: "pathao", name: "Pathao Courier" },
  { id: "redx", name: "RedX" },
  { id: "sundarban", name: "Sundarban Courier" },
];

export const WHY_LUXEN = [
  {
    icon: "✦",
    title: "Premium Quality",
    description: "Every product is handpicked and quality-tested to meet our luxury standards.",
  },
  {
    icon: "✓",
    title: "100% Genuine",
    description: "All products are authentic with certificates of authenticity where applicable.",
  },
  {
    icon: "⚡",
    title: "Fast Delivery",
    description: "Dhaka same-day delivery. Nationwide 2-3 business days via premium couriers.",
  },
  {
    icon: "🔒",
    title: "Secure Payment",
    description: "SSL-encrypted checkout with bKash, Nagad, and all major payment methods.",
  },
  {
    icon: "↩",
    title: "Easy Returns",
    description: "7-day hassle-free returns with free pickup from your doorstep.",
  },
];

/**
 * "Group" landing pages used by the nav. These slugs are not real categories —
 * the category page resolves them to products across several real categories.
 */
export const CATEGORY_GROUPS: Record<
  string,
  { name: string; description: string; slugs: string[] }
> = {
  // fashion: {
  //   name: "Fashion",
  //   description: "Apparel, bags, wallets & sunglasses — curated for everyday luxury.",
  //   slugs: ["mens-apparel", "womens-apparel", "bags", "wallets", "sunglasses"],
  // },
  // beauty: {
  //   name: "Beauty",
  //   description: "Premium perfumes and cosmetics for your signature look.",
  //   slugs: ["perfumes", "cosmetics"],
  // },
};

export const NAV_MENU = [
  {
    label: "New Toys",
    href: "/new-arrivals",
    badge: "New",
    children: [],
  },
  // {
  //   label: "Watches",
  //   href: "/category/watches",
  //   children: [],
  // },
  // {
  //   label: "Fashion",
  //   href: "/category/fashion",
  //   children: [
  //     { label: "Men's Apparel", href: "/category/mens-apparel" },
  //     { label: "Women's Apparel", href: "/category/womens-apparel" },
  //     { label: "Bags", href: "/category/bags" },
  //     { label: "Wallets", href: "/category/wallets" },
  //     { label: "Sunglasses", href: "/category/sunglasses" },
  //   ],
  // },
  // {
  //   label: "Beauty",
  //   href: "/category/beauty",
  //   children: [
  //     { label: "Perfumes", href: "/category/perfumes" },
  //     { label: "Cosmetics", href: "/category/cosmetics" },
  //   ],
  // },
  // {
  //   label: "Lifestyle",
  //   href: "/category/lifestyle-accessories",
  //   children: [
  //     { label: "Accessories", href: "/category/lifestyle-accessories" },
  //     { label: "Gift Items", href: "/category/gift-items" },
  //     { label: "Sunnah Items", href: "/category/sunnah-items" },
  //   ],
  // },
  {
    label: "Special Offers",
    href: "/flash-sale",
    badge: "🔥",
    children: [],
  },
  // {
  //   label: "Gadget Items",
  //   href: "/category/gadgets",
  //   children: [],
  // },
];

export const FAQ_ITEMS = [
  {
    question: "How long does delivery take?",
    answer: "Dhaka city delivery takes 1-2 business days. Outside Dhaka takes 3-5 business days. Express same-day delivery is available for Dhaka orders placed before 12pm.",
  },
  {
    question: "What payment methods are accepted?",
    answer: "We accept Cash on Delivery, bKash, Nagad, Rocket, SSLCommerz (Visa/Mastercard), and all major credit/debit cards.",
  },
  {
    question: "What is your return policy?",
    answer: "We offer a 7-day hassle-free return policy. Products must be unused, in original packaging with tags intact. We provide free pickup from your doorstep.",
  },
  {
    question: "Are all products genuine/authentic?",
    answer: "Yes, 100%. All our products are genuine and come with authenticity certificates where applicable. We source directly from verified suppliers.",
  },
  {
    question: "Do you offer gift wrapping?",
    answer: "Yes! We offer premium gift wrapping for ৳50 per order. You can add personalized messages during checkout.",
  },
  {
    question: "How do I track my order?",
    answer: "After your order is shipped, you'll receive an SMS and email with your tracking number. You can also track your order on our website using the Track Order page.",
  },
];
