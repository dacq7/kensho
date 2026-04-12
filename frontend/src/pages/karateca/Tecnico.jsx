import { useCallback, useEffect, useState } from 'react';
import api from '../../lib/api';
import { KyuBadge } from '../../lib/kyuUtils';
import { Badge, Card, SkeletonCard } from '../../components/ui';

const KYU_TECNICO = {
  '8kyu': {
    kata: ['Taikyoku Shodan', 'Taikyoku Nidan', 'Taikyoku Sandan'],
    kumite: [
      'Gohon Kumite (Jōdan, Chūdan, Mae-geri)',
    ],
    kihon: [
      'Avanza en Zenkutsu-dachi Oi-zuki Chūdan',
      'Retrocede en Zenkutsu-dachi Age-uke',
      'Avanza en Zenkutsu-dachi Soto Ude-uke',
      'Retrocede en Kōkutsu-dachi Shuto-uke',
      'Avanza en Zenkutsu-dachi Uchi Ude-uke',
      'Retrocede en Zenkutsu-dachi Gedan-barai',
      'Avanza en Zenkutsu-dachi Mae-geri Chūdan Keage',
      'Gira y avanza igual',
      'Avanza en Kiba-dachi Yoko-geri Chūdan Keage (izq. y der.)',
      'Avanza en Kiba-dachi Yoko-geri Chūdan Kekomi (izq. y der.)',
    ],
  },
  '7kyu': {
    kata: ['Heian Shodan'],
    kumite: [
      'Gohon Kumite (Jōdan, Chūdan, Mae-geri)',
      'Sanbon Kumite Ichi',
    ],
    kihon: [
      'Avanza en Zenkutsu-dachi Gyaku-zuki Chūdan',
      'Retrocede en Zenkutsu-dachi Age-uke, Gyaku-zuki Chūdan',
      'Avanza en Zenkutsu-dachi Soto Ude-uke, Gyaku-zuki Chūdan',
      'Retrocede en Kōkutsu-dachi Shuto-uke',
      'Avanza en Zenkutsu-dachi Uchi Ude-uke, Gyaku-zuki Chūdan',
      'Retrocede en Zenkutsu-dachi Gedan-barai, Gyaku-zuki Chūdan',
      'Avanza en Zenkutsu-dachi Mae-geri Chūdan Keage',
      'Gira y avanza en Zenkutsu-dachi Mawashi-geri Chūdan Keage',
      'Avanza en Kiba-dachi Yoko-geri Chūdan Keage (izq. y der.)',
      'Avanza en Kiba-dachi Yoko-geri Chūdan Kekomi (izq. y der.)',
    ],
  },
  '6kyu': {
    kata: ['Heian Nidan'],
    kumite: [
      'Gohon Kumite (Jōdan, Chūdan, Mae-geri)',
      'Sanbon Kumite Ichi, Ni',
    ],
    kihon: [
      'Avanza en Zenkutsu-dachi Oi-zuki Sanbon-zuki Jōdan, Chūdan, Chūdan',
      'Retrocede en Zenkutsu-dachi Age-uke, Gyaku-zuki Chūdan',
      'Avanza en Zenkutsu-dachi Soto Ude-uke → Kiba-dachi Empi-uchi',
      'Retrocede en Kōkutsu-dachi Shuto-uke → Zenkutsu-dachi Nukite',
      'Avanza en Zenkutsu-dachi Uchi Ude-uke, Gyaku-zuki Chūdan',
      'Retrocede en Zenkutsu-dachi Gedan-barai, Mae-geri Chūdan Keage, Gyaku-zuki Chūdan',
      'Avanza en Zenkutsu-dachi Mae-geri Chūdan Keage, Oi-zuki Chūdan',
      'Gira y avanza Mawashi-geri Chūdan, Gyaku-zuki Chūdan',
      'Avanza en Zenkutsu-dachi Mae-geri Ren-geri Keage Chūdan, Jōdan',
      'Gira y avanza en Zenkutsu-dachi Mawashi-geri Ren-geri Chūdan, Jōdan',
      'Avanza en Kiba-dachi Yoko-geri Jōdan Keage (izq. y der.)',
      'Avanza en Kiba-dachi Yoko-geri Chūdan Kekomi (izq. y der.)',
    ],
  },
  '5kyu': {
    kata: ['Heian Sandan'],
    kumite: [
      'Gohon Kumite (Jōdan, Chūdan, Mae-geri)',
      'Sanbon Kumite Ichi, Ni, San',
    ],
    kihon: [
      'Avanza en Zenkutsu-dachi Oi-zuki Sanbon-zuki Jōdan, Chūdan, Chūdan',
      'Retrocede en Zenkutsu-dachi Age-uke, Mae-geri Chūdan Keage, Gyaku-zuki Chūdan',
      'Avanza en Zenkutsu-dachi Soto Ude-uke → Kiba-dachi Empi-uchi',
      'Retrocede en Kōkutsu-dachi Shuto-uke → Kizami Mae-geri Chūdan Keage, Nukite',
      'Avanza en Zenkutsu-dachi Uchi Ude-uke, Gyaku-zuki Chūdan',
      'Retrocede en Zenkutsu-dachi Gedan-barai, Mae-geri Chūdan Keage, Gyaku-zuki Chūdan',
      'Avanza en Zenkutsu-dachi Mae-geri Chūdan Keage, Oi-zuki Chūdan',
      'Gira y avanza Mawashi-geri Jōdan, Gyaku-zuki Chūdan',
      'Avanza en Zenkutsu-dachi Mae-geri Ren-geri Keage Chūdan, Jōdan',
      'Gira y avanza Mawashi-geri Ren-geri Chūdan, Jōdan',
      'Avanza en Kiba-dachi Yoko-geri Jōdan Keage (izq. y der.)',
      'Avanza en Kiba-dachi Yoko-geri Chūdan Kekomi (izq. y der.)',
    ],
  },
  '4kyu': {
    kata: ['Heian Yondan'],
    kumite: [
      'Gohon Kumite (Jōdan, Chūdan, Mae-geri)',
      'Sanbon Kumite Ichi, Ni, San, Shi',
    ],
    kihon: [
      'Avanza en Zenkutsu-dachi Oi-zuki Sanbon-zuki Jōdan, Chūdan, Chūdan',
      'Retrocede en Zenkutsu-dachi Age-uke, Mae-geri Chūdan, Gyaku-zuki Chūdan',
      'Avanza Soto Ude-uke → Kiba-dachi Empi-uchi, Uraken-uchi',
      'Retrocede Kōkutsu-dachi Shuto-uke → Kizami Mae-geri Chūdan Keage, Nukite',
      'Avanza Uchi Ude-uke, Kizami Mae-geri Chūdan Keage, Gyaku-zuki Chūdan',
      'Retrocede Gedan-barai, Mae-geri Chūdan Keage, Gyaku-zuki Chūdan',
      'Avanza Mae-geri Chūdan Keage, Oi-zuki Chūdan',
      'Gira y avanza Mawashi-geri Jōdan, Gyaku-zuki Chūdan',
      'Avanza Mae-geri Ren-geri Keage Chūdan, Jōdan',
      'Gira y avanza Mawashi-geri Ren-geri Chūdan, Jōdan',
      'Avanza en Kiba-dachi Yoko-geri Jōdan Keage (izq. y der.)',
      'Avanza en Kiba-dachi Yoko-geri Chūdan Kekomi (izq. y der.)',
    ],
  },
  '3kyu': {
    kata: ['Heian Godan', 'Tekki Shodan'],
    kumite: [
      'Gohon Kumite (Jōdan, Chūdan, Mae-geri)',
      'Sanbon Kumite Ichi, Ni, San, Shi, Go',
    ],
    kihon: [
      'Avanza Oi-zuki Sanbon-zuki Jōdan, Chūdan, Chūdan',
      'Retrocede Age-uke, Mae-geri Chūdan Keage, Gyaku-zuki Chūdan',
      'Avanza Soto Ude-uke → Kiba-dachi Empi-uchi, Uraken-uchi → Zenkutsu-dachi Gyaku-zuki Chūdan',
      'Retrocede Kōkutsu-dachi Shuto-uke → Kizami Mae-geri Chūdan Keage, Nukite',
      'Avanza Uchi Ude-uke, Kizami Mae-geri Chūdan Keage, Gyaku-zuki Chūdan',
      'Retrocede Gedan-barai, Mae-geri Chūdan Keage, Gyaku-zuki Chūdan',
      'Avanza Haito-uchi',
      'Retrocede Shuto-uchi',
      'Avanza Mae-geri Ren-geri Keage Chūdan, Jōdan',
      'Gira y avanza Kizami Mae-geri Chūdan Keage, Mae-geri Jōdan Keage',
      'Avanza Mawashi-geri Ren-geri Chūdan, Jōdan',
      'Gira y avanza Kizami Mawashi-geri Chūdan, Mawashi-geri Jōdan',
      'Avanza en Kiba-dachi Yoko-geri Jōdan Keage (izq. y der.)',
      'Avanza en Kiba-dachi Yoko-geri Chūdan Kekomi (izq. y der.)',
      'Avanza Yoko-geri Chūdan Kekomi + Mawashi-geri Jōdan pierna contraria, Gyaku-zuki',
      'Gira y avanza Mawashi-geri Jōdan + Yoko-geri Chūdan Kekomi pierna contraria, Gyaku-zuki',
      'Avanza Ushiro-geri Chūdan',
      'Desde Zenkutsu-dachi: Mae-geri Jōdan + Yoko-geri Jōdan (sin apoyar)',
      'Shi-hon-zuki: Gyaku-zuki 4x2 girando 360° (3 series por lado)',
    ],
  },
  '2kyu': {
    kata: ['Bassai Dai'],
    kumite: [
      'Gohon Kumite (Jōdan, Chūdan, Mae-geri)',
      'Sanbon Kumite Ichi, Ni, San, Shi, Go',
      'Ippon Kumite',
    ],
    kihon: [
      'Avanza Oi-zuki Sanbon-zuki Jōdan, Chūdan, Chūdan',
      'Retrocede Age-uke, Kizami Mae-geri Chūdan Keage, Gyaku-zuki Chūdan',
      'Avanza Soto Ude-uke → Kiba-dachi Empi-uchi, Uraken-uchi → Gyaku-zuki Chūdan',
      'Retrocede Kōkutsu-dachi Shuto-uke → Kizami Mae-geri Chūdan Keage, Nukite',
      'Avanza Uchi Ude-uke, Kizami Mawashi-geri Chūdan, Gyaku-zuki Chūdan',
      'Retrocede Gedan-barai, Mae-geri Chūdan Keage, Gyaku-zuki Chūdan',
      'Avanza Haito-uchi, Gyaku Haito-uchi',
      'Retrocede Shuto-uchi, Gyaku Shuto-uchi',
      'Avanza Mae-geri Ren-geri Keage Chūdan, Jōdan',
      'Gira y avanza Kizami Mae-geri Chūdan Keage, Mae-geri Jōdan Keage',
      'Avanza Mawashi-geri Ren-geri Chūdan, Jōdan',
      'Gira y avanza Kizami Mawashi-geri Chūdan, Mawashi-geri Jōdan',
      'Avanza en Kiba-dachi Yoko-geri Jōdan Keage (izq. y der.)',
      'Avanza en Kiba-dachi Yoko-geri Chūdan Kekomi (izq. y der.)',
      'Avanza Yoko-geri Chūdan Kekomi + Mawashi-geri Jōdan pierna contraria, Gyaku-zuki',
      'Gira y avanza Mawashi-geri Jōdan + Yoko-geri Chūdan Kekomi pierna contraria, Gyaku-zuki',
      'Avanza Ushiro-geri Chūdan',
      'Desde Zenkutsu-dachi: Mae-geri Jōdan + Yoko-geri Jōdan (sin apoyar)',
      'Shi-hon-zuki: Gyaku-zuki 4x2 girando 360° (3 series por lado)',
    ],
  },
  '1kyu': {
    kata: ['Bassai Dai', 'Jion', 'Enpi', 'Kankū Dai'],
    kumite: [
      'Gohon Kumite (Jōdan, Chūdan, Mae-geri)',
      'Sanbon Kumite Ichi, Ni, San, Shi, Go',
      'Ippon Kumite',
      'Jiyu Kumite',
    ],
    kihon: [
      'Avanza Oi-zuki Sanbon-zuki Jōdan, Chūdan, Chūdan',
      'Retrocede Age-uke, Kizami Mae-geri Chūdan Keage, Gyaku-zuki Chūdan',
      'Avanza Soto Ude-uke → Kiba-dachi Empi-uchi, Uraken-uchi → Gyaku-zuki Chūdan',
      'Retrocede Kōkutsu-dachi Shuto-uke → Kizami Mae-geri Chūdan Keage, Nukite',
      'Avanza Uchi Ude-uke, Kizami Mawashi-geri Chūdan, Gyaku-zuki Chūdan',
      'Retrocede Gedan-barai, Mae-geri Chūdan Keage, Gyaku-zuki Chūdan',
      'Avanza Haito-uchi, Gyaku Haito-uchi',
      'Retrocede Shuto-uchi, Gyaku Haito-uchi',
      'Avanza Kizami Mae-geri Chūdan Keage, Mae-geri Ren-geri Keage Chūdan, Jōdan',
      'Gira y avanza Kizami Mae-geri Chūdan Keage, Mae-geri Jōdan Keage',
      'Avanza Mawashi-geri Ren-geri Chūdan, Jōdan',
      'Gira y avanza Kizami Mawashi-geri Chūdan, Mawashi-geri Jōdan',
      'Avanza en Kiba-dachi Yoko-geri Jōdan Keage (izq. y der.)',
      'Avanza en Kiba-dachi Yoko-geri Chūdan Kekomi (izq. y der.)',
      'Avanza Yoko-geri Jōdan Keage + Mawashi-geri Jōdan pierna contraria, Gyaku-zuki',
      'Gira y avanza Mawashi-geri Jōdan + Yoko-geri Chūdan Kekomi pierna contraria, Gyaku-zuki',
      'Avanza Ushiro-geri Chūdan, Gyaku-zuki Chūdan',
      'Desde Zenkutsu-dachi: Mae-geri Jōdan + Yoko-geri Jōdan + Yoko-geri Kekomi (sin apoyar)',
      'Shi-hon-zuki: Gyaku-zuki 4x2 girando 360° (3 series por lado)',
    ],
  },
};

