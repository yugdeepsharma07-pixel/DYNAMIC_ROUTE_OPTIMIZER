// ======================================================
// DYNAMIC ROUTE OPTIMIZER
// PS 5 - Last Mile Dynamic Routing
// ======================================================


// ======================================================
// WAREHOUSE
// ======================================================

const WAREHOUSE = {

    x: 50,
    y: 50,

    sector: "Warehouse"

};


// ======================================================
// ROUTING CONSTANTS
// ======================================================

const KM_PER_MAP_UNIT = 0.20;

const AVERAGE_SPEED_KMPH = 30;

const SIMULATION_START = 9 * 60;

const SERVICE_TIME = 15;


// ======================================================
// SECTOR LOCATIONS
// ======================================================

const SECTOR_LOCATIONS = {

    "Sector 8": {
        x: 20,
        y: 20
    },

    "Sector 9": {
        x: 35,
        y: 20
    },

    "Sector 10": {
        x: 50,
        y: 20
    },

    "Sector 11": {
        x: 65,
        y: 20
    },

    "Sector 12": {
        x: 80,
        y: 25
    },

    "Sector 14": {
        x: 25,
        y: 50
    },

    "Sector 15": {
        x: 75,
        y: 50
    },

    "Sector 16": {
        x: 25,
        y: 75
    },

    "Sector 17": {
        x: 50,
        y: 75
    },

    "Sector 18": {
        x: 75,
        y: 80
    },

    "Sector 21": {
        x: 55,
        y: 30
    }

};


// ======================================================
// GET SECTOR LOCATION
// ======================================================

function getSectorLocation(sector) {

    return (
        SECTOR_LOCATIONS[sector] ||
        WAREHOUSE
    );

}


// ======================================================
// INITIAL ORDERS
// ======================================================

const INITIAL_ORDERS = [

    {
        id: "ORD001",

        customer: "Customer A",

        sector: "Sector 8",

        location: {
            ...SECTOR_LOCATIONS["Sector 8"]
        },

        packageSize: 2,

        priority: "High",

        deliveryWindow:
            "10:00 - 12:00",

        windowStart:
            10 * 60,

        windowEnd:
            12 * 60
    },


    {
        id: "ORD002",

        customer: "Customer B",

        sector: "Sector 12",

        location: {
            ...SECTOR_LOCATIONS["Sector 12"]
        },

        packageSize: 3,

        priority: "Medium",

        deliveryWindow:
            "11:00 - 13:00",

        windowStart:
            11 * 60,

        windowEnd:
            13 * 60
    },


    {
        id: "ORD003",

        customer: "Customer C",

        sector: "Sector 16",

        location: {
            ...SECTOR_LOCATIONS["Sector 16"]
        },

        packageSize: 1,

        priority: "Low",

        deliveryWindow:
            "12:00 - 15:00",

        windowStart:
            12 * 60,

        windowEnd:
            15 * 60
    },


    {
        id: "ORD004",

        customer: "Customer D",

        sector: "Sector 18",

        location: {
            ...SECTOR_LOCATIONS["Sector 18"]
        },

        packageSize: 4,

        priority: "High",

        deliveryWindow:
            "10:30 - 12:30",

        windowStart:
            10 * 60 + 30,

        windowEnd:
            12 * 60 + 30
    }

];


// ======================================================
// INITIAL VEHICLES
// ======================================================

const INITIAL_VEHICLES = [

    {
        id: "V001",

        driver: "Rahul",

        capacity: 10,

        maxStops: 4,

        available: true,

        currentLoad: 0,

        currentLocation:
            { ...WAREHOUSE },

        availableAt:
            SIMULATION_START,

        shiftEnd:
            17 * 60
    },


    {
        id: "V002",

        driver: "Amit",

        capacity: 10,

        maxStops: 4,

        available: true,

        currentLoad: 0,

        currentLocation:
            { ...WAREHOUSE },

        availableAt:
            SIMULATION_START,

        shiftEnd:
            17 * 60
    },


    {
        id: "V003",

        driver: "Raj",

        capacity: 8,

        maxStops: 4,

        available: true,

        currentLoad: 0,

        currentLocation:
            { ...WAREHOUSE },

        availableAt:
            SIMULATION_START,

        shiftEnd:
            17 * 60
    }

];


// ======================================================
// ACTIVE STATE
// ======================================================

let orders =
    cloneData(INITIAL_ORDERS);

let vehicles =
    cloneData(INITIAL_VEHICLES);

let currentRoutes = {};

let unassignedOrders = [];

let trafficZone = null;

let eventHistory = [];

let currentOrderSort =
    "default";


// ======================================================
// UTILITIES
// ======================================================

function cloneData(data) {

    return JSON.parse(
        JSON.stringify(data)
    );

}


// ======================================================
// DISTANCE
// ======================================================

