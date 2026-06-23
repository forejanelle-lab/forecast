import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/auth-helpers";
import { requireCastingSession } from "@/lib/api/guards";
import { getProjectsForCastingUser } from "@/lib/data/projects";
import { toPrismaProjectStatus } from "@/lib/prisma-mappers";
import { resolvePrismaProjectStatusForDeadline } from "@/lib/project-lifecycle";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const createSchema = z.object({
  title: z.string().min(1),
  productionCompany: z.string().min(1).optional(),
  projectType: z.string().min(1),
  unionStatus: z.string().optional(),
  location: z.string().optional(),
  submissionDeadline: z.string().optional(),
  shootDates: z.string().optional(),
  compensation: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["draft", "active", "archived", "completed"]).optional(),
});

export async function GET() {
  const sessionOrError = await requireCastingSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const projects = await getProjectsForCastingUser(sessionOrError.user.id);
  return apiSuccess({ projects });
}

export async function POST(request: Request) {
  const sessionOrError = await requireCastingSession();
  if (sessionOrError instanceof NextResponse) return sessionOrError;

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const data = parsed.data;
  const profile = await prisma.castingProfile.findUnique({
    where: { userId: sessionOrError.user.id },
    select: { company: true, officeName: true },
  });

  const submissionDeadline = data.submissionDeadline
    ? new Date(data.submissionDeadline)
    : null;
  const requestedStatus = toPrismaProjectStatus(data.status ?? "active") as
    "DRAFT" | "ACTIVE" | "ARCHIVED" | "COMPLETED";
  const resolvedStatus = resolvePrismaProjectStatusForDeadline(
    requestedStatus,
    submissionDeadline,
    data.status ? requestedStatus : undefined,
  );

  const project = await prisma.project.create({
    data: {
      title: data.title,
      productionCompany:
        data.productionCompany ??
        profile?.officeName ??
        profile?.company ??
        "Production",
      projectType: data.projectType,
      unionStatus: data.unionStatus,
      location: data.location,
      submissionDeadline,
      shootDates: data.shootDates,
      compensation: data.compensation,
      description: data.description,
      status: resolvedStatus,
      createdById: sessionOrError.user.id,
    },
  });

  return apiSuccess({ project: { id: project.id } }, 201);
}
