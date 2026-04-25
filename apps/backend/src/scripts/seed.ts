import { ExecArgs } from "@medusajs/framework/types";
import {
  IAuthModuleService,
  IProductModuleService,
  IRegionModuleService,
} from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
  createUsersWorkflow,
  createProductsWorkflow,
  deleteProductsWorkflow,
} from "@medusajs/core-flows";
import { setAuthAppMetadataStep } from "@medusajs/core-flows";

const SIZE_S_TO_XL = ["S", "M", "L", "XL"];
const WAIST_SIZES = ["28", "30", "32", "34"];

function sizeVariants(
  skuPrefix: string,
  price: number,
  sizes: string[] = SIZE_S_TO_XL
) {
  return sizes.map((size) => ({
    title: size,
    sku: `${skuPrefix}-${size}`,
    prices: [{ currency_code: "aud", amount: price }],
    options: { Size: size },
    inventory_quantity: 60,
    manage_inventory: true,
  }));
}

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:9000";
const MEDIA_PUBLIC_URL = process.env.MEDIA_PUBLIC_URL;
const img = (filename: string) => {
  const base = MEDIA_PUBLIC_URL ?? `${BACKEND_URL}/static`;
  const url = `${base}/${filename}`;
  return { thumbnail: url, images: [{ url }] };
};

