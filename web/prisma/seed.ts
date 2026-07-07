import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { load as parseYaml } from "js-yaml";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { resolveChannel, ChannelNotFoundError } from "../lib/discovery/youtubeClient";

interface SeedUser {
  email: string;
  password: string;
  name: string;
}

function requiredSeedUsers(): SeedUser[] {
  const users: SeedUser[] = [];
  // SEED_USER1 is required; SEED_USER2 is optional (single-user setups).
  for (const n of [1, 2] as const) {
    const email = process.env[`SEED_USER${n}_EMAIL`];
    const password = process.env[`SEED_USER${n}_PASSWORD`];
    const name = process.env[`SEED_USER${n}_NAME`] ?? `Usuario ${n}`;
    if (!email || !password) {
      if (n === 1) {
        throw new Error(
          `Set SEED_USER${n}_EMAIL and SEED_USER${n}_PASSWORD in .env before seeding.`
        );
      }
      continue;
    }
    users.push({ email, password, name });
  }
  return users;
}

async function seedUsers() {
  for (const user of requiredSeedUsers()) {
    const passwordHash = await bcrypt.hash(user.password, 12);
    await prisma.user.upsert({
      where: { email: user.email },
      create: { email: user.email, passwordHash, name: user.name },
      update: { passwordHash, name: user.name },
    });
    console.log(`User ready: ${user.email}`);
  }
}

interface ChannelsYaml {
  channels: { id: string; alias: string }[];
}

async function seedChannelsFromYaml() {
  const yamlPath = join(
    process.cwd(),
    "..",
    "Api Youtube",
    "config",
    "channels.yaml"
  );

  let entries: ChannelsYaml["channels"];
  try {
    const raw = readFileSync(yamlPath, "utf-8");
    entries = (parseYaml(raw) as ChannelsYaml).channels ?? [];
  } catch (error) {
    console.warn(
      `Could not read ${yamlPath}, skipping legacy channel import: ${
        error instanceof Error ? error.message : error
      }`
    );
    return;
  }

  for (const entry of entries) {
    try {
      const info = await resolveChannel(entry.id);
      await prisma.channel.upsert({
        where: { youtubeChannelId: info.channelId },
        create: {
          youtubeChannelId: info.channelId,
          title: entry.alias || info.title,
          handle: info.handle,
          country: info.country,
          isCountryVerified: Boolean(info.country),
          subscriberCount: info.subscriberCount,
          channelPublishedAt: info.channelPublishedAt,
          uploadsPlaylistId: info.uploadsPlaylistId,
          thumbnailUrl: info.thumbnailUrl,
          source: "MANUAL_SEED",
          status: "CANDIDATE",
        },
        update: {},
      });
      console.log(`Seeded channel: ${entry.alias} (${info.channelId})`);
    } catch (error) {
      if (error instanceof ChannelNotFoundError) {
        console.warn(`Channel not found, skipping: ${entry.id}`);
      } else {
        console.warn(
          `Failed to resolve ${entry.id}: ${
            error instanceof Error ? error.message : error
          }`
        );
      }
    }
  }
}

async function main() {
  await seedUsers();

  if (!process.env.YOUTUBE_API_KEY && process.env.YOUTUBE_MOCK !== "true") {
    console.warn(
      "YOUTUBE_API_KEY is not set — skipping import of legacy channels.yaml. " +
        "Set YOUTUBE_API_KEY (or YOUTUBE_MOCK=true) and re-run `npm run db:seed` to import it."
    );
    return;
  }

  await seedChannelsFromYaml();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
