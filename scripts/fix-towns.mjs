import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TAS_LOCATION_POSTCODES } from '../src/utils/tasLocationPostcodes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const freeinfo = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src/data/split/freeinfo.json'), 'utf8'));

// Build lookup maps
const townPostcodeMap = new Map(TAS_LOCATION_POSTCODES.map(e => [e.town, e.postcode]));

function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const sortedTownsByLength = [...TAS_LOCATION_POSTCODES].sort((a, b) => b.town.length - a.town.length);

// Chinese-to-English town name mapping
const cnTownMap = {
  '温耶德': 'Wynyard', '韦斯特伯里': 'Westbury', '南港': 'Southport',
  '亚瑟河': 'Arthur River', '朗塞斯顿': 'Launceston', '霍巴特': 'Hobart',
  '德文港': 'Devonport', '伯尼': 'Burnie', '阿尔弗斯通': 'Ulverstone',
  '斯密斯顿': 'Smithton', '企鹅镇': 'Penguin', '斯坦利': 'Stanley',
  '萨默塞特': 'Somerset', '拉特罗布': 'Latrobe', '谢菲尔德': 'Sheffield',
  '雷尔顿': 'Railton', '摇篮山': 'Cradle Mountain', '莫伊纳': 'Moina',
  '莫尔溪': 'Mole Creek', '威尔莫特': 'Wilmot', '斯特拉恩': 'Strahan',
  '昆斯敦': 'Queenstown', '泽汉': 'Zeehan', '罗斯伯里': 'Rosebery',
  '塔拉': 'Tullah', '格兰维尔': 'Granville', '科林纳': 'Corinna',
  '奥特兰兹': 'Oatlands', '博斯韦尔': 'Bothwell', '罗斯': 'Ross',
  '坎贝尔镇': 'Campbell Town', '肯普顿': 'Kempton', '珀斯': 'Perth',
  '朗福德': 'Longford', '米纳': 'Miena', '斯旺西': 'Swansea',
  '比舍诺': 'Bicheno', '科尔斯湾': 'Coles Bay', '圣海伦斯': 'St Helens',
  '奥福德': 'Orford', '斯卡曼德': 'Scamander', '弗雷西内': 'Freycinet',
  '圣玛丽斯': 'St Marys', '特里亚本纳': 'Triabunna', '弗林德斯岛': 'Flinders Island',
  '里士满': 'Richmond', '休恩维尔': 'Huonville', '金斯顿': 'Kingston',
  '吉夫斯顿': 'Geeveston', '布鲁尼岛': 'Bruny Island', '阿瑟港': 'Port Arthur',
  '塔斯曼半岛': 'Tasman Peninsula', '塔玛谷': 'Tamar Valley', '德里': 'Deloraine',
  '多佛': 'Dover', '富兰克林': 'Franklin', '伍德布里奇': 'Woodbridge',
  '凯特灵': 'Kettering', '玛格特': 'Margate', '斯纳格': 'Snug',
  '道奇斯费里': 'Dodges Ferry', '达纳利': 'Dunalley', '鹰颈': 'Eaglehawk Neck',
  '纽比纳': 'Nubeena', '塔兰纳': 'Taranna', '纽诺福克': 'New Norfolk',
  '索雷尔': 'Sorell', '布莱顿': 'Brighton', '伊文代尔': 'Evandale',
  '哈德斯彭': 'Hadspen', '卡里克': 'Carrick', '克雷西': 'Cressy',
  '米安德': 'Meander', '金谷': 'Golden Valley', '希尔伍德': 'Hillwood',
  '布里德波特': 'Bridport', '斯科茨代尔': 'Scottsdale', '德比': 'Derby',
  '韦尔德伯勒': 'Weldborough', '斯蒂格利茨': 'Stieglitz', '海豚沙': 'Dolphin Sands',
  '克兰布鲁克': 'Cranbrook', '巴克兰': 'Buckland', '格雷特纳': 'Gretna',
  '汉密尔顿': 'Hamilton', '乌斯': 'Ouse', '韦斯特威': 'Westerway',
  '梅德纳': 'Maydena', '菲尔德山': 'Mount Field', '库瑞': 'Currie',
  '纳拉库帕': 'Naracoopa', '穆纳': 'Moonah', '格伦诺基': 'Glenorchy',
  '利亚文尼': 'Liawenee', '西哥': 'Western Creek', '高里公园': 'Gowrie Park',
  '洛林纳': 'Lorinna', '沃拉塔': 'Waratah', '萨维奇河': 'Savage River',
  '特玛': 'Temma', '马拉瓦': 'Marrawah', '姐妹海滩': 'Sisters Beach',
  '船港': 'Boat Harbour', '洛基角': 'Rocky Cape', '索雷尔港': 'Port Sorell',
  '霍利海滩': 'Hawley Beach', '特纳斯海滩': 'Turners Beach', '福斯': 'Forth',
  '利斯': 'Leith', '唐': 'Don', '斯普雷顿': 'Spreyton',
  '撒萨弗拉斯': 'Sassafras', '肯德里德': 'Kindred', '帕鲁纳': 'Paloona',
  '巴林顿': 'Barrington', '下巴林顿': 'Lower Barrington', '克劳德路': 'Claude Road',
  '里亚纳': 'Riana', '甘斯普莱恩斯': 'Gunns Plains', '尼塔': 'Nietta',
  '普雷斯顿': 'Preston', '卡斯特拉': 'Castra', '利纳': 'Liena',
  '查德利': 'Chudleigh', '默西森林': 'Mersey Forest', '拉文斯伍德': 'Ravenswood',
  '扬镇': 'Youngtown', '金斯梅多斯': 'Kings Meadows', '诺伍德': 'Norwood',
  '潘奇鲍尔': 'Punchbowl', '雷尔比亚': 'Relbia', '派珀斯溪': 'Pipers Brook',
  '勒布林纳': 'Lebrina', '卡耶纳': 'Kayena', '罗韦拉': 'Rowella',
  '克拉伦斯角': 'Clarence Point', '格林斯海滩': 'Greens Beach', '獾头': 'Badger Head',
  '花谷': 'Flowery Gully', '霍尔韦尔': 'Holwell', '弗兰克福德': 'Frankford',
  '格伦加里': 'Glengarry', '温克利': 'Winkleigh', '西德茅斯': 'Sidmouth',
  '洛伊拉': 'Loira', '罗比加纳': 'Robigana', '德维奥特': 'Deviot',
  '天鹅角': 'Swan Point', '纸海滩': 'Paper Beach', '黑墙': 'Blackwall',
  '迪尔斯顿': 'Dilston', '温德米尔': 'Windermere', '斯旺尼克': 'Swanwick',
  '月牙': 'Cygnet', '塔鲁纳': 'Taroona', '炮台角': 'Battery Point',
  '桑迪湾': 'Sandy Bay', '北霍巴特': 'North Hobart', '南霍巴特': 'South Hobart',
  '罗斯韦尔斯': 'Rosevears', '美丽点': 'Beauty Point', '勒加纳': 'Legana',
  '埃克塞特': 'Exeter', '乔治镇': 'George Town', '格林德尔瓦尔德': 'Grindelwald',
  '比肯斯菲尔德': 'Beaconsfield', '河畔': 'Riverside', '展望': 'Prospect',
  '主教镇': 'Bishopsbourne', '白色沙滩': 'White Beach', '穆尔杜纳': 'Murduanna',
  '史密斯顿': 'Smithton', '塔斯马泽亚': 'Sheffield', '桌角': 'Wynyard',
  '温耶德': 'Wynyard', '纳拉恩塔普': 'Port Sorell', '埃斯佩兰斯': 'Dover',
  '帕特森': 'Launceston', '查尔斯': 'Launceston', '蓝湖': 'Miena',
  '普罗米斯德': 'Sheffield', 'Promised Land': 'Sheffield',
  // 餐厅/住宿常见英文名中的地名
  'Moonah': 'Moonah', 'Glenorchy': 'Glenorchy', 'Derwent Park': 'Glenorchy',
  'Northgate': 'Glenorchy', 'Battery Point': 'Battery Point', 'Sandy Bay': 'Sandy Bay',
  'New Town': 'North Hobart', 'Cyclo': 'Moonah', 'North Hobart': 'North Hobart',
  'Claremont': 'Glenorchy', 'Eastlands': 'Hobart', 'Hobart': 'Hobart',
  'Campbell Town': 'Campbell Town', 'Bothwell': 'Bothwell', 'Oatlands': 'Oatlands',
  'Ross': 'Ross', 'Perth': 'Perth', 'Longford': 'Longford',
  'Deloraine': 'Deloraine', 'Westbury': 'Westbury', 'Hadspen': 'Hadspen',
  'Cressy': 'Cressy', 'Evandale': 'Evandale', 'Beaconsfield': 'Beaconsfield',
  'Latrobe': 'Latrobe', 'Devonport': 'Devonport', 'Burnie': 'Burnie',
  'Ulverstone': 'Ulverstone', 'Somerset': 'Somerset', 'Wynyard': 'Wynyard',
  'Stanley': 'Stanley', 'Penguin': 'Penguin', 'Sheffield': 'Sheffield',
  'Railton': 'Railton', 'Mole Creek': 'Mole Creek', 'Spreyton': 'Spreyton',
  'Smithton': 'Smithton', 'Strahan': 'Strahan', 'Queenstown': 'Queenstown',
  'Zeehan': 'Zeehan', 'Rosebery': 'Rosebery', 'Tullah': 'Tullah',
  'Waratah': 'Waratah', 'Savage River': 'Savage River', 'Arthur River': 'Arthur River',
  'Marrawah': 'Marrawah', 'Temma': 'Temma', 'Sisters Beach': 'Sisters Beach',
  'Boat Harbour': 'Boat Harbour', 'Port Sorell': 'Port Sorell', 'Hawley Beach': 'Hawley Beach',
  'Turners Beach': 'Turners Beach', 'Forth': 'Forth', 'Leith': 'Leith',
  'Don': 'Don', 'Barrington': 'Barrington', 'Lower Barrington': 'Lower Barrington',
  'Riana': 'Riana', 'Gunns Plains': 'Gunns Plains', 'Nietta': 'Nietta',
  'Preston': 'Preston', 'Castra': 'Castra', 'Liena': 'Liena',
  'Chudleigh': 'Chudleigh', 'Kindred': 'Kindred', 'Paloona': 'Paloona',
  'Sassafras': 'Sassafras', 'Claude Road': 'Claude Road', 'Mersey Forest': 'Mersey Forest',
  'Cradle Mountain': 'Cradle Mountain', 'Moina': 'Moina', 'Wilmot': 'Wilmot',
  'Gowrie Park': 'Gowrie Park', 'Lorinna': 'Lorinna', 'Western Creek': 'Western Creek',
  'Meander': 'Meander', 'Golden Valley': 'Golden Valley', 'Liawenee': 'Liawenee',
  'Miena': 'Miena', 'Bothwell': 'Bothwell', 'Kempton': 'Kempton',
  'Brighton': 'Brighton', 'New Norfolk': 'New Norfolk', 'Hamilton': 'Hamilton',
  'Ouse': 'Ouse', 'Westerway': 'Westerway', 'Maydena': 'Maydena',
  'Mount Field': 'Mount Field', 'Gretna': 'Gretna', 'Sorell': 'Sorell',
  'Dodges Ferry': 'Dodges Ferry', 'Primrose Sands': 'Primrose Sands', 'Dunalley': 'Dunalley',
  'Eaglehawk Neck': 'Eaglehawk Neck', 'Port Arthur': 'Port Arthur', 'Taranna': 'Taranna',
  'Nubeena': 'Nubeena', 'White Beach': 'White Beach', 'Murduanna': 'Murduanna',
  'Tasman Peninsula': 'Tasman Peninsula', 'Richmond': 'Richmond', 'Kingston': 'Kingston',
  'Margate': 'Margate', 'Snug': 'Snug', 'Kettering': 'Kettering',
  'Woodbridge': 'Woodbridge', 'Cygnet': 'Cygnet', 'Franklin': 'Franklin',
  'Geeveston': 'Geeveston', 'Dover': 'Dover', 'Southport': 'Southport',
  'Huonville': 'Huonville', 'Bruny Island': 'Bruny Island', 'Launceston': 'Launceston',
  'Riverside': 'Riverside', 'Prospect': 'Prospect', 'Ravenswood': 'Ravenswood',
  'Youngtown': 'Youngtown', 'Kings Meadows': 'Kings Meadows', 'Norwood': 'Norwood',
  'Punchbowl': 'Punchbowl', 'Relbia': 'Relbia', 'Tamar Valley': 'Tamar Valley',
  'Rosevears': 'Rosevears', 'Legana': 'Legana', 'Exeter': 'Exeter',
  'Grindelwald': 'Grindelwald', 'Beauty Point': 'Beauty Point', 'George Town': 'George Town',
  'Hillwood': 'Hillwood', 'Dilston': 'Dilston', 'Windermere': 'Windermere',
  'Pipers Brook': 'Pipers Brook', 'Lebrina': 'Lebrina', 'Bridport': 'Bridport',
  'Scottsdale': 'Scottsdale', 'Derby': 'Derby', 'Weldborough': 'Weldborough',
  'Kayena': 'Kayena', 'Rowella': 'Rowella', 'Clarence Point': 'Clarence Point',
  'Greens Beach': 'Greens Beach', 'Badger Head': 'Badger Head', 'Flowery Gully': 'Flowery Gully',
  'Holwell': 'Holwell', 'Frankford': 'Frankford', 'Glengarry': 'Glengarry',
  'Winkleigh': 'Winkleigh', 'Sidmouth': 'Sidmouth', 'Loira': 'Loira',
  'Robigana': 'Robigana', 'Deviot': 'Deviot', 'Swan Point': 'Swan Point',
  'Paper Beach': 'Paper Beach', 'Blackwall': 'Blackwall', 'Bicheno': 'Bicheno',
  'Coles Bay': 'Coles Bay', 'Swansea': 'Swansea', 'Freycinet': 'Freycinet',
  'St Marys': 'St Marys', 'Scamander': 'Scamander', 'St Helens': 'St Helens',
  'Stieglitz': 'Stieglitz', 'Dolphin Sands': 'Dolphin Sands', 'Cranbrook': 'Cranbrook',
  'Buckland': 'Buckland', 'Orford': 'Orford', 'Triabunna': 'Triabunna',
  'Swanwick': 'Swanwick', 'Flinders Island': 'Flinders Island', 'Currie': 'Currie',
  'Naracoopa': 'Naracoopa', 'Granville': 'Granville', 'Corinna': 'Corinna',
  'Trial Harbour': 'Trial Harbour', 'Rocky Cape': 'Rocky Cape',
  'Carrick': 'Carrick', 'Bishopsbourne': 'Bishopsbourne',
  'Taroona': 'Taroona', 'South Hobart': 'South Hobart',
  'Bicheno': 'Bicheno', 'Bridport': 'Bridport', 'Scottsdale': 'Scottsdale',
  'Grindelwald': 'Grindelwald', 'Hadspen': 'Hadspen',
  'Freycinet': 'Freycinet', 'Coles Bay': 'Coles Bay',
  'Oatlands': 'Oatlands', 'Somerset': 'Somerset',
  'Cranbrook': 'Cranbrook', 'Buckland': 'Buckland',
  'Stieglitz': 'Stieglitz', 'Campbell Town': 'Campbell Town',
};

