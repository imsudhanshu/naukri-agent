const fs = require("fs");
async function inspectPage(page) {
    console.log("🔎 Inspecting Naukri page...");

    console.log("\nTITLE:");
    console.log(await page.title());

    console.log("\nURL:");
    console.log(page.url());

    console.log("\nVISIBLE BUTTONS:");

    const buttons = await page.locator("button:visible").allTextContents();

    buttons.forEach((button, index) => {
        console.log(`${index + 1}. ${button.trim()}`);
    });

    console.log("\nVISIBLE LINKS:");

    const links = await page.locator("a:visible").allTextContents();

    links
        .map(link => link.trim())
        .filter(Boolean)
        .slice(0, 100)
        .forEach((link, index) => {
            console.log(`${index + 1}. ${link}`);
        });
}
async function openProfile(page) {
    console.log("👤 Opening Naukri profile...");

    const profileLink = page.getByRole("link", {
        name: /view profile/i
    });

    await profileLink.first().click();

    await page.waitForLoadState("domcontentloaded");

    await page.waitForTimeout(1500);

    console.log("\nPROFILE PAGE:");
    console.log("Title:", await page.title());
    console.log("URL:", page.url());

    console.log("\nVISIBLE TEXT:");

    const text = await page.locator("body").innerText();

    console.log(text.substring(0, 12000));
}

async function inspectResume(page) {
    console.log("🔎 Inspecting Resume section...");

    // Find text containing Resume
    const resumeTexts = await page.locator("text=Resume").allTextContents();

    console.log("\nRESUME TEXT:");
    console.log(resumeTexts);

    // Inspect buttons
    console.log("\nBUTTONS:");

    const buttons = await page.locator("button").evaluateAll(buttons =>
        buttons.map((button, index) => ({
            index,
            text: button.innerText?.trim(),
            ariaLabel: button.getAttribute("aria-label"),
            title: button.getAttribute("title"),
            className: button.className
        }))
    );

    console.log(JSON.stringify(buttons, null, 2));

    // Inspect links
    console.log("\nLINKS CONTAINING RESUME / UPDATE:");

    const links = await page.locator("a").evaluateAll(links =>
        links
            .map((link, index) => ({
                index,
                text: link.innerText?.trim(),
                href: link.href,
                ariaLabel: link.getAttribute("aria-label"),
                title: link.getAttribute("title"),
                className: link.className
            }))
            .filter(item =>
                /resume|update|upload/i.test(
                    `${item.text} ${item.ariaLabel} ${item.title}`
                )
            )
    );

    console.log(JSON.stringify(links, null, 2));

    // File inputs
    console.log("\nFILE INPUTS:");

    const fileInputs = await page.locator('input[type="file"]').evaluateAll(inputs =>
        inputs.map((input, index) => ({
            index,
            name: input.name,
            id: input.id,
            accept: input.accept,
            className: input.className
        }))
    );

    console.log(JSON.stringify(fileInputs, null, 2));
}

async function updateResume(page, resumePath) {
    console.log("📄 Starting resume update...");
    console.log(`📎 Resume: ${resumePath}`);

    if (!fs.existsSync(resumePath)) {
        throw new Error(`Resume not found: ${resumePath}`);
    }
    console.log(`🌐 Current URL: ${page.url()}`);
    console.log(`📄 Current title: ${await page.title()}`);
    // Make sure we're on the profile page
    if (!page.url().includes("/mnjuser/profile")) {
        console.log("👤 Opening Naukri profile...");

        await page.goto(
            "https://www.naukri.com/mnjuser/profile",
            {
                waitUntil: "domcontentloaded"
            }
        );

        await page.waitForTimeout(1500);
    }   
    console.log("📝 Page text preview:");

    const currentText = await page.locator("body").innerText();

    console.log(
        currentText.substring(0, 1500)
    );
    console.log("🔎 Finding Resume → Update...");

    const updateLink = page
        .locator("a.secondary-content.typ-14Bold")
        .filter({
            hasText: /^Update$/
        })
        .first();

    if (!(await updateLink.count())) {
        throw new Error("Resume Update button not found.");
    }

    console.log("✅ Resume Update found");

    /*
     * Naukri opens the native Linux file chooser
     * directly when Update is clicked.
     *
     * We MUST start waiting for the filechooser
     * BEFORE clicking Update.
     */

    console.log("⏳ Waiting for Naukri file chooser...");

    const fileChooserPromise = page.waitForEvent(
        "filechooser",
        {
            timeout: 10000
        }
    );

    await updateLink.click();

    console.log("🖱️ Clicked Resume → Update");

    let fileChooser;

    try {
        fileChooser = await fileChooserPromise;
    } catch (error) {
        throw new Error(
            "Naukri did not trigger a file chooser after clicking Update."
        );
    }

    console.log("📂 File chooser intercepted by Playwright");

    await fileChooser.setFiles(resumePath);

    console.log("⬆️ Resume supplied automatically:");
    console.log(`   ${resumePath}`);

    /*
     * Wait for Naukri to process the upload.
     */
    console.log("⏳ Waiting for Naukri to process upload...");

    await page.waitForTimeout(5000);

    /*
     * Screenshot after upload
     */
    const screenshotPath =
        `screenshots/resume-update-${Date.now()}.png`;

    await page.screenshot({
        path: screenshotPath,
        fullPage: true
    });

    console.log(`📸 Screenshot saved: ${screenshotPath}`);

    /*
     * Read the Resume section.
     */
    const bodyText = await page.locator("body").innerText();

    const resumeIndex = bodyText.indexOf(
        "Resume"
    );

    if (resumeIndex !== -1) {
        console.log("\n📋 Resume section:");

        console.log(
            bodyText.substring(
                resumeIndex,
                resumeIndex + 2000
            )
        );
    }

    console.log("\n🏁 Resume upload flow finished.");
}


module.exports = {
    inspectPage,
    openProfile,
    inspectResume,
    updateResume
};
