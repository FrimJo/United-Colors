# United Colors

A top-down gyroscope game for mobile (Expo / React Native). See [AGENTS.md](./AGENTS.md) for stack, architecture, and quality gates.

## Running on a physical device

The app loads the JavaScript bundle from the Metro bundler on your machine. If you see **"No script URL provided"** on a physical device:

1. **Start Metro in one terminal** (and leave it running):
   ```bash
   pnpm start
   ```
2. **In a second terminal**, build and run on the device:
   ```bash
   pnpm ios --device
   ```
3. Ensure the iPhone and Mac are on the **same Wi‑Fi** network.
4. When iOS prompts, allow **Local Network** access for the app so it can reach Metro.

If the device still can’t reach Metro, set your Mac’s IP explicitly before starting Metro:
   ```bash
   export REACT_NATIVE_PACKAGER_HOSTNAME=$(ipconfig getifaddr en0)
   pnpm start
   ```
