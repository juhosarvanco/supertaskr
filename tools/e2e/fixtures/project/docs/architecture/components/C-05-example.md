---
id: C-05
name: Application
layer: app
paths:
  - app/src/main.tsx
  - app/src/App.tsx
  - app/src/components/shell/**
  - app/test/**
depends_on: [C-06]
touch_slugs: [app-shell]
status: auto
---

An example component.
