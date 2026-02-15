# Debugging app crash on physical device

When the app crashes on a physical iPhone but runs in the simulator, capture the crash to find the cause.

## 1. Get the crash log from the device

**On the iPhone:**
- **Settings → Privacy & Security → Analytics & Improvements → Analytics Data**
- Find an entry named **UnitedColors** or **United Colors** with a recent date
- Tap it → share (or open in another app) to copy or send to your Mac

**From the Mac (device connected via USB):**
- Open **Xcode**
- **Window → Devices and Simulators** (or **Organizer**)
- Select your iPhone in the left sidebar
- Click **View Device Logs**
- Find the most recent **UnitedColors** crash and export or copy the text

## 2. Run from Xcode to see live logs

1. Connect the iPhone via USB and unlock it.
2. Open the iOS project in Xcode:
   ```bash
   open ios/UnitedColors.xcworkspace
   ```
3. Select your **physical device** as the run destination (top toolbar).
4. Run with **Product → Run** (or ⌘R).
5. When the app launches (or crashes), watch the **Xcode console** at the bottom for the first error or stack trace.

This often shows the exact line (native or JS) where it crashes.

## 3. Ensure Metro is reachable from the device

The dev client loads the bundle from your Mac. If the device and Mac are on different networks or the URL is wrong, the app may fail to load (red screen or crash).

- Keep **Metro** running on the Mac: `pnpm start`
- Use the **same Wi‑Fi** for Mac and iPhone
- If prompted in the app, enter your Mac’s LAN URL (e.g. `http://192.168.1.130:8081`) — the terminal where you ran `pnpm start` usually prints this URL

## 4. After you have the crash log

Share the **first 50–80 lines** of the crash log (Exception Type, Crashed Thread, and the thread’s stack trace). That is enough to see whether the crash is in native code (e.g. Skia, Reanimated, sensors) or in JS.
