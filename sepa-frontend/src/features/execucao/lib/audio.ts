type CtorAudioContext = typeof AudioContext;

let contexto: AudioContext | null = null;

function obterContexto(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const janela = window as Window & { webkitAudioContext?: CtorAudioContext };
  const Ctor = window.AudioContext ?? janela.webkitAudioContext;
  if (!Ctor) return null;
  try {
    contexto ??= new Ctor();
    if (contexto.state === 'suspended') void contexto.resume();
    return contexto;
  } catch {
    return null;
  }
}

function tocarTom(frequencia: number, duracao: number, volume: number, atraso = 0): void {
  const ctx = obterContexto();
  if (!ctx) return;
  try {
    const inicio = ctx.currentTime + atraso;
    const oscilador = ctx.createOscillator();
    const ganho = ctx.createGain();
    oscilador.type = 'sine';
    oscilador.frequency.setValueAtTime(frequencia, inicio);
    ganho.gain.setValueAtTime(0, inicio);
    ganho.gain.linearRampToValueAtTime(Math.min(0.25, volume * 0.25), inicio + 0.02);
    ganho.gain.exponentialRampToValueAtTime(0.0001, inicio + duracao);
    oscilador.connect(ganho);
    ganho.connect(ctx.destination);
    oscilador.start(inicio);
    oscilador.stop(inicio + duracao + 0.05);
  } catch {
    // Áudio indisponível: a atividade continua sem som.
  }
}

/** Som curto e suave de acerto (sem arquivos externos). */
export function tocarAcerto(volume: number): void {
  tocarTom(660, 0.14, volume);
  tocarTom(880, 0.18, volume, 0.12);
}

/** Som grave discreto de erro. */
export function tocarErro(volume: number): void {
  tocarTom(240, 0.22, volume);
}

/** Som de conclusão da atividade. */
export function tocarConclusao(volume: number): void {
  tocarTom(523, 0.16, volume);
  tocarTom(659, 0.16, volume, 0.14);
  tocarTom(784, 0.24, volume, 0.28);
}

export function liberarContextoAudio(): void {
  if (!contexto) return;
  void contexto.close().catch(() => undefined);
  contexto = null;
}
