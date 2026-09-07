# D-Mon Hockey Match Announcer 🏑

Automated match graphic generator and Instagram Stories publisher for D-Mon Hockey (Dendermonde), powered by live Twizzit API fixtures and the official club brand identity.

---

## 🚀 Features

- **Twizzit API Synchronization**:
  - Automated retrieval of weekend fixtures via the official Twizzit API (Organization `#32037`).
  - Intelligent server-side caching (4-hour default TTL) & quota guard (500 queries/month limit) to conserve Twizzit API rate limits.
  - Smart home game filter: only home fixtures (`isHome: true`) are selected for publication.
- **Canva-style Graphic Generator**:
  - High-resolution rendering of Instagram Stories (9:16 / 1080×1920) and Feed posts (1:1 / 1080×1080) via HTML5 Canvas.
  - Official brand palette: D-Mon Navy Blue (`#06478D`), Vibrant Scarlet (`#E30613`), Crisp White & Accents.
  - Official D-Mon crest badge with automatic dark/light background detection.
  - Custom drag-and-drop photo upload with persistent local photo library.
  - Dynamic highlight for flagship teams (e.g., Dames 1 & Heren 1) and pitch allocation (Pitch 1, Pitch 2).
- **Instagram Publishing Engine**:
  - Direct 1-click publishing to Instagram Stories via the Meta Graph API.
  - High-res JPEG export for manual sharing across WhatsApp, Facebook, or web.
  - Auto-generated caption with relevant hashtags and match summaries.
- **Weekly Automation & Decision Engine**:
  - Scheduled publication slot (e.g., every Friday morning).
  - **No-Match Rule**: If no home fixtures are scheduled for the weekend, graphic generation and publication are skipped automatically, logging a clean audit status.
- **Access Protection**:
  - Password-protected login system for coaches and communications coordinators.

---

## 🛠️ Configuration (Environment Variables)

Copy `.env.example` to `.env` and configure the required credentials:

```env
# Twizzit API Credentials
TWIZZIT_USERNAME="your_twizzit_username"
TWIZZIT_PASSWORD="your_twizzit_password"
TWIZZIT_ORG_ID="32037"

# Webapp Access Credentials
APP_AUTH_USER="your_admin_username"
APP_AUTH_PASSWORD="your_secure_password"

# Instagram Meta Graph API
INSTAGRAM_ACCOUNT_ID="17841409458406570"
INSTAGRAM_ACCESS_TOKEN="your_meta_graph_access_token"
```

---

## 🎨 How Graphics Are Generated

The application uses a **high-resolution HTML5 Canvas rendering engine** (`1080x1920` px for Instagram Stories or `1080x1080` px for Feed posts). Graphics are rendered programmatically using an offscreen canvas buffer to eliminate flicker and guarantee pixel-perfect typography.

### 1. Flowchart: From Fixture Data to Instagram Story

```mermaid
flowchart TD
    A["Start: Weekly trigger or Coach click"] --> B["Twizzit API Synchronization"]
    B --> C{"Are there home fixtures?"}
    
    C -- No --> D["No-Match Rule: Skip graphic creation"]
    D --> E["Audit log: 0 home matches registered"]
    
    C -- Yes --> F["Data normalization & grouping by day & kickoff time"]
    F --> G["Select action photo & brand kit options"]
    
    subgraph HTML5_Canvas_Engine ["HTML5 Canvas Rendering Engine (1080x1920)"]
        H["Layer 1: Photo Aspect-Cover + Gradient Overlay"] --> I["Layer 2: Club Navy Canvas + SVG Pitch Markings"]
        I --> J["Layer 3: D-Mon Crest Badge + Dynamic Header"]
        J --> K["Layer 4: Adaptive Fixtures Grid & Time Block Grouping"]
        K --> L["Layer 5: Footer, Volunteer Badge & Handle @dmon_hockey"]
    end
    
    G --> H
    L --> M["Export: Canvas to JPEG (95% Quality)"]
    
    M --> N{"Publishing Method"}
    N -- Download --> O["Direct JPEG Download to device"]
    N -- Instagram Story --> P["POST /api/instagram/publish"]
    P --> Q["Meta Graph API: Upload to Media Container"]
    Q --> R["Meta Graph API: Publish Container to IG Story"]
```

