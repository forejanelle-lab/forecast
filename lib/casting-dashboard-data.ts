import type { ProjectStatus } from "@/types";

export interface CastingKpi {
  id: string;
  label: string;
  value: string | number;
  change: number;
  trend: Array<{ label: string; value: number }>;
}

export interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
  conversionFromPrev?: number;
}

export interface ProjectPerformanceRow {
  id: string;
  name: string;
  status: ProjectStatus;
  submissions: number;
  pendingAuditionReview: number;
  reviewed: number;
  auditions: number;
  rolesBooked: number;
  deadline: string;
  healthScore: number;
  openRoles: number;
  roleCount: number;
}

export interface CastingActivity {
  id: string;
  avatar: string;
  user: string;
  action: string;
  highlight?: string;
  href?: string;
  timestamp: string;
}

export interface CastingInsight {
  id: string;
  type: "positive" | "warning" | "tip" | "success";
  emoji: string;
  message: string;
}

export interface CastingDeadline {
  id: string;
  title: string;
  projectTitle: string;
  type: "submission" | "audition" | "callback" | "shoot";
  date: string;
  overdue?: boolean;
}

export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  type: "audition" | "callback" | "shoot" | "deadline";
  projectTitle: string;
}

export interface DashboardNotification {
  id: string;
  label: string;
  count: number;
  href: string;
}

export const castingKpis: CastingKpi[] = [
  {
    id: "active-projects",
    label: "Active Projects",
    value: 6,
    change: 12,
    trend: [
      { label: "Jan", value: 3 },
      { label: "Feb", value: 4 },
      { label: "Mar", value: 4 },
      { label: "Apr", value: 5 },
      { label: "May", value: 5 },
      { label: "Jun", value: 6 },
    ],
  },
  {
    id: "open-roles",
    label: "Open Roles",
    value: 14,
    change: 8,
    trend: [
      { label: "Jan", value: 8 },
      { label: "Feb", value: 10 },
      { label: "Mar", value: 11 },
      { label: "Apr", value: 12 },
      { label: "May", value: 13 },
      { label: "Jun", value: 14 },
    ],
  },
  {
    id: "total-submissions",
    label: "Total Submissions",
    value: 342,
    change: 18,
    trend: [
      { label: "Jan", value: 180 },
      { label: "Feb", value: 210 },
      { label: "Mar", value: 245 },
      { label: "Apr", value: 278 },
      { label: "May", value: 310 },
      { label: "Jun", value: 342 },
    ],
  },
  {
    id: "pending-reviews",
    label: "Pending Reviews",
    value: 47,
    change: -6,
    trend: [
      { label: "Jan", value: 62 },
      { label: "Feb", value: 58 },
      { label: "Mar", value: 54 },
      { label: "Apr", value: 51 },
      { label: "May", value: 49 },
      { label: "Jun", value: 47 },
    ],
  },
  {
    id: "audition-requests",
    label: "Audition Requests Sent",
    value: 23,
    change: 15,
    trend: [
      { label: "Jan", value: 10 },
      { label: "Feb", value: 12 },
      { label: "Mar", value: 14 },
      { label: "Apr", value: 18 },
      { label: "May", value: 20 },
      { label: "Jun", value: 23 },
    ],
  },
  {
    id: "callbacks",
    label: "Callbacks Scheduled",
    value: 12,
    change: 22,
    trend: [
      { label: "Jan", value: 4 },
      { label: "Feb", value: 5 },
      { label: "Mar", value: 6 },
      { label: "Apr", value: 8 },
      { label: "May", value: 10 },
      { label: "Jun", value: 12 },
    ],
  },
  {
    id: "roles-filled",
    label: "Roles Filled",
    value: 4,
    change: 33,
    trend: [
      { label: "Jan", value: 1 },
      { label: "Feb", value: 2 },
      { label: "Mar", value: 2 },
      { label: "Apr", value: 3 },
      { label: "May", value: 3 },
      { label: "Jun", value: 4 },
    ],
  },
  {
    id: "avg-time",
    label: "Avg. Time to Cast",
    value: "18 days",
    change: -42,
    trend: [
      { label: "Jan", value: 32 },
      { label: "Feb", value: 28 },
      { label: "Mar", value: 26 },
      { label: "Apr", value: 22 },
      { label: "May", value: 20 },
      { label: "Jun", value: 18 },
    ],
  },
];

