This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Deploy on Netlify

1. Push the repository to GitHub, including `package-lock.json`, `prisma/schema.prisma`, `prisma/seed.ts`, and the `public/challenges` directory. Do not commit `.env`.
2. In Netlify, choose **Add new site** > **Import an existing project** and select this GitHub repository.
3. Use these build settings:
	- Build command: `npm run build`
	- Publish directory: `.next`
4. Add these environment variables in **Site configuration** > **Environment variables** for the Production deploy context: `DATABASE_URL`, `JWT_SECRET`, `FLAG_SALT`, and `ADMIN_SECRET_KEY`. Copy the values from your local `.env`; never paste `.env` into GitHub.
5. Before the first deploy, ensure the PostgreSQL database has the Prisma schema and seed data. From the project directory, run `npx prisma db push` once, then `npx tsx prisma/seed.ts` once.
6. Trigger a deploy and test `/login`, registration, the arena, and `/admin`.

Netlify will use its Next.js runtime for the App Router and API routes. The database remains external; Netlify does not persist a local database or uploaded files between deploys.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
