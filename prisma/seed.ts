import { Role, SystemRole } from "@prisma/client";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Cleaning up database...");
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
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
    data: {
      name: "Plumbing & Piping",
      description: "Leak repairs, pipe installations, drain cleaning, and bathroom fitting.",
    },
  });
  const catElectrical = await prisma.category.create({
    data: {
      name: "Electrical Systems",
      description: "Wiring, circuit breakers, lighting fixtures, and generator servicing.",
    },
  });
  const catCleaning = await prisma.category.create({
    data: {
      name: "Deep Cleaning & Janitorial",
      description: "Residential deep cleaning, office sanitization, and upholstery care.",
    },
  });
  const catCarpentry = await prisma.category.create({
    data: {
      name: "Carpentry & Woodwork",
      description: "Custom cabinetry, furniture repair, door hanging, and floor refinishing.",
    },
  });
  const catPainting = await prisma.category.create({
    data: {
      name: "Painting & Wall Finishes",
      description: "Interior/exterior wall painting, decorative finishes, and plastering.",
    },
  });

  const categories = [catPlumbing, catElectrical, catCleaning, catCarpentry, catPainting];

  console.log("Creating realistic users with dual profiles...");

  const realisticUsers = [
    {
      name: "Abebe Bikila",
      email: "abebe.bikila@servicehub.et",
      phone: "+251911223344",
      telegramId: "tg_abebe_b",
      customerBio: "Residential homeowner looking for high-quality, dependable maintenance.",
      workerBio: "Master Plumber with 12 years of experience in residential and commercial piping systems.",
      experienceYears: 12,
      rate: 350,
      rating: 4.9,
    },
    {
      name: "Bethelhem Tadesse",
      email: "betty.tadesse@servicehub.et",
      phone: "+251911334455",
      telegramId: "tg_betty_t",
      customerBio: "Office manager coordinating facility cleaning and electrical maintenance.",
      workerBio: "Certified Electrician specializing in power distribution and energy-efficient lighting.",
      experienceYears: 8,
      rate: 400,
      rating: 4.8,
    },
    {
      name: "Dawit Haile",
      email: "dawit.haile@servicehub.et",
      phone: "+251911445566",
      telegramId: "tg_dawit_h",
      customerBio: "Property developer managing residential rental units across Addis Ababa.",
      workerBio: "Professional Carpenter crafting bespoke furniture and structural woodwork.",
      experienceYears: 10,
      rate: 300,
      rating: 4.7,
    },
    {
      name: "Almaz Ayana",
      email: "almaz.ayana@servicehub.et",
      phone: "+251911556677",
      telegramId: "tg_almaz_a",
      customerBio: "Boutique store owner in Bole seeking prompt sanitization and decor services.",
      workerBio: "Specialist in commercial and domestic deep cleaning with eco-friendly solutions.",
      experienceYears: 6,
      rate: 220,
      rating: 4.9,
    },
    {
      name: "Chala Regassa",
      email: "chala.regassa@servicehub.et",
      phone: "+251911667788",
      telegramId: "tg_chala_r",
      customerBio: "Tech consultant hiring vetted local professionals for home improvements.",
      workerBio: "Interior Painter with expertise in modern textures, waterproofing, and spray finishes.",
      experienceYears: 9,
      rate: 280,
      rating: 4.6,
    },
  ];

  const createdUsers = [];

  for (let i = 0; i < realisticUsers.length; i++) {
    const u = realisticUsers[i];
    const user = await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        phone: u.phone,
        telegramId: u.telegramId,
        role: Role.CUSTOMER,
        systemRole: i === 0 ? SystemRole.ADMIN : SystemRole.USER,
        lastActiveRole: i % 2 === 0 ? "CUSTOMER" : "WORKER",
        isOnboarded: true,
        birthdate: new Date("1992-05-15"),
        gender: i % 2 === 0 ? "MALE" : "FEMALE",
        customerProfile: {
          create: {
            bio: u.customerBio,
            ratingAvg: 4.85,
          },
        },
        worker: {
          create: {
            bio: u.workerBio,
            experienceYears: u.experienceYears,
            paymentRate: u.rate,
            ratingAvg: u.rating,
            availability: "Full Time",
          },
        },
      },
      include: {
        customerProfile: true,
        worker: true,
      },
    });

    createdUsers.push(user);

    // Add service
    const category = categories[i % categories.length];
    await prisma.service.create({
      data: {
        categoryId: category.id,
        providerId: user.worker!.id,
        name: `${category.name} Specialist`,
        description: `Professional and licensed ${category.name.toLowerCase()} services by ${u.name}.`,
        price: u.rate,
      },
    });

    // Add portfolio
    await prisma.portfolio.create({
      data: {
        workerId: user.worker!.id,
        title: `${category.name} Renovation Project`,
        description: `Successfully completed milestone project with 100% client satisfaction.`,
        imageUrl: `https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=60`,
      },
    });

    // Add certificate
    await prisma.certificate.create({
      data: {
        workerId: user.worker!.id,
        title: `Certified ${category.name} Technician Level III`,
        fileUrl: `https://example.com/certificates/${user.id}.pdf`,
        issuedDate: new Date("2021-06-10"),
      },
    });
  }

  console.log("Creating Jobs, Contracts, Bidirectional Reviews, and Notifications...");

  for (let i = 0; i < createdUsers.length; i++) {
    const customer = createdUsers[i];
    const worker = createdUsers[(i + 1) % createdUsers.length];
    const category = categories[i % categories.length];

    // 1. Completed Contract with Bidirectional Reviews
    const completedJob = await prisma.job.create({
      data: {
        customerId: customer.customerProfile!.id,
        categoryId: category.id,
        title: `Comprehensive ${category.name} Overhaul`,
        description: `Completed contract for residential ${category.name.toLowerCase()} work.`,
        budget: 1200,
        status: "COMPLETED",
        assignedWorkerId: worker.worker!.id,
      },
    });

    await prisma.application.create({
      data: {
        jobId: completedJob.id,
        workerId: worker.worker!.id,
        proposedPrice: 1150,
        estimatedTime: "2 Days",
        status: "ACCEPTED",
      },
    });

    // Customer reviews Worker
    await prisma.review.create({
      data: {
        jobId: completedJob.id,
        customerId: customer.customerProfile!.id,
        workerId: worker.worker!.id,
        reviewerRole: "CUSTOMER_TO_WORKER",
        rating: 5,
        comment: `Outstanding service from ${worker.name}! Arrived on time, worked cleanly, and solved the issue permanently.`,
      },
    });

    // Worker reviews Customer
    await prisma.review.create({
      data: {
        jobId: completedJob.id,
        customerId: customer.customerProfile!.id,
        workerId: worker.worker!.id,
        reviewerRole: "WORKER_TO_CUSTOMER",
        rating: 5,
        comment: `Great collaboration with ${customer.name}. Clear requirements and prompt escrow milestone release.`,
      },
    });

    // Notifications
    await prisma.notification.create({
      data: {
        customerProfileId: customer.customerProfile!.id,
        title: "Job Contract Completed",
        message: `Your job "${completedJob.title}" has been marked completed by ${worker.name}.`,
        type: "JOB_COMPLETED",
        link: `/customer/jobs/${completedJob.id}`,
      },
    });

    await prisma.notification.create({
      data: {
        workerId: worker.worker!.id,
        title: "New Review Received",
        message: `${customer.name} left you a 5-star rating for "${completedJob.title}".`,
        type: "NEW_REVIEW",
        link: `/worker/dashboard`,
      },
    });

    // 2. Open Marketplace Job with Pending Applications
    const openJob = await prisma.job.create({
      data: {
        customerId: customer.customerProfile!.id,
        categoryId: category.id,
        title: `Urgent: ${category.name} Assistance Needed`,
        description: `Looking for an experienced professional to inspect and service ${category.name.toLowerCase()} in Bole area.`,
        budget: 650,
        status: "OPEN",
      },
    });

    await prisma.application.create({
      data: {
        jobId: openJob.id,
        workerId: worker.worker!.id,
        proposedPrice: 600,
        estimatedTime: "1 Day",
        status: "PENDING",
      },
    });

    await prisma.notification.create({
      data: {
        customerProfileId: customer.customerProfile!.id,
        title: "New Proposal Received",
        message: `${worker.name} submitted a bid of 600 ETB on "${openJob.title}".`,
        type: "NEW_PROPOSAL",
        link: `/customer/jobs/${openJob.id}`,
      },
    });
  }

  console.log("Database seeded successfully with rich multi-profile data!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
