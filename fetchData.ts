import prisma from "./lib/prisma";

main();

async function main() {
  for (let i = 0; i < 50; i++) {
    const url = "https://the-trivia-api.com/v2/questions?limit=50",
      request = await fetch(url),
      response = await request.json()

    response.forEach(async (question: any) => {
      const newQuestion: Omit<TQuestion, "id"> = {
        question: question.question.text,
        difficulty: question.difficulty,
        answers: question.incorrectAnswers.concat([question.correctAnswer]),
        correctAnswer: question.correctAnswer,
        category: splitAndCapitalize(question.category)
      }

      try {
        console.log(await prisma.question.create({
          data: newQuestion,
        }))
      } catch (error) {
        ;
      }
    })
  }
}

function splitAndCapitalize(inputString: string): string {
  const words = inputString.split('_');
  const capitalizedWords = words.map(word => {
    const lowercaseWord = word.toLowerCase();
    return lowercaseWord.charAt(0).toUpperCase() + lowercaseWord.slice(1);
  });
  return capitalizedWords.join(' ');
}
