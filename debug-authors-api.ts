
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Fetching authors with relations...");
    try {
        const authors = await prisma.authors.findMany({
            include: {
                _count: {
                    select: { articles: true },
                },
                articles: {
                    select: {
                        categories: { select: { name: true } },
                        article_tags: { select: { tags: { select: { name: true } } } },
                    },
                    take: 20,
                }
            },
        });

        console.log(`Fetched ${authors.length} authors.`);

        // Simulate the mapping logic
        authors.map(a => {
            console.log(`Processing author: ${a.name}`);
            const categories = Array.from(new Set(
                a.articles
                    .filter(article => article.categories)
                    .map(article => article.categories.name)
            )).sort();

            console.log(`  Cats: ${categories.join(', ')}`);

            const tags = Array.from(new Set(
                a.articles.flatMap(article =>
                    article.article_tags.map(at => at.tags.name)
                )
            )).sort();
            console.log(`  Tags: ${tags.join(', ')}`);
        });

    } catch (error) {
        console.error("Error during fetch or processing:", error);
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