function distanceBetween(
    pointA,
    pointB
) {

    const dx =
        pointA.x -
        pointB.x;

    const dy =
        pointA.y -
        pointB.y;

    const mapDistance =
        Math.sqrt(
            dx * dx +
            dy * dy
        );

    return (
        mapDistance *
        KM_PER_MAP_UNIT
    );

}


// ======================================================
// DIRECTION
// ======================================================

function getDirection(
    from,
    to
) {

    const dx =
        to.x -
        from.x;

    const dy =
        to.y -
        from.y;


    if (
        Math.abs(dx) < 1 &&
        Math.abs(dy) < 1
    ) {

        return "Same location";

    }


    const horizontal =
        Math.abs(dx) > 1
            ? (
                dx > 0
                    ? "East"
                    : "West"
            )
            : "";


    const vertical =
        Math.abs(dy) > 1
            ? (
                dy > 0
                    ? "South"
                    : "North"
            )
            : "";


    if (
        horizontal &&
        vertical
    ) {

        return (
            `${vertical}-${horizontal}`
        );

    }


    return (
        horizontal ||
        vertical
    );

}


// ======================================================
// FORMAT TIME
// ======================================================

function formatTime(
    totalMinutes
) {

    const hours =
        Math.floor(
            totalMinutes / 60
        );

    const minutes =
        Math.round(
            totalMinutes % 60
        );


    return (

        String(hours)
            .padStart(2, "0")

        +

        ":" +

        String(minutes)
            .padStart(2, "0")

    );

}


// ======================================================
// CONVERT HTML TIME TO MINUTES
// ======================================================

function timeToMinutes(timeString) {

    if (!timeString) {

        return 0;

    }


    const parts =
        timeString.split(":");


    const hours =
        Number(parts[0]);


    const minutes =
        Number(parts[1]);


    return (
        hours * 60 +
        minutes
    );

}


// ======================================================
// PRIORITY
// ======================================================

function priorityValue(
    priority
) {

    const values = {

        High: 3,

        Medium: 2,

        Low: 1

    };


    return (
        values[priority] ||
        1
    );

}


function priorityClass(
    priority
) {

    return priority.toLowerCase();

}


// ======================================================
// SECTOR NUMBER
// ======================================================

function getSectorNumber(
    sector
) {

    if (
        !sector ||
        sector === "Warehouse"
    ) {

        return 0;

    }


    const match =
        sector.match(/\d+/);


    return match
        ? Number(match[0])
        : 999;

}


// ======================================================
// TRAFFIC
// ======================================================

function getTrafficMultiplier(
    order
) {

    if (
        trafficZone === order.id
    ) {

        return 1.8;

    }


    return 1;

}


function getTrafficText() {

    if (!trafficZone) {

        return "Normal Traffic";

    }


    const affectedOrder =
        orders.find(
            order =>
                order.id ===
                trafficZone
        );


    if (!affectedOrder) {

        return "Normal Traffic";

    }


    return (
        `Congestion near ${affectedOrder.customer}`
    );

}


// ======================================================
// TRAVEL CALCULATION
// ======================================================

function calculateTravel(
    vehicle,
    order
) {

    const distanceKm =
        distanceBetween(
            vehicle.currentLocation,
            order.location
        );


    const direction =
        getDirection(
            vehicle.currentLocation,
            order.location
        );


    const trafficMultiplier =
        getTrafficMultiplier(order);


    const travelMinutes =
        (
            distanceKm /
            AVERAGE_SPEED_KMPH
        ) *
        60 *
        trafficMultiplier;


    const arrivalTime =
        vehicle.availableAt +
        travelMinutes;


    let deliveryStart =
        arrivalTime;


    let waitingMinutes = 0;


    if (
        deliveryStart <
        order.windowStart
    ) {

        waitingMinutes =
            order.windowStart -
            deliveryStart;


        deliveryStart =
            order.windowStart;

    }


    const deliveryFinish =
        deliveryStart +
        SERVICE_TIME;


    return {

        distanceKm,

        direction,

        travelMinutes,

        arrivalTime,

        deliveryStart,

        deliveryFinish,

        waitingMinutes

    };

}


// ======================================================
// VEHICLE EVALUATION
// ======================================================

