# KnightTrace

KnightTrace is a full-stack GenAI web app for coding practice, code review, interview preparation, quizzes, and saved learning history.

The app uses Node.js, Express, MongoDB, Passport.js, EJS, CSS, JavaScript, and the Google Gemini API.

## Main Features

- User signup, signin, logout
- Google OAuth signin
- GitHub OAuth signin
- Protected dashboard: Main application pages are protected and only available after login
- AI Code Lab for code explanation, debugging, review, improvements, test cases, and complexity analysis
- Interview Practice for coding implementation questions with hints, answers, follow-ups, and pinning
- Quiz Generator with multiple-choice questions, score, explanation, and weak-topic review
- Saved Session History with view, edit, favorite, delete, filter, and search
- MongoDB data persistence
- Responsive dark UI
- Favicon and project branding
- Basic security with hashed passwords, secure sessions and security headers

## Tech Stack

### Backend

- Node.js
- Express
- MongoDB native driver
- Passport.js
- express-session
- connect-mongo
- Google Gemini API

### Frontend

- EJS
- HTML
- CSS
- JavaScript
- Font Awesome icons

No React, Vue, Next.js, or frontend framework is used.

## API Used

KnightTrace uses the **Google Gemini API**.

Default model:

```env
GEMINI_MODEL=gemini-2.5-flash
```

The Gemini API key is stored in `.env` and is only used in backend code.

## Database Schema

### users

```js
{
  username: String,
  email: String,
  passwordHash: String,
  salt: String,
  googleId: String,
  githubId: String,
  authProvider: String,
  createdAt: Date,
  updatedAt: Date
}
```

Passwords are not stored as plain text. They are stored securely as `passwordHash` and `salt`.

### sessions

Used for Code Lab sessions.

```js
{
  userId: String,
  type: "code-lab",
  title: String,
  language: String,
  actionType: String,
  userInput: String,
  aiResponse: Object,
  userNotes: String,
  isFavorite: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### interviews

```js
{
  userId: String,
  type: "interview",
  title: String,
  role: String,
  level: String,
  topics: String,
  difficulty: String,
  aiResponse: Object,
  pinnedQuestions: Array,
  userNotes: String,
  isFavorite: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### quizzes

```js
{
  userId: String,
  type: "quiz",
  title: String,
  topic: String,
  difficulty: String,
  questions: Array,
  userAnswers: Array,
  score: Number,
  userNotes: String,
  isFavorite: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### loginSessions

Used by `connect-mongo` to store login sessions.

## CRUD Operations

| CRUD | Where it happens |
|---|---|
| Create | Generate Code Lab, Interview, or Quiz sessions |
| Read | Dashboard, Saved Sessions, single session view |
| Update | Edit session title/notes, favorite/unfavorite, pin/unpin interview questions |
| Delete | Delete old saved sessions |

## Main Routes

| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/users/signup` | Signup page |
| `/users/signin` | Signin page |
| `/users/logout` | Logout |
| `/auth/google` | Google OAuth login |
| `/auth/github` | GitHub OAuth login |
| `/dashboard` | Protected user dashboard |
| `/code` | AI Code Lab |
| `/interviews/new` | Interview Practice |
| `/quizzes/new` | Quiz Generator |
| `/sessions` | Saved Session History |
| `/sessions/:type/:id` | View one saved session |
| `/sessions/:type/:id/edit` | Edit saved session |
| `/sessions/:type/:id/delete` | Delete saved session |
| `/sessions/:type/:id/favorite` | Favorite or unfavorite saved session |

## How to Run Locally

1. Open the backend folder:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the backend folder using `.env.example` as a guide.

4. Start the server:

```bash
npm start
```

5. Open the app:

```text
http://localhost:3000
```

For development with auto-restart:

```bash
npm run dev
```

## Environment Variables

Create `backend/.env`:

```env
MONGO_URI=your_mongodb_atlas_connection_string
DB_NAME=knighttrace
SESSION_SECRET=your_long_random_session_secret

GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

Do not commit the real `.env` file to GitHub.

## Deployment on Render

Use the free Render web service.

Recommended settings:

```text
Build Command: cd backend && npm install
Start Command: cd backend && npm start
```

Add the same environment variables from `.env` into Render's Environment tab.

Do not enter card or payment details.

## Security Notes

- Passwords are hashed with `crypto.scryptSync` and a random salt.
- Session cookies are `httpOnly`.
- Login sessions are stored in MongoDB with `connect-mongo`.
- Gemini API key stays on the backend.
- `helmet` adds safer HTTP headers.
- User pages are protected with authentication middleware.

## Author

Built by Nafisa Tabassum.
