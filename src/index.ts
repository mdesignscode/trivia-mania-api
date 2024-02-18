import { Hono } from 'hono'
import questions from './questions'

const app = new Hono()

app.get('/status', async (c) => {
  return c.json({ status: "OK" })
})

app.route("/questions", questions)

export default app
