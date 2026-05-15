# mailturtle

**AI-Powered Email Intelligence for Smart Inbox Management**

mailturtle is a Progressive Web Application (PWA) that uses advanced AI to automatically analyze, categorize, and summarize your emails. Organize your inbox like never before with intelligent classification powered by OpenAI's GPT models.

## Features

- **AI-Powered Email Analysis** - Automatically categorizes emails into Work, Personal, Promotions, Alerts, and Other
- **Smart Summaries** - Extract key information from emails instantly
- **Customizable Rules** - Create your own rules to guide AI classification for specific scenarios
- **Progressive Web App** - Works offline and installs on any device like a native app
- **Secure Google Integration** - OAuth 2.0 authentication with your Google account
- **Privacy First** - Your data stays yours. We don't sell or misuse your information
- **Real-time Analysis** - Emails are analyzed and categorized as they arrive

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org) 16.2.2
- **React**: 19.2.4
- **Styling**: Tailwind CSS 4
- **AI**: OpenAI API (GPT-3.5-turbo)
- **PWA**: next-pwa
- **TypeScript**: Full type safety
- **Build**: Turbopack

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm/bun
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd my-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file:
```bash
OPENAI_API_KEY=your_openai_api_key_here
APP_URL=http://localhost:3001
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Development

### Available Scripts

```bash
npm run dev      # Start development server with Turbopack
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

### Project Structure

```
app/
├── page.tsx              # Home page (landing)
├── login/
│   └── page.tsx          # Login page
├── inbox/
│   └── page.tsx          # Email inbox
├── components/
│   ├── EmailList.tsx     # Email listing component
│   ├── EmailDetail.tsx   # Email detail view
│   └── PWA*.tsx          # PWA installation prompts
├── api/
│   └── analyze-email/
│       └── route.ts      # Email analysis API endpoint
├── providers.tsx         # Email context provider
└── layout.tsx            # Root layout
```

## API Endpoints

### POST `/api/analyze-email`

Analyzes an email using AI and returns category and summary.

**Request:**
```json
{
  "subject": "string",
  "preview": "string",
  "body": "string"
}
```

**Response:**
```json
{
  "category": "Work|Personal|Promotions|Alerts|Other",
  "summary": "Brief summary up to 100 characters"
}
```

## Security & Privacy

### AI Guidelines

- AI only accesses email subject, preview, and body for analysis
- Processing happens securely and is never logged long-term
- AI models are regularly audited for bias and accuracy
- Sensitive information is never used for model training
- All analysis respects user privacy and data protection laws

### Data Usage

- Anonymized email patterns help improve category accuracy
- Performance metrics identify problematic email types
- User feedback trains better categorization models
- Personal data is never shared with third parties
- Users can opt-out of data collection at any time

### Google Integration

- OAuth 2.0 authentication - passwords are never stored
- Users control what permissions the app has
- Access can be revoked at any time through Google settings
- All connections are encrypted with industry-standard security

## Deployment

### Deploy on Vercel

The easiest way to deploy mailturtle is on [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add `OPENAI_API_KEY` and `APP_URL` to environment variables
4. Set `APP_URL` to your canonical HTTPS origin in production, for example `https://www.nerve.watch`
5. Deploy

[View deployment docs](https://nextjs.org/docs/app/building-your-application/deploying)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 15+, Chrome Android)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and feature requests, please open an issue on GitHub.
