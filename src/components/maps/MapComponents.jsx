import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const openIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const resolvedIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const myIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

function LocationPicker({ onLocationSelect }) {
    useMapEvents({
        click(e) {
            onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
        },
    });
    return null;
}

export function CityMap({ complaints = [], center = [17.385, 78.4867], zoom = 12, height = '400px' }) {
    return (
        <MapContainer center={center} zoom={zoom} style={{ height, width: '100%', borderRadius: '12px' }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {complaints.map((c, i) => {
                if (!c.location?.lat) return null;
                const icon = c.status === 'resolved' ? resolvedIcon : openIcon;
                return (
                    <Marker key={i} position={[c.location.lat, c.location.lng]} icon={icon}>
                        <Popup>
                            <div className="p-1">
                                <p className="font-semibold text-sm text-slate-800">{c.title}</p>
                                <p className="text-xs text-slate-500">{c.category}</p>
                                <span className={`text-xs font-medium ${c.status === 'resolved' ? 'text-green-600' : 'text-orange-600'}`}>
                                    {c.status}
                                </span>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}

export function HeatMap({ complaints = [], center = [17.385, 78.4867], zoom = 12, height = '400px' }) {
    return (
        <MapContainer center={center} zoom={zoom} style={{ height, width: '100%', borderRadius: '12px' }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {complaints.map((c, i) => {
                if (!c.location?.lat) return null;
                const color = c.status === 'resolved' ? '#22c55e' :
                    c.severity === 'critical' ? '#ef4444' :
                        c.severity === 'high' ? '#f97316' : '#3b82f6';
                return (
                    <CircleMarker
                        key={i}
                        center={[c.location.lat, c.location.lng]}
                        radius={12}
                        fillColor={color}
                        color={color}
                        weight={1}
                        opacity={0.8}
                        fillOpacity={0.5}
                    >
                        <Popup>
                            <p className="font-semibold text-sm">{c.title}</p>
                            <p className="text-xs text-slate-500">{c.category} · {c.severity}</p>
                        </Popup>
                    </CircleMarker>
                );
            })}
        </MapContainer>
    );
}

export function LocationPickerMap({ location, onLocationSelect, height = '300px' }) {
    const [marker, setMarker] = useState(location);
    const center = marker ? [marker.lat, marker.lng] : [17.385, 78.4867];

    const handleSelect = (loc) => {
        setMarker(loc);
        onLocationSelect(loc);
    };

    return (
        <MapContainer center={center} zoom={13} style={{ height, width: '100%', borderRadius: '12px' }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationPicker onLocationSelect={handleSelect} />
            {marker && (
                <Marker position={[marker.lat, marker.lng]} icon={myIcon}>
                    <Popup>Selected location<br />{marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}</Popup>
                </Marker>
            )}
        </MapContainer>
    );
}

export function SinglePinMap({ lat, lng, height = '200px' }) {
    if (!lat || !lng) return null;
    return (
        <MapContainer center={[lat, lng]} zoom={15} style={{ height, width: '100%', borderRadius: '12px' }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[lat, lng]} icon={openIcon}>
                <Popup>Complaint Location</Popup>
            </Marker>
        </MapContainer>
    );
}
