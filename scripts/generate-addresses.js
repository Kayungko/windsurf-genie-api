#!/usr/bin/env node

/**
 * 自动化地址库扩展脚本
 * 
 * 功能：
 * - 使用 Faker.js 生成美国真实地址
 * - 按州/城市组织
 * - 每个城市生成指定数量的地址
 * 
 * 运行：node scripts/generate-addresses.js [数量]
 */

import { faker } from '@faker-js/faker';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 目标文件路径
const OUTPUT_FILE = path.join(__dirname, '../data/real-addresses.json');

// 美国州和主要城市配置
const US_LOCATIONS = {
  CA: {
    name: 'California',
    cities: ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose', 'Sacramento'],
    zipRanges: {
      'Los Angeles': { min: 90001, max: 90899 },
      'San Francisco': { min: 94102, max: 94188 },
      'San Diego': { min: 92101, max: 92199 },
      'San Jose': { min: 95101, max: 95199 },
      'Sacramento': { min: 94203, max: 94299 }
    }
  },
  NY: {
    name: 'New York',
    cities: ['New York', 'Buffalo', 'Rochester', 'Albany'],
    zipRanges: {
      'New York': { min: 10001, max: 10282 },
      'Buffalo': { min: 14201, max: 14280 },
      'Rochester': { min: 14602, max: 14694 },
      'Albany': { min: 12201, max: 12288 }
    }
  },
  TX: {
    name: 'Texas',
    cities: ['Houston', 'Dallas', 'Austin', 'San Antonio'],
    zipRanges: {
      'Houston': { min: 77001, max: 77299 },
      'Dallas': { min: 75201, max: 75398 },
      'Austin': { min: 78701, max: 78799 },
      'San Antonio': { min: 78201, max: 78299 }
    }
  },
  FL: {
    name: 'Florida',
    cities: ['Miami', 'Orlando', 'Tampa', 'Jacksonville'],
    zipRanges: {
      'Miami': { min: 33101, max: 33199 },
      'Orlando': { min: 32801, max: 32899 },
      'Tampa': { min: 33601, max: 33699 },
      'Jacksonville': { min: 32201, max: 32299 }
    }
  },
  IL: {
    name: 'Illinois',
    cities: ['Chicago', 'Aurora', 'Naperville'],
    zipRanges: {
      'Chicago': { min: 60601, max: 60699 },
      'Aurora': { min: 60502, max: 60599 },
      'Naperville': { min: 60540, max: 60567 }
    }
  },
  WA: {
    name: 'Washington',
    cities: ['Seattle', 'Spokane', 'Tacoma'],
    zipRanges: {
      'Seattle': { min: 98101, max: 98199 },
      'Spokane': { min: 99201, max: 99299 },
      'Tacoma': { min: 98401, max: 98499 }
    }
  },
  MA: {
    name: 'Massachusetts',
    cities: ['Boston', 'Cambridge', 'Worcester'],
    zipRanges: {
      'Boston': { min: 2101, max: 2298 },
      'Cambridge': { min: 2138, max: 2142 },
      'Worcester': { min: 1601, max: 1655 }
    }
  },
  PA: {
    name: 'Pennsylvania',
    cities: ['Philadelphia', 'Pittsburgh'],
    zipRanges: {
      'Philadelphia': { min: 19101, max: 19199 },
      'Pittsburgh': { min: 15201, max: 15299 }
    }
  },
  GA: {
    name: 'Georgia',
    cities: ['Atlanta', 'Savannah'],
    zipRanges: {
      'Atlanta': { min: 30301, max: 30399 },
      'Savannah': { min: 31401, max: 31499 }
    }
  },
  CO: {
    name: 'Colorado',
    cities: ['Denver', 'Colorado Springs'],
    zipRanges: {
      'Denver': { min: 80201, max: 80299 },
      'Colorado Springs': { min: 80901, max: 80951 }
    }
  }
};

/**
 * 生成指定城市的真实地址
 */
function generateAddress(city, state, zipRange) {
  // Faker 的美国地址生成器
  faker.location.state = () => state;
  
  const streetNumber = faker.number.int({ min: 100, max: 9999 });
  const streetName = faker.location.street();
  const zip = faker.number.int({ min: zipRange.min, max: zipRange.max });
  
  return {
    street: `${streetNumber} ${streetName}`,
    zip: String(zip).padStart(5, '0')
  };
}

/**
 * 主函数
 */
async function main() {
  const addressesPerCity = parseInt(process.argv[2]) || 100;
  
  console.log(`🏗️  开始生成美国地址库...`);
  console.log(`📊 配置: 每个城市 ${addressesPerCity} 条地址\n`);
  
  const database = { US: {} };
  let totalCount = 0;
  
  // 遍历所有州
  for (const [stateCode, stateInfo] of Object.entries(US_LOCATIONS)) {
    console.log(`🌎 ${stateInfo.name} (${stateCode})`);
    database.US[stateCode] = {};
    
    // 遍历所有城市
    for (const city of stateInfo.cities) {
      const zipRange = stateInfo.zipRanges[city];
      if (!zipRange) {
        console.warn(`   ⚠️  ${city}: 没有配置邮编范围，跳过`);
        continue;
      }
      
      const addresses = [];
      const uniqueAddresses = new Set();
      
      // 生成地址（去重）
      while (addresses.length < addressesPerCity) {
        const addr = generateAddress(city, stateCode, zipRange);
        const key = `${addr.street}|${addr.zip}`;
        
        if (!uniqueAddresses.has(key)) {
          uniqueAddresses.add(key);
          addresses.push(addr);
        }
      }
      
      database.US[stateCode][city] = addresses;
      totalCount += addresses.length;
      
      console.log(`   ✅ ${city}: ${addresses.length} 条地址`);
    }
    
    console.log('');
  }
  
  // 保存到文件
  await fs.writeFile(
    OUTPUT_FILE,
    JSON.stringify(database, null, 2),
    'utf-8'
  );
  
  console.log(`\n✅ 地址库生成完成!`);
  console.log(`📦 总计: ${totalCount} 条地址`);
  console.log(`📁 文件: ${OUTPUT_FILE}`);
  console.log(`💾 大小: ${(JSON.stringify(database).length / 1024).toFixed(2)} KB`);
}

main().catch(console.error);
