import {
  Role,
  SystemRole,
  UserStatus,
  ActiveRole,
  JobSource,
  JobStatus,
  ApplicationStatus,
  PaymentMethod,
  PaymentStatus,
  PaymentProvider,
  PaymentAccountStatus,
  ReviewerRole,
  ReportReason,
  ReportStatus,
  NotificationType,
} from "@prisma/client";
import { prisma } from "../src/lib/prisma";

/**
 * ServiceHub Ethiopian Marketplace High-Volume Database Seeder
 *
 * Simulates a realistic service marketplace in Addis Ababa, Ethiopia.
 * Covers all Prisma models, enums, edge-cases, bidding wars, and lifecycles.
 */
async function main() {
  console.log("🌱 Starting ServiceHub Database Seeder...");

  // =========================================================================
  // 1. IDEMPOTENT CLEANUP (Strict Reverse-Relational Dependency Order)
  // =========================================================================
  const existingUsersCount = await prisma.user.count();
  const shouldForceClean =
    process.env.FORCE_CLEAN === "true" ||
    process.env.FORCE_SEED === "true" ||
    process.argv.includes("--force") ||
    process.argv.includes("--clean");

  if (existingUsersCount > 0 && !shouldForceClean) {
    console.log(
      `ℹ️ Database already contains ${existingUsersCount} user(s). Skipping destructive wipe to preserve records. Pass --clean or FORCE_CLEAN=true to re-seed.`,
    );
    return;
  }

  console.log("🧹 [1/8] Clearing existing data in reverse-relational order...");
  await prisma.$transaction([
    prisma.report.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.review.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.application.deleteMany(),
    prisma.job.deleteMany(),
    prisma.portfolio.deleteMany(),
    prisma.certificate.deleteMany(),
    prisma.paymentAccount.deleteMany(),
    prisma.service.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.worker.deleteMany(),
    prisma.customerProfile.deleteMany(),
    prisma.category.deleteMany(),
    prisma.user.deleteMany(),
  ]);
  console.log("✅ Previous data successfully wiped.");

  // =========================================================================
  // 2. CATEGORIES (Authentic Ethiopian Local Services)
  // =========================================================================
  console.log("📂 [2/8] Creating service categories...");
  const categoriesData = [
    {
      name: "Plumbing & Sanitary Systems",
      description:
        "Water leak diagnosis, PPR/PVC pipe fitting, reservoir tank installations, drain unclogging, and sanitary ware maintenance.",
    },
    {
      name: "Electrical Installation & Solar",
      description:
        "Residential wiring, distribution board repairs, solar panel & inverter setup, industrial motor maintenance, and backup generator wiring.",
    },
    {
      name: "Carpentry & Custom Woodwork",
      description:
        "Custom kitchen cabinetry, hardwood door installation, sofa/furniture restoration, and structural roof truss construction.",
    },
    {
      name: "House Cleaning & Deep Sanitation",
      description:
        "Post-construction site cleaning, residential deep scrubbing, sofa shampooing, water tank disinfection, and compound janitorial care.",
    },
    {
      name: "Appliance & Refrigerator Repair",
      description:
        "Automatic washing machine diagnosis, domestic and commercial cold room refrigeration, microwave ovens, and electric stove repairs.",
    },
    {
      name: "Academic Tutoring & Test Prep",
      description:
        "Grade 8/12 Ministry & EUEE exam prep, University entrance Mathematics, Physics, Spoken English, and introductory coding classes.",
    },
    {
      name: "Tech Support & Device Repair",
      description:
        "Laptop motherboard micro-soldering, smartphone display replacement, Wi-Fi mesh installation, CCTV security, and printer servicing.",
    },
    {
      name: "Wall Painting & Finishing",
      description:
        "Interior silk painting, weather-resistant exterior stucco, gypsum cornice detailing, waterproofing coats, and decorative finishes.",
    },
  ];

  const categories = await Promise.all(
    categoriesData.map((cat) => prisma.category.create({ data: cat })),
  );

  const [
    catPlumbing,
    catElectrical,
    catCarpentry,
    catCleaning,
    catAppliance,
    catTutoring,
    catTech,
    catPainting,
  ] = categories;

  console.log(`✅ ${categories.length} service categories established.`);

  // =========================================================================
  // 3. USERS, CUSTOMER PROFILES & WORKERS (Edge Cases & Status Matrix)
  // =========================================================================
  console.log(
    "👥 [3/8] Seeding diverse users, workers, and status edge cases...",
  );

  // --- 3.1 Super Admin User ---
  const _adminUser = await prisma.user.create({
    data: {
      name: "Yohannes Bekele",
      email: "admin.yohannes@servicehub.et",
      phone: "+251911001122",
      telegramId: "tg_admin_yohannes",
      systemRole: SystemRole.ADMIN,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      lastActiveRole: ActiveRole.CUSTOMER,
      isOnboarded: true,
      birthdate: new Date("1985-03-12"),
      gender: "MALE",
      avatarUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
      customerProfile: {
        create: {
          bio: "Platform Administrator & Operations Lead for ServiceHub Ethiopia.",
          profilePhoto:
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
          ratingAvg: 5.0,
        },
      },
    },
    include: { customerProfile: true },
  });

  // --- 3.2 Highly Decorated Pro Worker (5.0 Rating, Multiple Certs, Active Chapa) ---
  const workerAbebe = await prisma.user.create({
    data: {
      name: "Abebe Bikila",
      email: "abebe.plumbing@servicehub.et",
      phone: "+251911223344",
      telegramId: "tg_abebe_bikila",
      systemRole: SystemRole.USER,
      role: Role.WORKER,
      status: UserStatus.ACTIVE,
      lastActiveRole: ActiveRole.WORKER,
      isOnboarded: true,
      birthdate: new Date("1988-06-20"),
      gender: "MALE",
      avatarUrl:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
      customerProfile: {
        create: {
          bio: "Homeowner in Kazanchis seeking electrical and carpentry contractors.",
          ratingAvg: 4.9,
        },
      },
      worker: {
        create: {
          bio: "Licensed Master Plumber with over 14 years of hands-on experience handling high-rise residential complexes and industrial drainage across Addis Ababa.",
          experienceYears: 14,
          paymentRate: 450.0,
          availability: "Full-Time (Mon - Sat)",
          ratingAvg: 5.0,
          profilePhoto:
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
          paymentAccount: {
            create: {
              provider: PaymentProvider.CHAPA,
              providerAccountId: "chapa_acc_abebe_9921",
              status: PaymentAccountStatus.ACTIVE,
            },
          },
          services: {
            create: [
              {
                categoryId: catPlumbing.id,
                name: "Emergency Leak Detection & Repair",
                description:
                  "High-pressure pipe leak troubleshooting, wall-embedded repair, and fixture replacements.",
                price: 500.0,
              },
              {
                categoryId: catPlumbing.id,
                name: "Water Pump & Overhead Tank Setup",
                description:
                  "Submersible and surface booster pump installation with automatic float switch sensors.",
                price: 1200.0,
              },
            ],
          },
          portfolios: {
            create: [
              {
                title: "Bole Medhanialem Luxury Villa Plumbing Overhaul",
                description:
                  "Replaced aged galvanized iron pipes with multi-layer PPR system with zero wall damage.",
                imageUrl:
                  "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80",
              },
              {
                title: "CMC Apartment Block Drainage Renovation",
                description:
                  "Upgraded centralized greywater and blackwater main stacks for a 16-unit building.",
                imageUrl:
                  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80",
              },
            ],
          },
          certificates: {
            create: [
              {
                title:
                  "National TVET Certificate Level IV in Sanitary Engineering",
                fileUrl:
                  "https://servicehub-assets.et/certificates/abebe_tvet_level4.pdf",
                issuedDate: new Date("2016-08-15"),
              },
              {
                title:
                  "Ethio-German Technical Cooperation Master Plumber License",
                fileUrl:
                  "https://servicehub-assets.et/certificates/abebe_german_master.pdf",
                issuedDate: new Date("2019-11-20"),
              },
            ],
          },
        },
      },
    },
    include: { worker: true, customerProfile: true },
  });

  // --- 3.3 Top Rated Electrical & Solar Pro ---
  const workerBethlehem = await prisma.user.create({
    data: {
      name: "Bethlehem Tadesse",
      email: "betty.solar@servicehub.et",
      phone: "+251911334455",
      telegramId: "tg_betty_tadesse",
      systemRole: SystemRole.USER,
      role: Role.WORKER,
      status: UserStatus.ACTIVE,
      lastActiveRole: ActiveRole.WORKER,
      isOnboarded: true,
      birthdate: new Date("1991-09-14"),
      gender: "FEMALE",
      avatarUrl:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
      customerProfile: {
        create: {
          bio: "Tech entrepreneur hiring local specialists for commercial building upkeep.",
          ratingAvg: 4.8,
        },
      },
      worker: {
        create: {
          bio: "Certified Electrical Engineer specializing in hybrid solar systems, three-phase distribution, and emergency backup generator synchronizers.",
          experienceYears: 9,
          paymentRate: 500.0,
          availability: "Flexible (On-Call & Scheduled)",
          ratingAvg: 4.9,
          profilePhoto:
            "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
          paymentAccount: {
            create: {
              provider: PaymentProvider.CHAPA,
              providerAccountId: "chapa_acc_betty_7712",
              status: PaymentAccountStatus.ACTIVE,
            },
          },
          services: {
            create: [
              {
                categoryId: catElectrical.id,
                name: "Residential Solar & Inverter Installation",
                description:
                  "Complete off-grid and grid-tied solar setup with lithium-ion battery management.",
                price: 2500.0,
              },
              {
                categoryId: catElectrical.id,
                name: "Breaker Panel & Short Circuit Troubleshooting",
                description:
                  "Comprehensive load balancing, surge protector installation, and wiring diagnostics.",
                price: 650.0,
              },
            ],
          },
          portfolios: {
            create: [
              {
                title: "10kW Hybrid Solar Installation in Old Airport",
                description:
                  "Equipped a medical clinic with zero-interruption solar backup using 16 Tier-1 monocrystalline panels.",
                imageUrl:
                  "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80",
              },
            ],
          },
          certificates: {
            create: [
              {
                title:
                  "Ethiopian Electric Utility (EEU) Certified Grade-A Electrician",
                fileUrl:
                  "https://servicehub-assets.et/certificates/eeu_grade_a.pdf",
                issuedDate: new Date("2018-04-10"),
              },
            ],
          },
        },
      },
    },
    include: { worker: true, customerProfile: true },
  });

  // --- 3.4 Expert Carpenter & Woodwork Pro ---
  const workerDawit = await prisma.user.create({
    data: {
      name: "Dawit Mengistu",
      email: "dawit.woodcraft@servicehub.et",
      phone: "+251911445566",
      telegramId: "tg_dawit_mengistu",
      systemRole: SystemRole.USER,
      role: Role.WORKER,
      status: UserStatus.ACTIVE,
      lastActiveRole: ActiveRole.WORKER,
      isOnboarded: true,
      birthdate: new Date("1986-12-05"),
      gender: "MALE",
      avatarUrl:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
      customerProfile: {
        create: {
          bio: "Villa owner in Sarbet looking for interior painters and landscapers.",
          ratingAvg: 4.75,
        },
      },
      worker: {
        create: {
          bio: "Artisan Carpenter crafting high-end Turkish-style kitchen cabinets, custom mahogany doors, and acoustic wooden wall panels.",
          experienceYears: 11,
          paymentRate: 400.0,
          availability: "Full-Time",
          ratingAvg: 4.8,
          profilePhoto:
            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
          paymentAccount: {
            create: {
              provider: PaymentProvider.CHAPA,
              providerAccountId: "chapa_acc_dawit_5511",
              status: PaymentAccountStatus.ACTIVE,
            },
          },
          services: {
            create: [
              {
                categoryId: catCarpentry.id,
                name: "Custom Kitchen Cabinetry & Countertop Fitting",
                description:
                  "Moisture-proof MDF and solid wood cabinets with soft-close German hinges.",
                price: 3500.0,
              },
            ],
          },
          portfolios: {
            create: [
              {
                title: "Bespoke Walnut Kitchen Fitting in Gerji",
                description:
                  "Designed, manufactured, and installed modular kitchen cabinets with quartz stone surfaces.",
                imageUrl:
                  "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80",
              },
            ],
          },
        },
      },
    },
    include: { worker: true, customerProfile: true },
  });

  // --- 3.5 Deep Cleaning Specialist ---
  const workerSelamawit = await prisma.user.create({
    data: {
      name: "Selamawit Desta",
      email: "selam.cleaning@servicehub.et",
      phone: "+251911556677",
      telegramId: "tg_selam_desta",
      systemRole: SystemRole.USER,
      role: Role.WORKER,
      status: UserStatus.ACTIVE,
      lastActiveRole: ActiveRole.WORKER,
      isOnboarded: true,
      birthdate: new Date("1994-02-18"),
      gender: "FEMALE",
      avatarUrl:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
      customerProfile: {
        create: {
          bio: "Event planner hiring venue cleaners and furniture movers.",
          ratingAvg: 5.0,
        },
      },
      worker: {
        create: {
          bio: "Specialist in industrial steam cleaning, hospital-grade sanitization, post-renovation debris clearing, and sofa upholstery care.",
          experienceYears: 6,
          paymentRate: 250.0,
          availability: "7 Days a Week",
          ratingAvg: 4.95,
          profilePhoto:
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
          paymentAccount: {
            create: {
              provider: PaymentProvider.CHAPA,
              providerAccountId: "chapa_acc_selam_3344",
              status: PaymentAccountStatus.ACTIVE,
            },
          },
          services: {
            create: [
              {
                categoryId: catCleaning.id,
                name: "Full Home Deep Cleaning & Disinfection",
                description:
                  "Floor machine scrubbing, kitchen degreasing, bathroom descaling, and window washing.",
                price: 800.0,
              },
            ],
          },
        },
      },
    },
    include: { worker: true, customerProfile: true },
  });

  // --- 3.6 Tech Support & IT Specialist ---
  const workerHenok = await prisma.user.create({
    data: {
      name: "Henok Girma",
      email: "henok.tech@servicehub.et",
      phone: "+251911667788",
      telegramId: "tg_henok_girma",
      systemRole: SystemRole.USER,
      role: Role.WORKER,
      status: UserStatus.ACTIVE,
      lastActiveRole: ActiveRole.WORKER,
      isOnboarded: true,
      birthdate: new Date("1996-05-22"),
      gender: "MALE",
      avatarUrl:
        "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
      customerProfile: {
        create: {
          bio: "Looking for reputable technicians for home appliance maintenance.",
          ratingAvg: 4.5,
        },
      },
      worker: {
        create: {
          bio: "Computer hardware technician & network architect with Cisco CCNA credentials. Specialized in data recovery and office fiber cabling.",
          experienceYears: 5,
          paymentRate: 350.0,
          availability: "Weekdays & Saturday",
          ratingAvg: 4.7,
          profilePhoto:
            "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80",
          services: {
            create: [
              {
                categoryId: catTech.id,
                name: "Office Wi-Fi Networking & CCTV Installation",
                description:
                  "Router configuration, cat6 cabling, POE switch setup, and IP camera cloud integration.",
                price: 1500.0,
              },
              {
                categoryId: catTech.id,
                name: "Laptop Motherboard & Display Repair",
                description:
                  "Micro-soldering, component diagnosis, and genuine screen replacement.",
                price: 800.0,
              },
            ],
          },
        },
      },
    },
    include: { worker: true, customerProfile: true },
  });

  // --- 3.7 Academic Tutor Pro (5.0 Perfect Rating) ---
  const _workerYared = await prisma.user.create({
    data: {
      name: "Yared Nuguse",
      email: "yared.tutor@servicehub.et",
      phone: "+251911778899",
      telegramId: "tg_yared_nuguse",
      systemRole: SystemRole.USER,
      role: Role.WORKER,
      status: UserStatus.ACTIVE,
      lastActiveRole: ActiveRole.WORKER,
      isOnboarded: true,
      birthdate: new Date("1995-10-30"),
      gender: "MALE",
      avatarUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
      customerProfile: {
        create: {
          bio: "Parent in Summit looking for music and language tutors.",
          ratingAvg: 5.0,
        },
      },
      worker: {
        create: {
          bio: "Addis Ababa University Physics graduate with 6 years of proven track record helping high school students score in the 95th percentile on national exams.",
          experienceYears: 6,
          paymentRate: 300.0,
          availability: "Evenings & Weekends",
          ratingAvg: 5.0,
          profilePhoto:
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
          services: {
            create: [
              {
                categoryId: catTutoring.id,
                name: "High School Physics & Calculus Coaching",
                description:
                  "Comprehensive concept breakdown, past exam paper drills, and weekly progress assessments.",
                price: 1200.0,
              },
              {
                categoryId: catTutoring.id,
                name: "Grade 12 Ministry & EUEE Exam Prep",
                description:
                  "Targeted practice drills and past exam walkthroughs.",
                price: 950.0,
              },
            ],
          },
        },
      },
    },
    include: { worker: true, customerProfile: true },
  });

  // --- 3.8 Extreme Rating Variance Worker (1.2 Rating, Disputed History) ---
  const workerKebede = await prisma.user.create({
    data: {
      name: "Kebede Michael",
      email: "kebede.m@servicehub.et",
      phone: "+251911889900",
      telegramId: "tg_kebede_m",
      systemRole: SystemRole.USER,
      role: Role.WORKER,
      status: UserStatus.ACTIVE,
      lastActiveRole: ActiveRole.WORKER,
      isOnboarded: true,
      birthdate: new Date("1984-01-11"),
      gender: "MALE",
      avatarUrl:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
      customerProfile: {
        create: {
          bio: "Customer in Ayat seeking painting contracts.",
          ratingAvg: 2.0,
        },
      },
      worker: {
        create: {
          bio: "General repair worker offering plumbing and electrical services around Piassa.",
          experienceYears: 2,
          paymentRate: 150.0,
          availability: "Irregular",
          ratingAvg: 1.2, // Extreme low rating edge case
          profilePhoto:
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
          paymentAccount: {
            create: {
              provider: PaymentProvider.CHAPA,
              providerAccountId: "chapa_acc_kebede_rejected",
              status: PaymentAccountStatus.REJECTED,
            },
          },
          services: {
            create: [
              {
                categoryId: catPlumbing.id,
                name: "Basic Drain Cleaning",
                description: "Manual drain cleaning.",
                price: 150.0,
              },
            ],
          },
        },
      },
    },
    include: { worker: true, customerProfile: true },
  });

  // --- 3.9 Painting & Finishing Pro (Genet Alemu) ---
  const _workerGenet = await prisma.user.create({
    data: {
      name: "Genet Alemu",
      email: "genet.alemu@servicehub.et",
      phone: "+251911990011",
      telegramId: "tg_genet_alemu",
      systemRole: SystemRole.USER,
      role: Role.WORKER,
      status: UserStatus.ACTIVE,
      lastActiveRole: ActiveRole.WORKER,
      isOnboarded: true,
      birthdate: new Date("1998-04-03"),
      gender: "FEMALE",
      avatarUrl:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
      customerProfile: {
        create: {
          bio: "Looking for local cleaning and carpentry services in Bole Bulbula.",
          ratingAvg: 5.0,
        },
      },
      worker: {
        create: {
          bio: "Experienced interior and exterior decorative painter specializing in silk emulsion, stucco textures, and precision gypsum cornice finishes.",
          experienceYears: 4,
          paymentRate: 280.0,
          availability: "Full-Time (Mon - Sat)",
          ratingAvg: 4.85,
          profilePhoto:
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
          services: {
            create: [
              {
                categoryId: catPainting.id,
                name: "Interior Silk & Exterior Stucco Wall Painting",
                description:
                  "Surface preparation, undercoat priming, and flawless two-coat finish.",
                price: 450.0,
              },
              {
                categoryId: catPainting.id,
                name: "Gypsum Cornice Detailing & Textured Accent Walls",
                description:
                  "Ceiling cornice painting and textured decorative accent walls.",
                price: 650.0,
              },
            ],
          },
          portfolios: {
            create: [
              {
                title: "Modern Emerald Accent Wall & Silk Finish in Summit",
                description:
                  "Applied velvet-touch textured emerald accent wall with crisp white trim.",
                imageUrl:
                  "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop&q=80",
              },
            ],
          },
        },
      },
    },
    include: { worker: true, customerProfile: true },
  });

  // --- 3.10 Master Appliance & Refrigerator Specialist (Kassahun Melaku) ---
  const _workerKassahun = await prisma.user.create({
    data: {
      name: "Kassahun Melaku",
      email: "kassahun.appliance@servicehub.et",
      phone: "+251911998877",
      telegramId: "tg_kassahun_m",
      systemRole: SystemRole.USER,
      role: Role.WORKER,
      status: UserStatus.ACTIVE,
      lastActiveRole: ActiveRole.WORKER,
      isOnboarded: true,
      birthdate: new Date("1988-06-15"),
      gender: "MALE",
      avatarUrl:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
      customerProfile: {
        create: {
          bio: "Commercial kitchen manager hiring specialists.",
          ratingAvg: 4.9,
        },
      },
      worker: {
        create: {
          bio: "Certified refrigeration and kitchen appliance expert with 12 years repairing domestic & industrial cold rooms, washing machines, and electric ovens.",
          experienceYears: 12,
          paymentRate: 400.0,
          availability: "Full-Time (Mon - Sun)",
          ratingAvg: 4.95,
          profilePhoto:
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80",
          paymentAccount: {
            create: {
              provider: PaymentProvider.CHAPA,
              providerAccountId: "chapa_acc_kassahun_8811",
              status: PaymentAccountStatus.ACTIVE,
            },
          },
          services: {
            create: [
              {
                categoryId: catAppliance.id,
                name: "Commercial & Domestic Refrigerator Repair",
                description:
                  "Compressor replacement, refrigerant leak troubleshooting, and electronic controller fixes.",
                price: 850.0,
              },
              {
                categoryId: catAppliance.id,
                name: "Automatic Washing Machine & Dryer Overhaul",
                description:
                  "Drum bearing replacement, motor repair, inlet valve, and drainage pump servicing.",
                price: 600.0,
              },
            ],
          },
          portfolios: {
            create: [
              {
                title: "Industrial Bakery Walk-In Chiller Overhaul",
                description:
                  "Repaired dual-compressor cooling circuit and replaced digital temperature control board.",
                imageUrl:
                  "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80",
              },
            ],
          },
        },
      },
    },
    include: { worker: true, customerProfile: true },
  });

  // --- 3.10 Primary Frequent Customer (Rahel Getachew) ---
  const customerRahel = await prisma.user.create({
    data: {
      name: "Rahel Getachew",
      email: "rahel.getachew@servicehub.et",
      phone: "+251922112233",
      telegramId: "tg_rahel_g",
      systemRole: SystemRole.USER,
      role: Role.CUSTOMER,
      status: UserStatus.ACTIVE,
      lastActiveRole: ActiveRole.CUSTOMER,
      isOnboarded: true,
      birthdate: new Date("1989-07-25"),
      gender: "FEMALE",
      avatarUrl:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
      customerProfile: {
        create: {
          bio: "Real estate property manager and boutique commercial space owner in Bole Atlas.",
          ratingAvg: 4.9,
          profilePhoto:
            "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
        },
      },
    },
    include: { customerProfile: true },
  });

  // --- 3.11 Residential Customer (Solomon Bogale) ---
  const customerSolomon = await prisma.user.create({
    data: {
      name: "Solomon Bogale",
      email: "solomon.b@servicehub.et",
      phone: "+251922334455",
      telegramId: "tg_solomon_b",
      systemRole: SystemRole.USER,
      role: Role.CUSTOMER,
      status: UserStatus.ACTIVE,
      lastActiveRole: ActiveRole.CUSTOMER,
      isOnboarded: true,
      birthdate: new Date("1982-11-19"),
      gender: "MALE",
      avatarUrl:
        "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80",
      customerProfile: {
        create: {
          bio: "Homeowner in CMC Michael looking for trusted renovation pros.",
          ratingAvg: 5.0,
        },
      },
    },
    include: { customerProfile: true },
  });

  // --- 3.12 Startup Customer (Meron Tefera) ---
  const customerMeron = await prisma.user.create({
    data: {
      name: "Meron Tefera",
      email: "meron.tefera@servicehub.et",
      phone: "+251922445566",
      telegramId: "tg_meron_t",
      systemRole: SystemRole.USER,
      role: Role.CUSTOMER,
      status: UserStatus.ACTIVE,
      lastActiveRole: ActiveRole.CUSTOMER,
      isOnboarded: true,
      birthdate: new Date("1993-08-08"),
      gender: "FEMALE",
      customerProfile: {
        create: {
          bio: "Operations Director at Kazanchis Co-Working Space.",
          ratingAvg: 4.85,
        },
      },
    },
    include: { customerProfile: true },
  });

  // --- 3.13 Suspended User Edge Case (Daniel Demissie) ---
  const userSuspendedDaniel = await prisma.user.create({
    data: {
      name: "Daniel Demissie",
      email: "daniel.d@servicehub.et",
      phone: "+251922556677",
      telegramId: "tg_daniel_suspended",
      systemRole: SystemRole.USER,
      role: Role.CUSTOMER,
      status: UserStatus.SUSPENDED, // Suspended Edge Case
      lastActiveRole: ActiveRole.CUSTOMER,
      isOnboarded: true,
      birthdate: new Date("1990-01-01"),
      gender: "MALE",
      customerProfile: {
        create: {
          bio: "Account suspended pending fraud investigation.",
          ratingAvg: 1.0,
        },
      },
    },
    include: { customerProfile: true },
  });

  // --- 3.14 Pending / Incomplete Onboarding User (Tigist Assefa) ---
  const userPendingTigist = await prisma.user.create({
    data: {
      name: "Tigist Assefa",
      email: "tigist.a@servicehub.et",
      phone: null, // Missing optional phone
      telegramId: "tg_tigist_pending",
      systemRole: SystemRole.USER,
      role: Role.CUSTOMER,
      status: UserStatus.PENDING, // Pending state
      lastActiveRole: ActiveRole.CUSTOMER,
      isOnboarded: false, // Incomplete onboarding
      birthdate: null,
      gender: null,
      avatarUrl: null, // Missing avatar
      customerProfile: {
        create: {
          bio: null, // Missing bio
          ratingAvg: 0.0,
        },
      },
    },
    include: { customerProfile: true },
  });

  console.log(
    `✅ 15 Users created across ACTIVE, PENDING, SUSPENDED states, Admin, Pro, and Ghost profiles.`,
  );

  // =========================================================================
  // 4. JOBS & LIFECYCLE MATRIX (All JobStatus & JobSource Variations)
  // =========================================================================
  console.log("📋 [4/8] Seeding full Job lifecycle matrix & edge cases...");

  // 4.1 Job 1: COMPLETED with Paid Escrow & High Bid Bidding War
  const jobCompletedPlumbing = await prisma.job.create({
    data: {
      customerId: customerRahel.customerProfile!.id,
      categoryId: catPlumbing.id,
      source: JobSource.POSTING,
      title: "Commercial Restaurant Grease Trap & Main Drainage Overhaul",
      description:
        "Our Bole commercial kitchen needs complete drainage descaling, PPR line replacement for 4 commercial dishwashers, and new heavy-duty grease traps before city inspection.",
      budget: 4500.0,
      status: JobStatus.COMPLETED,
      assignedWorkerId: workerAbebe.worker!.id,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    },
  });

  // 4.2 Job 2: IN_PROGRESS Job with Escrow in PAID state
  const jobInProgressSolar = await prisma.job.create({
    data: {
      customerId: customerMeron.customerProfile!.id,
      categoryId: catElectrical.id,
      source: JobSource.POSTING,
      title: "5kW Solar Inverter & Battery Bank Installation for Office",
      description:
        "Need clean installation of a 5kW Growatt hybrid inverter and two 48V 100Ah lithium iron phosphate battery packs at our Kazanchis co-working hub.",
      budget: 3200.0,
      status: JobStatus.IN_PROGRESS,
      assignedWorkerId: workerBethlehem.worker!.id,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  // 4.3 Job 3: ACCEPTED Direct-Hire Job (Waiting to start)
  const jobAcceptedDirectCarpentry = await prisma.job.create({
    data: {
      customerId: customerSolomon.customerProfile!.id,
      targetWorkerId: workerDawit.worker!.id,
      source: JobSource.DIRECT,
      categoryId: catCarpentry.id,
      title: "Direct Hire: Custom Solid Walnut Bookshelf Wall Unit",
      description:
        "Direct booking for Master Dawit to build floor-to-ceiling bookshelves in our study room. Materials already on site.",
      budget: 2800.0,
      status: JobStatus.ACCEPTED,
      assignedWorkerId: workerDawit.worker!.id,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  // 4.4 Job 4: PENDING Direct-Hire Job (Awaiting Worker Response)
  const jobPendingDirectCleaning = await prisma.job.create({
    data: {
      customerId: customerRahel.customerProfile!.id,
      targetWorkerId: workerSelamawit.worker!.id,
      source: JobSource.DIRECT,
      categoryId: catCleaning.id,
      title: "Direct Booking: Weekend Full Villa Deep Cleaning",
      description:
        "Requesting Selamawit's specialized team for full weekend post-event sanitization and floor waxing.",
      budget: 1500.0,
      status: JobStatus.PENDING,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  // 4.5 Job 5: DECLINED Direct-Hire Job
  const jobDeclinedDirectTech = await prisma.job.create({
    data: {
      customerId: customerSolomon.customerProfile!.id,
      targetWorkerId: workerHenok.worker!.id,
      source: JobSource.DIRECT,
      categoryId: catTech.id,
      title: "Emergency Laptop Chipset Soldering",
      description:
        "Urgent same-day graphics chip reflow on Dell XPS workstation.",
      budget: 700.0,
      status: JobStatus.DECLINED,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  // 4.6 Job 6: CANCELLED Job by Customer
  const jobCancelledPainting = await prisma.job.create({
    data: {
      customerId: customerSolomon.customerProfile!.id,
      categoryId: catPainting.id,
      source: JobSource.POSTING,
      title: "Exterior Compound Wall Weatherproofing Paint",
      description:
        "Need full pressure wash and 2 coats of elastomeric weatherproofing paint along 45 meters of perimeter stone wall.",
      budget: 2200.0,
      status: JobStatus.CANCELLED,
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    },
  });

  // 4.7 Job 7: OPEN Active Marketplace Job with Bidding War
  const jobOpenBiddingWar = await prisma.job.create({
    data: {
      customerId: customerRahel.customerProfile!.id,
      categoryId: catCleaning.id,
      source: JobSource.POSTING,
      title: "Bole Commercial Complex Post-Renovation Deep Sanitation",
      description:
        "Four-story office building requires dust extraction, exterior window cradle cleaning, and floor polishing before tenant move-in.",
      budget: 5000.0,
      status: JobStatus.OPEN,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  // 4.8 Job 8: OPEN Edge Case with ZERO Applications
  const _jobOpenZeroApps = await prisma.job.create({
    data: {
      customerId: customerMeron.customerProfile!.id,
      categoryId: catTutoring.id,
      source: JobSource.POSTING,
      title: "University Level Linear Algebra & Differential Equations Tutor",
      description:
        "Seeking an advanced Mathematics graduate for weekend 1-on-1 tutoring sessions in Kazanchis.",
      budget: 1800.0,
      status: JobStatus.OPEN, // Zero applications edge case
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(
    `✅ 8 Jobs created covering all JobStatus, JobSource, and edge cases.`,
  );

  // =========================================================================
  // 5. APPLICATIONS & REALISTIC BIDDING WARS (Requirement 4)
  // =========================================================================
  console.log(
    "📝 [5/8] Generating applications, bidding wars, and text durations...",
  );

  // --- Applications for Job 1 (Completed) ---
  const appCompletedAbebe = await prisma.application.create({
    data: {
      jobId: jobCompletedPlumbing.id,
      workerId: workerAbebe.worker!.id,
      proposedPrice: 4200.0,
      estimatedTime: "3 days",
      status: ApplicationStatus.ACCEPTED,
      createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.application.create({
    data: {
      jobId: jobCompletedPlumbing.id,
      workerId: workerKebede.worker!.id,
      proposedPrice: 4800.0,
      estimatedTime: "1 week",
      status: ApplicationStatus.REJECTED,
      createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
    },
  });

  // --- Applications for Job 2 (In Progress) ---
  const appInProgressBetty = await prisma.application.create({
    data: {
      jobId: jobInProgressSolar.id,
      workerId: workerBethlehem.worker!.id,
      proposedPrice: 3000.0,
      estimatedTime: "2 days",
      status: ApplicationStatus.ACCEPTED,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  // --- Applications for Job 7 (Active Bidding War with ACCEPTED, REJECTED, WITHDRAWN, PENDING) ---
  await prisma.application.create({
    data: {
      jobId: jobOpenBiddingWar.id,
      workerId: workerSelamawit.worker!.id,
      proposedPrice: 4600.0,
      estimatedTime: "4 days",
      status: ApplicationStatus.PENDING,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.application.create({
    data: {
      jobId: jobOpenBiddingWar.id,
      workerId: workerAbebe.worker!.id,
      proposedPrice: 5200.0,
      estimatedTime: "5 days",
      status: ApplicationStatus.PENDING,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.application.create({
    data: {
      jobId: jobOpenBiddingWar.id,
      workerId: workerKebede.worker!.id,
      proposedPrice: 3500.0,
      estimatedTime: "2 weeks",
      status: ApplicationStatus.REJECTED,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.application.create({
    data: {
      jobId: jobOpenBiddingWar.id,
      workerId: workerDawit.worker!.id,
      proposedPrice: 4800.0,
      estimatedTime: "1 week",
      status: ApplicationStatus.WITHDRAWN, // Withdrawn proposal edge case
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(
    `✅ Applications seeded with full bidding war dynamics and human-readable estimatedTime.`,
  );

  // =========================================================================
  // 6. PAYMENTS & ESCROW INVARIANTS (Requirement 5)
  // =========================================================================
  console.log(
    "💳 [6/8] Seeding payments across PAID, PENDING, and FAILED states...",
  );

  // 6.1 Verified PAID Payment for Completed Job (10% Commission)
  await prisma.payment.create({
    data: {
      jobId: jobCompletedPlumbing.id,
      applicationId: appCompletedAbebe.id,
      amount: 4200.0,
      currency: "ETB",
      method: PaymentMethod.CHAPA,
      status: PaymentStatus.PAID,
      txRef: `sh_tx_plumb_paid_${Date.now()}_01`,
      platformCommission: 420.0, // Exactly 10%
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    },
  });

  // 6.2 Verified PAID Payment for In-Progress Job in Escrow
  await prisma.payment.create({
    data: {
      jobId: jobInProgressSolar.id,
      applicationId: appInProgressBetty.id,
      amount: 3000.0,
      currency: "ETB",
      method: PaymentMethod.CHAPA,
      status: PaymentStatus.PAID,
      txRef: `sh_tx_solar_escrow_${Date.now()}_02`,
      platformCommission: 300.0,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  // 6.3 PENDING Payment for Accepted Job
  await prisma.payment.create({
    data: {
      jobId: jobAcceptedDirectCarpentry.id,
      amount: 2800.0,
      currency: "ETB",
      method: PaymentMethod.CHAPA,
      status: PaymentStatus.PENDING,
      txRef: `sh_tx_carpentry_pending_${Date.now()}_03`,
      platformCommission: 280.0,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  // 6.4 FAILED Payment Attempt for Cancelled Job
  await prisma.payment.create({
    data: {
      jobId: jobCancelledPainting.id,
      amount: 2200.0,
      currency: "ETB",
      method: PaymentMethod.CHAPA,
      status: PaymentStatus.FAILED,
      txRef: `sh_tx_failed_paint_${Date.now()}_04`,
      platformCommission: 220.0,
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    },
  });

  // 6.5 CASH Method Verified Payment
  await prisma.payment.create({
    data: {
      jobId: jobCompletedPlumbing.id,
      amount: 500.0,
      currency: "ETB",
      method: PaymentMethod.CASH,
      status: PaymentStatus.PAID,
      txRef: `sh_tx_cash_bonus_${Date.now()}_05`,
      platformCommission: 50.0,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(`✅ Payments populated with accurate platform commissions.`);

  // =========================================================================
  // 7. REVIEWS & ASYMMETRICAL SCENARIOS (Requirement 7)
  // =========================================================================
  console.log("⭐ [7/8] Generating symmetric & asymmetrical reviews...");

  // 7.1 Symmetric 5-Star Reviews on Completed Job
  await prisma.review.create({
    data: {
      jobId: jobCompletedPlumbing.id,
      customerId: customerRahel.customerProfile!.id,
      workerId: workerAbebe.worker!.id,
      reviewerRole: ReviewerRole.CUSTOMER_TO_WORKER,
      rating: 5,
      comment:
        "Master Abebe is an absolute master technician! Diagnosed the hidden pipe fracture immediately and finished the restaurant grease trap installation well ahead of schedule. Highly recommended!",
    },
  });

  await prisma.review.create({
    data: {
      jobId: jobCompletedPlumbing.id,
      customerId: customerRahel.customerProfile!.id,
      workerId: workerAbebe.worker!.id,
      reviewerRole: ReviewerRole.WORKER_TO_CUSTOMER,
      rating: 5,
      comment:
        "Wro. Rahel is a consummate professional client. Provided clear architectural blueprints and approved escrow milestone releases instantly upon completion.",
    },
  });

  // 7.2 Asymmetrical Review Scenario: Worker gives 5 stars, Customer gives 1 star
  const jobDisputedPlumbing = await prisma.job.create({
    data: {
      customerId: customerSolomon.customerProfile!.id,
      categoryId: catPlumbing.id,
      source: JobSource.POSTING,
      title: "Bole Medhanialem Guest Bathroom Shower Box Leakage",
      description: "Shower tray leaking into ground floor ceiling.",
      budget: 1500.0,
      status: JobStatus.COMPLETED,
      assignedWorkerId: workerKebede.worker!.id,
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.payment.create({
    data: {
      jobId: jobDisputedPlumbing.id,
      amount: 1500.0,
      currency: "ETB",
      method: PaymentMethod.CHAPA,
      status: PaymentStatus.PAID,
      txRef: `sh_tx_kebede_dispute_${Date.now()}_06`,
      platformCommission: 150.0,
    },
  });

  // Customer rates Worker 1 Star (Asymmetrical)
  await prisma.review.create({
    data: {
      jobId: jobDisputedPlumbing.id,
      customerId: customerSolomon.customerProfile!.id,
      workerId: workerKebede.worker!.id,
      reviewerRole: ReviewerRole.CUSTOMER_TO_WORKER,
      rating: 1,
      comment:
        "Terrible experience with Kebede. Showed up 4 hours late, damaged the bathroom tiles, and the leak returned the next morning. Refused to fix his mistakes.",
    },
  });

  // Worker rates Customer 5 Stars (Asymmetrical)
  await prisma.review.create({
    data: {
      jobId: jobDisputedPlumbing.id,
      customerId: customerSolomon.customerProfile!.id,
      workerId: workerKebede.worker!.id,
      reviewerRole: ReviewerRole.WORKER_TO_CUSTOMER,
      rating: 5,
      comment:
        "Friendly customer who provided coffee and paid immediately through the platform.",
    },
  });

  console.log(
    `✅ Reviews seeded with symmetrical and asymmetrical rating edge cases.`,
  );

  // =========================================================================
  // 8. MODERATION REPORTS & NOTIFICATIONS (Requirements 6 & 7)
  // =========================================================================
  console.log("🛡️ [8/8] Creating moderation reports and notification feeds...");

  // --- 8.1 Moderation Reports across all ReportReason & ReportStatus ---
  await prisma.report.create({
    data: {
      reporterId: customerRahel.id,
      reportedId: userSuspendedDaniel.id, // Targeting suspended user
      jobId: null,
      reason: ReportReason.SCAM,
      description:
        "User Daniel attempted to solicit an advance cash deposit off-platform and failed to show up for scheduled site inspection.",
      status: ReportStatus.RESOLVED,
    },
  });

  await prisma.report.create({
    data: {
      reporterId: customerSolomon.id,
      reportedId: workerKebede.id,
      jobId: jobDisputedPlumbing.id,
      reason: ReportReason.POOR_QUALITY,
      description:
        "Worker caused property damage to bathroom ceramic fixtures and delivered sub-standard pipe soldering.",
      status: ReportStatus.REVIEWED,
    },
  });

  await prisma.report.create({
    data: {
      reporterId: workerAbebe.id,
      reportedId: userSuspendedDaniel.id,
      reason: ReportReason.NO_SHOW,
      description:
        "Customer booked an emergency diagnostic slot and was unreachable for 3 hours after arrival at location.",
      status: ReportStatus.DISMISSED,
    },
  });

  await prisma.report.create({
    data: {
      reporterId: customerMeron.id,
      reportedId: workerKebede.id,
      reason: ReportReason.INAPPROPRIATE_BEHAVIOR,
      description:
        "Unprofessional verbal conduct during direct messaging on the platform.",
      status: ReportStatus.PENDING,
    },
  });

  await prisma.report.create({
    data: {
      reporterId: customerSolomon.id,
      reportedId: userPendingTigist.id,
      reason: ReportReason.OTHER,
      description:
        "Suspected duplicate bot account registering incomplete listings.",
      status: ReportStatus.PENDING,
    },
  });

  // --- 8.2 Notifications for All NotificationType Enums ---
  const notificationsData = [
    {
      customerProfileId: customerRahel.customerProfile!.id,
      title: "Direct Booking Accepted",
      message: `${workerAbebe.name} has accepted your direct booking request for "${jobCompletedPlumbing.title}".`,
      isRead: true,
      type: NotificationType.DIRECT_HIRE_ACCEPTED,
      link: `/customer/jobs/${jobCompletedPlumbing.id}`,
    },
    {
      customerProfileId: customerSolomon.customerProfile!.id,
      title: "Direct Booking Declined",
      message: `${workerHenok.name} was unavailable and declined direct hire request "${jobDeclinedDirectTech.title}".`,
      isRead: false,
      type: NotificationType.DIRECT_HIRE_DECLINED,
      link: `/customer/jobs/${jobDeclinedDirectTech.id}`,
    },
    {
      customerProfileId: customerRahel.customerProfile!.id,
      title: "New Bid Received",
      message: `${workerSelamawit.name} submitted a bid of 4,600 ETB on "${jobOpenBiddingWar.title}".`,
      isRead: false,
      type: NotificationType.NEW_PROPOSAL,
      link: `/customer/jobs/${jobOpenBiddingWar.id}`,
    },
    {
      workerId: workerBethlehem.worker!.id,
      title: "Proposal Accepted!",
      message: `Congratulations! Wro. Meron has accepted your proposal on "${jobInProgressSolar.title}".`,
      isRead: true,
      type: NotificationType.PROPOSAL_ACCEPTED,
      link: `/worker/jobs/${jobInProgressSolar.id}`,
    },
    {
      workerId: workerKebede.worker!.id,
      title: "Proposal Update",
      message: `Your proposal on "${jobOpenBiddingWar.title}" was not selected by the client.`,
      isRead: false,
      type: NotificationType.PROPOSAL_REJECTED,
      link: `/worker/applications`,
    },
    {
      workerId: workerSelamawit.worker!.id,
      title: "New Direct Hire Offer",
      message: `You received a direct hire booking request from Rahel Getachew for 1,500 ETB.`,
      isRead: false,
      type: NotificationType.DIRECT_HIRE,
      link: `/worker/jobs/${jobPendingDirectCleaning.id}`,
    },
    {
      customerProfileId: customerRahel.customerProfile!.id,
      title: "Job Marked Completed",
      message: `${workerAbebe.name} marked "${jobCompletedPlumbing.title}" as completed. Please review and release escrow.`,
      isRead: true,
      type: NotificationType.JOB_COMPLETED,
      link: `/customer/jobs/${jobCompletedPlumbing.id}`,
    },
    {
      workerId: workerAbebe.worker!.id,
      title: "New 5-Star Review",
      message: `Rahel Getachew left you a 5-star review: "Master Abebe is an absolute master technician..."`,
      isRead: true,
      type: NotificationType.NEW_REVIEW,
      link: `/worker/dashboard`,
    },
    {
      customerProfileId: customerMeron.customerProfile!.id,
      title: "Payment Escrow Confirmed",
      message: `Payment of 3,000 ETB for "${jobInProgressSolar.title}" is safely held in escrow.`,
      isRead: false,
      type: NotificationType.PAYMENT_SUCCESS,
      link: `/customer/checkout/${jobInProgressSolar.id}/success`,
    },
  ];

  await Promise.all(
    notificationsData.map((notif) =>
      prisma.notification.create({ data: notif }),
    ),
  );

  console.log(`✅ Reports and Notifications created across all enum states.`);

  console.log("\n============================================================");
  console.log("🎉 ServiceHub Database Seeding Completed Successfully!");
  console.log("============================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Seeding Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
