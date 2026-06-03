require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");

const MONGODB_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/nutriforge";

const products = [
  // ── SUPPLEMENTS (8 ITEMS) ──────────────────────────────────────────────────
  {
    name: "Isolate Whey Protein 5lbs",
    description: "Ultra-pure whey isolate engineered for maximum muscle protein synthesis with zero fillers. Unmatched digestion and absorption.",
    category: "supplement",
    price: 55,
    stock: 120,
    imageUrl: "https://images.unsplash.com/photo-1579722820308-d74e571900a9?w=800&h=800&fit=crop&q=80",
    brand: "Titan Nutrition",
    isFeatured: true,
    ratings: { average: 4.8, count: 245 }
  },
  {
    name: "Pre-Workout Blitz Extreme",
    description: "Explosive energy matrix featuring 300mg caffeine, citrulline malate for massive pumps, and beta-alanine for endurance.",
    category: "supplement",
    price: 45,
    stock: 85,
    imageUrl: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=800&h=800&fit=crop&q=80",
    brand: "Surge Supps",
    isFeatured: true,
    ratings: { average: 4.6, count: 180 }
  },
  {
    name: "Essential BCAAs Recovery",
    description: "Scientifically formulated 2:1:1 ratio BCAAs to dramatically reduce muscle soreness and accelerate recovery intra-workout.",
    category: "supplement",
    price: 35,
    stock: 150,
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&h=800&fit=crop&q=80",
    brand: "Titan Nutrition",
    isFeatured: false,
    ratings: { average: 4.9, count: 320 }
  },
  {
    name: "Creatine Monohydrate 500g",
    description: "100% pure micronized creatine monohydrate. The most researched supplement in the world for proven strength increases.",
    category: "supplement",
    price: 25,
    stock: 200,
    imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=800&fit=crop&q=80",
    brand: "Foundation Formulations",
    isFeatured: true,
    ratings: { average: 4.9, count: 500 }
  },
  {
    name: "Multi-Vitamin Active Pack",
    description: "A complete spectrum of highly bio-available vitamins, minerals, and antioxidants designed specifically for hard-training athletes.",
    category: "supplement",
    price: 30,
    stock: 90,
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&h=800&fit=crop&q=80",
    brand: "Surge Supps",
    isFeatured: false,
    ratings: { average: 4.5, count: 95 }
  },
  {
    name: "Mass Gainer Pro 10lbs",
    description: "Calorie-dense formula packing 1200 calories and 60g protein per serving to break through any hardgainer plateau.",
    category: "supplement",
    price: 60,
    stock: 45,
    imageUrl: "https://images.unsplash.com/photo-1606940831543-dee53f3e6c52?w=800&h=800&fit=crop&q=80",
    brand: "Titan Nutrition",
    isFeatured: false,
    ratings: { average: 4.3, count: 110 }
  },
  {
    name: "Vegan Plant Protein Isolate",
    description: "Premium pea and rice protein blend delivering a complete amino acid profile without the gritty texture.",
    category: "supplement",
    price: 50,
    stock: 75,
    imageUrl: "https://images.unsplash.com/photo-1610725664285-7c57e6eeac3f?w=800&h=800&fit=crop&q=80",
    brand: "Earth Gains",
    isFeatured: false,
    ratings: { average: 4.7, count: 130 }
  },
  {
    name: "Omega-3 Fish Oil Advanced",
    description: "Triple-strength EPA/DHA fish oil specifically distilled for purity. Essential for joint health and inflammation reduction.",
    category: "supplement",
    price: 20,
    stock: 110,
    imageUrl: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=800&fit=crop&q=80",
    brand: "Foundation Formulations",
    isFeatured: false,
    ratings: { average: 4.8, count: 210 }
  },

  // ── EQUIPMENT (7 ITEMS) ──────────────────────────────────────────────────
  {
    name: "Titanium Pro Power Rack",
    description: "Commercial-grade 11-gauge steel power rack with safely spotter arms, band pegs, and a multi-grip pull-up bar.",
    category: "equipment",
    price: 499,
    stock: 12,
    imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=800&fit=crop&q=80",
    brand: "Ironclad Fitness",
    isFeatured: true,
    ratings: { average: 4.9, count: 42 }
  },
  {
    name: "Cast Iron Kettlebell 24kg",
    description: "Single-cast iron kettlebell with a wide, flat machined base and a powder-coated finish for optimal chalk grip.",
    category: "equipment",
    price: 65,
    stock: 40,
    imageUrl: "https://images.unsplash.com/photo-1611072174913-5fb82ac70de6?w=800&h=800&fit=crop&q=80",
    brand: "Ironclad Fitness",
    isFeatured: false,
    ratings: { average: 4.9, count: 85 }
  },
  {
    name: "Adjustable Dumbbell Set 50lbs",
    description: "Space-saving adjustable dumbbells featuring a quick-turn dial locking mechanism mapping from 5 to 50lbs instantly.",
    category: "equipment",
    price: 199,
    stock: 25,
    imageUrl: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&h=800&fit=crop&q=80",
    brand: "FlexTech",
    isFeatured: true,
    ratings: { average: 4.7, count: 160 }
  },
  {
    name: "Olympic Barbell 20kg",
    description: "Premium 20kg barbell with dual knurl marks, 190k PSI tensile strength steel, and precision needle bearings.",
    category: "equipment",
    price: 250,
    stock: 30,
    imageUrl: "https://images.unsplash.com/photo-1590239926044-4131a4a73a89?w=800&h=800&fit=crop&q=80",
    brand: "Ironclad Fitness",
    isFeatured: false,
    ratings: { average: 4.9, count: 65 }
  },
  {
    name: "Bumper Plate Pair 45lbs",
    description: "Low-bounce virgin rubber bumper plates with a stainless steel core insert for extreme drop durability.",
    category: "equipment",
    price: 120,
    stock: 45,
    imageUrl: "https://images.unsplash.com/photo-1517344884509-a0c97ec11bcc?w=800&h=800&fit=crop&q=80",
    brand: "Ironclad Fitness",
    isFeatured: false,
    ratings: { average: 4.8, count: 115 }
  },
  {
    name: "Heavy Duty Flat Bench",
    description: "Unshakable welded steel frame flat bench utilizing a dense, non-slip vinyl pad engineered for heavy pressing.",
    category: "equipment",
    price: 150,
    stock: 20,
    imageUrl: "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=800&h=800&fit=crop&q=80",
    brand: "Ironclad Fitness",
    isFeatured: false,
    ratings: { average: 4.7, count: 55 }
  },
  {
    name: "Resistance Band Elite Set",
    description: "Complete set of 5 variable tension snap-resistant latex bands, perfect for warm-ups, mobility, and accessory work.",
    category: "equipment",
    price: 45,
    stock: 140,
    imageUrl: "https://images.unsplash.com/photo-1598971639058-fab3c3109a73?w=800&h=800&fit=crop&q=80",
    brand: "FlexTech",
    isFeatured: false,
    ratings: { average: 4.6, count: 205 }
  },

  // ── APPAREL (6 ITEMS) ──────────────────────────────────────────────────
  {
    name: "Oversized Pump Cover Graphic Tee",
    description: "Premium heavy-weight 100% cotton tee cut in a dramatic oversized fit. The ultimate pre-pump warm-up layer.",
    category: "apparel",
    price: 35,
    stock: 95,
    imageUrl: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&h=800&fit=crop&q=80",
    brand: "AeroAthletics",
    isFeatured: true,
    ratings: { average: 4.8, count: 150 }
  },
  {
    name: "Stealth Compression Leggings",
    description: "High-performance compression fabric engineered to increase blood flow and wick moisture during extreme lower-body sessions.",
    category: "apparel",
    price: 45,
    stock: 60,
    imageUrl: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&h=800&fit=crop&q=80",
    brand: "AeroAthletics",
    isFeatured: false,
    ratings: { average: 4.7, count: 85 }
  },
  {
    name: "AeroKnit Performance Shorts",
    description: "Ultra-lightweight 5-inch inseam shorts featuring laser-cut ventilation holes and a secure zip pocket.",
    category: "apparel",
    price: 30,
    stock: 120,
    imageUrl: "https://images.unsplash.com/photo-1591350033013-87bb9e64ad73?w=800&h=800&fit=crop&q=80",
    brand: "AeroAthletics",
    isFeatured: false,
    ratings: { average: 4.8, count: 210 }
  },
  {
    name: "Ultra-Light Running Windbreaker",
    description: "Water-resistant, packable windbreaker. Offers maximum element protection with virtually zero weight penalty.",
    category: "apparel",
    price: 60,
    stock: 40,
    imageUrl: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&h=800&fit=crop&q=80",
    brand: "AeroAthletics",
    isFeatured: false,
    ratings: { average: 4.5, count: 65 }
  },
  {
    name: "Premium Cotton Drop-Shoulder Hoodie",
    description: "Luxuriously soft fleece interior wrapped in a structured drop-shoulder silhouette for the perfect pump cover.",
    category: "apparel",
    price: 55,
    stock: 50,
    imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800&h=800&fit=crop&q=80",
    brand: "AeroAthletics",
    isFeatured: true,
    ratings: { average: 4.9, count: 180 }
  },
  {
    name: "Seamless Core Sports Bra",
    description: "Medium-impact support constructed with a breathable seamless ribbed fabric for frictionless training.",
    category: "apparel",
    price: 40,
    stock: 85,
    imageUrl: "https://images.unsplash.com/photo-1538805060514-97d9cc25de68?w=800&h=800&fit=crop&q=80",
    brand: "AeroAthletics",
    isFeatured: false,
    ratings: { average: 4.7, count: 140 }
  },

  // ── FOOTWEAR (5 ITEMS) ──────────────────────────────────────────────────
  {
    name: "AeroKnit Performance Runners",
    description: "Breathable monomesh upper paired with a hyper-responsive foam midsole for PR-breaking sprints and 5K runs.",
    category: "footwear",
    price: 140,
    discountedPrice: 120,
    stock: 45,
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop&q=80",
    brand: "Velocity",
    isFeatured: true,
    ratings: { average: 4.8, count: 320 }
  },
  {
    name: "PowerLift Pro Weightlifting Shoes",
    description: "Engineered specifically for heavy squats and Oly lifts. Features an elevated hard TPU heel wedge and midfoot lockdown strap.",
    category: "footwear",
    price: 160,
    stock: 25,
    imageUrl: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&h=800&fit=crop&q=80",
    brand: "Ironclad Fitness",
    isFeatured: true,
    ratings: { average: 4.9, count: 112 }
  },
  {
    name: "Zero-Drop Barefoot Trainers",
    description: "Minimalist pure ground contact shoe featuring a wide toe box and zero-drop sole to build raw foot strength.",
    category: "footwear",
    price: 120,
    stock: 65,
    imageUrl: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&h=800&fit=crop&q=80",
    brand: "Velocity",
    isFeatured: false,
    ratings: { average: 4.7, count: 95 }
  },
  {
    name: "Elite Cross-Trainer V2",
    description: "The ultimate hybrid shoe. Firm enough heel for lifting, flexible enough forefoot for box jumps and short runs.",
    category: "footwear",
    price: 130,
    stock: 80,
    imageUrl: "https://images.unsplash.com/photo-1605408499391-6368c628ef42?w=800&h=800&fit=crop&q=80",
    brand: "Velocity",
    isFeatured: false,
    ratings: { average: 4.6, count: 150 }
  },
  {
    name: "Knit Recovery Slip-ons",
    description: "Cloud-like memory foam footbed housed in a breathable stretch-knit upper to pamper your feet post-workout.",
    category: "footwear",
    price: 85,
    stock: 110,
    imageUrl: "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=800&h=800&fit=crop&q=80",
    brand: "Velocity",
    isFeatured: false,
    ratings: { average: 4.8, count: 200 }
  },

  // ── ACCESSORIES (4 ITEMS) ──────────────────────────────────────────────────
  {
    name: "Leather Lifting Belt Pro",
    description: "10mm thick genuine leather powerlifting belt with a heavy-duty single prong steel buckle for maximum core bracing.",
    category: "accessories",
    price: 60,
    stock: 55,
    imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&h=800&fit=crop&q=80",
    brand: "Ironclad Fitness",
    isFeatured: true,
    ratings: { average: 4.9, count: 185 }
  },
  {
    name: "Liquid Chalk Refillable Bottle",
    description: "Mess-free pure magnesium carbonate liquid chalk. Dries in seconds, eliminates sweat, and won't get you kicked out of commercial gyms.",
    category: "accessories",
    price: 15,
    stock: 150,
    imageUrl: "https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=800&h=800&fit=crop&q=80",
    brand: "Foundation Formulations",
    isFeatured: false,
    ratings: { average: 4.8, count: 320 }
  },
  {
    name: "Stainless Steel Shaker Cup",
    description: "24oz double-wall vacuum insulated shaker bottle. Keeps supplements ice cold for 24 hours without absorbing bad odors.",
    category: "accessories",
    price: 25,
    stock: 120,
    imageUrl: "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=800&h=800&fit=crop&q=80",
    brand: "Titan Nutrition",
    isFeatured: false,
    ratings: { average: 4.7, count: 145 }
  },
  {
    name: "Heavy Duty Wrist Wraps",
    description: "18-inch stiff elastic wrist wraps providing unbreakable wrist support for heavy benching and overhead pressing.",
    category: "accessories",
    price: 20,
    stock: 90,
    imageUrl: "https://images.unsplash.com/photo-1550259979-ed79b48d2a30?w=800&h=800&fit=crop&q=80",
    brand: "Ironclad Fitness",
    isFeatured: false,
    ratings: { average: 4.8, count: 190 }
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("-----------------------------------------");
    console.log("🍃 MongoDB Connected for Seeding Operation");
    console.log("-----------------------------------------");

    console.log("🗑️  Purging existing products...");
    await Product.deleteMany();
    console.log("✅  Success: Products collection cleared.");

    console.log("📦 Injecting 30 high-fidelity commercial products...");
    await Product.insertMany(products);
    console.log("✅  Success: 30 Products successfully injected.");

    console.log("-----------------------------------------");
    console.log("🎉 SEED OPERATION COMPLETE. Exiting...");
    console.log("-----------------------------------------");
    process.exit(0);
  } catch (error) {
    console.error("❌ SEED OPERATION FAILED!", error);
    process.exit(1);
  }
};

seedDatabase();