function evaluateVehicle(
    vehicle,
    order
) {

    if (
        !vehicle.available
    ) {

        return {
            valid: false
        };

    }


    if (
        vehicle.currentLoad +
        order.packageSize >
        vehicle.capacity
    ) {

        return {
            valid: false
        };

    }


    const existingStops =
        currentRoutes[
            vehicle.id
        ]?.length || 0;


    if (
        existingStops >=
        vehicle.maxStops
    ) {

        return {
            valid: false
        };

    }


    const travel =
        calculateTravel(
            vehicle,
            order
        );


    if (
        travel.deliveryStart >
        order.windowEnd
    ) {

        return {
            valid: false
        };

    }


    if (
        travel.deliveryFinish >
        vehicle.shiftEnd
    ) {

        return {
            valid: false
        };

    }


    const workloadRatio =
        vehicle.currentLoad /
        vehicle.capacity;


    let score = 0;


    score +=
        travel.distanceKm *
        2;


    score +=
        travel.travelMinutes *
        0.6;


    score +=
        workloadRatio *
        12;


    score +=
        travel.waitingMinutes *
        0.1;


    if (
        order.priority === "High"
    ) {

        score -= 5;

    }


    if (
        order.priority === "Medium"
    ) {

        score -= 2;

    }


    return {

        valid: true,

        score,

        travel

    };

}


// ======================================================
// FIND BEST VEHICLE
// ======================================================

function findBestVehicle(
    order,
    candidateVehicleIds = null
) {

    let candidateVehicles =
        vehicles;


    if (
        candidateVehicleIds
    ) {

        candidateVehicles =
            vehicles.filter(
                vehicle =>
                    candidateVehicleIds
                        .includes(
                            vehicle.id
                        )
            );

    }


    const evaluated =
        candidateVehicles
            .map(vehicle => {

                const result =
                    evaluateVehicle(
                        vehicle,
                        order
                    );


                return {

                    vehicle,

                    ...result

                };

            })
            .filter(
                result =>
                    result.valid
            );


    if (
        evaluated.length === 0
    ) {

        return null;

    }


    evaluated.sort(
        (a, b) =>
            a.score -
            b.score
    );


    return evaluated[0];

}


// ======================================================
// ASSIGN ORDER
// ======================================================

function assignOrderToVehicle(
    order,
    vehicle
) {

    if (
        !currentRoutes[
            vehicle.id
        ]
    ) {

        currentRoutes[
            vehicle.id
        ] = [];

    }


    const travel =
        calculateTravel(
            vehicle,
            order
        );


    currentRoutes[
        vehicle.id
    ].push(order);


    vehicle.currentLoad +=
        order.packageSize;


    vehicle.currentLocation =
        {
            ...order.location
        };


    vehicle.availableAt =
        travel.deliveryFinish;


    unassignedOrders =
        unassignedOrders.filter(
            item =>
                item.id !==
                order.id
        );


    console.log(
        `📦 ${order.id} → ${vehicle.id}`
    );


    console.log(
        `Sector: ${order.sector}`
    );


    console.log(
        `Distance: ${travel.distanceKm.toFixed(2)} km`
    );


    console.log(
        `Direction: ${travel.direction}`
    );


    console.log(
        `Travel time: ${travel.travelMinutes.toFixed(0)} min`
    );


    console.log(
        `ETA: ${formatTime(
            travel.deliveryStart
        )}`
    );

}


// ======================================================
// RESET VEHICLE
// ======================================================

function resetVehicleState(
    vehicle
) {

    vehicle.currentLoad = 0;


    vehicle.currentLocation =
        {
            ...WAREHOUSE
        };


    vehicle.availableAt =
        SIMULATION_START;

}


// ======================================================
// SORTING
// ======================================================

function sortOrders() {

    const sortSelect =
        document.getElementById(
            "orderSort"
        );


    if (!sortSelect) {

        return;

    }


    currentOrderSort =
        sortSelect.value;


    displayOrders();

}


// ======================================================
// GET SORTED ORDERS
// ======================================================

function getSortedOrders() {

    const sorted =
        [...orders];


    switch (
        currentOrderSort
    ) {


        case "default":

            return sorted.sort(
                (a, b) => {

                    const sectorDifference =
                        getSectorNumber(
                            a.sector
                        ) -
                        getSectorNumber(
                            b.sector
                        );


                    if (
                        sectorDifference !== 0
                    ) {

                        return sectorDifference;

                    }


                    return a.id.localeCompare(
                        b.id
                    );

                }
            );


        case "priority":

            return sorted.sort(
                (a, b) => {

                    const priorityDifference =
                        priorityValue(
                            b.priority
                        ) -
                        priorityValue(
                            a.priority
                        );


                    if (
                        priorityDifference !== 0
                    ) {

                        return priorityDifference;

                    }


                    return (
                        a.windowEnd -
                        b.windowEnd
                    );

                }
            );


        case "deadline":

            return sorted.sort(
                (a, b) =>
                    a.windowEnd -
                    b.windowEnd
            );


        case "window":

            return sorted.sort(
                (a, b) =>
                    a.windowStart -
                    b.windowStart
            );


        case "package":

            return sorted.sort(
                (a, b) => {

                    const difference =
                        b.packageSize -
                        a.packageSize;


                    if (
                        difference !== 0
                    ) {

                        return difference;

                    }


                    return (
                        getSectorNumber(
                            a.sector
                        ) -
                        getSectorNumber(
                            b.sector
                        )
                    );

                }
            );


        case "location":

            return sorted.sort(
                (a, b) => {

                    const sectorDifference =
                        getSectorNumber(
                            a.sector
                        ) -
                        getSectorNumber(
                            b.sector
                        );


                    if (
                        sectorDifference !== 0
                    ) {

                        return sectorDifference;

                    }


                    return a.id.localeCompare(
                        b.id
                    );

                }
            );


        case "customer":

            return sorted.sort(
                (a, b) =>
                    a.customer.localeCompare(
                        b.customer
                    )
            );


        case "assignment":

            return sorted.sort(
                (a, b) => {

                    const vehicleA =
                        getOrderVehicle(
                            a.id
                        );


                    const vehicleB =
                        getOrderVehicle(
                            b.id
                        );


                    if (
                        vehicleA ===
                        "UNASSIGNED" &&
                        vehicleB !==
                        "UNASSIGNED"
                    ) {

                        return -1;

                    }


                    if (
                        vehicleA !==
                        "UNASSIGNED" &&
                        vehicleB ===
                        "UNASSIGNED"
                    ) {

                        return 1;

                    }


                    return vehicleA.localeCompare(
                        vehicleB
                    );

                }
            );


        default:

            return sorted;

    }

}


