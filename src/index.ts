import { Hono } from 'hono'
import questions from './questions'
import { PrismaClient } from "@/prisma/generated/client";
import users from './users';
import { cors } from 'hono/cors'

const prisma = new PrismaClient({
  log: ['query'], // Enable query logging
});
const app = new Hono()

app.use('/*', cors({
  origin: '*'
}))

app.get('/status', async (c) => {
  const user = await prisma.user.create({
    data: {
      id: "test_id",
      username: "test_user"
    }
  });
  console.log(user);

  await prisma.user.delete({
    where: {
      id: "test_id"
    }
  })

  return c.json({ status: "OK" })
})

app.route("/questions", questions)
app.route("/users", users)

export default app
