# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project: Leftovers (Expo/React Native app)

- Stack: Expo, TypeScript, React Native
- Always run `npx tsc --noEmit` after edits to verify types
- After changes, commit and push to GitHub (user wants shipped code, not drafts)
- When Expo build errors appear, check `_layout.tsx`, `purchases.ts`, and package versions first

## Dev Environment Notes

- Slash commands (e.g., /plugin) run inside Claude Code, NOT in a separate terminal
- When starting Expo, kill stale ports first: `lsof -ti:8081 | xargs kill -9`
- Assume user is testing on Expo Go unless told otherwise

## Workflow Defaults

- After implementing features, always: (1) verify build, (2) git add/commit with descriptive message, (3) push to origin
- Prefer small, verified commits over large unverified ones — sessions get interrupted
