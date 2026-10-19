# 🔬 Master Stitch UI/UX Redesign Prompt: Academic & Scientific Research Symposium (Light Theme)

Use the detailed prompt below inside Stitch, v0, or your frontend design generator to completely redesign the event platform into a clean, modern, light-themed academic research portal:

---

```text
Design a world-class, ultra-clean, light-themed Event Registration & Payment Portal inspired by academic innovation, scientific discovery labs, and university research symposiums.

### 🎨 Light Design System & Visual Language:
- Theme: "Academic & Tech Research Symposium" / "Scientific Discovery Desk" (Light Mode)
- Aesthetic: Clean white research paper / blueprint desk aesthetic with subtle, elegant scientific doodle line art watermarks (magnifying glasses, discovery lightbulbs, molecule nodes, data flowcharts, circuit traces, and graph charts).
- Color Palette:
  • Canvas & Backgrounds: Crisp Off-White / Paper Surface (`#F8FAFC`, `#F1F5F9`, `#FFFFFF`) with subtle geometric micro-grid lines (`rgba(148, 163, 184, 0.12)`)
  • Cards & Surfaces: Pure White (`#FFFFFF`) with subtle border lines (`#E2E8F0`, `#CBD5E1`) and soft elevated layered shadows (`shadow-sm`, `shadow-md`)
  • Primary Brand & Actions: Royal Academic Cobalt (`#2563EB`, `#1D4ED8`) with gentle glow effects
  • Secondary Brand / Discovery Accents: Electric Cyan / Sky (`#0284C7`, `#38BDF8`), Innovation Gold (`#D97706`, `#F59E0B`), and Mint Emerald (`#059669`, `#10B981`)
  • Text & Typography: Deep Charcoal Navy (`#0F172A`, `#1E293B`) for primary text and Muted Slate (`#64748B`) for helper text.
- Typography:
  • Headings: Bold, intellectual modern sans-serif ("Space Grotesk" or "Outfit" or "Plus Jakarta Sans")
  • Body / Forms: Highly legible clean sans-serif ("Inter" or "Plus Jakarta Sans")
  • Data / Tokens / IDs / Timers: Precision Monospace ("JetBrains Mono" or "Fira Code")

---

### 📄 Detailed Page-by-Page Breakdown (Light Theme):

---

### Page 1: 🌟 Landing & Event Overview (`/`)
- Hero Section:
  • Top Pill Badge: "🔬 National Student Research Symposium & Innovation Challenge 2026" with light blue pill background (`bg-blue-50 border border-blue-200 text-blue-700`).
  • Main Heading: "Investigate. Innovate. Present Your Breakthrough Research." in deep slate navy (`#0F172A`).
  • Dynamic Live Slot Counter Pill (Light themed):
    - Displays `Available Slots: XX / 100`, `Active 7-Min Holds: YY`, and `Confirmed Teams: ZZ` in a clean white badge with an emerald live pulsating dot.
  • Call-to-Action Buttons:
    - Primary CTA: "Reserve Team Slot & Register" (Solid Cobalt Blue `#2563EB` with shadow `#2563EB/25`).
    - Secondary CTA: "Check Registration Status" (Clean white card with subtle border `#E2E8F0`).
- Research Tracks Grid:
  • 4 Clean White Cards with soft pastel badge icons and subtle hover lift:
    1. 🤖 Artificial Intelligence & Cognitive Computing (Blue tint)
    2. 🌿 Sustainable Energy & Green Engineering (Emerald tint)
    3. ⚡ Embedded Systems & IoT Robotics (Amber tint)
    4. 🧬 Biomedical Informatics & Healthcare (Violet tint)
- Guidelines & Information Card:
  • Clean structured card with crisp bullet points: 2 members per team, rules, registration fee, venue, and deadline.

---

### Page 2: 📝 Team Details Entry Form (`/register` - Step 1 of 2)
- Step Wizard Indicator:
  • Clean pill stepper: `Step 1 of 2: Team Details` ➔ `Step 2 of 2: Payment & Verification`.
- Team Name Card:
  • Input field with clean white background, `#E2E8F0` border, and focused cobalt outline.
  • Real-time availability indicator: Spinner while checking, green checkmark if available, red warning if taken.
