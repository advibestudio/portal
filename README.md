# AdVibe Studio — website + admin dashboard

A website for your AI video ad agency, with a private **admin dashboard** where you edit the
website, see customer orders (leads) and track client projects.

> **You are a beginner? Perfect — this guide is written for you.** Read it top to bottom once.
> Every step says exactly where to click. Words in `code style` are things you type or paste.

---

## Table of contents

1. [The big picture (read this first)](#part-1--the-big-picture)
2. [How to open the admin page](#part-2--how-to-open-the-admin-page)
3. [Run the site on your computer](#part-3--run-the-site-on-your-computer)
4. [Connect Supabase (database + admin login)](#part-4--connect-supabase-database--admin-login)
5. [The `.env` file (your private keys)](#part-5--the-env-file-your-private-keys)
6. [Connect Make → Google Sheets + SendFox](#part-6--connect-make--google-sheets--sendfox)
7. [Put the site online with GitHub Pages](#part-7--put-the-site-online-with-github-pages)
8. [Everyday jobs](#part-8--everyday-jobs)
9. [Troubleshooting](#part-9--troubleshooting)
10. [Before-you-launch checklist](#part-10--before-you-launch-checklist)
11. [Map of the project files](#part-11--map-of-the-project-files)
12. [Selling in several countries, ads, Pixel, switches, pop-ups & manual orders (NEW)](#part-12--selling-in-several-countries-ads-pixel-switches-pop-ups--manual-orders)
13. [Upgrade steps for the countries update](#part-13--upgrade-steps-for-this-update)
14. [The free strategy session button, the cost card and the “AI video ads” page (NEW)](#part-14--the-free-strategy-session-button-the-cost-card-and-the-ai-video-ads-page)

---

## Part 1 — The big picture

Four services work together. Here is what each one is *for*:

```
 Visitor fills in the order form on your website
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
   SUPABASE                   MAKE.COM
   (your database)            (your automation robot)
   keeps every lead           receives the same lead and
   safely + powers the        passes it on to:
   admin login & editor         ├─► GOOGLE SHEETS  (a row per lead — easy to read/share)
                                └─► SENDFOX        (adds their email to your mailing list)
```

| Service | Job | Do you *need* it? |
|---|---|---|
| **Supabase** | The real database. Stores leads, projects, and **the website text you edit**. Handles the admin login. | **Yes**, for a real launch. Without it the site is in *demo mode* (see below). |
| **Make** | Forwards each new lead to other tools. | Optional but recommended. |
| **Google Sheets** | A simple spreadsheet copy of every lead (a handy backup). | Optional. Filled by Make. |
| **SendFox** | Email marketing: collects emails of people who gave one. | Optional. Filled by Make. |

### Demo mode vs Live mode

The site decides which mode to use **automatically**:

* **Demo mode** — no Supabase keys. Everything you do in the admin is saved **only inside your own
  browser**. A customer's order on *their* phone **never** reaches you. A yellow banner in the admin
  tells you when you are in demo mode. Great for trying things out. **Not usable for a real business.**
* **Live mode** — Supabase keys are present. Real database, real logins, edits go live for every visitor.

### Why this matters (what I found in your original project)

Your original code **did not actually connect to any of the four services** — it had no Supabase,
Google Sheets, SendFox or Make code in it at all. The orders were saved only in the visitor's own browser,
so you would have received nothing. I added the connections properly (this README explains them), and
fixed these other problems:

| Problem found | What I did |
|---|---|
| `npm install` would **fail** for anyone but the original author (the lock file pointed to a private server). | Rebuilt `package-lock.json` using the normal public npm registry. |
| Admin passwords (`owner2026`) were written in the website code — **anyone could read them** in the browser. | Real logins now come from Supabase. The demo passwords only work in demo mode. |
| Website edits were stored only in the editor's browser — **visitors would never see them**. | In live mode edits are saved to Supabase and shown to everyone. |
| Lead reference numbers were random and could repeat across devices. | The database now numbers them in order (`AV-1044`, `AV-1045`…). |
| The "Make webhook" box in Settings only saved on your device, so visitors' browsers never knew the address. | It is now a private build setting (`VITE_MAKE_WEBHOOK_URL`). |
| The Meta Pixel setting existed but did nothing. | Pixel now loads, and fires `Lead` and `Contact` events. |
| A leftover tool plugin and the starter `info.md` file. | Removed. |

---

## Part 2 — How to open the admin page

The admin page lives at the **same address as your website, with `#/admin` added on the end**.

| Where you are | Address to type in the browser |
|---|---|
| On your computer (Part 3) | `http://localhost:3000/#/admin` |
| After going online (Part 7) | `https://YOUR-GITHUB-NAME.github.io/YOUR-REPO-NAME/#/admin` |

Tips:

* The `#` is part of the address. Don't drop it.
* **Bookmark it.** There is deliberately **no public link** to the admin on the website, so customers
  don't see it. (Hiding the link isn't security — the *login* is. But it keeps things tidy.)
* **Logging in**
  * *Demo mode:* owner `owner@advibe.studio` / `owner2026`, or operations `ops@advibe.studio` / `ops2026`.
  * *Live mode:* the email and password you create in Part 4, step 5.
* **Two roles**: **owner** sees everything; **ops** doesn't see the Settings tab.
  ⚠️ This is a *convenience* in the screen, not a hard wall: any signed-in team member could, if technical,
  change settings through the database. Only add people you trust.

---

## Part 3 — Run the site on your computer

You only need this to preview changes before putting them online.

1. Install **Node.js** (the "LTS" version): <https://nodejs.org>. Accept all defaults.
2. Open the project folder. In it, open a terminal:
   * **Windows:** open the folder in File Explorer, click the address bar, type `cmd`, press Enter.
   * **Mac:** right-click the folder → *New Terminal at Folder*.
3. Type this and press Enter (takes ~1 minute the first time):
   ```
   npm install
   ```
4. Start the site:
   ```
   npm run dev
   ```
5. Open <http://localhost:3000>. The admin is at <http://localhost:3000/#/admin>.
6. Press `Ctrl + C` in the terminal to stop it.

Other useful commands: `npm run build` (makes the final files in a `dist` folder; also checks for mistakes).

---

## Part 4 — Connect Supabase (database + admin login)

Do this once. It takes about 15 minutes. Supabase's free plan is enough to start.

### Step 1 — Create a project
1. Go to <https://supabase.com> → **Start your project** → sign up.
2. **New project**. Name: `advibe`. Choose a **database password** (save it in a password manager — you
   won't need it day to day). Pick the **region closest to your customers**.
3. Wait ~2 minutes until the project finishes setting up.

### Step 2 — Create the tables (paste one file)
1. In Supabase's left menu click **SQL Editor** → **New query**.
2. Open the file `supabase/schema.sql` from this project, **copy everything**, paste it in, click **Run**.
3. You should see "Success. No rows returned". (It's safe to run it again later.)

What that did: created the tables (`leads`, `projects`, `site_content`, `profiles`, `audit_log`) and the
security rules. In plain English the rules say: *the public can read the website text; the public can
only **submit** an order (never read other people's); only signed-in team members can see leads,
projects, and edit the site.*

### Step 3 — Copy your two keys
1. Left menu → **Project Settings** (gear icon) → **API** (or **Data API** / **API Keys**, depending on the
   current layout).
2. Copy **Project URL** (looks like `https://abcdefgh.supabase.co`).
3. Copy the **anon / public** key (a long text starting `eyJ…`; newer projects may call it the
   *publishable* key). You'll use both in Part 5.

> 🔒 **Never** use or share the `service_role` / *secret* key. It bypasses all security. This project never
> needs it. The `anon`/publishable key is *meant* to be public.

### Step 4 — Switch off public sign-ups
Left menu → **Authentication** → **Sign In / Providers** (or **Settings**) → turn **off**
"Allow new users to sign up". This stops strangers creating accounts. (Even if they did, the security
rules would give them nothing — but switch it off anyway.)

### Step 5 — Create your admin login
1. Left menu → **Authentication** → **Users** → **Add user** → **Create new user**.
2. Enter your email and a strong password. Tick **Auto Confirm User**. Click **Create user**.

### Step 6 — Make that user "staff"
Being logged in isn't enough; you must also be on the team list.

1. **SQL Editor** → **New query**, paste the following, **change the two values**, and Run:
   ```sql
   insert into public.profiles (id, name, role)
   select id, 'Your Name', 'owner'
   from auth.users
   where email = 'your-email@example.com';
   ```
   (`'owner'` can also be `'ops'` for a teammate. Repeat Steps 5–6 for each teammate.)
2. You should see "Success. 1 row affected". If it says **0 rows**, the email didn't match — check spelling.

### Step 7 — Add the keys to the project
Follow Part 5.

### Step 8 — Test it
1. `npm run dev`, open `http://localhost:3000/#/admin`.
2. The yellow **Demo mode** banner should be **gone**. Sign in with the account from Step 5.
3. Go to **Website** → change something → **Save**. Refresh the public site: your change is there.
4. Open the public site in a **private/incognito window**, fill in the order form.
5. Back in the admin → **Leads**: the order appears. 🎉
   (In Supabase: **Table Editor** → `leads` — you can see the same rows there like a spreadsheet.)

> **Note:** until you press **Save** in the admin once, visitors see the built-in default text. After the
> first save, the database copy is used.

---

## Part 5 — The `.env` file (your private keys)

The site needs three values. They live in a file called **`.env`**, which stays on your computer and is
**never uploaded to GitHub** (it's already in `.gitignore`).

1. In the project folder, find **`.env.example`**. Make a **copy** and name the copy exactly **`.env`**
   (nothing before the dot; on Windows you may need to enable "File name extensions" in Explorer's *View* menu).
2. Open `.env` in Notepad and fill in:
   ```
   VITE_SUPABASE_URL=https://abcdefgh.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...your long key...
   VITE_MAKE_WEBHOOK_URL=https://hook.eu2.make.com/xxxxxxxxxxxx
   ```
   No quotes, no spaces around `=`.
3. **Stop** (`Ctrl+C`) and **restart** `npm run dev`. The site only reads `.env` when it starts.

Leave a line empty to switch that service off (e.g. no Make yet → leave `VITE_MAKE_WEBHOOK_URL=` empty).

---

## Part 6 — Connect Make → Google Sheets + SendFox

**What happens:** when someone submits the order form, the website sends their details to a Make
"webhook" (a private web address Make gives you). Make then does the rest.

### Step 1 — Prepare the Google Sheet
1. Create a new Google Sheet named `AdVibe Leads`.
2. In **row 1**, type these headings, one per column (A to T), exactly:

   `ref` · `submitted_at` · `name` · `business` · `whatsapp` · `email` · `country` · `country_name` · `currency` · `price` ·
   `package_name` · `industry` · `product` · `event` · `notes` · `source` · `utm_source` · `utm_medium` · `utm_campaign` · `page_url`
3. Tip: select column **F** (whatsapp) → *Format → Number → Plain text*, so numbers starting with `+` aren't mangled.

### Step 2 — Create the Make scenario
1. <https://make.com> → **Create a new scenario**.
2. Click the big **+** → search **Webhooks** → choose **Custom webhook**.
3. **Add** → name it `AdVibe order` → **Save**. Make shows you an address like
   `https://hook.eu2.make.com/abc123…`. **Copy it.**
4. Paste it in your `.env` as `VITE_MAKE_WEBHOOK_URL` (Part 5) and restart `npm run dev`.
5. In Make, click **Run once** (the scenario now waits, listening).
6. On your local site, submit a **test order** (use a fake name like "Test Person").
7. Make says *"Successfully determined"* — it has learned the fields (`ref`, `name`, `email`, …). ✅

> The site sends a "fire-and-forget" form post. Because of how browsers protect websites, the site can't
> read Make's reply — so a green tick on the website means "we sent it", not "Make processed it".
> Check Make's **History** tab to see what really arrived.

### Step 3 — Add the Google Sheets step
1. Click the **+** after the webhook → **Google Sheets** → **Add a Row**.
2. Connect your Google account, pick the spreadsheet `AdVibe Leads` and the sheet tab.
3. Make shows one box per column. Click each box and pick the matching field from the webhook
   (e.g. column `name` ← `name`). Map all 20.

### Step 4 — Add the SendFox step (only for people who gave an email)
The email box on the form is *optional*, and SendFox needs an email. So we add a gate:

1. Click the **+** after Google Sheets → **SendFox** → **Create a Contact**.
2. Connect SendFox: in SendFox go to **Account Settings → API → Create New Token**, copy the token
   (shown only once!) and paste it into Make.
3. **Email Address** ← `email` from the webhook. **Lists** ← choose your list.
4. **The gate:** click the small **wrench/filter icon on the line** between Google Sheets and SendFox →
   Label `Has email` → Condition: `email` → **Exists** (or *Is not empty*). Save.
5. *(Optional)* To also store the first and last name, use SendFox's **Make an API Call** module instead:
   `POST /contacts` with body `{"email":"{{email}}","first_name":"{{first_name}}","last_name":"{{last_name}}","lists":[YOUR_LIST_ID]}`.
   (Your list ID is in the web address when you open the list in SendFox.)

> ⚖️ **Consent:** SendFox (like all email tools) requires that people agreed to receive email. The order
> form currently doesn't say so. Add a line near the email box such as *"We'll email you updates and offers.
> Unsubscribe anytime."* — or only use SendFox for transactional follow-up. Check SendFox's terms and your
> local rules (e.g. NDPR in Nigeria).

### Step 5 — Turn it on
1. Bottom-left of the scenario: set **Scheduling** to **Immediately** and switch the scenario **ON**.
2. Run another test order; confirm a new row appears in the Sheet and the contact appears in SendFox.
3. Remember to add the webhook address to GitHub too (Part 7) so the *live* site sends leads.

> **Strategy-session requests** arrive through the same webhook with `source` = `strategy` and `package_name` = `Free strategy session` (price 0). In Make you can add a filter or a router to send them somewhere else (for example a different Google Sheet tab).

> **Updating an older scenario?** The old `price_ngn` field is now two fields, `price` and `currency`, and new
> fields `country`, `country_name` and `source` exist. In Make open the webhook module → **Redetermine data structure**
> → submit one test order, then add the new columns to your sheet and map them.

### Good to know
* **The webhook address can be seen** by anyone who views your site's code. That's normal for websites,
  but it means a bot could send fake leads. In Make, add a filter right after the webhook, e.g. `name`
  length ≥ 2 and `whatsapp` length ≥ 7. If spam ever becomes a problem, ask for the upgrade: send leads
  to Make from a Supabase "Database Webhook" instead (keeps the address private).
* **Supabase is your source of truth.** If Make ever fails, the lead is still in Supabase → *Leads*.
  If Supabase ever fails, the lead is still in Make/Sheets. The customer is never shown an error.
* Make's free plan has a monthly operations limit — each step counts. Check your plan.

---

## Part 7 — Put the site online with GitHub Pages

### Step 1 — Upload the project to GitHub (no Git needed)

You'll use GitHub's website to upload the files by hand. There is no `.git` folder in this project on
purpose — you don't need it.

1. Create a free account at <https://github.com>, then click **+** (top right) → **New repository**.
   Name it e.g. `advibe-studio`, choose **Public** (GitHub Pages is free for public repositories), and
   click **Create repository**.
2. **Unzip** `advibe-studio.zip` on your computer. Open the unzipped `advibe-studio` folder.
3. On your new repository page click **uploading an existing file** (or **Add file → Upload files**).
4. Open the unzipped folder, select **everything inside it** (`Ctrl+A` / `Cmd+A`) and **drag it all**
   into the GitHub page. Drag the *contents*, not the outer `advibe-studio` folder itself — otherwise
   everything ends up one folder too deep and nothing will work.
5. Wait for the progress bars to finish. At the bottom click **Commit changes**.

**Never upload:** a `node_modules` folder, a `dist` folder, or a file named `.env` (it holds your private
keys). If you ran Part 3 on your computer these folders exist — leave them out. (Everything on the
screen in the upload list should be small; if you see thousands of files, `node_modules` got in.)

**Check the upload worked.** On your repository's main page you should see these at the top level:
`src`, `supabase`, `.github`, `index.html`, `package.json`, `package-lock.json`, `README.md` and others.

#### ⚠️ If the `.github` folder is missing
Folders starting with a dot are sometimes skipped by drag-and-drop (especially on Mac, where they are hidden).
Without it nothing gets published, so check. If you can't see `.github` in your repository, create the file
by hand:

1. Repository page → **Add file** → **Create new file**.
2. In the name box type exactly: `.github/workflows/deploy.yml`
   (typing each `/` automatically creates the folders).
3. Paste this whole block into the big text area:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          VITE_MAKE_WEBHOOK_URL: ${{ secrets.VITE_MAKE_WEBHOOK_URL }}
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

4. Click **Commit changes**.

### Step 2 — Give GitHub your three keys ("Secrets")
Repo page → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**. Create three, with
these **exact names**, and the same values as your `.env`:

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | your Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | your Supabase anon/publishable key |
| `VITE_MAKE_WEBHOOK_URL` | your Make webhook address |

### Step 3 — Turn on Pages
Repo → **Settings** → **Pages** → under **Build and deployment**, set **Source = GitHub Actions**.

### Step 4 — Deploy
Every time you commit a change to the repository, GitHub rebuilds and publishes the site automatically
(~2 minutes). Watch it under the repository's **Actions** tab — a green tick means it's live, a red ✗ means
something failed (click it to read why). Your address appears in **Settings → Pages**:
`https://YOUR-NAME.github.io/advibe-studio/`. For the admin, add `#/admin`.

**To change the site later:** on GitHub open the file → click the pencil ✏️ icon → edit → **Commit changes**.
Or upload a replacement: **Add file → Upload files**, drag a file with the **same name and folder** —
GitHub replaces the old one. (Most day-to-day edits don't need this at all — use the admin, Part 8.)

If you only changed a Secret (Step 2), nothing rebuilds by itself: go to **Actions** → *Deploy to GitHub
Pages* → **Run workflow**.

### Step 5 — Tell Supabase your site address
Supabase → **Authentication** → **URL Configuration** → set **Site URL** to your GitHub Pages address.

> Using your own domain (e.g. `advibe.studio`)? GitHub **Settings → Pages → Custom domain**, then update the Site URL above.

---

## Part 8 — Everyday jobs

**Change website text, prices, FAQs, testimonials, videos** → Admin → **Website** → edit → **Save changes**.
No code, no redeploy; it's live immediately.

**Add a video** → Admin → **Website** → **Portfolio** tab → add → paste the **YouTube link** (a normal video, or a
YouTube *Short* link). Set *Orientation* to **Vertical 9:16** for phone-shaped videos (Reels / TikTok / Shorts). The first ones appear on the spinning wall at the top.

**See and chase orders** → Admin → **Leads** (one tap opens WhatsApp). When a lead becomes a client,
use **Convert to project** and track it under **Projects**.

**Change colours** → open `src/styles/studio.css`, edit the block at the top (`:root`). Colours are
three numbers `R G B`. The gold is `--brand: 245 165 36`. To use the green from aistrikeforce.com instead:
`--brand: 1 216 126;` and `--blob-b: 185 240 210;` and `--hero-via: #f4fbf2;`.

**Change fonts** → fonts are installed as packages (`@fontsource…`). The three font names are in the `--font-…`
lines at the top of `studio.css`, and imported in `src/main.tsx`.

**Change the words that aren't in the admin** (section headings like "Every kind of ad your feed is missing.",
nav links) → `src/sections/sections.tsx` and `src/sections/chrome.tsx`. The *italic serif* word in each
heading is the one inside `<em>…</em>`; the hero headline always italicises its last word.

**Default text for a brand-new install** → `src/content/defaultContent.ts`.

**Add a teammate** → Part 4, Steps 5 and 6.

---

## Part 9 — Troubleshooting

| What you see | What it means / what to do |
|---|---|
| Yellow **Demo mode** banner in the admin | Keys missing. Check `.env` (Part 5) — file named exactly `.env`, no quotes, then **restart** `npm run dev`. On GitHub, check the 3 Secrets (Part 7). |
| "Incorrect email or password" in live mode | Re-check the user in Supabase → Authentication → Users. Reset the password there. |
| "This account is not set up as team staff yet" | You skipped Part 4, Step 6. Run that SQL (and check the email spelling). |
| Red bar "Could not load leads / Could not save…" | Usually the SQL (Part 4, Step 2) wasn't run, or ran with an error. Re-run `schema.sql`. Open the browser console (F12 → Console) for details. |
| Website edits don't appear on the public site | Did you press **Save changes**? Do a hard refresh (`Ctrl+Shift+R`). In demo mode edits never leave your browser. |
| Leads appear in Supabase but not in Google Sheets | Make scenario is off, or webhook address wrong. Check Make → **History**. Confirm `VITE_MAKE_WEBHOOK_URL` is set **in GitHub Secrets** for the live site, then push again. |
| Make says "waiting for data" | Click **Run once**, then submit a test order. |
| Videos show a plain gold block | Thumbnails come from YouTube. Check the video ID/link is correct and the video isn't private. |
| Site online but blank / old version | Check the **Actions** tab for a red ✗. Click it to read why. If there is no Actions tab activity at all, the `.github` folder didn't upload (Part 7, Step 1). |
| Nothing is published and Pages says "404" | Settings → Pages → **Source** must be **GitHub Actions** (Part 7, Step 3). Then Actions → **Run workflow**. |
| The upload page is taking forever / shows thousands of files | `node_modules` was included. Cancel, and upload only the files listed in Part 7, Step 1. |
| A country shows the wrong prices or no packages | **Website → Countries & Prices.** An empty price box hides that package in that country. Make sure the ad link ends with the right code (`#/gh`, `#/uk` …). |
| Events show only built-in dates | The free calendar service couldn't be reached from the visitor's browser. Website → **Events → Check calendar now** tells you why. The site keeps working; it just uses the built-in dates. |
| The "just started" pop-ups never appear | They only show **real** orders from the last 72 hours whose owners left the box ticked, and need live mode (Supabase) with `migration-2-countries.sql` run. No recent orders = no pop-ups. |
| Pixel Helper shows nothing | Check the Pixel ID is digits only and saved in Settings (or the country card). It starts about 4 seconds after the page loads. |
| Adding an order says "Could not add the order" | You haven't run `migration-2-countries.sql` yet (Part 13, step 1). |
| The strategy form works but requests aren't labelled “strategy-session request” in Leads | Run `supabase/migration-3-strategy.sql` once (Part 14). Until then they are saved as normal website leads — nothing is lost. |
| `npm install` errors | Make sure Node.js is installed (`node -v` shows a number). Delete the `node_modules` folder and run `npm install` again. |
| Changed a Secret but nothing changed online | Secrets are baked in when the site is *built*. Push any small change (or Actions → **Run workflow**) to rebuild. |

---

### Why the site loads fast on slow internet
* A small branded screen appears **instantly** (before any code downloads); on very slow connections it offers a "Tap to try again" button after 10 seconds.
* The admin dashboard, the order form and the Supabase library are **separate downloads** — normal visitors only fetch what they actually need, and the order form is pre-loaded quietly in the background.
* No animation library: reveals and drop-downs use the browser's built-in features.
* If the database is slow or down, visitors still see the site (it keeps the last copy of your text) and orders still go through to Make.

---

## Part 10 — Before-you-launch checklist

Some text in the default content is **sample placeholder** — replace it before real customers see it:

- [ ] **Payment instructions** — currently a fake bank account (`GTBank 0123456789`). Admin → Website → Settings. Each other country has its own text under **Countries & Prices** (the Ghana MoMo and Kenya M-Pesa numbers are placeholders too).
- [ ] **Prices for Ghana, Kenya, the United States and the United Kingdom** — these started as *starter prices* I made up so the site works on day one. Set your real prices in **Countries & Prices** before you run ads there.
- [ ] **“Typical cost of a traditional video ad”** for each country (Countries & Prices) — my starter numbers are rough guesses. Replace them with figures you can stand behind; the cost card and the “AI video ads” page show them to the public. Leave 0 to hide the comparison in a country.
- [ ] Read the **“AI video ads” page** once (`#/ai-video`) and edit anything that isn't true for you (Part 14). Remember the headline numbers on it (“120+ videos delivered”, “48 businesses served”) are the sample figures from your hero.
- [ ] **CirclesFundMe** — make sure they are happy for you to show their name and logo on your site (a quick WhatsApp or email is enough, keep it for your records). The wording in the spotlight only says what you told us; edit it in the **Client** tab if you want it different.
- [ ] **WhatsApp number** — currently `2348012345678`. Same place. (Digits only, with country code.)
- [ ] **Contact email** — Settings.
- [ ] **Portfolio videos** — the sample YouTube videos are placeholders. Replace with **your own** work.
- [ ] **Testimonials and numbers** ("120+ videos delivered", "48 businesses served", client quotes, result
      badges) — these are sample figures. Only publish numbers and quotes that are **true**; invented
      testimonials can break advertising rules and customers' trust.
- [ ] **Meta Pixel ID** (optional) — Settings.
- [ ] Supabase: public sign-ups **off** (Part 4, Step 4).
- [ ] You can sign in on the **live** site and a test order appears in Leads, Google Sheets and (with an email) SendFox.
- [ ] Add a short **privacy note / email consent** wording near the email box (Part 6, Step 4).
- [ ] The “just started” pop-up tick-box is **pre-ticked** (customers can untick). That is fine in most places, but UK/EU privacy rules prefer boxes that start **unticked**. If you want that for everyone, ask me and I'll flip it — or switch the pop-ups off under Sections.
- [ ] Delete test leads in Admin → Leads.

---

## Part 11 — Map of the project files

```
supabase/schema.sql          ← paste into Supabase once (tables + security + the safe "submit order" function)
.env.example                 ← copy to .env and fill in your keys
.github/workflows/deploy.yml ← the robot that publishes the site to GitHub Pages
src/
  styles/studio.css          ← THE LOOK of the public site (colours, fonts, spacing, cards, buttons)
  components/Wall.tsx        ← the spinning 3D video wall at the top
  components/OrderModal.tsx  ← the order form pop-up
  components/shared.tsx      ← small shared pieces (video card, video player pop-up, headings)
  sections/chrome.tsx        ← navigation bar, hero, trust numbers, "Ads we've made" scroller
  sections/sections.tsx      ← all the other sections (services, pricing, FAQ, footer …)
  pages/PublicSite.tsx       ← puts the sections in order
  pages/admin/…              ← the admin dashboard screens
  content/defaultContent.ts  ← your original copy (the starting text)
  lib/store.tsx              ← the "brain": loads/saves data (Supabase in live mode, browser in demo mode)
  lib/supabase.ts            ← the Supabase connection (the big library loads only on the admin page)
  lib/publicApi.ts           ← tiny, fast code visitors use to read the website text and send orders
  lib/integrations.ts        ← sends each lead to Make
  lib/tracking.ts            ← Meta Pixel (events + per-country pixels)
  lib/country.tsx            ← works out which country a visitor is in (link → saved choice → default)
  lib/money.ts               ← currency formatting, per-country prices, WhatsApp/payment per country
  lib/events.ts              ← the events engine (your events + free holiday calendar + built-in dates)
  lib/useEvents.ts           ← feeds those events into the page
  components/LivePopups.tsx  ← the “just started” pop-ups
  pages/admin/Markets.tsx    ← admin screens: Countries & Prices, Sections, Client, Cost card, Events
  pages/AiVideoPage.tsx      ← the “AI video ads: the full breakdown” page (#/ai-video)
  content/aiPage.ts          ← the words on that page (edit these on GitHub)
  components/StrategyModal.tsx ← the “free strategy session” form
  sections/CostCompare.tsx   ← the “What AI replaces · typical costs” card
  styles/casestudy.css       ← the look of that page
  public/clients/            ← the CirclesFundMe logo files
  supabase/migration-2-countries.sql ← database upgrade for the countries update (Part 13)
  supabase/migration-3-strategy.sql  ← database upgrade for the strategy form (Part 14)
```

**Security summary, honestly:** the Supabase `anon` key and the Make address are visible in the website
code — normal for websites. Your data is protected by the **security rules** in `schema.sql`, not by hiding keys.
Never commit `.env`, never use the `service_role` key, and only add team members you trust.

---

## Part 12 — Selling in several countries, ads, Pixel, switches, pop-ups & manual orders

Everything below is edited in **Admin → Website**, in the new tabs: **Countries & Prices · Sections · Client · Events**.

### 12.1 One page, one link per country (for your ads)
Open **Website → Countries & Prices**. At the top is a list of **ad links**, one per country, each with a **Copy** button:

| Country | Link ends with |
|---|---|
| 🇳🇬 Nigeria | `#/ng` |
| 🇬🇭 Ghana | `#/gh` |
| 🇰🇪 Kenya | `#/ke` |
| 🇺🇸 United States | `#/us` |
| 🇬🇧 United Kingdom | `#/uk` |

Use the right link as the destination of the right ad. It is the **same website**, but that link opens it already showing that
country's **prices and currency, upcoming events, payment instructions, WhatsApp number and Meta Pixel**.
Visitors can also change country themselves with the small flag button in the menu (it is remembered next time).
Someone who arrives on the plain link sees your **default country** (set on the same screen).

Add your normal tracking tags *before* the `#`:
`https://YOURSITE/advibe-studio/?utm_source=facebook&utm_campaign=ghana-nov#/gh`
The campaign name travels with every order into the dashboard, Make and Google Sheets.

### 12.2 Prices for each country
Same tab, **Prices by country**: a grid with every package down the side and every country across the top. Type the price in that
country's own currency (₦, GH₵, KSh, $, £). **Leave a box empty (or 0) and that package is hidden in that country.**
Columns marked **starter prices** are placeholders I filled in — change them.
Each country also has its own card where you can set: a **WhatsApp number**, **how they pay** (e.g. MoMo for Ghana, M-Pesa for Kenya),
a **Meta Pixel ID**, and a **Selling here** switch (switch a whole country off to stop selling there).
**Add another country** at the bottom for future markets.

The order form shows which country the customer is ordering from, and that country, its currency and the price are saved on the order.
The price is double-checked by the database, so nobody can change it from their browser.

### 12.3 Facebook (Meta) Pixel
1. In Meta **Events Manager** copy your Pixel ID (digits only, ~15 numbers).
2. **Website → Settings → Meta Pixel ID** → paste → **Save changes**. Done — it works on every country page.
3. *Optional:* a country can have its **own** Pixel (e.g. a separate ad account for the UK): paste it in that country's card. Empty = it uses the main Pixel.

Events the website sends to Meta (each also carries the country, so you can split results by country):

| Event | When |
|---|---|
| PageView | the page loads (once per country per visit) |
| ViewContent | the visitor scrolls to the packages |
| InitiateCheckout | the order form opens (with price + currency) |
| Lead | the order is submitted (with value + currency) — use this as your conversion |
| Contact | someone taps WhatsApp |

**Check it:** install the free **Meta Pixel Helper** browser extension, open your live site, and it should show your pixel and "PageView".
Orders you type in by hand do not fire the Pixel (they didn't come from an ad click).

### 12.4 Switch parts of the page on or off
**Website → Sections** has an On/Off switch for each block (video wall, trust strip, work gallery, client spotlight, problem, services,
events, why-us, how-it-works, testimonials, FAQs, final call-to-action and the pop-ups). Switch, then **Save changes** — it disappears
from the public page *and* from the menu. Nothing is deleted. The headline/buttons and the packages are always on (that's how people order).

### 12.5 The client spotlight (CirclesFundMe)
Two places, both controlled by **Sections → Client spotlight**:
* a small **"Trusted by CirclesFundMe · Fintech · Repeat client"** badge under the hero buttons, and
* a full **spotlight section** with their logo, a "Repeat client" badge and a short paragraph.

Edit every word (and swap the logo) in **Website → Client**. To show **their videos** inside the spotlight, add the videos in **Portfolio** and
type `CirclesFundMe` in each video's **Client** field — up to 3 appear automatically.
Logo pictures live in the project's `public/clients` folder; to use another logo, upload the picture there and put its path
(e.g. `clients/newlogo.webp`) in the Client tab — or paste any full web address.

### 12.6 Upcoming events — connected to a free calendar
The "Got something coming up?" block fills itself **for each visitor's country**, mixing three sources:
1. **Your own events** (Website → Campaigns — you can now choose which countries each one shows in),
2. **A free public-holiday calendar** — Nager.Date (<https://date.nager.at>), no account or key. It updates itself every year, so December events appear on their own each autumn,
3. **Built-in shopping dates** — Black Friday, Cyber Monday, Christmas, Boxing Day, New Year, Valentine's, Easter, Mother's & Father's Day and each country's national days.
   These are *calculated*, so they work even with no internet.

Each card shows the date and an **"Order by"** date (event date minus 10 days — change it). If your own event and a calendar event are the same thing, yours wins.
It shows the next 6 events within ~5 months, so from about October the list is naturally the **year-end rush**.

**Website → Events** lets you: turn the live calendar and built-in dates on/off, change how many events show / how far ahead to look / the order-by gap, hide events by keyword
(e.g. `workers, observed`), edit the section's words, and press **Check calendar now** to test it for any country. That button tells you plainly whether the calendar service answered;
if it ever can't be reached (it's a free third-party service), visitors simply get the built-in dates — **the section never goes empty or breaks**.
The calendar's answers are kept on each visitor's device for 7 days, so it is called very rarely.

### 12.7 "Just started" pop-ups (real, with the country)
Small notices like **"Ada from 🇬🇭 Ghana — just started their creative process"** appear in the corner of the page.
* They are **real**. They come from orders customers actually submitted, only for those who left **"Show my first name and country…"** ticked on the form.
* Only a **first name and a country** are ever shown — never a surname, phone, email or business.
* Orders you type in by hand **never** appear. If nobody has ordered recently, **no pop-up shows** (there are no fake ones).
* Visitors can close them; they then stay closed for that visit. Timing is set in **Sections → "Just started" pop-ups — settings**.
* They need Supabase (live mode). In demo mode you will only see them for your own test orders.

### 12.8 Typing in an order yourself (backend)
**Admin → Leads → Add order.** Use it for customers who message you on WhatsApp, call, or are referred. Fill in name, phone, country, package
(the standard price for that country is suggested — or type your own), where it came from, status and payment, then **Save order**.
It gets a normal reference number and appears in Leads like any other (marked "entered manually"). A tick-box also sends it to Make (Google Sheets / SendFox).
**Leads** can also be filtered by country, each lead shows its country flag and its own currency, and the **Dashboard** shows revenue **per currency**
(it never adds ₦ and £ together) plus **leads by country**.

---

## Part 13 — Upgrade steps for this update

You are updating a site that already exists, so do these **in order**:

1. **Database (only if you already did Part 4):** Supabase → **SQL Editor → New query** → paste the whole of `supabase/migration-2-countries.sql` → **Run**.
   It adds country/currency columns, keeps all your old orders (they become Nigeria / NGN), and installs the pop-up feature. Safe to run twice.
   *(Brand-new project instead? Run the updated `supabase/schema.sql` — it already includes everything.)*
2. **Files:** upload the changed files from the update zip to GitHub, keeping the same folder paths (a new file goes into its folder; the logo goes in `public/clients/`).
   GitHub rebuilds automatically (Actions tab → green tick).
3. **Your old saved text and prices are kept.** The first time the site loads, your Nigerian prices are carried into the new Nigeria column automatically.
   In **Website → Countries & Prices** review the other four countries' starter prices, then **Save changes**.
4. **Make / Google Sheets:** add the new columns and re-map (see the note in Part 6).
5. Put your Pixel ID in **Settings** if it isn't there yet (12.3), then test with the Meta Pixel Helper.

---

## Part 14 — The free strategy session button, the cost card and the “AI video ads” page

### 14.1 The new main button: “Chat with our team on WhatsApp and get a free strategy session.”
That wording is now the main button at the top of the page, in the closing block near the bottom, and (shortened to **Free strategy session**) in the phone's bottom bar.
**Nobody goes straight to WhatsApp.** The button first opens a short form — country, name, WhatsApp number, business name, *what do you want to promote?*, and an optional email.
When they press **Continue to WhatsApp**:
1. the request is **saved** as a lead (so you have it even if they never send the WhatsApp message) — it carries their country, and your ad's `utm_` tags;
2. it is sent to Make (Google Sheets / SendFox) and to the Meta Pixel as a **Lead** (with no money value, so your ad value numbers stay clean);
3. a confirmation screen shows a **Open WhatsApp** button with their details already typed into the message, so they only press send.

In **Admin → Leads** these appear marked **“strategy-session request”** and **“free session”** (no price). You can change the button wording in **Website → Hero** and **Website → Hero/final call-to-action** as before.
The small round WhatsApp icon (phone bottom bar) and the footer link still open WhatsApp directly for quick questions; the “Just a quick question? WhatsApp us” button near the bottom does too. Package buttons still open the normal order form.

### 14.2 The “What AI replaces · typical costs” card
A small card under the packages comparing **the typical cost of one traditionally-made video ad** with **your real price for one video**, in the visitor's own currency (bars included), with a link to the full page.
* Your side is read from your real prices for that country (the single-video packages).
* The traditional side is set per country in **Website → Countries & Prices** → each country's card → *Typical cost of ONE traditionally-made video ad* (From / To). **My starting numbers are only rough estimates — please replace them with figures you can defend.** Leave them at 0 and the card hides itself in that country.
* Edit the card's words in **Website → Cost card**. Switch it off in **Website → Sections**.

### 14.3 The “AI video ads: the full breakdown” page
Opened from the card's link, or directly at `https://YOURSITE/advibe-studio/#/ai-video` (you can also use it in ads/messages). Its look follows your reference screenshots: the sticky mono top bar, “PART 01…07” tags with underlines, bordered cards, the two comparison tables and the closing call-to-action.
It **re-uses what you already edit**: your problem lines, services, process steps, packages and prices (for the visitor's country), headline numbers, videos and the CirclesFundMe client. So it always matches the rest of the site and the visitor's currency.
Only wording that belongs to this page alone lives in **`src/content/aiPage.ts`** (hero sentence, “who this is for” cards, the table rows, “why we're different”…). To change it: on GitHub open that file → click the pencil ✏️ → change words *between the quote marks* → **Commit changes**. Words in `{curly brackets}` (like `{days}`) fill themselves in — leave them.
It makes **no performance claims** (no “views” or “viral” numbers) — only things that follow from your own setup. If you add claims, make sure they are true.
The page loads as its own small download, so it doesn't slow down the home page.

### 14.4 Smaller fixes in this update
* **Phone view of “Pick your goal”:** the three goal cards were squeezed side by side; on phones they now stack, each full width.
* **Spinning video wall:** hovering no longer stops it — it keeps moving, just about four times slower, and speeds up again when you move away.
* **Remembering the country:** a country that came from an ad link (`#/gh`) is now remembered while the visitor moves to the “AI video ads” page and back.

### 14.5 Upgrade steps for this update
1. **Database:** Supabase → SQL Editor → paste `supabase/migration-3-strategy.sql` → Run. *(Brand-new project? The updated `schema.sql` already has it.)*
2. **Files:** upload the files from the update zip to GitHub, keeping the same folder paths; wait for the green tick under **Actions**.
3. **Website → Countries & Prices:** set each country's *typical traditional cost* (or leave the starter estimates only while testing), then **Save changes**.
4. Check the page at `#/ai-video` on your phone, and press the new main button once to test the strategy form end-to-end.
