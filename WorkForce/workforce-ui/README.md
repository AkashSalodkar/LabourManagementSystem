# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expired subscription access

After a trial or paid subscription expires, users can choose full access with AdMob banner ads or ad-free read-only access. The API persists the choice and enforces read-only access by rejecting non-GET data requests. The API applies the database migration at startup in production.

The Android and iOS projects currently use Google's official test AdMob application IDs and test banner units. Before release, replace the application IDs in `android/app/src/main/res/values/strings.xml` and `ios/App/App/Info.plist`, then set `VITE_ADMOB_TESTING=false` and the platform banner unit variable (`VITE_ADMOB_ANDROID_BANNER_ID` or `VITE_ADMOB_IOS_BANNER_ID`) when building. Leave test mode enabled during development. Configure AdMob consent messaging in the AdMob account for production.

After changing native AdMob settings or dependencies, run `npx cap sync` from this directory and rebuild the native app.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