- Dual Researcher Cards (Pure White with colored top accent border):
  • Card 1: Lead Researcher (Member 1) — Top border in Royal Blue (`#2563EB`):
    - Clean inputs: Full Name, Register Number (auto-uppercase), Academic Email, 10-Digit Mobile, Department Selector, Section, Year of Study, and Gender.
  • Card 2: Co-Researcher (Member 2) — Top border in Violet (`#7C3AED`):
    - Identical clean inputs with instant intra-team duplicate detection.
- Sticky Action Footer:
  • "Proceed to Payment (Locks Slot for 7 Minutes) ➔" button.
  • Atomically reserves a 7-minute slot hold before advancing to Step 2.

---

### Page 3: 💳 Payment & 7-Minute Slot Hold (`/register` - Step 2 of 2)
- 7-Minute Slot Hold Header Banner:
  • Light Emerald Card (`bg-emerald-50 border border-emerald-200 text-emerald-900`):
    - Live Countdown Timer: `07:00` in bold monospaced green font.
    - Pulsating green dot + Text: "Temporary Slot Reserved • Guaranteed lock while you complete payment".
    - If expired: Transitions to soft rose alert with a 1-click "Re-reserve Slot" button.
- Left Column: Payment Details Card (Pure White):
  • Total Registration Fee Pill (`₹499 For Team of 2`).
  • Official UPI QR Code Container (Crisp white contrast frame with scan badge).
  • "Refresh QR Code" button: Allows students to fetch the latest QR code if admin hot-swaps it mid-event.
- Right Column: Payment Proof Submission Card (Pure White):
  • Transaction ID / UTR alphanumeric input field.
  • Drag-and-Drop Screenshot Upload zone:
    - Dashed slate border (`border-2 border-dashed border-slate-300 hover:border-blue-500`).
    - Instant thumbnail preview with file name, file size, and remove/replace action.
  • Team Summary Pill (Clean slate badge showing Team and Member names).
  • Anti-freeze Submit Button: "Submit Team Registration" (Gradient Emerald-Teal with zero loading freeze guarantee).
  • "Back to Details" button (frees the slot hold if clicked).

---

### Page 4: 🎉 Registration Success & Verification (`/success/:id`)
- Celebration Hero:
  • Green checkmark badge with soft confetti particles.
  • Heading: "Registration Submitted Successfully!" in deep navy.
- Registration Passport Card (Pure White with shadow-md):
  • Prominent Registration ID Badge (`REG-XXXX-XXXX`) with a 1-click "Copy ID" button.
  • Team Name, Member Details, Transaction ID, and Submission Timestamp.
  • Status Badge: `PENDING VERIFICATION` in warm amber (`bg-amber-50 text-amber-700 border-amber-200`).
- Official WhatsApp Community Groups Card:
  • Clean list of active WhatsApp groups with 1-click "Join WhatsApp Group" green buttons.
- Next Steps Checklist:
  • Clear roadmap explaining verification timeframe (2–6 hrs) and how to track status.

---

### Page 5: 🔍 Public Student Status Tracker (`/status`)
- Search Header:
  • Minimalist white search card: "Enter your Registration ID (e.g. REG-XXXX-XXXX)".
- Live Status Result Card:
  • Verified Badge: `bg-emerald-50 text-emerald-800 border-emerald-300` ("Payment Approved • Team Confirmed").
  • Pending Badge: `bg-amber-50 text-amber-800 border-amber-300` ("Payment Verification in Progress").
  • Rejected Badge: `bg-rose-50 text-rose-800 border-rose-300` (Displays specific admin feedback).
  • Sanitized team details (Names, Department, Year, Timestamp) without exposing private phone numbers.

---

### Page 6: 🛡️ Admin Dashboard & Live Management Hub (`/admin`)
- Light Academic Control Center:
  • Top Metric Cards: Total Teams, Active 7-Min Holds, Pending Reviews, Verified Teams, Rejected, Remaining Slots in clean white cards with pastel indicator icons.
  • Registrations Table:
    - Search bar, department dropdown, and status filter tabs (`All`, `Pending`, `Verified`, `Rejected`).
    - Clean table rows with alternating subtle background, screenshot thumbnail preview modal, and 1-click `Verify` and `Reject` actions.
    - Export to Excel (`.xlsx`) download button.
  • Live Event Controls:
    - QR Code Manager: Upload or hot-swap UPI QR image on the fly.
    - Capacity Limit Modifier & Master Registration Toggle.
    - WhatsApp Groups Coordinator.
```
