import { useAudio } from "@/hooks/useAudio";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Volume2, VolumeX, Music, Zap } from "lucide-react";

export function AudioControls() {
  const { settings, toggleBackgroundMusic, toggleSoundEffects, setVolume } = useAudio();

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-lg flex items-center space-x-2">
          <Volume2 className="w-5 h-5" />
          <span>Audio Settings</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Background Music Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Music className="w-4 h-4 text-blue-500" />
            <Label htmlFor="background-music" className="text-sm">
              Background Music
            </Label>
          </div>
          <Switch
            id="background-music"
            checked={settings.backgroundMusic}
            onCheckedChange={toggleBackgroundMusic}
          />
        </div>

        {/* Sound Effects Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <Label htmlFor="sound-effects" className="text-sm">
              Sound Effects
            </Label>
          </div>
          <Switch
            id="sound-effects"
            checked={settings.soundEffects}
            onCheckedChange={toggleSoundEffects}
          />
        </div>

        {/* Volume Control */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            {settings.volume === 0 ? (
              <VolumeX className="w-4 h-4 text-gray-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-gray-300" />
            )}
            <Label className="text-sm">Volume</Label>
            <span className="text-xs text-gray-400 ml-auto">
              {Math.round(settings.volume * 100)}%
            </span>
          </div>
          <Slider
            value={[settings.volume]}
            onValueChange={(value) => setVolume(value[0])}
            max={1}
            min={0}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* Quick Actions */}
        <div className="flex space-x-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVolume(0)}
            className="flex-1"
          >
            <VolumeX className="w-3 h-3 mr-1" />
            Mute
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVolume(0.5)}
            className="flex-1"
          >
            <Volume2 className="w-3 h-3 mr-1" />
            50%
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}