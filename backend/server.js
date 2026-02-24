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
    groundService: String,
    valueMoney: String,
    scrapedAt: { type: Date, default: Date.now }
});

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

// --- NEW: FLIGHT SCRAPER FUNCTION (Based on your provided code) ---
async function scrapeFlightLive(flightNumber) {
    // headless: true is better for server/backend usage
    const browser = await chromium.launch({ headless: true }); 
    const page = await browser.newPage();

    try {
        // 1. Go to homepage to handle the mapping (IATA -> ICAO)
        await page.goto('https://www.flightaware.com/', { waitUntil: 'networkidle' });

        // 2. Clear and Type in Search Bar
        const searchInput = 'input[data-testid="search-input"]';
        await page.waitForSelector(searchInput);
        await page.click(searchInput);
        await page.keyboard.press('Control+A');
        await page.keyboard.press('Backspace');
        await page.type(searchInput, flightNumber, { delay: 100 });

        // 3. Wait for the flight-specific result (contains a digit)
        const resultItem = 'li[data-testid="search-result"]';
        const flightResult = page.locator(resultItem).filter({ hasText: /\d/ }).first();
        await flightResult.waitFor({ state: 'visible', timeout: 10000 });

        // 4. Navigate to the Live Page
        await Promise.all([
            page.waitForURL(/\/live\/flight\//i, { waitUntil: 'domcontentloaded', timeout: 20000 }),
            flightResult.click()
        ]);

        // 5. Your Specific Extraction Logic
        await page.waitForSelector('.flightPageSummaryStatus', { timeout: 15000 });

        const result = await page.evaluate(() => {
            const d = window.FlightPageModel?._data;
            const getText = (sel) => document.querySelector(sel)?.innerText?.trim() || "N/A";

            // Your gate cleaning logic
            const gateRaw = getText('.flightPageSummaryOrigin .flightPageSummaryGateTerminal');
            const cleanGate = gateRaw.toLowerCase().replace('left','').replace('right','').replace('gate', '').trim();

            return {
                airline: getText('.flightPageFriendlyIdent .flightPageFriendlyIdentLbl'),
                status: getText('.flightPageSummaryStatus'), 
                duration: getText('.flightPageProgress .flightPageProgressTotal'),
                departure: {
                    actual: getText('.flightPageDataTimesChild .flightPageDataActualTimeText'),
                    date: getText('.flightPageSummaryOrigin .flightPageSummaryDepartureDay'),
                    city: getText('.flightPageSummaryOrigin .flightPageSummaryCity'),
                    cityCode: getText('.flightPageSummaryOrigin .flightPageSummaryAirportCode'),
                    gateTerminal: cleanGate,
                    airport: d?.origin?.friendlyName || "N/A",
                    time: getText('.flightPageSummaryOrigin .flightTime'), 
                    gate:getText('.flightPageSummaryOrigin .flightPageAirportGate'),
                    statusLabel: getText('.flightPageDepartureDelayStatus') 
                },
                arrival: {
                    date: getText('.flightPageSummaryDestination .flightPageSummaryArrivalDay'),
                    city: getText('.flightPageSummaryDestination .flightPageSummaryCity'),
                    cityCode: getText('.flightPageSummaryDestination .flightPageSummaryAirportCode'),
                    airport: d?.destination?.friendlyName || "N/A",
                    terminal: getText('.flightPageSummaryDestination .flightPageSummaryGateTerminal').replace(/terminal/gi, '').trim() || "N/A",
                    time: getText('.flightPageSummaryDestination .flightTime'),
                    statusLabel: getText('.flightPageArrivalDelayStatus'),
                    gate:getText('.flightPageSummaryDestination .flightPageAirportGate'),
                }
            };
        });

        return result;

    } catch (error) {
        console.error("Scrape Error:", error.message);
        throw error;
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
    } catch (err) {
        console.error("Live Tracker Error:", err);
        res.status(500).json({ error: "Failed to fetch live flight data" });
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



// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const rateLimit = require('express-rate-limit');
// const { runScraper } = require('./scraper');
// const fs = require('fs'); // For logging
// const path = require('path'); // For log file path
// // --- NEW AUTH IMPORTS ---
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// require('dotenv').config();
// const app = express();
// app.use(cors());
// app.use(express.json());

// // --- CONFIGURATION ---
// const JWT_SECRET = process.env.JWT_SECRET; // Use a long random string

// // --- LOGGING HELPER ---
// const logScraperActivity = (message) => {
//     const timestamp = new Date().toLocaleString();
//     const logEntry = `[${timestamp}] ${message}\n`;
//     fs.appendFile(path.join(__dirname, 'scraper.log'), logEntry, (err) => {
//         if (err) console.error(" Failed to write to log file:", err);
//     });
// };

// const scraperLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 5,
//     message: { error: "Too many refreshes. Please wait 15 minutes before trying again." },
//     standardHeaders: true,
//     legacyHeaders: false,
//     skip: (req) => req.query.refresh !== 'true'
// });

// // --- MONGODB CONNECTION ---
// mongoose.connect(process.env.MONGO_URI)
// .then(() => console.log(" Connected to MongoDB"))
// .catch(err => console.error(" MongoDB Connection Error:", err));

// // --- NEW: USER SCHEMA FOR AUTH ---
// const userSchema = new mongoose.Schema({
//     name: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
//     createdAt: { type: Date, default: Date.now }
// });

// const User = mongoose.model('User', userSchema);

// // --- EXISTING REVIEW SCHEMA ---
// const reviewSchema = new mongoose.Schema({
//     airline: { type: String, lowercase: true },
//     user: String,
//     rating: String,
//     date: String,
//     review: { type: String, unique: true },
//     traveller: String,
//     seatType: String,
//     route: String,
//     dateFlown: String,
//     seatComfort: String,
//     cabinService: String,
//     groundService: String,
//     valueMoney: String,
//     scrapedAt: { type: Date, default: Date.now }
// });

// const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);


// // SIGNUP ROUTE
// app.post('/api/auth/signup', async (req, res) => { 
//     try { 
//         const { name, email, password } = req.body;
        
//         const userExists = await User.findOne({ email });
//         if (userExists) return res.status(400).json({ error: "Email already registered" });

//         // Hash password before saving to Compass
//         const salt = await bcrypt.genSalt(10);
//         const hashedPassword = await bcrypt.hash(password, salt);

//         const newUser = new User({ name, email, password: hashedPassword });
//         await newUser.save();

//         res.status(201).json({ message: "Account created successfully!" });
//     } catch (err) {
//         console.error("Signup Error:", err);
//         res.status(500).json({ error: "Registration failed" });
//     }
// });
// // LOGIN ROUTE
// app.post('/api/auth/login', async (req, res) => {
//     try {
//         const { email, password } = req.body;
        
//         //  Find the user in your local database
//         let user = await User.findOne({ email });
//         if (!user) return res.status(400).json({ error: "User not found" });

//         //  Check if password matches local DB
//         const isMatch = await bcrypt.compare(password, user.password);

//         //  AUTO-SYNC LOGIC: 
//         // If password doesn't match locally, but we reached this point, 
//         // it means Firebase already verified it on the frontend.
//         if (!isMatch) {
//             console.log(` Syncing new password for: ${email}`);
//             const salt = await bcrypt.genSalt(10);
//             user.password = await bcrypt.hash(password, salt);
//             await user.save(); // Updates local MongoDB with the new password from Firebase
//         }

//         // 4. Generate JWT Token
//       // Inside your login route in server.js
// const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1d' });
        
//         res.json({ 
//             token, 
//             user: { name: user.name, email: user.email } 
//         });
//     } catch (err) {
//         console.error(" Login Error:", err);
//         res.status(500).json({ error: "Login process failed" });
//     }
// });
// // --- REVIEW & SCRAPER ROUTES ---

// const scrapingQueue = new Set();
// let totalActiveScrapers = 0;
// const MAX_CONCURRENT = 3;

// app.post('/api/reviews/submit', async (req, res) => {
//     try {
//         const newReview = new Review({
//             ...req.body,
//             scrapedAt: new Date() 
//         });
//         await newReview.save();
//         console.log(` Manual review added for: ${req.body.airline}`);
//         res.status(201).json({ message: "Review saved successfully", review: newReview });
//     } catch (err) {
//         if (err.code === 11000) {
//             return res.status(400).json({ error: "This exact review already exists." });
//         }
//         console.error(" Post Error:", err);
//         res.status(500).json({ error: "Failed to save review" });
//     }
// });

// app.get('/api/reviews/:airline', scraperLimiter, async (req, res) => {
//     const airlineSlug = req.params.airline.toLowerCase().trim();
//     const forceRefresh = req.query.refresh === 'true';

//     try {
//         let reviews = await Review.find({ airline: airlineSlug }).sort({ scrapedAt: -1 });
//         const ONE_HOUR_AGO = new Date(Date.now() - 1 * 60 * 60 * 1000);
        
//         if (forceRefresh && reviews.length > 0 && reviews[0].scrapedAt > ONE_HOUR_AGO) {
//             console.log(` Refresh blocked: ${airlineSlug} was updated less than an hour ago.`);
//             return res.json(reviews);
//         }

//         if (reviews.length === 0 || forceRefresh) {
//             if (scrapingQueue.has(airlineSlug)) {
//                 return res.status(202).json({ message: "Scraping in progress..." });
//             }

//             if (totalActiveScrapers >= MAX_CONCURRENT) {
//                 return res.status(429).json({ 
//                     error: "The server is busy. Please wait 50 seconds." 
//                 });
//             }

//             scrapingQueue.add(airlineSlug);
//             totalActiveScrapers++; 
//             logScraperActivity(`START: Scraping ${airlineSlug}`);
  
//             const backupTimer = setTimeout(() => {
//                 if(scrapingQueue.has(airlineSlug)) {
//                     scrapingQueue.delete(airlineSlug);
//                 }
//             }, 60000); 

//          try {
//                 await runScraper(airlineSlug);

//                  // 2.  Re-fetch the data from DB AFTER scraper finishes 
//                  // to include the brand new records in the response
//                 reviews = await Review.find({ airline: airlineSlug }).sort({ scrapedAt: -1 });
                
//                 logScraperActivity(`SUCCESS: Fetched ${reviews.length} reviews for ${airlineSlug}`);
//              } catch (scrapeErr) {
//                 logScraperActivity(`FAILURE: ${airlineSlug} - ${scrapeErr.message}`);
//              } finally {
//                  scrapingQueue.delete(airlineSlug);
//                  clearTimeout(backupTimer); 
//                   totalActiveScrapers--; 
//                 console.log(`Scraper finished. Active: ${totalActiveScrapers}/${MAX_CONCURRENT}`);
//             }
//         }
//         res.json(reviews);
//     } catch (err) { 
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//     console.log(`------------------------------------------`);
//     console.log(` FlightTracker Backend with Auth Running`);
//     console.log(` Reviews API: http://localhost:${PORT}/api/reviews/`);
//     console.log(` Auth API: http://localhost:${PORT}/api/auth/`);
//     console.log(`------------------------------------------`);
// });



// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const rateLimit = require('express-rate-limit');
// const { runScraper } = require('./scraper');
// const fs = require('fs'); // For logging
// const path = require('path'); // For log file path

// const app = express();
// app.use(cors());
// app.use(express.json());

// // --- LOGGING HELPER ---
// const logScraperActivity = (message) => {
//     const timestamp = new Date().toLocaleString();
//     const logEntry = `[${timestamp}] ${message}\n`;
//     fs.appendFile(path.join(__dirname, 'scraper.log'), logEntry, (err) => {
//         if (err) console.error("❌ Failed to write to log file:", err);
//     });
// };

// const scraperLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 5,
//     message: { error: "Too many refreshes. Please wait 15 minutes before trying again." },
//     standardHeaders: true,
//     legacyHeaders: false,
//     skip: (req) => req.query.refresh !== 'true'
// });

// mongoose.connect('mongodb://localhost:27017/flightTracker')
// .then(() => console.log("📦 Connected to MongoDB"))
// .catch(err => console.error("❌ MongoDB Connection Error:", err));

// // Updated Schema with detailed fields to match your scraper and MongoDB collection
// const reviewSchema = new mongoose.Schema({
//     airline: { type: String, lowercase: true },
//     user: String,
//     rating: String,
//     date: String,
//     review: { type: String, unique: true },
//     // Detailed Fields Added Here
//     traveller: String,
//     seatType: String,
//     route: String,
//     dateFlown: String,
//     seatComfort: String,
//     cabinService: String,
//     groundService: String,
//     valueMoney: String,
//     scrapedAt: { type: Date, default: Date.now }
// });

// const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

// const scrapingQueue = new Set();
// let totalActiveScrapers = 0;
// const MAX_CONCURRENT = 3;

// // --- NEW: POST ROUTE FOR MANUAL REVIEWS ---
// app.post('/api/reviews/submit', async (req, res) => {
//     try {
//         const newReview = new Review({
//             ...req.body,
//             scrapedAt: new Date() // Sets current time so it shows at the top when sorted
//         });
//         await newReview.save();
//         console.log(`📝 Manual review added for: ${req.body.airline}`);
//         res.status(201).json({ message: "Review saved successfully", review: newReview });
//     } catch (err) {
//         if (err.code === 11000) {
//             return res.status(400).json({ error: "This exact review already exists." });
//         }
//         console.error("❌ Post Error:", err);
//         res.status(500).json({ error: "Failed to save review" });
//     }
// });

// app.get('/api/reviews/:airline', scraperLimiter, async (req, res) => {
//     const airlineSlug = req.params.airline.toLowerCase().trim();
//     const forceRefresh = req.query.refresh === 'true';

//     try {
//         // Initial fetch: Sort by newest scrapedAt so we can check the timestamp of the latest record
//         let reviews = await Review.find({ airline: airlineSlug }).sort({ scrapedAt: -1 });

//         const ONE_HOUR_AGO = new Date(Date.now() - 1 * 60 * 60 * 1000);
        
//         // --- SAFETY CHECK: Prevent crash/over-scraping ---
//         if (forceRefresh && reviews.length > 0 && reviews[0].scrapedAt > ONE_HOUR_AGO) {
//             console.log(`🛑 Refresh blocked: ${airlineSlug} was updated less than an hour ago.`);
//             return res.json(reviews);
//         }

//         // Logic to run scraper if DB is empty OR if allowed forceRefresh is triggered
//         if (reviews.length === 0 || forceRefresh) {
            
//             if (scrapingQueue.has(airlineSlug)) {
//                 return res.status(202).json({ message: "Scraping in progress..." });
//             }

//             if (totalActiveScrapers >= MAX_CONCURRENT) {
//                 console.log("🛑 Server at Max Capacity. Rejecting request.");
//                 return res.status(429).json({ 
//                     error: "The server is busy processing other requests. Please wait 50 seconds and try again." 
//                 });
//             }

//             scrapingQueue.add(airlineSlug);
//             totalActiveScrapers++; 
//             console.log(`📡 Scrapers active: ${totalActiveScrapers}/${MAX_CONCURRENT}`);
            
//             logScraperActivity(`START: Scraping ${airlineSlug} (Total Active: ${totalActiveScrapers})`);

//             const backupTimer = setTimeout(() => {
//                 if(scrapingQueue.has(airlineSlug)) {
//                     console.log(`⚠️ Safety Timeout: Removing ${airlineSlug} from queue.`);
//                     logScraperActivity(`TIMEOUT: Safety trigger for ${airlineSlug}`);
//                     scrapingQueue.delete(airlineSlug);
//                 }
//             }, 60000); 

//             try {
//                 // 1. Run the actual scraper
//                 await runScraper(airlineSlug);

//                 // 2. IMPORTANT: Re-fetch the data from DB AFTER scraper finishes 
//                 // to include the brand new records in the response
//                 reviews = await Review.find({ airline: airlineSlug }).sort({ scrapedAt: -1 });
                
//                 logScraperActivity(`SUCCESS: Fetched ${reviews.length} reviews for ${airlineSlug}`);
//             } catch (scrapeErr) {
//                 console.error("❌ Scraper encountered an error:", scrapeErr.message);
//                 logScraperActivity(`FAILURE: ${airlineSlug} - ${scrapeErr.message}`);
//             } finally {
//                 scrapingQueue.delete(airlineSlug);
//                 clearTimeout(backupTimer);
//                 totalActiveScrapers--; 
//                 console.log(`✅ Scraper finished. Active: ${totalActiveScrapers}/${MAX_CONCURRENT}`);
//             }
//         }

//         // Send the latest data (either from the initial find or the post-scrape find)
//         res.json(reviews);

//     } catch (err) { 
//         console.error("❌ Server Error:", err);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// });

// const PORT = 5000;
// app.listen(PORT, () => {
//     console.log(`------------------------------------------`);
//     console.log(`🚀 FlightTracker Backend Running`);
//     console.log(`🔗 URL: http://localhost:${PORT}/api/reviews/`);
//     console.log(`------------------------------------------`);
// });