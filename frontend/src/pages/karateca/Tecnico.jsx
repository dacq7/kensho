import { useCallback, useEffect, useState } from 'react';
import api from '../../lib/api';
import { GRADO_ORDER, KyuBadge } from '../../lib/kyuUtils';

const DOJO = { negro: '#111111', rojo: '#CC0000', dorado: '#C9A84C' };

const KYU_TECNICO = {
  '8kyu': {
    kata: ['Taikyoku Shodan', 'Taikyoku Nidan', 'Taikyoku Sandan'],
    kumite: [
      'Gohon Kumite Ichi',
      'Gohon Kumite Ni',
      'Gohon Kumite San',
    ],
    kihon: [
      'Avanza en Zenkutsu-dachi Oi-zuki Chudan',
      'Retrocede en Zenkutsu-dachi Age-uke',
      'Avanza en Zenkutsu-dachi Soto Ude-uke',
      'Retrocede en Kokutsu-dachi Shuto-uke',
      'Avanza en Zenkutsu-dachi Uchi Ude-uke',
      'Retrocede en Zenkutsu-dachi Gedan-barai',
      'Avanza en Zenkutsu-dachi Mae-geri Chudan Keage',
      'Gira y avanza igual',
      'Avanza en Kiba-dachi Yoko-geri Chudan Keage (izq. y der.)',
      'Avanza en Kiba-dachi Yoko-geri Chudan Kekomi (izq. y der.)',
    ],
  },
  '7kyu': {
    kata: ['Heian Shodan'],
    kumite: [
      'Gohon Kumite Ichi, Ni, San',
      'Sanbon Kumite Ichi',
    ],
    kihon: [
      'Avanza en Zenkutsu-dachi Gyaku-zuki Chudan',
      'Retrocede en Zenkutsu-dachi Age-uke, Gyaku-zuki Chudan',
      'Avanza en Zenkutsu-dachi Soto Ude-uke, Gyaku-zuki Chudan',
      'Retrocede en Kokutsu-dachi Shuto-uke',
      'Avanza en Zenkutsu-dachi Uchi Ude-uke, Gyaku-zuki Chudan',
      'Retrocede en Zenkutsu-dachi Gedan-barai, Gyaku-zuki Chudan',
      'Avanza en Zenkutsu-dachi Mae-geri Chudan Keage',
      'Gira y avanza en Zenkutsu-dachi Mawashi-geri Chudan Keage',
      'Avanza en Kiba-dachi Yoko-geri Chudan Keage (izq. y der.)',
      'Avanza en Kiba-dachi Yoko-geri Chudan Kekomi (izq. y der.)',
    ],
  },
  '6kyu': {
    kata: ['Heian Nidan'],
    kumite: [
      'Gohon Kumite Ichi, Ni, San',
      'Sanbon Kumite Ichi, Ni',
    ],
    kihon: [
      'Avanza en Zenkutsu-dachi Oi-zuki Sanbon-zuki Jodan, Chudan, Chudan',
      'Retrocede en Zenkutsu-dachi Age-uke, Gyaku-zuki Chudan',
      'Avanza en Zenkutsu-dachi Soto Ude-uke → Kiba-dachi Empi-uchi',
      'Retrocede en Kokutsu-dachi Shuto-uke → Zenkutsu-dachi Nukite',
      'Avanza en Zenkutsu-dachi Uchi Ude-uke, Gyaku-zuki Chudan',
      'Retrocede en Zenkutsu-dachi Gedan-barai, Mae-geri Chudan Keage, Gyaku-zuki Chudan',
      'Avanza en Zenkutsu-dachi Mae-geri Chudan Keage, Oi-zuki Chudan',
      'Gira y avanza Mawashi-geri Chudan, Gyaku-zuki Chudan',
      'Avanza en Zenkutsu-dachi Mae-geri Ren-geri Keage Chudan, Jodan',
      'Gira y avanza en Zenkutsu-dachi Mawashi-geri Ren-geri Chudan, Jodan',
      'Avanza en Kiba-dachi Yoko-geri Jodan Keage (izq. y der.)',
      'Avanza en Kiba-dachi Yoko-geri Chudan Kekomi (izq. y der.)',
    ],
  },
  '5kyu': {
    kata: ['Heian Sandan'],
    kumite: [
      'Gohon Kumite Ichi, Ni, San',
      'Sanbon Kumite Ichi, Ni, San',
    ],
    kihon: [
      'Avanza en Zenkutsu-dachi Oi-zuki Sanbon-zuki Jodan, Chudan, Chudan',
      'Retrocede en Zenkutsu-dachi Age-uke, Mae-geri Chudan Keage, Gyaku-zuki Chudan',
      'Avanza en Zenkutsu-dachi Soto Ude-uke → Kiba-dachi Empi-uchi',
      'Retrocede en Kokutsu-dachi Shuto-uke → Kizami Mae-geri Chudan Keage, Nukite',
      'Avanza en Zenkutsu-dachi Uchi Ude-uke, Gyaku-zuki Chudan',
      'Retrocede en Zenkutsu-dachi Gedan-barai, Mae-geri Chudan Keage, Gyaku-zuki Chudan',
      'Avanza en Zenkutsu-dachi Mae-geri Chudan Keage, Oi-zuki Chudan',
      'Gira y avanza Mawashi-geri Jodan, Gyaku-zuki Chudan',
      'Avanza en Zenkutsu-dachi Mae-geri Ren-geri Keage Chudan, Jodan',
      'Gira y avanza Mawashi-geri Ren-geri Chudan, Jodan',
      'Avanza en Kiba-dachi Yoko-geri Jodan Keage (izq. y der.)',
      'Avanza en Kiba-dachi Yoko-geri Chudan Kekomi (izq. y der.)',
    ],
  },
  '4kyu': {
    kata: ['Heian Yondan'],
    kumite: [
      'Gohon Kumite Ichi, Ni, San',
      'Sanbon Kumite Ichi, Ni, San, Shi',
    ],
    kihon: [
      'Avanza en Zenkutsu-dachi Oi-zuki Sanbon-zuki Jodan, Chudan, Chudan',
      'Retrocede en Zenkutsu-dachi Age-uke, Mae-geri Chudan, Gyaku-zuki Chudan',
      'Avanza Soto Ude-uke → Kiba-dachi Empi-uchi, Uraken-uchi',
      'Retrocede Kokutsu-dachi Shuto-uke → Kizami Mae-geri Chudan Keage, Nukite',
      'Avanza Uchi Ude-uke, Kizami Mae-geri Chudan Keage, Gyaku-zuki Chudan',
      'Retrocede Gedan-barai, Mae-geri Chudan Keage, Gyaku-zuki Chudan',
      'Avanza Mae-geri Chudan Keage, Oi-zuki Chudan',
      'Gira y avanza Mawashi-geri Jodan, Gyaku-zuki Chudan',
      'Avanza Mae-geri Ren-geri Keage Chudan, Jodan',
      'Gira y avanza Mawashi-geri Ren-geri Chudan, Jodan',
      'Avanza en Kiba-dachi Yoko-geri Jodan Keage (izq. y der.)',
      'Avanza en Kiba-dachi Yoko-geri Chudan Kekomi (izq. y der.)',
    ],
  },
  '3kyu': {
    kata: ['Heian Godan', 'Tekki Shodan'],
    kumite: [
      'Gohon Kumite Ichi, Ni, San',
      'Sanbon Kumite Ichi, Ni, San, Shi, Go',
    ],
    kihon: [
      'Avanza Oi-zuki Sanbon-zuki Jodan, Chudan, Chudan',
      'Retrocede Age-uke, Mae-geri Chudan Keage, Gyaku-zuki Chudan',
      'Avanza Soto Ude-uke → Kiba-dachi Empi-uchi, Uraken-uchi → Zenkutsu-dachi Gyaku-zuki Chudan',
      'Retrocede Kokutsu-dachi Shuto-uke → Kizami Mae-geri Chudan Keage, Nukite',
      'Avanza Uchi Ude-uke, Kizami Mae-geri Chudan Keage, Gyaku-zuki Chudan',
      'Retrocede Gedan-barai, Mae-geri Chudan Keage, Gyaku-zuki Chudan',
      'Avanza Haito-uchi',
      'Retrocede Shuto-uchi',
      'Avanza Mae-geri Ren-geri Keage Chudan, Jodan',
      'Gira y avanza Kizami Mae-geri Chudan Keage, Mae-geri Jodan Keage',
      'Avanza Mawashi-geri Ren-geri Chudan, Jodan',
      'Gira y avanza Kizami Mawashi-geri Chudan, Mawashi-geri Jodan',
      'Avanza en Kiba-dachi Yoko-geri Jodan Keage (izq. y der.)',
      'Avanza en Kiba-dachi Yoko-geri Chudan Kekomi (izq. y der.)',
      'Avanza Yoko-geri Chudan Kekomi + Mawashi-geri Jodan pierna contraria, Gyaku-zuki',
      'Gira y avanza Mawashi-geri Jodan + Yoko-geri Chudan Kekomi pierna contraria, Gyaku-zuki',
      'Avanza Ushiro-geri Chudan',
      'Desde Zenkutsu-dachi: Mae-geri Jodan + Yoko-geri Jodan (sin apoyar)',
      'Shi-hon-zuki: Gyaku-zuki 4x2 girando 360° (3 series por lado)',
    ],
  },
  '2kyu': {
    kata: ['Bassai Dai'],
    kumite: [
      'Gohon Kumite Ichi, Ni, San',
      'Sanbon Kumite Ichi, Ni, San, Shi, Go',
      'Ippon Kumite',
    ],
    kihon: [
      'Avanza Oi-zuki Sanbon-zuki Jodan, Chudan, Chudan',
      'Retrocede Age-uke, Kizami Mae-geri Chudan Keage, Gyaku-zuki Chudan',
      'Avanza Soto Ude-uke → Kiba-dachi Empi-uchi, Uraken-uchi → Gyaku-zuki Chudan',
      'Retrocede Kokutsu-dachi Shuto-uke → Kizami Mae-geri Chudan Keage, Nukite',
      'Avanza Uchi Ude-uke, Kizami Mawashi-geri Chudan, Gyaku-zuki Chudan',
      'Retrocede Gedan-barai, Mae-geri Chudan Keage, Gyaku-zuki Chudan',
      'Avanza Haito-uchi, Gyaku Haito-uchi',
      'Retrocede Shuto-uchi, Gyaku Shuto-uchi',
      'Avanza Mae-geri Ren-geri Keage Chudan, Jodan',
      'Gira y avanza Kizami Mae-geri Chudan Keage, Mae-geri Jodan Keage',
      'Avanza Mawashi-geri Ren-geri Chudan, Jodan',
      'Gira y avanza Kizami Mawashi-geri Chudan, Mawashi-geri Jodan',
      'Avanza en Kiba-dachi Yoko-geri Jodan Keage (izq. y der.)',
      'Avanza en Kiba-dachi Yoko-geri Chudan Kekomi (izq. y der.)',
      'Avanza Yoko-geri Chudan Kekomi + Mawashi-geri Jodan pierna contraria, Gyaku-zuki',
      'Gira y avanza Mawashi-geri Jodan + Yoko-geri Chudan Kekomi pierna contraria, Gyaku-zuki',
      'Avanza Ushiro-geri Chudan',
      'Desde Zenkutsu-dachi: Mae-geri Jodan + Yoko-geri Jodan (sin apoyar)',
      'Shi-hon-zuki: Gyaku-zuki 4x2 girando 360° (3 series por lado)',
    ],
  },
  '1kyu': {
    kata: ['Bassai Dai', 'Jion', 'Enpi', 'Kanku Dai'],
    kumite: [
      'Gohon Kumite Ichi, Ni, San',
      'Sanbon Kumite Ichi, Ni, San, Shi, Go',
      'Ippon Kumite',
      'Jiyu Kumite',
    ],
    kihon: [
      'Avanza Oi-zuki Sanbon-zuki Jodan, Chudan, Chudan',
      'Retrocede Age-uke, Kizami Mae-geri Chudan Keage, Gyaku-zuki Chudan',
      'Avanza Soto Ude-uke → Kiba-dachi Empi-uchi, Uraken-uchi → Gyaku-zuki Chudan',
      'Retrocede Kokutsu-dachi Shuto-uke → Kizami Mae-geri Chudan Keage, Nukite',
      'Avanza Uchi Ude-uke, Kizami Mawashi-geri Chudan, Gyaku-zuki Chudan',
      'Retrocede Gedan-barai, Mae-geri Chudan Keage, Gyaku-zuki Chudan',
      'Avanza Haito-uchi, Gyaku Haito-uchi',
      'Retrocede Shuto-uchi, Gyaku Haito-uchi',
      'Avanza Kizami Mae-geri Chudan Keage, Mae-geri Ren-geri Keage Chudan, Jodan',
      'Gira y avanza Kizami Mae-geri Chudan Keage, Mae-geri Jodan Keage',
      'Avanza Mawashi-geri Ren-geri Chudan, Jodan',
      'Gira y avanza Kizami Mawashi-geri Chudan, Mawashi-geri Jodan',
      'Avanza en Kiba-dachi Yoko-geri Jodan Keage (izq. y der.)',
      'Avanza en Kiba-dachi Yoko-geri Chudan Kekomi (izq. y der.)',
      'Avanza Yoko-geri Jodan Keage + Mawashi-geri Jodan pierna contraria, Gyaku-zuki',
      'Gira y avanza Mawashi-geri Jodan + Yoko-geri Chudan Kekomi pierna contraria, Gyaku-zuki',
      'Avanza Ushiro-geri Chudan, Gyaku-zuki Chudan',
      'Desde Zenkutsu-dachi: Mae-geri Jodan + Yoko-geri Jodan + Yoko-geri Kekomi (sin apoyar)',
      'Shi-hon-zuki: Gyaku-zuki 4x2 girando 360° (3 series por lado)',
    ],
  },
};

