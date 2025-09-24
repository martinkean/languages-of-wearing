# The Languages of Wearing - PWA

A Progressive Web App for collecting and analyzing clothing experience data, built with vanilla HTML, CSS, and JavaScript.

## Features

- 📝 Interactive form for collecting clothing experience responses
- 📊 Admin dashboard with data visualization and charts
- 💾 Supabase database integration for secure data storage
- 📱 Full PWA functionality with offline support
- 🎨 Responsive design with professional UI/UX
- 📈 Material quality data visualization with bar charts
- 📋 Data export functionality (CSV format)

## Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd language-of-wearing
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API to get your credentials
3. Copy your project URL and anonymous key

### 3. Configure Environment Variables

#### Option A: Local Development
1. Copy `config.example.js` to `config.js`
2. Fill in your Supabase credentials in `config.js`
3. Include `config.js` in your HTML file

#### Option B: Environment Variables (Recommended)
1. Copy `.env.example` to `.env.local`  
2. Fill in your Supabase credentials
3. Use your hosting platform's build system to inject variables

### 4. Set Up Database Schema

Run this SQL in your Supabase SQL editor:

```sql
-- Create the clothing responses table
CREATE TABLE IF NOT EXISTS clothing_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  physical_feeling text NOT NULL,
  material_quality text NOT NULL CHECK (material_quality IN ('Great', 'Okay', 'Not great')),
  emotional_feeling text NOT NULL,
  favorite_item text NOT NULL,
  favorite_reason text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE clothing_responses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public inserts (for form submissions)
CREATE POLICY "Allow public inserts" 
ON clothing_responses 
FOR INSERT 
TO public 
WITH CHECK (true);

-- Create policy to allow public selects (for admin dashboard)
CREATE POLICY "Allow public selects" 
ON clothing_responses 
FOR SELECT 
TO public 
USING (true);
```

### 5. Deploy

#### GitHub Pages
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Inject environment variables
        run: |
          echo "window.ENV = {" > config.js
          echo "  SUPABASE_URL: '${{ secrets.SUPABASE_URL }}'," >> config.js
          echo "  SUPABASE_ANON_KEY: '${{ secrets.SUPABASE_ANON_KEY }}'" >> config.js
          echo "};" >> config.js
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
```

#### Netlify
1. Connect your repository to Netlify
2. Set environment variables in Site Settings > Environment Variables
3. Add build command: `echo "window.ENV={SUPABASE_URL:'$SUPABASE_URL',SUPABASE_ANON_KEY:'$SUPABASE_ANON_KEY'};" > config.js`

#### Vercel  
1. Import project to Vercel
2. Add environment variables in Project Settings
3. Vercel will automatically handle the build

## File Structure

```
language-of-wearing/
├── index.html              # Main application file
├── stylesheet.css          # All styling and responsive design
├── manifest.json          # PWA manifest
├── service-worker.js      # Offline functionality
├── config.example.js      # Example configuration file
├── .env.example          # Example environment variables
├── .gitignore           # Git ignore patterns
└── README.md           # This file
```

## Security Considerations

- ✅ Only client-safe credentials (anon key) used in frontend
- ✅ Row Level Security (RLS) enabled on database tables  
- ✅ Environment
