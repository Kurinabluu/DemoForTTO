const TOWN_COORDINATES = {
    "Hobart": { lat: -42.8821, lng: 147.3272 },
    "North Hobart": { lat: -42.8736, lng: 147.3145 },
    "Battery Point": { lat: -42.8889, lng: 147.3328 },
    "South Hobart": { lat: -42.8888, lng: 147.3107 },
    "Sandy Bay": { lat: -42.8968, lng: 147.3271 },
    "Derwent Park": { lat: -42.8333, lng: 147.3 },
    "Moonah": { lat: -42.85, lng: 147.2833 },
    "Glenorchy": { lat: -42.8333, lng: 147.2833 },
    "Berriedale": { lat: -42.8167, lng: 147.25 },
    "Richmond": { lat: -42.7353, lng: 147.4386 },
    "Bothwell": { lat: -42.386, lng: 147.008 },
    "Brighton": { lat: -42.7, lng: 147.25 },
    "Kempton": { lat: -42.532, lng: 147.204 },
    "Liawenee": { lat: -41.9, lng: 146.6667 },
    "Miena": { lat: -41.986, lng: 146.759 },
    "Kingston": { lat: -42.9765, lng: 147.3085 },
    "Taroona": { lat: -42.9433, lng: 147.3444 },
    "Fern Tree": { lat: -42.9167, lng: 147.2667 },
    "Margate": { lat: -43.0333, lng: 147.2667 },
    "Snug": { lat: -43.0667, lng: 147.25 },
    "Grove": { lat: -43, lng: 147.0833 },
    "Huonville": { lat: -43.0317, lng: 147.0485 },
    "Southport": { lat: -43.4333, lng: 146.9667 },
    "Cygnet": { lat: -43.1544, lng: 147.0825 },
    "Franklin": { lat: -43.0833, lng: 147.0167 },
    "Geeveston": { lat: -43.1635, lng: 146.926 },
    "Dover": { lat: -43.3167, lng: 147.0167 },
    "Oatlands": { lat: -42.303, lng: 147.368 },
    "Hamilton": { lat: -42.55, lng: 146.8333 },
    "Maydena": { lat: -42.75, lng: 146.6167 },
    "Mount Field": { lat: -42.6833, lng: 146.7833 },
    "New Norfolk": { lat: -42.7833, lng: 147.0667 },
    "Ouse": { lat: -42.4833, lng: 146.7167 },
    "Westerway": { lat: -42.6833, lng: 146.7833 },
    "Bruny Island": { lat: -43.3518, lng: 147.3627 },
    "Kettering": { lat: -43.1167, lng: 147.2667 },
    "Woodbridge": { lat: -43.15, lng: 147.2333 },
    "Cambridge": { lat: -42.8333, lng: 147.45 },
    "Sorell": { lat: -42.7833, lng: 147.5667 },
    "Dodges Ferry": { lat: -42.85, lng: 147.6167 },
    "Primrose Sands": { lat: -42.8833, lng: 147.6667 },
    "Dunalley": { lat: -42.8833, lng: 147.8 },
    "Murduanna": { lat: -42.9333, lng: 147.8667 },
    "Eaglehawk Neck": { lat: -43.0167, lng: 147.9167 },
    "Taranna": { lat: -43.05, lng: 147.8833 },
    "Port Arthur": { lat: -43.1478, lng: 147.8465 },
    "Tasman Peninsula": { lat: -43.0593, lng: 147.9271 },
    "Nubeena": { lat: -43.1, lng: 147.75 },
    "White Beach": { lat: -43.1167, lng: 147.7167 },
    "Buckland": { lat: -42.55, lng: 147.75 },
    "Cranbrook": { lat: -42, lng: 148.0667 },
    "Dolphin Sands": { lat: -42.0833, lng: 148.1667 },
    "Orford": { lat: -42.554, lng: 147.873 },
    "Swansea": { lat: -42.121, lng: 148.077 },
    "Triabunna": { lat: -42.507, lng: 147.904 },
    "Ross": { lat: -42.033, lng: 147.5 },
    "Campbell Town": { lat: -41.931, lng: 147.5 },
    "Evandale": { lat: -41.5667, lng: 147.25 },
    "St Marys": { lat: -41.5826, lng: 148.1926 },
    "Bicheno": { lat: -41.878, lng: 148.298 },
    "Coles Bay": { lat: -42.1246, lng: 148.2836 },
    "Freycinet": { lat: -42.177, lng: 148.298 },
    "Scamander": { lat: -41.4603, lng: 148.2606 },
    "St Helens": { lat: -41.3226, lng: 148.2406 },
    "Launceston": { lat: -41.4367, lng: 147.1387 },
    "Prospect": { lat: -41.466, lng: 147.126 },
    "Riverside": { lat: -41.415, lng: 147.111 },
    "West Launceston": { lat: -41.45, lng: 147.1167 },
    "Hillwood": { lat: -41.2333, lng: 147 },
    "Windermere": { lat: -41.2667, lng: 147 },
    "George Town": { lat: -41.1044, lng: 146.8264 },
    "Low Head": { lat: -41.0667, lng: 146.8 },
    "Lebrina": { lat: -41.1833, lng: 147.2167 },
    "Flinders Island": { lat: -40.024, lng: 148.044 },
    "Currie": { lat: -39.93, lng: 143.853 },
    "Naracoopa": { lat: -39.957, lng: 144.113 },
    "Scottsdale": { lat: -41.15, lng: 147.5167 },
    "Beauty Point": { lat: -41.161, lng: 146.821 },
    "Bridport": { lat: -40.9833, lng: 147.3833 },
    "Derby": { lat: -41.15, lng: 147.8167 },
    "Weldborough": { lat: -41.2, lng: 147.9 },
    "Beaconsfield": { lat: -41.2035, lng: 146.8225 },
    "Exeter": { lat: -41.295, lng: 146.957 },
    "Tamar Valley": { lat: -41.32, lng: 146.953 },
    "Grindelwald": { lat: -41.407, lng: 147.0287 },
    "Legana": { lat: -41.3745, lng: 147.068 },
    "Rosevears": { lat: -41.3725, lng: 147.0745 },
    "Hadspen": { lat: -41.5, lng: 147.0667 },
    "Carrick": { lat: -41.5333, lng: 147.0167 },
    "Perth": { lat: -41.573, lng: 147.172 },
    "Bishopsbourne": { lat: -41.5833, lng: 147.0667 },
    "Longford": { lat: -41.612, lng: 147.126 },
    "Cressy": { lat: -41.6833, lng: 147.0833 },
    "Westbury": { lat: -41.5333, lng: 146.8333 },
    "Chudleigh": { lat: -41.55, lng: 146.4667 },
    "Deloraine": { lat: -41.5272, lng: 146.6573 },
    "Elizabeth Town": { lat: -41.4667, lng: 146.5667 },
    "Golden Valley": { lat: -41.6167, lng: 146.7333 },
    "Meander": { lat: -41.65, lng: 146.6167 },
    "Mole Creek": { lat: -41.553, lng: 146.398 },
    "Red Hills": { lat: -41.4667, lng: 146.5667 },
    "Western Creek": { lat: -41.6167, lng: 146.5 },
    "Railton": { lat: -41.346, lng: 146.4198 },
    "Cradle Mountain": { lat: -41.6237, lng: 145.9443 },
    "Gowrie Park": { lat: -41.4667, lng: 146.2167 },
    "Lorinna": { lat: -41.55, lng: 146.3833 },
    "Sheffield": { lat: -41.396, lng: 146.3345 },
    "Hawley Beach": { lat: -41.15, lng: 146.5333 },
    "Latrobe": { lat: -41.2315, lng: 146.4199 },
    "Port Sorell": { lat: -41.1667, lng: 146.55 },
    "Devonport": { lat: -41.1769, lng: 146.3525 },
    "Don": { lat: -41.1833, lng: 146.3167 },
    "Moina": { lat: -41.557, lng: 146.018 },
    "Quoiba": { lat: -41.2, lng: 146.3333 },
    "Spreyton": { lat: -41.2333, lng: 146.35 },
    "Wilmot": { lat: -41.39, lng: 146.17 },
    "Turners Beach": { lat: -41.1667, lng: 146.2333 },
    "Ulverstone": { lat: -41.1586, lng: 146.1815 },
    "Penguin": { lat: -41.122, lng: 146.071 },
    "Burnie": { lat: -41.0527, lng: 145.9058 },
    "South Burnie": { lat: -41.0667, lng: 145.9167 },
    "Boat Harbour": { lat: -40.9333, lng: 145.6167 },
    "Rocky Cape": { lat: -40.9167, lng: 145.5 },
    "Savage River": { lat: -41.45, lng: 145.4 },
    "Sisters Beach": { lat: -40.9167, lng: 145.55 },
    "Tullah": { lat: -41.726, lng: 145.641 },
    "Waratah": { lat: -41.44, lng: 145.52 },
    "Somerset": { lat: -41.041, lng: 145.825 },
    "Wynyard": { lat: -40.999, lng: 145.727 },
    "Arthur River": { lat: -41.05, lng: 144.6833 },
    "Marrawah": { lat: -40.9167, lng: 144.7 },
    "Smithton": { lat: -40.8465, lng: 145.1248 },
    "Temma": { lat: -41.0333, lng: 144.6833 },
    "Stanley": { lat: -40.7617, lng: 145.2953 },
    "Trial Harbour": { lat: -41.919, lng: 145.166 },
    "Corinna": { lat: -41.65, lng: 145.08 },
    "Queenstown": { lat: -42.0803, lng: 145.5564 },
    "Strahan": { lat: -42.152, lng: 145.33 },
    "Granville": { lat: -41.913, lng: 145.444 },
    "Zeehan": { lat: -41.882, lng: 145.344 },
    "Rosebery": { lat: -41.773, lng: 145.533 }
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