// ======================================================
// REBUILD ALL ROUTES
// ======================================================

function generateRoutes(
    showEvent = true
) {

    console.log(
        "===================================="
    );


    console.log(
        "🚚 STARTING ROUTE GENERATION"
    );


    console.log(
        "===================================="
    );


    currentRoutes = {};

    unassignedOrders = [];


    vehicles.forEach(
        vehicle => {

            resetVehicleState(
                vehicle
            );


            currentRoutes[
                vehicle.id
            ] = [];

        }
    );


    const sortedOrders =
        [...orders].sort(
            (a, b) => {

                const priorityDifference =
                    priorityValue(
                        b.priority
                    ) -
                    priorityValue(
                        a.priority
                    );


                if (
                    priorityDifference !== 0
                ) {

                    return priorityDifference;

                }


                return (
                    a.windowEnd -
                    b.windowEnd
                );

            }
        );


    sortedOrders.forEach(
        order => {

            const result =
                findBestVehicle(
                    order
                );


            if (!result) {

                unassignedOrders.push(
                    order
                );


                console.warn(
                    `⚠️ ${order.id} could not be assigned`
                );


                return;

            }


            assignOrderToVehicle(
                order,
                result.vehicle
            );

        }
    );


    console.log(
        "✅ ROUTES GENERATED"
    );


    console.table(
        currentRoutes
    );


    updateDashboard();


    if (showEvent) {

        addEvent(
            "Routes recalculated successfully.",
            "success"
        );

    }

}


// ======================================================
// UPDATE DASHBOARD
// ======================================================

function updateDashboard() {

    updateStatistics();

    updateVehicleCards();

    displayRoutes();

    displayOrders();

    renderMap();

    updateTrafficBadge();

    displayEventLog();

}


// ======================================================
// STATISTICS
// ======================================================

function updateStatistics() {

    const highPriority =
        orders.filter(
            order =>
                order.priority ===
                "High"
        ).length;


    const riskCount =
        unassignedOrders.length +
        (
            trafficZone
                ? 1
                : 0
        );


    document.getElementById(
        "vehicleCount"
    ).textContent =
        vehicles.length;


    document.getElementById(
        "orderCount"
    ).textContent =
        orders.length;


    document.getElementById(
        "highPriorityCount"
    ).textContent =
        highPriority;


    document.getElementById(
        "riskCount"
    ).textContent =
        riskCount;

}


// ======================================================
// VEHICLE CARDS
// ======================================================

