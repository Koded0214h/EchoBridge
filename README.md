# ECHOBRIDGE — PHASED PRODUCT REQUIREMENTS DOCUMENT

**Product Name:** EchoBridge  
**Tagline:** Bridging the gap between teh voiced and voiceless
**Version:** 2.0‑PHASED (MVP → Production)  
*Updated: Now includes the full inclusive welcome & onboarding journey*

---

## 1. PROBLEM STATEMENT

People living with disabilities face three persistent challenges:

- **Social Isolation** – difficulty forming meaningful connections, leading to loneliness and exclusion.
- **Communication Barriers** – most platforms rely on typing, complex menus, and visual‑heavy navigation, locking out those with visual, motor, or cognitive impairments.
- **Fragmented Support** – resources are scattered across websites, hotlines, and organisations, making them hard to discover and access.

EchoBridge exists to make support immediate and effortless.

---

## 2. PRODUCT OBJECTIVE

Create a **voice‑first, accessible web application** where users can:

- Express needs naturally by speaking
- Receive instant, relevant help (both visually and audibly)
- Navigate a simple, inclusive interface without typing

**Core principle:** Fast, simple, and accessible for everyone.

---

## 3. PROPOSED SOLUTION

EchoBridge is a voice‑enabled platform that captures a user’s spoken request, matches it to curated resources or supportive responses, and delivers the result through text and audio — all in a clean, high‑contrast, keyboard‑friendly interface.

---

## 4. TARGET USERS

- **Primary:** People with visual, motor, or communication impairments
- **Secondary:** Caregivers and support workers

---

## 5. KEY USER EXPERIENCE (MVP FLOW)

1. **First‑time visitor:**  
   - Sees a calming splash screen with the EchoBridge logo, a short welcome phrase displayed in large text, **and** the same phrase spoken aloud automatically.  
   - After 3–4 seconds, a gentle transition leads to an **audio‑visual onboarding**.

2. **Inclusive onboarding:**  
   - The app asks a simple, welcoming question: *“How would you like to get help today? You can speak or type.”*  
   - The question is both displayed and read aloud.  
   - A large microphone button and a visible text input field sit side‑by‑side.  
   - The user can **answer with voice** (tap the mic) or **type** a response (e.g., “I feel lonely”, “Need food”, “Just browsing”).  
   - The system adapts seamlessly — no wrong way to interact.

3. **Returning users:**  
   - Skip the splash, land directly on the familiar prompt or resource hub.  
   - The last mode (voice/typing) is remembered.

4. **Daily interaction:**  
   - The user speaks or types a need → gets a resource displayed in large, readable text + automatically read aloud.

---

## 6. PHASED IMPLEMENTATION PLAN

The product is divided into two clear phases:

- **Phase 1 – 5‑Day MVP Launch** (Immediate value, hackathon deliverable)  
- **Phase 2 – Production & Ecosystem Expansion** (Post‑MVP enhancements)

---

## 7. PHASE 1 – 5‑DAY MVP (INCLUSIVE FROM THE START)

### 7.1 Goal
Deliver a fully functional voice‑first support tool that welcomes, onboards, and assists every user using both speech and visual elements, completely removing barriers to entry.

### 7.2 Core Features & Modules

#### A. Splash Screen & Spoken Greeting
- **Visual:** Full‑screen, high‑contrast splash (dark background, yellow/white text) with the EchoBridge logo and the message:  
  *“Welcome to EchoBridge. You are not alone. Help is here.”*
- **Audio:** The same message is automatically read aloud using the browser’s TTS (Speech Synthesis API) at a comfortable speed.  
- **Duration:** 3–4 seconds, then fades into the onboarding.
- **Purpose:** Immediately signals that this platform speaks their language — literally — and removes any doubt about how to interact.

#### B. Onboarding Interaction (Dual Input)
- **Prompt:** Displayed and spoken: *“How would you like to get help today? You can speak or type.”*
- **Input Methods:**  
  - **Voice:** Large, centrally placed microphone button (with a pulsing animation when active).  
  - **Text:** A clearly visible text input with placeholder text that also tells the user they can type (“Type what you need…”).  
  - **Fallback:** A keyboard‑friendly “Browse resources” link for those who prefer not to speak or type.
- **Processing:** The user’s spoken or typed input is used to jump to the resource matching engine.  
- **Outcome:** The user never feels forced into a single mode; the interface meets them where they are.

#### C. Voice Input & Recognition
- **Capture:** Browser‑based microphone access (Web Speech API for free, fast prototyping).
- **Processing:** Speech → text, then passed to keyword matching.
- **User experience:** The single microphone button remains always accessible throughout the app (sticky header).

