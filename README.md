# XTech Landing Page

A modern, accessible, and responsive landing page for XTech built with Quasar and Vue 3.

## Tech Stack

- **Framework**: Vue 3 + TypeScript + Quasar 2
- **Build Tool**: Vite
- **Testing**: Vitest
- **Backend**: Supabase (contact form, blog)
- **3D Engine**: Babylon.js
- **Media**: HLS.js, @kixelated/hang

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

## Project Structure

```
src/
├── components/
│   └── landing/
│       ├── AudioPlayer.vue          # Audio music player with playlist
│       ├── BabylonBasicScene.vue    # BabylonJS 3D scene with animated box
│       ├── HlsPlayer.vue            # HLS.js video player
│       ├── MoqPlayer.vue            # Moq/Hang low-latency player
│       └── FirstVisitWelcome.vue    # First-visit welcome modal
├── layouts/
│   └── landing.vue                  # Main landing layout with nav
├── pages/
│   └── landing/
│       ├── index.vue                # Home page
│       ├── features.vue             # Features page
│       ├── blog.vue                 # Blog page (Supabase TODO)
│       ├── babylonjs.vue            # BabylonJS 3D demos
│       ├── demo.vue                 # Media player demos
│       └── contact.vue              # Contact form (Supabase TODO)
├── router/
│   └── routes.ts                    # Route definitions
├── utils/
│   └── logger.ts                    # Logging utility
└── css/
    └── quasar.variables.scss        # Theme variables (Ardenne colors)
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home page with welcome message and quick links |
| `/features` | Features showcase with Cloud, AI, Security |
| `/blog` | Blog posts (Supabase integration pending) |
| `/babylonjs` | 3D scene demos using Babylon.js |
| `/demo` | Media player demos (Audio, HLS.js, Moq/Hang) - all fully functional |
| `/contact` | Contact form (Supabase integration pending) |

## Features

### Accessibility
- Skip-to-content link for keyboard users
- ARIA labels and roles throughout
- Screen reader support with visually-hidden text
- Keyboard navigation (Escape to close dialogs, Arrow keys in player)
- Proper heading hierarchy

### Responsive Design
- Mobile-first approach
- Breakpoints: xs (<600px), sm (600px+), md (1024px+)
- Hamburger menu on mobile
- Responsive grids and layouts

### Components

**FirstVisitWelcome** - Welcome modal shown on first visit
- 4-step tour: Welcome → Features → Demos → Blog
- localStorage/sessionStorage to track first visit
- Keyboard navigable (Escape, Arrow keys)

**AudioPlayer** - Full-featured audio player
- Playlist support with shuffle/repeat
- Keyboard shortcuts: Space (play/pause), Arrows (navigate/seek), M (mute)
- Progress bar with seek functionality
- Volume control
- Full ARIA support
- Add tracks from URL or local files

**BabylonBasicScene** - Interactive 3D BabylonJS scene
- Animated spinning box with Ardenne colors (blue/gold)
- FPS control slider (1-60 FPS) to adjust spin speed
- Play/Pause animation control
- Background music with play/stop
- ArcRotateCamera with mouse/touch orbit controls
- Full accessibility with ARIA labels and screen reader announcements

**HlsPlayer** - HLS.js HTTP Live Streaming video player
- Adaptive bitrate streaming with automatic quality adjustment
- Manual quality selector (Auto, 360p, 480p, 720p, 1080p, etc.)
- Picture-in-Picture support
- Fullscreen toggle
- Custom controls: Play/Pause, Seek, Volume, Mute
- URL input to load any HLS stream

**MoqPlayer** - Moq/Hang low-latency streaming player
- Connection status indicator (Disconnected, Connecting, Connected, Error)
- Simulated latency display (50-250ms)
- Connect/Disconnect controls
- Custom controls: Play/Pause, Seek, Volume, Mute, Fullscreen
- Demo mode with fallback to HLS streams
- URL input for WebRTC/MoQ stream connection

## Color Scheme

Ardenne High School inspired (Jamaica):
- **Primary**: `#1e3a8a` (Deep Blue)
- **Secondary**: `#f59e0b` (Gold)
- **Accent**: `#10b981` (Green)

## Development Notes

### Supabase Integration
Contact form and blog require Supabase setup:
```ts
// In contact.vue / blog.vue
import { createClient } from '@supabase/supabase-js';
const supabase = createClient('YOUR_URL', 'YOUR_KEY');
```

### Adding Tests
Tests are in `src/**/*.test.ts`. Run with:
```bash
pnpm test        # Watch mode
pnpm test:run    # Single run
```

### BabylonJS Scenes
The `/babylonjs` page features a working **Basic Scene**:
- Click on "Basic Scene" to launch the interactive 3D demo
- Adjust animation speed with the FPS slider (1-60)
- Toggle animation play/pause
- Control background music
- Orbit the camera with mouse/touch

Additional scenes (Interactive Objects, Particles, Physics, Animation, AR) are pending implementation.

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Build for production |
| `pnpm test` | Run tests in watch mode |
| `pnpm test:run` | Run tests once |
| `pnpm lint` | Lint code |
| `pnpm format` | Format code |

## License

&copy; {{ year }} XTech. All rights reserved.