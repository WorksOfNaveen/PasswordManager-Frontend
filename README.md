# Password Manager — React Native Frontend

React Native mobile frontend for a password manager. Authentication uses server-issued tokens (stored in Keychain) and a **Master Password** step that derives a local vault key to encrypt/decrypt passwords.

## Features

- Email/password login
- Secure token storage via `react-native-keychain`
- Master Password unlock (local key derivation)
- Password vault CRUD (list/add/edit/delete)
- AES encryption/decryption on-device (CryptoJS)
- Automatic token refresh via Axios interceptor

## Tech Stack

- React Native `0.76.1`
- React Navigation (Native Stack)
- Zustand
- Axios
- CryptoJS
- react-native-keychain
- @react-native-vector-icons/ionicons (icons)
- Dark theme system (modern UI)

## Project Structure (high level)

```
Frontend/
	App.tsx
	API/AuthApi.js
	AuthScreens/LogIn.tsx
	AuthScreens/Registeration.tsx
	AuthScreens/MasterPassword.tsx
	Screens/ListScreen.tsx
	Components/modalItem.tsx
	Store/store.ts
	Store/KeyChainStorage.js
	Encryption/
	Types/
```

## Getting Started

### Prerequisites

- Node.js `>= 18`
- Android Studio (Android SDK + emulator) and/or Xcode (macOS for iOS)
- A running backend API compatible with the routes used by this app

### Install

```bash
npm install
```

### Run (Android)

Terminal 1:

```bash
npx react-native start
```

Terminal 2:

```bash
npx react-native run-android
```

### Run (iOS)

```bash
npx react-native run-ios
```

## Backend URL / API Configuration

The Axios base URL is set in `API/AuthApi.js`:

- Android emulator uses `http://10.0.2.2:3000`
- iOS uses `http://localhost:3000`

If your backend runs elsewhere (device, LAN, HTTPS), update the base URL accordingly.

## How the App “Auto Login” Works

There are two steps:

1. **Session tokens** (access/refresh) are loaded from Keychain at startup.
2. If tokens exist, the app routes to the **Master Password** screen. Entering the Master Password derives a local vault key and sets `isLogged=true`.

See `FRONTEND_FLOW.md` for the full, end-to-end flow.

## Scripts

```bash
npm run start
npm run android
npm run ios
npm run lint
npm test
```

## Notes / Known Issues

- Jest may fail if asset (e.g. PNG) transforms aren’t configured for React Navigation dependencies. If you want, we can adjust `jest.config.js` to stub image assets.

## Documentation

- `FRONTEND_FLOW.md` — end-to-end runtime flow
- `AppFlow.md` — earlier architecture notes (may be older than current code)
- `decryptFlow.md` — encryption/decryption deep dive
