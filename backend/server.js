const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { runScraper } = require('./scraper'); // Your existing review scraper
const fs = require('fs'); // For logging
const path = require('path'); // For log file path
// --- NEW AUTH IMPORTS ---
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
// --- NEW: FLIGHT SCRAPER IMPORTS ---
const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);
const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'FlightTracker Backend API is running',
        routes: {
            reviews: '/api/reviews/:airline',
            authSignup: '/api/auth/signup',
            authLogin: '/api/auth/login',
            flightTracker: '/api/flight-tracker/:id',
            flightsSummary: '/api/flights/summary'
        }
    });
});

// --- CONFIGURATION ---
const JWT_SECRET = process.env.JWT_SECRET; // Use a long random string

// --- LOGGING HELPER ---
const logScraperActivity = (message) => {
    const timestamp = new Date().toLocaleString();
    const logEntry = `[${timestamp}] ${message}\n`;
    fs.appendFile(path.join(__dirname, 'scraper.log'), logEntry, (err) => {
        if (err) console.error(" Failed to write to log file:", err);
    });
};

const scraperLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: "Too many refreshes. Please wait 15 minutes before trying again." },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.query.refresh !== 'true'
});

// --- MONGODB CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log(" Connected to MongoDB"))
.catch(err => console.error(" MongoDB Connection Error:", err));

// --- NEW: USER SCHEMA FOR AUTH ---
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// --- EXISTING REVIEW SCHEMA ---
const reviewSchema = new mongoose.Schema({
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
    aircraftNumber:String,
    groundService: String,
    valueMoney: String,
    scrapedAt: { type: Date, default: Date.now }
});
const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

// --- NEW: FLIGHT SCRAPER FUNCTION (Based on your provided code) ---
// --- UPDATED: ROBUST FLIGHT SCRAPER ---
async function scrapeFlightLive(flightNumber) {
       const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    console.log(` Searching for flight: ${flightNumber}...`);

    try {
       await page.goto('https://www.flightaware.com/', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
});

  await page.waitForTimeout(2000);

try {
    await page.waitForSelector('button:has-text("Agree"), button:has-text("Accept")', { timeout: 5000 });
    await page.click('button:has-text("Agree"), button:has-text("Accept")');
    console.log(" Cookie popup accepted");
} catch {
    console.log(" No cookie popup");
}

const searchInput = page.locator('[data-testid="search"] .pointer-events-auto input');
await searchInput.waitFor({ state: 'visible', timeout: 25000 });
await searchInput.evaluate((input, value) => {
    input.scrollIntoView({ block: 'center', inline: 'center' });
    input.focus();
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
}, flightNumber);
await page.waitForTimeout(2000);

        console.log("Waiting for flight suggestions (ignoring default airports)...");

        const resultItemSelector = 'li[data-testid="search-result"]';
        const flightSpecificResult = page.locator(resultItemSelector).filter({ hasText: /\d/ });

        await flightSpecificResult.first().waitFor({ state: 'visible', timeout: 70000 });

        console.log(` Clicking mapped flight...`);
        
        await Promise.all([
            page.waitForURL(/\/live\/flight\//i, { 
                waitUntil: 'domcontentloaded', 
                timeout: 20000 
            }), 
            flightSpecificResult.first().click()
        ]);

        console.log(` Success! Arrived at: ${page.url()}`);

        // 4. Wait for the main UI element
        await page.waitForSelector('.flightPageSummaryStatus', { timeout: 40000 });
        
        // IMPORTANT: Small delay to let background data (window.FlightPageModel) populate
        await page.waitForTimeout(2000); 

   const result = await page.evaluate(() => {
    const d = window.FlightPageModel?._data;
    
    // Helper to get text by selector
    const getText = (sel) => document.querySelector(sel)?.innerText?.trim() || "N/A";

    // NEW Helper: Finds the data value by matching the label text
    const getValueByLabel = (labelTitle) => {
        const rows = Array.from(document.querySelectorAll('.flightPageDataRow'));
        const targetRow = rows.find(row => 
            row.querySelector('.flightPageDataLabel')?.innerText.includes(labelTitle)
        );
        return targetRow ? targetRow.querySelector('.flightPageData').innerText.trim() : "N/A";
    };

    const gateRaw = getText('.flightPageSummaryOrigin .flightPageAirportGate');
    const cleanGate = gateRaw.toLowerCase()
        .replace('left', '').replace('right', '').replace('departing from ', '').trim();

    return {
        status: getText('.flightPageSummaryStatus'), 
        duration: getText('.flightPageProgressTotal'),
        // Targeted extraction using the new helper
        aircraftType: getValueByLabel('Aircraft Type'),
        speed: getValueByLabel('Speed'),
        altitude: getValueByLabel('Altitude'),
        distance: getValueByLabel('Distance'),
        departure: {
            date: getText('.flightPageSummaryOrigin .flightPageSummaryDepartureDay'),
            city: getText('.flightPageSummaryOrigin .flightPageSummaryCity'), 
            cityCode: getText('.flightPageSummaryOrigin .flightPageSummaryAirportCode'),
            gate: cleanGate, 
            airport: d?.origin?.friendlyName || "N/A",
            time: getText('.flightPageSummaryOrigin .flightTime'), 
            statusLabel: getText('.flightPageDepartureDelayStatus') 
        },
        arrival: {
            date: getText('.flightPageSummaryDestination .flightPageSummaryArrivalDay'),
            city: getText('.flightPageSummaryDestination .flightPageSummaryCity'), 
            cityCode: getText('.flightPageSummaryDestination .flightPageSummaryAirportCode'),
            airport: d?.destination?.friendlyName || "N/A",
            terminal: getText('.flightPageSummaryDestination .flightPageAirportGate .displayFlexElementContainer').replace(/arriving at/gi, '').trim() || "N/A",
            time: getText('.flightPageSummaryDestination .flightTime'),
            statusLabel: getText('.flightPageArrivalDelayStatus')
        }
    };
});

        return result;

    } catch (error) {
        console.error("Scrape Error:", error.message);
        throw error; // Rethrow to let the Express route handle it
    } finally {
        await browser.close();
    }
}
// SIGNUP ROUTE
app.post('/api/auth/signup', async (req, res) => { 
    try { 
        const { name, email, password } = req.body;
        
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ error: "Email already registered" });

        // Hash password before saving to Compass
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: "Account created successfully!" });
    } catch (err) {
        console.error("Signup Error:", err);
        res.status(500).json({ error: "Registration failed" });
    }
});

