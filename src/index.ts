import { Hono } from 'hono'
import questions from './questions'
import users from './users';
import { cors } from 'hono/cors'

const app = new Hono()

app.use('/*', cors({
  origin: '*'
}))

app.get('/status', async (c) => c.json({ status: "OK" }))

app.route("/questions", questions)
app.route("/users", users)

export default app
