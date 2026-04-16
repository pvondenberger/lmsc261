#include "metronome_engine.h"

#include <algorithm>
#include <cmath>
#include <stdexcept>

namespace {
constexpr double kPi = 3.14159265358979323846;
constexpr unsigned long kFramesPerBuffer = 256;
}

MetronomeEngine::MetronomeEngine()
    : stream_(nullptr),
      running_(false),
      bpm_(120),
      beats_per_bar_(4),
      denominator_(4),
      sample_rate_(44100.0),
      samples_per_beat_(0),
      global_sample_index_(0),
      beat_in_bar_(0),
      click_active_(false),
      accent_active_(false),
      click_pos_(0),
      accent_pos_(0) {
    PaError err = Pa_Initialize();
    if (err != paNoError) {
        throw std::runtime_error(Pa_GetErrorText(err));
    }

    build_click_waveforms();
    rebuild_timing();

    err = Pa_OpenDefaultStream(
        &stream_,
        0,                  // no input channels
        1,                  // mono output
        paFloat32,          // float samples
        sample_rate_,
        kFramesPerBuffer,
        &MetronomeEngine::pa_callback,
        this
    );

    if (err != paNoError) {
        Pa_Terminate();
        throw std::runtime_error(Pa_GetErrorText(err));
    }
}

MetronomeEngine::~MetronomeEngine() {
    if (stream_ != nullptr) {
        Pa_StopStream(stream_);
        Pa_CloseStream(stream_);
        stream_ = nullptr;
    }
    Pa_Terminate();
}

void MetronomeEngine::build_click_waveforms() {
    const double click_duration_sec = 0.03;
    const double accent_duration_sec = 0.05;

    const size_t click_len = static_cast<size_t>(sample_rate_ * click_duration_sec);
    const size_t accent_len = static_cast<size_t>(sample_rate_ * accent_duration_sec);

    click_.resize(click_len);
    accent_.resize(accent_len);

    for (size_t i = 0; i < click_len; ++i) {
        double t = static_cast<double>(i) / sample_rate_;
        double env = std::exp(-60.0 * t);
        click_[i] = static_cast<float>(0.35 * std::sin(2.0 * kPi * 1600.0 * t) * env);
    }

    for (size_t i = 0; i < accent_len; ++i) {
        double t = static_cast<double>(i) / sample_rate_;
        double env = std::exp(-45.0 * t);
        accent_[i] = static_cast<float>(0.5 * std::sin(2.0 * kPi * 2200.0 * t) * env);
    }
}

void MetronomeEngine::rebuild_timing() {
    int bpm = bpm_.load();
    double beat_multiplier = 4.0 / static_cast<double>(denominator_);
    double spb = (60.0 * sample_rate_) / static_cast<double>(bpm);
    uint64_t result = static_cast<uint64_t>(spb * beat_multiplier);
    samples_per_beat_.store(std::max<uint64_t>(1, result));
}

void MetronomeEngine::start() {
    if (running_.load()) {
        return;
    }

    global_sample_index_ = 0;
    beat_in_bar_ = 0;
    click_active_ = false;
    accent_active_ = false;
    click_pos_ = 0;
    accent_pos_ = 0;

    PaError err = Pa_StartStream(stream_);
    if (err != paNoError) {
        throw std::runtime_error(Pa_GetErrorText(err));
    }

    running_.store(true);
}

void MetronomeEngine::stop() {
    if (!running_.load()) {
        return;
    }

    running_.store(false);

    PaError err = Pa_StopStream(stream_);
    if (err != paNoError) {
        throw std::runtime_error(Pa_GetErrorText(err));
    }
}

void MetronomeEngine::set_bpm(int bpm) {
    bpm_.store(bpm);
    rebuild_timing();
}

int MetronomeEngine::get_meter() const {
    return beats_per_bar_;
}

void MetronomeEngine::set_meter(int beats) {
    if (beats < 1) beats = 1;
    beats_per_bar_ = beats;
}

void MetronomeEngine::set_denominator(int d) {
    if (d < 1) d = 1;
    denominator_ = d;
    rebuild_timing();
}

int MetronomeEngine::get_denominator() const {
    return denominator_;
}

int MetronomeEngine::get_bpm() const {
    return bpm_.load();
}

bool MetronomeEngine::is_running() const {
    return running_.load();
}

int MetronomeEngine::pa_callback(
    const void*,
    void* output,
    unsigned long framesPerBuffer,
    const PaStreamCallbackTimeInfo*,
    PaStreamCallbackFlags,
    void* userData
) {
    auto* engine = static_cast<MetronomeEngine*>(userData);
    return engine->render(static_cast<float*>(output), framesPerBuffer);
}

int MetronomeEngine::render(float* out, unsigned long framesPerBuffer) {
    std::fill(out, out + framesPerBuffer, 0.0f);

    if (!running_.load()) {
        return paContinue;
    }

    const uint64_t spb = samples_per_beat_.load();

    for (unsigned long i = 0; i < framesPerBuffer; ++i) {
        if (global_sample_index_ % spb == 0) {
            if (beat_in_bar_ % 3 == 0) {
                accent_active_ = true;
                accent_pos_ = 0;
            } else {
                click_active_ = true;
                click_pos_ = 0;
            }

            beat_in_bar_ = (beat_in_bar_ + 1) % beats_per_bar_;
        }

        float sample = 0.0f;

        if (accent_active_) {
            sample += accent_[accent_pos_++];
            if (accent_pos_ >= accent_.size()) {
                accent_active_ = false;
                accent_pos_ = 0;
            }
        }

        if (click_active_) {
            sample += click_[click_pos_++];
            if (click_pos_ >= click_.size()) {
                click_active_ = false;
                click_pos_ = 0;
            }
        }

        out[i] = std::clamp(sample, -1.0f, 1.0f);
        ++global_sample_index_;
    }

    return paContinue;
}