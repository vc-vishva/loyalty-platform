import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/**
 * Seed a demo admin, a demo member and a few spaces so the app is usable
 * immediately after `docker compose up`. Idempotent — safe to run repeatedly.
 */
async function main(): Promise<void> {
  const password = await bcrypt.hash('Password123', 8);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@cowork.dev' },
    update: {},
    create: { name: 'Admin', email: 'admin@cowork.dev', password, role: 'admin' },
  });

  const member = await prisma.user.upsert({
    where: { email: 'member@cowork.dev' },
    update: {},
    create: { name: 'Member', email: 'member@cowork.dev', password, role: 'member' },
  });

  const spaceCount = await prisma.space.count();
  if (spaceCount === 0) {
    await prisma.space.createMany({
      data: [
        {
          name: 'Hot Desk A1',
          type: 'desk',
          capacity: 1,
          description: 'Single hot desk near the window.',
          amenities: ['power', 'wifi', 'monitor'],
        },
        {
          name: 'Focus Desk B2',
          type: 'desk',
          capacity: 1,
          description: 'Quiet-zone desk with a standing option.',
          amenities: ['power', 'wifi', 'standing-desk'],
        },
        {
          name: 'Meeting Room Orion',
          type: 'meeting_room',
          capacity: 6,
          description: 'Glass meeting room with a display.',
          amenities: ['tv', 'whiteboard', 'wifi', 'video-conf'],
        },
        {
          name: 'Boardroom Vega',
          type: 'meeting_room',
          capacity: 12,
          description: 'Large boardroom for team sessions.',
          amenities: ['projector', 'whiteboard', 'wifi', 'video-conf'],
        },
      ],
    });
  }

  // eslint-disable-next-line no-console
  console.log('Seed complete:', { admin: admin.email, member: member.email });
}

main()
  .catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
