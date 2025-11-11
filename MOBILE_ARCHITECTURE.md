# Mobile Architecture - React Native App

Complete architecture guide for the React Native mobile app (iOS & Android).

---

## 📱 Technology Stack

### Core
- **React Native 0.76.x** - Cross-platform mobile framework
- **Expo SDK 52** - Development tooling & managed workflow
- **TypeScript 5.7** - Type safety

### State Management
- **Zustand 5.x** - Lightweight state management
- **TanStack Query v5** - Server state & caching
- **React Context** - Authentication state

### Navigation
- **Expo Router** - File-based routing
- **React Navigation** - Underlying navigation library

### UI Components
- **React Native Paper 5.x** - Material Design
- **Tamagui** - Performant UI primitives
- **Expo Vector Icons** - Icon library

### Native Features
- **expo-location** - GPS & geolocation
- **expo-camera** - Photo capture
- **expo-notifications** - Push notifications
- **expo-secure-store** - Secure storage
- **react-native-mmkv** - Fast local storage

### Authentication
- **@clerk/clerk-expo** - Authentication
- **expo-auth-session** - OAuth flows
- **expo-web-browser** - OAuth web views

### Backend Communication
- **axios** - HTTP client
- **@tanstack/react-query** - Data fetching & caching
- **socket.io-client** - Real-time updates

---

## 🏗️ Project Structure

```
apps/mobile/
├── app/                    # Expo Router (file-based routing)
│   ├── (auth)/            # Auth group
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   ├── (tabs)/            # Main app tabs
│   │   ├── _layout.tsx    # Tab navigator
│   │   ├── index.tsx      # Dashboard
│   │   ├── shifts.tsx     # Shifts list
│   │   ├── schedule.tsx   # Schedule view
│   │   └── profile.tsx    # User profile
│   ├── shift/
│   │   └── [id].tsx       # Shift details (dynamic route)
│   ├── _layout.tsx        # Root layout
│   └── +not-found.tsx     # 404 page
├── src/
│   ├── components/        # Reusable components
│   ├── features/          # Feature-based modules
│   │   ├── auth/
│   │   ├── shifts/
│   │   ├── schedule/
│   │   └── time-tracking/
│   ├── hooks/             # Custom hooks
│   ├── services/          # API services
│   ├── store/             # Zustand stores
│   ├── lib/               # Utilities
│   └── types/             # TypeScript types
├── assets/                # Images, fonts
├── app.json               # Expo config
└── package.json
```

---

## 🔐 Authentication Flow

### 1. App Initialization

```typescript
// app/_layout.tsx
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { Slot, useRouter, useSegments } from 'expo-router';
import { tokenCache } from '@/lib/tokenCache';

export default function RootLayout() {
  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <InitialLayout />
    </ClerkProvider>
  );
}

function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (isSignedIn && inAuthGroup) {
      router.replace('/(tabs)');
    } else if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    }
  }, [isSignedIn, isLoaded]);

  return <Slot />;
}
```

### 2. Secure Token Storage

```typescript
// lib/tokenCache.ts
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

export const tokenCache = {
  async getToken(key: string) {
    try {
      return storage.getString(key) ?? null;
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      storage.set(key, value);
    } catch {}
  },
};
```

---

## 📡 API Integration

### 1. HTTP Client Setup

```typescript
// services/api.ts
import axios from 'axios';
import { useAuth } from '@clerk/clerk-expo';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
});

// Request interceptor - add auth token
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, refresh
      await refreshToken();
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 2. React Query Setup

```typescript
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
```

### 3. API Hooks

```typescript
// features/shifts/hooks/useShifts.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/services/api';

export function useShifts(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['shifts', startDate, endDate],
    queryFn: async () => {
      const { data } = await api.get('/shifts', {
        params: { startDate, endDate },
      });
      return data;
    },
  });
}

export function useClockIn() {
  return useMutation({
    mutationFn: async (payload: ClockInPayload) => {
      const { data } = await api.post('/time-entries/clock-in', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['time-entries']);
    },
  });
}
```

---

## 💾 Offline-First Architecture

### 1. Local Database

```typescript
// lib/localDb.ts
import { MMKV } from 'react-native-mmkv';

const db = new MMKV({ id: 'planday-local-db' });

export const localDb = {
  // Store shift data
  saveShifts(shifts: Shift[]) {
    db.set('shifts', JSON.stringify(shifts));
  },

  getShifts(): Shift[] {
    const data = db.getString('shifts');
    return data ? JSON.parse(data) : [];
  },

  // Queue offline actions
  queueAction(action: OfflineAction) {
    const queue = this.getQueue();
    queue.push(action);
    db.set('offline-queue', JSON.stringify(queue));
  },

  getQueue(): OfflineAction[] {
    const data = db.getString('offline-queue');
    return data ? JSON.parse(data) : [];
  },

  clearQueue() {
    db.delete('offline-queue');
  },
};
```

### 2. Sync Strategy

```typescript
// lib/sync.ts
import NetInfo from '@react-native-community/netinfo';

export function setupSync() {
  NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      syncOfflineActions();
    }
  });
}

async function syncOfflineActions() {
  const queue = localDb.getQueue();

  for (const action of queue) {
    try {
      await executeAction(action);
    } catch (error) {
      console.error('Sync failed:', error);
      break; // Stop on first error
    }
  }

  localDb.clearQueue();
}
```

---

## 📍 GPS & Location Features

### 1. Check-In with GPS

```typescript
// features/time-tracking/components/CheckInButton.tsx
import * as Location from 'expo-location';

