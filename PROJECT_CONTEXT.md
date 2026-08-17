# Star Citizen Rental App

## Purpose

Allow Star Citizen players to rent ships, crews, and services from other players.

The goal is to make finding available assets quick and easy while allowing owners to configure and monetize their fleets.

---

## Design Philosophy

Focus on speed and usability.

Users should be able to:

1. Find a ship quickly.
2. Compare options easily.
3. Generate rental requests with minimal clicks.

Avoid unnecessary complexity.

---

## Primary User Types

### Renter

Searching for:

- Ships
- Crew
- Materials

Primary concerns:

- Price
- Availability
- Ratings

### Owner

Managing:

- Fleet
- Rates
- Availability
- Configurations

Primary concerns:

- Easy setup
- Easy scheduling
- Visibility of offerings

---

## Current Features

- Fleet Management
- Ship Configuration
- Rate Management
- Hangar Services
- UEX Vehicle Data

---

## Planned Features

- Crew Marketplace
- Materials Marketplace
- Ratings System
- Discord Login
- Organization Support

---

## External Data Sources

UEX API

Used for:

- Ship Data
- Commodity Data
- Location Data

---

## UI Style

Use UEX dark mode styling as inspiration.

Prioritize readability and function over visual effects.

---


## Product Owner Notes

The owner of this project is not a software engineer.

When making recommendations:

- Prefer simple workflows.
- Prefer fewer clicks.
- Explain technical tradeoffs plainly.
- Optimize for user experience over engineering purity.

---

## Important Decisions

Ship roles are tied to ship type and cannot be edited by owners.

Owners may offer:

- Hourly Rate
- Daily Rate
- Weekly Rate

Hangar service pricing may be:

- Flat Fee
- Commodity Markup

Ship configuration is managed through a popup modal.