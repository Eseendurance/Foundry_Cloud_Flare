"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BrainCircuit,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Flame,
  Gauge,
  Moon,
  Search,
  Sparkles,
  Sun,
  Target,
  Trophy,
  Zap,
} from "lucide-react";

type ThemeMode = "light" | "dark";

type Question = {
  prompt: string;
  vignette: string;
  options: string[];
  correctChoiceIndex: number;
  explanation: string;
  pearl: string;
};

type Flashcard = {
  front: string;
  back: string;
  topic: string;
};

const questionBank: Question[] = [
  {
    prompt: "A 64-year-old man with progressive dyspnea and edema has a serum creatinine of 2.1 mg/dL. Which finding is most consistent with the likely diagnosis?",
    vignette:
      "He reports fatigue, peripheral edema, and a history of long-standing hypertension. Exam shows elevated JVP and bibasilar crackles.",
    options: [
      "Low urine sodium with high BUN:Cr ratio",
      "Bilateral renal artery stenosis with elevated renin",
      "Red blood cell casts and dysmorphic RBCs",
      "Fevers, rash, and eosinophilia after recent antibiotics",
    ],
    correctChoiceIndex: 1,
    explanation:
      "The patient most likely has heart failure causing prerenal azotemia. Reduced effective renal perfusion triggers increased renin and angiotensin II, leading to low urine sodium and a high BUN:creatinine ratio. A renal artery stenosis pattern also elevates renin, but the clinical vignette is more consistent with volume overload from heart failure.",
    pearl:
      "Prerenal azotemia is the classic kidney insult when intravascular volume or perfusion is reduced. Urine sodium is typically low because the kidney avidly reabsorbs sodium in an attempt to preserve volume.",
  },
  {
    prompt: "Which intervention most directly reduces mortality in a patient with acute STEMI?",
    vignette:
      "A 57-year-old woman presents 90 minutes after chest pain onset; ECG shows ST elevations in leads II, III, and aVF.",
    options: [
      "Immediate IV nitroglycerin",
      "Urgent primary PCI",
      "Oral statin alone",
      "High-dose beta-blocker without reperfusion",
    ],
    correctChoiceIndex: 1,
    explanation:
      "In a patient with acute STEMI and a PCI-capable facility, primary percutaneous coronary intervention is the most definitive reperfusion strategy and reduces mortality when performed promptly. The time from symptom onset to reperfusion is crucial for tissue salvage.",
    pearl:
      "Door-to-balloon time is a key quality metric in STEMI management. Reperfusion therapy should be initiated as soon as possible, ideally within 90 minutes of first medical contact when feasible.",
  },
  {
    prompt: "A patient with impaired glucose tolerance and obesity is undergoing counseling. Which statement best reflects evidence-based obesity management?",
    vignette:
      "The patient is otherwise healthy but reports difficulty maintaining weight loss and decreased energy. She is motivated to make sustainable changes.",
    options: [
      "Rapid weight loss is preferred because it keeps motivation high",
      "A 5–10% weight reduction can improve metabolic parameters and reduce risk",
      "Only bariatric surgery is effective in any patient with BMI > 30",
      "Dietary supplements are more effective than lifestyle intervention",
    ],
    correctChoiceIndex: 1,
    explanation:
      "Evidence-based obesity management emphasizes sustained lifestyle changes, with a goal of 5–10% weight loss producing meaningful improvements in blood pressure, glucose control, and cardiovascular risk. Bariatric surgery is reserved for selected patients and is not the only effective treatment.",
    pearl:
      "Even modest weight reduction can improve insulin sensitivity and reduce fatty liver disease. The most successful plans are sustainable and focused on behavior change rather than extreme restriction.",
  },
];

