Firebase Functions for Tea Time With The Word

This folder contains two Cloud Functions (TypeScript):

- `getTodaysScripture` - HTTPS endpoint that returns today's scripture. It will read from Firestore doc `meta/dailyScripture` and return the entry for today's date if present; if missing it will generate on-demand and save it.
- `scheduledDailyScripture` - Scheduled job (cron) that runs daily at midnight (configured for Africa/Lagos timezone) and generates/stores that day's scripture in Firestore.

Setup
1. Install dependencies:

```powershell
cd functions; npm install
```

2. Set your GenAI API key securely (one of the options):

a) Using Firebase functions config:

```powershell
firebase functions:config:set genai.key="YOUR_GENAI_API_KEY"
```

OR

b) Use environment variable when deploying via CI: set `GENAI_KEY` in your environment.

3. Build and deploy:

```powershell
cd functions
npm run build
firebase deploy --only functions
```

Notes
- The function writes to `meta/dailyScripture` as a map keyed by `YYYY-MM-DD`.
- Client code should read Firestore `meta/dailyScripture` or call the HTTPS endpoint after deploy.