function inferTownFromText(text) {
  if (!text) return '';
  const normalized = String(text).trim();
  if (!normalized) return '';

  // Try English town names (longest first)
  for (const entry of sortedTownsByLength) {
    if (new RegExp('\\b' + escapeRegExp(entry.town) + '\\b', 'i').test(normalized)) {
      return entry.town;
    }
  }

  // Try Chinese town names
  for (const [cnName, enTown] of Object.entries(cnTownMap)) {
    if (normalized.includes(cnName)) {
      return enTown;
    }
  }

  // Postcode fallback
  const postcodeMatch = normalized.match(/\bTAS?\s*(\d{4})\b/i) || normalized.match(/\b(\d{4})\b/);
  if (postcodeMatch) {
    const byPostcode = TAS_LOCATION_POSTCODES.find(e => e.postcode === postcodeMatch[1]);
    if (byPostcode) return byPostcode.town;
  }

  return '';
}

function collectTextFields(item) {
  const td = item.tripData || {};
  const featureTexts = Array.isArray(td.features)
    ? td.features.map(row => String(row.desc || row.title || ''))
    : [];
  return [item.title, item.enTitle, item.route, td.route, td.desc, item.region, td.region, ...featureTexts];
}

function collectItemTextJoined(item) {
  return collectTextFields(item)
    .map(raw => String(raw || '').trim()).filter(Boolean).join(' | ');
}

