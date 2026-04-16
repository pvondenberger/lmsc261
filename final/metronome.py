import sys
from pathlib import Path
import customtkinter as ctk
import time

root = ctk.CTk()
root.geometry("400x500+200+300")
ctk.set_appearance_mode("dark-blue")

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

bpm_label = ctk.CTkLabel(root, text=f"BPM: {engine.get_bpm()}")
bpm_label.pack()

slider = ctk.CTkSlider(root, from_=40, to=240, command=update_bpm)
slider.set(engine.get_bpm())
slider.pack(pady=10)

meter_frame = ctk.CTkFrame(root)
meter_frame.pack()

meter_input = ctk.CTkEntry(meter_frame)
meter_input.bind("<Return>", lambda event: set_new_meter())
meter_input.grid(row=0, column=0, padx=5)

meter_dropdown = ctk.CTkOptionMenu(meter_frame, values=["2", "4", "8", "16"], command=set_meter_dem)
meter_dropdown.set("4")
meter_dropdown.grid(row=0, column=1, padx=5)

button_frame = ctk.CTkFrame(root)
button_frame.pack(side="bottom", fill="x")

start_btn = ctk.CTkButton(button_frame, text="Start", command=start)
start_btn.grid(row=2, column=0, pady=10)

stop_btn = ctk.CTkButton(button_frame, text="Stop", command=stop)
stop_btn.grid(row=3, column=0, pady=10)

tap_button = ctk.CTkButton(button_frame, text="Tap Tempo", command=tap_tempo)
tap_button.grid(row=0, column=1, padx=10)

root.mainloop()