export default async function seedData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const clean = process.env.SEED_CLEAN === "true";

  // ── Admin user ──────────────────────────────────────────────────────────────
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    logger.info("Creating admin user...");
    const authService: IAuthModuleService = container.resolve(Modules.AUTH);

    const { success, authIdentity, error } = await authService.register(
      "emailpass",
      {
        body: { email: adminEmail, password: adminPassword },
        headers: {},
        query: {},
        authScope: "admin",
        protocol: "http",
      }
    );

    if (!success || !authIdentity) {
      logger.warn(`Admin auth identity skipped: ${error ?? "already exists"}`);
    } else {
      const { result: users } = await createUsersWorkflow(container).run({
        input: { users: [{ email: adminEmail, first_name: "Admin" }] },
      });
      await setAuthAppMetadataStep.run?.({
        input: {
          authIdentityId: authIdentity.id,
          actorType: "user",
          value: users[0].id,
        },
        container,
        metadata: {},
        context: {},
      });
      logger.info(`Admin created: ${adminEmail}`);
    }
  } else {
    logger.warn("SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD not set — skipping.");
  }

  // ── Region ──────────────────────────────────────────────────────────────────
  const regionService: IRegionModuleService = container.resolve(Modules.REGION);
  const existingRegions = await regionService.listRegions({});
  if (existingRegions.length === 0) {
    logger.info("Creating Australia region...");
    await regionService.createRegions([
      { name: "Australia", currency_code: "aud", countries: ["au"] },
    ]);
    logger.info("Australia region created.");
  } else {
    logger.info("Region already exists, skipping.");
  }

  // ── Clean ───────────────────────────────────────────────────────────────────
  const productService: IProductModuleService = container.resolve(
    Modules.PRODUCT
  );

  if (clean) {
    logger.info("SEED_CLEAN=true — wiping existing products and categories...");

    const allProducts = await productService.listProducts({});
    if (allProducts.length > 0) {
      await deleteProductsWorkflow(container).run({
        input: { ids: allProducts.map((p) => p.id) },
      });
      logger.info(`Deleted ${allProducts.length} products.`);
    }

    const allCats = await productService.listProductCategories({});
    if (allCats.length > 0) {
      await productService.deleteProductCategories(allCats.map((c) => c.id));
      logger.info(`Deleted ${allCats.length} categories.`);
    }
  }

  // ── Categories ──────────────────────────────────────────────────────────────
  const categoryDefs = [
    { name: "T-Shirts", handle: "t-shirts" },
    { name: "Hoodies & Sweatshirts", handle: "hoodies-sweatshirts" },
    { name: "Trousers", handle: "trousers" },
    { name: "Outerwear", handle: "outerwear" },
    { name: "Accessories", handle: "accessories" },
  ];

  const existingCats = await productService.listProductCategories({});
  const existingCatHandles = new Set(existingCats.map((c) => c.handle));
  const toCreateCats = categoryDefs.filter(
    (c) => !existingCatHandles.has(c.handle)
  );
  const newCats =
    toCreateCats.length > 0
      ? await productService.createProductCategories(toCreateCats)
      : [];

  const allCats = [...existingCats, ...newCats];
  const cat = (handle: string) => {
    const found = allCats.find((c) => c.handle === handle);
    if (!found) throw new Error(`Category not found: ${handle}`);
    return [{ id: found.id }];
  };

  // ── Products ────────────────────────────────────────────────────────────────
  const existingProducts = await productService.listProducts({});
  const existingHandles = new Set(existingProducts.map((p) => p.handle));

  const productDefs = [
    // ── T-Shirts ──────────────────────────────────────────────────────────────
    {
      title: "Classic White Tee",
      handle: "classic-white-tee",
      description:
        "A timeless white t-shirt cut from 100% organic cotton. Slightly relaxed through the body, finishing at the hip.",
      status: "published" as const,
      categories: cat("t-shirts"),
      options: [{ title: "Size", values: SIZE_S_TO_XL }],
      variants: sizeVariants("CWT", 45),
      ...img("white_tee.png"),
    },
    {
      title: "Essential Black Tee",
      handle: "essential-black-tee",
      description:
        "Our essential black tee in a mid-weight cotton jersey. The kind of piece you reach for without thinking.",
      status: "published" as const,
      categories: cat("t-shirts"),
      options: [{ title: "Size", values: SIZE_S_TO_XL }],
      variants: sizeVariants("EBT", 45),
      ...img("black_tee.png"),
    },
    {
      title: "Washed Grey Tee",
      handle: "washed-grey-tee",
      description:
        "Garment-washed for an effortlessly lived-in feel. Slightly oversized, in a cool heather grey.",
      status: "published" as const,
      categories: cat("t-shirts"),
      options: [{ title: "Size", values: SIZE_S_TO_XL }],
      variants: sizeVariants("WGT", 50),
      ...img("grey_tee.png"),
    },
    {
      title: "Slate Blue Tee",
      handle: "slate-blue-tee",
      description:
        "A muted slate blue that works as a neutral. Pigment-dyed organic cotton with a soft, broken-in hand feel.",
      status: "published" as const,
      categories: cat("t-shirts"),
      options: [{ title: "Size", values: SIZE_S_TO_XL }],
      variants: sizeVariants("SBT", 50),
      ...img("blue_tee.png"),
    },
    // ── Hoodies & Sweatshirts ─────────────────────────────────────────────────
    {
      title: "Heavyweight Hoodie",
      handle: "heavyweight-hoodie",
      description:
        "500gsm brushed fleece with a dropped shoulder and boxy fit. Built to be worn for years, not seasons.",
      status: "published" as const,
      categories: cat("hoodies-sweatshirts"),
      options: [{ title: "Size", values: SIZE_S_TO_XL }],
      variants: sizeVariants("HWH", 120),
      ...img("heavyweight_hoodie.png"),
    },
    {
      title: "Relaxed Crewneck",
      handle: "relaxed-crewneck",
      description:
        "A mid-weight French terry sweatshirt with a clean crew neck. No logos, no frills — just a great sweatshirt.",
      status: "published" as const,
      categories: cat("hoodies-sweatshirts"),
      options: [{ title: "Size", values: SIZE_S_TO_XL }],
      variants: sizeVariants("RCN", 95),
      ...img("relaxed_crewneck.png"),
    },
    // ── Trousers ──────────────────────────────────────────────────────────────
    {
      title: "Slim Chino",
      handle: "slim-chino",
      description:
        "Cut from a crisp cotton twill in a slim, tailored fit. Versatile enough to go from desk to dinner.",
      status: "published" as const,
      categories: cat("trousers"),
      options: [{ title: "Size", values: WAIST_SIZES }],
      variants: sizeVariants("SCH", 110, WAIST_SIZES),
      ...img("slim_chino.png"),
    },
    {
      title: "Linen Trousers",
      handle: "linen-trousers",
      description:
        "Wide-leg linen trousers with a drawstring waist. Cool, breathable, and effortlessly elegant.",
      status: "published" as const,
      categories: cat("trousers"),
      options: [{ title: "Size", values: SIZE_S_TO_XL }],
      variants: sizeVariants("LT", 130),
      ...img("linen_trousers.png"),
    },
    // ── Outerwear ─────────────────────────────────────────────────────────────
    {
      title: "Canvas Overshirt",
      handle: "canvas-overshirt",
      description:
        "A structured overshirt in a heavyweight cotton canvas. Wear it open as a light jacket or closed as a shirt.",
      status: "published" as const,
      categories: cat("outerwear"),
      options: [{ title: "Size", values: SIZE_S_TO_XL }],
      variants: sizeVariants("COS", 175),
      ...img("canvas_overshirt.png"),
    },
    {
      title: "Waxed Cotton Jacket",
      handle: "waxed-cotton-jacket",
      description:
        "A rugged waxed cotton jacket with a storm collar and two chest pockets. Water-resistant, windproof, and gets better with age.",
      status: "published" as const,
      categories: cat("outerwear"),
      options: [{ title: "Size", values: SIZE_S_TO_XL }],
      variants: sizeVariants("WCJ", 245),
      ...img("jacket.png"),
    },
    // ── Accessories ───────────────────────────────────────────────────────────
    {
      title: "Canvas Tote",
      handle: "canvas-tote",
      description:
        "A heavy-duty 12oz cotton canvas tote with reinforced handles. Holds a laptop, lunch, and everything else.",
      status: "published" as const,
      categories: cat("accessories"),
      options: [{ title: "Size", values: ["One Size"] }],
      variants: sizeVariants("CT", 55, ["One Size"]),
      ...img("canvas_tote.png"),
    },
  ];

  const toCreate = productDefs.filter((p) => !existingHandles.has(p.handle));

  if (toCreate.length === 0) {
    logger.info("All products already exist, skipping.");
  } else {
    logger.info(`Creating ${toCreate.length} products...`);
    await createProductsWorkflow(container).run({
      input: { products: toCreate },
    });
    logger.info("Products created.");
  }

  logger.info("Seeding complete.");
}
