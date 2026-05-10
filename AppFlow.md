# Password Manager - App Flow Documentation

> Note: For the most up-to-date end-to-end flow (startup → auth → master password → vault CRUD → crypto), see `FRONTEND_FLOW.md`.

## 🏗️ Architecture Overview

**Password Manager** is a React Native mobile application for securely storing and managing passwords. The app uses **React Navigation** with stack-based navigation and **Zustand** for state management. Authentication status determines which screens are available.

### Key Architecture Patterns:

- **Conditional Navigation:** Routes differ based on authentication state (`isLogged`)
- **State Management:** Zustand stores for global auth state and password CRUD operations
- **API Integration:** Axios with interceptors for token-based authentication
- **Security:** React Native Keychain for secure token storage, CryptoJS for password encryption

---

## 📦 Technology Stack

| Layer                | Technology                            |
| -------------------- | ------------------------------------- |
| **Framework**        | React Native 0.76.1                   |
| **UI Navigation**    | React Navigation v6 (Native Stack)    |
| **State Management** | Zustand 5.0.12                        |
| **HTTP Client**      | Axios 1.8.3                           |
| **Encryption**       | CryptoJS 4.2.0                        |
| **Secure Storage**   | React Native Keychain 10.0.0          |
| **Icons**            | Ionicons (@react-native-vector-icons) |
| **Language**         | TypeScript 5.0.4                      |
| **Build Tools**      | Metro, React Native CLI               |

---

## 📁 Project Structure

```
Frontend/
├── App.tsx                          # Root component - Auth check & navigation routing
├── AppFlow.md                       # This documentation
├── package.json                     # Dependencies & scripts
├── tsconfig.json                    # TypeScript configuration
├── jest.config.js                   # Jest testing configuration
├── metro.config.js                  # Metro bundler config
├── babel.config.js                  # Babel transpiler config
├── Gemfile                          # Ruby dependencies (iOS/Android)
├── index.js                         # App entry point
├── app.json                         # React Native app config
│
├── API/
│   └── AuthApi.js                   # Axios client with interceptors for Bearer tokens
│
├── AuthScreens/
│   ├── LogIn.tsx                    # Login screen with email/password authentication
│   ├── Registeration.tsx            # Registration with master password setup
│   └── MasterPassword.tsx           # Master password unlock (derives vault key to decrypt passwords)
│
├── Screens/
│   ├── ListScreen.tsx               # Main display: 2-column grid of password cards
│   ├── About.tsx                    # About page (not yet integrated)
│   └── UpdateFlow.md                # Update flow documentation
│
├── Components/
│   └── modalItem.tsx                # Modal form for creating/editing passwords
│
├── Store/
│   ├── store.ts                     # Zustand stores (AuthStore + usePasswordStore)
│   └── KeyChainStorage.js           # Secure token persistence with Keychain
│
├── Types/
│   └── types.ts                     # TypeScript type definitions (ModalDetails, RootStackParamList)
│
├── Encryption/
│   └── *                            # Encryption + key derivation utilities (see decryptFlow.md for details)
│
├── android/                         # Android native platform code
│   ├── app/build.gradle + proguard rules
│   ├── build.gradle (project config)
│   └── gradle.properties
│
├── ios/                             # iOS native platform code
│   ├── Frontend/
│   │   ├── AppDelegate
│   │   ├── Info.plist
│   │   └── LaunchScreen
│   ├── Frontend.xcodeproj/
│   │   └── project.pbxproj
│   └── FrontendTests/
│
└── __tests__/
    └── App.test.tsx                 # Unit/integration tests
```

---

## 🔄 App Root Navigation & Authentication Flow (App.tsx)

The root component (`App.tsx`) handles authentication + conditional navigation.

Key states:

- `isLogged` (Zustand): **true** only after Master Password is verified
- `showMasterPassword` (local state): **true** when tokens exist (auto-login UX)

```javascript
// App has two gates:
// 1) tokens present -> show MasterPassword
// 2) master password verified -> isLogged=true -> show vault screens

return (
  <NavigationContainer>
    <Stack.Navigator>
      {isLogged ? (
        <>
          <Stack.Screen name="ListScreen" component={ListScreen} />
          <Stack.Screen name="modalItem" component={ModalItem} />
        </>
      ) : showMasterPassword ? (
        <Stack.Screen
          name="MasterPassword"
          component={MasterPassword}
          options={{headerShown: false}}
        />
      ) : (
        <>
          <Stack.Screen
            name="LogIn"
            component={LogIn}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Registeration"
            component={Registeration}
            options={{headerShown: false}}
          />
        </>
      )}
    </Stack.Navigator>
  </NavigationContainer>
);
```