// LOGIN ROUTE
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        //  Find the user in your local database
        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "User not found" });

        //  Check if password matches local DB
        const isMatch = await bcrypt.compare(password, user.password);

        //  AUTO-SYNC LOGIC: 
        if (!isMatch) {
            console.log(` Syncing new password for: ${email}`);
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
            await user.save(); // Updates local MongoDB with the new password from Firebase
        }

        // 4. Generate JWT Token
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1d' });
        
        res.json({ 
            token, 
            user: { name: user.name, email: user.email } 
        });
    } catch (err) {
        console.error(" Login Error:", err);
        res.status(500).json({ error: "Login process failed" });
    }
});

// --- NEW: LIVE FLIGHT DATA ROUTE ---
app.get('/api/flight-tracker/:id', async (req, res) => {
    try {
        const flightId = req.params.id;
        logScraperActivity(`TRACKER: Scraping live data for ${flightId}`);
        const data = await scrapeFlightLive(flightId);
        res.json(data);
         console.log("\n--- data send ---");
    } catch (err) {
        console.error("Live Tracker Error:", err);
        const response = { error: "Failed to fetch live flight data" };
        if (req.query.debug === 'true') {
            response.details = err.message;
        }
        res.status(500).json(response);
    }
});

app.get('/api/flights/summary', async (req, res) => {
    try {
        const flights = await Review.aggregate([
            {
                $addFields: {
                    numericRating: { $convert: { input: "$rating", to: "double", onError: null, onNull: null } },
                    numericSeatComfort: { $convert: { input: "$seatComfort", to: "double", onError: 0, onNull: 0 } },
                    numericValueMoney: { $convert: { input: "$valueMoney", to: "double", onError: 0, onNull: 0 } }
                }
            },
            {
                $addFields: {
                    bestScore: {
                        $add: [
                            "$numericRating",
                            "$numericSeatComfort",
                            "$numericValueMoney"
                        ]
                    }
                }
            },
            {
                $match: {
                    airline: { $exists: true, $ne: "" },
                    numericRating: { $ne: null }
                }
            },
            { $sort: { airline: 1, bestScore: -1, numericRating: -1, numericSeatComfort: -1, numericValueMoney: -1, scrapedAt: -1 } },
            {
                $group: {
                    _id: "$airline",
                    averageRating: { $avg: "$numericRating" },
                    totalReviews: { $sum: 1 },
                    route: { $first: "$route" },
                    airlineName: { $first: "$airlinesName" },
                    aircraftNumber: { $first: "$aircraftNumber" },
                    bestRating: { $first: "$numericRating" },
                    bestScore: { $first: "$bestScore" },
                    user: { $first: "$user" },
                    seatComfort: { $first: "$seatComfort" },
                    seatType: { $first: "$seatType" },
                    traveller: { $first: "$traveller" },
                    valueMoney: { $first: "$valueMoney" },
                    latestReviewDate: { $first: "$date" }
                }
            },
            {
                $project: {
                    _id: 0,
                    airline: "$_id",
                    name: "$_id",
                    averageRating: { $round: ["$averageRating", 1] },
                    totalReviews: 1,
                    route: { $ifNull: ["$route", "N/A"] },
                    aircraftNumber: { $ifNull: ["$aircraftNumber", "N/A"] },
                    bestRating: 1,
                    bestScore: { $round: ["$bestScore", 1] },
                    user: { $ifNull: ["$user", "N/A"] },
                    seatComfort: { $ifNull: ["$seatComfort", "N/A"] },
                    seatType: { $ifNull: ["$seatType", "N/A"] },
                    traveller: { $ifNull: ["$traveller", "N/A"] },
                    valueMoney: { $ifNull: ["$valueMoney", "N/A"] },
                    latestReviewDate: 1
                }
            },
            { $sort: { averageRating: -1, totalReviews: -1 } }
        ]);

        res.json(flights);
    } catch (err) {
        console.error("Flight Summary Error:", err);
        res.status(500).json({ error: "Failed to fetch flight summaries" });
    }
});

