Absolutely. Let's build the **full ecommerce-style location picker** from scratch in **Next.js + TypeScript + Google Maps**, with no magic hidden away.

The finished component will work like this:

```text
┌─────────────────────────────────────────┐
│ Search address...                       │
├─────────────────────────────────────────┤
│                                         │
│              📍                         │
│         fixed center pin                │
│                                         │
│       ┌───────────────┐                 │
│       │     MAP       │ ← swipe/pan     │
│       │               │                 │
│       │        🏠     │                 │
│       └───────────────┘                 │
│                                         │
├─────────────────────────────────────────┤
│ Selected location                       │
│ Jl. Example No. 123, Palembang          │
│ -2.9918, 104.7756                       │
│                                         │
│        [ Confirm location ]             │
└─────────────────────────────────────────┘
```

We'll use **`@vis.gl/react-google-maps`**, a React wrapper around the Google Maps JavaScript API. It has TypeScript support built in and provides `APIProvider`, `Map`, `AdvancedMarker`, `useMap`, etc. ([Vis.gl][1])

---

# 1. What we're going to build

There are actually **four separate pieces**:

```text
                 Google Maps
                     │
                     ▼
              ┌─────────────┐
              │     Map     │
              └──────┬──────┘
                     │
             user swipes map
                     │
                     ▼
              map becomes idle
                     │
                     ▼
              get center lat/lng
                     │
                     ▼
             Reverse geocoding
                     │
                     ▼
            Human-readable address
                     │
                     ▼
             Confirm location
                     │
                     ▼
              Your backend
```

The important distinction is:

**The pin does NOT move.**

The map moves underneath the pin.

So if the center of the map is:

```ts
{
  lat: -2.9918,
  lng: 104.7756
}
```

that's your selected location.

---

# 2. Create your Next.js project

If you don't already have one:

```bash
npx create-next-app@latest ecommerce-location-picker
```

I'd choose:

```text
TypeScript       Yes
ESLint           Yes
Tailwind CSS     Yes
src/ directory   Yes
App Router       Yes
Turbopack        Yes
```

Then:

```bash
cd ecommerce-location-picker
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# 3. Install the Google Maps React library

Install:

```bash
npm install @vis.gl/react-google-maps
```

That's the library we're using. The official package documentation recommends exactly this installation command. ([Vis.gl][1])

You don't need to separately install Google Maps TypeScript types because the library includes TypeScript support. ([Vis.gl][1])

---

# 4. Create a Google Maps API key

This is the part that isn't Next.js.

You need a Google Cloud project.

Go to:

[Google Maps Platform — Get an API key](https://developers.google.com/maps/documentation/javascript/get-api-key?utm_source=chatgpt.com)

Create/select a Google Cloud project.

Google currently requires an API key for Maps JavaScript API requests, and standard production use requires billing to be enabled. ([Google for Developers][2])

For experimenting, Google also has a limited Maps Demo Key intended for prototyping. ([Google for Developers][3])

---

# 5. Enable the APIs

For the version we're building, enable:

### Maps JavaScript API

This gives us the actual interactive map.

### Geocoding API

This lets us do:

```text
latitude + longitude
        ↓
human-readable address
```

Google calls this **reverse geocoding**. ([Google for Developers][4])

### Places API

We'll use this later for address search/autocomplete.

For now, enable:

```text
Maps JavaScript API
Geocoding API
Places API
```

---

# 6. Restrict your API key

This is important.

Don't just create a key and leave it unrestricted.

Google recommends applying both:

```text
Application restriction
+
API restriction
```

For a browser-based Maps JavaScript API key, use a **website / HTTP referrer restriction**. Google specifically recommends website restrictions for Maps JavaScript API usage. ([Google for Developers][5])

During local development you can allow something like:

```text
http://localhost:3000/*
```

For production:

```text
https://yourdomain.com/*
```

And restrict the APIs to the ones you're actually using.

---

# 7. Put the key in `.env.local`

Create:

```text
.env.local
```

Put:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
```

