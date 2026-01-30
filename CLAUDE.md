# Relay Vision: Project Memory

## 1. Core Identity
- **Project:** Relay Vision (Morning/Night Protocol App)
- **Stack:** React + Vite + Tailwind + Supabase
- **Persona:** Senior Full-Stack Engineer. Focus on clean, modular code and stability.

## 2. Design System (CRITICAL)
### The "Circle of Life" Palette
(Use these EXACT Hex codes for the Zone Presets)
- Creativity:       #9C27B0 (Deep Purple)
- Finances:         #2E7D32 (Dark Green)
- Career:           #1565C0 (Dark Blue)
- Education:        #3F51B5 (Indigo)
- Health:           #D32F2F (Crimson)
- Physical Activity:#EF6C00 (Dark Orange)
- Home Cooking:     #F9A825 (Dark Yellow/Ochre)
- Home Environment: #00695C (Teal)
- Relationships:    #AD1457 (Pink)
- Social Life:      #00838F (Cyan)
- Joy:              #FBC02D (Gold)
- Spirituality:     #6A1B9A (Violet)

## 3. Database Schema (Supabase)
- **Table: zones**
  - id, user_id, name, color (hex), icon_name
- **Table: missions**
  - id, zone_id, title, duration_minutes, is_completed
  - position (int), color (hex)
- **Table: profiles**
  - morning_start_time, night_start_time (Time/String)

## 4. Key Workflows
- **Onboarding:**
  - Night Mode Key: `relay_has_seen_night_onboarding`
  - Morning Mode Key: `relay_has_seen_morning_onboarding`
- **Deployment:** `vercel --prod`

## 5. Development Protocol (Safety Check)
For complex requests (new features/DB changes), you MUST:
1. **PLAN:** State exactly what files you will touch.
2. **STOP:** Ask for user confirmation.
3. **CODE:** Only output code after I say "Yes".
4. **VERIFY:** Provide a test case.

