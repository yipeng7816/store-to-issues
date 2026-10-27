import { isErrorProductEventName } from "./analytics";
import { prisma } from "./prisma";

export type DailyMetricRow = {
  day: string;
  pageViews: number;
  uniqueVisitors: number;
  signups: number;
  logins: number;
  syncOk: number;
  syncError: number;
};

export type AdminMetricsPayload = {
  generatedAt: string;
  rangeDays: number;
  totals: {
    users: number;
    verifiedUsers: number;
    withGithubRepo: number;
    liveStoreConfigured: number;
    activeLast7Days: number;
    pageViews30d: number;
    uniqueVisitors30d: number;
    errors24h: number;
  };
  daily: DailyMetricRow[];
  topPaths: { path: string; views: number }[];
  recentErrors: {
    name: string;
    meta: string;
    userId: string | null;
    userEmail: string | null;
    createdAt: string;
  }[];
  recentSignups: {
    email: string;
    createdAt: string;
    emailVerified: boolean;
    planStatus: string;
    lastLoginAt: string | null;
  }[];
};

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function emptyDailyMap(days: number): Map<string, DailyMetricRow> {
  const map = new Map<string, DailyMetricRow>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const key = dayKey(d);
    map.set(key, {
      day: key,
      pageViews: 0,
      uniqueVisitors: 0,
      signups: 0,
      logins: 0,
      syncOk: 0,
      syncError: 0,
    });
  }
  return map;
}

export async function fetchAdminMetrics(
  rangeDays = 30,
): Promise<AdminMetricsPayload> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - rangeDays);
  since.setUTCHours(0, 0, 0, 0);

  const daily = emptyDailyMap(rangeDays);

  const pageRows = await prisma.$queryRaw<
    { day: Date; views: bigint; visitors: bigint }[]
  >`
    SELECT date_trunc('day', "createdAt")::date AS day,
           count(*)::bigint AS views,
           count(DISTINCT "visitorKey")::bigint AS visitors
    FROM "AnalyticsPageView"
    WHERE "createdAt" >= ${since}
    GROUP BY 1
    ORDER BY 1
  `;

  for (const row of pageRows) {
    const key = dayKey(new Date(row.day));
    const slot = daily.get(key);
    if (slot) {
      slot.pageViews = Number(row.views);
      slot.uniqueVisitors = Number(row.visitors);
    }
  }

  const eventRows = await prisma.$queryRaw<
    { day: Date; name: string; count: bigint }[]
  >`
    SELECT date_trunc('day', "createdAt")::date AS day, name,
           count(*)::bigint AS count
    FROM "AnalyticsProductEvent"
    WHERE "createdAt" >= ${since}
    GROUP BY 1, 2
    ORDER BY 1
  `;

  for (const row of eventRows) {
    const key = dayKey(new Date(row.day));
    const slot = daily.get(key);
    if (!slot) continue;
    const n = Number(row.count);
    if (row.name === "register") slot.signups = n;
    else if (row.name === "login") slot.logins = n;
    else if (row.name === "sync_ok") slot.syncOk = n;
    else if (row.name === "sync_error") slot.syncError = n;
  }

  const topPaths = await prisma.$queryRaw<{ path: string; views: bigint }[]>`
    SELECT path, count(*)::bigint AS views
    FROM "AnalyticsPageView"
    WHERE "createdAt" >= ${since}
    GROUP BY path
    ORDER BY views DESC
    LIMIT 10
  `;

  const sevenAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    users,
    verifiedUsers,
    withGithubRepo,
    liveStoreConfigured,
    activeLast7Days,
    pageViews30d,
    uniqueVisitors30d,
    errors24h,
    recentErrorRows,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { emailVerifiedAt: { not: null } } }),
    prisma.userSettings.count({
      where: { githubRepo: { not: "" }, githubToken: { not: "" } },
    }),
    prisma.userSettings.count({
      where: {
        useMockReviews: false,
        OR: [
          { ascIssuerId: { not: "" } },
          { googlePlayPackageName: { not: "" } },
        ],
      },
    }),
    prisma.user.count({
      where: {
        OR: [
          { lastLoginAt: { gte: sevenAgo } },
          {
            syncJobs: {
              some: { createdAt: { gte: sevenAgo }, status: "ok" },
            },
          },
        ],
      },
    }),
    prisma.analyticsPageView.count({ where: { createdAt: { gte: since } } }),
    prisma.analyticsPageView
      .groupBy({
        by: ["visitorKey"],
        where: { createdAt: { gte: since } },
      })
      .then((g) => g.length),
    prisma.analyticsProductEvent.count({
      where: {
        createdAt: { gte: dayAgo },
        OR: [
          { name: { endsWith: "_error" } },
          { name: { endsWith: "_failed" } },
        ],
      },
    }),
    prisma.analyticsProductEvent.findMany({
      where: {
        OR: [
          { name: { endsWith: "_error" } },
          { name: { endsWith: "_failed" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        name: true,
        meta: true,
        userId: true,
        createdAt: true,
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        email: true,
        createdAt: true,
        emailVerifiedAt: true,
        planStatus: true,
        lastLoginAt: true,
      },
    }),
  ]);

  const errorUserIds = [
    ...new Set(
      recentErrorRows.map((e) => e.userId).filter((id): id is string => Boolean(id)),
    ),
  ];
  const errorUsers =
    errorUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: errorUserIds } },
          select: { id: true, email: true },
        })
      : [];
  const emailById = new Map(errorUsers.map((u) => [u.id, u.email]));

  return {
    generatedAt: new Date().toISOString(),
    rangeDays,
    totals: {
      users,
      verifiedUsers,
      withGithubRepo,
      liveStoreConfigured,
      activeLast7Days,
      pageViews30d,
      uniqueVisitors30d,
      errors24h,
    },
    daily: [...daily.values()],
    recentErrors: recentErrorRows
      .filter((e) => isErrorProductEventName(e.name))
      .map((e) => ({
        name: e.name,
        meta: e.meta,
        userId: e.userId,
        userEmail: e.userId ? emailById.get(e.userId) ?? null : null,
        createdAt: e.createdAt.toISOString(),
      })),
    topPaths: topPaths.map((r) => ({
      path: r.path,
      views: Number(r.views),
    })),
    recentSignups: recentUsers.map((u) => ({
      email: u.email,
      createdAt: u.createdAt.toISOString(),
      emailVerified: u.emailVerifiedAt != null,
      planStatus: u.planStatus,
      lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    })),
  };
}