const flashcards: Flashcard[] = [
  {
    front: "What is the key physiologic effect of IV procainamide?",
    back: "✅ IV procainamide suppresses cardiac sodium channels and slows conduction, particularly useful for atrial and ventricular arrhythmias.",
    topic: "Cardio",
  },
  {
    front: "What is the hallmark of a non-anion gap metabolic acidosis?",
    back: "✅ The bicarbonate loss is matched by chloride gain, so the anion gap remains normal; think diarrhea or type IV RTA.",
    topic: "Renal",
  },
  {
    front: "What is the classic treatment for acute pulmonary embolism with shock?",
    back: "✅ Systemic thrombolysis or catheter-directed therapy is indicated, in addition to anticoagulation and hemodynamic support.",
    topic: "Pulmonary",
  },
];

const heatmap = [
  [0, 1, 2, 0, 1, 3, 1],
  [1, 2, 4, 2, 1, 2, 0],
  [0, 1, 1, 3, 2, 5, 2],
  [2, 3, 1, 2, 0, 1, 4],
  [1, 0, 2, 3, 4, 2, 1],
  [3, 5, 2, 1, 0, 2, 1],
  [0, 2, 4, 3, 1, 0, 2],
];

const mastery = [
  { label: "Renal", value: 88 },
  { label: "Cardio", value: 92 },
  { label: "GI", value: 73 },
  { label: "Pulmo", value: 81 },
  { label: "OB/GYN", value: 69 },
  { label: "Peds", value: 76 },
];

