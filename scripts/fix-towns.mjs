import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const freeinfo = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src/data/split/freeinfo.json'), 'utf8'));

const TAS_LOCATION_POSTCODES = [
  { label: 'Hobart 7000', town: 'Hobart', postcode: '7000' },
  { label: 'North Hobart 7000', town: 'North Hobart', postcode: '7000' },
  { label: 'South Hobart 7004', town: 'South Hobart', postcode: '7004' },
  { label: 'Battery Point 7004', town: 'Battery Point', postcode: '7004' },
  { label: 'Sandy Bay 7005', town: 'Sandy Bay', postcode: '7005' },
  { label: 'Taroona 7053', town: 'Taroona', postcode: '7053' },
  { label: 'Kingston 7050', town: 'Kingston', postcode: '7050' },
  { label: 'Huonville 7109', town: 'Huonville', postcode: '7109' },
  { label: 'Richmond 7025', town: 'Richmond', postcode: '7025' },
  { label: 'Cygnet 7112', town: 'Cygnet', postcode: '7112' },
  { label: 'Geeveston 7116', town: 'Geeveston', postcode: '7116' },
  { label: 'Bruny Island 7150', town: 'Bruny Island', postcode: '7150' },
  { label: 'Port Arthur 7182', town: 'Port Arthur', postcode: '7182' },
  { label: 'Tasman Peninsula 7182', town: 'Tasman Peninsula', postcode: '7182' },
  { label: 'Launceston 7250', town: 'Launceston', postcode: '7250' },
  { label: 'Tamar Valley 7275', town: 'Tamar Valley', postcode: '7275' },
  { label: 'Rosevears 7277', town: 'Rosevears', postcode: '7277' },
  { label: 'Beauty Point 7262', town: 'Beauty Point', postcode: '7262' },
  { label: 'Legana 7277', town: 'Legana', postcode: '7277' },
  { label: 'Exeter 7275', town: 'Exeter', postcode: '7275' },
  { label: 'George Town 7253', town: 'George Town', postcode: '7253' },
  { label: 'Grindelwald 7277', town: 'Grindelwald', postcode: '7277' },
  { label: 'Beaconsfield 7270', town: 'Beaconsfield', postcode: '7270' },
  { label: 'Deloraine 7304', town: 'Deloraine', postcode: '7304' },
  { label: 'Riverside 7250', town: 'Riverside', postcode: '7250' },
  { label: 'Prospect 7250', town: 'Prospect', postcode: '7250' },
  { label: 'Swansea 7190', town: 'Swansea', postcode: '7190' },
  { label: 'Bicheno 7215', town: 'Bicheno', postcode: '7215' },
  { label: 'Coles Bay 7215', town: 'Coles Bay', postcode: '7215' },
  { label: 'St Helens 7216', town: 'St Helens', postcode: '7216' },
  { label: 'Orford 7190', town: 'Orford', postcode: '7190' },
  { label: 'Scamander 7215', town: 'Scamander', postcode: '7215' },
  { label: 'Freycinet 7215', town: 'Freycinet', postcode: '7215' },
  { label: 'St Marys 7214', town: 'St Marys', postcode: '7214' },
  { label: 'Triabunna 7190', town: 'Triabunna', postcode: '7190' },
  { label: 'Flinders Island 7255', town: 'Flinders Island', postcode: '7255' },
  { label: 'Devonport 7310', town: 'Devonport', postcode: '7310' },
  { label: 'Burnie 7320', town: 'Burnie', postcode: '7320' },
  { label: 'Ulverstone 7315', town: 'Ulverstone', postcode: '7315' },
  { label: 'Wynyard 7325', town: 'Wynyard', postcode: '7325' },
  { label: 'Smithton 7330', town: 'Smithton', postcode: '7330' },
  { label: 'Penguin 7316', town: 'Penguin', postcode: '7316' },
  { label: 'Stanley 7331', town: 'Stanley', postcode: '7331' },
  { label: 'Somerset 7322', town: 'Somerset', postcode: '7322' },
  { label: 'Latrobe 7307', town: 'Latrobe', postcode: '7307' },
  { label: 'Sheffield 7306', town: 'Sheffield', postcode: '7306' },
  { label: 'Railton 7305', town: 'Railton', postcode: '7305' },
  { label: 'Cradle Mountain 7306', town: 'Cradle Mountain', postcode: '7306' },
  { label: 'Moina 7310', town: 'Moina', postcode: '7310' },
  { label: 'Mole Creek 7304', town: 'Mole Creek', postcode: '7304' },
  { label: 'Wilmot 7310', town: 'Wilmot', postcode: '7310' },
  { label: 'Strahan 7468', town: 'Strahan', postcode: '7468' },
  { label: 'Queenstown 7467', town: 'Queenstown', postcode: '7467' },
  { label: 'Zeehan 7469', town: 'Zeehan', postcode: '7469' },
  { label: 'Rosebery 7470', town: 'Rosebery', postcode: '7470' },
  { label: 'Tullah 7321', town: 'Tullah', postcode: '7321' },
  { label: 'Granville 7469', town: 'Granville', postcode: '7469' },
  { label: 'Corinna 7467', town: 'Corinna', postcode: '7467' },
  { label: 'Trial Harbour 7466', town: 'Trial Harbour', postcode: '7466' },
  { label: 'Oatlands 7120', town: 'Oatlands', postcode: '7120' },
  { label: 'Bothwell 7030', town: 'Bothwell', postcode: '7030' },
  { label: 'Ross 7209', town: 'Ross', postcode: '7209' },
  { label: 'Campbell Town 7210', town: 'Campbell Town', postcode: '7210' },
  { label: 'Kempton 7030', town: 'Kempton', postcode: '7030' },
  { label: 'Perth 7300', town: 'Perth', postcode: '7300' },
  { label: 'Longford 7301', town: 'Longford', postcode: '7301' },
  { label: 'Miena 7030', town: 'Miena', postcode: '7030' },
  { label: 'Currie 7256', town: 'Currie', postcode: '7256' },
  { label: 'Naracoopa 7256', town: 'Naracoopa', postcode: '7256' },
  { label: 'Moonah 7009', town: 'Moonah', postcode: '7009' },
  { label: 'Glenorchy 7010', town: 'Glenorchy', postcode: '7010' },
  { label: 'New Norfolk 7140', town: 'New Norfolk', postcode: '7140' },
  { label: 'Sorell 7172', town: 'Sorell', postcode: '7172' },
  { label: 'Brighton 7030', town: 'Brighton', postcode: '7030' },
  { label: 'Westbury 7303', town: 'Westbury', postcode: '7303' },
  { label: 'Evandale 7212', town: 'Evandale', postcode: '7212' },
  { label: 'Hadspen 7290', town: 'Hadspen', postcode: '7290' },
  { label: 'Carrick 7291', town: 'Carrick', postcode: '7291' },
  { label: 'Bishopsbourne 7301', town: 'Bishopsbourne', postcode: '7301' },
  { label: 'Cressy 7302', town: 'Cressy', postcode: '7302' },
  { label: 'Meander 7304', town: 'Meander', postcode: '7304' },
  { label: 'Golden Valley 7304', town: 'Golden Valley', postcode: '7304' },
  { label: 'Hillwood 7252', town: 'Hillwood', postcode: '7252' },
  { label: 'Bridport 7262', town: 'Bridport', postcode: '7262' },
  { label: 'Scottsdale 7260', town: 'Scottsdale', postcode: '7260' },
  { label: 'Derby 7264', town: 'Derby', postcode: '7264' },
  { label: 'Weldborough 7264', town: 'Weldborough', postcode: '7264' },
  { label: 'Stieglitz 7216', town: 'Stieglitz', postcode: '7216' },
  { label: 'Dolphin Sands 7190', town: 'Dolphin Sands', postcode: '7190' },
  { label: 'Cranbrook 7190', town: 'Cranbrook', postcode: '7190' },
  { label: 'Buckland 7190', town: 'Buckland', postcode: '7190' },
  { label: 'Gretna 7140', town: 'Gretna', postcode: '7140' },
  { label: 'Hamilton 7140', town: 'Hamilton', postcode: '7140' },
  { label: 'Ouse 7140', town: 'Ouse', postcode: '7140' },
  { label: 'Westerway 7140', town: 'Westerway', postcode: '7140' },
  { label: 'Maydena 7140', town: 'Maydena', postcode: '7140' },
  { label: 'Mount Field 7140', town: 'Mount Field', postcode: '7140' },
  { label: 'Dover 7117', town: 'Dover', postcode: '7117' },
  { label: 'Southport 7109', town: 'Southport', postcode: '7109' },
  { label: 'Franklin 7113', town: 'Franklin', postcode: '7113' },
  { label: 'Woodbridge 7162', town: 'Woodbridge', postcode: '7162' },
  { label: 'Kettering 7155', town: 'Kettering', postcode: '7155' },
  { label: 'Margate 7054', town: 'Margate', postcode: '7054' },
  { label: 'Snug 7054', town: 'Snug', postcode: '7054' },
  { label: 'Dodges Ferry 7173', town: 'Dodges Ferry', postcode: '7173' },
  { label: 'Primrose Sands 7173', town: 'Primrose Sands', postcode: '7173' },
  { label: 'Dunalley 7177', town: 'Dunalley', postcode: '7177' },
  { label: 'Eaglehawk Neck 7179', town: 'Eaglehawk Neck', postcode: '7179' },
  { label: 'Nubeena 7184', town: 'Nubeena', postcode: '7184' },
  { label: 'White Beach 7184', town: 'White Beach', postcode: '7184' },
  { label: 'Taranna 7180', town: 'Taranna', postcode: '7180' },
  { label: 'Murduanna 7178', town: 'Murduanna', postcode: '7178' },
  { label: 'Liawenee 7030', town: 'Liawenee', postcode: '7030' },
  { label: 'Western Creek 7304', town: 'Western Creek', postcode: '7304' },
  { label: 'Gowrie Park 7306', town: 'Gowrie Park', postcode: '7306' },
  { label: 'Lorinna 7306', town: 'Lorinna', postcode: '7306' },
  { label: 'Waratah 7321', town: 'Waratah', postcode: '7321' },
  { label: 'Savage River 7321', town: 'Savage River', postcode: '7321' },
  { label: 'Temma 7330', town: 'Temma', postcode: '7330' },
  { label: 'Marrawah 7330', town: 'Marrawah', postcode: '7330' },
  { label: 'Arthur River 7330', town: 'Arthur River', postcode: '7330' },
  { label: 'Sisters Beach 7321', town: 'Sisters Beach', postcode: '7321' },
  { label: 'Boat Harbour 7321', town: 'Boat Harbour', postcode: '7321' },
  { label: 'Rocky Cape 7321', town: 'Rocky Cape', postcode: '7321' },
  { label: 'Port Sorell 7307', town: 'Port Sorell', postcode: '7307' },
  { label: 'Hawley Beach 7307', town: 'Hawley Beach', postcode: '7307' },
  { label: 'Turners Beach 7315', town: 'Turners Beach', postcode: '7315' },
  { label: 'Forth 7310', town: 'Forth', postcode: '7310' },
  { label: 'Leith 7315', town: 'Leith', postcode: '7315' },
  { label: 'Don 7310', town: 'Don', postcode: '7310' },
  { label: 'Spreyton 7310', town: 'Spreyton', postcode: '7310' },
  { label: 'Sassafras 7307', town: 'Sassafras', postcode: '7307' },
  { label: 'Kindred 7310', town: 'Kindred', postcode: '7310' },
  { label: 'Paloona 7310', town: 'Paloona', postcode: '7310' },
  { label: 'Barrington 7306', town: 'Barrington', postcode: '7306' },
  { label: 'Lower Barrington 7306', town: 'Lower Barrington', postcode: '7306' },
  { label: 'Claude Road 7306', town: 'Claude Road', postcode: '7306' },
  { label: 'Riana 7316', town: 'Riana', postcode: '7316' },
  { label: 'Gunns Plains 7315', town: 'Gunns Plains', postcode: '7315' },
  { label: 'Nietta 7315', town: 'Nietta', postcode: '7315' },
  { label: 'Preston 7315', town: 'Preston', postcode: '7315' },
  { label: 'Castra 7315', town: 'Castra', postcode: '7315' },
  { label: 'Liena 7304', town: 'Liena', postcode: '7304' },
  { label: 'Chudleigh 7304', town: 'Chudleigh', postcode: '7304' },
  { label: 'Mersey Forest 7304', town: 'Mersey Forest', postcode: '7304' },
  { label: 'Ravenswood 7250', town: 'Ravenswood', postcode: '7250' },
  { label: 'Youngtown 7249', town: 'Youngtown', postcode: '7249' },
  { label: 'Kings Meadows 7249', town: 'Kings Meadows', postcode: '7249' },
  { label: 'Norwood 7250', town: 'Norwood', postcode: '7250' },
  { label: 'Punchbowl 7249', town: 'Punchbowl', postcode: '7249' },
  { label: 'Relbia 7258', town: 'Relbia', postcode: '7258' },
  { label: 'Pipers Brook 7254', town: 'Pipers Brook', postcode: '7254' },
  { label: 'Lebrina 7254', town: 'Lebrina', postcode: '7254' },
  { label: 'Kayena 7270', town: 'Kayena', postcode: '7270' },
  { label: 'Rowella 7270', town: 'Rowella', postcode: '7270' },
  { label: 'Clarence Point 7270', town: 'Clarence Point', postcode: '7270' },
  { label: 'Greens Beach 7270', town: 'Greens Beach', postcode: '7270' },
  { label: 'Badger Head 7270', town: 'Badger Head', postcode: '7270' },
  { label: 'Flowery Gully 7270', town: 'Flowery Gully', postcode: '7270' },
  { label: 'Holwell 7275', town: 'Holwell', postcode: '7275' },
  { label: 'Frankford 7275', town: 'Frankford', postcode: '7275' },
  { label: 'Glengarry 7275', town: 'Glengarry', postcode: '7275' },
  { label: 'Winkleigh 7275', town: 'Winkleigh', postcode: '7275' },
  { label: 'Sidmouth 7270', town: 'Sidmouth', postcode: '7270' },
  { label: 'Loira 7275', town: 'Loira', postcode: '7275' },
  { label: 'Robigana 7275', town: 'Robigana', postcode: '7275' },
  { label: 'Deviot 7275', town: 'Deviot', postcode: '7275' },
  { label: 'Swan Point 7275', town: 'Swan Point', postcode: '7275' },
  { label: 'Paper Beach 7275', town: 'Paper Beach', postcode: '7275' },
  { label: 'Blackwall 7275', town: 'Blackwall', postcode: '7275' },
  { label: 'Dilston 7252', town: 'Dilston', postcode: '7252' },
  { label: 'Windermere 7252', town: 'Windermere', postcode: '7252' },
  { label: 'Swanwick 7190', town: 'Swanwick', postcode: '7190' },
];

