import victory from "./victory.png";
import level from "./level.png";
import vip from "./vip.png";
import quickMatchImg from "./Quick Match.png";
import roomImg from "./Room.png";
const URLS = [victory, level, vip, quickMatchImg, roomImg];

export async function preloadUiImages(): Promise<void> {
  await Promise.all(
    URLS.map(async (src) => {
      try {
        const img = new Image();
        img.src = src;

        if ("decode" in img) {
          await img.decode();
        } else {
          await new Promise<void>((res, rej) => {
            img.onload = () => res();
            img.onerror = () => rej();
          });
        }
      } catch {
        // ignore
      }
    })
  );
}