function buildStableItemFingerprint(item, subNavName) {
  const td = item.tripData || {};
  return [
    String(subNavName || '').trim(),
    String(item.title || '').trim(),
    String(item.enTitle || '').trim(),
    String(td.route || item.route || '').trim(),
    String(td.desc || '').trim(),
    String(item.img || '').trim(),
  ]
    .filter(Boolean)
    .join('::')
    .toLowerCase();
}

// ===== FIX DATA =====
const targetSubNavs = ['景点', '餐厅', '住宿'];
let fixCount = 0;
let existingCount = 0;
const fixLog = [];
const skipLog = [];

freeinfo.subNav.forEach(sn => {
  if (!targetSubNavs.includes(sn.subNavName)) return;

  sn.items.forEach((item, idx) => {
    const td = item.tripData;
    if (!td) return;

    let town = td.town;

    // If no town, try to infer
    if (!town) {
      const text = collectItemTextJoined(item);
      town = inferTownFromText(text);
      if (town) {
        td.town = town;
        fixCount++;
        fixLog.push({ subNav: sn.subNavName, title: item.title, town, text: text.substring(0, 60) });
      } else {
        skipLog.push({ subNav: sn.subNavName, title: item.title, text: text.substring(0, 60) });
      }
    }

    // 方案 B：JSON 只持久化 town + postcode
    if (town) {
      if (!td.postcode) {
        const pc = townPostcodeMap.get(town) || '';
        if (pc) td.postcode = pc;
      }
      if (td.locationLabel) {
        delete td.locationLabel;
      }
      existingCount++;
    }
  });
});

