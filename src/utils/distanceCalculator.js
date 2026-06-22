const TOWN_COORDINATES = {
    "Hobart": { lat: -42.8821, lng: 147.3272 },
    "Kingston": { lat: -42.9765, lng: 147.3085 },
    "Huonville": { lat: -43.0317, lng: 147.0485 },
    "Richmond": { lat: -42.7353, lng: 147.4386 },
    "Cygnet": { lat: -43.1544, lng: 147.0825 },
    "Geeveston": { lat: -43.1635, lng: 146.9260 },
    "Bruny Island": { lat: -43.3518, lng: 147.3627 },
    "South Hobart": { lat: -42.8888, lng: 147.3107 },
    "Sandy Bay": { lat: -42.8968, lng: 147.3271 },
    "Battery Point": { lat: -42.8889, lng: 147.3328 },
    "North Hobart": { lat: -42.8736, lng: 147.3145 },
    "Taroona": { lat: -42.9433, lng: 147.3444 },
    "Port Arthur": { lat: -43.1478, lng: 147.8465 },
    "Tasman Peninsula": { lat: -43.0593, lng: 147.9271 },
    "Launceston": { lat: -41.4367, lng: 147.1387 },
    "Tamar Valley": { lat: -41.3200, lng: 146.9530 },
    "Rosevears": { lat: -41.3725, lng: 147.0745 },
    "Beauty Point": { lat: -41.1610, lng: 146.8210 },
    "Legana": { lat: -41.3745, lng: 147.0680 },
    "Exeter": { lat: -41.2950, lng: 146.9570 },
    "George Town": { lat: -41.1044, lng: 146.8264 },
    "Grindelwald": { lat: -41.4070, lng: 147.0287 },
    "Beaconsfield": { lat: -41.2035, lng: 146.8225 },
    "Deloraine": { lat: -41.5272, lng: 146.6573 },
    "Riverside": { lat: -41.4150, lng: 147.1110 },
    "Prospect": { lat: -41.4660, lng: 147.1260 },
    "Swansea": { lat: -42.1210, lng: 148.0770 },
    "Bicheno": { lat: -41.8780, lng: 148.2980 },
    "Coles Bay": { lat: -42.1246, lng: 148.2836 },
    "St Helens": { lat: -41.3226, lng: 148.2406 },
    "Orford": { lat: -42.5540, lng: 147.8730 },
    "Scamander": { lat: -41.4603, lng: 148.2606 },
    "Freycinet": { lat: -42.1770, lng: 148.2980 },
    "St Marys": { lat: -41.5826, lng: 148.1926 },
    "Triabunna": { lat: -42.5070, lng: 147.9040 },
    "Flinders Island": { lat: -40.0240, lng: 148.0440 },
    "Devonport": { lat: -41.1769, lng: 146.3525 },
    "Burnie": { lat: -41.0527, lng: 145.9058 },
    "Ulverstone": { lat: -41.1586, lng: 146.1815 },
    "Wynyard": { lat: -40.9990, lng: 145.7270 },
    "Smithton": { lat: -40.8465, lng: 145.1248 },
    "Penguin": { lat: -41.1220, lng: 146.0710 },
    "Stanley": { lat: -40.7617, lng: 145.2953 },
    "Somerset": { lat: -41.0410, lng: 145.8250 },
    "Latrobe": { lat: -41.2315, lng: 146.4199 },
    "Sheffield": { lat: -41.3960, lng: 146.3345 },
    "Railton": { lat: -41.3460, lng: 146.4198 },
    "Cradle Mountain": { lat: -41.6237, lng: 145.9443 },
    "Moina": { lat: -41.5570, lng: 146.0180 },
    "Mole Creek": { lat: -41.5530, lng: 146.3980 },
    "Wilmot": { lat: -41.3900, lng: 146.1700 },
    "Strahan": { lat: -42.1520, lng: 145.3300 },
    "Queenstown": { lat: -42.0803, lng: 145.5564 },
    "Zeehan": { lat: -41.8820, lng: 145.3440 },
    "Rosebery": { lat: -41.7730, lng: 145.5330 },
    "Tullah": { lat: -41.7260, lng: 145.6410 },
    "Granville": { lat: -41.9130, lng: 145.4440 },
    "Corinna": { lat: -41.6500, lng: 145.0800 },
    "Trial Harbour": { lat: -41.9190, lng: 145.1660 },
    "Oatlands": { lat: -42.3030, lng: 147.3680 },
    "Bothwell": { lat: -42.3860, lng: 147.0080 },
    "Ross": { lat: -42.0330, lng: 147.5000 },
    "Campbell Town": { lat: -41.9310, lng: 147.5000 },
    "Kempton": { lat: -42.5320, lng: 147.2040 },
    "Perth": { lat: -41.5730, lng: 147.1720 },
    "Longford": { lat: -41.6120, lng: 147.1260 },
    "Miena": { lat: -41.9860, lng: 146.7590 },
    "Currie": { lat: -39.9300, lng: 143.8530 },
    "Naracoopa": { lat: -39.9570, lng: 144.1130 },
    // === 新增地点 ===
    "Moonah": { lat: -42.8500, lng: 147.2833 },
    "Glenorchy": { lat: -42.8333, lng: 147.2833 },
    "Berriedale": { lat: -42.8167, lng: 147.2500 },
    "Derwent Park": { lat: -42.8333, lng: 147.3000 },
    "Fern Tree": { lat: -42.9167, lng: 147.2667 },
    "New Norfolk": { lat: -42.7833, lng: 147.0667 },
    "Sorell": { lat: -42.7833, lng: 147.5667 },
    "Brighton": { lat: -42.7000, lng: 147.2500 },
    "Cambridge": { lat: -42.8333, lng: 147.4500 },
    "Westbury": { lat: -41.5333, lng: 146.8333 },
    "Evandale": { lat: -41.5667, lng: 147.2500 },
    "Hadspen": { lat: -41.5000, lng: 147.0667 },
    "Carrick": { lat: -41.5333, lng: 147.0167 },
    "Bishopsbourne": { lat: -41.5833, lng: 147.0667 },
    "Cressy": { lat: -41.6833, lng: 147.0833 },
    "Meander": { lat: -41.6500, lng: 146.6167 },
    "Golden Valley": { lat: -41.6167, lng: 146.7333 },
    "Elizabeth Town": { lat: -41.4667, lng: 146.5667 },
    "Red Hills": { lat: -41.4667, lng: 146.5667 },
    "Chudleigh": { lat: -41.5500, lng: 146.4667 },
    "Western Creek": { lat: -41.6167, lng: 146.5000 },
    "Hillwood": { lat: -41.2333, lng: 147.0000 },
    "Windermere": { lat: -41.2667, lng: 147.0000 },
    "Bridport": { lat: -40.9833, lng: 147.3833 },
    "Scottsdale": { lat: -41.1500, lng: 147.5167 },
    "Derby": { lat: -41.1500, lng: 147.8167 },
    "Weldborough": { lat: -41.2000, lng: 147.9000 },
    "Lebrina": { lat: -41.1833, lng: 147.2167 },
    "Low Head": { lat: -41.0667, lng: 146.8000 },
    "West Launceston": { lat: -41.4500, lng: 147.1167 },
    "Dolphin Sands": { lat: -42.0833, lng: 148.1667 },
    "Cranbrook": { lat: -42.0000, lng: 148.0667 },
    "Buckland": { lat: -42.5500, lng: 147.7500 },
    "Hamilton": { lat: -42.5500, lng: 146.8333 },
    "Ouse": { lat: -42.4833, lng: 146.7167 },
    "Westerway": { lat: -42.6833, lng: 146.7833 },
    "Maydena": { lat: -42.7500, lng: 146.6167 },
    "Mount Field": { lat: -42.6833, lng: 146.7833 },
    "Dover": { lat: -43.3167, lng: 147.0167 },
    "Southport": { lat: -43.4333, lng: 146.9667 },
    "Franklin": { lat: -43.0833, lng: 147.0167 },
    "Grove": { lat: -43.0000, lng: 147.0833 },
    "Woodbridge": { lat: -43.1500, lng: 147.2333 },
    "Kettering": { lat: -43.1167, lng: 147.2667 },
    "Margate": { lat: -43.0333, lng: 147.2667 },
    "Snug": { lat: -43.0667, lng: 147.2500 },
    "Dodges Ferry": { lat: -42.8500, lng: 147.6167 },
    "Primrose Sands": { lat: -42.8833, lng: 147.6667 },
    "Dunalley": { lat: -42.8833, lng: 147.8000 },
    "Eaglehawk Neck": { lat: -43.0167, lng: 147.9167 },
    "Nubeena": { lat: -43.1000, lng: 147.7500 },
    "White Beach": { lat: -43.1167, lng: 147.7167 },
    "Taranna": { lat: -43.0500, lng: 147.8833 },
    "Murduanna": { lat: -42.9333, lng: 147.8667 },
    "Liawenee": { lat: -41.9000, lng: 146.6667 },
    "Gowrie Park": { lat: -41.4667, lng: 146.2167 },
    "Lorinna": { lat: -41.5500, lng: 146.3833 },
    "Waratah": { lat: -41.4400, lng: 145.5200 },
    "Savage River": { lat: -41.4500, lng: 145.4000 },
    "Temma": { lat: -41.0333, lng: 144.6833 },
    "Marrawah": { lat: -40.9167, lng: 144.7000 },
    "Arthur River": { lat: -41.0500, lng: 144.6833 },
    "Sisters Beach": { lat: -40.9167, lng: 145.5500 },
    "Boat Harbour": { lat: -40.9333, lng: 145.6167 },
    "Rocky Cape": { lat: -40.9167, lng: 145.5000 },
    "Port Sorell": { lat: -41.1667, lng: 146.5500 },
    "Hawley Beach": { lat: -41.1500, lng: 146.5333 },
    "Turners Beach": { lat: -41.1667, lng: 146.2333 },
    "Spreyton": { lat: -41.2333, lng: 146.3500 },
    "Don": { lat: -41.1833, lng: 146.3167 },
    "Quoiba": { lat: -41.2000, lng: 146.3333 },
    "South Burnie": { lat: -41.0667, lng: 145.9167 },
}

const EARTH_RADIUS_KM = 6371

function degToRad(deg) {
    return deg * Math.PI / 180
}

export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const dLat = degToRad(lat2 - lat1)
    const dLon = degToRad(lon2 - lon1)

    const lat1Rad = degToRad(lat1)
    const lat2Rad = degToRad(lat2)

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)

    const c = 2 * Math.asin(Math.sqrt(a))

    return EARTH_RADIUS_KM * c
}

export function getTownCoordinates(townName) {
    if (!townName) return null
    return TOWN_COORDINATES[townName] || null
}

export function getDistanceBetweenTowns(town1, town2) {
    const coord1 = getTownCoordinates(town1)
    const coord2 = getTownCoordinates(town2)

    if (!coord1 || !coord2) {
        return null
    }

    return calculateHaversineDistance(
        coord1.lat, coord1.lng,
        coord2.lat, coord2.lng
    )
}

export function getDistanceFromTownToLocation(townName, targetLat, targetLng) {
    const coord = getTownCoordinates(townName)

    if (!coord) {
        return null
    }

    return calculateHaversineDistance(
        coord.lat, coord.lng,
        targetLat, targetLng
    )
}

export { TOWN_COORDINATES }
