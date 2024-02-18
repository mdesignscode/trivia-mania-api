import prisma from "./lib/prisma";

const triviaCategories = [
  'Sports',
  'Entertainment: Video Games',
  'Geography',
  'Entertainment: Books',
  'History',
  'Entertainment: Television',
  'Entertainment: Cartoon & Animations',
  'Entertainment: Music',
  'Science & Nature',
  'Celebrities',
  'General Knowledge',
  'Politics',
  'Entertainment: Japanese Anime & Manga',
  'Entertainment: Film',
  'Entertainment: Comics',
  'Vehicles',
  'Mythology',
  'Entertainment: Musicals & Theatres',
  'Science: Mathematics',
  'Science: Computers',
  'Entertainment: Board Games',
  'Art',
  'Science: Gadgets',
  'Animals'
]

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
        category: splitAndCapitalize(question.category),
        correctAnswer: question.correctAnswer
      }

      try {
        console.log(await prisma.question.create({ data: newQuestion }))
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
