import fs from "fs";
import { faker } from "@faker-js/faker";
import fastCsv from "fast-csv";
import { formatDate } from "./src/utils/helpers.js";

const NUM_CUSTOMERS = 500;
const categories = [
  "Electronics",
  "Clothing",
  "Books",
  "Home & Kitchen",
  "Sports",
  "Toys",
];
const PRODUCTS_PER_CATEGORY = Math.ceil(50 / categories.length); // ~8-9 products per category
const NUM_PURCHASES = 5000;

// Generate structured products (~8-9 per category to get 50 total)
const products = categories.flatMap((category, categoryIndex) =>
  Array.from(
    {
      length:
        categoryIndex === categories.length - 1
          ? 50 - (categories.length - 1) * PRODUCTS_PER_CATEGORY // Adjust last category to get exactly 50
          : PRODUCTS_PER_CATEGORY,
    },
    (_, i) => ({
      id: categoryIndex * PRODUCTS_PER_CATEGORY + i + 1,
      name: faker.commerce.productName(),
      category: category,
      basePrice: faker.commerce.price({ min: 20, max: 400 }),
    })
  )
);

// Generate customer purchase data
const purchases = Array.from({ length: NUM_PURCHASES }, () => {
  const customerId = faker.number.int({ min: 1, max: NUM_CUSTOMERS });
  const product = faker.helpers.arrayElement(products);
  // Vary price slightly around base price
  const amount = (
    parseFloat(product.basePrice) *
    (0.9 + Math.random() * 0.2)
  ).toFixed(2);
  const date = formatDate(faker.date.past({ years: 2 }));

  return {
    customerId,
    productId: product.id,
    productName: product.name,
    productCategory: product.category,
    purchaseAmount: amount,
    purchaseDate: date,
  };
});

// Write to CSV
const writableStream = fs.createWriteStream("public/customer_purchases.csv");
const csvStream = fastCsv.format({ headers: true });

csvStream.pipe(writableStream);
purchases.forEach((purchase) => csvStream.write(purchase));
csvStream.end();
