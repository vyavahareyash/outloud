import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

os.makedirs('assets/store', exist_ok=True)

# Load fonts
FONT_PATH = '/System/Library/Fonts/Helvetica.ttc'
if not os.path.exists(FONT_PATH):
    FONT_PATH = '/System/Library/Fonts/Supplemental/Arial.ttf'

def get_font(size, bold=False):
    # Helvetica.ttc index 0 is regular, 1 is bold
    try:
        return ImageFont.truetype(FONT_PATH, size, index=1 if bold else 0)
    except:
        return ImageFont.truetype(FONT_PATH, size)

# Load master icon
icon_master = Image.open('assets/icons/icon-master.png').convert('RGBA')

# -------------------------------------------------------------
# 1. SMALL PROMO TILE (440 x 280) - RGB, no alpha
# -------------------------------------------------------------
def make_small_promo():
    w, h = 440, 280
    im = Image.new('RGB', (w, h), color='#0b0f19')
    draw = ImageDraw.Draw(im)

    # Subtle gradient or background glow
    glow = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse((w//2 - 120, 20, w//2 + 120, 160), fill=(99, 102, 241, 45))
    glow = glow.filter(ImageFilter.GaussianBlur(30))
    im.paste(Image.new('RGB', (w, h), (11, 15, 25)), (0, 0))
    im_rgba = im.convert('RGBA')
    im_rgba = Image.alpha_composite(im_rgba, glow)

    # Icon
    icon_resized = icon_master.resize((84, 84), Image.Resampling.LANCZOS)
    im_rgba.paste(icon_resized, (w//2 - 42, 35), icon_resized)

    im = im_rgba.convert('RGB')
    draw = ImageDraw.Draw(im)

    # Text
    f_title = get_font(24, bold=True)
    f_sub = get_font(14)
    f_badge = get_font(11, bold=True)

    draw.text((w//2, 142), "OutLoud", fill="#ffffff", font=f_title, anchor="mm")
    draw.text((w//2, 172), "Local Phonon TTS", fill="#a5b4fc", font=f_sub, anchor="mm")

    # Badge pill
    badge_w, badge_h = 210, 26
    bx = w//2 - badge_w//2
    by = 206
    draw.rounded_rectangle((bx, by, bx + badge_w, by + badge_h), radius=13, fill="#1e2235", outline="#312e81", width=1)
    draw.text((w//2, by + badge_h//2), "100% PRIVATE • ON-DEVICE", fill="#38bdf8", font=f_badge, anchor="mm")

    out_path = 'assets/store/promo-small-440x280.png'
    im.save(out_path, format='PNG')
    print(f"Generated: {out_path} ({im.size}, mode={im.mode})")

# -------------------------------------------------------------
# 2. MARQUEE PROMO TILE (1400 x 560) - RGB, no alpha
# -------------------------------------------------------------
def make_marquee_promo():
    w, h = 1400, 560
    im = Image.new('RGB', (w, h), color='#090d16')

    glow = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse((950, 100, 1350, 460), fill=(99, 102, 241, 60))
    gdraw.ellipse((200, 200, 600, 500), fill=(56, 189, 248, 30))
    glow = glow.filter(ImageFilter.GaussianBlur(60))

    im_rgba = im.convert('RGBA')
    im_rgba = Image.alpha_composite(im_rgba, glow)

    # Icon on right side
    icon_resized = icon_master.resize((260, 260), Image.Resampling.LANCZOS)
    im_rgba.paste(icon_resized, (980, 150), icon_resized)

    im = im_rgba.convert('RGB')
    draw = ImageDraw.Draw(im)

    # Typography
    f_chip = get_font(13, bold=True)
    f_h1 = get_font(54, bold=True)
    f_h2 = get_font(26)
    f_item = get_font(18)

    # Category chip
    draw.rounded_rectangle((100, 95, 290, 127), radius=16, fill="#1e1b4b", outline="#6366f1", width=1)
    draw.text((195, 111), "CHROME EXTENSION", fill="#c7d2fe", font=f_chip, anchor="mm")

    draw.text((100, 185), "OutLoud", fill="#ffffff", font=f_h1, anchor="ls")
    draw.text((100, 230), "Local Phonon Text-to-Speech", fill="#93c5fd", font=f_h2, anchor="ls")

    items = [
        "✓  100% Private & On-Device via Ollama",
        "✓  Zero Cloud APIs, Zero Subscriptions, Zero Telemetry",
        "✓  Highlight any webpage text to read aloud instantly",
        "✓  Ultra-low latency streaming sentence synthesis"
    ]
    y_start = 285
    for i, it in enumerate(items):
        draw.text((100, y_start + i * 38), it, fill="#e2e8f0", font=f_item)

    out_path = 'assets/store/promo-marquee-1400x560.png'
    im.save(out_path, format='PNG')
    print(f"Generated: {out_path} ({im.size}, mode={im.mode})")

# -------------------------------------------------------------
# 3. SCREENSHOT 1: READING ON WEBPAGE (1280 x 800) - RGB
# -------------------------------------------------------------
def make_screenshot_reading():
    w, h = 1280, 800
    im = Image.new('RGB', (w, h), color='#0f1422')
    draw = ImageDraw.Draw(im)

    # Browser window mockup
    bx, by, bw, bh = 60, 40, 1160, 720
    # Browser frame
    draw.rounded_rectangle((bx, by, bx + bw, by + bh), radius=12, fill="#ffffff", outline="#334155", width=2)

    # Chrome window titlebar
    draw.rounded_rectangle((bx, by, bx + bw, by + 44), radius=12, fill="#f1f5f9")
    draw.rectangle((bx, by + 30, bx + bw, by + 44), fill="#f1f5f9") # square bottom corners
    # Window traffic lights
    draw.ellipse((bx + 16, by + 16, bx + 28, by + 28), fill="#ef4444")
    draw.ellipse((bx + 36, by + 16, bx + 48, by + 28), fill="#f59e0b")
    draw.ellipse((bx + 56, by + 16, bx + 68, by + 28), fill="#10b981")

    # Chrome tab
    draw.rounded_rectangle((bx + 90, by + 10, bx + 360, by + 44), radius=8, fill="#ffffff")
    f_tab = get_font(12)
    draw.text((bx + 115, by + 26), "Deep Learning Speech Synthesis • Wiki", fill="#1e293b", font=f_tab, anchor="lm")

    # Address & Toolbar
    draw.rectangle((bx, by + 44, bx + bw, by + 84), fill="#f8fafc", outline="#e2e8f0", width=1)
    # URL bar
    draw.rounded_rectangle((bx + 60, by + 50, bx + 950, by + 78), radius=14, fill="#ffffff", outline="#cbd5e1", width=1)
    f_url = get_font(12)
    draw.text((bx + 85, by + 64), "https://en.wikipedia.org/wiki/Speech_synthesis", fill="#475569", font=f_url, anchor="lm")

    # Mini OutLoud icon in toolbar
    icon_mini = icon_master.resize((24, 24), Image.Resampling.LANCZOS)
    im.paste(icon_mini, (bx + 1080, by + 52), icon_mini)

    # Webpage content area
    f_web_h1 = get_font(28, bold=True)
    f_web_p = get_font(15)

    draw.text((bx + 80, by + 140), "Speech Synthesis & Modern Neural Models", fill="#0f172a", font=f_web_h1)

    p1 = ("Speech synthesis is the artificial production of human speech. A computer system used for this "
          "purpose is called a speech computer or speech synthesizer, and can be implemented in software "
          "or hardware products. Modern local models such as Phonon allow zero-latency, private synthesis.")
    
    p2 = ("By running models entirely on-device, sensitive personal documents and private research never "
          "leave your local machine. Synthesized audio streams directly to an offscreen audio player without "
          "cloud telemetry or subscription fees.")

    # Draw p1
    draw.text((bx + 80, by + 195), p1[:92], fill="#334155", font=f_web_p)
    draw.text((bx + 80, by + 225), p1[92:188], fill="#334155", font=f_web_p)
    draw.text((bx + 80, by + 255), p1[188:], fill="#334155", font=f_web_p)

    # Highlighted selection on p2!
    sel_x1, sel_y1 = bx + 78, by + 310
    draw.rectangle((sel_x1, sel_y1, bx + 1040, sel_y1 + 28), fill="#bfdbfe")
    draw.text((bx + 80, by + 322), p2[:84], fill="#1e3a8a", font=f_web_p, anchor="lm")

    sel_y2 = sel_y1 + 32
    draw.rectangle((sel_x1, sel_y2, bx + 980, sel_y2 + 28), fill="#bfdbfe")
    draw.text((bx + 80, by + 354), p2[84:172], fill="#1e3a8a", font=f_web_p, anchor="lm")

    sel_y3 = sel_y2 + 32
    draw.rectangle((sel_x1, sel_y3, bx + 420, sel_y3 + 28), fill="#bfdbfe")
    draw.text((bx + 80, by + 386), p2[172:], fill="#1e3a8a", font=f_web_p, anchor="lm")

    # Floating OutLoud Pill right below selection
    pill_x, pill_y = bx + 430, sel_y3 - 5
    pill_w, pill_h = 240, 38
    # Shadow
    draw.rounded_rectangle((pill_x + 2, pill_y + 4, pill_x + pill_w + 2, pill_y + pill_h + 4), radius=19, fill="#cbd5e1")
    # Pill body
    draw.rounded_rectangle((pill_x, pill_y, pill_x + pill_w, pill_y + pill_h), radius=19, fill="#18181b", outline="#3f3f46", width=1)

    # Pill contents: Play icon + "Read (Freya)" + waveform
    f_pill = get_font(12, bold=True)
    # Blue play button circle
    draw.ellipse((pill_x + 8, pill_y + 7, pill_x + 32, pill_y + 31), fill="#2563eb")
    # Play triangle
    draw.polygon([(pill_x + 18, pill_y + 14), (pill_x + 18, pill_y + 24), (pill_x + 26, pill_y + 19)], fill="#ffffff")

    draw.text((pill_x + 40, pill_y + 19), "Read Selection", fill="#ffffff", font=f_pill, anchor="lm")

    # Voice badge inside pill
    draw.rounded_rectangle((pill_x + 145, pill_y + 9, pill_x + 225, pill_y + 29), radius=10, fill="#27272a")
    f_voice = get_font(11)
    draw.text((pill_x + 185, pill_y + 19), "Freya • 1.0x", fill="#a1a1aa", font=f_voice, anchor="mm")

    # Feature callout at bottom
    f_banner = get_font(15, bold=True)
    draw.rounded_rectangle((bx + 80, by + 600, bx + 1080, by + 665), radius=10, fill="#0f172a")
    draw.text((bx + 110, by + 632), "✨ Highlight any text on any page → Instant on-device TTS with local Ollama Phonon", fill="#67e8f9", font=f_banner, anchor="lm")

    out_path = 'assets/store/screenshot-1-reading-1280x800.png'
    im.save(out_path, format='PNG')
    print(f"Generated: {out_path} ({im.size}, mode={im.mode})")

# -------------------------------------------------------------
# 4. SCREENSHOT 2: EXTENSION POPUP & OLLAMA CONFIG (1280 x 800)
# -------------------------------------------------------------
def make_screenshot_popup():
    w, h = 1280, 800
    im = Image.new('RGB', (w, h), color='#0b0f19')
    draw = ImageDraw.Draw(im)

    # Background subtle desktop/browser frame
    bx, by, bw, bh = 80, 50, 1120, 700
    draw.rounded_rectangle((bx, by, bx + bw, by + bh), radius=12, fill="#181e2e", outline="#334155", width=2)
    draw.rounded_rectangle((bx, by, bx + bw, by + 44), radius=12, fill="#0f172a")

    # Window traffic lights
    draw.ellipse((bx + 16, by + 16, bx + 28, by + 28), fill="#ef4444")
    draw.ellipse((bx + 36, by + 16, bx + 48, by + 28), fill="#f59e0b")
    draw.ellipse((bx + 56, by + 16, bx + 68, by + 28), fill="#10b981")

    # Feature title on the left
    f_big = get_font(42, bold=True)
    f_sub = get_font(20)
    f_feat = get_font(16)

    draw.text((bx + 60, by + 140), "Local & Private TTS", fill="#ffffff", font=f_big)
    draw.text((bx + 60, by + 185), "Powered by your personal Ollama Phonon instance", fill="#94a3b8", font=f_sub)

    features = [
        "🔒  Zero cloud tracking or remote data transfer",
        "⚡  Stream speech chunk-by-chunk with sentence tokenizer",
        "🎙️  Select multiple local voices (Freya, Zoey, Easton)",
        "🎚️  Adjust rate & speech parameters locally",
        "🪶  Manifest V3 compliant with background offscreen audio"
    ]
    for i, ft in enumerate(features):
        draw.text((bx + 60, by + 260 + i * 45), ft, fill="#e2e8f0", font=f_feat)

    # Extension Popup Card on the right
    px, py, pw, ph = bx + 680, by + 80, 360, 540
    # Card shadow
    draw.rounded_rectangle((px + 6, py + 8, px + pw + 6, py + ph + 8), radius=16, fill="#050811")
    # Card body
    draw.rounded_rectangle((px, py, px + pw, py + ph), radius=16, fill="#121214", outline="#27272a", width=2)

    # Popup Header
    icon_popup = icon_master.resize((28, 28), Image.Resampling.LANCZOS)
    im.paste(icon_popup, (px + 20, py + 18), icon_popup)

    f_p_title = get_font(17, bold=True)
    f_p_ver = get_font(12)
    draw.text((px + 56, py + 26), "OutLoud", fill="#fafafa", font=f_p_title, anchor="lm")
    draw.text((px + 128, py + 27), "v0.1.0", fill="#71717a", font=f_p_ver, anchor="lm")

    # Online status dot + badge
    draw.ellipse((px + pw - 34, py + 22, px + pw - 24, py + 32), fill="#22c55e")

    # Divider
    draw.line((px + 20, py + 58, px + pw - 20, py + 58), fill="#27272a", width=1)

    f_lbl = get_font(12, bold=True)
    f_val = get_font(13)

    # Field 1: Ollama Server Host
    draw.text((px + 20, py + 82), "Ollama Server Host", fill="#a1a1aa", font=f_lbl)
    draw.rounded_rectangle((px + 20, py + 102, px + pw - 20, py + 138), radius=6, fill="#18181b", outline="#3f3f46", width=1)
    draw.text((px + 32, py + 120), "http://localhost:11434", fill="#f4f4f5", font=f_val, anchor="lm")

    # Field 2: Model Identifier
    draw.text((px + 20, py + 158), "Model Identifier", fill="#a1a1aa", font=f_lbl)
    draw.rounded_rectangle((px + 20, py + 178, px + pw - 20, py + 214), radius=6, fill="#18181b", outline="#3f3f46", width=1)
    draw.text((px + 32, py + 196), "phonon", fill="#f4f4f5", font=f_val, anchor="lm")

    # Field 3: Speech Voice
    draw.text((px + 20, py + 234), "Speech Voice", fill="#a1a1aa", font=f_lbl)
    draw.rounded_rectangle((px + 20, py + 254, px + pw - 20, py + 290), radius=6, fill="#18181b", outline="#3f3f46", width=1)
    draw.text((px + 32, py + 272), "Freya (Default)", fill="#f4f4f5", font=f_val, anchor="lm")
    draw.text((px + pw - 36, py + 272), "▼", fill="#71717a", font=f_val, anchor="lm")

    # Buttons
    draw.rounded_rectangle((px + 20, py + 312, px + 170, py + 348), radius=6, fill="#4f46e5")
    f_btn = get_font(13, bold=True)
    draw.text((px + 95, py + 330), "Save Settings", fill="#ffffff", font=f_btn, anchor="mm")

    draw.rounded_rectangle((px + 185, py + 312, px + pw - 20, py + 348), radius=6, fill="#27272a", outline="#3f3f46", width=1)
    draw.text((px + 258, py + 330), "Test Connection", fill="#e4e4e7", font=f_btn, anchor="mm")

    # Status notification card (Green Success)
    draw.rounded_rectangle((px + 20, py + 372, px + pw - 20, py + 432), radius=8, fill="#052e16", outline="#16a34a", width=1)
    f_stat = get_font(12)
    draw.text((px + 32, py + 392), "● Connected to Ollama", fill="#4ade80", font=f_lbl, anchor="lm")
    draw.text((px + 32, py + 414), "Model 'phonon' active (11434)", fill="#86efac", font=f_stat, anchor="lm")

    # Footer note
    f_foot = get_font(11)
    draw.text((px + 20, py + 465), "Ollama must be running locally:", fill="#71717a", font=f_foot)
    draw.rounded_rectangle((px + 20, py + 485, px + pw - 20, py + 512), radius=4, fill="#18181b")
    draw.text((px + 30, py + 498), "OLLAMA_ORIGINS=\"*\" ollama serve", fill="#a5b4fc", font=f_foot, anchor="lm")

    out_path = 'assets/store/screenshot-2-popup-1280x800.png'
    im.save(out_path, format='PNG')
    print(f"Generated: {out_path} ({im.size}, mode={im.mode})")

make_small_promo()
make_marquee_promo()
make_screenshot_reading()
make_screenshot_popup()
print("All Chrome Web Store media assets successfully generated!")