const SIGUIENTE_COLOR = {
  '8kyu': '7kyu',
  'pinta_7kyu': '7kyu',
  '7kyu': '6kyu',
  'pinta_6kyu': '6kyu',
  '6kyu': '5kyu',
  'pinta_5kyu': '5kyu',
  '5kyu': '4kyu',
  'pinta_4kyu': '4kyu',
  '4kyu': '3kyu',
  'pinta_3kyu': '3kyu',
  '3kyu': '2kyu',
  '2kyu': '1kyu',
  '1kyu': '1dan',
};

const PINTA_HEREDA_DE = {
  'pinta_7kyu': '7kyu',
  'pinta_6kyu': '6kyu',
  'pinta_5kyu': '5kyu',
  'pinta_4kyu': '4kyu',
  'pinta_3kyu': '3kyu',
};

export default function KaratecaTecnicoPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: d } = await api.get('/dashboard/karateca');
      setData(d);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo cargar tu perfil');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const kyuActual = data?.karateca?.kyuActual ?? '8kyu';
  const preExamen = Boolean(data?.karateca?.preExamenAprobado);

  const siguienteColor = SIGUIENTE_COLOR[kyuActual];
  const claveContenido = PINTA_HEREDA_DE[kyuActual] || kyuActual;
  const contenido = KYU_TECNICO[claveContenido] || null;

  if (loading) {
    return (
      <div className="min-h-full p-3 md:p-6 lg:p-8">
        <div className="mx-auto max-w-[42rem]">
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-full p-3 md:p-6 lg:p-8">
        <div className="rounded-r-md border-l-4 border-dojo-rojo bg-dojo-rojo/10 px-4 py-3 text-sm text-red-200" role="alert">
          {error || 'Sin datos'}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[42rem] min-h-full p-3 md:p-6 lg:p-8">
      <h1 className="mb-4 text-lg font-semibold tracking-tight text-dojo-dorado md:text-xl lg:text-2xl">
        Contenido técnico
      </h1>

      {/* ── Header ── */}
      <Card className="mb-6 border-dojo-dorado/25 md:mb-8">
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <KyuBadge kyu={kyuActual} />
          {siguienteColor && (
            <>
              <span className="text-xl font-bold text-dojo-dorado" aria-hidden>→</span>
              <KyuBadge kyu={siguienteColor} />
            </>
          )}
        </div>
        {preExamen && (
          <div className="mt-3">
            <Badge variant="gold">⭐ Autorizado para examen</Badge>
          </div>
        )}
      </Card>

      {!contenido ? (
        <p className="text-sm text-white/50">
          No hay programa de kyu cargado para tu grado actual. Consulta al Sensei.
        </p>
      ) : (
        <>
          {/* ── Kata ── */}
          <Card className="mb-4 md:mb-5">
            <h2 className="mb-3 text-base font-bold text-dojo-dorado md:text-lg">
              Kata para el ascenso
            </h2>
            <ul className="m-0 list-none p-0 pl-1 text-white/85" style={{ lineHeight: 1.65 }}>
              {contenido.kata.map((k) => (
                <li key={k} className="mb-1.5">
                  <span className="mr-1.5" aria-hidden>📖</span>
                  {k}
                </li>
              ))}
            </ul>
          </Card>

          {/* ── Kumite ── */}
          <Card className="mb-4 md:mb-5">
            <h2 className="mb-3 text-base font-bold text-dojo-dorado md:text-lg">
              Kumite requerido
            </h2>
            <ul className="m-0 list-none p-0 pl-1 text-white/85" style={{ lineHeight: 1.65 }}>
              {contenido.kumite.map((k) => (
                <li key={k} className="mb-1.5">
                  <span className="mr-1.5" aria-hidden>⚔️</span>
                  {k}
                </li>
              ))}
            </ul>
          </Card>

          {/* ── Kihon ── */}
          <Card className="flex min-h-0 flex-col">
            <h2 className="mb-3 text-base font-bold text-dojo-dorado md:text-lg">
              Kihon a preparar
            </h2>
            <ol
              className="m-0 max-h-[min(70vh,28rem)] overflow-y-auto pl-5 pr-1 text-white/85 md:max-h-none md:overflow-visible"
              style={{ lineHeight: 1.55 }}
            >
              {contenido.kihon.map((line, idx) => (
                <li key={`${idx}-${line.slice(0, 24)}`} className="mb-2.5">
                  <span className="flex items-start gap-2.5">
                    <span
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-2 border-dojo-dorado/50 bg-transparent"
                      aria-hidden
                    />
                    <span>{line}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </>
      )}
    </div>
  );
}
