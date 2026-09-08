---
id: C-02
name: App
layer: app
paths:                    # a comment here is deliberate: the reader must strip it
  - app/**
depends_on: [C-01]
decisions: []
status: building          # a pinned status, printed verbatim, never rolled up
touch_slugs: []
---
Declares its dependency on Core, so that crossing is `confirmed`. Also
imports an unclaimed file, which is unclaimed TERRITORY (D2) and
deliberately not a D1.
