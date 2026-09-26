# Dynamic Route Optimizer

## Live Demo
https://dynamic-route-optimizer-71xspr2xj-yugdeepsharma07-pixel.vercel.app
## Haryana Hackathon 2026

### Real-Time Last-Mile Delivery Route Optimization System

---

## 1. Project Overview

Dynamic Route Optimizer is a web-based delivery management and
route optimization system designed for last-mile delivery operations.

The system manages:

- Delivery orders
- Delivery vehicles
- Vehicle capacity
- Delivery priorities
- Delivery time windows
- Traffic changes
- Vehicle breakdowns
- New priority orders
- Route reassignment
- Unassigned/risk orders

The dashboard provides a real-time simulated control center where
delivery conditions can be changed and the routing engine recalculates
routes accordingly.

---

## 2. Problem Statement

Last-mile delivery operations are affected by changing real-world
conditions such as:

- Traffic congestion
- Vehicle breakdowns
- New urgent orders
- Limited vehicle capacity
- Maximum delivery stops
- Customer delivery windows

A static route may become inefficient or invalid when these conditions
change.

This project demonstrates a dynamic routing approach in which routes
are recalculated whenever the delivery situation changes.

---

## 3. Main Features

### Vehicle Fleet Management

The system maintains a fleet of delivery vehicles with:

- Vehicle ID
- Driver name
- Vehicle capacity
- Maximum number of stops
- Current load
- Current location
- Availability status
- Shift ending time

---

### Order Management

Every order contains:

- Order ID
- Customer
- Sector
- Package size
- Priority
- Delivery window
- Automatically assigned location

Users do not need to enter map coordinates manually.

Selecting a sector automatically determines its simulated location.

---

### Dynamic Route Generation

The routing engine evaluates available vehicles for every order.

It considers:

1. Vehicle availability
2. Vehicle capacity
3. Maximum number of stops
4. Delivery time window
5. Driver shift limit
6. Travel distance
7. Travel time
8. Waiting time
9. Order priority

The system then selects a valid vehicle based on the calculated score.

---

## 4. Routing Logic

The routing engine uses a scoring-based approach.

A simplified representation is:

Score =

Travel Distance × 2

+

Travel Time × 0.6

+

Vehicle Workload × 12

+

Waiting Time × 0.1

-

Priority Protection

High-priority orders receive a score reduction so that they receive
preferential treatment during vehicle selection.

Lower scores are preferred by the routing engine.

---

## 5. Delivery Constraints

Before assigning an order, the system checks:

### Vehicle Capacity

The order is rejected for that vehicle if:

Current Load + Package Size > Vehicle Capacity

---

### Maximum Stops

A vehicle cannot receive more orders than its configured maximum
number of stops.

---

### Delivery Window

The vehicle must be able to reach the customer within the customer's
delivery window.

If the calculated delivery time exceeds the delivery deadline,
that vehicle is not considered valid.

---

### Driver Shift

The delivery must finish before the vehicle's configured shift end.

---

## 6. Dynamic Events

The dashboard provides simulated real-world events.

### Vehicle Breakdown

When a vehicle breaks down:

1. Its current assignments are identified.
2. The vehicle becomes unavailable.
3. Its assigned orders are returned to the pool.
4. Available vehicles are evaluated.
5. Routes are rebuilt.
6. Orders that cannot be reassigned remain unassigned.

---

### Traffic Change

The traffic simulation increases travel time for the affected order.

The routing engine then recalculates the routes using the new travel
time.

When traffic returns to normal, routes are recalculated again.

---

### New Priority Order

A new high-priority order can be introduced while the system is running.

The system:

1. Creates the new order.
2. Automatically selects a sector.
3. Assigns HIGH priority.
4. Recalculates routes.
5. Attempts to assign the order.
6. Reports the assignment result in the event log.

---

## 7. Risk / At-Risk Orders

The dashboard contains an "At Risk" indicator.

An order can contribute to the risk count when it cannot currently be
assigned to any available vehicle because one or more routing
constraints cannot be satisfied.

Examples include:

- Insufficient vehicle capacity
- Maximum vehicle stops reached
- Delivery window cannot be satisfied
- Driver shift limitation
- Vehicle unavailable
- No feasible vehicle after a breakdown

Traffic conditions can also contribute to the displayed risk indicator
when congestion is active.

The risk indicator is therefore intended as an operational warning,
not as a prediction of actual delivery failure.

---

## 8. Live Dashboard

The dashboard displays:

- Total vehicles
- Active orders
- High-priority orders
- At-risk conditions
- Simulated delivery map
- Vehicle fleet status
- Current routes
- Order queue
- Event controls
- System event log

---

## 9. Simulated Map

The map represents delivery sectors using simulated coordinates.

The warehouse is located at the center of the map.

Example sectors include:

- Sector 8
- Sector 9
- Sector 10
- Sector 11
- Sector 12
- Sector 14
- Sector 15
- Sector 16
- Sector 17
- Sector 18
- Sector 21

The map is a visualization layer for demonstrating routing behavior.

It does not use live GPS or a real geographical map service.

---

## 10. Order Sorting

The order table can be sorted by:

- Sector
- Priority
- Delivery Deadline
- Delivery Window
- Package Size
- Location / Sector
- Customer
- Vehicle Assignment

Sorting the table does not change the routing engine's priority logic.

The routing engine independently processes orders according to priority
and delivery constraints.

---

## 11. Technology Stack

### Frontend

- HTML5
- CSS3
- JavaScript

### Architecture

The project currently runs entirely in the browser.

No external backend server or database is required for the demo.

---

## 12. Project Structure

```text
Dynamic-Route-Optimizer/
│
├── index.html
│   └── Dashboard structure and UI
│
├── style.css
│   └── Dashboard styling and responsive layout
│
├── script.js
│   └── Routing engine, orders, vehicles, events and map logic
│
└── README.md
    └── Project documentation
