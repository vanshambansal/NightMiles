# 🌧️ NightMiles

> An atmospheric late-night lofi music website designed to feel like sitting beside a rain-covered train window during a peaceful midnight journey.

![NightMiles Preview](assets/bg-train-window.png)

## ✨ Features

- **Cinematic Train Window Scene**: Dark blue midnight tones, raindrops, distant amber lights, reflections, and cozy cabin ambiance.
- **Atmospheric Hindi Mood Quote**: 12 curated poetic lines in elegant Devanagari typography that gently cycle in the center.
- **Dynamic Window Rain Overlay**: HTML5 canvas rendering realistic moisture beads and water streaks trickling down the glass.
- **Live Local Time**: Auto-updating ambient clock in the top-left corner.
- **Floating Glassmorphic Music Player**:
  - Track artwork, title, and artist display
  - Interactive scrubbable progress bar
  - Previous (`⏮`), Play/Pause (`▶`/`⏸`), Next (`⏭`) track controls
  - Volume slider and one-click mute toggle
  - **Procedural Rain Sound** (Web Audio API)
  - **Procedural Train Track Rumble** (Web Audio API)
  - **Click-to-Toggle Sleep Timer** with a 1–120 min custom slider and smooth fade-out
  - **Wallpaper Framing Switcher** (Window Focus / Panoramic / Full Cabin)
- **Zen Focus Mode (`Z`)**: Hides player and top bar for deep study and distraction-free immersion.
- **YouTube IFrame API Integration**: Seamless playback powered by your YouTube playlist (`PLMNU4btdRJc8`).
- **Zero Heavy Frameworks**: Pure Vanilla HTML5, CSS3, and JavaScript.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| **`Space`** | Play / Pause |
| **`Right Arrow` (`→`)** | Next Track |
| **`Left Arrow` (`←`)** | Previous Track |
| **`M`** | Toggle Mute |
| **`R`** | Toggle Ambient Rain Sound |
| **`T`** | Toggle Train Track Rumble |
| **`F`** | Cycle Wallpaper View (Window / Panoramic / Full Cabin) |
| **`Z`** / **`Esc`** | Toggle Zen Focus Mode |

---

## 🎵 Customizing Your Playlist & Quotes

You can change your YouTube playlist or add custom quotes anytime in [`config.js`](file:///d:/documents/windowseat/config.js).

---

## 🚀 Running Locally

Open `index.html` directly in any modern browser, or run:

```bash
# Using Python
python -m http.server 4321
```

Visit [http://localhost:4321](http://localhost:4321).