### checkAuth() Flow:

```javascript
const checkAuth = async () => {
  try {
    // 1. Load tokens from Keychain (persisted from previous session)
    const {accessToken, refreshToken} = await KeychainManager.getTokens();

    // 2. If no tokens exist, show Auth screens (LogIn/Registeration)
    if (!accessToken && !refreshToken) {
      setLogged(false);
      setShowMasterPassword(false);
      return;
    }

    // 3. Tokens exist -> show MasterPassword screen.
    // Token validity + authData hydration happen in the background.
    setShowMasterPassword(true);
    setLogged(false);

    // 4. Background: call /auth/me and hydrate auth data used by MasterPassword
    // - prefer Keychain-cached auth_data
    // - otherwise call /auth/me/authData (or fallback /auth/me)
    // If backend returns 401/403, clear tokens and go back to LogIn.
  } catch (error) {
    // If startup validation fails (network, server down), keep UX simple:
    // show LogIn unless tokens exist (then MasterPassword will still appear).
    setLogged(false);
  } finally {
    // 6. Hide loading indicator
    setLoading(false);
  }
};
```

### Complete Authentication State Machine:

```
┌─────────────────────────────────────────────────────────────────┐
│                    App.tsx Mounted                              │
│                                                                 │
│  1. useEffect hook runs                                         │
│  2. setLoading(true) - Show spinner                            │
│  3. Call checkAuth()                                            │
│  4. Finally block: setLoading(false)                           │
└─────────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
     Tokens don't    Networks fails   Tokens valid
     exist in        or expired       (200 success)
     Keychain
            │                 │                 │
            ↓                 ↓                 ↓
     setLogged(false)  setLogged(false)  setLogged(true)
            │                 │                 │
            └─────────────────┼─────────────────┘
                              │
                    (isLogged used for rendering)
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
    FALSE                                       TRUE
  (Show Auth Stack)                      (Show App Stack)
        │                                           │
     ┌─────────────────┐                    ┌─────────────┐
     │  LogIn Screen   │                    │ListScreen   │
     │      OR         │                    │    +        │
     │Registeration    │                    │ modalItem   │
     │   Screen        │                    │             │
     └─────────────────┘                    └─────────────┘
             │                                     │
      (User fills form)                    (User navigates
       & submits)                          password list)
             │                                     │
      └─────→┌──────────────────────────────────────┘
             │
        (After login/redirect)
             ↓
       Re-render with
       isLogged = true
             ↓
        Show ListScreen
```

---

## 📱 Screens Description

### 1. **LogIn Screen** (`AuthScreens/LogIn.tsx`)

**Purpose:** Authenticate existing users with email and password

**State:**

```typescript
interface FormData {
  email: string;
  password: string;
}

const [form, setForm] = useState<FormData>({email: '', password: ''});
const [showPassword, setShowPassword] = useState(false);
```

**UI Components:**

- Text input: Email address
- Text input: Password (toggleable visibility with 👁️ icon)
- Button: "Submit" (triggers login)
- Text link: "Don't have an account? Register here"

**Functionality Steps:**

1. User enters email and password
2. `updateField()` helper updates form state as user types
3. User clicks Submit button
4. **API Call:** `POST /auth/login`
   ```json
   {
     "email": "user@example.com",
     "password": "userPassword123"
   }
   ```
5. **Response on Success:**
   ```json
   {
     "success": true,
     "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "message": "Login successful"
   }
   ```
6. **On Success Actions:**

   - `KeychainManager.saveTokens(accessToken, refreshToken)` - Persist tokens securely
   - `AuthStore.setLogged(true)` - Update global auth state
   - Navigation stack automatically switches to show ListScreen
   - Alert shown: "Logged successfully 👌"

7. **Error Handling:**
   - Network error: "Check your internet connection and try again"
   - Server error: Displays error message from server
   - Unknown error: "Something went wrong"
   - All errors wrapped in try-catch with Alert.alert()

**Registration Link:**

- Click "Register here" text to navigate to Registeration screen

---

### 2. **Registration Screen** (`AuthScreens/Registeration.tsx`)

**Purpose:** Create new user account with master password for encryption setup

**State:**

```typescript
interface FormData {
  name: string;
  email: string;
  password: string;
}

const [fillForm, setForm] = useState<FormData>({
  name: '',
  email: '',
  password: '',
});
const [mpassword, setMasterPassword] = useState('');
const [loading, setLoading] = useState(false);
const [showPassword, setShowPassword] = useState(false);
const [showMpassword, setShowMasterPassword] = useState(false);
```

