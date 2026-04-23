#include <pybind11/pybind11.h>
#include "metronome_engine.h"

namespace py = pybind11;

PYBIND11_MODULE(metronome_engine, m) {
    py::class_<MetronomeEngine>(m, "MetronomeEngine")
        .def(py::init<>())
        .def("start", &MetronomeEngine::start)
        .def("stop", &MetronomeEngine::stop)
        .def("set_meter", &MetronomeEngine::set_meter)
        .def("get_meter", &MetronomeEngine::get_meter)
        .def("set_denominator", &MetronomeEngine::set_denominator)
        .def("get_denominator", &MetronomeEngine::get_denominator)
        .def("set_accent_pitch", &MetronomeEngine::set_accent_pitch)
        .def("get_accent_pitch", &MetronomeEngine::get_accent_pitch)
        .def("load_click_sample", &MetronomeEngine::load_click_sample)
        .def("set_bpm", &MetronomeEngine::set_bpm)
        .def("get_bpm", &MetronomeEngine::get_bpm)
        .def("is_running", &MetronomeEngine::is_running);
}