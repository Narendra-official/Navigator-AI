# OpenSource Navigator AI — Hackathon Live Demo Script

**Event:** Hacktoberfest Hack Day Pune × NIAT–ADYPU  
**Category:** Best Open-Source AI Project  
**Presenter:** Swapnil  
**Duration:** ~5 Minutes  

---

## Demo Goals
Demonstrate a production-grade, full-stack open-source contribution assistant powered by **local open-weight AI** (`deepseek-r1:8b` via Ollama) with:
1. **Spatial UI** (HUD, dark developer palette, responsive layout, quick command palette via `Ctrl+K`).
2. **Multi-Agent System** (8 typed, autonomous specialist agents orbiting an orchestrator nucleus).
3. **Repository Context Grounding** (Distinguishing verified real files from AI hypotheses).
4. **Actionable Roadmaps** (Customizable checklists with 1-click Markdown PR export).

---

## Step 1: System Health & Zero-Cost Architecture (30 Seconds)
1. Point to the top navigation header:
   - **Ollama Status:** Green indicator showing `deepseek-r1:8b` connected locally on port 11434. Emphasize that **zero cloud AI API keys** or paid credits are required.
   - **GitHub API:** Shows live rate-limit status (5,000 req/h authenticated or 60 req/h public fallback).
   - **Contributor Profile:** Demonstrates instant personalization selector (`Beginner`, `Intermediate`, `Advanced`).
2. Press `Ctrl+K` to open the **Spatial Command Palette**:
   - Showcase instant keyboard-first navigation across all workspace modules and direct skill configuration.

---

## Step 2: Live GitHub Issue Discovery (60 Seconds)
1. Navigate to **Discover Issues**:
   - Show pre-filtered, beginner-friendly issues curated from GitHub's live REST API.
   - Test search filter: Language = `python`, Label = `good first issue`, Repo = `pallets/flask`.
   - Highlight the exclusion of pull requests from issue results and real comment counts.
2. Select an issue and click **"Studio"** (or **"Analyze"**):
   - The selected issue seamlessly passes into the **Agent Studio**.

---

## Step 3: Multi-Agent AI Studio & Constellation (90 Seconds)
1. Navigate to **Agent Studio**:
   - Introduce the **2D Agent Constellation**: 7 specialist satellites (Discovery, Understanding, Repo Context, Skill Matching, Planning, Test Strategy, PR Readiness) connected via animated spokes to the central **Orchestrator Nucleus**.
2. Click **"Run Multi-Agent Pipeline"**:
   - Watch the constellation animate as agents transition from `idle` to `running` (amber pulse) to `completed` (emerald glow).
   - Point out that every agent has a typed Pydantic schema, specific prompt instructions, and real execution telemetry (duration in seconds).
3. Click any specialist node (e.g. **Test Strategy Agent** or **PR Readiness Agent**):
   - Open the **Agent Inspector Drawer** on the right.
   - Inspect the verified capabilities, system prompt snippet, and live JSON output payload.
   - Click **"Copy JSON"** to demonstrate clipboard integration.
4. Show the **"Cancel Run"** button and background resilience via the thread-safe `TaskStore`.

---

## Step 4: Spatial Repository Context Explorer (60 Seconds)
1. Switch to **Repo Explorer**:
   - Enter `pallets/flask` (or click directly from an agent output).
   - View the live repository file tree retrieved from GitHub's API.
   - Highlight the **Verified Repository Files** badge and automatic identification of `CONTRIBUTING.md` and test suites.
2. Open a source file (e.g., `src/flask/blueprints.py`):
   - Show the safe file viewer with byte size limit safeguards and line-numbered code viewer.
   - Emphasize the core safety rule: **AI suggestions are clearly marked as hypotheses unless verified against this real tree.**

---

## Step 5: Contribution Roadmap & Markdown Export (60 Seconds)
1. Open **Contribution Plans**:
   - Display a generated structured roadmap with 5 phases:
     1. Preparation & Setup
     2. Investigation
     3. Implementation
     4. Testing Strategy
     5. PR Readiness
   - Check off a completed item.
   - Add a custom task (e.g., *"Set up virtual environment with pytest"*).
2. Click **"Download Markdown"** or **"Copy MD"**:
   - Show the generated Markdown output formatted with GitHub checkboxes and ready to paste directly into a GitHub PR description or issue comment.

---

## Summary & Closing (30 Seconds)
- **100% Open Standards:** Built with Next.js, FastAPI, and open-weight models.
- **Hackathon Alignment:** Perfect fit for the *Best Open-Source AI Project* category.
- **True Utility:** Bridges the intimidating gap between student developers and their very first open-source contribution!
