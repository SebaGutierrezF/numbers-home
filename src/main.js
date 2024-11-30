import './styles/main.css';
import { db } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import L from 'leaflet';

// Mapa y sus configuraciones
let map = null;
const defaultCenter = [0, 0];
const defaultZoom = 2;

// Coordenadas de países
const countryCoordinates = {
  'US': { lat: 37.0902, lng: -95.7129 },
  'GB': { lat: 55.3781, lng: -3.4360 },
  'ES': { lat: 40.4637, lng: -3.7492 },
  'CL': { lat: -35.6751, lng: -71.5430 },
};

// Referencias a elementos del DOM
const phoneInput = document.getElementById('phone');
const validateButton = document.getElementById('validate');
const resultDiv = document.getElementById('result');
const resultContent = document.querySelector('.result-content');
const mapDiv = document.getElementById('map');

// Inicializar mapa
function initMap() {
  if (!map) {
    map = L.map('map').setView(defaultCenter, defaultZoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: ' OpenStreetMap contributors'
    }).addTo(map);
  }
}

// Validar número de teléfono
async function validatePhoneNumber(phoneNumber) {
  try {
    const apiKey = import.meta.env.VITE_NUMLOOKUP_API_KEY;
    const response = await fetch(`https://api.numlookupapi.com/v1/validate/${phoneNumber}?apikey=${apiKey}`);
    const data = await response.json();

    // Guardar en Firestore
    try {
      await addDoc(collection(db, 'numeros'), {
        telefono: phoneNumber,
        timestamp: new Date().toISOString(),
        pais: data.country_name,
        codigoPais: data.country_code,
        valido: data.valid,
        formatoLocal: data.local_format,
        formatoInternacional: data.international_format,
        tipo: data.line_type || 'Desconocido'
      });
    } catch (error) {
      console.error('Error al guardar en Firestore:', error);
    }

    return data;
  } catch (error) {
    console.error('Error al validar número:', error);
    throw error;
  }
}

// Mostrar resultado
function displayResult(data) {
  if (!data) {
    resultContent.innerHTML = '<p class="error">Error al validar el número</p>';
    return;
  }

  const validClass = data.valid ? 'valid' : 'invalid';
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

  // Mostrar en el mapa
  if (data.country_code) {
    const coordinates = countryCoordinates[data.country_code];
    if (coordinates) {
      showLocationOnMap(coordinates.lat, coordinates.lng, data.country_name);
    }
  }
}

// Mostrar ubicación en el mapa
function showLocationOnMap(lat, lng, countryName) {
  if (!map) {
    initMap();
  }

  map.setView([lat, lng], 4);
  L.marker([lat, lng])
    .addTo(map)
    .bindPopup(countryName)
    .openPopup();
}

// Obtener validaciones anteriores
async function getRecentValidations() {
  try {
    const q = query(
      collection(db, 'numeros'),
      orderBy('timestamp', 'desc'),
      limit(5)
    );
    
    const querySnapshot = await getDocs(q);
    const validations = [];
    querySnapshot.forEach((doc) => {
      validations.push({ id: doc.id, ...doc.data() });
    });
    
    return validations;
  } catch (error) {
    console.error('Error al obtener validaciones:', error);
    return [];
  }
}

// Mostrar historial de validaciones
function displayValidationHistory(validations) {
  const historyContainer = document.createElement('div');
  historyContainer.className = 'history-container';
  historyContainer.innerHTML = '<h3>Últimas validaciones</h3>';

  validations.forEach(validation => {
    const validationItem = document.createElement('div');
    validationItem.className = `validation-item ${validation.valido ? 'valid' : 'invalid'}`;
    validationItem.innerHTML = `
      <p><strong>Teléfono:</strong> ${validation.telefono}</p>
      <p><strong>País:</strong> ${validation.pais}</p>
      <p><strong>Válido:</strong> ${validation.valido ? 'Sí' : 'No'}</p>
      <p><strong>Fecha:</strong> ${new Date(validation.timestamp).toLocaleString()}</p>
    `;
    historyContainer.appendChild(validationItem);
  });

  const existingHistory = document.querySelector('.history-container');
  if (existingHistory) {
    existingHistory.remove();
  }
  
  const container = document.querySelector('.container');
  container.appendChild(historyContainer);
}

// Event Listeners
if (validateButton && phoneInput) {
  validateButton.addEventListener('click', async () => {
    const phoneNumber = phoneInput.value.trim();
    if (!phoneNumber) {
      alert('Por favor ingresa un número telefónico');
      return;
    }

    try {
      validateButton.disabled = true;
      const data = await validatePhoneNumber(phoneNumber);
      resultDiv.classList.remove('hidden');
      mapDiv.classList.remove('hidden');
      displayResult(data);
    } catch (error) {
      resultContent.innerHTML = '<p class="error">Error al validar el número</p>';
      console.error('Error:', error);
    } finally {
      validateButton.disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  initMap();
  const validations = await getRecentValidations();
  displayValidationHistory(validations);
});
