# e-Tunisia

A community-driven platform for discovering, sharing, and celebrating tourism in Tunisia. Built for both local and foreign tourists, e-Tunisia combines social features (posts, comments, voting) with travel-specific tools (interactive map, events, tips, gamification).

## Project Structure

```
e-tunisia/
  frontend/   # Flutter mobile app (original)
  web/        # Vite + TypeScript web app (new)
  backend/    # NestJS API server
```

## Web Version (New)

A full web frontend built with **Vite + vanilla TypeScript** -- no framework dependencies. Designed for desktop and mobile browsers.

### Features

- Reddit-style feed with voting, comments, sharing
- Explore page with place cards, ratings, and category filters
- Interactive map (Leaflet + OpenStreetMap) with touristic markers and popups
- Events listing with chronological sorting
- Travel tips with category filtering
- Post creation modal (tags, location, photos, member tagging)
- Profile with gamification (XP, levels, badges, leaderboard)
- Notification dropdown with mockup data
- Dark mode (persisted to localStorage)
- Mobile-responsive with bottom nav + slide-out drawer
- OKLCH color system with Tunisian-inspired palette

### How to Run (Web)

```bash
# Navigate to the web directory
cd web

# Install dependencies
npm install

# Start dev server
npm run dev
```

The app will be available at `http://localhost:5173` (or the next available port).

### Build for Production

```bash
cd web
npm run build    # outputs to web/dist/
npm run preview  # preview the production build locally
```

---

## Flutter Version (Original)

The original mobile app built with **Flutter/Dart**. Targets Android and iOS.

### How to Run (Flutter)

```bash
# Navigate to the frontend directory
cd frontend

# Get dependencies
flutter pub get

# Run on a connected device or emulator
flutter run
```

### Requirements

- Flutter SDK (3.x+)
- Android Studio or Xcode for emulators
- A connected device or running emulator

---

## Backend

NestJS API server with authentication, database, and REST endpoints.

```bash
cd backend
npm install
npm run start:dev
```

---

## Key Differences: Web vs Flutter

| Aspect | Flutter (frontend/) | Web (web/) |
|---|---|---|
| Tech | Flutter/Dart | Vite + vanilla TypeScript |
| Target | Mobile (Android/iOS) | Desktop + mobile browsers |
| UI | Material Design widgets | Custom CSS with OKLCH colors |
| Map | Not implemented | Leaflet + OpenStreetMap |
| State | Flutter state management | In-memory + localStorage |
| Backend | Connected to NestJS API | Standalone (mockup data) |
| Status | Original prototype | Web overhaul prototype |
