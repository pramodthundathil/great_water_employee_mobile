# Great Waters — Mobile App (Expo SDK 58)

React Native app for employees and approvers. It talks to the Django REST API in the parent folder (`/api/v1/`).

Stack: Expo SDK 58 · React Native 0.88 · React 19.3 · Expo Router · TypeScript.

## Features

| Who | What |
|---|---|
| Everyone | Sign in with Employee ID or e-mail, forgot password (e-mail link), change password, auto sign-out after 30 min in background |
| Employee | Dashboard (leave balances, expense totals, recent activity) · new expense claim with camera / gallery / PDF proof (photos compressed before upload) · save draft, edit before review, submit, withdraw · apply for full / half-day leave with live day count (public holidays excluded), overlap and balance check · leave balance history · holidays · notifications · profile & bank details |
| Lead / Manager | Approvals tab: recommend or reject direct reports' leave |
| Admin Manager | Approvals tab: review expense claims; record reimbursement payments |
| HR Coordinator | Approvals tab: verify leave against balance and policy |
| Director | Approvals tab: final approval of claims and leave |

A rejection always requires a remark, which the employee sees on the claim or leave screen.

## Run in development

Requires Node 22.13+.

```bash
cd mobile_app
npm install

# Django must listen on all interfaces so the phone can reach it:
#   (in the project root)  python manage.py runserver 0.0.0.0:8000
# and DJANGO_ALLOWED_HOSTS in .env must include your computer's LAN IP.

EXPO_PUBLIC_API_URL=http://<your-computer-LAN-IP>:8000/api/v1 npx expo start
```

The API URL can also be set permanently in `app.json` → `expo.extra.apiUrl`.

Demo logins (after `python manage.py populate_initial_data`): `GW-EMP-001`, `GW-ENG-001` (lead), `GW-ADM-001`, `GW-HRC-001`, `GW-DIR-001` — password `Password@123`.

### Expo Go vs. development build

Everything except **push notifications** works in Expo Go. Remote push needs a development or store build and an EAS project ID:

```bash
npx eas-cli@latest init            # writes extra.eas.projectId into app.json
npx eas-cli@latest build --profile development --platform android   # or ios
```

Without a project ID the app skips push registration silently; in-app notifications still work.

## Release builds

```bash
npx eas-cli@latest build --platform android   # AAB for Google Play
npx eas-cli@latest build --platform ios       # needs the Apple Developer account (USD 99/yr)
npx eas-cli@latest submit --platform android|ios
```

Before release: set `extra.apiUrl` to the production HTTPS URL, and check `ios.bundleIdentifier` / `android.package` (`com.greatwaters.ems`).

## Checks

```bash
npm run typecheck     # tsc --noEmit
npm run lint          # expo lint
npx expo-doctor
```

## Structure

```
src/app/                   routes (Expo Router)
  _layout.tsx              auth guard (Stack.Protected)
  sign-in.tsx, forgot-password.tsx
  (app)/(tabs)/            Home · Expenses · Leave · Approvals (approvers only) · More
  (app)/expenses/          form.tsx (new / edit), [id].tsx (detail, approve, record payment)
  (app)/leaves/            new.tsx, [id].tsx, ledger.tsx
  (app)/notifications.tsx, profile.tsx, change-password.tsx, holidays.tsx
src/lib/                   api client (JWT refresh), auth, push, file picking, formatting
src/components/            UI kit, form controls, approval timeline / decision panel
```
# great_water_employee_mobile