For example:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXX
```

Then restart Next.js:

```bash
npm run dev
```

### "Wait, isn't putting an API key in frontend dangerous?"

This is an important nuance.

A **browser Maps JavaScript API key is expected to be used client-side**, but it must be restricted to your websites and APIs.

Google specifically recommends restrictions to prevent unauthorized usage and unexpected billing. ([Google for Developers][5])

Don't put a **server-side web-service secret key** in `NEXT_PUBLIC_*`.

---

# 8. Create the component structure

I'd structure the project like this:

```text
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
│
├── components/
│   └── location-picker/
│       ├── LocationPicker.tsx
│       ├── LocationMap.tsx
│       ├── CenterPin.tsx
│       └── types.ts
│
└── lib/
    └── maps.ts
```

We're going to keep the map logic separated from the ecommerce UI.

---

# 9. Create the location type

Create:

```text
src/components/location-picker/types.ts
```

```ts
export type Coordinates = {
  lat: number;
  lng: number;
};

export type SelectedLocation = {
  coordinates: Coordinates;
  address: string;
};
```

That's all.

---

# 10. Create the map component

Create:

```text
src/components/location-picker/LocationMap.tsx
```

```tsx
"use client";

import {
  APIProvider,
  Map,
  AdvancedMarker,
} from "@vis.gl/react-google-maps";

import type { Coordinates } from "./types";

type LocationMapProps = {
  center: Coordinates;
  onLocationChange: (coordinates: Coordinates) => void;
};

const DEFAULT_ZOOM = 16;

export function LocationMap({
  center,
  onLocationChange,
}: LocationMapProps) {
  return (
    <APIProvider
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
    >
      <div className="relative h-full w-full">
        <Map
          defaultCenter={center}
          defaultZoom={DEFAULT_ZOOM}
          gestureHandling="greedy"
          disableDefaultUI
          mapId="LOCATION_PICKER_MAP"
          onIdle={(event) => {
            const map = event.map;

            const mapCenter = map.getCenter();

            if (!mapCenter) {
              return;
            }

            onLocationChange({
              lat: mapCenter.lat(),
              lng: mapCenter.lng(),
            });
          }}
        >
          <AdvancedMarker position={center} />
        </Map>
      </div>
    </APIProvider>
  );
}
```

Now, **this is where the "magic" is actually happening.**

Let's unpack it.

---

# 11. What is `APIProvider`?

This:

```tsx
<APIProvider
  apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
>
```

loads the Google Maps JavaScript API and provides it to the React components underneath it.

The library documentation describes `APIProvider` as the component responsible for loading the Maps JavaScript API. ([Vis.gl][6])

Think:

```text
APIProvider
    │
    ├── Map
    ├── AdvancedMarker
    ├── Places
    └── Geocoder
```

---

# 12. What is `<Map>`?

This:

```tsx
<Map
  defaultCenter={center}
  defaultZoom={16}
/>
```

creates the actual Google map.

`defaultCenter` is:

```ts
{
  lat: -2.9918,
  lng: 104.7756
}
```

and:

```ts
defaultZoom={16}
```

controls how zoomed in the map starts.

The React library's `Map` component wraps the underlying Google Maps `Map` instance. ([Vis.gl][7])

---

# 13. Why `gestureHandling="greedy"`?

This:

```tsx
gestureHandling="greedy"
```

makes touch gestures behave naturally inside a location picker.

On mobile:

```text
finger swipe
     ↓
map moves
```

rather than requiring awkward interaction.

---

# 14. What is `AdvancedMarker`?

This:

```tsx
<AdvancedMarker position={center} />
```

creates the pin.

But there's a problem.

Remember:

```text
MAP MOVES
PIN DOESN'T
```

So we actually **don't want the marker's position to be tied to the map's center state**.

We'll fix that in the next step.

`AdvancedMarker` is Google Maps' newer marker implementation exposed by this React library. It can also be customized with HTML/CSS or a `Pin`. ([Vis.gl][8])

---

# 15. The correct ecommerce center pin

Instead of putting an actual Google marker at the center, I recommend creating a **fixed HTML pin above the map**.

This is much closer to the UX used by delivery/ecommerce apps.

Create:

```text
src/components/location-picker/CenterPin.tsx
```

```tsx
"use client";

export function CenterPin() {
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-full">
      <div className="relative">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white shadow-lg">
          📍
        </div>

        <div className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 rounded-full bg-black/30" />
      </div>
    </div>
  );
}
```

Now the pin belongs to the **UI**, not the Google map.

---

# 16. Update `LocationMap`

Replace the previous component with:

```tsx
"use client";

