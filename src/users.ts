import { Hono } from 'hono'
import prisma from '@/lib/prisma'

const users = new Hono()

interface IUpdateStatsBody {
  userId: string;
  stats?: NonNullable<TUserStats>;
  isFirstStat?: boolean;
  question: NonNullable<TQuestion>;
  answeredCorrect: boolean;
  difficultyStatId?: number
  categoryStatId?: number
}

users.post('/get', async (c) => {
  const body = await c.req.json()
  const id = body.id;

  if (!id) return new Response("User id required", { status: 400 })

  const user: TUser = await prisma.user.findUnique({
    where: { id },
    include: {
      stats: {
        include: {
          categoryStats: {
            include: {
              difficultyStats: true
            }
          }, difficultyStats: true, total: true
        }
      },
    }
  })

  if (!user) return new Response("User with id not found", { status: 404 })

  return c.json(user)
})

users.post("/topTenPosition", async (c) => {
  const allUsers = await prisma.user.findMany({
    include: {
      stats: {
        include: {
          total: true
         }
      }
    }
  }),
    sortedUsers = allUsers.toSorted((a, b) => a.stats?.total.correctAnswered > b.stats?.total.correctAnswered ? 1 : 0)
  console.log({sortedUsers})
  return c.json({})
})

users.post("/updateStats", async (c) => {
  const body: IUpdateStatsBody = await c.req.json(),
    { userId, stats, isFirstStat, question, answeredCorrect, difficultyStatId, categoryStatId } = body

  try {
    if (isFirstStat) {
      const updatedUser = await createStats({
        userId,
        question,
        answeredCorrect
      })

      return c.json(updatedUser)
    } else {
      const updatedUser = await updateStats({
        stats: stats as NonNullable<TUserStats>,
        userId,
        question,
        answeredCorrect,
        difficultyStatId,
        categoryStatId
      })

      return c.json(updatedUser)
    }
  } catch (error: any) {
    console.log("An error hass occured", error.message)
  }
})

export default users;

async function createStats({ userId, question, answeredCorrect }: {
  userId: string;
  question: NonNullable<TQuestion>;
  answeredCorrect: boolean
}): Promise<TUser> {
  const { category, difficulty, id: questionId } = question,
    newTotal = {
      answered: 1,
      correctAnswered: answeredCorrect ? 1 : 0
    },
    newDifficultyStat = {
      create: {
        difficulty,
        ...newTotal
      }
    };

  const updatedUser: TUser = await prisma.user.update({
    where: { id: userId },
    data: {
      answeredQuestions: {
        set: [questionId]
      },
      stats: {
        create: {
          categoryStats: {
            create: {
              category,
              difficultyStats: newDifficultyStat
            }
          },
          difficultyStats: newDifficultyStat,
          total: {
            create: newTotal
          },
          answeredQuestions: {
            set: [questionId]
          }
        }
      }
    },
    include: {
      stats: {
        include: {
          categoryStats: {
            include: {
              difficultyStats: true
            }
          },
          total: true,
          difficultyStats: true
        }
      }
    }
  })

  console.log(updatedUser)
  return updatedUser
}

async function updateStats({ userId, question, answeredCorrect, stats, difficultyStatId, categoryStatId }: {
  userId: string;
  question: NonNullable<TQuestion>;
  answeredCorrect: boolean
  stats: NonNullable<TUserStats>
  difficultyStatId?: number
  categoryStatId?: number
}): Promise<TUser> {
  const { category, difficulty, id: questionId } = question,
    { total } = stats,
    updatedTotal = {
      answered: total.answered + 1,
      correctAnswered: answeredCorrect ? total.correctAnswered + 1 : total.correctAnswered
    },
    upsertDifficultyStat = {
      upsert: {
        where: {
          id: difficultyStatId,
          difficulty
        },
        update: updatedTotal,
        create: {
          difficulty,
          ...updatedTotal
        }
      }
    }

  const updatedUser: TUser = await prisma.user.update({
    where: { id: userId },
    data: {
      answeredQuestions: {
        push: questionId
      },
      stats: {
        update: {
          where: {
            id: stats.id,
          },
          data: {
            total: {
              update: {
                where: {
                  id: stats.statsTotalId
                },
                data: updatedTotal
              }
            },
            difficultyStats: upsertDifficultyStat,
            categoryStats: {
              upsert: {
                where: {
                  id: categoryStatId
                },
                update: {
                  difficultyStats: upsertDifficultyStat
                },
                create: {
                  category,
                  difficultyStats: {
                    create: {
                      answered: 1,
                      correctAnswered: answeredCorrect ? 1 : 0,
                      difficulty
                    }
                  }
                }
              }
            },
            answeredQuestions: {
              push: questionId
            }
          }
        }
      }
    },
    include: {
      stats: {
        include: {
          categoryStats: {
            include: {
              difficultyStats: true
            }
          },
          total: true,
          difficultyStats: true
        }
      }
    }
  })

  console.log(updatedUser)
  return updatedUser
}
