/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("crypto");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  const demoUserId = process.env.AUTH_DEMO_USER_ID || "00000000-0000-0000-0000-000000000001";
  const demoPassword = await bcrypt.hash("demo123", 10);

  await prisma.user.upsert({
    where: { id: demoUserId },
    update: { fullName: "Demo User", email: "demo@example.com", password: demoPassword },
    create: { id: demoUserId, fullName: "Demo User", email: "demo@example.com", password: demoPassword },
  });

  const companyTypes = [
    { code: "ESN", label: "ESN" },
    { code: "CLIENT_FINAL", label: "Client final" },
    { code: "PORTAGE", label: "Portage" },
    { code: "OTHER", label: "Autre" },
  ];

  for (const ct of companyTypes) {
    await prisma.companyType.upsert({
      where: { code: ct.code },
      update: { label: ct.label },
      create: ct,
    });
  }

  const channelTypes = [
    { code: "PHONE", label: "Téléphone" },
    { code: "EMAIL", label: "Email" },
    { code: "LINKEDIN", label: "LinkedIn" },
    { code: "OTHER", label: "Autre" },
  ];

  for (const ch of channelTypes) {
    await prisma.channelType.upsert({
      where: { code: ch.code },
      update: { label: ch.label },
      create: ch,
    });
  }

  // Seed exemple basique (optionnel)
  const companyId = randomUUID();
  const locationId = randomUUID();
  const contactId = randomUUID();
  const channelId = randomUUID();
  const opportunityId = randomUUID();
  const entretienId = randomUUID();

  await prisma.company.create({
    data: {
      id: companyId,
      name: "Acme Corp",
      typeCode: "CLIENT_FINAL",
      website: "https://acme.example.com",
      notes: "Entreprise démo",
      userId: demoUserId,
      locations: {
        create: [
          {
            id: locationId,
            label: "Siège",
            addressLine1: "1 Rue Principale",
            zipCode: "75001",
            city: "Paris",
            country: "France",
            isPrimary: true,
          },
        ],
      },
      contacts: {
        create: [
          {
            id: contactId,
            firstName: "Alice",
            lastName: "Martin",
            roleTitle: "CTO",
            channels: {
              create: [
                {
                  id: channelId,
                  channelTypeCode: "EMAIL",
                  value: "alice.martin@example.com",
                  label: "Pro",
                  isPrimary: true,
                },
              ],
            },
          },
        ],
      },
      opportunities: {
        create: [
          {
            id: opportunityId,
            title: "Développeur Next.js",
            description: "Candidature démo",
            userId: demoUserId,
            entretiens: {
              create: [
                {
                  id: entretienId,
                  date: new Date(),
                  userId: demoUserId,
                  contactChannelId: channelId,
                  contacts: {
                    create: [{ contactId }],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

