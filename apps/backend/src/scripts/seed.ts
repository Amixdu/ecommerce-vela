import { ExecArgs } from "@medusajs/framework/types";
import { IAuthModuleService, IProductModuleService } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createUsersWorkflow } from "@medusajs/core-flows";
import { setAuthAppMetadataStep } from "@medusajs/core-flows";

export default async function seedData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

  // ── Admin user ────────────────────────────────────────────────────────────
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    logger.info("Creating admin user...");

    const authService: IAuthModuleService = container.resolve(Modules.AUTH);

    // Register via the emailpass provider (handles scrypt hashing internally)
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
      // Create the user record
      const { result: users } = await createUsersWorkflow(container).run({
        input: { users: [{ email: adminEmail, first_name: "Admin" }] },
      });

      const user = users[0];

      // Link auth identity → user
      await setAuthAppMetadataStep.run?.({
        input: {
          authIdentityId: authIdentity.id,
          actorType: "user",
          value: user.id,
        },
        container,
        metadata: {},
        context: {},
      });

      logger.info(`Admin created: ${adminEmail}`);
    }
  } else {
    logger.warn(
      "SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD not set — skipping admin creation."
    );
  }

  // ── Products ───────────────────────────────────────────────────────────────
  const productService: IProductModuleService = container.resolve(
    Modules.PRODUCT
  );

  logger.info("Seeding product data...");

  const [category] = await productService.createProductCategories([
    { name: "T-Shirts", handle: "t-shirts" },
  ]);

  await productService.createProducts([
    {
      title: "Classic White Tee",
      handle: "classic-white-tee",
      description: "A timeless white t-shirt crafted from 100% organic cotton.",
      status: "published",
      categories: [{ id: category.id }],
      variants: [
        {
          title: "S",
          sku: "CWT-S",
          prices: [{ currency_code: "aud", amount: 25 }],
          options: { Size: "S" },
          inventory_quantity: 50,
          manage_inventory: true,
        },
        {
          title: "M",
          sku: "CWT-M",
          prices: [{ currency_code: "aud", amount: 25 }],
          options: { Size: "M" },
          inventory_quantity: 100,
          manage_inventory: true,
        },
        {
          title: "L",
          sku: "CWT-L",
          prices: [{ currency_code: "aud", amount: 25 }],
          options: { Size: "L" },
          inventory_quantity: 75,
          manage_inventory: true,
        },
      ],
      options: [{ title: "Size", values: ["S", "M", "L"] }],
    },
    {
      title: "Essential Black Tee",
      handle: "essential-black-tee",
      description: "A versatile black t-shirt for every occasion.",
      status: "published",
      categories: [{ id: category.id }],
      variants: [
        {
          title: "S",
          sku: "EBT-S",
          prices: [{ currency_code: "aud", amount: 25 }],
          options: { Size: "S" },
          inventory_quantity: 60,
          manage_inventory: true,
        },
        {
          title: "M",
          sku: "EBT-M",
          prices: [{ currency_code: "aud", amount: 25 }],
          options: { Size: "M" },
          inventory_quantity: 90,
          manage_inventory: true,
        },
      ],
      options: [{ title: "Size", values: ["S", "M", "L"] }],
    },
  ]);

  logger.info("Seeding complete.");
}
