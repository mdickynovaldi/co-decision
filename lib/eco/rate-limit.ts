export type RateLimitEvent = {
  eventKey: string;
  createdAt: string;
};

export function rateLimitWindowStart(now: Date, windowMs: number) {
  return new Date(now.getTime() - windowMs);
}

export function isRateLimited({
  events,
  eventKey,
  limit,
  windowMs,
  now = new Date(),
}: {
  events: RateLimitEvent[];
  eventKey: string;
  limit: number;
  windowMs: number;
  now?: Date;
}) {
  const start = rateLimitWindowStart(now, windowMs).getTime();
  const count = events.filter(
    (event) => event.eventKey === eventKey && new Date(event.createdAt).getTime() >= start,
  ).length;

  return count >= limit;
}