import {
  APIProvider,
  Map,
} from "@vis.gl/react-google-maps";

import { CenterPin } from "./CenterPin";
import type { Coordinates } from "./types";

type LocationMapProps = {
  center: Coordinates;
  onLocationChange: (coordinates: Coordinates) => void;
};

const DEFAULT_ZOOM = 16;

export function LocationMap({
  center,
  onLocationChange,
}: LocationMapProps) {
  return (
    <APIProvider
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
    >
      <div className="relative h-full w-full">
        <Map
          defaultCenter={center}
          defaultZoom={DEFAULT_ZOOM}
          gestureHandling="greedy"
          disableDefaultUI
          mapId="LOCATION_PICKER_MAP"
          onIdle={(event) => {
            const map = event.map;

            const mapCenter = map.getCenter();

            if (!mapCenter) {
              return;
            }

            onLocationChange({
              lat: mapCenter.lat(),
              lng: mapCenter.lng(),
            });
          }}
        />

        <CenterPin />
      </div>
    </APIProvider>
  );
}
```

Now we have:

```text
┌───────────────────────────┐
│                           │
│           📍              │
│                           │
│       Google Map          │
│                           │
│                           │
└───────────────────────────┘
```

The pin is fixed in the browser viewport.

---

# 17. Here's the important part: `onIdle`

This:

```tsx
onIdle={(event) => {
```

is called when the map becomes idle.

The React Google Maps library exposes Google's `idle` event as `onIdle`. ([Vis.gl][7])

So:

```text
User starts swiping
       ↓
map moves
       ↓
map moves
       ↓
map moves
       ↓
user releases finger
       ↓
map finishes moving
       ↓
onIdle()
       ↓
getCenter()
```

This is exactly what we want.

---

# 18. What is `event.map`?

This:

```ts
event.map
```

is the **actual Google Maps map object**.

Think of it like:

```ts
GoogleMapInstance
```

It has Google Maps methods.

One of those methods is:

```ts
map.getCenter()
```

That's the "magical function" you asked about earlier.

It's really just a method provided by Google Maps.

---

# 19. What does `getCenter()` return?

This:

```ts
const mapCenter = map.getCenter();
```

returns a Google Maps `LatLng` object.

Then:

```ts
mapCenter.lat()
```

gets latitude.

And:

```ts
mapCenter.lng()
```

gets longitude.

So:

```ts
const coordinates = {
  lat: mapCenter.lat(),
  lng: mapCenter.lng(),
};
```

becomes:

```json
{
  "lat": -2.9918,
  "lng": 104.7756
}
```

That's the entire trick.

---

# 20. Create the main `LocationPicker`

Create:

```text
src/components/location-picker/LocationPicker.tsx
```

```tsx
"use client";

import { useState } from "react";

import { LocationMap } from "./LocationMap";
import type { Coordinates } from "./types";

const INITIAL_LOCATION: Coordinates = {
  lat: -2.9918,
  lng: 104.7756,
};

export function LocationPicker() {
  const [coordinates, setCoordinates] =
    useState<Coordinates>(INITIAL_LOCATION);

  const [address, setAddress] = useState(
    "Move the map to select your location"
  );

  function handleLocationChange(
    newCoordinates: Coordinates
  ) {
    setCoordinates(newCoordinates);

    console.log("Selected coordinates:", newCoordinates);
  }

  function handleConfirm() {
    console.log("Confirmed location:", {
      coordinates,
      address,
    });
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="h-[500px]">
        <LocationMap
          center={coordinates}
          onLocationChange={handleLocationChange}
        />
      </div>

      <div className="space-y-4 p-5">
        <div>
          <p className="text-sm font-medium text-gray-500">
            Selected location
          </p>

          <p className="mt-1 text-base font-semibold">
            {address}
          </p>

          <p className="mt-1 text-sm text-gray-500">
            {coordinates.lat.toFixed(6)},{" "}
            {coordinates.lng.toFixed(6)}
          </p>
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          className="w-full rounded-xl bg-black px-4 py-3 font-medium text-white transition hover:bg-gray-800"
        >
          Confirm location
        </button>
      </div>
    </div>
  );
}
```

---

# 21. Add it to your page

Open:

```text
src/app/page.tsx
```

and use:

```tsx
import { LocationPicker } from "@/components/location-picker/LocationPicker";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <LocationPicker />
    </main>
  );
}
```

Now run:

```bash
npm run dev
```

You should have a working map.

---

# 22. But we have a problem

There's a subtle bug in the architecture.

We currently do:

```tsx
<LocationMap
  center={coordinates}
