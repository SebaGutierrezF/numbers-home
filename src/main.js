import L from 'leaflet';
import './styles/main.css';

// Coordenadas de países (simplificado)
const countryCoordinates = {
  'US': { lat: 37.0902, lng: -95.7129 },
  'GB': { lat: 55.3781, lng: -3.4360 },
  'ES': { lat: 40.4637, lng: -3.7492 },
  // Añadir más países según sea necesario
};

// Inicializar el mapa
const map = L.map('map').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: ' OpenStreetMap contributors'
}).addTo(map);

let marker = null;

async function validatePhoneNumber(phoneNumber) {
  try {
    const apiKey = import.meta.env.VITE_NUMLOOKUP_API_KEY;
    const response = await fetch(`https://api.numlookupapi.com/v1/validate/${phoneNumber}?apikey=${apiKey}`);
    const data = await response.json();

    return data;
  } catch (error) {
    console.error('Error validando número:', error);
    return null;
  }
}

function updateMap(countryCode) {
  const coordinates = countryCoordinates[countryCode];
  if (!coordinates) return;

  if (marker) {
    map.removeLayer(marker);
  }

  marker = L.marker([coordinates.lat, coordinates.lng]).addTo(map);
  map.setView([coordinates.lat, coordinates.lng], 4);
}

function displayResult(data) {
  const resultContent = document.querySelector('.result-content');
  const resultDiv = document.getElementById('result');

  if (!data || data.error) {
    resultContent.innerHTML = `
      <div class="result-item error">
        <span>Error al validar el número</span>
      </div>
    `;
    resultDiv.classList.remove('hidden');
    return;
  }

  resultContent.innerHTML = `
    <div class="result-item">
      <span>Número:</span>
      <span>${data.phone || 'No disponible'}</span>
    </div>
    <div class="result-item">
      <span>País:</span>
      <span>${data.country_name || 'No disponible'}</span>
    </div>
    <div class="result-item">
      <span>Código de país:</span>
      <span>${data.country_prefix || 'No disponible'}</span>
    </div>
    <div class="result-item">
      <span>Formato internacional:</span>
      <span>${data.international_format || 'No disponible'}</span>
    </div>
    <div class="result-item">
      <span>Válido:</span>
      <span>${data.valid ? ' Sí' : ' No'}</span>
    </div>
  `;

  resultDiv.classList.remove('hidden');
  if (data.country_code) {
    updateMap(data.country_code);
  }
}

document.getElementById('validate').addEventListener('click', async () => {
  const phoneNumber = document.getElementById('phone').value.trim();
  if (!phoneNumber) {
    alert('Por favor ingresa un número telefónico');
    return;
  }

  const result = await validatePhoneNumber(phoneNumber);
  displayResult(result);
});
