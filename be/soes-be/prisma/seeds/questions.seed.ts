import { PrismaClient, Question, Subject, Teacher } from '@prisma/client'

interface QuestionSeedInput {
  subjects: Subject[]
  teachers: Teacher[]
}

function makeQuestions(subject: Subject, teacher: Teacher): Array<{
  content: string
  explanation: string
  options: Array<{ content: string; isCorrect: boolean }>
}> {
  const name = subject.name
  return [
    {
      content: `Câu hỏi 1 về ${name}: Khái niệm cơ bản là gì?`,
      explanation: `Đây là khái niệm cơ bản nhất của ${name}.`,
      options: [
        { content: 'Đáp án A - Đúng', isCorrect: true },
        { content: 'Đáp án B', isCorrect: false },
        { content: 'Đáp án C', isCorrect: false },
        { content: 'Đáp án D', isCorrect: false },
      ],
    },
    {
      content: `Câu hỏi 2 về ${name}: Đặc điểm nổi bật?`,
      explanation: `${name} có nhiều đặc điểm nổi bật.`,
      options: [
        { content: 'Đáp án A', isCorrect: false },
        { content: 'Đáp án B - Đúng', isCorrect: true },
        { content: 'Đáp án C', isCorrect: false },
        { content: 'Đáp án D', isCorrect: false },
      ],
    },
    {
      content: `Viết chương trình Java tính tổng hai số nguyên`,
      explanation: `Viết hàm sum(a, b) trả về tổng của hai số nguyên a và b.`,
      options: [],
    },
    {
      content: `Câu hỏi 4 về ${name}: Phương pháp tốt nhất?`,
      explanation: `Trong ${name}, có nhiều phương pháp tiếp cận.`,
      options: [
        { content: 'Đáp án A', isCorrect: false },
        { content: 'Đáp án B', isCorrect: false },
        { content: 'Đáp án C', isCorrect: false },
        { content: 'Đáp án D - Đúng', isCorrect: true },
      ],
    },
    {
      content: `Câu hỏi 5 về ${name}: Công cụ phổ biến nhất?`,
      explanation: `Nhiều công cụ hỗ trợ ${name}.`,
      options: [
        { content: 'Đáp án A - Đúng', isCorrect: true },
        { content: 'Đáp án B', isCorrect: false },
        { content: 'Đáp án C', isCorrect: false },
        { content: 'Đáp án D', isCorrect: false },
      ],
    },
    {
      content: `Viết chương trình Java kiểm tra số nguyên tố`,
      explanation: `Viết hàm isPrime(n) kiểm tra xem số n có phải là số nguyên tố không.`,
      options: [],
    },
    {
      content: `Câu hỏi 7 về ${name}: Loại nào sau đây KHÔNG thuộc ${name}?`,
      explanation: `Cần phân biệt rõ các thành phần của ${name}.`,
      options: [
        { content: 'Đáp án A', isCorrect: false },
        { content: 'Đáp án B', isCorrect: false },
        { content: 'Đáp án C - Đúng (không thuộc)', isCorrect: true },
        { content: 'Đáp án D', isCorrect: false },
      ],
    },
    {
      content: `Câu hỏi 8 về ${name}: Điểm khác biệt so với các công nghệ khác?`,
      explanation: `${name} có nhiều điểm khác biệt đặc trưng.`,
      options: [
        { content: 'Đáp án A', isCorrect: false },
        { content: 'Đáp án B', isCorrect: false },
        { content: 'Đáp án C', isCorrect: false },
        { content: 'Đáp án D - Đúng', isCorrect: true },
      ],
    },
    {
      content: `Viết chương trình C tính giai thừa`,
      explanation: `Viết hàm factorial(n) tính giai thừa của số nguyên n.`,
      options: [],
    },
    {
      content: `Câu hỏi 10 về ${name}: Lợi ích khi sử dụng?`,
      explanation: `Sử dụng ${name} mang lại nhiều lợi ích thiết thực.`,
      options: [
        { content: 'Đáp án A', isCorrect: false },
        { content: 'Đáp án B - Đúng', isCorrect: true },
        { content: 'Đáp án C', isCorrect: false },
        { content: 'Đáp ��n D', isCorrect: false },
      ],
    },
  ]
}

export async function seedQuestions(
  prisma: PrismaClient,
  { subjects, teachers }: QuestionSeedInput,
): Promise<Question[]> {
  console.log('Seeding Questions...')

  const allQuestions: Question[] = []

  for (let si = 0; si < subjects.length; si++) {
    const subject = subjects[si]
    const teacher = teachers[si % teachers.length]
    const questionsData = makeQuestions(subject, teacher)

    for (const qData of questionsData) {
      // Check by content + subjectId to avoid duplicates
      const existing = await prisma.question.findFirst({
        where: { content: qData.content, subjectId: subject.id },
        include: { options: true },
      })
      if (existing) { allQuestions.push(existing); continue }

      // Determine if this should be a programming question (questions without options)
      const isProgrammingQuestion = qData.options.length === 0
      const questionType = isProgrammingQuestion ? 'PROGRAMMING' : 'SINGLE_CHOICE'
      
      // Determine language based on subject
      let language: 'JAVA' | 'C' | 'CPP' | null = null
      if (isProgrammingQuestion) {
        if (subject.code.includes('JAVA')) {
          language = 'JAVA'
        } else if (subject.code.includes('C')) {
          language = subject.code.includes('CPP') ? 'CPP' : 'C'
        }
      }

      const question = await prisma.question.create({
        data: {
          content: qData.content,
          explanation: qData.explanation,
          type: questionType,
          difficulty: 'MEDIUM',
          source: 'MANUAL',
          language,
          ownerId: teacher.id,
          subjectId: subject.id,
          options: questionType === 'PROGRAMMING' ? undefined : {
            create: qData.options,
          },
        },
        include: { options: true },
      })
      allQuestions.push(question)
    }
  }

  console.log(`✓ Questions completed (${allQuestions.length})`)
  return allQuestions
}
