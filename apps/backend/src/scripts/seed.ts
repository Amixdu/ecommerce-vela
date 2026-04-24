import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { IProductModuleService } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

export default async function seedData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
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
          prices: [{ currency_code: "usd", amount: 2500 }],
          options: { Size: "S" },
          inventory_quantity: 50,
          manage_inventory: true,
        },
        {
          title: "M",
          sku: "CWT-M",
          prices: [{ currency_code: "usd", amount: 2500 }],
          options: { Size: "M" },
          inventory_quantity: 100,
          manage_inventory: true,
        },
        {
          title: "L",
          sku: "CWT-L",
          prices: [{ currency_code: "usd", amount: 2500 }],
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
          prices: [{ currency_code: "usd", amount: 2500 }],
          options: { Size: "S" },
          inventory_quantity: 60,
          manage_inventory: true,
        },
        {
          title: "M",
          sku: "EBT-M",
          prices: [{ currency_code: "usd", amount: 2500 }],
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
