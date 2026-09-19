const { chromium } = require("playwright");
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const CDP_URL = "http://127.0.0.1:9222";

const CHROME_PATH =
    process.env.CHROME_PATH ||
    "/usr/bin/google-chrome";

const CHROME_PROFILE =
    process.env.NAUKRI_CHROME_PROFILE ||
    path.join(
        os.homedir(),
        ".naukri-agent",
        "chrome-profile"
    );

async function isChromeRunning() {
    try {
        const browser = await chromium.connectOverCDP(CDP_URL);
        await browser.close();
        return true;
    } catch (error) {
        return false;
    }
}

function startChrome() {
    console.log("🚀 Starting dedicated Chrome...");

    fs.mkdirSync(CHROME_PROFILE, {
        recursive: true
    });

    const chrome = spawn(
        CHROME_PATH,
        [
            `--user-data-dir=${CHROME_PROFILE}`,
            "--remote-debugging-port=9222",
            "--remote-debugging-address=127.0.0.1",
            "--no-first-run",
            "--no-default-browser-check",
            "https://www.naukri.com/mnjuser/homepage"
        ],
        {
            detached: true,
            stdio: "ignore"
        }
    );

    chrome.unref();
}

async function waitForChrome(timeout = 15000) {
    const start = Date.now();

    while (Date.now() - start < timeout) {
        if (await isChromeRunning()) {
            console.log("✅ Chrome debugging available");
            return;
        }

        await new Promise((resolve) =>
            setTimeout(resolve, 500)
        );
    }

    throw new Error(
        "Chrome started but debugging port 9222 is not available."
    );
}

async function ensureChromeRunning() {
    if (await isChromeRunning()) {
        return;
    }

    startChrome();

    await waitForChrome();
}

async function connectBrowser() {
    await ensureChromeRunning();

    const browser = await chromium.connectOverCDP(
        CDP_URL
    );

    const contexts = browser.contexts();

    if (!contexts.length) {
        throw new Error("No browser context found.");
    }

    const context = contexts[0];
    const pages = context.pages();

    console.log(`🔗 Connected to Chrome`);
    console.log(`📄 Open pages: ${pages.length}`);

    return {
        browser,
        context,
        pages
    };
}
async function setupBrowser() {
    await ensureChromeRunning();

    const browser = await chromium.connectOverCDP(
        CDP_URL
    );

    const contexts = browser.contexts();

    if (!contexts.length) {
        throw new Error("No browser context found.");
    }

    const context = contexts[0];

    let pages = context.pages();

    let page = pages.find((page) =>
        page.url().includes("naukri.com")
    );

    if (!page) {
        page = await context.newPage();
    }

    await page.goto(
        "https://www.naukri.com/mnjuser/homepage",
        {
            waitUntil: "domcontentloaded"
        }
    );

    return {
        browser,
        context,
        page
    };
}

module.exports = {
    connectBrowser,
    setupBrowser
};async function setupBrowser() {
    await ensureChromeRunning();

    const browser = await chromium.connectOverCDP(
        CDP_URL
    );

    const contexts = browser.contexts();

    if (!contexts.length) {
        throw new Error("No browser context found.");
    }

    const context = contexts[0];

    let pages = context.pages();

    let page = pages.find((page) =>
        page.url().includes("naukri.com")
    );

    if (!page) {
        page = await context.newPage();
    }

    await page.goto(
        "https://www.naukri.com/mnjuser/homepage",
        {
            waitUntil: "domcontentloaded"
        }
    );

    return {
        browser,
        context,
        page
    };
}

module.exports = {
    connectBrowser,
    setupBrowser
};