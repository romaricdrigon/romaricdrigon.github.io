#!/bin/sh

# Resize for macOS
sips -Z 1920 assets/images/posts/*.jpg || true
sips -Z 1920 assets/images/posts/*.png || true

# Open ImageOptim app (if available)
open -a ImageOptim assets/images || true
