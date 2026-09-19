# Naukri Agent

A local CLI for automatically updating your Naukri resume using an authenticated Chrome session.

Naukri Agent runs locally on your machine and uses Playwright to control a dedicated Chrome profile.

Your Naukri credentials are never provided to the CLI.

---

[![npm version](https://img.shields.io/npm/v/naukri-agent.svg)](https://www.npmjs.com/package/naukri-agent)
[![npm downloads](https://img.shields.io/npm/dm/naukri-agent.svg)](https://www.npmjs.com/package/naukri-agent)

## ✨ Features

- Update your Naukri resume from the command line
- First-time setup wizard
- Automatically starts a dedicated Chrome instance
- Uses a separate Chrome profile for Naukri
- Reuses your authenticated Naukri session
- Manual Naukri / Google login
- No Naukri password stored by the agent
- No Google login automation
- No CAPTCHA or OTP bypass
- Resume stored locally on your machine
- Works with cron-based automation
- Uses Playwright
- No paid APIs or external services

---

## 📋 Requirements

- Node.js 20+
- Google Chrome
- A Naukri account
- Linux desktop environment

---

## 📦 Installation

Install globally using npm:

```bash
npm install -g naukri-agent