function updateVehicleCards() {

    const container =
        document.getElementById(
            "vehicleList"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    vehicles.forEach(
        vehicle => {

            const route =
                currentRoutes[
                    vehicle.id
                ] || [];


            const loadPercentage =
                Math.min(
                    100,
                    (
                        vehicle.currentLoad /
                        vehicle.capacity
                    ) *
                    100
                );


            let statusText =
                "ON ROUTE";


            let statusClass =
                "running";


            if (
                !vehicle.available
            ) {

                statusText =
                    "BROKEN DOWN";

                statusClass =
                    "broken";


            } else if (
                route.length === 0
            ) {

                statusText =
                    "AVAILABLE";

                statusClass =
                    "available";

            }


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "vehicle-card";


            card.innerHTML = `

                <div class="vehicle-header">

                    <strong>
                        🚚 ${vehicle.id}
                    </strong>

                    <span class="
                        vehicle-status
                        ${statusClass}
                    ">
                        ${statusText}
                    </span>

                </div>

                <p>
                    Driver: ${vehicle.driver}
                </p>

                <div class="capacity-row">

                    <span>
                        Capacity
                    </span>

                    <strong>
                        ${vehicle.currentLoad}
                        /
                        ${vehicle.capacity}
                    </strong>

                </div>

                <div class="progress-bar">

                    <div
                        style="
                            width: ${loadPercentage}%;
                        ">
                    </div>

                </div>

                <div class="vehicle-meta">

                    <span>
                        ${route.length}
                        stop${route.length !== 1 ? "s" : ""}
                    </span>

                    <span>
                        Limit:
                        ${vehicle.maxStops}
                    </span>

                </div>
            `;


            container.appendChild(
                card
            );

        }
    );

}


// ======================================================
// ROUTE DISPLAY
// ======================================================

function displayRoutes() {

    const routeList =
        document.getElementById(
            "routeList"
        );


    if (!routeList) {

        return;

    }


    routeList.innerHTML = "";


    vehicles.forEach(
        vehicle => {

            const route =
                currentRoutes[
                    vehicle.id
                ] || [];


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "route-card";


            let status =
                "ON ROUTE";


            if (
                !vehicle.available
            ) {

                status =
                    "BROKEN DOWN";


            } else if (
                route.length === 0
            ) {

                status =
                    "AVAILABLE";

            }


            let totalDistance = 0;


            let previousLocation =
                WAREHOUSE;


            route.forEach(
                order => {

                    totalDistance +=
                        distanceBetween(
                            previousLocation,
                            order.location
                        );


                    previousLocation =
                        order.location;

                }
            );


            const statusClass =
                !vehicle.available
                    ? "broken"
                    : route.length === 0
                        ? "available"
                        : "running";


            const totalLoad =
                route.reduce(
                    (sum, order) =>
                        sum +
                        order.packageSize,
                    0
                );


            card.innerHTML = `

                <div class="route-info">

                    <div class="route-title">

                        <strong>
                            🚚 ${vehicle.id}
                        </strong>

                        <span class="
                            vehicle-status
                            ${statusClass}
                        ">
                            ${status}
                        </span>

                    </div>

                    <p>
                        Warehouse
                        ${route.length
                            ? " → " +
                              route
                                .map(
                                    order =>
                                        order.sector
                                )
                                .join(" → ")
                            : " → No orders"}
                    </p>

                    <small>
                        ${totalDistance.toFixed(1)}
                        km planned
                    </small>

                </div>

                <div class="route-load">

                    ${totalLoad}
                    /
                    ${vehicle.capacity}

                </div>
            `;


            routeList.appendChild(
                card
            );

        }
    );


    if (
        unassignedOrders.length > 0
    ) {

        const warning =
            document.createElement(
                "div"
            );


        warning.className =
            "unassigned-warning";


        warning.innerHTML = `

            ⚠️

            ${unassignedOrders.length}

            order(s) could not currently
            be assigned.

        `;


        routeList.appendChild(
            warning
        );

    }

}


// ======================================================
// ORDER VEHICLE
// ======================================================

function getOrderVehicle(
    orderId
) {

    for (
        const [vehicleId, route]
        of Object.entries(
            currentRoutes
        )
    ) {

        if (
            route.some(
                order =>
                    order.id ===
                    orderId
            )
        ) {

            return vehicleId;

        }

    }


    return "UNASSIGNED";

}


// ======================================================
// DISPLAY ORDERS
// ======================================================

function displayOrders() {

    const body =
        document.getElementById(
            "orderTableBody"
        );


    if (!body) {

        return;

    }


    body.innerHTML = "";


    getSortedOrders().forEach(
        order => {

            const vehicleId =
                getOrderVehicle(
                    order.id
                );


            const row =
                document.createElement(
                    "tr"
                );


            const assignmentClass =
                vehicleId ===
                "UNASSIGNED"

                    ? "unassigned-text"

                    : "assigned-text";


            row.innerHTML = `

                <td>

                    <strong>
                        ${order.id}
                    </strong>

                </td>


                <td>
                    ${order.customer}
                </td>


                <td>

                    <span class="
                        sector-badge
                    ">

                        ${order.sector}

                    </span>

                </td>


                <td>

                    <span class="
                        priority
                        ${priorityClass(
                            order.priority
                        )}
                    ">

                        ${order.priority}

                    </span>

                </td>


                <td>
                    ${order.packageSize}
                </td>


                <td>
                    ${order.deliveryWindow}
                </td>


                <td class="${assignmentClass}">
                    ${vehicleId}
                </td>

            `;


            body.appendChild(
                row
            );

        }
    );

}


// ======================================================
// MAP
// ======================================================

function renderMap() {

    const markerContainer =
        document.getElementById(
            "mapMarkers"
        );


    const svg =
        document.getElementById(
            "routeSvg"
        );


    if (
        !markerContainer ||
        !svg
    ) {

        return;

    }


    markerContainer.innerHTML = "";

    svg.innerHTML = "";


    const warehouseMarker =
        createMapMarker(
            WAREHOUSE.x,
            WAREHOUSE.y,
            "🏭",
            "Warehouse",
            "warehouse-marker"
        );


    markerContainer.appendChild(
        warehouseMarker
    );


    orders.forEach(
        order => {

            const marker =
                createMapMarker(
                    order.location.x,
                    order.location.y,
                    "📍",
                    `${order.sector} - ${order.customer}`,
                    "customer-marker"
                );


            marker.dataset.orderId =
                order.id;


            markerContainer.appendChild(
                marker
            );

        }
    );


    vehicles.forEach(
        (
            vehicle,
            vehicleIndex
        ) => {

            const route =
                currentRoutes[
                    vehicle.id
                ] || [];


            if (
                !vehicle.available ||
                route.length === 0
            ) {

                return;

            }


            const points = [

                WAREHOUSE,

                ...route.map(
                    order =>
                        order.location
                )

            ];


            const pointString =
                points
                    .map(
                        point =>
                            `${point.x},${point.y}`
                    )
                    .join(" ");


            const polyline =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "polyline"
                );


            polyline.setAttribute(
                "points",
                pointString
            );


            polyline.classList.add(
                "route-line"
            );


            polyline.classList.add(
                `route-${vehicleIndex}`
            );


            svg.appendChild(
                polyline
            );

        }
    );

}