// --- REVIEW & SCRAPER ROUTES ---

const scrapingQueue = new Set();
let totalActiveScrapers = 0;
const MAX_CONCURRENT = 3;

app.post('/api/reviews/submit', async (req, res) => {
    try {
        const newReview = new Review({
            ...req.body,
            scrapedAt: new Date() 
        });
        await newReview.save();
        console.log(` Manual review added for: ${req.body.airline}`);
        res.status(201).json({ message: "Review saved successfully", review: newReview });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: "This exact review already exists." });
        }
        console.error(" Post Error:", err);
        res.status(500).json({ error: "Failed to save review" });
    }
});

app.get('/api/reviews/:airline', scraperLimiter, async (req, res) => {
    const airlineSlug = req.params.airline.toLowerCase().trim();
    const forceRefresh = req.query.refresh === 'true';

    try {
        let reviews = await Review.find({ airline: airlineSlug }).sort({ scrapedAt: -1 });
        const ONE_HOUR_AGO = new Date(Date.now() - 1 * 60 * 60 * 1000);
        
        if (forceRefresh && reviews.length > 0 && reviews[0].scrapedAt > ONE_HOUR_AGO) {
            console.log(` Refresh blocked: ${airlineSlug} was updated less than an hour ago.`);
            return res.json(reviews);
        }

        if (reviews.length === 0 || forceRefresh) {
            if (scrapingQueue.has(airlineSlug)) {
                return res.status(202).json({ message: "Scraping in progress..." });
            }

            if (totalActiveScrapers >= MAX_CONCURRENT) {
                return res.status(429).json({ 
                    error: "The server is busy. Please wait 50 seconds." 
                });
            }

            scrapingQueue.add(airlineSlug);
            totalActiveScrapers++; 
            logScraperActivity(`START: Scraping ${airlineSlug}`);
  
            const backupTimer = setTimeout(() => {
                if(scrapingQueue.has(airlineSlug)) {
                    scrapingQueue.delete(airlineSlug);
                }
            }, 60000); 

         try {
                await runScraper(airlineSlug);

                // 2.  Re-fetch the data from DB AFTER scraper finishes 
                reviews = await Review.find({ airline: airlineSlug }).sort({ scrapedAt: -1 });
                
                logScraperActivity(`SUCCESS: Fetched ${reviews.length} reviews for ${airlineSlug}`);
             } catch (scrapeErr) {
                logScraperActivity(`FAILURE: ${airlineSlug} - ${scrapeErr.message}`);
             } finally {
                 scrapingQueue.delete(airlineSlug);
                 clearTimeout(backupTimer); 
                  totalActiveScrapers--; 
                console.log(`Scraper finished. Active: ${totalActiveScrapers}/${MAX_CONCURRENT}`);
            }
        }
        res.json(reviews);
    } catch (err) { 
        res.status(500).json({ error: "Internal Server Error" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`------------------------------------------`);
    console.log(` FlightTracker Backend with Auth Running`);
    console.log(` Reviews API: http://localhost:${PORT}/api/reviews/`);
    console.log(` Auth API: http://localhost:${PORT}/api/auth/`);
    console.log(` Tracker API: http://localhost:${PORT}/api/flight-tracker/`);
    console.log(`------------------------------------------`);
});



