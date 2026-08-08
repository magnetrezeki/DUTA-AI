"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CommunityPlace } from "@/lib/day3/types";

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radians = (value: number) => (value * Math.PI) / 180;
  const dLat = radians(lat2 - lat1);
  const dLon = radians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function NearbyPlaces({ places }: { places: CommunityPlace[] }) {
  const [position, setPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [message, setMessage] = useState("");
  const nearby = useMemo(() => position ? places
    .map((place) => ({ place, distance: distanceKm(position.latitude, position.longitude, place.latitude, place.longitude) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5) : [], [places, position]);

  function locate() {
    if (!navigator.geolocation) {
      setMessage("Peramban Anda tidak mendukung lokasi.");
      return;
    }
    setMessage("Meminta izin lokasi...");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPosition({ latitude: coords.latitude, longitude: coords.longitude });
        setMessage("Lokasi hanya dipakai di perangkat ini dan tidak disimpan atau dikirim ke DUTA AI.");
      },
      () => setMessage("Lokasi tidak tersedia. Anda tetap dapat mencari berdasarkan kota atau negeri."),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  return (
    <section className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
      <h2 className="text-xl font-bold text-slate-950">Tempat terdekat</h2>
      <p className="mt-2 text-sm leading-6 text-slate-700">Lokasi tepat Anda diproses hanya di peramban. DUTA AI tidak menyimpan, mengirim, atau menampilkannya kepada publik.</p>
      <button type="button" onClick={locate} className="mt-4 min-h-11 rounded-lg bg-emerald-700 px-5 py-2 font-semibold text-white hover:bg-emerald-800">Gunakan lokasi saya</button>
      {message && <p className="mt-3 text-sm text-slate-700" role="status">{message}</p>}
      {position && (
        <div className="mt-5 grid gap-3">
          {nearby.map(({ place, distance }) => (
            <Link key={place.id} href={`/map/${place.id}`} className="rounded-xl border border-emerald-200 bg-white p-4 hover:border-emerald-400">
              <span className="font-semibold text-slate-950">{place.name}</span>
              <span className="ml-2 text-sm text-slate-600">{distance.toFixed(1)} km</span>
            </Link>
          ))}
          {nearby.length === 0 && <p className="text-sm text-slate-600">Belum ada tempat yang telah disetujui.</p>}
        </div>
      )}
    </section>
  );
}
