const fs = require("fs");
const path = require("path");

const DEFAULT_JOB_SEARCH = {
    skill: "Node.js",
    experience: "5-8",
    locations: ["Bangalore", "Hyderabad", "Remote"],
    workModes: ["Remote", "Hybrid"],
    postedDays: 3
};

function parseLocations(value) {
    if (!value) {
        return DEFAULT_JOB_SEARCH.locations;
    }

    return value
        .split(",")
        .map(value => value.trim())
        .filter(Boolean);
}

function parseWorkModes(value) {
    if (!value) {
        return DEFAULT_JOB_SEARCH.workModes;
    }

    return value
        .split(",")
        .map(value => value.trim().toLowerCase())
        .filter(Boolean);
}

function parseJobArgs(args) {
    const options = {
        ...DEFAULT_JOB_SEARCH
    };

    for (let i = 0; i < args.length; i++) {

        switch (args[i]) {

            case "--skill":
                options.skill = args[++i];
                break;

            case "--experience":
                options.experience = args[++i];
                break;

            case "--location":
                options.locations = parseLocations(args[++i]);
                break;

            case "--work-mode":
                options.workModes = parseWorkModes(args[++i]);
                break;

            case "--posted":
                options.postedDays = Number(args[++i]);
                break;

            default:
                break;
        }
    }

    return options;
}

async function fillKeyword(page, skill) {

    console.log("🔎 Finding visible keyword input...");

    const keywordInputs = page.locator(
        'input[placeholder*="keyword"]'
    );

    const count = await keywordInputs.count();

    console.log(`   Found ${count} keyword inputs`);

    let keyword = null;

    for (let i = 0; i < count; i++) {

        const input = keywordInputs.nth(i);

        if (await input.isVisible()) {
            keyword = input;
            console.log(
                `   ✅ Using visible keyword input #${i}`
            );
            break;
        }
    }

    if (!keyword) {
        throw new Error(
            "Visible Naukri keyword input not found."
        );
    }

    await keyword.fill(skill);

    console.log(
        `   ✅ Keyword entered: ${skill}`
    );

    await page.waitForTimeout(1000);
}

async function selectExperience(page, experience) {

    const experienceInput = page.locator(
        "#experienceDD"
    );

    await experienceInput.click();

    await page.waitForTimeout(500);

    const option = page
        .locator("text=" + experience)
        .first();

    if (await option.count()) {
        await option.click();
        return;
    }

    throw new Error(
        `Experience option "${experience}" not found.`
    );
}

async function fillLocation(page, locations) {

    const locationInputs = page.locator(
    'input[placeholder*="location"]'
);

const count = await locationInputs.count();

let locationInput = null;

for (let i = 0; i < count; i++) {

    const input = locationInputs.nth(i);

    if (await input.isVisible()) {
        locationInput = input;
        break;
    }
}

if (!locationInput) {
    throw new Error(
        "Visible Naukri location input not found."
    );
}

    await locationInput.fill(
        locations.join(", ")
    );
}

async function submitSearch(page) {

    const searchButton = page.locator(
        'button[aria-label="Search"]'
    ).first();

    await searchButton.click();

    await page.waitForTimeout(4000);
}

async function applyWorkModes(page, workModes) {

    for (const mode of workModes) {

        let selector = null;

        if (mode === "remote") {
            selector = "#chk-Remote-wfhType-";
        }

        if (mode === "hybrid") {
            selector = "#chk-Hybrid-wfhType-";
        }

        if (!selector) {
            continue;
        }

        const checkbox = page.locator(selector);

        if (await checkbox.count()) {

            if (!(await checkbox.isChecked())) {
                await checkbox.check();
            }

        }
    }

    await page.waitForTimeout(2500);
}

async function extractJobs(page) {

    const cards = page.locator(
        "div.cust-job-tuple.sjw__tuple"
    );

    const count = await cards.count();

    const jobs = [];

    for (let i = 0; i < count; i++) {

        const card = cards.nth(i);

        const titleLink = card.locator(
            "a.title"
        ).first();

        const title = (
            await titleLink.innerText()
        ).trim();

        const url = await titleLink.getAttribute(
            "href"
        );

        const companyElement = card.locator(
            "a.comp-name, .comp-name"
        ).first();

        const company = companyElement.count()
            ? (await companyElement.innerText()).trim()
            : "";

        const experienceElement = card.locator(
            ".exp"
        ).first();

        const experience = experienceElement.count()
            ? (await experienceElement.innerText()).trim()
            : "";

        const locationElement = card.locator(
            ".loc"
        ).first();

        const location = locationElement.count()
            ? (await locationElement.innerText()).trim()
            : "";

        const descriptionElement = card.locator(
            ".job-desc"
        ).first();

        const description = descriptionElement.count()
            ? (await descriptionElement.innerText()).trim()
            : "";

        const cardText = (
            await card.innerText()
        ).trim();

        const postedMatch = cardText.match(
            /(\d+\s+(?:day|days|hour|hours|minute|minutes)\s+ago|just now)/i
        );

        const posted = postedMatch
            ? postedMatch[1]
            : "";

        const jobIdMatch = url
            ? url.match(/-(\d+)$/)
            : null;

        const jobId = jobIdMatch
            ? jobIdMatch[1]
            : url;

        jobs.push({
            jobId,
            title,
            company,
            experience,
            location,
            description,
            posted,
            url,
            source: "naukri",
            fetchedAt: new Date().toISOString()
        });
    }

    return jobs;
}

