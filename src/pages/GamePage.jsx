// src/pages/GamePage.jsx
import React, { useMemo, useState, useEffect } from "react";

function getInitData() {
  return window.Telegram?.WebApp?.initData || "";
}

// как в твоём примере: единый метод открытия ссылок Telegram
function openTelegramLink(url) {
  const tgApp = window.Telegram?.WebApp;
  if (tgApp?.openTelegramLink) tgApp.openTelegramLink(url);
  else window.open(url, "_blank");
}

// Призы — по часовой стрелке от верхнего сектора (12 часов)
const prizes = [
  { id: 1, text: "бесплатное сопровождение 1 неделю", short: "1 неделя" },
  { id: 2, text: "бесплатную консультацию", short: "консультация" },
  { id: 3, text: "скидку 10%", short: "10%" },
  { id: 4, text: "бесплатную статистику по боту", short: "статистика" },
];

// Фон колеса под N секторов
function wheelBackground(n) {
  const step = 360 / n;
  const stops = [];
  for (let i = 0; i < n; i++) {
    const a0 = i * step;
    const a1 = (i + 1) * step;
    const c = i % 2 === 0 ? "#2b0045" : "#1c0031";
    stops.push(`${c} ${a0}deg ${a1}deg`);
  }
  return `conic-gradient(from 0deg, ${stops.join(", ")})`;
}

// Лейблы — всегда читаемо
function labelTransform(i, n) {
  const step = 360 / n;
  const angle = i * step + step / 2;
  const r = 118;
  const textRotation = angle > 90 && angle < 270 ? 180 : 0;
  return `translate(-50%, -50%) rotate(${angle}deg) translate(${r}px) rotate(${textRotation}deg)`;
}

// Определяем приз по углу (стрелка сверху = 0deg)
function getPrizeFromAngle(angle, n) {
  let normalized = angle % 360;
  if (normalized < 0) normalized += 360;

  const step = 360 / n;
  const safeAngle = normalized + 0.1; // не попадать на грань
  const idx = Math.floor(safeAngle / step) % n;
  return prizes[idx];
}

// Безопасный угол остановки (внутри сектора), + обороты
function calculateSafeTarget(randomSector, step) {
  const center = randomSector * step + step / 2;
  const maxOffset = step / 4;
  const offset = (Math.random() * 2 - 1) * maxOffset;
  const finalAngle = center + offset;
  return 360 * 6 + finalAngle;
}

