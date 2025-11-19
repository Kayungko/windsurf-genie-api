import express from 'express';
import { faker } from '@faker-js/faker';
import { getRandomUSAddress } from './src/usAddress.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8082;

// 简单的 BIN 元数据生成器（不依赖第三方 API）
function generateBinInfo(bin) {
  const schemes = ['visa', 'mastercard', 'amex', 'discover'];
  const types = ['debit', 'credit'];

  return {
    scheme: schemes[Number(bin[0]) % schemes.length],
    type: types[Number(bin[1]) % types.length],
    bank: {
      name: faker.company.name()
    },
    country: {
      // 为了与地址生成保持一致，这里固定为美国
      name: 'United States',
      alpha2: 'US'
    }
  };
}

// BIN 查询: /bin/:bin
app.get('/bin/:bin', (req, res) => {
  const bin = String(req.params.bin || '').slice(0, 6);
  if (!/^\d{6}$/.test(bin)) {
    return res.status(400).json({ error: 'Invalid BIN' });
  }

  const info = generateBinInfo(bin);
  return res.json(info);
});

// 真实地址库查询: /real-address?country=US&state=CA&city=Los Angeles
app.get('/real-address', async (req, res) => {
  try {
    const country = (req.query.country || 'US').toUpperCase();
    const state = (req.query.state || '').toUpperCase();
    const city = req.query.city || '';

    // 加载地址库
    const dbPath = path.join(__dirname, 'data/real-addresses.json');
    const dbContent = await fs.readFile(dbPath, 'utf-8');
    const database = JSON.parse(dbContent);

    // 查找指定国家/州/城市
    if (!database[country]) {
      return res.status(404).json({ error: `Country ${country} not found in database` });
    }

    if (state && !database[country][state]) {
      return res.status(404).json({ error: `State ${state} not found in ${country}` });
    }

    if (city && state && !database[country][state][city]) {
      return res.status(404).json({ error: `City ${city} not found in ${state}, ${country}` });
    }

    // 随机选择一条地址
    let addresses = [];
    
    if (city && state) {
      // 指定了城市，从该城市随机选
      addresses = database[country][state][city];
    } else if (state) {
      // 只指定了州，从该州所有城市随机选
      const cities = Object.keys(database[country][state]);
      const randomCity = cities[Math.floor(Math.random() * cities.length)];
      addresses = database[country][state][randomCity];
    } else {
      // 只指定了国家，从所有州随机选
      const states = Object.keys(database[country]);
      const randomState = states[Math.floor(Math.random() * states.length)];
      const cities = Object.keys(database[country][randomState]);
      const randomCity = cities[Math.floor(Math.random() * cities.length)];
      addresses = database[country][randomState][randomCity];
    }

    if (!addresses || addresses.length === 0) {
      return res.status(404).json({ error: 'No addresses found' });
    }

    // 随机选一条
    const randomAddress = addresses[Math.floor(Math.random() * addresses.length)];

    return res.json({
      street: randomAddress.street,
      zip: randomAddress.zip,
      city: city || 'Unknown',
      state: state || 'Unknown',
      country,
      source: 'database'
    });
  } catch (error) {
    console.error('Error querying real address:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 随机用户: /random-user?nat=us
// 统一生成美国地址，结构与扩展端期望的 { name, address, contact } 匹配
app.get('/random-user', (req, res) => {
  const nat = (req.query.nat || 'us').toString().toLowerCase();

  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const email = faker.internet.email({ firstName, lastName });
  const phone = faker.phone.number();

  const addr = getRandomUSAddress();

  return res.json({
    name: `${firstName} ${lastName}`,
    address: {
      street: addr.street,
      city: addr.city,
      state: addr.stateCode,
      country: addr.country,
      postcode: addr.postcode
    },
    contact: {
      email,
      phone
    },
    nat
  });
});

app.listen(PORT, () => {
  console.log(`Windsurf Genie API listening on port ${PORT}`);
});
