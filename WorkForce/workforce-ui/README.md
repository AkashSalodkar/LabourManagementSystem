# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expired subscription access

After a trial or paid subscription expires, both modules remain available for read-only browsing. A write request prompts the user to watch a rewarded ad or subscribe. A successfully verified ad grants one write action; the server consumes that credit once and requires another ad for the next action. After every two successful writes, a separate full-screen interstitial ad is shown and the app remains blocked for at least 10 seconds and until the interstitial closes. Ad duration and availability are controlled by Google; on load/show errors the app displays an error and still pauses for 10 seconds. Reward verification uses AdMob server-side verification (SSV); a client-side ad callback alone never grants access.

For production, replace the Android and iOS test AdMob application IDs in `android/app/src/main/res/values/strings.xml` and `ios/App/App/Info.plist`. Set `VITE_ADMOB_TESTING=false` and configure `VITE_ADMOB_ANDROID_REWARDED_ID` / `VITE_ADMOB_IOS_REWARDED_ID` with the production rewarded-ad unit IDs, plus `VITE_ADMOB_ANDROID_INTERSTITIAL_ID` / `VITE_ADMOB_IOS_INTERSTITIAL_ID` with the production interstitial unit IDs, when building. Test rewarded ads do not invoke SSV and therefore cannot grant write credits. Configure the API allowlist with the rewarded unit IDs using `AdMob__RewardedAdUnitIds__0` and `AdMob__RewardedAdUnitIds__1`, as applicable, and set AdMob's SSV callback URL to `https://<api-host>/api/subscription/rewarded-access/ssv`. The callback verifies Google's signed request and accepts only one reward for each server-issued challenge. Configure AdMob consent messaging for production.

After changing native AdMob settings or dependencies, run `npm run cap:sync` from this directory and rebuild the native app.

For local development only, set `AdMob:AllowTestRewards=true` in the API's untracked `appsettings.Development.json` to let a completed Google test rewarded ad unlock one write. This endpoint is disabled outside the ASP.NET Development environment, and production access continues to require Google's SSV callback.

## Razorpay checkout

Subscription payments use Razorpay Standard Checkout so mobile users can select an installed UPI app. Configure `Razorpay:KeyId` and `Razorpay:KeySecret` on the API, and enable the signed `payment.captured` webhook using `Razorpay:WebhookSecret`. Apply the `RazorpayCheckoutOrders` database migration before deploying the API.

After changing Capacitor plugins, run `npm run cap:sync` from this directory and rebuild the native apps. The sync script also adds Razorpay's iOS Swift Package dependency to the generated Cordova plugin package. Use Razorpay test credentials during testing and live credentials only for release builds.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