**UI Components:**

- Text input: Full Name (auto-capitalize words)
- Text input: Email address (email keyboard)
- Text input: Password (with visibility toggle 👁️)
- Text input: Master Password (with visibility toggle 👁️)
  - This is the encryption master password (different from login password)
- Button: "Register" (shows "Registering..." during API call, disabled while loading)
- Text link: "Already have an account? Log in here"

**Functionality Steps:**

1. User fills: Name, Email, Password, Master Password
2. Clicks Register button
3. **Validation:**
   - Check all 4 fields filled → Alert if not
   - Check password === masterPassword → Alert if not matching
4. **Setup Encryption:** `setupEncryption(masterPassword)`
   - Generates 3 encryption components from master password:
     - `encryptedDataKey` (Base64)
     - `dataKeyIV` (Base64)
     - `salt` (Base64)
5. **API Call:** `POST /auth/register`
   ```json
   {
     "name": "John Doe",
     "email": "john@example.com",
     "password": "userPassword123",
     "encryptedDataKey": "qGdH9x...",
     "dataKeyIV": "aBcDef...",
     "salt": "1234567..."
   }
   ```
6. **On Success:**

   - Alert shows: Server message (from response `res.data.message`)
   - Navigation goes back to LogIn screen
   - User must now log in with new credentials

7. **Loading State:**

   - Button text changes to "Registering..." during request
   - Button disabled while loading
   - setLoading(false) in finally block

8. **Error Handling:**
   - Shows Alert with error message
   - Logs error details to console
   - User can retry

---

### 3. **ListScreen** (`Screens/ListScreen.tsx`) - Main Password Management

**Purpose:** Display all saved passwords in a responsive 2-column grid layout

**Layout:**

```
┌─────────────────────────────────────┐
│    2-Column Password Grid           │
│                                     │
│  ┌──────────┐    ┌──────────┐      │
│  │ Domain   │    │ Domain   │      │
│  │ Username │    │ Username │      │
│  │ ••••••••│    │ ••••••••│      │
│  │ [trash]  │    │ [trash]  │      │
│  └──────────┘    └──────────┘      │
│  ┌──────────┐    ┌──────────┐      │
│  │ Domain   │    │ Domain   │      │
│  │ Username │    │ Username │      │
│  │ ••••••••│    │ ••••••••│      │
│  │ [trash]  │    │ [trash]  │      │
│  └──────────┘    └──────────┘      │
│                                     │
│                   ┌───────────────╖ │
│                   │  + (FAB)      ║ │
│                   └───────────────╜ │
└─────────────────────────────────────┘
```

**State Management:**

```typescript
const {passwords, fetchPasswords, deletePassword} = usePasswordStore();
```

**Functionality:**

1. **On Mount:** useEffect runs

   - Calls `fetchPasswords()`
   - `usePasswordStore` makes GET request to `/pwd/getPwd`
   - Populates `passwords` array with server response
   - Shows loading state while fetching

2. **Password Cards Display:**

   - Domain: Service name (bold, 16pt, color: `#333`)
   - Username: User login name (14pt, color: `#666`)
   - Password: Hidden as "••••••••" (14pt, color: `#999`)
   - Card styling: white bg, 12px border radius, shadow elevation 3

3. **Card Interactions:**

   - **Tap Card:** Navigate to ModalItem screen with password data
     ```javascript
     navigation.navigate('modalItem', {data: item});
     ```
   - **Delete Trash Icon:** Calls `deletePassword(item._id)`
     - Makes DELETE request to `/pwd/deletePwd/{id}`
     - Removes from local passwords array
     - Card removed from grid

4. **FAB Button (Floating Action Button):**

   - Large "+" icon (Ionicons, size 28, white color)
   - Positioned at bottom-right corner
   - On press: Navigate to ModalItem without data (create new)
     ```javascript
     navigation.navigate('modalItem');
     ```

5. **Grid Configuration:**
   - FlatList with `numColumns={2}`
   - `columnWrapperStyle={{justifyContent: 'space-between'}}`
   - Responsive to screen width
   - `contentContainerStyle={{paddingBottom: 100}}` for FAB clearance

---

### 4. **ModalItem Component** (`Components/modalItem.tsx`)

**Purpose:** Add new password entry or edit existing password entry

**Two Modes:**

**CREATE MODE** (No route.params.data):

```javascript
// Fields empty, ready for new password
const pwd = route.params?.data; // undefined
// All inputs start empty
```

**EDIT MODE** (Has route.params.data):

```javascript
// Fields populated with existing password
const pwd = route.params?.data; // Has ModalDetails object
// All inputs pre-filled on mount
```