function deduplicateJobs(jobs) {

    const map = new Map();

    for (const job of jobs) {

        const key =
            job.jobId ||
            job.url ||
            `${job.title}|${job.company}|${job.location}`;

        if (!map.has(key)) {
            map.set(key, job);
        }
    }

    return [...map.values()];
}

async function goToNextPage(page) {

    const next = page
        .locator("a")
        .filter({
            hasText: /^Next$/i
        })
        .first();

    if (!(await next.count())) {
        return false;
    }

    const href = await next.getAttribute("href");

    if (!href) {
        return false;
    }

    const currentUrl = page.url();

    await next.click();

    await page.waitForTimeout(3500);

    if (page.url() === currentUrl) {
        return false;
    }

    return true;
}

function saveJobs(jobs, options) {

    const date = new Date()
        .toISOString()
        .slice(0, 10);

    const safeSkill = options.skill
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const outputDir = path.join(
        process.env.HOME,
        "naukri-agent",
        "jobs",
        `${date}-${safeSkill}`
    );

    fs.mkdirSync(outputDir, {
        recursive: true
    });

    const jsonPath = path.join(
        outputDir,
        "results.json"
    );

    fs.writeFileSync(
        jsonPath,
        JSON.stringify(
            {
                search: options,
                fetchedAt: new Date().toISOString(),
                totalJobs: jobs.length,
                jobs
            },
            null,
            2
        )
    );

    const csvPath = path.join(
        outputDir,
        "results.csv"
    );

    const headers = [
        "jobId",
        "title",
        "company",
        "experience",
        "location",
        "posted",
        "url"
    ];

    const escapeCsv = value => {
        return `"${String(value ?? "")
            .replace(/"/g, '""')
        }"`;
    };

    const csv = [
        headers.join(","),
        ...jobs.map(job =>
            headers
                .map(header =>
                    escapeCsv(job[header])
                )
                .join(",")
        )
    ].join("\n");

    fs.writeFileSync(
        csvPath,
        csv
    );

    return {
        outputDir,
        jsonPath,
        csvPath
    };
}

async function searchJobs(page, options) {

    console.log("");
    console.log("==========================================");
    console.log("🔎 NAUKRI JOB SEARCH");
    console.log("==========================================");

    console.log(`Skill:       ${options.skill}`);
    console.log(`Experience:  ${options.experience}`);
    console.log(`Locations:   ${options.locations.join(", ")}`);
    console.log(`Work modes:  ${options.workModes.join(", ")}`);
    console.log(`Posted:      ${options.postedDays} days`);

    await page.goto(
        "https://www.naukri.com/jobs-in-india",
        {
            waitUntil: "domcontentloaded",
            timeout: 30000
        }
    );

    await page.waitForTimeout(3000);

    await fillKeyword(
        page,
        options.skill
    );

    await selectExperience(
        page,
        options.experience
    );

    await fillLocation(
        page,
        options.locations
    );

    await submitSearch(page);

    await applyWorkModes(
        page,
        options.workModes
    );

    const allJobs = [];

    const visitedPages = new Set();

    let pageNumber = 1;

    while (true) {

        const currentUrl = page.url();

        if (visitedPages.has(currentUrl)) {
            break;
        }

        visitedPages.add(currentUrl);

        console.log("");
        console.log(
            `📄 Reading page ${pageNumber}: ${currentUrl}`
        );

        await page.waitForTimeout(2000);

        const jobs = await extractJobs(page);

        console.log(
            `   Found ${jobs.length} jobs`
        );

        allJobs.push(...jobs);

        const hasNext = await goToNextPage(page);

        if (!hasNext) {
            break;
        }

        pageNumber++;

        if (pageNumber > 100) {
            console.log(
                "⚠️ Safety limit of 100 pages reached."
            );
            break;
        }
    }

    const uniqueJobs = deduplicateJobs(
        allJobs
    );

    const saved = saveJobs(
        uniqueJobs,
        options
    );

    console.log("");
    console.log("==========================================");
    console.log("✅ JOB SEARCH COMPLETE");
    console.log("==========================================");

    console.log(
        `Pages scanned: ${visitedPages.size}`
    );

    console.log(
        `Jobs collected: ${allJobs.length}`
    );

    console.log(
        `Unique jobs:    ${uniqueJobs.length}`
    );

    console.log("");
    console.log(`📄 JSON: ${saved.jsonPath}`);
    console.log(`📊 CSV:  ${saved.csvPath}`);

    return uniqueJobs;
}

module.exports = {
    DEFAULT_JOB_SEARCH,
    parseJobArgs,
    searchJobs
};