// Build lookup maps
const townPostcodeMap = new Map(TAS_LOCATION_POSTCODES.map(e => [e.town, e.postcode]));
const townLabelMap = new Map(TAS_LOCATION_POSTCODES.map(e => [e.town, e.label]));

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

    // Add postcode and locationLabel if missing
    if (town) {
      if (!td.postcode) {
        const pc = townPostcodeMap.get(town) || '';
        if (pc) td.postcode = pc;
      }
      if (!td.locationLabel) {
        const label = townLabelMap.get(town) || '';
        if (label) td.locationLabel = label;
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
  freeinfo.subNav.forEach(sn => {
    sn.items.forEach(freeItem => {
      const fd = freeItem.tripData || {};
      if (!fd.town) return;
      dataSection.subNav.forEach(ds => {
        ds.items.forEach(dataItem => {
          if (dataItem.title === freeItem.title && ds.subNavName === sn.subNavName) {
            if (!dataItem.tripData) dataItem.tripData = {};
            if (!dataItem.tripData.town || dataItem.tripData.town !== fd.town) {
              dataItem.tripData.town = fd.town;
              dataItem.tripData.postcode = fd.postcode || '';
              dataItem.tripData.locationLabel = fd.locationLabel || '';
              dataSynced++;
            }
          }
        });
      });
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