#### D. Request Interpretation & Matching
- **Engine:** Simple keyword‑based matching against a hand‑curated resource database (no heavy AI in MVP).
- **Process:**  
  1. Recognised text is parsed for key phrases (e.g., “I feel lonely”, “need food”, “can’t see well”).  
  2. System returns the most relevant resource category.
- **Database:** Static JSON of resources with `id`, `category`, `title`, `description`, `contact_info`, and `audio_fallback_text`.

#### E. Audio Feedback & Dual‑Output
- **Responses delivered in two forms simultaneously:**  
  - Large, readable text summary (sans‑serif, minimum 18px)  
  - Automatic audio playback of the same text (Speech Synthesis API)
- **Playback controls:** “Play again” button; the text remains visible.

#### F. Resource Hub (Fallback / Browse)
- **Visual grid** of categories with large tappable cards, high contrast icons and labels.
- Fully operable with Tab/Enter, screen‑reader semantic HTML, ARIA labels.
- Each card leads to a list of vetted resources, also read aloud on focus.

#### G. Accessible Interface (Design First)
- **Visual:** High contrast, no distracting animations, large touch targets (min 48px).
- **Navigation:** Full keyboard support, focus indicators, seamless screen‑reader flow.
- **Responsive:** Optimised for mobile‑first voice use.

#### H. Technical Stack (Phase 1)
- **Frontend:** Next.js (React) + Tailwind CSS  
- **Voice Capture:** Web Speech API (SpeechRecognition)  
- **Text‑to‑Speech:** `window.speechSynthesis` API  
- **Resource Data:** JSON file or headless CMS (e.g., Contentful free tier)  
- **Deployment:** Vercel

### 7.3 5‑Day Build Plan (Adjusted with Onboarding)
- **Day 1:** Project scaffold, accessible UI kit, splash screen with auto‑play TTS, basic layout.
- **Day 2:** Onboarding dual‑input screen (voice mic + text input + browse link), STT integration, fallback typing.
- **Day 3:** Keyword matching engine, resource database, display result with TTS.
- **Day 4:** Resource hub browsing, keyboard navigation polish, full accessibility audit.
- **Day 5:** Polish onboarding transition, end‑to‑end user testing, deploy to Vercel.

### 7.4 Success Criteria (Phase 1)
- [ ] Splash screen appears and the welcome message is heard automatically.
- [ ] Onboarding prompt is displayed and spoken; user can answer by voice or by typing.
- [ ] User can tap the microphone and speak a need; or type; or browse resources.
- [ ] The system correctly interprets at least 5 common request patterns.
- [ ] A relevant resource is displayed in large text and read aloud automatically.
- [ ] The entire interface is navigable via keyboard and screen reader passes basic WCAG 2.1 AA checks.
- [ ] Deployed on a public URL.

---

## 8. PHASE 2 – PRODUCTION & ECOSYSTEM EXPANSION

### 8.1 Goal
Transform EchoBridge from a single‑interaction tool into an intelligent, persistent companion and support network for people with disabilities.

### 8.2 New Features

#### A. Intelligent AI Interpretation
- Replace keyword matching with a small language model (e.g., GPT‑4o mini) for natural language understanding.
- AI can ask clarifying questions via voice if the request is ambiguous.

#### B. Personalised User Profiles & History
- Optional, accessible account creation (spoken passphrase or simple PIN).
- History of past requests and resources, with preference settings.

#### C. Peer Connection System
- Opt‑in voice‑only group rooms moderated by NGOs or volunteers.

#### D. Location‑Based Services
- Geolocation (with consent) to find nearest physical resources.

#### E. Multilingual & Dialect Support
- Expand STT/TTS to multiple local languages with AI translation layer.

#### F. Caregiver & Support Worker Portal
- Dashboard to manage resources, view usage trends, and push tailored help.

#### G. Offline‑First & PWA
- Service worker for basic browsing and on‑device voice processing.

#### H. Security & Privacy
- Voice data processed on‑device when possible; no permanent recording storage.

### 8.3 Success Criteria (Phase 2)
- [ ] AI interprets 90%+ of natural requests.
- [ ] Users can create profiles and access history in seconds.
- [ ] Peer connection rooms are active and moderated.
- [ ] Location‑based suggestions have low latency.
- [ ] App works offline for core functions.
- [ ] Available in 3+ languages.

---

## 9. FINAL POSITIONING

EchoBridge starts with a hug, not a login.  
From the very first splash screen, the user knows they are seen, heard, and supported — regardless of how they choose to interact.  
Phase 1 proves that inclusive design and instant voice‑driven help can exist without complexity.  
Phase 2 grows this into a global support ecosystem where **no one has to struggle alone** — they just speak, and EchoBridge answers.

---

*End of EchoBridge Phased PRD (with inclusive welcome & onboarding)*