---

### 2. Sequence Diagram: Component Interaction

```mermaid
sequenceDiagram
    autonumber
    actor User as Coach / Scheduler
    participant UI as Web Interface (React)
    participant Engine as Canvas Renderer (Offscreen)
    participant Server as Node.js Backend (Express)
    participant Twizzit as Twizzit API v2
    participant Meta as Meta Graph API (Instagram)

    User->>UI: Select weekend / Click 'Generate Visual'
    UI->>Server: GET /api/twizzit/matches?startDate=...&endDate=...
    Server->>Twizzit: GET /v2/api/events (Bearer Token)
    Twizzit-->>Server: JSON (Matches & Teams)
    Server-->>UI: Filtered home matches (isHome: true)
    
    UI->>Engine: renderGraphicToCanvas(options)
    Note over Engine: 1. Load cached photo & club crest<br/>2. Calculate split ratio (44/56%)<br/>3. Compute adaptive font scaling<br/>4. Render time-slot blocks & badges
    Engine-->>UI: Rendered on Canvas (1080x1920 px)

    alt Direct Download
        User->>UI: Click 'Download JPEG'
        UI-->>User: matchday-dmon-[date].jpg
    else Direct Publish to Instagram
        User->>UI: Click 'Publish to Instagram Stories'
        UI->>Engine: canvas.toDataURL('image/jpeg', 0.95)
        UI->>Server: POST /api/instagram/publish (Base64 payload)
        Server->>Server: Write to temporary public file
        Server->>Meta: POST /IG_USER_ID/media (image_url, media_type=STORIES)
        Meta-->>Server: Creation ID (Media container)
        Server->>Meta: POST /IG_USER_ID/media_publish (creation_id)
        Meta-->>Server: Success (Post ID)
        Server-->>UI: 200 OK (Published)
        UI-->>User: Confirmation modal with link to Instagram
    end
```

---

### 3. The 5 Visual Render Layers in Detail

1. **Background & Split Screen (`splitRatio`)**:
   - The left pane showcases the chosen action photo, cropped with `object-fit: cover` math to fill its allocated space without distortion.
   - A bottom gradient ensures readability for the handwritten volunteer note (*"Bar open thanks to our volunteers"*).
   - The right pane (default 56% width for multi-game weekends) is painted in D-Mon Navy Blue (`#06478D`) or a subtle club gradient.
2. **Subtle Hockey Pitch Markings (SVG Vector Texture)**:
   - Mathematically rendered field lines (center line, 23m lines, striking circles) are applied across the navy pane at 8–12% opacity to add depth and authenticity.
3. **Crest Badge & Typography**:
   - The circular transparent D-Mon Hockey crest is positioned in the upper-left corner with a soft drop shadow.
   - Headlines use **Outfit** (900 bold weight) paired with **Barlow** (subtitles) and a dynamic date pill (e.g., `12/09 - 13/09`).
4. **Adaptive Match Layout Engine**:
   - Fixtures are segregated into **Saturday** and **Sunday** columns.
   - Matching kickoff times are grouped (`groupMatchesByTime`), consolidating multiple concurrent matches cleanly under one time header.
   - **Dynamic Font Scaling**: When high match volume is detected (e.g., 8+ games in a weekend), the engine automatically scales down font sizes and line heights so all games fit within Instagram Story safe zones without clipping.
   - Flagship matches (Dames 1 / Heren 1) receive a vibrant scarlet accent (`#E30613`) and pitch badges (`Pitch 1`, `Pitch 2`).
5. **Footer & Branding**:
   - Displays official club venue location (*Dendermonde Hockey Club • Sint-Gillis*) and official Instagram handle (`@dmon_hockey`).

---

## 💻 Local Installation & Setup

```bash
# 1. Install dependencies
npm install

# 2. Start the development server (port 3000)
npm run dev

# 3. Production build
npm run build
npm start
```

---

## 🔒 Security & Credential Isolation

All third-party API credentials, tokens, and secrets are handled strictly server-side (`server.ts`) and are never leaked to client browsers. This repository contains zero hardcoded secrets or access tokens.

