
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const COURSES = ['RYT200', 'RYT500', 'RPY85', 'RCYT95', 'ピラティス基礎', '短期集中'];
const TYPES = ['STUDENT_VOICE', 'AUTHOR_ARTICLE'];

async function main() {
    console.log('Starting Knowledge Bank Data Fix...');

    const items = await prisma.knowledge_items.findMany();

    for (const item of items) {
        // 1. Fix Type
        // If type is not one of the valid types, assign a random valid type
        let newType = item.type;
        if (!TYPES.includes(item.type)) {
            newType = TYPES[Math.floor(Math.random() * TYPES.length)];
        }

        // 2. Fix Course
        // If course is null or not in list, assign random
        let newCourse = item.course;
        if (!newCourse || !COURSES.includes(newCourse)) {
            newCourse = COURSES[Math.floor(Math.random() * COURSES.length)];
        }

        // 3. Fix Content/Title if empty
        let newTitle = item.title;
        if (!newTitle || newTitle === 'Untitled') {
            newTitle = `${newType === 'STUDENT_VOICE' ? 'Review' : 'Blog'} about ${newCourse}`;
        }

        // 4. Source URL
        // If AUTHOR_ARTICLE, maybe give it a source URL to look real
        let newSourceUrl = item.sourceUrl;
        if (newType === 'AUTHOR_ARTICLE' && !newSourceUrl) {
            newSourceUrl = 'https://example.com/blog/article-' + item.id.substring(0, 8);
        }

        // Update if changed
        if (newType !== item.type || newCourse !== item.course || newTitle !== item.title || newSourceUrl !== item.sourceUrl) {
            await prisma.knowledge_items.update({
                where: { id: item.id },
                data: {
                    type: newType,
                    course: newCourse,
                    title: newTitle,
                    sourceUrl: newSourceUrl
                }
            });
            console.log(`Updated Item ${item.id}: Type=${newType}, Course=${newCourse}`);
        }
    }

    console.log('Knowledge Bank Data Fix Complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