/>
```

But `LocationMap` uses:

```tsx
defaultCenter={center}
```

`defaultCenter` only establishes the initial map center.

That's actually okay for panning.

But there's another important problem:

When the user pans:

```text
map center changes
        ↓
setCoordinates()
        ↓
React rerenders
        ↓
LocationMap gets new center
```

We **don't want React to force the map back to that position** during normal interaction.

That's why using `defaultCenter` rather than controlled `center` is useful here.

The library explicitly distinguishes controlled camera props from `defaultCenter`/`defaultZoom`; default values are only applied when the map is initialized. ([Vis.gl][7])

---

# 23. Now let's add reverse geocoding

Currently we get:

```text
-2.991800, 104.775600
```

But ecommerce users don't want to see that.

They want:

```text
Jl. Example No. 123
Palembang, Sumatera Selatan
Indonesia
```

This is called:

**Reverse geocoding**

Google provides this functionality through its Geocoding service. ([Google for Developers][4])

---

# 24. Don't manually call the Geocoding REST API from the browser

For this particular implementation, we'll use the Google Maps JavaScript API's client-side geocoder.

The React library lets us load additional Maps JavaScript API libraries through `useMapsLibrary`. ([Vis.gl][9])

Create:

```text
src/components/location-picker/AddressResolver.tsx
```

```tsx
"use client";

import { useEffect, useRef } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";

import type { Coordinates } from "./types";

type AddressResolverProps = {
  coordinates: Coordinates;
  onAddressChange: (address: string) => void;
};

export function AddressResolver({
  coordinates,
  onAddressChange,
}: AddressResolverProps) {
  const geocodingLib = useMapsLibrary("geocoding");

  const geocoder =
    useRef<google.maps.Geocoder | null>(null);

  useEffect(() => {
    if (!geocodingLib) {
      return;
    }

    geocoder.current = new geocodingLib.Geocoder();
  }, [geocodingLib]);

  useEffect(() => {
    if (!geocoder.current) {
      return;
    }

    const location = {
      lat: coordinates.lat,
      lng: coordinates.lng,
    };

    geocoder.current.geocode(
      { location },
      (results, status) => {
        if (status !== "OK" || !results?.length) {
          onAddressChange("Address not found");
          return;
        }

        onAddressChange(
          results[0].formatted_address
        );
      }
    );
  }, [coordinates, onAddressChange]);

  return null;
}
```

---

# 25. Add the resolver to `LocationPicker`

Import it:

```tsx
import { AddressResolver } from "./AddressResolver";
```

Then inside your component:

```tsx
<AddressResolver
  coordinates={coordinates}
  onAddressChange={setAddress}
/>
```

So:

```tsx
return (
  <div className="mx-auto flex max-w-2xl flex-col overflow-hidden rounded-2xl border bg-white shadow-sm">

    <AddressResolver
      coordinates={coordinates}
      onAddressChange={setAddress}
    />

    <div className="h-[500px]">
      <LocationMap
        center={coordinates}
        onLocationChange={handleLocationChange}
      />
    </div>

    {/* ... */}
  </div>
);
```

Now:

```text
User swipes map
      ↓
map idle
      ↓
getCenter()
      ↓
coordinates state changes
      ↓
AddressResolver
      ↓
Google Geocoder
      ↓
formatted_address
      ↓
