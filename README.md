# D-Mon Hockey Match Announcer 🏑

Geautomatiseerde match graphic generator en Instagram Stories publisher voor D-Mon Hockey (Dendermonde) op basis van de Twizzit API en de club brand identity.

---

## 🚀 Features

- **Twizzit API Synchronisatie**:
  - Automatische opvraging van weekend-wedstrijden via de officiële Twizzit API (Organisatie `#32037`).
  - Slimme server-side caching (standaard 4 uur) & rate-limit bewaking (500 queries/maand limiet) om Twizzit API quota te sparen.
  - Slimme filter: enkel **thuismatchen** (`isHome: true`) worden geselecteerd.
- **Canva-stijl Grafische Generator**:
  - Renderen van Instagram Stories (9:16) en Vierkant (1:1) visuals via HTML5 Canvas.
  - Clubkleuren: D-Mon Navy Blue (`#06478D`), Vibrant Scarlet (`#E30613`), White & Accenten.
  - Officiële D-Mon clubbadge met automatische achtergronddetectie.
  - Custom drag-and-drop foto-upload en persistente fotobibliotheek.
  - Dynamic highlight van topmatchen (bv. Dames 1 & Heren 1) en veldallocatie (Veld 1, Veld 2).
- **Instagram Publishing Engine**:
  - Direct posten naar Instagram Stories via de Meta Graph API.
  - Direct downloaden van JPEG's voor handmatige publicatie.
  - Automatisch gegenereerd bijschrift met hashtags en matchoverzicht.
- **Wekelijkse Automatisatie & Decision Engine**:
  - Gepland tijdslot (bv. elke vrijdag om 10:00).
  - **No-Match Rule**: Wanneer er geen thuismatchen zijn in een weekend, wordt er automatisch geen post aangemaakt en een duidelijke statuslog gegenereerd.
- **Toegangsbeveiliging**:
  - Beschermd inlogsysteem voor coaches en communicatieverantwoordelijken.

---

## 🛠️ Configuratie (Omgevingsvariabelen)

Kopieer `.env.example` naar `.env` en configureer de vereiste variabelen:

```env
# Twizzit API Gegevens
TWIZZIT_USERNAME="jouw_twizzit_gebruikersnaam"
TWIZZIT_PASSWORD="jouw_twizzit_wachtwoord"
TWIZZIT_ORG_ID="32037"

# Toegang tot de Webapp
APP_AUTH_USER="jouw_beheerdersnaam"
APP_AUTH_PASSWORD="jouw_sterk_wachtwoord"

# Instagram Meta Graph API
INSTAGRAM_ACCOUNT_ID="17841409458406570"
INSTAGRAM_ACCESS_TOKEN="jouw_meta_graph_token"
```

---

## 💻 Lokale Installatie & Opstarten

```bash
# 1. Installeer dependencies
npm install

# 2. Start de development server (poort 3000)
npm run dev

# 3. Productie build
npm run build
npm start
```

---

## 🔒 Beveiliging

Alle API credentials en tokens worden uitsluitend aan de serverzijde (`server.ts`) verwerkt en worden nooit blootgesteld aan de browser. Er bevinden zich geen hardcoded geheimen of tokens in deze repository.
