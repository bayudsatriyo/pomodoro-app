# Pomodoro Wellness Assistant

AI-powered Pomodoro timer with posture detection designed specifically for programmers and developers who work long hours on their laptops/PCs.

## Features

- **Pomodoro Timer** - Configurable work sessions (currently 20 seconds for testing)
- **AI Posture Detection** - Real-time posture analysis using GLM Vision API
  - Spine and shoulder monitoring (pain prevention focus)
  - Appearance wellness checks (messy hair, serious face)
  - Programmer-aware (understands laptop work position)
- **Automated Health Reminders**
  - Hydration reminders
  - Stretch/movement reminders
- **Text-to-Speech (TTS)** - All reminders spoken in Indonesian
- **Stacked Modals** - Multiple reminders can display simultaneously
- **Camera Preview** - Small preview window with mirror effect

## Tech Stack

- **Next.js 16.1.1** with Turbopack
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Zustand** - State management
- **GLM-4.6V** - Vision API for posture analysis (z.ai)
- **Google Cloud Storage** - Image hosting with signed URLs
- **Web Speech API** - Text-to-speech synthesis

## Prerequisites

- Node.js 18+ and pnpm
- GLM API key from [z.ai](https://docs.z.ai) (GLM Coding Plan)
- Google Cloud Service Account credentials (for GCS)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pomodoro-app
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Create `.env.local` in the project root:

   ```bash
   # GLM Vision API
   GLM_API_KEY="your-glm-api-key"
   GLM_BASE_URL="https://api.z.ai/api/coding/paas/v4"

   # Debug mode - keep uploaded images in GCS (optional)
   DEBUG_KEEP_GCS_FILES=false

   # Google Cloud Storage
   GCS_PROJECT_ID=your-project-id
   GCS_BUCKET_NAME=your-bucket-name
   GCS_PUBLIC_URL=https://storage.googleapis.com
   GCS_CREDENTIALS='{"type":"service_account",...}'
   ```

4. **Configure timer settings** (optional)

   Edit `config/index.ts`:

   ```typescript
   export const config = {
     app: {
       workDuration: 20, // Timer duration in seconds
       postureCheckEnabled: true,
     },
   };
   ```

## Running Locally

1. **Start the development server**
   ```bash
   pnpm dev
   ```

2. **Open your browser**
   ```
   http://localhost:3000
   ```

3. **Allow camera access** when prompted

4. **Click START** to begin a session

### Test Flow (Current 20-second setup)

| Time | Event |
|------|-------|
| 0s | Timer starts |
| 5s (15s remaining) | Posture check via GLM Vision |
| 10s (10s remaining) | Hydration reminder |
| 20s (0s remaining) | Stretch reminder |

## How It Works

### Posture Detection

1. At 5 seconds after starting, the camera activates briefly
2. Captures a single frame and analyzes it with GLM-4.6V
3. Checks:
   - **Spine** - Curvature/slouching (primary focus)
   - **Shoulders** - Alignment issues
   - **Head** - Looking at laptop is considered normal
   - **Appearance** - Messy hair, serious face (wellness reminder)
4. Returns natural, varied feedback in Indonesian
5. Displays modal + speaks the result

### Health Reminders

- **Hydration** - At 10 seconds remaining
- **Stretch** - At timer end (0 seconds)
- Each reminder plays notification sound + speaks the message

## Configuration

### Timer Duration

Edit `config/index.ts`:

```typescript
app: {
  workDuration: 1500, // 25 minutes for production
}
```

### Posture Check Timing

Edit `components/Health/PostureMonitor.tsx`:

```typescript
// Change trigger time
if (timeRemaining === 15 && !hasCheckedRef.current) {
  // 15s remaining = 5s after start (for 20s timer)
}
```

### Reminder Timing

Edit `components/Health/HealthScheduler.tsx`:

```typescript
// Hydration trigger
if (timeRemaining === 10 && !hydrationTriggeredRef.current) {
  // Change 10 to desired time
}

// Stretch trigger
if (timeRemaining === 0 && !stretchTriggeredRef.current) {
  // Change 0 to desired time
}
```

### GLM Prompt

Edit `lib/prompts.ts` to customize posture check behavior.

## Troubleshooting

### Camera not working

- Check browser permissions
- Ensure HTTPS (required for camera access)
- Check console for errors

### GLM API errors

**401 Unauthorized:**
```bash
# Check API key is valid and not expired
GLM_API_KEY="your-current-key"
```

**Model not found:**
```bash
# Ensure correct endpoint for GLM Coding Plan
GLM_BASE_URL="https://api.z.ai/api/coding/paas/v4"
```

**Empty response:**
- Increase `max_tokens` in `lib/glm.ts`
- Check both `reasoning_content` and `content` fields

### GCS upload errors

**Uniform bucket-level access:**
- The app uses signed URLs (15 min expiry)
- Don't enable `acl: public` on your bucket

### Timer skipping seconds

This is a known visual bug (React state batching). The timer still works correctly internally.

## Project Structure

```
pomodoro-app/
├── app/
│   ├── api/
│   │   └── posture/
│   │       └── analyze/     # GLM Vision API endpoint
│   ├── globals.css
│   └── page.tsx             # Main page
├── components/
│   └── Health/
│       ├── PostureMonitor.tsx
│       ├── HealthScheduler.tsx
│       └── NotificationAlert.tsx
├── config/
│   └── index.ts             # App configuration
├── lib/
│   ├── glm.ts               # GLM API integration
│   ├── prompts.ts           # AI prompts
│   ├── sound.ts             # TTS + notification sounds
│   ├── gcs.ts               # Google Cloud Storage
│   └── storage.ts           # LocalStorage utilities
├── store/
│   ├── timer-store.ts       # Timer state
│   └── health-store.ts      # Health reminders state
├── public/
│   └── timer-worker.js      # Web Worker for timer
└── .env.local               # Environment variables (not in git)
```

## API Credentials

### GLM Vision API

- **Provider:** z.ai (GLM Coding Plan - $3/month)
- **Endpoint:** `https://api.z.ai/api/coding/paas/v4`
- **Models:**
  - `glm-4.6v` - Vision analysis
  - `glm-4.7` - Chat (future features)

### Documentation

- [z.ai Docs](https://docs.z.ai)
- [GLM-4.6V Vision](https://docs.z.ai/guides/vlm/glm-4.6v)
- [Next.js](https://nextjs.org/docs)

## Known Issues

1. **Timer visual skipping** - Sometimes skips seconds visually (functional but annoying)
2. **GLM response bias** - May report posture issues even when sitting correctly (temperature 0.7 helps)

## Next Steps

See `CHECKPOINT.md` for detailed progress tracking and future enhancement ideas.
