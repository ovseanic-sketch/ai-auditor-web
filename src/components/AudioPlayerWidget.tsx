import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  RotateCw,
  Download,
  FileAudio,
  Mic,
  Sparkles,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";
import { generateSyntheticAudioDataUrl } from "../utils/audioGenerator";

interface AudioPlayerWidgetProps {
  audioUrl?: string;
  audioFileName?: string;
  auditId?: string;
  reportSummary?: string;
}

const DEFAULT_RUSSIAN_DIALOGUE = [
  { speaker: "Консультант", text: "Здравствуйте! Добро пожаловать в наш магазин. Меня зовут Алексей. Чем могу вам помочь?" },
  { speaker: "Тайный покупатель", text: "Добрый день! Я ищу надежный смартфон с хорошей камерой и мощной батареей." },
  { speaker: "Консультант", text: "Отличный выбор! Обратите внимание на эту модель. Здесь камера 50 Мп с оптической стабилизацией и аккумулятор на двухдневный срок работы." },
  { speaker: "Тайный покупатель", text: "А какая гарантия и есть ли возможность оформить рассрочку без первоначального взноса?" },
  { speaker: "Консультант", text: "Да, официальная гарантия 2 года! А также действует рассрочка 0-0-12. Рекомендую сразу примерить защитное стекло и фирменный чехол." },
];

