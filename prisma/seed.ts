import { prisma } from "../src/lib/prisma";

const categories = [
  "Plumbing",
  "Electrical",
  "Cleaning",
  "Carpentry",
  "Painting",
  "Appliance Repair",
  "Moving",
  "Pest Control",
  "Gardening",
  "Roofing",
];

async function main() {
  console.log("Seeding service categories...");

  for (const name of categories) {
    await prisma.serviceCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
