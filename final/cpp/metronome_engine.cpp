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
      click_pos_(0.0),
      playback_rate_(1.0),
      normal_pitch_(1.0),
      accent_pitch_(1.25) {
    PaError err = Pa_Initialize();
    if (err != paNoError) {
        throw std::runtime_error(Pa_GetErrorText(err));
    }

    build_default_click();
    rebuild_timing();

    err = Pa_OpenDefaultStream(
        &stream_,
        0,
        1,
        paFloat32,
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

void MetronomeEngine::build_default_click() {
    const double duration_sec = 0.03;
    const size_t click_len = static_cast<size_t>(sample_rate_ * duration_sec);

    click_sample_.clear();
    click_sample_.resize(click_len);

    for (size_t i = 0; i < click_len; ++i) {
        double t = static_cast<double>(i) / sample_rate_;
        double env = std::exp(-60.0 * t);

        click_sample_[i] = static_cast<float>(
            0.35 * std::sin(2.0 * kPi * 1600.0 * t) * env
        );
    }
}

void MetronomeEngine::load_click_sample(const std::string& path) {
    (void)path;
    build_default_click();
}

void MetronomeEngine::set_accent_pitch(double ratio) {
    if (ratio < 0.1) {
        ratio = 0.1;
    }
    accent_pitch_ = ratio;
}

double MetronomeEngine::get_accent_pitch() const {
    return accent_pitch_;
}

void MetronomeEngine::rebuild_timing() {
    int bpm = bpm_.load();
    if (bpm < 1) {
        bpm = 1;
    }

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
    click_pos_ = 0.0;
    playback_rate_ = normal_pitch_;

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
    if (bpm < 1) {
        bpm = 1;
    }

    bpm_.store(bpm);
    rebuild_timing();
}

int MetronomeEngine::get_meter() const {
    return beats_per_bar_;
}

void MetronomeEngine::set_meter(int beats) {
    if (beats < 1) {
        beats = 1;
    }

    beats_per_bar_ = beats;
    beat_in_bar_ = 0;
}

void MetronomeEngine::set_denominator(int d) {
    if (d < 1) {
        d = 1;
    }

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

    // Safety fallback in case the sample was somehow cleared.
    if (click_sample_.empty()) {
        build_default_click();
    }

    const uint64_t spb = samples_per_beat_.load();

    for (unsigned long i = 0; i < framesPerBuffer; ++i) {
        if (global_sample_index_ % spb == 0) {
            click_active_ = true;
            click_pos_ = 0.0;

            if (beat_in_bar_ == 0) {
                playback_rate_ = accent_pitch_;
            } else {
                playback_rate_ = normal_pitch_;
            }

            beat_in_bar_ = (beat_in_bar_ + 1) % beats_per_bar_;
        }

        float sample = 0.0f;

        if (click_active_ && !click_sample_.empty()) {
            size_t i0 = static_cast<size_t>(click_pos_);

            if (i0 >= click_sample_.size()) {
                click_active_ = false;
                click_pos_ = 0.0;
            } else {
                size_t i1 = std::min(i0 + 1, click_sample_.size() - 1);
                double frac = click_pos_ - static_cast<double>(i0);

                sample = static_cast<float>(
                    click_sample_[i0] * (1.0 - frac) +
                    click_sample_[i1] * frac
                );

                click_pos_ += playback_rate_;
            }
        }

        out[i] = std::clamp(sample, -1.0f, 1.0f);
        ++global_sample_index_;
    }

    return paContinue;
}