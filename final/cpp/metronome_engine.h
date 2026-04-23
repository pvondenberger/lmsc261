#pragma once

#include <atomic>
#include <cstdint>
#include <string>
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

    void set_accent_pitch(double ratio);
    double get_accent_pitch() const;
    void load_click_sample(const std::string& path);
    void build_default_click();

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

    PaStream* stream_;

    std::atomic<bool> running_;
    std::atomic<int> bpm_;

    double sample_rate_;
    std::atomic<uint64_t> samples_per_beat_;

    uint64_t global_sample_index_;
    int beat_in_bar_;

    std::vector<float> click_sample_;

    bool click_active_;
    double click_pos_;
    double playback_rate_;

    double normal_pitch_;
    double accent_pitch_;
};