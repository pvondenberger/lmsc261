import sys
from pathlib import Path
import flet as ft
import time

tap_times = []

BUILD_DIR = Path(__file__).resolve().parent / "cpp" / "build"
sys.path.insert(0, str(BUILD_DIR))

import metronome_engine

engine = metronome_engine.MetronomeEngine()


def main(page: ft.Page):
    page.title = "MetroGnome"
    page.horizontal_alignment = ft.CrossAxisAlignment.CENTER
    page.vertical_alignment = ft.MainAxisAlignment.CENTER
    page.bgcolor = "#273652"
    page.window.resizable = False
    page.window.height = 500
    page.window.width = 350
    page.window.frameless = True
    page.padding = 0

    text_color = str("#eeeba4")
    ui_text_default = int(50)

    bpm_label = ft.Text(
        value=f"{engine.get_bpm()}",
        text_align=ft.TextAlign.CENTER,
        size=45,
        color=text_color
    )

    bpm_slider = ft.CupertinoSlider(
        min=40,
        max=300,
        value=engine.get_bpm(),
        width=300,
    )

    meter_input = ft.TextField(
        value=str(engine.get_meter()),
        width=120,
        color=text_color,
        text_align="right",
        ignore_up_down_keys=True,
        border=ft.InputBorder.NONE,
        filled=False,
        text_size=ui_text_default,
        multiline=False,
        cursor_color="white",
        cursor_height=40
    )
    
    denominator_dropdown = ft.Dropdown(
        menu_width=None,
        value=str(engine.get_denominator()),
        options=[
            ft.dropdown.Option("2"),
            ft.dropdown.Option("4"),
            ft.dropdown.Option("8"),
            ft.dropdown.Option("16"),
        ],
        color=text_color,
        border=ft.InputBorder.NONE,
        filled=False,
        bgcolor=ft.Colors.TRANSPARENT,
        text_size=ui_text_default,
    )

    def refresh_ui():
        bpm_label.value = f"{engine.get_bpm()}"
        bpm_slider.value = engine.get_bpm()
        page.update()

    def update_bpm(e):
        bpm = int(float(e.control.value))
        engine.set_bpm(bpm)
        refresh_ui()

    def start():
        if not engine.is_running():
            engine.start()
        page.update()

    def stop():
        if engine.is_running():
            engine.stop()
        page.update()

    def set_new_meter():
        try:
            beats = int(meter_input.value)
            if beats < 1:
                meter_input.value = str(engine.get_meter())
            else:
                engine.set_meter(beats)
            refresh_ui()
        except ValueError:
            meter_input.value = str(engine.get_meter())
            page.update()

    def set_meter_denominator(e):
        denom = int(e.control.value)
        engine.set_denominator(denom)
        refresh_ui()

    def tap_tempo():
        global tap_times
        now = time.perf_counter()

        if tap_times and (now - tap_times[-1] > 2.0):
            tap_times = []

        tap_times.append(now)

        if len(tap_times) > 6:
            tap_times.pop(0)

        if len(tap_times) >= 2:
            intervals = [
                tap_times[i] - tap_times[i - 1]
                for i in range(1, len(tap_times))
            ]
            avg_interval = sum(intervals) / len(intervals)
            bpm = round(60.0 / avg_interval)
            if (bpm <= 300):
                engine.set_bpm(bpm)
            elif (bpm > 300):
                engine.set_bpm(300)
            refresh_ui()

    async def close_window(e):
        await page.window.destroy()

    def toggle_transport(e):
        if engine.is_running():
            engine.stop()
        else:
            engine.start()

        update_trasnport_button()
        page.update()

    transport_button = ft.IconButton(
        icon=ft.Icons.PLAY_ARROW,
        width=100,
        height=100,
        on_click=toggle_transport,
        icon_size=80
    )

    def update_trasnport_button():
        if engine.is_running():
            transport_button.icon = ft.Icons.STOP
            transport_button.tooltip = "Stop"
        else:
            transport_button.icon = ft.Icons.PLAY_ARROW
            transport_button.tooltip = "Start"

    top_bar = ft.WindowDragArea(
        maximizable=False,
        content=ft.Container(
            height=50,
            padding=ft.Padding.symmetric(horizontal=20, vertical=0),
            content=ft.Row(
                alignment=ft.MainAxisAlignment.SPACE_BETWEEN,
                vertical_alignment=ft.CrossAxisAlignment.CENTER,
                controls=[
                    ft.Text("MetroGnome", color=text_color),
                    ft.IconButton(
                        icon=ft.Icons.CLOSE,
                        on_click=close_window,
                        icon_color=text_color,
                        height=20,
                        width=20,
                        icon_size=20,
                        alignment= ft.Alignment.CENTER,
                        padding=0
                    ),
                ],
            ),
        ),
    )

    interface = ft.Container(
        content=ft.Column(controls=[
            ft.Container(
                bgcolor=ft.Colors.AMBER_900,
                content=ft.Row(
                    alignment=ft.MainAxisAlignment.CENTER,
                    controls=[
                        bpm_label
                    ],
                ),
            ),
            ft.Row(
                alignment=ft.MainAxisAlignment.CENTER,
            ),
            ft.Row(
                alignment=ft.MainAxisAlignment.CENTER,
                controls=[
                    meter_input,
                    ft.Text("/", size=(ui_text_default * 0.75), color=text_color),
                    denominator_dropdown,
                ],
            ),
            ft.Row(
                alignment=ft.MainAxisAlignment.CENTER,
                controls=[bpm_slider],
            ),
            ft.Row(
                alignment=ft.MainAxisAlignment.CENTER,
                controls=[
                    transport_button,
                ],
            ),
            ft.Row(
                alignment=ft.MainAxisAlignment.END,
                controls=[
                    ft.CupertinoButton(
                        "Tap Tempo",
                        on_click=tap_tempo,
                        color=text_color,
                    ),
                ]
            )
        ],
        ),
    )

    meter_input.on_submit = set_new_meter
    denominator_dropdown.on_select = set_meter_denominator
    bpm_slider.on_change = update_bpm

    page.on_keyboard_event = lambda e: tap_tempo() if e.key == " " else None

    page.add(
        ft.Column(
            expand=True,
            spacing=0,
            controls=[
                top_bar,
                ft.Divider(),
                interface
            ]
        ),
        
    )


ft.run(main)