export default function MedColleagueApp() {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(248);
  const [streak, setStreak] = useState(8);
  const [flashIndex, setFlashIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cr, setCr] = useState(1.1);
  const [age, setAge] = useState(42);
  const [gender, setGender] = useState<"female" | "male">("female");
  const [na, setNa] = useState(140);
  const [cl, setCl] = useState(96);
  const [hco3, setHco3] = useState(22);
  const [tutorInput, setTutorInput] = useState(
    "Summarize the most likely diagnosis and next best test for this vignette.",
  );
  const [tutorMessages, setTutorMessages] = useState([
    {
      role: "assistant",
      content:
        "I’m reviewing the case with a focus on diagnosis, next-step testing, and high-yield board principles. Ask for a differential, a summary, or a set of practice questions.",
    },
  ]);
  const [showLabDrawer, setShowLabDrawer] = useState(false);

  const currentQuestion = questionBank[questionIndex];

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("medcolleague-theme");
    if (storedTheme === "light" || storedTheme === "dark") {
      setTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.body.style.background = theme === "dark" ? "#020817" : "#f8fafc";
    window.localStorage.setItem("medcolleague-theme", theme);
  }, [theme]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLElement &&
        ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)
      ) {
        return;
      }

      if (/^[1-4]$/.test(event.key)) {
        event.preventDefault();
        setSelectedOption(Number(event.key) - 1);
      }

      if (event.key === "Enter" && selectedOption !== null && !hasSubmitted) {
        event.preventDefault();
        handleSubmit();
      }

      if (event.code === "Space" && !event.repeat) {
        event.preventDefault();
        setIsFlipped((value) => !value);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedOption, hasSubmitted]);

  const eGfr = useMemo(() => {
    const serum = Number(cr) || 0;
    const patientAge = Number(age) || 0;
    const k = gender === "female" ? 0.7 : 0.9;
    const alpha = gender === "female" ? -0.241 : -0.302;
    const minTerm = Math.min(serum / k, 1);
    const maxTerm = Math.max(serum / k, 1);
    const base = 142 * Math.pow(minTerm, alpha) * Math.pow(maxTerm, -1.2) * Math.pow(0.9938, patientAge);
    const adjusted = gender === "female" ? base * 1.018 : base;
    return Number.isFinite(adjusted) ? Math.max(0, adjusted) : 0;
  }, [age, cr, gender]);

  const anionGap = useMemo(() => na - (cl + hco3), [cl, hco3, na]);

  const handleSubmit = () => {
    if (selectedOption === null) return;

    const correct = selectedOption === currentQuestion.correctChoiceIndex;
    setHasSubmitted(true);
    setIsCorrect(correct);

    if (correct) {
      setScore((previous) => previous + 10);
      setStreak((previous) => previous + 1);
    } else {
      setScore((previous) => Math.max(0, previous - 5));
      setStreak(0);
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setHasSubmitted(false);
    setIsCorrect(null);
    setQuestionIndex((index) => (index + 1) % questionBank.length);
  };

  const handleFlashRating = (label: string) => {
    console.info(`Flashcard reviewed: ${label} for ${flashcards[flashIndex]?.topic ?? "topic"}`);
    setIsFlipped(false);
    setFlashIndex((index) => (index + 1) % flashcards.length);
  };

  const handleTutorPrompt = (preset?: string) => {
    const promptText = preset ?? tutorInput.trim();
    if (!promptText) return;

    setTutorMessages((previous) => [
      ...previous,
      { role: "user", content: promptText },
      {
        role: "assistant",
        content:
          preset === "Generate 5 QBank Items"
            ? "Here are 5 board-style items: 1) A patient with new chest pain... 2) A patient with AKI and hyperkalemia... 3) A woman with postpartum hemorrhage... 4) A child with wheezing and eczema... 5) A patient with new-onset confusion and hyponatremia..."
            : preset === "Explain Differential"
              ? "Differential priorities: first rule in high-risk diagnoses, then narrow by symptom pattern, urgency, and data. This case is most consistent with an acute process that requires immediate stabilization before confirming the final diagnosis."
              : "The most likely diagnosis is a high-yield clinical process that fits the vignette pattern: prioritize the key history, focused exam, and the single next test that confirms or excludes the leading diagnosis. If you want, I can turn this into a 1-minute clinical reasoning script or a board-style question set.",
      },
    ]);

    setTutorInput("");
  };

  const labReference = [
    {
      title: "Electrolytes",
      entries: [
        ["Na", "135-145 mEq/L"],
        ["K", "3.5-5.0 mEq/L"],
        ["Cl", "98-106 mEq/L"],
        ["HCO3", "22-26 mEq/L"],
      ],
    },
    {
      title: "CBC",
      entries: [
        ["WBC", "4.0-11.0 x10^9/L"],
        ["Hgb", "12-16 g/dL"],
        ["Hct", "36-47%"],
        ["Platelets", "150-450 x10^9/L"],
      ],
    },
    {
      title: "LFTs",
      entries: [
        ["AST", "10-40 U/L"],
        ["ALT", "7-56 U/L"],
        ["Alk Phos", "40-129 U/L"],
        ["Bilirubin", "0.3-1.2 mg/dL"],
      ],
    },
    {
      title: "ABG",
      entries: [
        ["pH", "7.35-7.45"],
        ["PaCO2", "35-45 mmHg"],
        ["PaO2", "75-100 mmHg"],
        ["HCO3", "22-26 mEq/L"],
      ],
    },
  ];

  const isDark = theme === "dark";
  const surface = isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900";
  const panel = isDark ? "border-slate-800 bg-slate-900/80" : "border-slate-200 bg-white";
  const softText = isDark ? "text-slate-300" : "text-slate-600";
  const muted = isDark ? "text-slate-400" : "text-slate-500";
  const subtle = isDark ? "bg-slate-800/80" : "bg-slate-100";
  const accent = isDark ? "text-cyan-400" : "text-blue-600";
  const ring = isDark ? "ring-cyan-500/40" : "ring-blue-200";

  return (
    <main className={`${surface} min-h-screen transition-colors duration-200`}>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className={`sticky top-0 z-40 mb-8 rounded-2xl border ${panel} backdrop-blur-sm`}>
          <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-cyan-500/10 p-2 text-cyan-500">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div>
                <div className="text-lg font-semibold">MedColleague</div>
                <div className={`text-xs ${muted}`}>Board prep + clinical reasoning</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowLabDrawer(true)}
                className={`hidden items-center gap-2 rounded-full border px-3 py-2 md:flex ${panel}`}
              >
                <Search className="h-4 w-4 text-cyan-500" />
                <span className={`text-sm ${softText}`}>Lab quick ref</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
                className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition ${panel}`}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === "dark" ? "Light" : "Dark"}
              </button>
            </div>
          </div>
        </header>

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <div className={`rounded-2xl border p-4 ${panel}`}>
            <div className="flex items-center gap-2 text-sm text-cyan-500">
              <Gauge className="h-4 w-4" />
              Projected score
            </div>
            <div className="mt-4 text-3xl font-bold">{score}</div>
            <div className={`text-sm ${softText}`}>Step 2 CK readiness</div>
          </div>
          <div className={`rounded-2xl border p-4 ${panel}`}>
            <div className="flex items-center gap-2 text-sm text-emerald-500">
              <Flame className="h-4 w-4" />
              Current streak
            </div>
            <div className="mt-4 text-3xl font-bold">{streak}</div>
            <div className={`text-sm ${softText}`}>Correct in a row</div>
          </div>
          <div className={`rounded-2xl border p-4 ${panel}`}>
            <div className="flex items-center gap-2 text-sm text-violet-500">
              <CalendarRange className="h-4 w-4" />
              Due today
            </div>
            <div className="mt-4 text-3xl font-bold">27</div>
            <div className={`text-sm ${softText}`}>Flashcards due</div>
          </div>
          <div className={`rounded-2xl border p-4 ${panel}`}>
            <div className="flex items-center gap-2 text-sm text-amber-500">
              <Target className="h-4 w-4" />
              Accuracy
            </div>
            <div className="mt-4 text-3xl font-bold">86%</div>
            <div className={`text-sm ${softText}`}>Last 50 questions</div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className={`rounded-3xl border p-5 ${panel}`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-500">QBank</div>
                <h2 className="mt-2 text-2xl font-semibold">Clinical reasoning drill</h2>
              </div>
              <div className={`rounded-full border px-3 py-1 text-sm ${subtle} ${softText}`}>
                Tutor mode
              </div>
            </div>

            <div className={`rounded-2xl border border-dashed p-4 ${subtle}`}>
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className={`font-medium ${softText}`}>Question {questionIndex + 1}</span>
                <span className={accent}>2 min</span>
              </div>
              <h3 className="text-lg font-semibold leading-relaxed">{currentQuestion.prompt}</h3>
              <p className={`mt-4 text-sm leading-6 ${softText}`}>{currentQuestion.vignette}</p>
            </div>

            <div className="mt-5 space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedOption === index;
                const showCorrect = hasSubmitted && index === currentQuestion.correctChoiceIndex;
                const showIncorrect = hasSubmitted && isSelected && !showCorrect;

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => !hasSubmitted && setSelectedOption(index)}
                    className={[
                      "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all",
                      isSelected ? `border-cyan-500 bg-cyan-500/10 ring-2 ${ring} shadow-sm` : `${panel}`,
                      showCorrect ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30" : "",
                      showIncorrect ? "border-rose-500 bg-rose-500/10 ring-2 ring-rose-500/30" : "",
                    ].join(" ")}
                  >
                    <span className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border text-sm font-semibold ${isSelected ? "border-cyan-500 bg-cyan-500 text-white" : subtle}`}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="flex-1 leading-6">{option}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                disabled={selectedOption === null || hasSubmitted}
                onClick={handleSubmit}
                className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              >
                Submit answer
              </button>

              <div className="flex items-center gap-2 text-sm">
                {hasSubmitted ? (
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-medium ${
                      isCorrect ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" : "border-rose-500/50 bg-rose-500/10 text-rose-400"
                    }`}
                  >
                    {isCorrect ? <CheckCircle2 className="h-4 w-4" /> : "✕"}
                    {isCorrect ? "Correct! +10 pts" : "Incorrect"}
                  </span>
                ) : (
                  <span className={`text-sm ${softText}`}>Choose an option to continue</span>
                )}
              </div>
            </div>

            {hasSubmitted && (
              <div className={`mt-6 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-4`}>
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-cyan-500">
                  <Sparkles className="h-4 w-4" />
                  Comprehensive clinical explanation
                </div>
                <p className={`leading-7 ${softText}`}>{currentQuestion.explanation}</p>

                <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                  <div className="mb-1 flex items-center gap-2 text-sm font-medium text-amber-500">
                    <Zap className="h-4 w-4" />
                    High-yield board pearl
                  </div>
                  <p className={`leading-7 ${softText}`}>{currentQuestion.pearl}</p>
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="mt-5 inline-flex items-center gap-2 rounded-full border border-cyan-500/50 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-500 transition hover:bg-cyan-500/20"
                >
                  Next question
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <div className={`rounded-3xl border p-5 ${panel}`}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold">Flashcards</h3>
                <span className={`text-sm ${softText}`}>{flashcards.length} cards</span>
              </div>

              <button
                type="button"
                onClick={() => setIsFlipped((value) => !value)}
                className="group relative block h-52 w-full cursor-pointer perspective-[1000px]"
                aria-label="Flip flashcard"
              >
                <div
                  className="relative h-full w-full rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 via-slate-900 to-slate-800 text-left shadow-lg transition-transform duration-500"
                  style={{ transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)", transformStyle: "preserve-3d" }}
                >
                  <div className="absolute inset-0 p-5 [backface-visibility:hidden]">
                    <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-cyan-500">
                      <span>{flashcards[flashIndex].topic}</span>
                      <span>Front</span>
                    </div>
                    <p className="mt-12 text-lg font-medium leading-relaxed text-white">{flashcards[flashIndex].front}</p>
                  </div>
                  <div className="absolute inset-0 rotate-y-180 p-5 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-emerald-400">
                      <span>{flashcards[flashIndex].topic}</span>
                      <span>Answer</span>
                    </div>
                    <p className="mt-12 text-lg font-medium leading-relaxed text-white">{flashcards[flashIndex].back}</p>
                  </div>
                </div>
              </button>

              {isFlipped && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[
                    { label: "Again", interval: "1d" },
                    { label: "Hard", interval: "3d" },
                    { label: "Good", interval: "5d" },
                    { label: "Easy", interval: "7d" },
                  ].map((rating) => (
                    <button
                      key={rating.label}
                      type="button"
                      onClick={() => handleFlashRating(rating.label)}
                      className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-500/50 hover:text-cyan-300"
                    >
                      {rating.label} <span className="text-slate-400">({rating.interval})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={`rounded-3xl border p-5 ${panel}`}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold">Clinical calculators</h3>
                <ChevronRight className={`h-4 w-4 ${softText}`} />
              </div>

              <div className="space-y-4">
                <div className={`rounded-2xl border p-4 ${subtle}`}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium">eGFR</span>
                    <span className="text-xs uppercase tracking-[0.18em] text-cyan-500">CKD-EPI</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <label className="text-sm">
                      <span className={softText}>Creatinine</span>
                      <input value={cr} onChange={(event) => setCr(Number(event.target.value) || 0)} className="mt-1 w-full rounded-lg border bg-transparent px-2 py-2 text-sm outline-none ring-0" />
                    </label>
                    <label className="text-sm">
                      <span className={softText}>Age</span>
                      <input value={age} onChange={(event) => setAge(Number(event.target.value) || 0)} className="mt-1 w-full rounded-lg border bg-transparent px-2 py-2 text-sm outline-none ring-0" />
                    </label>
                    <label className="text-sm">
                      <span className={softText}>Sex</span>
                      <select value={gender} onChange={(event) => setGender(event.target.value as "female" | "male")} className="mt-1 w-full rounded-lg border bg-transparent px-2 py-2 text-sm outline-none ring-0">
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                      </select>
                    </label>
                  </div>
                  <div className="mt-3 flex items-end justify-between">
                    <span className={`text-2xl font-bold ${accent}`}>{eGfr.toFixed(1)}</span>
                    <span className="text-sm text-emerald-500">CKD G{eGfr >= 90 ? "1" : eGfr >= 60 ? "2" : eGfr >= 45 ? "3a" : eGfr >= 30 ? "3b" : eGfr >= 15 ? "4" : "5"}</span>
                  </div>
                </div>

                <div className={`rounded-2xl border p-4 ${subtle}`}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium">Anion gap</span>
                    <span className={`text-xs uppercase tracking-[0.18em] ${anionGap > 12 ? "text-rose-500" : "text-emerald-500"}`}>
                      {anionGap > 12 ? "High AG" : "Normal"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <label className="text-sm">
                      <span className={softText}>Na+</span>
                      <input value={na} onChange={(event) => setNa(Number(event.target.value) || 0)} className="mt-1 w-full rounded-lg border bg-transparent px-2 py-2 text-sm outline-none ring-0" />
                    </label>
                    <label className="text-sm">
                      <span className={softText}>Cl-</span>
                      <input value={cl} onChange={(event) => setCl(Number(event.target.value) || 0)} className="mt-1 w-full rounded-lg border bg-transparent px-2 py-2 text-sm outline-none ring-0" />
                    </label>
                    <label className="text-sm">
                      <span className={softText}>HCO3-</span>
                      <input value={hco3} onChange={(event) => setHco3(Number(event.target.value) || 0)} className="mt-1 w-full rounded-lg border bg-transparent px-2 py-2 text-sm outline-none ring-0" />
                    </label>
                  </div>
                  <div className="mt-3 flex items-end justify-between">
                    <span className={`text-2xl font-bold ${anionGap > 12 ? "text-rose-500" : "text-emerald-500"}`}>{anionGap}</span>
                    <span className={`text-sm ${softText}`}>Na - (Cl + HCO3)</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className={`rounded-3xl border p-5 ${panel}`}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.2em] text-violet-500">Readiness</div>
                <h3 className="mt-2 text-2xl font-semibold">Exam analytics</h3>
              </div>
              <div className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-500">
                +12% this week
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
              <div className="flex items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-6">
                <div className="flex h-40 w-40 items-center justify-center rounded-full border-[10px] border-cyan-500/20 border-t-cyan-500 border-r-violet-500">
                  <div className="text-center">
                    <div className="text-4xl font-bold">248</div>
                    <div className={`text-xs uppercase tracking-[0.2em] ${softText}`}>Projected</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {mastery.map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className={softText}>{item.label}</span>
                      <span className="font-medium">{item.value}%</span>
                    </div>
                    <div className={`h-2.5 overflow-hidden rounded-full ${subtle}`}>
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500" style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={`rounded-3xl border p-5 ${panel}`}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.2em] text-amber-500">Study streak</div>
                <h3 className="mt-2 text-2xl font-semibold">365-day activity</h3>
              </div>
              <div className="flex items-center gap-2 text-sm text-amber-500">
                <Flame className="h-4 w-4" />
                18 days
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {heatmap.flatMap((week, weekIndex) =>
                week.map((value, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={[
                      "h-8 rounded-md border",
                      value === 0 ? "border-slate-700 bg-slate-800/50" : "",
                      value === 1 ? "bg-emerald-500/20 border-emerald-500/30" : "",
                      value === 2 ? "bg-emerald-500/35 border-emerald-500/40" : "",
                      value === 3 ? "bg-emerald-500/50 border-emerald-500/50" : "",
                      value >= 4 ? "bg-emerald-500/70 border-emerald-500/70" : "",
                    ].join(" ")}
                    title={`${value} questions on day ${weekIndex * 7 + dayIndex + 1}`}
                  />
                )),
              )}
            </div>

            <div className="mt-5 flex items-center justify-between text-sm">
              <span className={softText}>Less</span>
              <div className="flex items-center gap-2">
                {[0, 1, 2, 3, 4].map((level) => (
                  <div key={level} className={[
                    "h-2.5 w-2.5 rounded-sm",
                    level === 0 ? "bg-slate-800" : "bg-emerald-500/20",
                    level === 1 ? "bg-emerald-500/30" : "",
                    level === 2 ? "bg-emerald-500/45" : "",
                    level === 3 ? "bg-emerald-500/60" : "",
                    level === 4 ? "bg-emerald-500/80" : "",
                  ].join(" ")} />
                ))}
              </div>
              <span className={softText}>More</span>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className={`rounded-3xl border p-5 ${panel}`}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-500">Dr. Ese</div>
                <h3 className="mt-2 text-2xl font-semibold">Clinical tutor</h3>
              </div>
              <button
                type="button"
                onClick={() => setTutorMessages([{ role: "assistant", content: "Case review reset. Ask a follow-up question or trigger a board-style prompt." }])}
                className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-sm text-cyan-500"
              >
                Reset
              </button>
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
              {[
                "Summarize Diagnosis",
                "Generate 5 QBank Items",
                "Explain Differential",
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleTutorPrompt(preset)}
                  className="rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-cyan-500/60 hover:text-cyan-300"
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-700 bg-slate-900/40 p-3">
              {tutorMessages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={message.role === "assistant" ? "rounded-xl bg-cyan-500/10 p-3 text-sm leading-6 text-slate-100" : "rounded-xl bg-slate-800/80 p-3 text-sm leading-6 text-slate-200"}
                >
                  {message.content}
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <input
                value={tutorInput}
                onChange={(event) => setTutorInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleTutorPrompt();
                  }
                }}
                placeholder="Ask Dr. Ese for a diagnosis summary or a board pearl..."
                className="flex-1 rounded-xl border border-slate-700 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={() => handleTutorPrompt()}
                className="rounded-xl bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950"
              >
                Send
              </button>
            </div>
          </div>

          <div className={`rounded-3xl border p-5 ${panel}`}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-500">Quick reference</div>
                <h3 className="mt-2 text-2xl font-semibold">Clinical lab values</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLabDrawer((value) => !value)}
                className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-500"
              >
                {showLabDrawer ? "Hide" : "Open"}
              </button>
            </div>

            <div className="space-y-3">
              {labReference.slice(0, 2).map((section) => (
                <div key={section.title} className={`rounded-2xl border p-3 ${subtle}`}>
                  <div className="mb-2 font-medium">{section.title}</div>
                  <div className="space-y-1 text-sm">
                    {section.entries.map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between gap-2">
                        <span className={softText}>{label}</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {showLabDrawer && (
          <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md justify-end bg-slate-950/60">
            <div className={`h-full w-full border-l p-5 ${panel}`}>
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-xl font-semibold">Normal lab ranges</h3>
                <button type="button" onClick={() => setShowLabDrawer(false)} className="rounded-full border px-3 py-1 text-sm">
                  Close
                </button>
              </div>

              <div className="space-y-4 overflow-y-auto pb-8">
                {labReference.map((section) => (
                  <div key={section.title} className={`rounded-2xl border p-3 ${subtle}`}>
                    <div className="mb-2 font-medium">{section.title}</div>
                    <div className="space-y-2 text-sm">
                      {section.entries.map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between gap-3">
                          <span className={softText}>{label}</span>
                          <span className="font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <footer className={`mt-8 flex flex-col gap-3 rounded-2xl border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between ${panel}`}>
          <div className="flex items-center gap-2 text-cyan-500">
            <Clock3 className="h-4 w-4" />
            Daily block: 40 minutes • 18 questions • 3 calculators
          </div>
          <div className="flex items-center gap-2 text-emerald-500">
            <Trophy className="h-4 w-4" />
            Goal: 86% accuracy by end of week
          </div>
        </footer>
      </div>
    </main>
  );
}
