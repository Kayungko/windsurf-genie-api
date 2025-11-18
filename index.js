import express from 'express';
import { faker } from '@faker-js/faker';

const app = express();
const PORT = process.env.PORT || 3000;

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
      name: faker.location.country(),
      alpha2: faker.location.countryCode('alpha-2')
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
app.get('/random-user', (req, res) => {
  const nat = (req.query.nat || 'us').toString().toLowerCase();

  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const street = faker.location.streetAddress();
  const city = faker.location.city();
  const state = faker.location.state();
  const country = faker.location.country();
  const postcode = faker.location.zipCode();
  const email = faker.internet.email({ firstName, lastName });
  const phone = faker.phone.number();

  return res.json({
    name: `${firstName} ${lastName}`,
    address: {
      street,
      city,
      state,
      country,
      postcode
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
