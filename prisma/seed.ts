import { Role, SystemRole } from "@prisma/client";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Cleaning up database...");
  await prisma.review.deleteMany();
  await prisma.application.deleteMany();
  await prisma.job.deleteMany();
  await prisma.service.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customerProfile.deleteMany();
  await prisma.portfolio.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.worker.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creating categories...");
  const catPlumbing = await prisma.category.create({
    data: { name: "Plumbing", description: "Pipe and water services" },
  });
  const catElectrical = await prisma.category.create({
    data: { name: "Electrical", description: "Wiring and electrical repairs" },
  });
  const catCleaning = await prisma.category.create({
    data: { name: "Cleaning", description: "Home and office cleaning" },
  });
  const catCarpentry = await prisma.category.create({
    data: { name: "Carpentry", description: "Woodwork and furniture" },
  });

  console.log("Creating users (with both customer and worker profiles)...");

  const users = [];

  for (let i = 1; i <= 15; i++) {
    const user = await prisma.user.create({
      data: {
        name: `User ${i}`,
        email: `user${i}@example.com`,
        phone: `+2519110000${i.toString().padStart(2, "0")}`,
        telegramId: `tg_${i}`,
        role: Role.CUSTOMER,
        systemRole: SystemRole.USER,
        lastActiveRole: i % 2 === 0 ? "WORKER" : "CUSTOMER",
        isOnboarded: true,
        customerProfile: {
          create: {
            bio: `Customer bio for User ${i}`,
            ratingAvg: 4.5,
          },
        },
        worker: {
          create: {
            bio: `Worker bio for User ${i}. Experienced professional.`,
            experienceYears: (i % 10) + 1,
            paymentRate: 150 + i * 10,
            ratingAvg: 4.0 + (i % 10) / 10,
            availability: "Full Time",
          },
        },
      },
      include: {
        customerProfile: true,
        worker: true,
      },
    });

    users.push(user);

    // Assign services to workers based on index
    if (user.worker) {
      await prisma.service.create({
        data: {
          categoryId: [catPlumbing, catElectrical, catCleaning, catCarpentry][
            i % 4
          ].id,
          providerId: user.worker.id,
          name: `Standard Service ${i}`,
          description: `High quality service provided by User ${i}`,
          price: 150 + i * 10,
        },
      });

      // Add portfolio
      await prisma.portfolio.create({
        data: {
          workerId: user.worker.id,
          title: `Project ${i}`,
          description: `Great project completed by User ${i}`,
          imageUrl: `https://picsum.photos/seed/${i}/400/300`,
        },
      });
    }
  }

  console.log("Creating Jobs and Applications...");
  for (let i = 0; i < 10; i++) {
    // User i is customer, User (i+1)%15 is worker
    const customer = users[i];
    const worker = users[(i + 1) % 15];
    const category = [catPlumbing, catElectrical, catCleaning, catCarpentry][
      i % 4
    ];

    const job = await prisma.job.create({
      data: {
        customerId: customer.customerProfile!.id,
        categoryId: category.id,
        title: `Need help with ${category.name}`,
        description: `Looking for a professional to help with ${category.name} tasks at my location.`,
        budget: 500 + i * 50,
        status:
          i % 3 === 0 ? "OPEN" : i % 3 === 1 ? "IN_PROGRESS" : "COMPLETED",
        assignedWorkerId: i % 3 !== 0 ? worker.worker!.id : null,
      },
    });

    if (job.status !== "OPEN") {
      await prisma.application.create({
        data: {
          jobId: job.id,
          workerId: worker.worker!.id,
          proposedPrice: 500 + i * 50,
          estimatedTime: "2 Days",
          status: "ACCEPTED",
        },
      });
    } else {
      // Just some pending applications for open jobs
      await prisma.application.create({
        data: {
          jobId: job.id,
          workerId: worker.worker!.id,
          proposedPrice: 550,
          estimatedTime: "3 Days",
          status: "PENDING",
        },
      });
    }
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
