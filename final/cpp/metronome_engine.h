#pragma once

#include <atomic>
#include <cstdint>
#include <vector>
#include <portaudio.h>

// defining all the vars
class MetronomeEngine {
public:
    MetronomeEngine();
    ~MetronomeEngine();

    void start();
    void stop();

    int beats_per_bar_;
    int get_meter() const;
    void set_meter(int beats);

    int denominator_;
    void set_denominator(int d);
    int get_denominator() const;

    void set_bpm(int bpm);
    int get_bpm() const;

    bool is_running() const;

private:
    static int pa_callback(
        const void* input,
        void* output,
        unsigned long framesPerBuffer,
        const PaStreamCallbackTimeInfo* timeInfo,
        PaStreamCallbackFlags statusFlags,
        void* userData
    );

    int render(float* out, unsigned long framesPerBuffer);
    void rebuild_timing();
    void build_click_waveforms();

    PaStream* stream_;

    std::atomic<bool> running_;
    std::atomic<int> bpm_;

    double sample_rate_;
    std::atomic<uint64_t> samples_per_beat_;

    uint64_t global_sample_index_;
    int beat_in_bar_;

    std::vector<float> click_;
    std::vector<float> accent_;

    bool click_active_;
    bool accent_active_;
    size_t click_pos_;
    size_t accent_pos_;
};