// ======================================================
// MAP MARKER
// ======================================================

function createMapMarker(
    x,
    y,
    icon,
    label,
    className
) {

    const marker =
        document.createElement(
            "div"
        );


    marker.className =
        `map-marker ${className}`;


    marker.style.left =
        `${x}%`;


    marker.style.top =
        `${y}%`;


    marker.innerHTML = `

        <span class="marker-icon">
            ${icon}
        </span>

        <span class="marker-label">
            ${label}
        </span>

    `;


    return marker;

}


// ======================================================
// VEHICLE BREAKDOWN
// ======================================================

function vehicleBreakdown() {

    const brokenVehicle =
        vehicles.find(
            vehicle =>
                vehicle.id ===
                "V002"
        );


    if (!brokenVehicle) {

        return;

    }


    if (
        !brokenVehicle.available
    ) {

        addEvent(
            "V002 is already broken down.",
            "warning"
        );

        return;

    }


    const affectedOrders =
        [
            ...(currentRoutes[
                brokenVehicle.id
            ] || [])
        ];


    currentRoutes[
        brokenVehicle.id
    ] = [];


    brokenVehicle.available =
        false;


    resetVehicleState(
        brokenVehicle
    );


    affectedOrders.forEach(
        order => {

            if (
                !unassignedOrders.some(
                    item =>
                        item.id ===
                        order.id
                )
            ) {

                unassignedOrders.push(
                    order
                );

            }

        }
    );


    rebuildAvailableRoutes();


    addEvent(

        `🚨 V002 breakdown detected. ${affectedOrders.length} affected order(s) were reassigned using available vehicles.`,

        "danger"

    );


    updateDashboard();

}


// ======================================================
// REBUILD AVAILABLE ROUTES
// ======================================================

function rebuildAvailableRoutes() {

    const ordersToAssign =
        [...orders];


    currentRoutes = {};


    vehicles.forEach(
        vehicle => {

            resetVehicleState(
                vehicle
            );


            currentRoutes[
                vehicle.id
            ] = [];

        }
    );


    unassignedOrders = [];


    const sortedOrders =
        ordersToAssign.sort(
            (a, b) => {

                const priorityDifference =
                    priorityValue(
                        b.priority
                    ) -
                    priorityValue(
                        a.priority
                    );


                if (
                    priorityDifference !== 0
                ) {

                    return priorityDifference;

                }


                return (
                    a.windowEnd -
                    b.windowEnd
                );

            }
        );


    sortedOrders.forEach(
        order => {

            const result =
                findBestVehicle(
                    order
                );


            if (!result) {

                unassignedOrders.push(
                    order
                );

                return;

            }


            assignOrderToVehicle(
                order,
                result.vehicle
            );

        }
    );


    console.log(
        "🔄 Routes rebuilt using available vehicles."
    );


    console.table(
        currentRoutes
    );

}


// ======================================================
// TRAFFIC CHANGE
// ======================================================

function trafficChange() {

    if (!trafficZone) {

        const affectedOrder =
            orders.find(
                order =>
                    order.id ===
                    "ORD002"
            );


        if (!affectedOrder) {

            return;

        }


        trafficZone =
            affectedOrder.id;


        rebuildAvailableRoutes();


        addEvent(
            "🚦 Traffic increased near Customer B. Routes recalculated using the new travel time.",
            "warning"
        );


        updateDashboard();

        return;

    }


    trafficZone = null;


    rebuildAvailableRoutes();


    addEvent(
        "🚦 Traffic returned to normal. Routes recalculated.",
        "success"
    );


    updateDashboard();

}


