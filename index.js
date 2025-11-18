import express from 'express';
import { faker } from '@faker-js/faker';
import { getRandomUSAddress } from './src/usAddress.js';

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