**State:**

```typescript
const [domain, setDomain] = useState(''); // Service/website name
const [username, setUsername] = useState(''); // Login username
const [email, setEmail] = useState(''); // Associated email
const [password, setPassword] = useState(''); // The actual password
const [showPassword, setShowPassword] = useState(false); // Toggle visibility
const [isKeyboardVisible, setKeyboardVisible] = useState(false); // Adjust layout
```

**UI Components:**

- TextInput: Domain/Service name
- TextInput: Username
- TextInput: Email
- TextInput: Password (with 👁️ visibility toggle)
- KeyboardAvoidingView: Prevents inputs from hiding under keyboard
- Button: Save (label same for create & edit)

**Functionality:**

1. **On Mount - Populate if Edit Mode:**

   ```javascript
   useEffect(() => {
     if (pwd) {
       setDomain(pwd.domain);
       setUsername(pwd.username);
       setEmail(pwd.email);
       setPassword(pwd.password);
     }
   }, [pwd]);
   ```

2. **Keyboard Management:**

   - Listeners added on mount
   - Detects keyboard show/hide
   - Updates `isKeyboardVisible` state
   - Adjusts layout to keep inputs visible while typing
   - Cleaned up on unmount (removed listeners)

3. **On Save - handleSubmit():**

   - **Validation:**

     - domain, username, password all required
     - email is optional
     - If missing → Alert("Error", "Please fill all required fields")

   - **Create New Password:**

     ```javascript
     if (!pwd) {
       // Create mode
       await addPassword({domain, username, email, password});
     }
     ```

     - Calls store action `addPassword(data)`
     - Makes POST to `/pwd/addPwd`
     - Server returns new password with `_id`
     - Store adds to `passwords` array

   - **Edit Existing Password:**
     ```javascript
     if (pwd) {
       // Edit mode
       await updatePassword(pwd._id, {domain, username, email, password});
     }
     ```
     - Calls store action `updatePassword(id, data)`
     - Makes PUT to `/passwords/{id}`
     - Server returns updated password
     - Store replaces in `passwords` array

4. **Navigation After Save:**
   - If successful → `navigation.goBack()`
   - Returns to ListScreen
   - ListScreen re-renders with updated passwords
   - If error → Alert shows error message

---

## 💾 State Management with Zustand

### AuthStore (Global Authentication State)

**Location:** `Store/store.ts`

```typescript
interface globalState {
  isLogged: boolean;
  setLogged: (value: boolean) => void;
}

const AuthStore = create<globalState>(set => ({
  isLogged: false,
  setLogged: value => set({isLogged: value}),
}));
```

**Purpose:** Determines which navigation stack (Auth or App) is rendered

**Usage:**

- `App.tsx`: `const isLogged = AuthStore(state => state.isLogged);`
- `LogIn.tsx`: `const setLog = AuthStore(state => state.setLogged);`
- Persists across component re-renders
- Changes trigger navigation switching

---

### usePasswordStore (Password CRUD Operations)

**Location:** `Store/store.ts`

```typescript
type Password = {
  _id: string;
  domain: string;
  username: string;
  email: string;
  password: string; // Base64 encrypted password from server
};

type passwordStore = {
  passwords: Password[];
  loading: boolean;
  fetchPasswords: () => Promise<void>;
  addPassword: (data: Omit<Password, '_id'>) => Promise<void>;
  updatePassword: (id: string, data: Omit<Password, '_id'>) => Promise<void>;
  deletePassword: (id: string) => Promise<void>;
};
```

**Actions:**

1. **fetchPasswords()** - Load all passwords

   - Endpoint: `GET /pwd/getPwd`
   - Sets `loading: true`
   - Response: Array of Password objects
   - Updates `passwords` array
   - Sets `loading: false` in finally
   - Called from ListScreen useEffect on mount

2. **addPassword(data)** - Create new password

   - Endpoint: `POST /pwd/addPwd`
   - Input: `{domain, username, email, password}`
   - Response: New Password object with `_id`
   - Adds to local `passwords` array spread operation
   - Called from ModalItem when creating

3. **updatePassword(id, data)** - Update existing

   - Endpoint: `PUT /passwords/{id}`
   - Input: `{domain, username, email, password}`
   - Response: Updated Password object
   - Replaces in `passwords` array by matching `_id`
   - Called from ModalItem when editing

4. **deletePassword(id)** - Remove password
   - Endpoint: `DELETE /pwd/deletePwd/{id}`
   - Response: (presumably success message)
   - Filters `passwords` array to remove by `_id`
   - Called from ListScreen trash icon
