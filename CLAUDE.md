@AGENTS.md
# CLAUDE.md

# SankalpManager

SankalpManager is a simple construction material rental tracking system built using:

- Next.js
- Tailwind CSS
- Supabase

The project manages:
- Materials
- Customers
- Rentals
- Returns
- Payment calculations

---

# Project Purpose

This application helps track construction material rentals for regular customers.

Main features:
- Material inventory management
- Customer management
- Rental allocation
- Return processing
- Automatic rent calculation
- Bill generation

---

# Architecture

Frontend
↓
Hooks
↓
Subagents
↓
Skills
↓
MCP Layer
↓
Supabase Database

---

# Folder Structure

src/
├── app/
├── components/
├── hooks/
├── skills/
├── subagents/
├── mcps/
├── lib/

---

# Hooks

Hooks manage:
- frontend state
- data fetching
- UI updates
- lifecycle handling

Hooks used:
- useMaterials
- useCustomers
- useRentals
- useDashboardStats

React hooks used:
- useState
- useEffect
- useCallback

---

# Skills

Skills are task-oriented instruction modules.

## materialSkill
Handles:
- material operations
- stock handling
- inventory validation

## customerSkill
Handles:
- customer registration
- customer retrieval
- customer workflows

## rentalSkill
Handles:
- rental allocation
- return processing
- rental status updates

## paymentSkill
Handles:
- rent calculation
- bill generation
- invoice preparation

---

# Subagents

Subagents coordinate operational workflows using Skills.

## stockSubagent
Coordinates:
- stock validation
- inventory updates
- stock restoration

## rentalSubagent
Coordinates:
- rental processing
- rental allocation workflow
- return workflow

## paymentSubagent
Coordinates:
- payment processing
- rent calculation workflow
- invoice generation workflow

---

# MCP Layer

The MCP layer acts as the integration bridge between the application and Supabase.

Responsibilities:
- fetch database records
- insert records
- update records
- manage Supabase communication

Main MCP:
- supabaseMcp.ts

---

# Database

Supabase tables:
- materials
- customers
- rentals

---

# Rental Formula

Total Rent =
Quantity × Price Per Day × Number Of Days

Rental logic:
- Same-day return = 1 day
- Next-day return = 2 days

---

# Project Rules

- Keep code beginner-friendly
- Use modular structure
- Keep UI simple
- Avoid unnecessary complexity
- Maintain clean separation between layers

---

# Antigravity Concepts Used

- Skills
- Subagents
- Hooks
- MCP Architecture

---

# Deployment

Frontend Deployment:
- Vercel

Backend:
- Supabase

---

# Notes

This project is designed as a simple mini project demonstrating:
- modular architecture
- Antigravity concepts
- Supabase integration
- workflow-based design