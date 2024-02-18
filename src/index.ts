import { Hono } from 'hono'
import prisma from '../lib/prisma'
import questions from './questions'

const app = new Hono()

app.get('/', async (c) => {
  const questions = await prisma.question.findMany()
  console.log(questions.length)
  return c.text('Hello Hono!')
})

app.route("/questions", questions)

export default app
