const { chromium } = require("playwright");
const mongoose = require("mongoose");

// Schema remains the same
const Review = mongoose.models.Review || mongoose.model('Review', new mongoose.Schema({
    airline: { type: String, lowercase: true }, 
    user: String, 
    rating: String, 
    date: String, 
    review: { type: String, unique: true },
    traveller: String,
    seatType: String,
    route: String,
    dateFlown: String,
    seatComfort: String,
    cabinService: String,
    groundService: String,
    valueMoney: String,
    scrapedAt: { type: Date, default: Date.now }
}));

async function runScraper(airlineName) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();
    
    // Blocking unnecessary assets to speed up scraping
    await page.route('**/*.{png,jpg,jpeg,gif,svg,css}', (route) => route.abort());

    const slug = airlineName.toLowerCase().trim().replace(/\s+/g, '-');
    let allReviews = [];
    const maxPages = 3; 

    console.log(` Starting multi-page scrape for: ${airlineName}`);
    
    try {
        for (let i = 1; i <= maxPages; i++) {
            // Construct the URL for each specific page
            const url = `https://www.airlinequality.com/airline-reviews/${slug}/page/${i}/`;
            console.log(` Scraping Page ${i}: ${url}`);

            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

            // Check if reviews exist on this page. If not, break the loop.
            const hasReviews = await page.$('article[itemprop="review"]');
            if (!hasReviews) {
                console.log(`ℹ No reviews found on page ${i}. Finishing scrape.`);
                break;
            }

            const pageReviews = await page.evaluate((airline) => {
                const cards = document.querySelectorAll('article[itemprop="review"]');
                
                return Array.from(cards).map(card => {
                    const getTableData = (label) => {
                        const row = Array.from(card.querySelectorAll('.review-ratings tr')).find(
                            tr => tr.querySelector('.review-rating-header')?.innerText.toLowerCase().includes(label.toLowerCase())
                        );
                        if (!row) return "N/A";

                        const valCell = row.querySelector('.review-value');
                        if (valCell) return valCell.innerText;

                        const stars = row.querySelectorAll('.review-rating-stars .fill');
                        return stars.length > 0 ? stars.length.toString() : "0";
                    };

                    let fullText = card.querySelector('.text_content[itemprop="reviewBody"]')?.innerText || "";
                    
                    return {
                        airline: airline,
                        user: card.querySelector('span[itemprop="author"] > span')?.innerText || "Anonymous",
                        rating: card.querySelector('.rating-10 > span[itemprop="ratingValue"]')?.innerText || "N/A",
                        date: card.querySelector('time[itemprop="datePublished"]')?.innerText || "",
                        review: fullText.replace(/^.*\|/g, '').trim(),
                        traveller: getTableData("Type Of Traveller"),
                        seatType: getTableData("Seat Type"),
                        route: getTableData("Route"),
                        dateFlown: getTableData("Date Flown"),
                        seatComfort: getTableData("Seat Comfort"),
                        cabinService: getTableData("Cabin Staff Service"),
                        groundService: getTableData("Ground Service"),
                        valueMoney: getTableData("Value For Money")
                    };
                });
            }, slug);

            allReviews = [...allReviews, ...pageReviews];

            // Wait a little bit between pages to be respectful to the server
            if (i < maxPages) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        if (allReviews.length > 0) {
            const ops = allReviews.map(rev => ({
                updateOne: {
                    filter: { review: rev.review }, 
                    update: { $set: { ...rev, scrapedAt: new Date() } }, 
                    upsert: true
                }
            }));

            await Review.bulkWrite(ops);
            console.log(` MongoDB Detailed Sync: ${allReviews.length} total reviews for ${airlineName}`);
        }
        return allReviews;

    } catch (err) {
        console.error(` Scrape Failed: ${err.message}`);
        return [];
    } finally {
        await browser.close();
    }
}

module.exports = { runScraper };