// ======================================================
// GET NEXT ORDER NUMBER
// ======================================================

function getNextOrderNumber() {

    let highestNumber = 0;


    orders.forEach(
        order => {

            const match =
                order.id.match(
                    /^ORD(\d+)$/
                );


            if (match) {

                highestNumber =
                    Math.max(
                        highestNumber,
                        Number(match[1])
                    );

            }

        }
    );


    return highestNumber + 1;

}


// ======================================================
// MANUAL ADD ORDER
// ======================================================

function handleAddOrder(
    event
) {

    event.preventDefault();


    const customerInput =
        document.getElementById(
            "customerName"
        );


    const sectorInput =
        document.getElementById(
            "orderSector"
        );


    const packageInput =
        document.getElementById(
            "packageSize"
        );


    const priorityInput =
        document.getElementById(
            "orderPriority"
        );


    const startInput =
        document.getElementById(
            "windowStart"
        );


    const endInput =
        document.getElementById(
            "windowEnd"
        );


    const customer =
        customerInput.value.trim();


    const sector =
        sectorInput.value;


    const packageSize =
        Number(
            packageInput.value
        );


    const priority =
        priorityInput.value;


    const startTime =
        startInput.value;


    const endTime =
        endInput.value;


    if (!customer) {

        showFormMessage(
            "Please enter a customer name.",
            "error"
        );

        return;

    }


    if (!sector) {

        showFormMessage(
            "Please select a delivery sector.",
            "error"
        );

        return;

    }


    if (
        !packageSize ||
        packageSize < 1
    ) {

        showFormMessage(
            "Package size must be at least 1.",
            "error"
        );

        return;

    }


    if (
        packageSize > 10
    ) {

        showFormMessage(
            "Package size cannot exceed 10 capacity units.",
            "error"
        );

        return;

    }


    if (!startTime || !endTime) {

        showFormMessage(
            "Please select both delivery window times.",
            "error"
        );

        return;

    }


    const windowStart =
        timeToMinutes(
            startTime
        );


    const windowEnd =
        timeToMinutes(
            endTime
        );


    if (
        windowEnd <=
        windowStart
    ) {

        showFormMessage(
            "Delivery window end time must be later than the start time.",
            "error"
        );

        return;

    }


    const orderNumber =
        getNextOrderNumber();


    const newOrderData = {

        id:
            `ORD${String(
                orderNumber
            ).padStart(
                3,
                "0"
            )}`,

        customer,

        sector,

        location:
            {
                ...getSectorLocation(
                    sector
                )
            },

        packageSize,

        priority,

        deliveryWindow:
            `${startTime} - ${endTime}`,

        windowStart,

        windowEnd

    };


    orders.push(
        newOrderData
    );


    console.log(
        "📦 MANUAL ORDER ADDED:",
        newOrderData
    );


    rebuildAvailableRoutes();


    const assignedVehicle =
        getOrderVehicle(
            newOrderData.id
        );


    if (
        assignedVehicle ===
        "UNASSIGNED"
    ) {

        addEvent(

            `📦 ${newOrderData.id} for ${customer} was added in ${sector}, but no vehicle can currently satisfy its constraints.`,

            "danger"

        );


        showFormMessage(

            `${newOrderData.id} added, but it is currently unassigned.`,

            "error"

        );

    } else {

        addEvent(

            `📦 ${newOrderData.id} for ${customer} was added in ${sector} and assigned to ${assignedVehicle}.`,

            "success"

        );


        showFormMessage(

            `${newOrderData.id} added successfully and assigned to ${assignedVehicle}.`,

            "success"

        );

    }


    updateDashboard();


    clearFormFields();

}


// ======================================================
// SHOW FORM MESSAGE
// ======================================================

function showFormMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "formMessage"
        );


    if (!element) {

        return;

    }


    element.textContent =
        message;


    element.className =
        `form-message ${type}`;


    clearTimeout(
        window.formMessageTimer
    );


    window.formMessageTimer =
        setTimeout(
            () => {

                element.textContent =
                    "";

                element.className =
                    "form-message";

            },
            5000
        );

}


// ======================================================
// CLEAR FORM FIELDS
// ======================================================

function clearFormFields() {

    const customer =
        document.getElementById(
            "customerName"
        );


    const sector =
        document.getElementById(
            "orderSector"
        );


    const packageSize =
        document.getElementById(
            "packageSize"
        );


    const priority =
        document.getElementById(
            "orderPriority"
        );


    const start =
        document.getElementById(
            "windowStart"
        );


    const end =
        document.getElementById(
            "windowEnd"
        );


    if (customer) {

        customer.value = "";

    }


    if (sector) {

        sector.value = "";

    }


    if (packageSize) {

        packageSize.value = "2";

    }


    if (priority) {

        priority.value = "Medium";

    }


    if (start) {

        start.value = "10:00";

    }


    if (end) {

        end.value = "12:00";

    }

}