export default function GamePage() {
  const [spinning, setSpinning] = useState(false);
  const [prize, setPrize] = useState(null);
  const [deg, setDeg] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const [name, setName] = useState("");
  const [tg, setTg] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);

  const title = useMemo(
    () => (prize ? prize.text : "Крути и забирай приз"),
    [prize]
  );

  // Глобальные keyframes 1 раз
  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.textContent = globalStyles;
    document.head.appendChild(styleTag);
    return () => styleTag.remove();
  }, []);

  // После остановки считаем приз
  useEffect(() => {
    if (!spinning && deg !== 0) {
      const current = getPrizeFromAngle(deg, prizes.length);
      setPrize(current);

      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 2500);
      return () => clearTimeout(t);
    }
  }, [spinning, deg]);

  function spin() {
    if (spinning) return;

    setSpinning(true);
    setPrize(null);
    setShowConfetti(false);

    const n = prizes.length;
    const step = 360 / n;
    const randomSector = Math.floor(Math.random() * n);
    const target = calculateSafeTarget(randomSector, step);

    setDeg((prev) => prev + target);

    // синхронно с transition 2.6s
    setTimeout(() => setSpinning(false), 2600);
  }

  function validateForm() {
    const tgOk = tg.trim().length >= 3;
    const phoneOk = phone.trim().length >= 6;
    return tgOk || phoneOk;
  }

  // как в примере: https://t.me/Lyokorps?text=...
  async function submit() {
    if (!prize) return;

    if (!validateForm()) {
      alert("Укажи ник в TG или телефон, иначе мы тебя не найдём 🙂");
      return;
    }

    setSending(true);
    try {
      const msg = `🎡 Заявка на приз
🎁 Я выиграл: ${prize.text}
👤 Имя: ${name.trim() || "-"}
💬 TG: ${tg.trim() || "-"}
📞 Телефон: ${phone.trim() || "-"}`;

      openTelegramLink(`https://t.me/Lyokorps?text=${encodeURIComponent(msg)}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={styles.page}>
      {showConfetti && <div style={styles.confetti}>🎉 🎉 🎉</div>}

      <div style={styles.wrapper}>
        <h1 style={styles.title}>КОЛЕСО ФОРТУНЫ</h1>
        <div style={styles.subtitle}>Крути и забирай призы</div>

        <div style={styles.stage}>
          {/* Стрелка сверху (кончик вниз) */}
          <div style={styles.pointerWrap}>
            <div style={styles.pointerTri} />
            <div style={styles.pointerDot} />
          </div>

          <div
            style={{
              ...styles.wheel,
              background: wheelBackground(prizes.length),
              transform: `rotate(${deg}deg)`,
              transition: spinning
                ? "transform 2.6s cubic-bezier(.12,.78,.12,1)"
                : "none",
            }}
          >
            {/* Делители */}
            {prizes.map((p, i) => {
              const angle = i * (360 / prizes.length);
              return (
                <div
                  key={`line-${p.id}`}
                  style={{
                    ...styles.divider,
                    transform: `translateY(-50%) rotate(${angle}deg)`,
                  }}
                />
              );
            })}

            {/* Лейблы */}
            {prizes.map((p, i) => (
              <div
                key={`label-${p.id}`}
                style={{
                  ...styles.label,
                  transform: labelTransform(i, prizes.length),
                }}
              >
                {p.short}
              </div>
            ))}

            <div style={styles.gloss} />
            <div style={styles.hub} />
          </div>
        </div>

        <button style={styles.btn} onClick={spin} disabled={spinning}>
          {spinning ? "Крутим..." : "ГАЗ"}
        </button>

        <div style={styles.result}>
          <div style={styles.resultTitle}>{title}</div>
          {prize && (
            <div style={styles.resultWin}>
              🎁 Красава, ты выиграл {prize.text} 🎁
            </div>
          )}
        </div>

        {prize && (
          <div style={styles.form}>
            <div style={styles.formTitle}>Забрать приз</div>

            <input
              style={styles.input}
              placeholder="Имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              style={styles.input}
              placeholder="Ник в TG (например, @username)"
              value={tg}
              onChange={(e) => setTg(e.target.value)}
            />

            <input
              style={styles.input}
              placeholder="Телефон"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <button style={styles.btn2} onClick={submit} disabled={sending}>
              {sending ? "Открываем Telegram..." : "Отправить"}
            </button>

            <div style={styles.hint}>Заполни полностью, чтобы забрать приз</div>

            {/* дебаг при необходимости */}
            {/* <div style={{opacity:0.5,fontSize:12,marginTop:8}}>initData: {getInitData() ? "есть" : "нет"}</div> */}
          </div>
        )}
      </div>
    </div>
  );
}

const WHEEL_SIZE = 320;
const RADIUS = WHEEL_SIZE / 2;

const styles = {
  page: {
    minHeight: "100dvh",
    background:
      "radial-gradient(circle at 50% 10%, #24003a 0%, #0b0014 55%, #000 100%)",
    padding: "24px 16px",
    color: "white",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  },
  confetti: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: 48,
    zIndex: 1000,
    pointerEvents: "none",
    animation: "confetti 2.5s ease-out",
  },
  wrapper: {
    maxWidth: 900,
    margin: "0 auto",
    textAlign: "center",
  },
  title: {
    fontSize: "clamp(28px, 5vw, 48px)",
    color: "#cfcfcf",
    textShadow: "0 0 16px rgba(123,44,255,0.65)",
    margin: "10px 0 6px",
    letterSpacing: 1,
  },
  subtitle: {
    opacity: 0.85,
    marginBottom: 12,
  },
  stage: {
    position: "relative",
    width: WHEEL_SIZE + 20,
    height: WHEEL_SIZE + 20,
    margin: "18px auto 10px",
  },
  pointerWrap: {
    position: "absolute",
    top: 14,
    left: "50%",
    transform: "translateX(-50%)",
    width: 32,
    height: 44,
    zIndex: 30,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  pointerTri: {
    width: 0,
    height: 0,
    borderLeft: "14px solid transparent",
    borderRight: "14px solid transparent",
    borderTop: "28px solid #d7d7d7",
    filter: "drop-shadow(0 0 10px rgba(192,192,192,0.55))",
  },
  pointerDot: {
    position: "absolute",
    bottom: 6,
    left: "50%",
    transform: "translateX(-50%)",
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#7b2cff",
    boxShadow: "0 0 10px rgba(123,44,255,0.9)",
  },
  wheel: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: "50%",
    border: "8px solid #7b2cff",
    boxShadow: "0 0 28px rgba(123,44,255,0.4)",
    position: "absolute",
    top: 10,
    left: 10,
    overflow: "hidden",
    willChange: "transform",
  },
  divider: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: RADIUS,
    height: 2,
    background: "rgba(255,255,255,0.18)",
    transformOrigin: "0% 50%",
    pointerEvents: "none",
  },
  label: {
    position: "absolute",
    top: "50%",
    left: "50%",
    fontSize: 12,
    fontWeight: 700,
    color: "#fff",
    textShadow: "0 0 8px rgba(0,0,0,0.85)",
    whiteSpace: "nowrap",
    padding: "4px 10px",
    background: "rgba(123,44,255,0.25)",
    borderRadius: 999,
    border: "1px solid rgba(123,44,255,0.55)",
    backdropFilter: "blur(2px)",
    pointerEvents: "none",
    zIndex: 5,
  },
  gloss: {
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
    background:
      "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0) 45%), radial-gradient(circle at 70% 75%, rgba(123,44,255,0.12) 0%, rgba(123,44,255,0) 55%)",
    pointerEvents: "none",
  },
  hub: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 74,
    height: 74,
    transform: "translate(-50%, -50%)",
    borderRadius: "50%",
    background:
      "radial-gradient(circle at 30% 30%, #d7d7d7 0%, #6b6b6b 45%, #2a2a2a 100%)",
    boxShadow:
      "0 0 18px rgba(0,0,0,0.6), inset 0 0 10px rgba(255,255,255,0.15)",
    border: "2px solid rgba(255,255,255,0.15)",
    zIndex: 10,
  },
  btn: {
    background: "#7b2cff",
    color: "white",
    border: "none",
    padding: "14px 42px",
    fontSize: 18,
    fontWeight: 700,
    borderRadius: 14,
    cursor: "pointer",
    marginTop: 10,
    boxShadow: "0 0 18px rgba(123,44,255,0.35)",
  },
  btn2: {
    background: "#7b2cff",
    color: "white",
    border: "none",
    padding: "12px 24px",
    fontSize: 16,
    fontWeight: 700,
    borderRadius: 12,
    cursor: "pointer",
    marginTop: 10,
    width: 260,
    boxShadow: "0 0 18px rgba(123,44,255,0.25)",
  },
  result: { minHeight: 66 },
  resultTitle: { fontSize: 18, marginTop: 16 },
  resultWin: { opacity: 0.9, marginTop: 6 },
  form: {
    marginTop: 16,
    padding: 14,
    border: "1px solid rgba(123,44,255,0.5)",
    borderRadius: 14,
    background: "rgba(10,0,20,0.35)",
    backdropFilter: "blur(6px)",
    maxWidth: 340,
    marginLeft: "auto",
    marginRight: "auto",
  },
  formTitle: { fontSize: 18, marginBottom: 10 },
  input: {
    width: "100%",
    padding: 10,
    borderRadius: 10,
    border: "1px solid #3b0061",
    background: "#0b0014",
    color: "white",
    marginTop: 8,
    outline: "none",
    fontSize: 14,
    boxSizing: "border-box",
  },
  hint: { marginTop: 10, fontSize: 12, opacity: 0.75 },
};

const globalStyles = `
@keyframes confetti {
  0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.6); }
  15%  { opacity: 1; transform: translate(-50%, -50%) scale(1.15); }
  80%  { opacity: 1; transform: translate(-50%, -50%) scale(1.0); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
}
`;