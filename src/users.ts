import { Hono } from 'hono'
import prisma from '@/lib/prisma'

const users = new Hono()

interface IUpdateStatsBody {
  user: NonNullable<TUser>;
  answeredCorrect: boolean;
  question: TQuestion
}

const includeUser = {
  include: {
    easyStats: true,
    hardStats: true,
    mediumStats: true
  }
}

users.post('/get', async (c) => {
  const body = await c.req.json()
  const id = body.id;

  if (!id) return new Response("User id required", { status: 400 })

  const user: TUser = await prisma.user.findUnique({
    where: { id },
    ...includeUser
  })

  if (!user) return new Response("User with id not found", { status: 404 })

  return c.json(user)
})

users.post("/topTenPosition", async (c) => {
  const { userId } = await c.req.json()

  if (!userId) return new Response("user id missing", { status: 400 })

  let userPosition = 0

  const allUsers = await prisma.user.findMany({
    orderBy: [{ correctAnswered: "asc" }]
  })

  allUsers.slice(0, 10).forEach((user, i) => {
    if (user.id === userId) {
      userPosition = i + 1
      allUsers.length = 0
    }
  })

  return c.json({ topTenPosition: userPosition })
})

users.get("/topTenPlayers", async (c) => {
  const allUsers: TUser[] = await prisma.user.findMany({
    ...includeUser,
    orderBy: [{ correctAnswered: "desc" }],
    take: 10,
    where: {
      correctAnswered: {
        not: 0
      }
    }
  }),
    topTenPlayers = await Promise.all(allUsers.map(async user => ({
      user,
      stats: (await prisma.categoryStat.findMany({
        where: {
          userId: user?.id
        }
      }))
    })))

  return c.json(topTenPlayers)
})

users.post("/updateStats", async (c) => {
  const body: IUpdateStatsBody = await c.req.json(),
    { user, question, answeredCorrect } = body,

    // find existing category stat
    categoryStat = (await prisma.categoryStat.findMany({
      where: {
        category: question.category,
        userId: user.id
      }
    }))[0]

  // create category stat props
  let categoryStatProps = {}

  switch (question.difficulty) {
    case "easy":
      (categoryStatProps as Pick<NonNullable<TCategoryStat>, "easyAnswered" | "easyCorrect" | "easyId">) = {
        easyAnswered: 1,
        easyId: user.easyStatId,
        easyCorrect: answeredCorrect ? 1 : 0
      }
      break;

    case "medium":
      (categoryStatProps as Pick<NonNullable<TCategoryStat>, "mediumAnswered" | "mediumCorrect" | "mediumId">) = {
        mediumAnswered: 1,
        mediumId: user.mediumStatId,
        mediumCorrect: answeredCorrect ? 1 : 0
      }
      break;

    case "hard":
      (categoryStatProps as Pick<NonNullable<TCategoryStat>, "hardAnswered" | "hardCorrect" | "hardId">) = {
        hardAnswered: 1,
        hardId: user.hardStatId,
        hardCorrect: answeredCorrect ? 1 : 0
      }
      break;

    default:
      break;
  }

  if (!categoryStat) {
    // create new category stat
    await prisma.categoryStat.create({
      data: {
        category: question.category,
        userId: user.id,
        ...categoryStatProps
      }
    })
  } else {
    // update category stat
    await prisma.categoryStat.update({
      where: {
        id: categoryStat.id
      },
      data: (() => {
        switch (question.difficulty) {
          case "easy":
            return {
              easyAnswered: (categoryStat.easyAnswered || 1) + 1,
              easyCorrect: answeredCorrect ? (categoryStat.easyCorrect || 0) + 1 : categoryStat.easyCorrect
            }

          case "hard":
            return {
              hardAnswered: (categoryStat.hardAnswered || 1) + 1,
              hardCorrect: answeredCorrect ? (categoryStat.hardCorrect || 0) + 1 : categoryStat.hardCorrect
            }

          default:
            return {
              mediumAnswered: (categoryStat.mediumAnswered || 1) + 1,
              mediumCorrect: answeredCorrect ? (categoryStat.mediumCorrect || 0) + 1 : categoryStat.mediumCorrect
            }
        }
      })()
    })
  }

  try {
    const updatedUser: TUser = await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        answeredQuestions: {
          push: question.id
        },
        correctAnswered: answeredCorrect ? user.correctAnswered + 1 : user.correctAnswered,
        totalAnswered: user.totalAnswered + 1,
      },
      include: {
        mediumStats: true,
        easyStats: true,
        hardStats: true
      }
    })

    console.log({ updatedUser })

    return c.json(updatedUser)
  } catch (error: any) {
    console.log("An error hass occured", error.message)
  }
})

users.post("/stats", async (c) => {
  const { userId } = await c.req.json()

  if (!userId) return new Response("User id missing", { status: 400 })

  const userCategoryStats = await prisma.categoryStat.findMany({
    where: {
      userId
    },
    orderBy: [{ category: "asc" }]
  })

  return c.json(userCategoryStats)
})

export default users;