console.log('=== Fix Summary ===');
console.log('Items with town (after fix): ' + existingCount);
console.log('Newly fixed: ' + fixCount);
console.log('Still missing: ' + skipLog.length);
console.log('');

console.log('=== Newly Fixed Items ===');
fixLog.forEach(item => {
  console.log('  [' + item.subNav + '] ' + item.title + ' -> ' + item.town);
});

console.log('');
console.log('=== Still Missing (placeholder data, needs manual) ===');
skipLog.forEach((item, i) => {
  if (i < 10) console.log('  [' + item.subNav + '] ' + item.title + ' | ' + item.text);
});
console.log('  ... and ' + (skipLog.length - 10) + ' more');

// Write back to freeinfo.json
fs.writeFileSync(path.join(__dirname, '..', 'src/data/split/freeinfo.json'), JSON.stringify(freeinfo, null, 2), 'utf8');
console.log('');
console.log('freeinfo.json updated!');

// Also sync to data.json (source of truth)
const dataJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src/data/data.json'), 'utf8'));
const dataSection = dataJson.find(s => s.tagName === '自助游/自驾游免费参考信息');
if (dataSection) {
  let dataSynced = 0;
  const dataItemByItemKey = new Map();
  const dataItemByFingerprint = new Map();
  const dataItemByTitle = new Map();
  dataSection.subNav.forEach(ds => {
    ds.items.forEach(dataItem => {
      const itemKey = String(dataItem.itemKey || '').trim();
      if (itemKey) {
        dataItemByItemKey.set(ds.subNavName + '::' + itemKey, dataItem);
      }
      const fingerprint = buildStableItemFingerprint(dataItem, ds.subNavName);
      if (fingerprint && !dataItemByFingerprint.has(fingerprint)) {
        dataItemByFingerprint.set(fingerprint, dataItem);
      }
      const titleKey = ds.subNavName + '::' + String(dataItem.title || '').trim();
      if (!dataItemByTitle.has(titleKey)) {
        dataItemByTitle.set(titleKey, dataItem);
      }
    });
  });
  freeinfo.subNav.forEach(sn => {
    sn.items.forEach(freeItem => {
      const fd = freeItem.tripData || {};
      if (!fd.town) return;
      const itemKey = String(freeItem.itemKey || '').trim();
      const fingerprint = buildStableItemFingerprint(freeItem, sn.subNavName);
      const titleKey = sn.subNavName + '::' + String(freeItem.title || '').trim();
      const dataItem = itemKey
        ? dataItemByItemKey.get(sn.subNavName + '::' + itemKey)
        : (dataItemByFingerprint.get(fingerprint) || dataItemByTitle.get(titleKey));
      if (!dataItem) return;
      if (!dataItem.tripData) dataItem.tripData = {};
      if (!dataItem.tripData.town || dataItem.tripData.town !== fd.town) {
        dataItem.tripData.town = fd.town;
        dataItem.tripData.postcode = fd.postcode || '';
        delete dataItem.tripData.locationLabel;
        dataSynced++;
      }
    });
  });
  fs.writeFileSync(path.join(__dirname, '..', 'src/data/data.json'), JSON.stringify(dataJson, null, 2), 'utf8');
  console.log('data.json synced: ' + dataSynced + ' items');
}

// Also sync fallback file
const fallbackPath = path.join(__dirname, '..', 'src/data/fallback/freeinfo_fallback.json');
if (fs.existsSync(fallbackPath)) {
  fs.writeFileSync(fallbackPath, JSON.stringify(freeinfo, null, 2), 'utf8');
  console.log('freeinfo_fallback.json synced');
}

// Also write the skip log for user reference
fs.writeFileSync('scripts/skip-log.json', JSON.stringify(skipLog, null, 2));
console.log('skip-log.json written for manual review');