export interface ProjectFunnel {
  projectId: string;
  projectName: string;
  deadline: string;
  stages: FunnelStage[];
}

export const projectFunnels: ProjectFunnel[] = [];

export const submissionFunnel: FunnelStage[] = [
  { stage: "Submitted", count: 342, percentage: 100, conversionFromPrev: 100 },
  { stage: "Reviewed", count: 198, percentage: 58, conversionFromPrev: 58 },
  { stage: "Shortlisted", count: 89, percentage: 26, conversionFromPrev: 45 },
  { stage: "Audition Requested", count: 34, percentage: 10, conversionFromPrev: 38 },
  { stage: "Callback", count: 12, percentage: 3.5, conversionFromPrev: 35 },
  { stage: "Booked", count: 4, percentage: 1.2, conversionFromPrev: 33 },
];

export const projectPerformanceRows: ProjectPerformanceRow[] = [];

export const castingActivities: CastingActivity[] = [
  {
    id: "a1",
    avatar: "EW",
    user: "Emily",
    action: "reviewed 18 submissions for",
    highlight: "Midnight Harbor",
    href: "/projects/p1",
    timestamp: "2026-06-17T09:15:00",
  },
  {
    id: "a2",
    avatar: "MR",
    user: "Marcus Reed",
    action: "accepted an audition request for",
    highlight: "The Last Signal",
    href: "/projects/p2",
    timestamp: "2026-06-17T08:42:00",
  },
  {
    id: "a3",
    avatar: "CD",
    user: "Past Wins",
    action: "reached 500 submissions",
    highlight: "Coastal Dreams S2",
    href: "/projects/p3",
    timestamp: "2026-06-16T16:30:00",
  },
  {
    id: "a4",
    avatar: "SK",
    user: "Sarah",
    action: "created a new role on",
    highlight: "Silver Line",
    href: "/projects/p6",
    timestamp: "2026-06-16T11:20:00",
  },
  {
    id: "a5",
    avatar: "OV",
    user: "Olivia",
    action: "booked an actor for",
    highlight: "City of Shadows",
    href: "/projects/p4",
    timestamp: "2026-06-15T14:05:00",
  },
  {
    id: "a6",
    avatar: "LH",
    user: "Lisa Hartwell",
    action: "sent 6 audition requests for",
    highlight: "Coastal Dreams S2",
    href: "/projects/p3",
    timestamp: "2026-06-15T10:00:00",
  },
];

export const castingInsights: CastingInsight[] = [
  {
    id: "i1",
    type: "positive",
    emoji: "📈",
    message: "Submission volume increased 18% this month across all active projects.",
  },
  {
    id: "i2",
    type: "warning",
    emoji: "🎭",
    message:
      "Three roles are receiving significantly fewer submissions than your portfolio average.",
  },
  {
    id: "i3",
    type: "warning",
    emoji: "⚠️",
    message: "Two projects have submission deadlines within five days.",
  },
  {
    id: "i4",
    type: "success",
    emoji: "⭐",
    message: "Your average review time improved by 42% compared to last month.",
  },
  {
    id: "i5",
    type: "tip",
    emoji: "💡",
    message:
      "Consider extending submissions for \"Coach Davis\" on Silver Line to increase applicant volume.",
  },
];

export const upcomingDeadlines: CastingDeadline[] = [
  {
    id: "d1",
    title: "Submission deadline",
    projectTitle: "Silver Line",
    type: "submission",
    date: "2026-06-22",
    overdue: false,
  },
  {
    id: "d2",
    title: "Submission deadline",
    projectTitle: "The Last Signal",
    type: "submission",
    date: "2026-06-20",
    overdue: false,
  },
  {
    id: "d3",
    title: "Callback session",
    projectTitle: "Midnight Harbor",
    type: "callback",
    date: "2026-06-19",
    overdue: true,
  },
  {
    id: "d4",
    title: "Self-tape review",
    projectTitle: "Echoes of Tomorrow",
    type: "audition",
    date: "2026-06-18",
    overdue: false,
  },
  {
    id: "d5",
    title: "Shoot begins",
    projectTitle: "City of Shadows",
    type: "shoot",
    date: "2026-06-25",
    overdue: false,
  },
];

