"use client";

import { useMemo, useState } from "react";
import { submitPlace } from "@/app/map/actions";

type Category = { id: string; name: string; parent_id: string | null };
type Coordinates = { latitude: number; longitude: number; label: string };

const LOCATION_NOT_FOUND =
  "Lokasi tidak ditemukan. Semak alamat, kota dan negeri/wilayah lalu cuba lagi.";

export function PlaceSubmissionForm({ categories }: { categories: Category[] }) {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState("");
  const [locating, setLocating] = useState<"address" | "gps" | null>(null);

  const mapUrl = useMemo(() => {
    if (!coordinates) return null;
    const { latitude, longitude } = coordinates;
    const offset = 0.01;
    const bbox = [longitude - offset, latitude - offset, longitude + offset, latitude + offset]
      .map((value) => value.toFixed(6))
      .join(",");
    const params = new URLSearchParams({
      bbox,
      layer: "mapnik",
      marker: `${latitude.toFixed(6)},${longitude.toFixed(6)}`,
    });
    return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
  }, [coordinates]);

  function updateLocation(next: Coordinates) {
    setCoordinates(next);
    setConfirmed(false);
    setMessage("Periksa marker pada peta, lalu konfirmasi lokasi ini sebelum mengirim.");
  }

  async function findAddress(event: React.MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form;
    if (!form) return;
    const data = new FormData(form);
    const address = String(data.get("address") ?? "").trim();
    const city = String(data.get("city") ?? "").trim();
    const state = String(data.get("state") ?? "").trim();
    if (address.length < 5 || city.length < 2 || state.length < 2) {
      setMessage(LOCATION_NOT_FOUND);
      return;
    }

    setLocating("address");
    setMessage("Mencari lokasi dari alamat...");
    try {
      const response = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, city, state }),
      });
      if (!response.ok) throw new Error("geocoding_failed");
      const result = (await response.json()) as Coordinates;
      if (!validCoordinates(result.latitude, result.longitude)) throw new Error("invalid_coordinates");
      updateLocation(result);
    } catch {
      setCoordinates(null);
      setConfirmed(false);
      setMessage(LOCATION_NOT_FOUND);
    } finally {
      setLocating(null);
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setMessage("Peramban Anda tidak mendukung layanan lokasi. Anda masih boleh mencari lokasi berdasarkan alamat.");
      return;
    }
    setLocating("gps");
    setMessage("Meminta izin lokasi...");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        updateLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          label: "Lokasi yang dipilih dari perangkat ini",
        });
        setLocating(null);
      },
      () => {
        setMessage("Izin lokasi tidak diberikan. Anda masih boleh mencari lokasi berdasarkan alamat.");
        setLocating(null);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  return (
    <form action={submitPlace} className="mt-7 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <Field name="name" label="Nama tempat" required />
      <div>
        <label htmlFor="categoryId" className="text-sm font-semibold">Kategori</label>
        <select id="categoryId" name="categoryId" required className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3">
          <option value="">Pilih kategori</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.parent_id ? `— ${category.name}` : category.name}
            </option>
          ))}
        </select>
      </div>
      <Field name="description" label="Deskripsi singkat" />
      <Field name="address" label="Alamat tempat" required onChange={() => setConfirmed(false)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="city" label="Kota" required onChange={() => setConfirmed(false)} />
        <Field name="state" label="Negeri/wilayah" required onChange={() => setConfirmed(false)} />
      </div>

      <section aria-labelledby="place-location-title" className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <h2 id="place-location-title" className="font-semibold text-blue-950">Tentukan lokasi tempat</h2>
        <p className="mt-1 text-sm leading-6 text-blue-900">
          Cari dari alamat, atau gunakan lokasi perangkat hanya jika Anda sedang berada di tempat tersebut. GPS tidak diminta secara otomatis.
        </p>
        <p className="mt-2 text-xs leading-5 text-blue-800">
          Pencarian dan preview peta menggunakan OpenStreetMap. Alamat atau koordinat lokasi tempat dikirim ke layanan tersebut hanya setelah Anda memilih salah satu tombol.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={findAddress} disabled={locating !== null} className="min-h-11 rounded-lg border border-brand-700 bg-white px-4 py-2 font-semibold text-brand-800 disabled:cursor-wait disabled:opacity-60">
            {locating === "address" ? "Mencari lokasi..." : "📍 Cari lokasi dari alamat"}
          </button>
          <button type="button" onClick={useCurrentLocation} disabled={locating !== null} className="min-h-11 rounded-lg border border-emerald-700 bg-white px-4 py-2 font-semibold text-emerald-800 disabled:cursor-wait disabled:opacity-60">
            {locating === "gps" ? "Mengambil lokasi..." : "📍 Gunakan lokasi saya"}
          </button>
        </div>
        {message && <p role="status" aria-live="polite" className="mt-3 text-sm text-slate-700">{message}</p>}

        {coordinates && mapUrl && (
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-300 bg-white">
            <iframe
              title="Preview lokasi tempat"
              src={mapUrl}
              className="h-64 w-full"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <div className="space-y-3 p-4">
              <p className="text-sm font-medium text-slate-900">{coordinates.label}</p>
              <p className="text-xs text-slate-500">Koordinat tersimpan secara internal dan tidak dapat diedit langsung.</p>
              <button type="button" onClick={() => { setConfirmed(true); setMessage("Lokasi telah dikonfirmasi."); }} className="min-h-11 rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800">
                {confirmed ? "✓ Lokasi dikonfirmasi" : "Konfirmasi lokasi ini"}
              </button>
            </div>
          </div>
        )}
      </section>

      <input type="hidden" name="latitude" value={coordinates?.latitude ?? ""} />
      <input type="hidden" name="longitude" value={coordinates?.longitude ?? ""} />
      <input type="hidden" name="locationConfirmed" value={confirmed ? "1" : ""} />
      <Field name="phone" label="Telepon (opsional)" />
      <Field name="website" label="Website HTTPS (opsional)" type="url" />
      <button disabled={!confirmed || locating !== null} className="min-h-11 w-full rounded-lg bg-brand-700 px-5 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400">
        Kirim untuk moderasi
      </button>
    </form>
  );
}

function validCoordinates(latitude: number, longitude: number) {
  return Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

function Field({ name, label, type = "text", required = false, onChange }: { name: string; label: string; type?: string; required?: boolean; onChange?: () => void }) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-semibold">{label}</label>
      {name === "description" ? (
        <textarea id={name} name={name} rows={4} onChange={onChange} className="mt-2 w-full rounded-lg border border-slate-300 p-3" />
      ) : (
        <input id={name} name={name} type={type} required={required} onChange={onChange} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3" />
      )}
    </div>
  );
}
