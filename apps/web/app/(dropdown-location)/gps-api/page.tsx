// "use client";

// import { useState } from "react";

// type Location = {
//   latitude: number;
//   longitude: number;
//   accuracy: number;
//   copy: string;
// };

// export default function GetGPS() {
//   const [location, setLocation] = useState<Location | null>(null);
//   const [error, setError] = useState<string | null>(null);

//   const getLocation = () => {
//     if (!navigator.geolocation) {
//       setError("Geolocation not supported");
//       return;
//     }

//     navigator.geolocation.getCurrentPosition(
//       (position) => {
//         setLocation({
//           latitude: position.coords.latitude,
//           longitude: position.coords.longitude,
//           accuracy: position.coords.accuracy,
//           copy: position.coords.latitude + ", " + position.coords.longitude,
//         });
//       },
//       (err) => {
//         setError(err.message);
//       },
//       {
//         enableHighAccuracy: true,
//         timeout: 10000,
//         maximumAge: 0,
//       },
//     );
//   };

//   return (
//     <div>
//       <button onClick={getLocation}>Get GPS Location</button>

//       {location && <pre>{JSON.stringify(location, null, 2)}</pre>}

//       {error && <p>{error}</p>}
//     </div>
//   );
// }

"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";

type Location = {
  lat: number;
  lng: number;
  source: "gps" | "ip";
};

export default function LocationGate() {
  const [step, setStep] = useState<"explain" | "loading" | "done">("explain");
  const [location, setLocation] = useState<Location | null>(null);

  const ipMutation = useMutation({
    mutationFn: () => api.get("/api/ip-gps").then((r) => r.data),
    onSuccess: (data) => {
      setLocation({ lat: data.latitude, lng: data.longitude, source: "ip" });
      setStep("done");
    },
  });

  const requestGPS = () => {
    setStep("loading");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          source: "gps",
        });
        setStep("done");
      },
      () => {
        ipMutation.mutate();
      },
      { enableHighAccuracy: true },
    );
  };

  return (
    <div>
      {step === "explain" && (
        <div className="modal">
          <h2>Allow Location</h2>
          <p>We use your location to show nearby outlets.</p>
          <button onClick={requestGPS}>Allow location</button>
          <button onClick={() => ipMutation.mutate()}>
            Continue without GPS
          </button>
        </div>
      )}

      {step === "loading" && <p>Getting location…</p>}

      {step === "done" && location && (
        <div>
          <p>
            Location source: <b>{location.source}</b>
          </p>
          <p>Lat: {location.lat}</p>
          <p>Lng: {location.lng}</p>
          <p>
            copy: {location.lat}, {location.lng}
          </p>
        </div>
      )}

      {ipMutation.isError && <p>Failed to get location</p>}
    </div>
  );
}
