# Todo List App

A modern todo list application built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Features

- User authentication with Supabase
- Create and manage multiple todo lists
- Add, edit, and complete tasks
- Set priorities and due dates for tasks
- Filter and sort tasks
- Responsive design for mobile and desktop

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Backend**: Supabase
- **Form Handling**: React Hook Form with Zod validation

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Fill in your Supabase project URL and API keys

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/            # Reusable UI components
│   └── ui/               # shadcn/ui components
├── lib/                  # Utility functions and configurations
│   └── supabase/         # Supabase client and types
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
└── contexts/             # React contexts
```

## Environment Variables

Create a `.env.local` file with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking