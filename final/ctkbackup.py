import sys
from pathlib import Path
import customtkinter as ctk
import time

root = ctk.CTk()
root.geometry("400x500+200+300")
tcolor = str("#eeeba4")
g_bg_color = "#273652"
hfont = ("Comfortaa", 20)
pfont = ("Comfortaa", 15)
root.configure(fg_color=g_bg_color)

tap_times = []

BUILD_DIR = Path(__file__).resolve().parent / "cpp" / "build"
sys.path.insert(0, str(BUILD_DIR))

import metronome_engine

engine = metronome_engine.MetronomeEngine()

def update_bpm(value):
    bpm = int(float(value))
    engine.set_bpm(bpm)
    bpm_label.configure(text=f"BPM: {bpm}")

def start():
    if not engine.is_running():
        engine.start()

def stop():
    if engine.is_running():
        engine.stop()

def set_new_meter():
    try:
        beats=int(meter_input.get())
        engine.set_meter(beats)
    except ValueError:
        meter_input.configure(text="N")

def set_meter_dem(choice):
    denom = int(choice)
    engine.set_denominator(denom)

def tap_tempo():
    global tap_times
    now = time.perf_counter()
    if tap_times and (now - tap_times[-1] > 2.0):
        tap_times = []
    tap_times.append(now)
    if len(tap_times) > 6:
        tap_times.pop(0)
    if len(tap_times) >= 2:
        intervals = []
        for i in range(1, len(tap_times)):
            intervals.append(tap_times[i] - tap_times[i - 1])
        avg_interval = sum(intervals) / len(intervals)
        bpm = round(60.0 / avg_interval)
        engine.set_bpm(bpm)
        bpm_label.configure(text=f"BPM: {engine.get_bpm()}")

bpm_label = ctk.CTkLabel(root, text=f"BPM: {engine.get_bpm()}", font=hfont, text_color=tcolor)
bpm_label.pack(pady=10)

slider = ctk.CTkSlider(root, from_=40, to=240, command=update_bpm, width=200, height=50, hover=False, button_color="#FFFFFF", fg_color="#FFFFFF", corner_radius=0, progress_color="#AAAAAA")
slider.set(engine.get_bpm())
slider.pack(pady=10)

meter_frame = ctk.CTkFrame(root)
meter_frame.pack()

meter_input = ctk.CTkEntry(meter_frame, width=10, font=pfont)
meter_input.insert(0, "4")
meter_input.bind("<Return>", lambda event: set_new_meter())
meter_input.grid(row=0, column=0, padx=5)

slash_text = ctk.CTkLabel(meter_frame, text=f"/", font=pfont)
slash_text.grid(row=0, column=1, padx=5)

meter_dropdown = ctk.CTkOptionMenu(meter_frame, values=["2", "4", "8", "16"], command=set_meter_dem, width=10, font=pfont)
meter_dropdown.set("4")
meter_dropdown.grid(row=0, column=2, padx=5)

#eventual visual cue
canvas_frame = ctk.CTkFrame(root)
canvas_frame.pack(pady=30)

visuals = ctk.CTkCanvas(canvas_frame, width=100, height=100, background=g_bg_color)
visuals.grid(column=0, row=0)

button_frame = ctk.CTkFrame(root)
button_frame.pack(side="bottom", fill="y")

start_btn = ctk.CTkButton(button_frame, text="Start", command=start, font=pfont)
start_btn.grid(row=1, column=0, pady=5)

stop_btn = ctk.CTkButton(button_frame, text="Stop", command=stop, font=pfont)
stop_btn.grid(row=2, column=0, pady=5)

tap_button = ctk.CTkButton(button_frame, text="Tap Tempo", command=tap_tempo, font=pfont)
tap_button.grid(row=0, column=0, padx=10, pady=5)

root.mainloop()