const PINTA_HEREDA_DE = {
  'pinta_7kyu': '8kyu',
  'pinta_6kyu': '7kyu',
  'pinta_5kyu': '6kyu',
  'pinta_4kyu': '5kyu',
  'pinta_3kyu': '4kyu',
};

function resolveContentKey(kyuActual) {
  if (PINTA_HEREDA_DE[kyuActual]) return PINTA_HEREDA_DE[kyuActual];
  return kyuActual;
}

function nextGrado(kyu) {
  const i = GRADO_ORDER.indexOf(kyu);
  if (i < 0 || i >= GRADO_ORDER.length - 1) return null;
  return GRADO_ORDER[i + 1];
}

const checkboxStyle = {
  width: '1rem',
  height: '1rem',
  borderRadius: 4,
  border: `2px solid ${DOJO.dorado}`,
  flexShrink: 0,
  marginTop: '0.15rem',
  background: 'transparent',
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

  const contentKey = resolveContentKey(kyuActual);
  const tech = KYU_TECNICO[contentKey];
  const siguiente = nextGrado(kyuActual);

  const notaPinta = PINTA_HEREDA_DE[kyuActual]
    ? 'Estás en pinta: aquí ves el programa técnico que corresponde preparar para tu próximo ascenso.'
    : null;

  if (loading) {
    return (
      <div style={{ padding: '1.5rem', background: DOJO.negro, color: '#aaa', minHeight: '100%' }}>
        Cargando…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '1.5rem', background: DOJO.negro, color: '#f88', minHeight: '100%' }}>
        {error || 'Sin datos'}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100%', background: DOJO.negro, color: '#eee', padding: '1.5rem', maxWidth: '42rem' }}>
      <h1 style={{ margin: '0 0 1.25rem', fontSize: '1.35rem', color: DOJO.dorado }}>Contenido técnico</h1>

      {/* Sección 1 — Header */}
      <section
        style={{
          marginBottom: '1.5rem',
          paddingBottom: '1.25rem',
          borderBottom: `2px solid ${DOJO.dorado}`,
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
          <KyuBadge kyu={kyuActual} />
          {siguiente && (
            <>
              <span style={{ color: DOJO.dorado, fontSize: '1.25rem', fontWeight: 700 }} aria-hidden>
                →
              </span>
              <KyuBadge kyu={siguiente} />
            </>
          )}
        </div>
        {preExamen && (
          <div
            style={{
              display: 'inline-block',
              background: `linear-gradient(135deg, ${DOJO.dorado}22, ${DOJO.dorado}44)`,
              border: `1px solid ${DOJO.dorado}`,
              color: DOJO.dorado,
              padding: '0.4rem 0.85rem',
              borderRadius: 999,
              fontSize: '0.88rem',
              fontWeight: 800,
            }}
          >
            ⭐ Autorizado para examen
          </div>
        )}
        {notaPinta && (
          <p style={{ margin: '0.85rem 0 0', fontSize: '0.9rem', color: '#bbb', lineHeight: 1.45 }}>
            {notaPinta}
          </p>
        )}
      </section>

      {!tech ? (
        <p style={{ color: '#aaa', fontSize: '0.95rem' }}>
          No hay programa de kyu cargado para tu grado actual. Consulta al Sensei.
        </p>
      ) : (
        <>
          {/* Sección 2 — Kata */}
          <section style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.05rem', color: DOJO.dorado, fontWeight: 700 }}>
              Kata para el ascenso
            </h2>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#e8e8e8', lineHeight: 1.65 }}>
              {tech.kata.map((k) => (
                <li key={k} style={{ marginBottom: '0.35rem' }}>
                  <span style={{ marginRight: '0.35rem' }} aria-hidden>
                    📖
                  </span>
                  {k}
                </li>
              ))}
            </ul>
          </section>

          {/* Sección 3 — Kumite */}
          <section style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.05rem', color: DOJO.dorado, fontWeight: 700 }}>
              Kumite requerido
            </h2>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#e8e8e8', lineHeight: 1.65 }}>
              {tech.kumite.map((k) => (
                <li key={k} style={{ marginBottom: '0.35rem' }}>
                  <span style={{ marginRight: '0.35rem' }} aria-hidden>
                    ⚔️
                  </span>
                  {k}
                </li>
              ))}
            </ul>
          </section>

          {/* Sección 4 — Kihon */}
          <section>
            <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.05rem', color: DOJO.dorado, fontWeight: 700 }}>
              Kihon a preparar
            </h2>
            <ol
              style={{
                margin: 0,
                paddingLeft: '1.35rem',
                color: '#e8e8e8',
                lineHeight: 1.55,
              }}
            >
              {tech.kihon.map((line, idx) => (
                <li key={`${idx}-${line.slice(0, 24)}`} style={{ marginBottom: '0.55rem' }}>
                  <span style={{ display: 'flex', gap: '0.55rem', alignItems: 'flex-start' }}>
                    <span style={checkboxStyle} title="" aria-hidden />
                    <span>{line}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </div>
  );
}