UI updates
```

---

# 26. But don't geocode every tiny movement

There is another production issue.

Suppose the map moves:

```text
A → B → C → D → E → F
```

and your application calls the geocoder every time.

That's unnecessary.

You should generally wait until the map is idle, which we're already doing.

You can also debounce the geocoding operation.

For example:

```tsx
useEffect(() => {
  if (!geocoder.current) {
    return;
  }

  const timeout = setTimeout(() => {
    geocoder.current?.geocode(
      {
        location: {
          lat: coordinates.lat,
          lng: coordinates.lng,
        },
      },
      (results, status) => {
        if (
          status === "OK" &&
          results?.length
        ) {
          onAddressChange(
            results[0].formatted_address
          );
        }
      }
    );
  }, 300);

  return () => clearTimeout(timeout);
}, [coordinates, onAddressChange]);
```

Now if React receives several coordinate updates close together, you don't immediately geocode each one.

---

# 27. Add "Use my current location"

This is a very useful ecommerce feature.

Add a button:

```tsx
function handleUseCurrentLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const coordinates = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      setCoordinates(coordinates);
    },
    (error) => {
      console.error(error);
      alert("Unable to get your location.");
    }
  );
}
```

Then:

```tsx
<button
  type="button"
  onClick={handleUseCurrentLocation}
>
  Use my current location
</button>
```

The browser will ask the user:

```text
Allow this website to access your location?

[Block] [Allow]
```

If they allow it:

```text
GPS
 ↓
latitude
longitude
 ↓
setCoordinates()
 ↓
map moves
```

---

# 28. There's one more architectural change

If we want:

```text
Use my location
        ↓
map actually moves
```

we should give the map an imperative method or use controlled camera state.

The clean React approach is to use controlled camera state.

The library supports controlled camera props and publishes camera changes through `onCameraChanged`. ([Vis.gl][7])

But for the ecommerce center-pin pattern, I'd keep **the selected location state separate from the map's continuously changing camera state**.

Conceptually:

```ts
const [mapCenter, setMapCenter] = useState(...)
const [selectedLocation, setSelectedLocation] = useState(...)
```

When the user moves:

```text
mapCenter changes
```

When they confirm:

```text
selectedLocation = mapCenter
```

This becomes especially useful when you add:

* address search
* GPS button
* confirm button
* delivery zone validation
* draggable pin
* saved addresses

---

# 29. Let's add address search

Eventually your UX should look like:

```text
┌──────────────────────────────────────┐
│ 🔍 Search address                    │
└──────────────────────────────────────┘

                📍

          [ Google Map ]

┌──────────────────────────────────────┐
│ 📍 Jl. Sudirman, Palembang           │
│ Palembang, Sumatera Selatan          │
└──────────────────────────────────────┘

       [ Confirm location ]
```

For that, you'd use Google's **Places** functionality.

The React library supports loading the Places library using:

```ts
useMapsLibrary("places")
```

([Vis.gl][10])

You can then implement autocomplete.

I'd keep that as a separate component:

```text
LocationPicker
│
├── AddressSearch
│
├── LocationMap
│   └── CenterPin
│
├── AddressResolver
│
├── CurrentLocationButton
│
└── ConfirmLocationButton
```

That separation becomes important as the application grows.

---

# 30. The final architecture

For a real ecommerce website, I'd use:

```text
src/
│
├── app/
│   └── checkout/
│       └── page.tsx
│
├── components/
│   └── location-picker/
│       │
│       ├── LocationPicker.tsx
│       │
│       ├── LocationMap.tsx
│       │
│       ├── CenterPin.tsx
│       │
│       ├── AddressSearch.tsx
│       │
│       ├── AddressResolver.tsx
│       │
│       ├── CurrentLocationButton.tsx
│       │
│       ├── ConfirmLocationButton.tsx
│       │
│       └── types.ts
│
└── lib/
    └── maps.ts
```

---

# 31. What happens when the user swipes?

Let's follow one actual interaction.

Suppose initially:

```json
{
  "lat": -2.9918,
  "lng": 104.7756
}
```

The screen is:

```text
                📍
                ↓
        ┌───────────────┐
        │               │
        │     🏠        │
        │               │
        │         🏪    │
        │               │
        └───────────────┘
```

The user swipes the map north.

The **pin doesn't move**.

The map moves:

```text
                📍
                ↓
        ┌───────────────┐
        │         🏠    │
        │               │
        │               │
        │      🏪       │
        │               │
        └───────────────┘
