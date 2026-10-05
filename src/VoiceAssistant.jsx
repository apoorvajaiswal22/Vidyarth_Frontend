import { useEffect, useRef, useState } from "react";
import { getVoiceLocale, LANGUAGE_OPTIONS, translate, useSharedLanguage } from "./i18n";
import "./VoiceAssistant.css";

const commands = {
  en: { schemes:["schemes","scholarships"], apply:["apply","application","new application"], track:["track","track application","status"], documents:["documents","my documents"], grievance:["grievance","complaint"], help:["help","support"], home:["home","homepage"] },
  hi: { schemes:["योजनाएं","योजना","छात्रवृत्ति"], apply:["आवेदन","आवेदन करें"], track:["आवेदन ट्रैक करें","स्थिति","ट्रैक"], documents:["दस्तावेज़","मेरे दस्तावेज़"], grievance:["शिकायत","शिकायत दर्ज"], help:["सहायता","मदद"], home:["मुखपृष्ठ","होम"] },
  bn: { schemes:["স্কিম","পরিকল্পনা","বৃত্তি"], apply:["আবেদন"], track:["আবেদন ট্র্যাক","স্ট্যাটাস"], documents:["নথি","আমার নথি"], grievance:["অভিযোগ"], help:["সহায়তা"], home:["হোম"] },
  mr: { schemes:["योजना","शिष्यवृत्ती"], apply:["अर्ज","अर्ज करा"], track:["अर्ज ट्रॅक","स्थिती"], documents:["दस्तऐवज"], grievance:["तक्रार"], help:["मदत"], home:["मुख्यपृष्ठ"] },
  ta: { schemes:["திட்டங்கள்","உதவித்தொகை"], apply:["விண்ணப்பம்"], track:["விண்ணப்பத்தை கண்காணிக்கவும்","நிலை"], documents:["ஆவணங்கள்"], grievance:["குறைதீர்"], help:["உதவி"], home:["முகப்பு"] },
  te: { schemes:["పథకాలు","స్కాలర్‌షిప్"], apply:["దరఖాస్తు"], track:["దరఖాస్తును ట్రాక్","స్థితి"], documents:["పత్రాలు"], grievance:["ఫిర్యాదు"], help:["సహాయం"], home:["హోమ్"] },
};

function includesAny(text, values) { return values.some((value) => text.includes(value)); }

export default function VoiceAssistant() {
  const [lang, setLang] = useSharedLanguage();
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const recognitionRef = useRef(null);
  const t = (key) => translate(lang, key);

  const supported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  useEffect(() => () => { recognitionRef.current?.stop?.(); window.speechSynthesis?.cancel?.(); }, []);

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getVoiceLocale(lang);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const readPage = () => {
    const main = document.querySelector("main") || document.body;
    const text = main.innerText.replace(/\s+/g, " ").trim().slice(0, 5000);
    speak(text);
  };

  const runCommand = (raw) => {
    const text = raw.toLowerCase().trim();
    const c = commands[lang] || commands.en;
    if (includesAny(text, c.schemes)) window.location.href = "/schemes";
    else if (includesAny(text, c.apply)) window.location.href = "/apply";
    else if (includesAny(text, c.track)) window.location.href = "/track";
    else if (includesAny(text, c.documents)) window.location.href = "/documents";
    else if (includesAny(text, c.grievance)) window.location.href = "/grievance";
    else if (includesAny(text, c.help)) window.location.href = "/help";
    else if (includesAny(text, c.home)) window.location.href = "/";
    else speak(t("voiceHelp"));
  };

  const startListening = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { speak(t("voiceNotSupported")); return; }
    recognitionRef.current?.stop?.();
    const recognition = new Recognition();
    recognition.lang = getVoiceLocale(lang);
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => { setListening(false); speak(t("voiceNotSupported")); };
    recognition.onresult = (event) => runCommand(event.results[0][0].transcript);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopAll = () => {
    recognitionRef.current?.stop?.();
    window.speechSynthesis?.cancel?.();
    setListening(false); setSpeaking(false);
  };

  return <div className="voice-assistant">
    {open && <section className="voice-panel" aria-label={t("voice")}>
      <div className="voice-panel-head"><div><strong>🎙️ {t("voice")}</strong><small>English + Hindi + 4 Indian languages</small></div><button onClick={() => setOpen(false)} aria-label="Close">×</button></div>
      <label>{t("language")}
        <select value={lang} onChange={(e) => setLang(e.target.value)}>
          {LANGUAGE_OPTIONS.map((item) => <option key={item.code} value={item.code}>{item.native} — {item.label}</option>)}
        </select>
      </label>
      <div className="voice-actions">
        <button onClick={readPage} className="voice-primary">🔊 {t("listen")}</button>
        <button onClick={startListening} className={listening ? "listening" : ""}>{listening ? "🔴 " + t("stopListening") : "🎤 " + t("startListening")}</button>
        <button onClick={stopAll}>⏹ {t("stop")}</button>
      </div>
      <p>{t("voiceHelp")}</p>
      {!supported && <small className="voice-warning">{t("voiceNotSupported")}</small>}
      {speaking && <div className="voice-status">🔊 {t("listen")}…</div>}
    </section>}
    <button className="voice-fab" onClick={() => setOpen((v) => !v)} aria-label={t("voice")} title={t("voice")}>🎙️ <span>{t("voice")}</span></button>
  </div>;
}
