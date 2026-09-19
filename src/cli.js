#!/usr/bin/env node

const path = require("path");
const os = require("os");
const {
    connectBrowser,
    setupBrowser
} = require("./browser");
const {
    inspectPage,
    openProfile,
    inspectResume,
    updateResume
} = require("./naukri");
const {
    parseJobArgs,
    searchJobs
} = require("./jobs");

const command = process.argv[2];

async function getNaukriPage() {
    const { pages } = await connectBrowser();

    const page = pages.find((page) =>
        page.url().includes("naukri.com")
    );

    if (!page) {
        throw new Error("Naukri page not found.");
    }

    return page;
}

async function status() {
    console.log("🔍 Checking Naukri browser...");

    const { pages } = await connectBrowser();

    for (const [index, page] of pages.entries()) {
        console.log("");
        console.log(`TAB ${index + 1}`);
        console.log(`Title: ${await page.title()}`);
        console.log(`URL:   ${page.url()}`);
    }
}

async function inspect() {
    const page = await getNaukriPage();

    await inspectPage(page);
}

async function profile() {
    const page = await getNaukriPage();

    await openProfile(page);
}

async function resumeInspect() {
    const page = await getNaukriPage();

    await inspectResume(page);
}

async function update() {
    const page = await getNaukriPage();

    const resumePath = path.join(
        os.homedir(),
        ".naukri-agent",
        "resume",
        "resume.pdf"
    );

    await updateResume(page, resumePath);
}
async function jobs() {
    const page = await getNaukriPage();

    const options = parseJobArgs(
        process.argv.slice(3)
    );

    await searchJobs(
        page,
        options
    );
}
async function setup() {
    console.log("");
    console.log("🚀 Naukri Agent Setup");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");
    console.log(
        "This wizard will configure Naukri Agent on your computer."
    );
    console.log("");
    console.log("What will happen:");
    console.log("  1. Create a private Chrome profile");
    console.log("  2. Start Chrome with remote debugging");
    console.log("  3. Open Naukri");
    console.log("  4. You manually log into Naukri");
    console.log("  5. Detect your authenticated session");
    console.log("  6. Configure your resume location");
    console.log("");
    console.log(
        "🔒 Your Naukri or Google password is never stored by Naukri Agent."
    );
    console.log("");

    // --------------------------------------------------
    // STEP 1
    // --------------------------------------------------

    console.log("📁 Step 1/4 — Preparing local directories");
    console.log("");

    const naukriDir = path.join(
        os.homedir(),
        ".naukri-agent"
    );

    const chromeProfileDir = path.join(
        naukriDir,
        "chrome-profile"
    );

    const resumeDir = path.join(
        naukriDir,
        "resume"
    );

    const fs = require("fs");

    fs.mkdirSync(chromeProfileDir, {
        recursive: true
    });

    fs.mkdirSync(resumeDir, {
        recursive: true
    });

    console.log(`   Chrome profile: ${chromeProfileDir}`);
    console.log(`   Resume folder:  ${resumeDir}`);
    console.log("");
    console.log("✅ Local directories ready");
    console.log("");

    // --------------------------------------------------
    // STEP 2
    // --------------------------------------------------

    console.log("🌐 Step 2/4 — Starting dedicated Chrome");
    console.log("");

    console.log(
        "   Starting Chrome with a separate profile..."
    );

    const { page } = await setupBrowser();

    console.log("");
    console.log("✅ Dedicated Chrome started");
    console.log("✅ Naukri page opened");
    console.log("");

    // --------------------------------------------------
    // STEP 3
    // --------------------------------------------------

    console.log("🔐 Step 3/4 — Naukri Login");
    console.log("");
    console.log(
        "A dedicated Chrome window has been opened."
    );
    console.log("");
    console.log("Please complete the login in Chrome:");
    console.log("");
    console.log("  1. Click Login on Naukri");
    console.log("  2. Login using your preferred method");
    console.log("  3. Complete Google authentication if required");
    console.log("  4. Complete OTP/CAPTCHA manually if requested");
    console.log("  5. Make sure you reach your Naukri homepage");
    console.log("");
    console.log(
        "⚠️  Never enter your password or OTP in this terminal."
    );
    console.log("");
    console.log(
        "⏳ Waiting for Naukri login..."
    );
    console.log("");

    const loginTimeout = 5 * 60 * 1000;
    const startTime = Date.now();

    let loggedIn = false;

    while (Date.now() - startTime < loginTimeout) {
        const currentUrl = page.url();

        if (
            currentUrl.includes("naukri.com/mnjuser/") &&
            !currentUrl.includes("/login")
        ) {
            loggedIn = true;
            break;
        }

        process.stdout.write("   ⏳ Waiting for login...\r");

        await new Promise((resolve) =>
            setTimeout(resolve, 2000)
        );
    }

    console.log("");

    if (!loggedIn) {
        throw new Error(
            "Naukri login was not detected within 5 minutes."
        );
    }

    console.log("✅ Naukri login detected");
    console.log("");

    // --------------------------------------------------
    // STEP 4
    // --------------------------------------------------

    console.log("📄 Step 4/4 — Resume Setup");
    console.log("");

    const resumePath = path.join(
        resumeDir,
        "resume.pdf"
    );

    console.log(
        "Naukri Agent expects your resume here:"
    );

    console.log("");
    console.log(`   ${resumePath}`);
    console.log("");

    if (fs.existsSync(resumePath)) {
        const stats = fs.statSync(resumePath);

        console.log("✅ Resume found");
        console.log(
            `   Size: ${(stats.size / 1024).toFixed(1)} KB`
        );
    } else {
        console.log("⚠️  Resume not found yet.");
        console.log("");
        console.log(
            "That's okay — you can add it after setup."
        );
        console.log("");
        console.log("Example:");
        console.log("");
        console.log(
            "   cp ~/Downloads/my-resume.pdf \\"
        );
        console.log(
            "      ~/.naukri-agent/resume/resume.pdf"
        );
    }

    console.log("");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉 Naukri Agent Setup Complete");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");

    console.log("Your local configuration:");
    console.log("");
    console.log(`Chrome profile:`);
    console.log(`  ${chromeProfileDir}`);
    console.log("");
    console.log(`Resume:`);
    console.log(`  ${resumePath}`);
    console.log("");

    console.log("Next step:");

    if (!fs.existsSync(resumePath)) {
        console.log("");
        console.log("1. Add your resume:");
        console.log(
            "   ~/.naukri-agent/resume/resume.pdf"
        );
        console.log("");
        console.log("2. Run:");
    } else {
        console.log("");
        console.log("Run:");
    }

    console.log("");
    console.log("   naukri-agent update");
    console.log("");

    console.log("The agent will:");
    console.log("  → Start Chrome automatically");
    console.log("  → Connect to your saved Naukri session");
    console.log("  → Open your Naukri profile");
    console.log("  → Find Resume → Update");
    console.log("  → Upload your PDF");
    console.log("");

    console.log(
        "💡 This command can also be run from cron."
    );
    console.log("");

    console.log(
        "🔒 Your Chrome profile and resume remain on your computer."
    );
    console.log("");
}
async function main() {
    switch (command) {

        case "status":
            await status();
            break;

        case "inspect":
            await inspect();
            break;

        case "profile":
            await profile();
            break;

        case "resume-inspect":
            await resumeInspect();
            break;

        case "update":
            await update();
            break;

        case "jobs":
            await jobs();
            break;

        case "setup":
            await setup();
            break;

        default:
            console.log(`
Naukri Agent

Usage:

  naukri-agent setup
  naukri-agent status
  naukri-agent inspect
  naukri-agent profile
  naukri-agent resume-inspect
  naukri-agent update
            `);
    }
}

main().catch((error) => {
    console.error("\n❌ Naukri Agent Error:");
    console.error(error.message);

    process.exit(1);
});