```

Google Maps changes its internal camera center.

Then:

```tsx
onIdle={(event) => {
```

fires.

We do:

```tsx
const mapCenter = event.map.getCenter();
```

Suppose it returns:

```text
lat = -2.9892
lng = 104.7769
```

We convert it:

```ts
{
  lat: -2.9892,
  lng: 104.7769
}
```

Then:

```tsx
setCoordinates(...)
```

runs.

Then reverse geocoding:

```text
-2.9892
104.7769
    ↓
Google Geocoder
    ↓
Jl. Example...
Palembang
```

Then your UI becomes:

```text
Selected location

Jl. Example No. 123,
Palembang, Sumatera Selatan

-2.989200, 104.776900

[ Confirm location ]
```

---

# 32. When the user clicks Confirm

You should send something like this to your backend:

```json
{
  "latitude": -2.9892,
  "longitude": 104.7769,
  "address": "Jl. Example No. 123, Palembang, Sumatera Selatan, Indonesia"
}
```

I'd actually store **both** the coordinates and Google's address result.

Why?

Because:

```text
address
```

can change or be formatted differently, while:

```text
latitude + longitude
```

is the actual geographic position.

---

# 33. Your API endpoint

For example:

```text
src/app/api/addresses/route.ts
```

```ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();

  const {
    latitude,
    longitude,
    address,
  } = body;

  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number"
  ) {
    return NextResponse.json(
      {
        error: "Invalid coordinates",
      },
      { status: 400 }
    );
  }

  // Save to database here.

  return NextResponse.json({
    success: true,
    location: {
      latitude,
      longitude,
      address,
    },
  });
}
```

Then your frontend:

```ts
async function handleConfirm() {
  const response = await fetch(
    "/api/addresses",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        address,
      }),
    }
  );

  const data = await response.json();

  console.log(data);
}
```

---

# 34. What you should NOT do

Don't build the map yourself from scratch.

You don't want to calculate:

```text
pixels
 ↓
map projection
 ↓
longitude
 ↓
latitude
```

Google Maps does that.

You simply ask:

```ts
map.getCenter()
```

The map SDK handles:

```text
touch input
mouse input
zoom
pan
map projection
latitude
longitude
tiles
rendering
camera
```

Your application handles:

```text
selected coordinates
address
UI
confirmation
database
delivery validation
```

That's the separation you want.

---

# 35. One important improvement: delivery radius

For an ecommerce website, you probably don't want customers to choose literally anywhere.

For example:

```text
             ┌────────────────────┐
             │                    │
             │    DELIVERY        │
             │      AREA          │
             │                    │
             │         📍         │
             │                    │
             └────────────────────┘
```

After getting:

```ts
latitude
longitude
```

you can ask your backend:

```text
Is this location inside our delivery area?
```

For example:

```ts
{
  latitude: -2.9918,
  longitude: 104.7756
}
```

Your server can then determine:

```text
distance from store
        ↓
3.2 km
        ↓
delivery available
```

or:

```text
distance from store
        ↓
27.4 km
        ↓
outside delivery area
```

That logic should generally live on your backend, not merely in the browser.

---

# 36. API key security

One subtle point deserves emphasis.

You will see:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
```

and might think:

> "But `NEXT_PUBLIC` means everyone can see it!"

Correct.

A browser Maps JavaScript key **is visible to users**.

The security mechanism is **restriction**, not secrecy.

Google explicitly recommends:

```text
HTTP referrer restriction
+
API restrictions
```

for browser applications. ([Google for Developers][5])

So don't use an unrestricted key.

---

# 37. One thing I would change for production

For the initial tutorial, we're using the Maps JavaScript Geocoder.

For a production ecommerce system, I'd think carefully about where reverse geocoding happens, especially if you later build more sophisticated address workflows.

Google's current Geocoding API documentation warns against directly calling its web-service v4 methods from client-side JavaScript because of key-abuse risks. ([Google for Developers][11])

The browser-side Maps JavaScript API has its own geocoding service, which is a different usage pattern. Google's Maps JavaScript documentation provides the client-side reverse-geocoding example. ([Google for Developers][4])

For a large production app, you should also monitor usage and costs. Google Maps Platform is usage-based and requires billing for standard Maps JavaScript API usage. ([Google for Developers][12])

---

# 38. The mental model to remember

Forget the library names for a second.

The whole system is just:

