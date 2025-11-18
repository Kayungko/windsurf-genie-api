import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, '..', 'data', 'us-addresses.json');

let addressData;

function loadAddressData() {
  if (!addressData) {
    try {
      const raw = fs.readFileSync(dataPath, 'utf8');
      addressData = JSON.parse(raw);
    } catch (error) {
      console.error('Failed to load US address data:', error);
      // 回退到一个非常简单的内置配置，避免整个接口挂掉
      addressData = {
        country: 'United States',
        countryCode: 'US',
        states: [
          {
            code: 'CA',
            name: 'California',
            cities: [
              { name: 'Los Angeles', postcodes: ['90001'] }
            ]
          }
        ],
        streetNames: ['Main St']
      };
    }
  }
  return addressData;
}

function pickRandom(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 生成一个统一的美国地址
 * 返回结构：{ country, countryCode, stateCode, stateName, city, postcode, street }
 */
export function getRandomUSAddress() {
  const data = loadAddressData();

  const state = pickRandom(data.states);
  if (!state) {
    return {
      country: data.country || 'United States',
      countryCode: data.countryCode || 'US',
      stateCode: 'CA',
      stateName: 'California',
      city: 'Los Angeles',
      postcode: '90001',
      street: '123 Main St'
    };
  }

  const city = pickRandom(state.cities) || { name: 'Los Angeles', postcodes: ['90001'] };
  const postcode = pickRandom(city.postcodes) || '90001';

  const streetNumber = Math.floor(Math.random() * 9999) + 1;
  const streetName = pickRandom(data.streetNames) || 'Main St';
  const street = `${streetNumber} ${streetName}`;

  return {
    country: data.country || 'United States',
    countryCode: data.countryCode || 'US',
    stateCode: state.code,
    stateName: state.name,
    city: city.name,
    postcode,
    street
  };
}
