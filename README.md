# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/78d63dfc-edc4-4f49-8504-ff52e618a199

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/78d63dfc-edc4-4f49-8504-ff52e618a199) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Set up environment variables
# Copy sample.env to .env and add your API keys
cp sample.env .env
# Then edit .env and add your VITE_GEMINI_API_KEY for the jewelry tag scanner feature

# Step 5: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## 🆕 New Feature: Jewelry Tag Scanner

This app now includes an AI-powered jewelry tag scanner that allows users to:
- Upload images of jewelry tags (top and bottom view)
- Automatically extract jewelry information using AI (Google Gemini)
- Auto-populate the calculator with extracted data
- Get instant price calculations

**Setup Required:**
1. Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Add it to your `.env` file as `VITE_GEMINI_API_KEY`

For detailed documentation, see [JEWELRY_TAG_SCANNER_README.md](./JEWELRY_TAG_SCANNER_README.md)

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/78d63dfc-edc4-4f49-8504-ff52e618a199) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