export const calendarEvents: CalendarEvent[] = [
  {
    id: "c1",
    date: "2026-06-18",
    title: "Audition review",
    type: "audition",
    projectTitle: "Echoes of Tomorrow",
  },
  {
    id: "c2",
    date: "2026-06-19",
    title: "Callback",
    type: "callback",
    projectTitle: "Midnight Harbor",
  },
  {
    id: "c3",
    date: "2026-06-20",
    title: "Deadline",
    type: "deadline",
    projectTitle: "The Last Signal",
  },
  {
    id: "c4",
    date: "2026-06-22",
    title: "Deadline",
    type: "deadline",
    projectTitle: "Silver Line",
  },
  {
    id: "c5",
    date: "2026-06-25",
    title: "Shoot day",
    type: "shoot",
    projectTitle: "City of Shadows",
  },
  {
    id: "c6",
    date: "2026-06-28",
    title: "Audition",
    type: "audition",
    projectTitle: "Northern Lights",
  },
];

export const dashboardNotifications: DashboardNotification[] = [
  { id: "n1", label: "New submissions", count: 24, href: "/casting/submissions" },
  { id: "n2", label: "Messages", count: 3, href: "/casting/messages" },
  { id: "n3", label: "Audition responses", count: 7, href: "/casting/submissions" },
  { id: "n4", label: "Project updates", count: 2, href: "/projects" },
  { id: "n5", label: "Role updates", count: 5, href: "/projects" },
];

export const monthlySubmissions = [
  { month: "Jan", submissions: 142 },
  { month: "Feb", submissions: 168 },
  { month: "Mar", submissions: 195 },
  { month: "Apr", submissions: 224 },
  { month: "May", submissions: 289 },
  { month: "Jun", submissions: 342 },
];

export const projectsCreatedTrend = [
  { month: "Jan", projects: 1 },
  { month: "Feb", projects: 2 },
  { month: "Mar", projects: 2 },
  { month: "Apr", projects: 3 },
  { month: "May", projects: 4 },
  { month: "Jun", projects: 6 },
];

export const rolesCreatedTrend = [
  { month: "Jan", roles: 4 },
  { month: "Feb", roles: 6 },
  { month: "Mar", roles: 8 },
  { month: "Apr", roles: 10 },
  { month: "May", roles: 12 },
  { month: "Jun", roles: 14 },
];

export const callbacksTrend = [
  { month: "Jan", callbacks: 4 },
  { month: "Feb", callbacks: 5 },
  { month: "Mar", callbacks: 6 },
  { month: "Apr", callbacks: 8 },
  { month: "May", callbacks: 10 },
  { month: "Jun", callbacks: 12 },
];

export const bookingsTrend = [
  { month: "Jan", bookings: 1 },
  { month: "Feb", bookings: 1 },
  { month: "Mar", bookings: 2 },
  { month: "Apr", bookings: 2 },
  { month: "May", bookings: 3 },
  { month: "Jun", bookings: 4 },
];

export const reviewTimeTrend = [
  { month: "Jan", hours: 4.2 },
  { month: "Feb", hours: 3.8 },
  { month: "Mar", hours: 3.5 },
  { month: "Apr", hours: 3.1 },
  { month: "May", hours: 2.6 },
  { month: "Jun", hours: 2.4 },
];

export const projectHealthData = projectPerformanceRows
  .filter((p) => p.status === "active")
  .sort((a, b) => a.deadline.localeCompare(b.deadline))
  .map((p) => ({
    id: p.id,
    name: p.name,
    healthScore: p.healthScore,
    reviewProgress: Math.min(95, Math.round(p.submissions * 0.12)),
    submissionProgress: Math.min(100, Math.round((p.submissions / 400) * 100)),
    deadline: p.deadline,
  }));

export const projectHealthRankings = projectHealthData
  .sort((a, b) => b.healthScore - a.healthScore)
  .slice(0, 5);

export const teamStatus = {
  online: 4,
  total: 6,
  label: "4 of 6 team members active today",
};

export const todayActivity = {
  submissions: 24,
  auditions: 6,
  messages: 9,
};
