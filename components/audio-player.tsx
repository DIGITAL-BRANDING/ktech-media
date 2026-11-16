export function AudioPlayer({ src, title }: { src: string; title: string }) {
  return <audio className="station-audio-player" controls preload="none" aria-label={title}><source src={src} />Your browser does not support the audio player.</audio>;
}