export function CheckInButton() {
  const clockIn = useClockIn();

  async function handleCheckIn() {
    // Request permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Location permission required');
      return;
    }

    // Get current location
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    // Clock in with location
    await clockIn.mutate({
      shiftId: currentShiftId,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
  }

  return (
    <Button onPress={handleCheckIn}>
      Clock In
    </Button>
  );
}
```

### 2. Geofencing

```typescript
// lib/geofencing.ts
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

const GEOFENCE_TASK = 'check-in-geofence';

export async function setupGeofencing(locations: Location[]) {
  await Location.startGeofencingAsync(GEOFENCE_TASK, locations.map(loc => ({
    identifier: loc.id,
    latitude: loc.latitude,
    longitude: loc.longitude,
    radius: 100, // 100 meters
  })));
}

TaskManager.defineTask(GEOFENCE_TASK, ({ data: { eventType, region }, error }) => {
  if (error) return;

  if (eventType === Location.GeofencingEventType.Enter) {
    // Show check-in notification
    scheduleNotification({
      title: 'Ready to clock in?',
      body: 'You are at the work location',
    });
  }
});
```

---

## 📷 Camera Integration

### Check-In Photos

```typescript
// components/PhotoCapture.tsx
import { Camera } from 'expo-camera';

export function PhotoCapture({ onCapture }: Props) {
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const cameraRef = useRef<Camera>(null);

  async function takePicture() {
    if (!cameraRef.current) return;

    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.7,
      base64: false,
    });

    // Upload photo
    const uploadedUrl = await uploadPhoto(photo.uri);
    onCapture(uploadedUrl);
  }

  if (!permission?.granted) {
    return (
      <Button onPress={requestPermission}>
        Grant Camera Permission
      </Button>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Camera ref={cameraRef} style={{ flex: 1 }} />
      <Button onPress={takePicture}>Take Photo</Button>
    </View>
  );
}
```

---

## 🔔 Push Notifications

### 1. Setup

```typescript
// lib/notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

export async function registerForPushNotifications() {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  });

  // Save token to backend
  await api.post('/push-tokens', {
    token: token.data,
    platform: Platform.OS,
    deviceId: await Application.getIosIdForVendorAsync() || Device.modelId,
  });

  return token.data;
}
```

### 2. Handle Notifications

```typescript
// app/_layout.tsx
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Listen for notifications
useEffect(() => {
  const subscription = Notifications.addNotificationReceivedListener((notification) => {
    console.log('Notification received:', notification);
  });

  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const url = response.notification.request.content.data.url;
    if (url) router.push(url);
  });

  return () => {
    subscription.remove();
    responseSubscription.remove();
  };
}, []);
```

---

## 🔄 Real-Time Updates

### Socket.io Integration

```typescript
// lib/socket.ts
import io from 'socket.io-client';

let socket: Socket | null = null;

export function initializeSocket(token: string) {
  socket = io(process.env.EXPO_PUBLIC_WS_URL!, {
    auth: { token },
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('shift:updated', (shift) => {
    queryClient.invalidateQueries(['shifts']);
  });

  socket.on('notification', (notification) => {
    showLocalNotification(notification);
  });

  return socket;
}
```

---

## 🎨 UI Components & Theming

### Theme Setup

```typescript
// lib/theme.ts
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#3b82f6',
    secondary: '#8b5cf6',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#60a5fa',
    secondary: '#a78bfa',
  },
};
```

---

## 📦 App Distribution

### iOS (App Store)

```bash
# Build for iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

### Android (Play Store)

```bash
# Build for Android
eas build --platform android

# Submit to Play Store
eas submit --platform android
```

### OTA Updates

```bash
# Publish update
eas update --branch production

# Users receive update automatically
```

---

## 🧪 Testing

### Unit Tests

```typescript
// __tests__/components/ShiftCard.test.tsx
import { render } from '@testing-library/react-native';
import { ShiftCard } from '@/components/ShiftCard';

test('displays shift information', () => {
  const shift = {
    startTime: '2025-12-01T09:00:00Z',
    endTime: '2025-12-01T17:00:00Z',
    position: { name: 'Barista' },
  };

  const { getByText } = render(<ShiftCard shift={shift} />);

  expect(getByText('Barista')).toBeTruthy();
  expect(getByText(/9:00 AM - 5:00 PM/)).toBeTruthy();
});
```

### E2E Tests (Detox)

```typescript
// e2e/auth.e2e.ts
describe('Authentication', () => {
  it('should sign in successfully', async () => {
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password');
    await element(by.id('sign-in-button')).tap();

    await expect(element(by.text('Dashboard'))).toBeVisible();
  });
});
```

---

## 📊 Performance Optimization

### 1. List Performance

```typescript
// Use FlashList for large lists
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={shifts}
  estimatedItemSize={100}
  renderItem={({ item }) => <ShiftCard shift={item} />}
/>
```

### 2. Image Optimization

```typescript
// Use FastImage for better performance
import FastImage from 'react-native-fast-image';

<FastImage
  source={{ uri: avatarUrl }}
  style={{ width: 50, height: 50 }}
  resizeMode="cover"
/>
```

### 3. Code Splitting

```typescript
// Lazy load screens
const ProfileScreen = lazy(() => import('./screens/Profile'));
```

---

## 🔒 Security

### Secure Storage

```typescript
import * as SecureStore from 'expo-secure-store';

// Store sensitive data
await SecureStore.setItemAsync('user-token', token);

// Retrieve
const token = await SecureStore.getItemAsync('user-token');
```

### Certificate Pinning

```typescript
// expo-ssl-pinning
import { fetch } from 'react-native-ssl-pinning';

const response = await fetch('https://api.yourdomain.com', {
  method: 'GET',
  sslPinning: {
    certs: ['cert1', 'cert2'],
  },
});
```

---

**Last Updated:** November 2025
**Platform:** React Native 0.76.x / Expo SDK 52
