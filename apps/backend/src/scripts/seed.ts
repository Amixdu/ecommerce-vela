import { ExecArgs } from "@medusajs/framework/types";
import {
  IAuthModuleService,
  IFulfillmentModuleService,
  IInventoryService,
  IProductModuleService,
  IRegionModuleService,
  IStockLocationService,
} from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
  createUsersWorkflow,
  createProductsWorkflow,
  deleteProductsWorkflow,
  createShippingOptionsWorkflow,
  updateRegionsWorkflow,
} from "@medusajs/core-flows";

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
        protocol: "http",
      }
    );

    if (!success || !authIdentity) {
      logger.warn(`Admin auth identity skipped: ${error ?? "already exists"}`);
    } else {
      const { result: users } = await createUsersWorkflow(container).run({
        input: { users: [{ email: adminEmail, first_name: "Admin" }] },
      });
      await authService.updateAuthIdentities([{
        id: authIdentity.id,
        app_metadata: { user_id: users[0].id },
      }]);
      logger.info(`Admin created: ${adminEmail}`);
    }
  } else {
    logger.warn("SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD not set — skipping.");
  }

  // ── Region ──────────────────────────────────────────────────────────────────
  const regionService: IRegionModuleService = container.resolve(Modules.REGION);
  let existingRegions = await regionService.listRegions({});
  if (existingRegions.length === 0) {
    logger.info("Creating Australia region...");
    await regionService.createRegions([
      { name: "Australia", currency_code: "aud", countries: ["au"] },
    ]);
    existingRegions = await regionService.listRegions({});
    logger.info("Australia region created.");
  } else {
    logger.info("Region already exists, skipping.");
  }

  // Add Stripe as a payment provider for the region.
  // Provider ID format: pp_<provider-id>_<provider-id> — matches medusa-config.ts id: "stripe"
  const region = existingRegions[0];
  if (region) {
    try {
      await updateRegionsWorkflow(container).run({
        input: {
          selector: { id: region.id },
          update: { payment_providers: ["pp_stripe_stripe"] },
        },
      });
      logger.info("Stripe payment provider added to region.");
    } catch {
      logger.warn("Could not add Stripe to region — add it manually in admin: Settings → Regions.");
    }
  }

  // ── Stock Location ──────────────────────────────────────────────────────────
  const stockLocationService: IStockLocationService = container.resolve(
    Modules.STOCK_LOCATION
  );
  const existingLocations = await stockLocationService.listStockLocations({});
  let stockLocation = existingLocations[0];
  if (!stockLocation) {
    logger.info("Creating default stock location...");
    [stockLocation] = await stockLocationService.createStockLocations([
      { name: "Default Warehouse" },
    ]);
    logger.info("Stock location created.");
  } else {
    logger.info("Stock location already exists, skipping.");
  }

  // Link default sales channel → stock location so carts can check inventory
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL);
  const [defaultChannel] = await salesChannelService.listSalesChannels({});
  if (defaultChannel) {
    const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK);
    try {
      await remoteLink.create([
        {
          [Modules.SALES_CHANNEL]: { sales_channel_id: defaultChannel.id },
          [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
        },
      ]);
      logger.info("Linked sales channel → stock location.");
    } catch {
      logger.info("Sales channel → stock location link already exists.");
    }
  }

  // ── Shipping ────────────────────────────────────────────────────────────────
  // Medusa v2 requires a shipping method on the cart before it can be completed.
  // Setup: ShippingProfile → FulfillmentSet (linked to StockLocation) →
  //        ServiceZone (geo) → ShippingOption (free, AUD 0)
  const fulfillmentService: IFulfillmentModuleService = container.resolve(
    Modules.FULFILLMENT
  );
  const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK);

  // Shipping profile (products inherit this to mark them as shippable)
  const existingProfiles = await fulfillmentService.listShippingProfiles({});
  let shippingProfile = existingProfiles[0];
  if (!shippingProfile) {
    [shippingProfile] = await fulfillmentService.createShippingProfiles([
      { name: "Default", type: "default" },
    ]);
    logger.info("Created shipping profile.");
  } else {
    logger.info("Shipping profile already exists.");
  }

  // Fulfillment set (groups shipping options; linked to the stock location)
  const existingFulfillmentSets = await fulfillmentService.listFulfillmentSets({});
  let fulfillmentSet = existingFulfillmentSets[0];
  if (!fulfillmentSet) {
    [fulfillmentSet] = await fulfillmentService.createFulfillmentSets([
      { name: "Vela Shipping", type: "shipping" },
    ]);
    try {
      await remoteLink.create([
        {
          [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
          [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
        },
      ]);
    } catch {
      logger.info("Stock location → fulfillment set link may already exist.");
    }
    logger.info("Created fulfillment set.");
  } else {
    logger.info("Fulfillment set already exists.");
  }

  // Link the manual fulfillment provider to the stock location so that
  // createShippingOptionsWorkflow can validate "provider enabled for location"
  try {
    await remoteLink.create([
      {
        [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
        [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
      },
    ]);
    logger.info("Linked fulfillment provider → stock location.");
  } catch {
    logger.info("Fulfillment provider → stock location link may already exist.");
  }

  // Service zone (geographic coverage within the fulfillment set)
  const existingZones = await fulfillmentService.listServiceZones({
    fulfillment_set: { id: fulfillmentSet.id },
  });
  let serviceZone = existingZones[0];
  if (!serviceZone) {
    [serviceZone] = await fulfillmentService.createServiceZones([
      {
        name: "Australia",
        fulfillment_set_id: fulfillmentSet.id,
        geo_zones: [{ type: "country", country_code: "au" }],
      },
    ]);
    logger.info("Created service zone.");
  } else {
    logger.info("Service zone already exists.");
  }

  // Free shipping option within the service zone.
  // Must use createShippingOptionsWorkflow (not the service directly) so that
  // Medusa creates and links a PriceSet via the Pricing module. Without this,
  // adding a shipping method to a cart fails with "does not have a price".
  // Always delete and recreate to fix any stale priceless options.
  const existingOptions = await fulfillmentService.listShippingOptions({
    service_zone: { id: serviceZone.id },
  });
  if (existingOptions.length > 0) {
    await fulfillmentService.deleteShippingOptions(
      existingOptions.map((o) => o.id)
    );
    logger.info("Deleted stale shipping options.");
  }
  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Free Shipping",
        service_zone_id: serviceZone.id,
        shipping_profile_id: shippingProfile.id,
        provider_id: "manual_manual",
        type: { label: "Free", description: "Free shipping on all orders", code: "free" },
        price_type: "flat",
        prices: [{ currency_code: "aud", amount: 0 }],
      },
    ],
  });
  logger.info("Created Free Shipping option with pricing.");

  // ── Clean ───────────────────────────────────────────────────────────────────
  const productService: IProductModuleService = container.resolve(
    Modules.PRODUCT
  );

  if (clean) {
    logger.info("SEED_CLEAN=true — wiping existing products...");
    const allProducts = await productService.listProducts({});
    if (allProducts.length > 0) {
      await deleteProductsWorkflow(container).run({
        input: { ids: allProducts.map((p) => p.id) },
      });
      logger.info(`Deleted ${allProducts.length} products.`);
    }
    // Categories are NOT deleted — their handles have a unique constraint that
    // survives soft-deletes, blocking re-creation. Categories are static config
    // that doesn't change between seeds.
  }

  // ── Categories ──────────────────────────────────────────────────────────────
  const categoryDefs = [
    { name: "T-Shirts", handle: "t-shirts" },
    { name: "Hoodies & Sweatshirts", handle: "hoodies-sweatshirts" },
    { name: "Trousers", handle: "trousers" },
    { name: "Outerwear", handle: "outerwear" },
    { name: "Accessories", handle: "accessories" },
  ];

  // Hard-delete then recreate categories to avoid soft-delete unique constraint
  // conflicts. listProductCategories doesn't include handle in default fields,
  // so idempotency via Set comparison silently fails.
  const pgConnection = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as {
    raw: (sql: string, bindings?: unknown[]) => Promise<unknown>;
  };
  const handles = categoryDefs.map((c) => c.handle);
  const inPlaceholders = handles.map(() => "?").join(",");
  await pgConnection.raw(
    `DELETE FROM product_category WHERE handle IN (${inPlaceholders})`,
    handles
  );
  const allCats = await productService.createProductCategories(categoryDefs);
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
      input: {
        products: toCreate.map((p) => ({
          ...p,
          shipping_profile_id: shippingProfile.id,
        })),
      },
    });
    logger.info("Products created.");
  }

  // Backfill shipping profile for any existing products that were seeded
  // before this field was added — without it checkout throws
  // "cart items require shipping profiles not satisfied by shipping methods".
  const allProductsNow = await productService.listProducts({});
  let profileLinked = 0;
  for (const product of allProductsNow) {
    try {
      await remoteLink.create([
        {
          [Modules.PRODUCT]: { product_id: product.id },
          [Modules.FULFILLMENT]: { shipping_profile_id: shippingProfile.id },
        },
      ]);
      profileLinked++;
    } catch {
      // Link already exists — fine
    }
  }
  if (profileLinked > 0) {
    logger.info(`Linked shipping profile to ${profileLinked} products.`);
  } else {
    logger.info("All products already have a shipping profile.");
  }

  // ── Inventory Levels ────────────────────────────────────────────────────────
  // createProductsWorkflow creates InventoryItem records but not InventoryLevels.
  // Without levels at the stock location the "add to cart" check throws.
  const inventoryService: IInventoryService = container.resolve(
    Modules.INVENTORY
  );
  const allInventoryItems = await inventoryService.listInventoryItems({});
  const existingLevels = await inventoryService.listInventoryLevels({
    location_id: [stockLocation.id],
  });
  const coveredItemIds = new Set(
    existingLevels.map((l) => l.inventory_item_id)
  );
  const levelsToCreate = allInventoryItems
    .filter((item) => !coveredItemIds.has(item.id))
    .map((item) => ({
      inventory_item_id: item.id,
      location_id: stockLocation.id,
      stocked_quantity: 60,
    }));

  if (levelsToCreate.length > 0) {
    await inventoryService.createInventoryLevels(levelsToCreate);
    logger.info(`Created ${levelsToCreate.length} inventory levels.`);
  } else {
    logger.info("Inventory levels already up to date.");
  }

  logger.info("Seeding complete.");
}
