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
    "Naracoopa": { lat: -39.9570, lng: 144.1130 }
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