// ======================================================
// CLEAR ORDER FORM
// ======================================================

function clearOrderForm() {

    clearFormFields();


    const message =
        document.getElementById(
            "formMessage"
        );


    if (message) {

        message.textContent =
            "";

        message.className =
            "form-message";

    }

}


// ======================================================
// AUTOMATIC NEW PRIORITY ORDER
// ======================================================

function newOrder() {

    const nextNumber =
        getNextOrderNumber();


    const customerLetter =
        String.fromCharCode(
            64 +
            nextNumber
        );


    const availableSectors =
        Object.keys(
            SECTOR_LOCATIONS
        );


    const sector =
        availableSectors[
            (nextNumber - 1) %
            availableSectors.length
        ];


    const newOrderData = {

        id:
            `ORD${String(
                nextNumber
            ).padStart(
                3,
                "0"
            )}`,

        customer:
            `Customer ${customerLetter}`,

        sector,

        location:
            {
                ...getSectorLocation(
                    sector
                )
            },

        packageSize: 2,

        priority:
            "High",

        deliveryWindow:
            "09:30 - 10:30",

        windowStart:
            9 * 60 + 30,

        windowEnd:
            10 * 60 + 30

    };


    orders.push(
        newOrderData
    );


    console.log(
        "📦 NEW PRIORITY ORDER:",
        newOrderData
    );


    rebuildAvailableRoutes();


    const assignedVehicle =
        getOrderVehicle(
            newOrderData.id
        );


    if (
        assignedVehicle ===
        "UNASSIGNED"
    ) {

        addEvent(

            `📦 ${newOrderData.id} arrived as HIGH priority in ${newOrderData.sector}, but no vehicle can currently satisfy its constraints.`,

            "danger"

        );

    } else {

        addEvent(

            `📦 ${newOrderData.id} arrived as HIGH priority in ${newOrderData.sector} and was assigned to ${assignedVehicle}.`,

            "success"

        );

    }


    updateDashboard();

}


// ======================================================
// EVENT LOG
// ======================================================

function addEvent(
    message,
    type = "info"
) {

    eventHistory.unshift({

        message,

        type,

        time:
            new Date()
                .toLocaleTimeString(
                    [],
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                )

    });


    eventHistory =
        eventHistory.slice(
            0,
            8
        );


    displayEventLog();

}


function displayEventLog() {

    const container =
        document.getElementById(
            "eventLog"
        );


    if (!container) {

        return;

    }


    if (
        !eventHistory.length
    ) {

        container.innerHTML = `

            <div class="empty-event">

                No events yet.

            </div>

        `;


        return;

    }


    container.innerHTML = "";


    eventHistory.forEach(
        event => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                `event-item ${event.type}`;


            item.innerHTML = `

                <span class="event-time">

                    ${event.time}

                </span>


                <span class="event-message">

                    ${event.message}

                </span>

            `;


            container.appendChild(
                item
            );

        }
    );

}


// ======================================================
// TRAFFIC BADGE
// ======================================================

function updateTrafficBadge() {

    const badge =
        document.getElementById(
            "trafficBadge"
        );


    if (!badge) {

        return;

    }


    if (!trafficZone) {

        badge.textContent =
            "Normal Traffic";


        badge.className =
            "badge normal";


        return;

    }


    badge.textContent =
        getTrafficText();


    badge.className =
        "badge traffic";

}


// ======================================================
// RESET
// ======================================================

function resetSimulation() {

    orders =
        cloneData(
            INITIAL_ORDERS
        );


    vehicles =
        cloneData(
            INITIAL_VEHICLES
        );


    currentRoutes = {};

    unassignedOrders = [];

    trafficZone = null;

    eventHistory = [];


    currentOrderSort =
        "default";


    const sortSelect =
        document.getElementById(
            "orderSort"
        );


    if (sortSelect) {

        sortSelect.value =
            "default";

    }


    clearOrderForm();


    generateRoutes(
        false
    );


    addEvent(
        "Simulation reset. All vehicles and orders restored.",
        "success"
    );


    updateDashboard();

}


// ======================================================
// FORM INITIALIZATION
// ======================================================

function initializeAddOrderForm() {

    const form =
        document.getElementById(
            "addOrderForm"
        );


    if (!form) {

        return;

    }


    form.addEventListener(
        "submit",
        handleAddOrder
    );

}


// ======================================================
// STARTUP
// ======================================================

console.log(
    "🚚 Dynamic Route Optimizer loaded."
);


initializeAddOrderForm();


generateRoutes(
    false
);