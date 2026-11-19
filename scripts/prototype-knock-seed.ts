// PROTOTYPE — throwaway. Sends sample Notifications (the 5 v1 types) to Knock's
// `prototype-demo` workflow for one Cadence user, or every user if no id is given.
//   npm run prototype:knock-seed -- [userId]
import Database from "better-sqlite3";

process.loadEnvFile?.();
const secret = process.env.KNOCK_SECRET_API_KEY;
if (!secret) throw new Error("KNOCK_SECRET_API_KEY missing from .env");

const db = new Database("data.db", { readonly: true });
const course = db
  .prepare(
    `select c.id, c.slug, c.title, l.id as lessonId from courses c
     join modules m on m.course_id = c.id join lessons l on l.module_id = m.id
     limit 1`
  )
  .get() as { id: number; slug: string; title: string; lessonId: number };

const onlyId = process.argv[2] ? Number(process.argv[2]) : null;
const users = (
  db.prepare("select id, name, email from users").all() as {
    id: number;
    name: string;
    email: string;
  }[]
).filter((u) => onlyId === null || u.id === onlyId);

const samples = [
  {
    title: "Your Refund Request was approved",
    body: `Your Enrollment on ${course.title} has ended. The full amount is on its way back.`,
    url: "/settings",
  },
  {
    title: "Your Refund Request was declined",
    body: `You keep your Enrollment on ${course.title}. You can raise a new Refund Request.`,
    url: "/settings",
  },
  {
    title: "New Refund Request",
    body: `Liam asked for a refund on ${course.title}: "Not what I expected."`,
    url: "/admin/refunds",
  },
  {
    title: "Your question was answered",
    body: `The instructor answered your Student Question on ${course.title}.`,
    url: `/courses/${course.slug}/lessons/${course.lessonId}`,
  },
  {
    title: "2 new answers to your question",
    body: `On ${course.title}: "How do generics infer here?"`,
    url: `/courses/${course.slug}/lessons/${course.lessonId}`,
  },
  {
    title: "New Student Question",
    body: `A Student asked a question on ${course.title}.`,
    url: "/instructor/questions",
  },
  {
    title: "Seat claimed",
    body: `Priya claimed a Seat on your ${course.title} Team Licence.`,
    url: "/team",
  },
  {
    title: "3 Seats claimed",
    body: `3 Seats were claimed on your ${course.title} Team Licence. 2 Unclaimed Seats left.`,
    url: "/team",
  },
];

for (const user of users) {
  for (const data of samples) {
    const res = await fetch(
      "https://api.knock.app/v1/workflows/prototype-demo/trigger",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipients: [{ id: String(user.id), name: user.name }],
          data,
        }),
      }
    );
    if (!res.ok) {
      console.error(user.id, res.status, await res.text());
      process.exit(1);
    }
  }
  console.log(`sent ${samples.length} to user ${user.id} (${user.name})`);
}