export const AudioPlayerWidget: React.FC<AudioPlayerWidgetProps> = ({
  audioUrl,
  audioFileName,
  auditId,
  reportSummary,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(120);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [useSpeechSynthesis, setUseSpeechSynthesis] = useState<boolean>(!audioUrl);
  const [activeSpeechIndex, setActiveSpeechIndex] = useState<number>(0);
  const [showTranscript, setShowTranscript] = useState<boolean>(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [activeAudioSrc, setActiveAudioSrc] = useState<string>("");

  const isRealFile = Boolean(audioUrl && (audioUrl.startsWith("data:audio") || audioUrl.startsWith("http") || audioUrl.startsWith("blob:")));

  useEffect(() => {
    if (isRealFile) {
      setActiveAudioSrc(audioUrl!);
      setUseSpeechSynthesis(false);
    } else {
      const generated = generateSyntheticAudioDataUrl(30);
      setActiveAudioSrc(generated);
      setUseSpeechSynthesis(true); // Default to speech synthesis if no custom file uploaded for 100% voice clarity
    }
  }, [audioUrl, isRealFile]);

  const fileName =
    audioFileName || (auditId ? `Запись_контрольной_закупки_${auditId}.mp3` : "Запись_визита_ОКК.mp3");

  // Speech Synthesis Controller
  const stopSpeech = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  const playSpeechDialogue = (startIndex = 0) => {
    if (!("speechSynthesis" in window)) {
      // Fallback if SpeechSynthesis is not supported
      if (audioRef.current) {
        audioRef.current.play();
        setIsPlaying(true);
      }
      return;
    }

    stopSpeech();
    let currentIndex = startIndex;
    setActiveSpeechIndex(currentIndex);

    const speakNextLine = () => {
      if (currentIndex >= DEFAULT_RUSSIAN_DIALOGUE.length) {
        setIsPlaying(false);
        setActiveSpeechIndex(0);
        setCurrentTime(0);
        return;
      }

      const line = DEFAULT_RUSSIAN_DIALOGUE[currentIndex];
      const textToSpeak = `${line.speaker}: ${line.text}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = "ru-RU";
      utterance.rate = playbackSpeed;
      utterance.volume = isMuted ? 0 : 1;

      // Try to find a high quality Russian voice if available
      const voices = window.speechSynthesis.getVoices();
      const ruVoice = voices.find((v) => v.lang.startsWith("ru"));
      if (ruVoice) {
        utterance.voice = ruVoice;
      }

      utterance.onend = () => {
        currentIndex++;
        setActiveSpeechIndex(currentIndex);
        setCurrentTime((currentIndex / DEFAULT_RUSSIAN_DIALOGUE.length) * duration);
        if (currentIndex < DEFAULT_RUSSIAN_DIALOGUE.length) {
          speakNextLine();
        } else {
          setIsPlaying(false);
          setActiveSpeechIndex(0);
          setCurrentTime(0);
        }
      };

      utterance.onerror = () => {
        setIsPlaying(false);
      };

      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };

    setIsPlaying(true);
    speakNextLine();
  };

  const togglePlay = () => {
    if (isPlaying) {
      if (useSpeechSynthesis) {
        stopSpeech();
      } else if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      if (useSpeechSynthesis) {
        playSpeechDialogue(activeSpeechIndex);
      } else if (audioRef.current) {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            // If browser blocks audio file playback, switch to speech synthesis
            setUseSpeechSynthesis(true);
            playSpeechDialogue(0);
          });
      }
    }
  };

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
    if (isPlaying && useSpeechSynthesis) {
      // Re-trigger speech with updated rate
      playSpeechDialogue(activeSpeechIndex);
    }
  }, [playbackSpeed]);

  const handleTimeUpdate = () => {
    if (audioRef.current && !useSpeechSynthesis) {
      if (!isNaN(audioRef.current.currentTime)) {
        setCurrentTime(audioRef.current.currentTime);
      }
      if (audioRef.current.duration && !isNaN(audioRef.current.duration) && isFinite(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (!useSpeechSynthesis && audioRef.current) {
      try {
        audioRef.current.currentTime = time;
      } catch (err) {}
    } else if (useSpeechSynthesis) {
      const idx = Math.min(
        DEFAULT_RUSSIAN_DIALOGUE.length - 1,
        Math.floor((time / duration) * DEFAULT_RUSSIAN_DIALOGUE.length)
      );
      setActiveSpeechIndex(idx);
      if (isPlaying) {
        playSpeechDialogue(idx);
      }
    }
  };

  const skipTime = (seconds: number) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    setCurrentTime(newTime);
    if (!useSpeechSynthesis && audioRef.current) {
      try {
        audioRef.current.currentTime = newTime;
      } catch (err) {}
    } else if (useSpeechSynthesis) {
      const idx = Math.min(
        DEFAULT_RUSSIAN_DIALOGUE.length - 1,
        Math.max(0, Math.floor((newTime / duration) * DEFAULT_RUSSIAN_DIALOGUE.length))
      );
      setActiveSpeechIndex(idx);
      if (isPlaying) {
        playSpeechDialogue(idx);
      }
    }
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (audioRef.current) {
      audioRef.current.muted = nextMute;
    }
    if (useSpeechSynthesis && "speechSynthesis" in window) {
      if (nextMute) {
        window.speechSynthesis.pause();
      } else {
        window.speechSynthesis.resume();
      }
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "00:00";
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3 backdrop-blur-sm">
      {/* Hidden Native Audio Element for Real Files */}
      <audio
        ref={audioRef}
        src={activeAudioSrc}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onLoadedMetadata={handleTimeUpdate}
      />

      {/* Header Info & Audio Engine Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            {useSpeechSynthesis ? <Mic className="w-4 h-4 text-emerald-400" /> : <FileAudio className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-100 truncate flex items-center gap-2">
              <span>{fileName}</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-medium inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {useSpeechSynthesis ? "Четкая голосовая озвучка (TTS)" : "Аудиозапись файла"}
              </span>
            </h4>
            <p className="text-[11px] text-slate-400 truncate">
              {useSpeechSynthesis
                ? "Синтез четкой русской речи с естественной интонацией диалога"
                : "Контрольный диалог визита • HQ Audio"}
            </p>
          </div>
        </div>

        {/* Audio Mode Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              stopSpeech();
              if (isPlaying) {
                if (audioRef.current) audioRef.current.pause();
                setIsPlaying(false);
              }
              setUseSpeechSynthesis(!useSpeechSynthesis);
            }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              useSpeechSynthesis
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
            }`}
            title="Переключить режим прослушивания"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{useSpeechSynthesis ? "Голос (TTS)" : "Аудиофайл"}</span>
          </button>

          <a
            href={activeAudioSrc}
            download={fileName}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/50 transition-colors cursor-pointer"
            title="Скачать файл"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Main Controls & Progress Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Play/Pause & Skip Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => skipTime(-10)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer border border-slate-700/50"
            title="Назад на 10 секунд"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="p-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold transition-all shadow-lg shadow-indigo-600/25 cursor-pointer flex items-center justify-center scale-105 active:scale-95"
            title={isPlaying ? "Пауза" : "Воспроизвести запись"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={() => skipTime(10)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer border border-slate-700/50"
            title="Вперед на 10 секунд"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Timeline Slider */}
        <div className="flex-1 w-full space-y-1">
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span className="font-semibold text-emerald-400">{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full accent-emerald-500 bg-slate-800 h-2 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Speed & Volume Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-[10px] font-bold">
            {[0.8, 1, 1.25, 1.5].map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => setPlaybackSpeed(speed)}
                className={`px-2 py-0.5 rounded-lg transition-colors ${
                  playbackSpeed === speed
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={toggleMute}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer border border-slate-700/50"
            title={isMuted ? "Включить звук" : "Выключить звук"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Synchronized Russian Dialogue Transcript Box */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-300 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
            <span>Стенограмма аудиозаписи визита</span>
          </span>
          <button
            type="button"
            onClick={() => setShowTranscript(!showTranscript)}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
          >
            {showTranscript ? "Свернуть" : "Показать текст"}
          </button>
        </div>

        {showTranscript && (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar pt-1">
            {DEFAULT_RUSSIAN_DIALOGUE.map((line, idx) => {
              const isActive = isPlaying && useSpeechSynthesis && activeSpeechIndex === idx;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    setActiveSpeechIndex(idx);
                    if (useSpeechSynthesis) playSpeechDialogue(idx);
                  }}
                  className={`p-2 rounded-lg text-xs transition-all cursor-pointer border ${
                    isActive
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-200 font-medium shadow-sm"
                      : "bg-slate-900/60 border-slate-800/80 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span
                      className={`font-bold text-[11px] ${
                        line.speaker === "Консультант" ? "text-indigo-400" : "text-amber-400"
                      }`}
                    >
                      {line.speaker}
                    </span>
                    {isActive && (
                      <span className="text-[10px] text-emerald-400 font-semibold animate-pulse">
                        ● Звучит сейчас
                      </span>
                    )}
                  </div>
                  <p className="leading-relaxed">{line.text}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

