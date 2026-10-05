import { useEffect, useState } from "react";

const KEY = "vidyarthLanguage";

export const LANGUAGE_OPTIONS = [
  { code: "en", label: "English", native: "English", voice: "en-IN" },
  { code: "hi", label: "Hindi", native: "हिन्दी", voice: "hi-IN" },
  { code: "bn", label: "Bengali", native: "বাংলা", voice: "bn-IN" },
  { code: "mr", label: "Marathi", native: "मराठी", voice: "mr-IN" },
  { code: "ta", label: "Tamil", native: "தமிழ்", voice: "ta-IN" },
  { code: "te", label: "Telugu", native: "తెలుగు", voice: "te-IN" },
];

const dictionary = {
  en: {
    gov: "Government of India", ministry: "Ministry of Tribal Affairs",
    portal: "Scholarship & Fellowship Management System", home: "Home", schemes: "Schemes",
    application: "Application", track: "Track Application", documents: "My Documents",
    grievance: "Grievance", help: "Help", admin: "Officer / Admin", applyTrack: "APPLY / TRACK",
    applicantLogin: "Applicant Login", adminLogin: "Officer / Admin Login", search: "Search schemes, services, notices",
    skip: "Skip to main content", screenReader: "Screen Reader", voice: "Voice Assistant",
    listen: "Read this page aloud", stop: "Stop speaking", startListening: "Start voice command",
    stopListening: "Stop listening", language: "Language", voiceHelp: "Say a command such as schemes, apply, track application, documents, grievance or help.",
    voiceNotSupported: "Voice recognition is not supported in this browser. You can still use Read Aloud.",
  },
  hi: {
    gov: "भारत सरकार", ministry: "जनजातीय कार्य मंत्रालय", portal: "छात्रवृत्ति एवं फेलोशिप प्रबंधन प्रणाली",
    home: "मुखपृष्ठ", schemes: "योजनाएं", application: "आवेदन", track: "आवेदन ट्रैक करें", documents: "मेरे दस्तावेज़",
    grievance: "शिकायत", help: "सहायता", admin: "अधिकारी / एडमिन", applyTrack: "आवेदन / ट्रैक",
    applicantLogin: "विद्यार्थी लॉगिन", adminLogin: "अधिकारी / एडमिन लॉगिन", search: "योजनाएं, सेवाएं और सूचनाएं खोजें",
    skip: "मुख्य सामग्री पर जाएं", screenReader: "स्क्रीन रीडर", voice: "वॉयस सहायक",
    listen: "यह पेज सुनें", stop: "पढ़ना रोकें", startListening: "वॉयस कमांड शुरू करें",
    stopListening: "सुनना बंद करें", language: "भाषा", voiceHelp: "योजना, आवेदन, आवेदन ट्रैक करें, दस्तावेज़, शिकायत या सहायता बोलें।",
    voiceNotSupported: "इस ब्राउज़र में वॉयस कमांड उपलब्ध नहीं है। आप फिर भी पेज सुन सकते हैं।",
  },
  bn: {
    gov: "ভারত সরকার", ministry: "জনজাতি বিষয়ক মন্ত্রক", portal: "বৃত্তি ও ফেলোশিপ ব্যবস্থাপনা ব্যবস্থা",
    home: "হোম", schemes: "স্কিম", application: "আবেদন", track: "আবেদন ট্র্যাক করুন", documents: "আমার নথি",
    grievance: "অভিযোগ", help: "সহায়তা", admin: "অফিসার / অ্যাডমিন", applyTrack: "আবেদন / ট্র্যাক",
    applicantLogin: "আবেদনকারী লগইন", adminLogin: "অফিসার / অ্যাডমিন লগইন", search: "স্কিম, পরিষেবা ও বিজ্ঞপ্তি খুঁজুন",
    skip: "মূল বিষয়বস্তুতে যান", screenReader: "স্ক্রিন রিডার", voice: "ভয়েস সহায়ক",
    listen: "এই পৃষ্ঠা পড়ে শোনান", stop: "পড়া বন্ধ করুন", startListening: "ভয়েস কমান্ড শুরু করুন", stopListening: "শোনা বন্ধ করুন", language: "ভাষা",
    voiceHelp: "স্কিম, আবেদন, আবেদন ট্র্যাক, নথি, অভিযোগ বা সহায়তা বলুন।", voiceNotSupported: "এই ব্রাউজারে ভয়েস কমান্ড সমর্থিত নয়। আপনি পৃষ্ঠা শুনতে পারবেন।",
  },
  mr: {
    gov: "भारत सरकार", ministry: "आदिवासी कार्य मंत्रालय", portal: "शिष्यवृत्ती व फेलोशिप व्यवस्थापन प्रणाली",
    home: "मुख्यपृष्ठ", schemes: "योजना", application: "अर्ज", track: "अर्ज ट्रॅक करा", documents: "माझे दस्तऐवज",
    grievance: "तक्रार", help: "मदत", admin: "अधिकारी / प्रशासक", applyTrack: "अर्ज / ट्रॅक",
    applicantLogin: "अर्जदार लॉगिन", adminLogin: "अधिकारी / प्रशासक लॉगिन", search: "योजना, सेवा आणि सूचना शोधा",
    skip: "मुख्य मजकुराकडे जा", screenReader: "स्क्रीन रीडर", voice: "व्हॉइस सहाय्यक",
    listen: "हे पृष्ठ मोठ्याने वाचा", stop: "वाचन थांबवा", startListening: "व्हॉइस कमांड सुरू करा", stopListening: "ऐकणे थांबवा", language: "भाषा",
    voiceHelp: "योजना, अर्ज, अर्ज ट्रॅक, दस्तऐवज, तक्रार किंवा मदत असे बोला।", voiceNotSupported: "या ब्राउझरमध्ये व्हॉइस कमांड उपलब्ध नाही. तरीही तुम्ही पृष्ठ ऐकू शकता.",
  },
  ta: {
    gov: "இந்திய அரசு", ministry: "பழங்குடியினர் விவகார அமைச்சகம்", portal: "உதவித்தொகை மற்றும் பெல்லோஷிப் மேலாண்மை அமைப்பு",
    home: "முகப்பு", schemes: "திட்டங்கள்", application: "விண்ணப்பம்", track: "விண்ணப்பத்தை கண்காணிக்கவும்", documents: "எனது ஆவணங்கள்",
    grievance: "குறைதீர்", help: "உதவி", admin: "அதிகாரி / நிர்வாகி", applyTrack: "விண்ணப்பம் / கண்காணிப்பு",
    applicantLogin: "விண்ணப்பதாரர் உள்நுழைவு", adminLogin: "அதிகாரி / நிர்வாகி உள்நுழைவு", search: "திட்டங்கள், சேவைகள் மற்றும் அறிவிப்புகளைத் தேடுங்கள்",
    skip: "முதன்மை உள்ளடக்கத்திற்குச் செல்லவும்", screenReader: "ஸ்கிரீன் ரீடர்", voice: "குரல் உதவியாளர்",
    listen: "இந்தப் பக்கத்தைப் படிக்கவும்", stop: "படிப்பதை நிறுத்தவும்", startListening: "குரல் கட்டளையைத் தொடங்கவும்", stopListening: "கேட்பதை நிறுத்தவும்", language: "மொழி",
    voiceHelp: "திட்டங்கள், விண்ணப்பம், விண்ணப்ப கண்காணிப்பு, ஆவணங்கள், குறைதீர் அல்லது உதவி என்று சொல்லுங்கள்.", voiceNotSupported: "இந்த உலாவியில் குரல் கட்டளை ஆதரிக்கப்படவில்லை. நீங்கள் பக்கத்தை கேட்கலாம்.",
  },
  te: {
    gov: "భారత ప్రభుత్వం", ministry: "గిరిజన వ్యవహారాల మంత్రిత్వ శాఖ", portal: "స్కాలర్‌షిప్ & ఫెలోషిప్ నిర్వహణ వ్యవస్థ",
    home: "హోమ్", schemes: "పథకాలు", application: "దరఖాస్తు", track: "దరఖాస్తును ట్రాక్ చేయండి", documents: "నా పత్రాలు",
    grievance: "ఫిర్యాదు", help: "సహాయం", admin: "అధికారి / అడ్మిన్", applyTrack: "దరఖాస్తు / ట్రాక్",
    applicantLogin: "దరఖాస్తుదారు లాగిన్", adminLogin: "అధికారి / అడ్మిన్ లాగిన్", search: "పథకాలు, సేవలు మరియు నోటీసులను శోధించండి",
    skip: "ప్రధాన విషయానికి వెళ్లండి", screenReader: "స్క్రీన్ రీడర్", voice: "వాయిస్ సహాయకుడు",
    listen: "ఈ పేజీని చదవండి", stop: "చదవడం ఆపండి", startListening: "వాయిస్ కమాండ్ ప్రారంభించండి", stopListening: "వినడం ఆపండి", language: "భాష",
    voiceHelp: "పథకాలు, దరఖాస్తు, దరఖాస్తు ట్రాక్, పత్రాలు, ఫిర్యాదు లేదా సహాయం అని చెప్పండి.", voiceNotSupported: "ఈ బ్రౌజర్‌లో వాయిస్ కమాండ్ మద్దతు లేదు. మీరు పేజీని వినవచ్చు.",
  },
};

export function getLanguage() {
  const saved = localStorage.getItem(KEY) || "en";
  return LANGUAGE_OPTIONS.some((item) => item.code === saved) ? saved : "en";
}

export function setLanguage(value) {
  const safe = LANGUAGE_OPTIONS.some((item) => item.code === value) ? value : "en";
  localStorage.setItem(KEY, safe);
  document.documentElement.lang = safe;
  window.dispatchEvent(new CustomEvent("vidyarth-language", { detail: safe }));
}

export function getVoiceLocale(lang = getLanguage()) {
  return LANGUAGE_OPTIONS.find((item) => item.code === lang)?.voice || "en-IN";
}

export function translate(lang, key) {
  return dictionary[lang]?.[key] ?? dictionary.en[key] ?? key;
}

export function useSharedLanguage() {
  const [lang, setLangState] = useState(() => getLanguage());
  useEffect(() => {
    document.documentElement.lang = lang;
    const onLanguage = (event) => setLangState(event.detail || getLanguage());
    window.addEventListener("vidyarth-language", onLanguage);
    return () => window.removeEventListener("vidyarth-language", onLanguage);
  }, [lang]);
  const setLang = (value) => { setLanguage(value); setLangState(getLanguage()); };
  return [lang, setLang];
}
