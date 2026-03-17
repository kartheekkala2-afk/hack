import { GoogleMap, Marker, useLoadScript, InfoWindow } from '@react-google-maps/api'
import { useEffect, useState, useCallback } from 'react'
import { getDonations } from './api'

const containerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '20px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
};

const defaultCenter = { lat: 16.5062, lng: 80.6480 };

// Premium Dark Mode Map Styles
const mapStyles = [
  { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
  { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#212a37" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#9ca5b3" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] }
];

export default function DonationMap() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyAw_S6p0kraCoy_rdETI_m_54Lwqoojdp4"
  })

  const [donations, setDonations] = useState([])
  const [selectedDonation, setSelectedDonation] = useState(null)

  useEffect(() => {
    getDonations().then(data => {
      if (data) setDonations(data)
    })
  }, [])

  if (!isLoaded) return <div style={{ padding: '20px', textAlign: 'center' }}>🛰️ Aligning Satellite View...</div>

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={defaultCenter}
      zoom={12}
      options={{ styles: mapStyles, disableDefaultUI: true, zoomControl: true }}
    >
      {donations.map((d) => (
        <Marker
          key={d.id}
          position={{ lat: parseFloat(d.latitude), lng: parseFloat(d.longitude) }}
          onClick={() => setSelectedDonation(d)}
          icon={{
            url: 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png',
            scaledSize: new window.google.maps.Size(40, 40)
          }}
        />
      ))}

      {selectedDonation && (
        <InfoWindow
          position={{ lat: parseFloat(selectedDonation.latitude), lng: parseFloat(selectedDonation.longitude) }}
          onCloseClick={() => setSelectedDonation(null)}
        >
          <div style={{ padding: '10px', color: '#333' }}>
            <h3 style={{ margin: '0 0 5px 0' }}>{selectedDonation.food_type || 'Food Donation'}</h3>
            <p style={{ margin: '0', fontSize: '14px' }}><b>Quantity:</b> {selectedDonation.quantity || 0} meals</p>
            <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>{selectedDonation.location || 'Loading address...'}</p>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  )
}
