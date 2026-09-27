"use client";

import { Pause, Play, Square } from "lucide-react";
// 音频播放器组件，用于播放语音消息
import { useRef, useState } from "react";
import { Button } from "../../../../../../../../../components/ui/button.js";
export default function AudioPlayer({
  audioUrl,
  duration
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);
  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };
  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };
  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };
  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };
  const formatTime = time => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };
  return <div className="flex items-center gap-2 bg-gray-50 p-2 rounded">
      <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} onEnded={handleEnded} preload="metadata">
        <source src={audioUrl} type="audio/mpeg" />
        <source src={audioUrl} type="audio/mp3" />
        您的浏览器不支持音频播放。
      </audio>

      <div className="flex items-center gap-1">
        {isPlaying ? <Button variant="outline" size="sm" onClick={handlePause}>
            <Pause className="h-3 w-3" />
          </Button> : <Button variant="outline" size="sm" onClick={handlePlay}>
            <Play className="h-3 w-3" />
          </Button>}

        <Button variant="outline" size="sm" onClick={handleStop}>
          <Square className="h-3 w-3" />
        </Button>
      </div>

      <div className="text-xs text-gray-500">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>
    </div>;
}
