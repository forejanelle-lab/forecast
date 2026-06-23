import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

const PASSWORD = "password123";

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function headshot(seed: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/400/500`;
}

async function clearAllData() {
  await prisma.conversationMessage.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.message.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditionSubmissionItem.deleteMany();
  await prisma.audition.deleteMany();
  await prisma.applicationSubmissionItem.deleteMany();
  await prisma.application.deleteMany();
  await prisma.savedRole.deleteMany();
  await prisma.actorHeadshot.deleteMany();
  await prisma.actorMedia.deleteMany();
  await prisma.actorLink.deleteMany();
  await prisma.credit.deleteMany();
  await prisma.profileView.deleteMany();
  await prisma.actorReferral.deleteMany();
  await prisma.role.deleteMany();
  await prisma.project.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.actorProfile.deleteMany();
  await prisma.castingProfile.deleteMany();
  await prisma.user.deleteMany();
}

type ActorSeed = {
  email: string;
  firstName: string;
  lastName: string;
  bio: string;
  location: string;
  gender: string;
  playingAgeMin: number;
  playingAgeMax: number;
  unionStatus: string;
  skills: string[];
  languages: string[];
  membership?: string;
  credits: { title: string; role: string; type: string; year: number }[];
};

type CastingSeed = {
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  officeName: string;
  title: string;
};

const ACTORS: ActorSeed[] = [
  {
    email: "maya@forecast.com",
    firstName: "Maya",
    lastName: "Chen",
    bio: "LA-based dramatic actor with theatre roots and strong self-tape skills. Drawn to grounded, emotionally honest material.",
    location: "Los Angeles, CA",
    gender: "Female",
    playingAgeMin: 26,
    playingAgeMax: 34,
    unionStatus: "SAG-AFTRA",
    skills: ["Drama", "Self-tape", "Improv", "Accents"],
    languages: ["English", "Mandarin"],
    credits: [
      { title: "Harbor Light", role: "Nina", type: "Feature", year: 2024 },
      { title: "Crosswalk", role: "Lead", type: "Short", year: 2023 },
    ],
  },
  {
    email: "janelle@forecast.com",
    firstName: "Janelle",
    lastName: "Fore",
    bio: "Versatile performer with comedy and drama experience. Comfortable with fast-turnaround audition workflows.",
    location: "New York, NY",
    gender: "Female",
    playingAgeMin: 28,
    playingAgeMax: 38,
    unionStatus: "SAG-AFTRA",
    skills: ["Comedy", "Drama", "Voice-over"],
    languages: ["English"],
    credits: [
      { title: "East River", role: "Supporting", type: "TV", year: 2025 },
      { title: "Stage Door", role: "Ensemble", type: "Theatre", year: 2022 },
    ],
  },
  {
    email: "marcus@forecast.com",
    firstName: "Marcus",
    lastName: "Rivera",
    bio: "Character actor specializing in grounded supporting roles. Former engineer — brings authenticity to technical roles.",
    location: "Atlanta, GA",
    gender: "Male",
    playingAgeMin: 32,
    playingAgeMax: 42,
    unionStatus: "SAG-AFTRA",
    skills: ["Drama", "Action", "Technical"],
    languages: ["English", "Spanish"],
    credits: [
      { title: "Signal Room", role: "Engineer", type: "Feature", year: 2024 },
    ],
  },
  {
    email: "elena@forecast.com",
    firstName: "Elena",
    lastName: "Brooks",
    bio: "Emerging actor building a reel in indie features. Premium member with featured profile visibility.",
    location: "Los Angeles, CA",
    gender: "Female",
    playingAgeMin: 22,
    playingAgeMax: 30,
    unionStatus: "Non-Union",
    skills: ["Drama", "Dance", "Singing"],
    languages: ["English"],
    membership: "PREMIUM",
    credits: [
      { title: "Summer Block", role: "Guest", type: "Web", year: 2025 },
    ],
  },
];

const CASTING_DIRECTORS: CastingSeed[] = [
  {
    email: "rachel@forecast.com",
    firstName: "Rachel",
    lastName: "Morrison",
    company: "Morrison Casting",
    officeName: "Morrison Casting",
    title: "Casting Director",
  },
  {
    email: "derek@forecast.com",
    firstName: "Derek",
    lastName: "Walsh",
    company: "Walsh Casting",
    officeName: "Walsh Casting",
    title: "Casting Associate",
  },
];

async function seedUsers(passwordHash: string) {
  const actorUsers = await Promise.all(
    ACTORS.map((actor) =>
      prisma.user.create({
        data: {
          email: actor.email,
          firstName: actor.firstName,
          lastName: actor.lastName,
          name: `${actor.firstName} ${actor.lastName}`,
          passwordHash,
          emailVerified: new Date(),
          role: "ACTOR",
          actorProfile: {
            create: {
              bio: actor.bio,
              location: actor.location,
              locations: [actor.location],
              gender: actor.gender,
              playingAgeMin: actor.playingAgeMin,
              playingAgeMax: actor.playingAgeMax,
              unionStatus: actor.unionStatus,
              membership: actor.membership ?? "FREE",
              profilePhotoUrl: headshot(actor.email),
              headshotUrl: headshot(actor.email),
              onboardingComplete: true,
              verified: actor.membership === "PREMIUM",
              featured: actor.membership === "PREMIUM",
              skills: actor.skills,
              languages: actor.languages,
              headshots: {
                create: [
                  {
                    label: "Primary headshot",
                    url: headshot(`${actor.email}-1`),
                    fileName: "headshot-primary.jpg",
                    featured: true,
                    sortOrder: 0,
                  },
                  {
                    label: "Theatrical",
                    url: headshot(`${actor.email}-2`),
                    fileName: "headshot-theatrical.jpg",
                    sortOrder: 1,
                  },
                ],
              },
              credits: { create: actor.credits },
              demoReelUrl:
                "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
              media: {
                create: [
                  {
                    label: "Demo reel",
                    type: "VIDEO",
                    category: "VIDEO",
                    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                    fileName: "demo-reel.mp4",
                    duration: "2:14",
                    sortOrder: 0,
                  },
                  {
                    label: "Dramatic scene",
                    type: "VIDEO",
                    category: "MATERIAL",
                    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
                    fileName: "scene-drama.mp4",
                    duration: "1:45",
                    sortOrder: 1,
                  },
                ],
              },
              links: {
                create: [
                  {
                    label: "Demo reel",
                    url: "https://example.com/demo-reel",
                    sortOrder: 0,
                  },
                ],
              },
            },
          },
        },
        include: { actorProfile: true },
      }),
    ),
  );

  const castingUsers = await Promise.all(
    CASTING_DIRECTORS.map((casting) =>
      prisma.user.create({
        data: {
          email: casting.email,
          firstName: casting.firstName,
          lastName: casting.lastName,
          name: `${casting.firstName} ${casting.lastName}`,
          passwordHash,
          emailVerified: new Date(),
          role: "CASTING",
          castingProfile: {
            create: {
              company: casting.company,
              officeName: casting.officeName,
              title: casting.title,
              phoneNumber: "(323) 555-0100",
              address: "Los Angeles, CA",
              onboardingComplete: true,
            },
          },
        },
      }),
    ),
  );

  return { actorUsers, castingUsers };
}

async function seedProjectsAndActivity(
  rachelId: string,
  derekId: string,
  actors: { id: string; email: string; name: string | null }[],
) {
  const maya = actors.find((a) => a.email === "maya@forecast.com")!;
  const janelle = actors.find((a) => a.email === "janelle@forecast.com")!;
  const marcus = actors.find((a) => a.email === "marcus@forecast.com")!;
  const elena = actors.find((a) => a.email === "elena@forecast.com")!;

  const signalDeadline = daysFromNow(45);
  const harborDeadline = daysFromNow(30);
  const cityLightsDeadline = daysFromNow(60);

  const lastSignal = await prisma.project.create({
    data: {
      title: "The Last Signal",
      status: "ACTIVE",
      productionCompany: "Morrison Casting",
      projectType: "Feature Film",
      unionStatus: "SAG-AFTRA",
      location: "Los Angeles, CA",
      submissionDeadline: signalDeadline,
      shootDates: "Aug 2026 – Oct 2026",
      description:
        "A character-driven drama about a radio astronomer who intercepts a signal that may rewrite humanity's place in the universe.",
      createdById: rachelId,
      roles: {
        create: [
          {
            characterName: "Dr. Elena Voss",
            playingAge: "35-45",
            gender: "Female",
            roleType: "Lead",
            status: "OPEN",
            submissionDeadline: signalDeadline,
            description: "Brilliant, guarded scientist leading the signal analysis team.",
            auditionInstructions:
              "Prepare a self-tape with the attached scenes. Focus on grounded, emotionally honest performances.",
          },
          {
            characterName: "Marcus Hale",
            playingAge: "28-38",
            gender: "Male",
            roleType: "Supporting",
            status: "OPEN",
            submissionDeadline: signalDeadline,
            description: "Elena's pragmatic engineer partner who challenges her isolation.",
          },
        ],
      },
    },
    include: { roles: true },
  });

  const midnightHarbor = await prisma.project.create({
    data: {
      title: "Midnight Harbor",
      status: "ACTIVE",
      productionCompany: "Morrison Casting",
      projectType: "Limited Series",
      unionStatus: "SAG-AFTRA",
      location: "New York, NY",
      submissionDeadline: harborDeadline,
      shootDates: "Jan – Mar 2027",
      description: "A noir mystery set in a coastal town where every resident has something to hide.",
      createdById: rachelId,
      roles: {
        create: [
          {
            characterName: "Detective Sarah Cole",
            playingAge: "30-40",
            gender: "Female",
            roleType: "Lead",
            status: "OPEN",
            submissionDeadline: harborDeadline,
            description: "Sharp, weary investigator returning to her hometown.",
          },
          {
            characterName: "Tommy Reyes",
            playingAge: "20-28",
            gender: "Male",
            roleType: "Supporting",
            status: "OPEN",
            submissionDeadline: harborDeadline,
            description: "Local dock worker with ties to the missing persons case.",
          },
        ],
      },
    },
    include: { roles: true },
  });

  const cityLights = await prisma.project.create({
    data: {
      title: "City Lights",
      status: "ACTIVE",
      productionCompany: "Walsh Casting",
      projectType: "Commercial",
      unionStatus: "SAG-AFTRA",
      location: "Atlanta, GA",
      submissionDeadline: cityLightsDeadline,
      shootDates: "Apr 2026",
      description: "National brand campaign seeking authentic, relatable talent.",
      createdById: derekId,
      roles: {
        create: [
          {
            characterName: "Everyday Hero",
            playingAge: "25-45",
            gender: "Any",
            roleType: "Principal",
            status: "OPEN",
            submissionDeadline: cityLightsDeadline,
            description: "Warm, approachable lead for a lifestyle spot.",
          },
        ],
      },
    },
    include: { roles: true },
  });

  const elenaVossRole = lastSignal.roles.find((r) => r.characterName === "Dr. Elena Voss")!;
  const marcusHaleRole = lastSignal.roles.find((r) => r.characterName === "Marcus Hale")!;
  const sarahColeRole = midnightHarbor.roles.find((r) => r.characterName === "Detective Sarah Cole")!;
  const everydayHeroRole = cityLights.roles[0];

  const mayaElenaApp = await prisma.application.create({
    data: {
      roleId: elenaVossRole.id,
      actorId: maya.id,
      status: "REVIEWING",
      submissionItems: {
        create: [
          {
            label: "Scene 1 — Observatory",
            fileName: "maya-scene1.mp4",
            fileUrl: headshot("maya-scene1"),
          },
          {
            label: "Slate",
            fileName: "maya-slate.mp4",
            fileUrl: headshot("maya-slate"),
          },
        ],
      },
    },
  });

  const janelleElenaApp = await prisma.application.create({
    data: {
      roleId: elenaVossRole.id,
      actorId: janelle.id,
      status: "SUBMITTED",
      submissionItems: {
        create: [
          {
            label: "Scene 1 — Observatory",
            fileName: "janelle-scene1.mp4",
            fileUrl: headshot("janelle-scene1"),
          },
        ],
      },
    },
  });

  const marcusMarcusApp = await prisma.application.create({
    data: {
      roleId: marcusHaleRole.id,
      actorId: marcus.id,
      status: "CALLBACK",
      submissionItems: {
        create: [
          {
            label: "Scene 2 — Lab",
            fileName: "marcus-scene2.mp4",
            fileUrl: headshot("marcus-scene2"),
          },
        ],
      },
    },
  });

  const janelleSarahApp = await prisma.application.create({
    data: {
      roleId: sarahColeRole.id,
      actorId: janelle.id,
      status: "AUDITION_REQUESTED",
    },
  });

  const elenaHeroApp = await prisma.application.create({
    data: {
      roleId: everydayHeroRole.id,
      actorId: elena.id,
      status: "SUBMITTED",
      submissionItems: {
        create: [
          {
            label: "Headshot",
            fileName: "elena-headshot.jpg",
            fileUrl: headshot("elena-headshot"),
          },
        ],
      },
    },
  });

  const mayaAudition = await prisma.audition.create({
    data: {
      roleId: sarahColeRole.id,
      actorId: maya.id,
      castingId: rachelId,
      status: "SUBMITTED",
      deadline: harborDeadline,
      location: "Self-tape",
      instructions: "Please submit scenes 2 and 3 from the attached sides.",
      scenes: ["Scene 2 — Pier", "Scene 3 — Interrogation"],
      uploadRequirements: ["Self-tape video", "Slate"],
      requestedAt: daysAgo(5),
      submissionItems: {
        create: [
          {
            label: "Scene 2 — Pier",
            fileName: "maya-pier.mp4",
            fileUrl: headshot("maya-pier"),
          },
        ],
      },
    },
  });

  const janelleAudition = await prisma.audition.create({
    data: {
      roleId: sarahColeRole.id,
      actorId: janelle.id,
      castingId: rachelId,
      status: "REQUESTED",
      deadline: harborDeadline,
      location: "Self-tape",
      instructions: "Upload your self-tape for Detective Sarah Cole by the deadline.",
      scenes: ["Scene 1 — Arrival"],
      uploadRequirements: ["Self-tape video"],
      requestedAt: daysAgo(2),
    },
  });

  const conversation = await prisma.conversation.create({
    data: {
      projectId: lastSignal.id,
      actorUserId: maya.id,
      castingUserId: rachelId,
      lastMessageAt: daysAgo(1),
      messages: {
        create: [
          {
            senderId: rachelId,
            body: "Hi Maya — thank you for your submission for Dr. Elena Voss. We'd love to discuss availability for a callback next week.",
            read: true,
            createdAt: daysAgo(2),
          },
          {
            senderId: maya.id,
            body: "Thank you so much! I'm available Tuesday through Thursday afternoon. Looking forward to it.",
            read: true,
            createdAt: daysAgo(1),
          },
        ],
      },
    },
  });

  const janelleConversation = await prisma.conversation.create({
    data: {
      projectId: lastSignal.id,
      actorUserId: janelle.id,
      castingUserId: rachelId,
      lastMessageAt: daysAgo(0),
      messages: {
        create: [
          {
            senderId: rachelId,
            body: "Hi Janelle — we're reviewing your materials for Elena Voss. Are you available for a brief Zoom this week?",
            read: false,
            createdAt: daysAgo(0),
          },
        ],
      },
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: maya.id,
        category: "MESSAGES",
        title: "New message",
        message: "Rachel Morrison sent you a message about The Last Signal.",
        read: false,
        createdAt: daysAgo(1),
      },
      {
        userId: maya.id,
        category: "AUDITIONS",
        title: "Audition requested",
        message: "You have a new audition request for Midnight Harbor.",
        read: false,
        createdAt: daysAgo(5),
      },
      {
        userId: janelle.id,
        category: "MESSAGES",
        title: "New message",
        message: "Rachel Morrison sent you a message about The Last Signal.",
        read: false,
      },
      {
        userId: rachelId,
        category: "APPLICATIONS",
        title: "New submission",
        message: "Janelle Fore submitted for Dr. Elena Voss.",
        read: false,
        createdAt: daysAgo(3),
      },
      {
        userId: rachelId,
        category: "APPLICATIONS",
        title: "New submission",
        message: "Marcus Rivera submitted for Marcus Hale.",
        read: true,
        createdAt: daysAgo(4),
      },
    ],
  });

  await prisma.profileView.createMany({
    data: [
      { actorUserId: maya.id, viewerUserId: rachelId, createdAt: daysAgo(7) },
      { actorUserId: maya.id, viewerUserId: rachelId, createdAt: daysAgo(3) },
      { actorUserId: janelle.id, viewerUserId: rachelId, createdAt: daysAgo(2) },
      { actorUserId: marcus.id, viewerUserId: rachelId, createdAt: daysAgo(5) },
      { actorUserId: elena.id, viewerUserId: derekId, createdAt: daysAgo(1) },
    ],
  });

  return {
    projects: { lastSignal, midnightHarbor, cityLights },
    applications: { mayaElenaApp, janelleElenaApp, marcusMarcusApp, janelleSarahApp, elenaHeroApp },
    auditions: { mayaAudition, janelleAudition },
    conversations: { conversation, janelleConversation },
  };
}

async function main() {
  console.log("Clearing all data...");
  await clearAllData();

  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const { actorUsers, castingUsers } = await seedUsers(passwordHash);

  const rachel = castingUsers.find((u) => u.email === "rachel@forecast.com")!;
  const derek = castingUsers.find((u) => u.email === "derek@forecast.com")!;

  const seeded = await seedProjectsAndActivity(rachel.id, derek.id, actorUsers);

  console.log("\nSeed complete — all tables cleared and mock data loaded.\n");
  console.log("Password for every account: " + PASSWORD + "\n");
  console.log("Casting directors:");
  for (const c of CASTING_DIRECTORS) {
    console.log(`  ${c.firstName} ${c.lastName} — ${c.email}`);
  }
  console.log("\nActors:");
  for (const a of ACTORS) {
    console.log(`  ${a.firstName} ${a.lastName} — ${a.email}`);
  }
  console.log("\nSample URLs:");
  console.log(`  Rachel dashboard:     /casting`);
  console.log(`  Maya dashboard:       /actor`);
  console.log(`  The Last Signal:      /projects/${seeded.projects.lastSignal.id}`);
  console.log(`  Submissions:          /casting/submissions`);
  console.log(`  Messages (Rachel):    /casting/messages`);
  console.log(`  Messages (Maya):      /actor/messages`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