```text
                USER
                 │
                 │ swipes
                 ▼
        ┌─────────────────┐
        │       MAP       │
        └────────┬────────┘
                 │
                 │ map center changes
                 ▼
              onIdle
                 │
                 ▼
            getCenter()
                 │
                 ▼
          { lat, lng }
                 │
                 ├──────────────┐
                 │              │
                 ▼              ▼
          Reverse geocode    Backend
                 │              │
                 ▼              ▼
             Address       Save location
```

And the pin:

```text
                 📍
                 ↑
           NEVER MOVES

        ┌─────────────────┐
        │                 │
        │       MAP       │
        │                 │
        │     MOVES       │
        │                 │
        └─────────────────┘
```

That's the ecommerce location-picker pattern.

---

## The libraries in this implementation

You'll ultimately have:

```text
Next.js
   +
React
   +
@vis.gl/react-google-maps
   +
Google Maps JavaScript API
   +
Google Geocoding
   +
Google Places
```

The React wrapper is essentially the bridge:

```text
Your React code
      ↓
@vis.gl/react-google-maps
      ↓
Google Maps JavaScript API
      ↓
Google Maps
```

The wrapper exposes the underlying map instance through hooks such as `useMap`, and its `Map` component exposes events such as `onIdle`, `onDragend`, and `onCameraChanged`. ([Vis.gl][13])

### One recommendation

If you're building this for an actual **checkout/address form**, I would **not stop at the code above**. The next version should have:

1. **Search address/autocomplete**
2. **Center-pin map picker**
3. **"Use my location"**
4. **Reverse geocoding**
5. **Address details** — street, city, postal code, province
6. **Loading state while geocoding**
7. **"Move the pin to adjust"**
8. **Confirm location**
9. **Delivery-area validation**
10. **Save `{lat, lng, address}` to your database**
11. **Prevent excessive geocoding requests**
12. **Mobile-first UI**

That is the version I'd use for a real ecommerce checkout rather than just a demo.

[1]: https://visgl.github.io/react-google-maps/docs/get-started?utm_source=chatgpt.com "Get Started | React Google Maps"
[2]: https://developers.google.com/maps/documentation/javascript/get-api-key?utm_source=chatgpt.com "Set up the Maps JavaScript API  |  Google for Developers"
[3]: https://developers.google.com/maps/documentation/javascript/demo-key?utm_source=chatgpt.com "Get a Maps Demo Key and use it with the Maps JavaScript API  |  Google for Developers"
[4]: https://developers.google.com/maps/documentation/javascript/examples/geocoding-reverse?utm_source=chatgpt.com "Reverse Geocoding  |  Maps JavaScript API  |  Google for Developers"
[5]: https://developers.google.com/maps/api-security-best-practices?utm_source=chatgpt.com "Google Maps Platform security guidance  |  Google for Developers"
[6]: https://visgl.github.io/react-google-maps/docs/api-reference/components/api-provider?utm_source=chatgpt.com "<APIProvider> Component | React Google Maps"
[7]: https://visgl.github.io/react-google-maps/docs/api-reference/components/map?utm_source=chatgpt.com "<Map> Component | React Google Maps"
[8]: https://visgl.github.io/react-google-maps/docs/api-reference/components/advanced-marker?utm_source=chatgpt.com "<AdvancedMarker> Component | React Google Maps"
[9]: https://visgl.github.io/react-google-maps/docs/guides/interacting-with-google-maps-api?utm_source=chatgpt.com "Interacting with the Google Maps JavaScript API | React Google Maps"
[10]: https://visgl.github.io/react-google-maps/docs/api-reference/hooks/use-maps-library?utm_source=chatgpt.com "useMapsLibrary Hook | React Google Maps"
[11]: https://developers.google.com/maps/documentation/geocoding/start-v4?hl=en&utm_source=chatgpt.com "Get Started with the Geocoding API v4  |  Google for Developers"
[12]: https://developers.google.com/maps/documentation/javascript/usage-and-billing?utm_source=chatgpt.com "Maps JavaScript API Usage and Billing  |  Google for Developers"
[13]: https://visgl.github.io/react-google-maps/docs/api-reference/hooks/use-map?utm_source=chatgpt.com "useMap Hook | React Google Maps"
