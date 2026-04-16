cmake_minimum_required(VERSION 3.15)
project(metronome_engine LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(pybind11 CONFIG REQUIRED)

pybind11_add_module(metronome_engine
    bindings.cpp
    metronome_engine.cpp
)

target_include_directories(metronome_engine PRIVATE /opt/homebrew/include)
target_link_directories(metronome_engine PRIVATE /opt/homebrew/lib)
target_link_libraries(metronome_engine PRIVATE portaudio)