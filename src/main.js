import L from 'leaflet';
import './styles/main.css';

// Coordenadas de países (simplificado)
const countryCoordinates = {
  'US': { lat: 37.0902, lng: -95.7129 },
  'GB': { lat: 55.3781, lng: -3.4360 },
  'ES': { lat: 40.4637, lng: -3.7492 },
  'CL': { lat: -35.6751, lng: -71.5430 },
  // Añadir más países según sea necesario
};

// Inicializar el mapa cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  try {
    const map = L.map('map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: ' OpenStreetMap contributors'
    }).addTo(map);

    let marker = null;

    async function validatePhoneNumber(phoneNumber) {
      try {
        const apiKey = import.meta.env.VITE_NUMLOOKUP_API_KEY;
        if (!apiKey) {
          throw new Error('API key no configurada');
        }

        const response = await fetch(`https://api.numlookupapi.com/v1/validate/${phoneNumber}?apikey=${apiKey}`);
        if (!response.ok) {
          throw new Error('Error en la respuesta de la API');
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error validando número:', error);
        return { error: error.message };
      }
    }

    function updateMap(countryCode) {
      const coordinates = countryCoordinates[countryCode];
      if (!coordinates) {
        console.warn('Coordenadas no disponibles para:', countryCode);
        return;
      }

      if (marker) {
        map.removeLayer(marker);
      }

      marker = L.marker([coordinates.lat, coordinates.lng]).addTo(map);
      map.setView([coordinates.lat, coordinates.lng], 4);
    }

    function displayResult(data) {
      const resultContent = document.querySelector('.result-content');
      const resultDiv = document.getElementById('result');

      if (!resultContent || !resultDiv) {
        console.error('Elementos de resultado no encontrados');
        return;
      }

      if (!data || data.error) {
        resultContent.innerHTML = `
          <div class="result-item error">
            <span>Error: ${data?.error || 'Error desconocido al validar el número'}</span>
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

    const validateButton = document.getElementById('validate');
    if (validateButton) {
      validateButton.addEventListener('click', async () => {
        const phoneInput = document.getElementById('phone');
        if (!phoneInput) {
          console.error('Elemento de entrada no encontrado');
          return;
        }

        const phoneNumber = phoneInput.value.trim();
        if (!phoneNumber) {
          alert('Por favor ingresa un número telefónico');
          return;
        }

        validateButton.disabled = true;
        validateButton.textContent = 'Validando...';

        try {
          const result = await validatePhoneNumber(phoneNumber);
          displayResult(result);
        } catch (error) {
          console.error('Error:', error);
          displayResult({ error: 'Error al procesar la solicitud' });
        } finally {
          validateButton.disabled = false;
          validateButton.textContent = 'Validar';
        }
      });
    }
  } catch (error) {
    console.error('Error inicializando la aplicación:', error);
    document.body.innerHTML = `
      <div class="error-container">
        <h1>Error</h1>
        <p>Lo sentimos, ha ocurrido un error al cargar la aplicación.</p>
        <p>Por favor, recarga la página o intenta más tarde.</p>
      </div>
    `;
  }
});
