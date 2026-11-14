# HOUZQORA, Next.js version

This is the only version going forward. The earlier HTML prototype is retired and is not maintained alongside this app. No HTML prototype files are kept inside this project.

## What this is

Netherlands rental and property inspection platform.

- Netherlands only,
- Currency: euros, rents shown monthly.
- Cities in the seed set: Amsterdam, Rotterdam, Utrecht, The Hague (filter option only for now, no The Hague home in the seed set yet).
- Brand: velvet red #5E1220 as main colour, strawberry red #E63B4E as accent, light strawberry background #FFF5F3, red dots pattern. No forest green.

## How to run it

```bash
cd houzqora-next
npm install
npm run dev
```

Open http://localhost:3000

To check the production build:

```bash
npm run build
npm run start
```

## Routes that work

- `/` landing: hero, search and filter, featured homes, How it works, trust and transparency, footer
- `/properties` all homes with city, bedroom, and rent sorting filters
- `/properties/[slug]` gallery, details, amenities, pricing breakdown (rent, inspection fee, remaining to secure)
- `/how-it-works`, `/about`, `/contact`, `/privacy-policy`, `/terms`, `/inspection-policy`
- `/signup` and `/login`
- `/browse` post-login Welcome browse homes, first page after login
- `/my-homes` streamlined view, only homes involved, fee status, viewing slot picking
- `/checkout/[slug]` demo checkout
- `/admin` placeholder dashboard only

## Agreed flow

1. Public landing shows everything and is eye-catching.
2. Clicking Book inspection or Pay inspection fee, when not signed in, takes the visitor to signup/login.
3. After signup or login, the first page is Welcome browse homes.
4. From there, the visitor can enter My homes.
5. My homes is streamlined: no adverts, only houses involved, fee status, and next steps.

## Business rules shown in the UI

- Inspection fee is per property and non-refundable.
- Paying the inspection fee does not reserve the property.
- The remaining amount to secure is a configured amount per property, not assumed. In the seed set it equals first month rent plus deposit, and the admin will set it per property in a later stage.

## Seed homes

Data lives in code in `lib/properties.ts`, not in a database yet:

- Jordaan, Amsterdam, 2450/month, fee 75, secure 4900
- Katendrecht, Rotterdam, 1850/month, fee 60, secure 3700
- Wittevrouwen, Utrecht, 1695/month, fee 60, secure 3390
- De Pijp, Amsterdam, 2150/month, fee 75, secure 4300
- Kralingen, Rotterdam, 1980/month, fee 80, secure 3960
- Oud-West, Amsterdam, 2290/month, fee 75, secure 4580

## What is real, and what is demo

Real in this stage:

- Next.js 14 App Router, TypeScript, Tailwind CSS pages and components
- Server rendered public pages, client components only for filters, gallery, auth forms, browse, My homes, and checkout
- Seed data, pricing breakdowns, and the full click flow from landing to My homes

Demo only, clearly labelled in the UI:

- Signup and login: stored in the browser only, no real account, no password hashing, no server session
- Checkout: no real money, no Mollie or Stripe, no iDEAL, no server verification
- Email: no Resend email is sent
- Contact form: local confirmation only
- Admin: placeholder dashboard only, no create, edit, delete, or real payment table

Later stages, not faked here:

- Prisma plus PostgreSQL, real auth with hashed passwords and server sessions
- Real admin CRUD, availability controls, and activity log
- Mollie or Stripe with iDEAL, server side init and verification, webhook idempotency
- Resend confirmation email after verified payment only
- Real deployment, with hosting and database in Europe for speed

## Performance notes

- Lean dependencies: Next, React, Tailwind only at runtime
- Public listings are server rendered, interactive parts are small client components
- Images use Next Image with remote Unsplash sources and responsive sizes, no large base64 images in code
- Animations use CSS transform and opacity only, no heavy animation library
- Buttons depress on tap with a transform, as required
